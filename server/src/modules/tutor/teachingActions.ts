import { z } from "zod";


/**
 * PHASE 94 — عقد «الإجراء التعليمي» (Teaching Action contract).
 *
 * لماذا يوجد هذا الملف: في المحرك السابق كان «القرار التعليمي» نصًّا توجيهيًا
 * ضمنيًّا (`teachingStrategy.turnDirective`) يُكتب داخل الـprompt، ومخرَج النموذج
 * حرّ (أجزاء نص/سؤال/تلميح/مثال). فعلًا كان المحرك يقرّر، لكن القرار لم يكن
 * عقدًا مُصنَّفًا: لا يُمكِن التحقق منه، ولا تسجيله، ولا عرضه بشكل متمايز، ولا
 * اختبار السياسة وحدها.
 *
 * هذا الملف يفصل القرار عن الصياغة — «ENGINE DECIDES — AI TEACHES»:
 *  • `decideTeachingAction(facts)` يختار **إجراءً واحدًا** حتميًا من مجموعة
 *    مسموحة محدودة، اعتمادًا على أدلّة حقيقية متاحة قبل نداء النموذج.
 *    حتميّ بالكامل: نفس المدخلات ⇒ نفس الإجراء. لا ينادِي أي نموذج.
 *  - `TeachingActionSchema` يتحقّق من شكل الإجراء وقت التشغيل (zod، مثل بقية
 *    المشروع) — فلا يمكن أن يصل إجراء غير صالح إلى الواجهة أو إلى الـprompt.
 *  - `teachingActionDirective(action)` يصوغ الإجراء إلى تعليمة عربية واحدة
 *    تُحقن في الـprompt؛ النموذج **لا يختار الإجراء**، بل يُنفّذه فقط.
 *
 * The model never generates JavaScript, HTML or free UI instructions: it can only
 * *perform* one of these typed actions, and the room knows how to render each.
 */

export const TEACHING_ACTION_TYPES = [
  /** Teach a concept for the first time (or continue teaching it). */
  "explain",
  /** Ask a short diagnostic question because the evidence is insufficient. */
  "diagnose",
  /** Nudge toward the idea without giving the direct solution. */
  "hint",
  /** Re-teach the same idea through a different visual/pedagogical approach. */
  "visual_explanation",
  /** Draw a structured, deterministic board (number line / ink annotations). */
  "interactive_board",
  /** Anchor the explanation in a specific printed textbook passage (pages). */
  "textbook_reference",
  /** Pose a real practice question that the engine will evaluate and persist. */
  "practice",
  /** Drop back to the weak prerequisite the current idea depends on. */
  "review_prerequisite",
  /** The student answered correctly / demonstrated understanding — praise + move on. */
  "celebrate_progress",
  /** Move to the next learning objective in the lesson roadmap. */
  "continue_learning",
] as const;

export type TeachingActionType = (typeof TEACHING_ACTION_TYPES)[number];

/** The only boards the room can draw. The model may not invent new ones. */
export const BOARD_KINDS = ["numberline", "ink"] as const;
export type BoardKind = (typeof BOARD_KINDS)[number];

/**
 * The typed, validated contract. Every action carries only what its type needs
 * plus two shared facts: the focus `concept` (null when unknown — never guessed)
 * and a stable machine `reason` (for tests, telemetry and the room's a11y label),
 * so an action can always be explained *why* it was chosen.
 */
export const TeachingActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("explain"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    approach: z.enum(["book_example", "simpler", "alternative", "default"]).optional(),
  }),
  z.object({
    type: z.literal("diagnose"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
  }),
  z.object({
    type: z.literal("hint"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    /** 1 = a small nudge, 2 = a stronger hint. Never the answer. */
    level: z.number().int().min(1).max(2).optional(),
  }),
  z.object({
    type: z.literal("visual_explanation"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    medium: z.enum(["text_steps", "diagram"]).optional(),
  }),
  z.object({
    type: z.literal("interactive_board"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    board: z.enum(BOARD_KINDS),
  }),
  z.object({
    type: z.literal("textbook_reference"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    /** Printed ministry-book pages to open, when the lesson has a stage. */
    pages: z.array(z.number().int().min(0)).optional(),
  }),
  z.object({
    type: z.literal("practice"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    difficulty: z.enum(["easier", "same", "harder"]).optional(),
  }),
  z.object({
    type: z.literal("review_prerequisite"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    /** The prerequisite title the student should re-see (derived from ordering). */
    prerequisite: z.string().min(1),
    /** The prerequisite's current mastery (0..1) when known, for context. */
    mastery: z.number().min(0).max(1).nullable().optional(),
  }),
  z.object({
    type: z.literal("celebrate_progress"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
  }),
  z.object({
    type: z.literal("continue_learning"),
    concept: z.string().nullable(),
    reason: z.string().min(1),
    /** The next objective in the lesson roadmap, when one exists. */
    nextConcept: z.string().nullable(),
  }),
]);

export type TeachingAction = z.infer<typeof TeachingActionSchema>;

/** Runtime validation for a decision built elsewhere or transported over the wire. */
export function parseTeachingAction(raw: unknown): TeachingAction | null {
  const result = TeachingActionSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/**
 * Everything the policy is allowed to look at. Every field is *evidence already
 * known before the model is called*; nothing here is invented. A field that is
 * unknown is `null`/`false`, and the policy degrades honestly instead of guessing.
 */
export interface TeachingDecisionFacts {
  intent: import("./intentClassifier.js").TutorIntent;
  /** This turn is the student's answer to the tutor's pending question. */
  isAnswerTurn: boolean;
  /**
   * How the student's last answer was graded: true/false when a real evaluator
   * produced a verdict, `null` when there is no verdict yet (insufficient
   * evidence — never assume mastery).
   */
  lastAnswerCorrect: boolean | null;
  /** The student said «مش فاهم» or asked for a different explanation. */
  studentConfused: boolean;
  /** The current idea was already explained earlier in this session. */
  alreadyExplained: boolean;
  /** The question is about ordering/comparing/placing numbers (a line helps). */
  numericOrdering: boolean;
  /** The lesson has printed ministry-book pages (textbook grounding is possible). */
  hasBookPages: boolean;
  /** The student drew on the printed page (ink annotation is the question). */
  hasInk: boolean;
  /** The turn carries a photo or a document. */
  hasAttachment: boolean;
  /** The turn has no typed question (an attachment-only turn). */
  questionEmpty: boolean;
  /** The weak prerequisite of the current idea, derived from the curriculum order. */
  prerequisite: { title: string; mastery: number | null } | null;
  /** The next objective in the lesson roadmap, when one exists. */
  nextConcept: string | null;
  /** The idea currently in focus, or null when unknown. */
  concept: string | null;
}

/** Mastery below this counts as "weak" for prerequisite review. */
export const PREREQUISITE_WEAK_MASTERY = 0.5;

/**
 * The deterministic policy. It returns exactly one action and never calls a
 * model. Order matters and is the contract; each branch documents *why*.
 *
 * The engine decides — the AI teaches.
 */
export function decideTeachingAction(facts: TeachingDecisionFacts): TeachingAction {
  const concept = facts.concept;

  // 0) An attachment-only turn has no typed question: the picture/marks *are*
  //    the question, so the teacher reads them and explains what they point at.
  if (facts.questionEmpty && facts.hasAttachment) {
    return { type: "explain", concept, reason: facts.hasInk ? "ink_question" : "attachment_question" };
  }

  // 1) The student is answering the tutor's pending question. The verdict (when
  //    a real evaluator produced one) drives the reaction.
  if (facts.isAnswerTurn) {
    if (facts.lastAnswerCorrect === true) {
      // They got it: do not re-teach it, do not test it again — praise and move on.
      return { type: "celebrate_progress", concept, reason: "answer_correct" };
    }
    if (facts.lastAnswerCorrect === false) {
      // Wrong answer: if the idea rests on a *known-weak* prerequisite, that gap
      // is the cause — rebuild the foundation first. Otherwise nudge, don't
      // solve. An untracked prerequisite (mastery null) is not evidence of
      // weakness, so it never triggers this by itself.
      if (facts.prerequisite && facts.prerequisite.mastery !== null && facts.prerequisite.mastery < PREREQUISITE_WEAK_MASTERY) {
        return {
          type: "review_prerequisite",
          concept,
          reason: "answer_wrong_prerequisite",
          prerequisite: facts.prerequisite.title,
          mastery: facts.prerequisite.mastery,
        };
      }
      return { type: "hint", concept, reason: "answer_wrong", level: 1 };
    }
    // No verdict yet: evaluate and teach, do not assert success or failure.
    return { type: "explain", concept, reason: "answer_unverified" };
  }

  // 2) The student is confused. If the idea was already explained, repeating it
  //    verbatim is the failure mode this whole design removes: choose a
  //    meaningfully different approach instead. And when the confusion is caused
  //    by a *known-weak prerequisite* (the foundation the current idea stands on),
  //    rebuild that foundation first instead of re-teaching the same idea louder.
  if (facts.studentConfused) {
    if (facts.prerequisite && facts.prerequisite.mastery !== null && facts.prerequisite.mastery < PREREQUISITE_WEAK_MASTERY) {
      return {
        type: "review_prerequisite",
        concept,
        reason: "confused_weak_prerequisite",
        prerequisite: facts.prerequisite.title,
        mastery: facts.prerequisite.mastery,
      };
    }
    if (facts.alreadyExplained) return { type: "visual_explanation", concept, reason: "confused_retry" };
    return { type: "explain", concept, reason: "confused_first_time", approach: "simpler" };
  }

  // 3) Numeric ordering/comparison questions are the one case where a real
  //    deterministic board beats prose — the NumberLine widget the room draws.
  if (facts.numericOrdering && (facts.intent === "explanation" || facts.intent === "exercise")) {
    return { type: "interactive_board", concept, reason: "numeric_ordering", board: "numberline" };
  }

  switch (facts.intent) {
    case "exercise":
      // A real practice question the engine will evaluate and persist.
      return { type: "practice", concept, reason: "exercise_request" };
    case "hint_request":
      return { type: "hint", concept, reason: "hint_request", level: 1 };
    case "check_understanding":
      // They understood: move forward if there is a next idea; otherwise deepen
      // rather than loop ("ثبّت الفهم بما هو أعمق").
      return facts.nextConcept
        ? { type: "continue_learning", concept, reason: "understood_advance", nextConcept: facts.nextConcept }
        : { type: "practice", concept, reason: "understood_deepen" };
    case "explanation":
      // Ground a first explanation in the printed book's own example; a repeat
      // explanation goes to plain `explain` (the room already showed the page).
      return facts.hasBookPages && !facts.alreadyExplained
        ? { type: "textbook_reference", concept, reason: "explain_from_book" }
        : { type: "explain", concept, reason: "explanation_request" };
    case "motivation":
      // A greeting / session start: teach the first idea, don't chat.
      return { type: "explain", concept, reason: "start_teaching" };
    case "off_topic":
      return { type: "explain", concept, reason: "redirect_to_lesson" };
    default:
      // `answer` with no pending question, or any unhandled intent: teach.
      return { type: "explain", concept, reason: "default_teach" };
  }
}

/** Cheap, deterministic detection for questions a number line actually helps. */
export function looksLikeNumericOrdering(text: string): boolean {
  const t = text.trim();
  if (t.length === 0) return false;
  return /(خط\s*الأعداد|خط\s*الاعداد|خط\s*العدد|ترتيب|رتّب|رتب|قارن|مقارنة|أكبر\s*من|اصغر\s*من|أصغر\s*من|أكبر\s*من|يقع|العدد\s*العشري|الكسور|كسر|نسبة|number\s*line|order(ing)?|compare|place\s+the|fraction)/i.test(
    t,
  );
}

/**
 * Turn a decided action into the single Arabic instruction injected into the
 * prompt. The model does not choose the action; it performs this one. Returns ""
 * for actions whose ask line already names the task (kept empty on purpose).
 */
export function teachingActionDirective(action: TeachingAction): string {
  switch (action.type) {
    case "explain":
      switch (action.approach) {
        case "simpler":
          return "- مهمة هذا الدور: **اشرح الفكرة بأبسط مدخل ممكن** — ابدأ من أصغر خطوة، بمثال محسوس من حياة الطالب، وتوقّف عند أول ما يفهمه. لا تبدأ من العنوان العام.";
        case "alternative":
          return "- مهمة هذا الدور: **أعد تعليم الفكرة بأسلوب مختلف تمامًا** عن الشرح السابق (مثال آخر، تمثيل بصري مكتوب، خطوات أبطأ) — لا تكرّر الشرح نفسه.";
        case "book_example":
          return "- مهمة هذا الدور: اشرح الفكرة انطلاقًا من **المثال المحلول في كتاب الوزارة** المرفق، وبيّن كيف نقرأه خطوةً خطوة، واذكر رقم صفحته.";
        default:
          return "- مهمة هذا الدور: **علّم الفكرة** — اشرح بلغة الطالب، والعمل على مثال/نصّ كتاب الوزارة المرفق، ثم توقّف عند حدٍّ طبيعي (خطوة واحدة).";
      }
    case "diagnose":
      return "- مهمة هذا الدور: طرح **سؤال تشخيصي قصير واحد** فقط لمعرفة ما يعرفه الطالب فعلًا قبل الشرح — لا تشرح بعد، وانتظر جوابه.";
    case "hint":
      return `- مهمة هذا الدور: قدّم **تلميحًا واحدًا**${
        (action.level ?? 1) >= 2 ? " أقوى قليلًا" : ""
      } يقرّبه من الفكرة، واترك له الخطوة الحاسمة — لا تعطِ الحل مباشرة.`;
    case "visual_explanation":
      return "- مهمة هذا الدور: **أعد تعليم الفكرة بتمثيل بصري مكتوب** (خطوات مرقّمة، أو جدول/رسم نصّي بسيط) وأسلوب مختلف عن الشرح السابق — الطالب لم يفهم من المرة الأولى.";
    case "interactive_board":
      return action.board === "numberline"
        ? "- مهمة هذا الدور: **ارسم خط أعداد واحدًا** (عنصر widget) يخدم الفكرة (ترتيب/مقارنة/تمثيل)، واطلب من الطالب تحريك الدبوس ثم التحقق — واشرح الفكرة من الخط."
        : "- مهمة هذا الدور: اقرأ **علامات الطالب على صفحة الكتاب** المرفقة وأجب عن الموضع الذي تشير إليه مباشرة، ثم اربطه بالفكرة.";
    case "textbook_reference":
      return "- مهمة هذا الدور: ابنِ الشرح على **نصّ/مثال كتاب الوزارة المرفق تحديدًا**، واذكر رقم الصفحة التي تشرح منها، وبيّن كيف نستخرج المعنى من الكتاب.";
    case "practice":
      return "- مهمة هذا الدور: اعرض **مسألة/تمرينًا حقيقيًا** من أسئلة الكتاب المطبوعة (بنفس أرقامها وصفحتها)، واترك الطالب يحلّها — لا تعطِ الحل في نفس الرد.";
    case "review_prerequisite":
      return `- مهمة هذا الدور: الطالب متعثّر في الفكرة لأن أساسها أضعف. ارجع أولًا إلى **«${action.prerequisite}»**، علّمه بخطوة صغيرة، ثم اربطه بالفكرة الحالية — لا تتقدّم قبل أن يثبت الأساس.`;
    case "celebrate_progress":
      return "- مهمة هذا الدور: **امدح الطالب بإيجاز** لأنه أصاب، ثم علّمه **الفكرة التالية فعلًا** — لا تُعِد شرح ما فهمه ولا تختبره فيه مرة أخرى.";
    case "continue_learning":
      return action.nextConcept
        ? `- مهمة هذا الدور: انتقل إلى الفكرة التالية **«${action.nextConcept}»** وعلّمها بخطوة واحدة — الطالب أظهر أنه فهم الفكرة السابقة.`
        : "- مهمة هذا الدور: ثبّت الفهم بما هو أعمق (تطبيق أو سؤال تفكير) — لا تُكرّر الشرح السابق.";
  }
}
