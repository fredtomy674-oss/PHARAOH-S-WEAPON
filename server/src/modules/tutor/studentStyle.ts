import type { LLMMessage } from "../ai/types.js";

/**
 * PHASE 184 — «معلّم بيتكلم مصري».
 *
 * The Arabic tutor used to be pinned to simplified MSA. The teacher therefore
 * read like a textbook even when the student wrote «مش فاهم» or «ازاي كده؟»,
 * and the Egyptian TTS voice could not hide the mismatch. The language rule is
 * now Egyptian Arabic; this module supplies the other half of the same idea:
 * a small, deterministic reading of *how* the student is talking right now.
 *
 * The model already sees the transcript, but models are inconsistent at
 * inferring register and pace. Naming the observation once, in structured
 * words, makes the adaptation stable and testable. It is deliberately a
 * heuristic, not a second model call: no latency, no cost, no provider drift.
 *
 * Two guardrails matter:
 *  • We mirror energy and brevity, never spelling or slang. A child's mistakes
 *    are not a style to copy.
 *  • The teacher's base voice stays Egyptian even when the student writes MSA.
 *    A formal question gets a lighter Egyptian reply, not a switch back to the
 *    dry textbook register this phase exists to remove.
 */

export type StudentRegister = "egyptian" | "formal" | "mixed";
export type StudentEnergy = "playful" | "hesitant" | "steady";
export type StudentPace = "brief" | "balanced" | "chatty";

export interface StudentStyle {
  register: StudentRegister;
  energy: StudentEnergy;
  pace: StudentPace;
  /** How many student messages the observation was built from (max 4). */
  samples: number;
}

/**
 * High-signal Egyptian markers only. Ambiguous words such as «هو», «هي» or
 * «لا» are deliberately absent: they are equally at home in MSA and would
 * mislabel a formal student.
 */
const EGYPTIAN_WORDS = new Set([
  "مش",
  "ايه",
  "عايز",
  "عاوز",
  "عايزه",
  "عاوزه",
  "ازاي",
  "ليه",
  "كده",
  "كدا",
  "اوي",
  "خالص",
  "بص",
  "طيب",
  "ماشي",
  "عشان",
  "علشان",
  "دلوقتي",
  "دلوقت",
  "بتاع",
  "بتاعه",
  "بتاعك",
  "بتاعتي",
  "جامد",
  "خلاص",
  "مفيش",
  "لسه",
  "النهارده",
  "يعني",
  "بقي",
  "برضه",
  "برضو",
  "ده",
  "دي",
  "دول",
  "احنا",
  "حاجه",
  "فين",
  "امتي",
  "معلش",
  "حاضر",
  "يلا",
  "يالا",
  "كمان",
]);

/** Words that make a message look like schoolbook MSA rather than speech. */
const FORMAL_WORDS = new Set([
  "لماذا",
  "كيف",
  "ماذا",
  "اريد",
  "ارجو",
  "هل",
  "نعم",
  "اعتقد",
  "لان",
  "ولكن",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "الذي",
  "التي",
  "سوف",
  "يجب",
  "يمكن",
  "ربما",
  "ايضا",
  "لذلك",
  "بالتاكيد",
  "بالطبع",
  "دعنا",
  "استاذ",
  "من فضلك",
  "لو سمحت",
]);

const PLAYFUL_WORDS = new Set([
  "هههه",
  "ههههه",
  "ههه",
  "بجد",
  "جامد",
  "حلو",
  "تحفه",
  "رهيب",
  "عظيم",
  "شاطر",
  "نجم",
  "بطل",
  "جاهز",
  "سهل",
  "عارفها",
]);

const HESITANT_PHRASES = [
  "مش فاهم",
  "مش فاهمه",
  "مش عارف",
  "مش عارفه",
  "مش متاكد",
  "مش متاكده",
  "معرفش",
  "ما اعرفش",
  "محتاج مساعده",
  "محتاجه مساعده",
  "صعب عليا",
  "ملخبط",
  "تايه",
  "مش قادر",
  "مش قادره",
  "مش واضح",
  "مش مستوعب",
];

function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();
}

function tokens(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 0),
  );
}

function countWords(words: Set<string>, known: Set<string>): number {
  let count = 0;
  for (const word of words) {
    if (known.has(word)) count += 1;
  }
  return count;
}

function countPhrases(normalized: string, phrases: readonly string[]): number {
  let count = 0;
  for (const phrase of phrases) {
    if (normalized.includes(phrase)) count += 1;
  }
  return count;
}

/** The last few student turns, current question last, deduplicated by content. */
function recentStudentTexts(question: string, history: readonly LLMMessage[] = []): string[] {
  const texts = history
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter((content) => content.length > 0);
  const current = question.trim();
  if (current.length > 0) texts.push(current);
  return texts.slice(-4);
}

export function analyzeStudentStyle(question: string, history: readonly LLMMessage[] = []): StudentStyle {
  const texts = recentStudentTexts(question, history);
  if (texts.length === 0) {
    return { register: "mixed", energy: "steady", pace: "balanced", samples: 0 };
  }

  const joined = texts.join("\n");
  const normalized = normalize(joined);
  const words = tokens(joined);
  const egyptian = countWords(words, EGYPTIAN_WORDS);
  const formal = countWords(words, FORMAL_WORDS);

  const register: StudentRegister =
    egyptian >= 1 && egyptian > formal
      ? "egyptian"
      : formal >= 2 && formal > egyptian
        ? "formal"
        : "mixed";

  const hesitant = countPhrases(normalized, HESITANT_PHRASES) > 0;
  const playful =
    /\p{Extended_Pictographic}/u.test(joined) ||
    countWords(words, PLAYFUL_WORDS) > 0 ||
    normalized.includes("ههه");
  const energy: StudentEnergy = hesitant ? "hesitant" : playful ? "playful" : "steady";

  const averageLength = texts.reduce((total, text) => total + text.length, 0) / texts.length;
  const pace: StudentPace = averageLength <= 28 ? "brief" : averageLength >= 120 ? "chatty" : "balanced";

  return { register, energy, pace, samples: texts.length };
}

/**
 * The prompt block. It is intentionally written as an observation plus an
 * instruction, not as a label: the model should hear the student's energy and
 * answer it, not announce «أسلوبك عامية مصرية» in class.
 */
export function studentStyleRule(style: StudentStyle): string {
  const register =
    style.register === "egyptian"
      ? "عامية مصرية واضحة"
      : style.register === "formal"
        ? "فصحى/عربية مدرسية"
        : "مزيج بين العامية والفصحى";

  const pace =
    style.pace === "brief"
      ? "رسائله قصيرة وسريعة؛ ردّ بجمل قصيرة مباشرة، ولا تفتح شرحًا طويلًا بلا داعٍ."
      : style.pace === "chatty"
        ? "يحب الحكي والتفاصيل؛ اسمع الجزء المهم من كلامه وعلّق عليه، ثم اشرح بخطوات واضحة من غير إطالة."
        : "إيقاعه متوسط؛ جملة طبيعية ثم شرح مركّز، بلا فقرات طويلة.";

  const energy =
    style.energy === "hesitant"
      ? "يبدو متعثرًا أو غير واثق؛ طمّنه بجملة قصيرة، وابدأ بأصغر خطوة، ولا تسأله أكثر من سؤال واحد."
      : style.energy === "playful"
        ? "روحه خفيفة ومرحة؛ اسمح بلمسة مزاح واحدة قصيرة، ثم ارجع للتعليم فورًا."
        : "هادئ وجاد؛ كن دافئًا وواثقًا من غير مزاح زائد أو مبالغة في المدح.";

  return `# أسلوب الطالب الآن (طابقه ولا تقلّده حرفيًا)
- لغته في آخر رسائله: ${register}. ${style.register === "formal" ? "أجب بعامية مصرية خفيفة ومصطلحات الكتاب، لا بفصحى جافة." : "أجب بعامية مصرية طبيعية، لا بعامية ثقيلة."}
- ${pace}
- ${energy}
- لا تنسخ أخطاء الطالب أو كلماته، ولا تعلّق على لهجته. المصطلحات والاقتباسات والتعريفات والنصوص المنهجية تبقى كما في الكتاب.`;
}
