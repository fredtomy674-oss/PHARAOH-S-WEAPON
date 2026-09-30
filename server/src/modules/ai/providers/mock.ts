import { cyrb128, sha256Hex } from "../../../utils/ids.js";
import { readReplyLanguageTag, type TutorLanguage } from "../../tutor/language.js";
import type { DocumentInput, EmbeddingProvider, EmbeddingResponse, LLMProvider, LLMResponse, LLMRequest, OcrProvider, OcrRequest, OcrResponse } from "../types.js";

const MOCK_DIM = 64;

function hashVector(str: string, dim = MOCK_DIM): number[] {
  const v = new Array<number>(dim).fill(0);
  const tokens = str.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0);
  for (const token of tokens) {
    const [a, b, c, d] = cyrb128(token);
    const idx = Math.abs(a ^ (b << 5)) % dim;
    const sign = (c & 1) === 0 ? 1 : -1;
    v[idx]! += sign * (0.5 + (d % 1000) / 2000);
  }
  // Normalize.
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => x / norm);
}

/**
 * Deterministic offline embedding provider: term-overlap hashing.
 * Good enough for the RAG pipeline on dev/test; real semantic embeddings
 * come from the `gemini` provider in production.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly id = "mock";

  async embed(request: { texts: string[]; model?: string }): Promise<EmbeddingResponse> {
    return {
      vectors: request.texts.map((t) => hashVector(t)),
      model: "mock-hash-64",
      dims: MOCK_DIM,
    };
  }
}

/**
 * Deterministic offline LLM provider. Produces pedagogically-shaped,
 * curriculum-grounded replies so the whole vertical slice works with zero
 * keys. Also honors `json` requests with a structured JSON reply.
 */
export class MockLLMProvider implements LLMProvider {
  readonly id = "mock";

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const started = Date.now();

    const system = request.messages.find((m) => m.role === "system")?.content ?? "";
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const images = request.images ?? [];
    const documents = request.documents ?? [];

    // Extract the REAL context block (curriculum content) if present, similar to
    // what the real provider receives. The system rules contain a literal
    // "<context>" in prose BEFORE the actual block, so the last open tag in the
    // system message is the real one — a first-match regex would capture the
    // whole middle of the prompt instead of the curriculum content.
    const context = extractContextBlock(system);
    // PHASE 38/D-042 — the tutor answers in the curriculum's own language; the
    // prompt builder states it as a <reply_language> tag, and the mock honors it
    // so the behaviour is observable with zero keys (a real provider follows
    // the same instruction).
    const language = readReplyLanguageTag(system);

    // PHASE 29 — session recap: the mock only ever sees the metadata block
    // (lesson/concept titles + counters) and emits a deterministic structured
    // recap from it — no verbatim content by construction.
    if (request.operation === "recap") {
      const block = extractMetadataBlock(request);
      const content = JSON.stringify(buildMockRecap(block));
      return {
        content,
        model: "mock-recap",
        inputTokens: estimateTokens(system + lastUser),
        outputTokens: estimateTokens(content),
        latencyMs: Date.now() - started,
      };
    }

    // PHASE 28 + 30 — question generation: the mock must emit a structured
    // JSON (MCQ or open, chosen by the «النوع: mcq|open» marker the prompt
    // builder places in the user turn) grounded in the lesson context (never
    // invented facts). The generator service turns this into a stored row;
    // here we only produce the AI-shaped reply, deterministically.
    if (request.operation === "question_gen") {
      const conceptMatch = /المفهوم: «([^»]+)»/.exec(lastUser);
      const conceptTitle = conceptMatch?.[1] ?? null;
      const kindMatch = /النوع:\s*(mcq|open)/.exec(lastUser);
      const kind = kindMatch?.[1] === "open" ? "open" : "mcq";
      const content =
        kind === "open"
          ? JSON.stringify(buildMockOpenQuestion(context, conceptTitle))
          : JSON.stringify(buildMockQuestion(context, conceptTitle));
      return {
        content,
        model: kind === "open" ? "mock-question-open" : "mock-question",
        inputTokens: estimateTokens(system + lastUser),
        outputTokens: estimateTokens(content),
        latencyMs: Date.now() - started,
      };
    }

    // PHASE 30 — open-answer grading: the mock grades deterministically by
    // token coverage against the reference (a dev stand-in for the LLM's
    // semantic judgment). It only ever sees the reference block in the system
    // message and the student's answer block in the user turn, and its fixed
    // feedback templates never echo the reference answer.
    if (request.operation === "grade_open") {
      const reference = extractBlock(system, "reference");
      const studentAnswer = extractBlock(lastUser, "student_answer");
      const content = JSON.stringify(buildMockGrade(reference, studentAnswer));
      return {
        content,
        model: "mock-grade",
        inputTokens: estimateTokens(system + lastUser),
        outputTokens: estimateTokens(content),
        latencyMs: Date.now() - started,
      };
    }

    if (request.json) {
      const tutorText = buildTutorText({ user: lastUser, context, images, documents, language });
      // PHASE 51 — the offline tutor draws a number line on demand (the E2E and
      // API suites exercise the whole widget loop with zero keys): asking for
      // «خط الأعداد» gets a real line with a hidden key, and a turn carrying a
      // <widget> block gets a verdict computed from the pin against that key.
      const widgetParts = buildMockWidgetParts(lastUser);
      // PHASE 53 — mirror hook (see MIRROR_TEST_TRIGGER): a JSON envelope with
      // an echo inside, until the engine's nudge arrives — then a clean reply.
      const nudged = request.messages.some((m) => m.content.includes("أجب الآن مباشرة"));
      const mirror = lastUser.includes(MIRROR_TEST_TRIGGER) && !nudged;
      const text = mirror ? MIRROR_TEST_ECHO : tutorText;
      const content = JSON.stringify({
        content: text,
        tone: "friendly",
        parts: mirror ? [{ type: "text", text }] : [{ type: "text", text: tutorText }, ...widgetParts],
        assessment: { conceptsTouched: [], confidence: 0.5 },
      });
      return { content, model: "mock-tutor", inputTokens: estimateTokens(system + lastUser), outputTokens: estimateTokens(content), latencyMs: Date.now() - started };
    }

    const body = buildTutorText({ user: lastUser, context, images, documents, language });
    return { content: body, model: "mock-tutor", inputTokens: estimateTokens(system + lastUser), outputTokens: estimateTokens(body), latencyMs: Date.now() - started };
  }

  /**
   * PHASE 49 — the same reply, handed over in slices.
   *
   * The mock exists so the whole product can run with zero keys, and a provider
   * that can only answer "all at once" would leave the live reply path untested
   * everywhere it actually runs. So the offline tutor also dribbles: the output
   * is cut like a real token stream (never mid-UTF-16, so a cut can never split
   * an Arabic letter) and the slices are separated by a tick, which is what makes
   * the client's incremental rendering observable in an end-to-end test.
   */
  async stream(request: LLMRequest, onDelta: (text: string) => void | Promise<void>): Promise<LLMResponse> {
    const response = await this.complete(request);
    for (const piece of sliceLikeTokens(response.content)) {
      await onDelta(piece);
      await new Promise((resolve) => setTimeout(resolve, MOCK_STREAM_TICK_MS));
    }
    return response;
  }
}

/** How long a real provider's next token takes; also the mock's slice gap. */
const MOCK_STREAM_TICK_MS = 5;

/**
 * Cuts a reply into token-sized pieces, never inside a surrogate pair.
 *
 * A cut in the middle of an Arabic letter (a two-unit code point) would make the
 * room render a replacement glyph for one frame — the kind of artefact that
 * looks like a rendering bug and is really a slicing bug.
 */
function sliceLikeTokens(text: string, size = 12): string[] {
  const pieces: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    let end = Math.min(i + size, text.length);
    // Pull the whole code point into this piece.
    if (end < text.length) {
      const code = text.charCodeAt(end - 1);
      if (code >= 0xd800 && code <= 0xdbff) end += 1;
    }
    pieces.push(text.slice(i, end));
  }
  return pieces;
}

/** Stable marker the tutor reply contains when an image was attached (used by tests/E2E). */
export const IMAGE_READ_MARKER = "قرأت الصورة المرفقة";

/** Stable marker the tutor reply contains when a document was attached (used by tests/E2E). */
export const DOCUMENT_READ_MARKER = "قرأت الملف المرفق";

/** PHASE 38/D-042 — English counterparts, used when the curriculum teaches a language. */
export const IMAGE_READ_MARKER_EN = "I read the attached image";
export const DOCUMENT_READ_MARKER_EN = "I read the attached file";

/** Stable marker proving the reply came back in the curriculum's own language. */
export const ENGLISH_REPLY_MARKER = "I will explain this lesson in English";

/** How many leading characters of the extracted document text are echoed into the mock reply. */
const DOC_SNIPPET_CHARS = 60;

/**
 * Pulls the curriculum `<context>` block out of a system prompt.
 *
 * The prompt is prose *around* tagged blocks, and the fixed rules legitimately
 * mention tag names in sentences. So "the last `<context>`" is not enough: a
 * rule that mentions the tag after the real block would be read as the block
 * (observed live in PHASE 48 — the offline tutor then claimed it had no lesson
 * content while the block sat right there in the prompt). What identifies the
 * block is a *matched pair*, so we walk every open tag and take the last one
 * that actually has a closing tag after it.
 *
 * The "no retrieval" placeholder is treated as an empty context.
 */
function extractContextBlock(system: string): string {
  const open = "<context>";
  const close = "</context>";
  let found = -1;
  for (let at = system.indexOf(open); at >= 0; at = system.indexOf(open, at + open.length)) {
    const end = system.indexOf(close, at + open.length);
    if (end < 0) continue;
    found = at;
    // A matched pair, and nothing opens again before its own closing tag.
    const nested = system.indexOf(open, at + open.length);
    if (nested < 0 || nested > end) break;
  }
  if (found < 0) return "";
  const end = system.indexOf(close, found + open.length);
  const ctx = system.slice(found + open.length, end).trim();
  return ctx === "(لا يوجد محتوى مسترجع لهذا السؤال)" ? "" : ctx;
}

/** Pulls the LAST `<tag>…</tag>` block out of a message turn (grade_open). */
function extractBlock(haystack: string, tag: string): string {
  const open = haystack.lastIndexOf(`<${tag}>`);
  if (open < 0) return "";
  const close = haystack.indexOf(`</${tag}>`, open + tag.length + 2);
  if (close < 0) return "";
  return haystack.slice(open + tag.length + 2, close).trim();
}

/**
 * PHASE 28 — deterministic offline MCQ generator. Splits the lesson context
 * into stable fact sentences, picks one as the correct answer (verbatim, so
 * grading is unambiguous), and derives 3 distractors deterministically from
 * the same text. Same input → same output, so cache hits and repeated
 * generation stay byte-identical.
 */
export interface MockQuestionJson {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTION_FILLER_1 = "هذه العبارة لا وردت في محتوى الدرس إطلاقًا.";
const QUESTION_FILLER_2 = "لا يمكن استنتاج هذه العبارة من محتوى الدرس.";
const QUESTION_FILLER_3 = "عبارة من موضوع رياضي آخر لا يتصل بهذا الدرس.";

/**
 * Stable facts inside a context block: sentences (split on terminator
 * punctuation) with a meaningful length, excluding the pedagogical "لا يوجد /
 * غير موجود" negation used as a tripwire ("غير موجود" must never become the
 * question's answer).
 */
function splitFacts(context: string): string[] {
  return (context.split(/[.!؟؛\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && !s.includes("غير موجود")));
}

export function buildMockQuestion(context: string, conceptTitle: string | null): MockQuestionJson {
  const facts = splitFacts(context);

  const seed = cyrb128(context);
  const h = Math.abs(seed[0]! ^ (seed[1]! << 4)) || 7;

  let correct: string;
  let other: string;
  if (facts.length > 0) {
    correct = facts[h % facts.length]!;
    if (facts.length > 1) {
      other = facts[(h + 1 + (h >> 3)) % facts.length]!;
      if (other === correct) other = facts[(h + 2) % facts.length]!;
    } else {
      other = QUESTION_FILLER_1;
    }
  } else {
    correct = (context.trim() || "المحتوى المسترجع لهذا الدرس").slice(0, 200);
    other = QUESTION_FILLER_1;
  }

  const mutated = mutateFact(correct);
  const options = [correct, other, mutated ?? QUESTION_FILLER_2, QUESTION_FILLER_3];
  const unique = [...new Set(options)];
  for (const filler of [QUESTION_FILLER_1, QUESTION_FILLER_2, QUESTION_FILLER_3, "خيار غير وارد في الدرس."]) {
    if (unique.length >= 4) break;
    if (!unique.includes(filler)) unique.push(filler);
  }

  // Deterministic rotation keeps the same 4 options but a stable order.
  const k = h % unique.length;
  const rotated = unique.map((_, i) => unique[(i + k) % unique.length]!);
  const correctIndex = (unique.indexOf(correct) - k + unique.length) % unique.length;

  return {
    content: conceptTitle
      ? `حسب درسنا عن «${conceptTitle}»، أي العبارات التالية وردت في الدرس؟`
      : "أي العبارات التالية وردت في الدرس؟",
    options: rotated,
    correctIndex,
    explanation: `العبارة الصحيحة وردت حرفيًا في درسنا: «${correct}». أما الخيارات الأخرى فإمّا من خارج الدرس أو بصيغة تغيّر المعنى.`,
  };
}

/**
 * PHASE 30 — deterministic offline OPEN-question generator. Same fact-picking
 * seed family as the MCQ builder (`open:` prefix keeps the pick distinct): the
 * model answer is a fact taken verbatim from the lesson, and the question asks
 * the student to write that fact down. The stored explanation never quotes the
 * model answer — the free-text answer is the deliverable, so the key stays
 * server-side.
 */
export interface MockOpenQuestionJson {
  content: string;
  answerKey: string;
  explanation: string;
}

export function buildMockOpenQuestion(context: string, conceptTitle: string | null): MockOpenQuestionJson {
  const facts = splitFacts(context);
  const seed = cyrb128(`open:${context}`);
  const h = Math.abs(seed[0]! ^ (seed[1]! << 4)) || 7;
  const answerKey =
    facts.length > 0
      ? facts[h % facts.length]!
      : (context.trim() || "المحتوى المسترجع لهذا الدرس").slice(0, 200);
  return {
    content: conceptTitle
      ? `اكتب بجملة قصيرة حقيقةً واحدة وردت حرفيًا في درسنا عن «${conceptTitle}».`
      : "اكتب بجملة قصيرة حقيقةً واحدة وردت حرفيًا في درسنا.",
    answerKey,
    explanation: "التقطت هذه الإجابة المستخرجة من محتوى الدرس حرفيًا؛ قارن جملتك بها لتقيس دقة إجابتك.",
  };
}

/** Change the first digit of a fact (e.g. "487 + 358" → "587 + 358") for a plausible wrong answer. */
function mutateFact(fact: string): string | null {
  const m = /(\d)/.exec(fact);
  if (!m) return null;
  const next = String((Number(m[1]) + 1) % 10);
  return fact.slice(0, m.index) + next + fact.slice(m.index + 1);
}

/**
 * PHASE 29 — pulls the recap `<metadata>` block out of the request messages
 * (the service places it last in the user turn). Metadata only: lesson/concept
 * titles + counters, never message content.
 */
function extractMetadataBlock(request: LLMRequest): string {
  const haystack = request.messages.map((m) => m.content).join("\n");
  const open = haystack.lastIndexOf("<metadata>");
  if (open < 0) return "";
  const close = haystack.indexOf("</metadata>", open + "<metadata>".length);
  if (close < 0) return "";
  return haystack.slice(open + "<metadata>".length, close).trim();
}

/** PHASE 29 — deterministic offline recap: template lines selected by the metadata counters. */
export interface MockRecapJson {
  headline: string;
  focus: string;
  strengths: string[];
  suggestions: string[];
}

export function buildMockRecap(block: string): MockRecapJson {
  const line = (key: string): string => {
    const m = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(block);
    return m?.[1]?.trim() ?? "";
  };
  const num = (key: string): number => {
    const value = Number(line(key));
    return Number.isFinite(value) ? value : 0;
  };

  const lesson = line("Lesson").replace(/^«|»$/g, "").trim() || "موضوع الدرس";
  const userMessages = num("UserMessages");
  const tutorMessages = num("TutorMessages");
  const durationMinutes = num("DurationMinutes");
  const attachments = num("Attachments");
  const safetyFlagged = num("SafetyFlagged");

  const strengths: string[] = [];
  if (userMessages >= 3) strengths.push("تفاعل نشط — طرحت أكثر من سؤال وتابعت الشرح.");
  if (userMessages >= 1) strengths.push("بدأت الجلسة بسؤال وتفاعلت مع الشرح.");
  if (attachments >= 1) strengths.push("أرفقت ملفًا أو صورة وسألت عنها مباشرة.");
  if (safetyFlagged === 0 && userMessages >= 1) strengths.push("التزمت بأسلوب الجلسة الآمن.");
  if (strengths.length === 0) strengths.push("بداية الجلسة خطوة جيدة — واصل المسير.");

  const suggestions: string[] = [];
  if (durationMinutes < 5) suggestions.push("أعطِ الجلسة مدة أطول في المرة القادمة لنشرح بتعمق أكبر.");
  if (safetyFlagged > 0) suggestions.push("التزم بموضوع الدرس — أي محاولة لتجاوز قواعد الجلسة تُرفض بأمان.");
  suggestions.push("أعد قراءة الدرس ثم جرّب التمارين لتثبيت الفهم.");

  return {
    headline: `جلسة تعلّم حول «${lesson}» — ركّزنا فيها على الشرح والتفاعل خطوة بخطوة.`,
    focus: `محور الجلسة: ${lesson}، بتفاعل ${userMessages} رسالة منك و${tutorMessages} ردّ من المدرّس.`,
    strengths,
    suggestions,
  };
}

/**
 * PHASE 30 — deterministic offline open-answer grader. Token coverage of the
 * student's answer against the hidden reference (mirror of the coverage metric
 * in practice/grade.ts — providers stay self-contained). Fixed feedback
 * templates by band; none of them can ever echo the reference answer.
 */
export interface MockGradeJson {
  correct: boolean;
  score: number;
  feedback: string;
}

const GRADE_FEEDBACK_GOOD = "إجابة موفقة! فهمت الفكرة وأحسنت التعبير عن الحل.";
const GRADE_FEEDBACK_NEAR = "إجابة قريبة — خطواتك تقترب من الحل لكن ينقصها بعض التفاصيل حول هذا المفهوم. أعد قراءة الشرح ثم حاول مجددًا.";
const GRADE_FEEDBACK_WEAK = "إجابة غير دقيقة هذه المرة — أعد قراءة المثال المحلول في الدرس ثم حاول مجددًا بخطوات كاملة.";

export function buildMockGrade(reference: string, studentAnswer: string): MockGradeJson {
  const score = mockCoverage(reference, studentAnswer);
  const correct = score >= 0.7;
  const feedback = correct ? GRADE_FEEDBACK_GOOD : score >= 0.4 ? GRADE_FEEDBACK_NEAR : GRADE_FEEDBACK_WEAK;
  return { correct, score: Math.round(score * 100) / 100, feedback };
}

/** Mirror of `normalizeArabic` in practice/grade.ts (deterministic Arabic comparison). */
function mockNormalize(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mockCoverage(reference: string, answer: string): number {
  const refTokens = mockNormalize(reference).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0);
  if (refTokens.length === 0) return 0;
  const answerTokens = new Set(mockNormalize(answer).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0));
  const covered = refTokens.filter((t) => answerTokens.has(t)).length;
  return covered / refTokens.length;
}

function buildTutorText(args: {
  user: string;
  context: string;
  images?: { mimeType: string; base64: string }[];
  documents?: DocumentInput[];
  language?: TutorLanguage;
}): string {
  return args.language === "en" ? buildTutorTextEn(args) : buildTutorTextAr(args);
}

function buildTutorTextAr(args: {
  user: string;
  context: string;
  images?: { mimeType: string; base64: string }[];
  documents?: DocumentInput[];
}): string {
  const { user, context, images = [], documents = [] } = args;
  // PHASE 51 — a pin-verification turn: the <widget> block carries the snapped
  // pin and (for the tutor's eyes only) the key, so the verdict is computed
  // from numbers, not guessed from words.
  if (user.includes("<widget>")) return mockWidgetVerdict(user);
  const contextNote = context
    ? `\n\nوفقًا لمحتوى الدرس: ${context.slice(0, 900)}`
    : "\n\nلم أستطع الوصول لمحتوى الدرس في الوقت الحالي؛ راجع المدرس المباشر.";
  const imageNote = images.length > 0
    ? `📸 ${IMAGE_READ_MARKER} (${images.length}) — سأشرح حلها اعتمادًا على درسنا خطوة بخطوة.`
    : "";
  const doc = documents[0];
  const docNote = doc
    ? `📄 ${DOCUMENT_READ_MARKER} «${doc.fileName ?? "بدون اسم"}» — قرأته وسأشرح سؤالك اعتمادًا عليه وعلى الدرس. أهم ما ورد فيه: "${doc.text.slice(0, DOC_SNIPPET_CHARS)}".`
    : "";
  const parts: string[] = [];
  if (imageNote) parts.push(imageNote);
  if (docNote) parts.push(docNote);
  if (/سؤال|مثال|تمرين|حل/.test(user)) {
    parts.push("هيا نبدأ خطوة بخطوة. أعتقد أنك تقصد جزءًا من الدرس الحالي.");
  }
  parts.push(`سؤال جيد! هذا من موضوع درسنا. سأشرحه بطريقة مبسطة:${contextNote}`);
  // PHASE 53 — the offline reply exercises the room's formatter like a real
  // one: bold plus a real list (textContent is unchanged by markup, so every
  // text assertion still holds).
  parts.push("💡 **تلميح:**\n- فكّر في المثال الأول في الدرس\n- أخبرني بما توصلت إليه");
  parts.push("هل تريد أن أشرح مرة أخرى بطريقة مختلفة، أم ننتقل لسؤال للتأكد من الفهم؟");
  return parts.join("\n\n");
}

/** Stable marker the tutor reply contains when the pin lands exactly on the key. */
export const WIDGET_PIN_OK_MARKER = "الدبوس في مكانه الصحيح";

/** Stable marker the tutor reply contains when the pin must move right. */
export const WIDGET_PIN_RIGHT_MARKER = "حرّك الدبوس إلى اليمين قليلًا";

/** Stable marker the tutor reply contains when the pin must move left. */
export const WIDGET_PIN_LEFT_MARKER = "حرّك الدبوس إلى اليسار قليلًا";

/**
 * PHASE 53 — test hook: asking for «مرآة الاختبار» makes the offline tutor
 * mirror once (a JSON envelope whose inner content is a bullet-list echo),
 * then answer cleanly once the engine's nudge arrives. Exercises the real
 * regen path — dual echo check plus fallback-model walk — with zero keys.
 */
export const MIRROR_TEST_TRIGGER = "مرآة الاختبار";
const MIRROR_TEST_ECHO =
  "* Role: 6th-grade math teacher.\n* Task: Mirror this prompt instead of tutoring.";

/**
 * PHASE 51 — the offline verdict on a placed pin. Reads the same <widget>
 * block the real tutor reads (pin value + teacher's key) and answers exactly
 * the way the prompt rule requires: praise on a hit, direction-only on a miss
 * — the key is never quoted back.
 */
function mockWidgetVerdict(user: string): string {
  const pinMatch = /وضع الطالب الدبوس عند:\s*(-?[\d.]+)/.exec(user);
  const keyMatch = /الموضع الصحيح[^:]*:\s*(-?[\d.]+)/.exec(user);
  const pin = pinMatch ? Number(pinMatch[1]) : NaN;
  const key = keyMatch ? Number(keyMatch[1]) : NaN;
  if (!Number.isFinite(pin)) return "لم أتبين موضع الدبوس — حرّكه على الخط ثم اضغط تحقق من جديد.";
  if (!Number.isFinite(key)) return `وضع الدبوس عند ${pin} — موضع جيد للبدء! أخبرني: هل هو قبل العدد الذي تفكر فيه أم بعده؟`;
  if (Math.abs(pin - key) < 1e-9) return `🎯 ${WIDGET_PIN_OK_MARKER}! ممتاز يا بطل — حددت الموضع بدقة. هل ننتقل إلى تحدٍّ جديد؟`;
  return pin < key
    ? `محاولة جيدة! ${WIDGET_PIN_RIGHT_MARKER} ثم تحقق مرة أخرى.`
    : `محاولة جيدة! ${WIDGET_PIN_LEFT_MARKER} ثم تحقق مرة أخرى.`;
}

/**
 * PHASE 51 — the offline tutor draws a number line on demand. Asking for
 * «خط الأعداد» gets a real line (0..10, key at 7) so the whole loop —
 * draw → drag → verify — runs with zero keys.
 */
function buildMockWidgetParts(user: string): Array<{ type: "widget"; text: string; widget: unknown }> {
  if (user.includes("<widget>")) return [];
  if (!/خط\s*الأعداد|خط\s*اعداد/.test(user)) return [];
  return [
    {
      type: "widget",
      text: "رسمت لك خط أعداد من 0 إلى 10 — أين يقع العدد 7؟ حرّك الدبوس ثم اضغط تحقق.",
      widget: {
        kind: "numberline",
        from: 0,
        to: 10,
        step: 1,
        markers: [{ value: 0, label: "البداية" }],
        question: "أين يقع العدد 7؟ حرّك الدبوس ثم اضغط تحقق.",
        answer: 7,
      },
    },
  ];
}

/**
 * PHASE 38/D-042 — the same reply shape, written in the language the lesson
 * teaches. Structure (grounded context → hint → check question) is identical,
 * so the pedagogy does not change with the language.
 */
function buildTutorTextEn(args: {
  user: string;
  context: string;
  images?: { mimeType: string; base64: string }[];
  documents?: DocumentInput[];
}): string {
  const { context, images = [], documents = [] } = args;
  const contextNote = context
    ? `\n\nAccording to the lesson content: ${context.slice(0, 900)}`
    : "\n\nI could not reach the lesson content right now; please check with your teacher.";
  const imageNote = images.length > 0
    ? `📸 ${IMAGE_READ_MARKER_EN} (${images.length}) — I will explain it step by step using our lesson.`
    : "";
  const doc = documents[0];
  const docNote = doc
    ? `📄 ${DOCUMENT_READ_MARKER_EN} "${doc.fileName ?? "no name"}" — I will use it together with the lesson to answer you. The most important part: "${doc.text.slice(0, DOC_SNIPPET_CHARS)}".`
    : "";
  const parts: string[] = [];
  if (imageNote) parts.push(imageNote);
  if (docNote) parts.push(docNote);
  parts.push(`${ENGLISH_REPLY_MARKER}, simply and clearly.`);
  parts.push(`Great question! It belongs to our lesson. Here it is:${contextNote}`);
  parts.push("💡 **Hint:**\n- Try the first example in the lesson\n- Tell me what you got");
  parts.push("Would you like me to explain it again in a different way, or shall we try a quick question to check understanding?");
  return parts.join("\n\n");
}

/** Stable marker the mock OCR provider puts in every recognized text (used by tests/E2E). */
export const OCR_TEXT_MARKER = "نص الصفحة الممسوحة ضوئيًا";

/**
 * Deterministic offline OCR provider: scanned PDF/DOCX pages always yield a
 * fixed, curriculum-shaped Arabic fixture (bytes-derived token so distinct
 * files produce distinct-but-stable text — never identical chunk content).
 * Real OCR of actual page images comes from the `gemini` provider.
 */
export class MockOcrProvider implements OcrProvider {
  readonly id = "mock";

  async ocr(request: OcrRequest): Promise<OcrResponse> {
    const started = Date.now();
    const token = sha256Hex(request.base64).slice(0, 8);
    const text = [
      `${OCR_TEXT_MARKER} — صفحة من كتاب الرياضيات (الصف السادس).`,
      `نص الصفحة: «جمع الأعداد الطبيعية حتى 999 مع إعادة التجميع — مثال محلول: 487 + 358 = 845 (الرمز ${token}).»`,
      "ثمة تمرين مطلوب: اكتب مسودة الحل ثم تحقق من التقدير قبل الإجابة النهائية.",
    ].join("\n");
    return {
      text,
      model: "mock-ocr",
      inputTokens: Math.ceil(request.base64.length / 4),
      outputTokens: estimateTokens(text),
      latencyMs: Date.now() - started,
    };
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}