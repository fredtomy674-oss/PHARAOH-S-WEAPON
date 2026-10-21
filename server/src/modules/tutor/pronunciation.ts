import type { SpeechLanguage } from "../ai/speech/types.js";

/**
 * PHASE 188 — النطق الصحيح يبدأ من الكلمة نفسها.
 *
 * The prompt asks the model for light tashkeel, but a prompt is not a
 * pronunciation guarantee: a weak turn can omit a shadda on «الذَّرّة» or
 * leave «الفِلِزّات» bare, and the voice then reads the wrong word. This module
 * is the deterministic backstop for the speech projection only:
 *
 *   • display keeps the teacher's own light tashkeel (the student sees a clean
 *     page, not a dictionary);
 *   • the server voice receives a curated, vocalised copy of the same words,
 *     so high-risk curriculum terms and ambiguous Egyptian words are read
 *     correctly even when the model misses them.
 *
 * The list is deliberately small and conservative. Every entry is a word whose
 * reading is settled and whose bare spelling is genuinely ambiguous to TTS
 * (الفلزات، الجزيء، الذرة، الخلية، النواة…), not a licence to diacritise every
 * Arabic word. A wrong haraka is worse than no haraka, so additions must be
 * reviewed by a human teacher.
 *
 * Matching is word-safe and prefix-aware: «فلزات»، «الفلزات»، «والفلزات»،
 * «بالفلزات» and «للفلزات» all receive the same vocalised stem, while a word
 * inside a larger word, a Latin word or an already-vocalised word is left
 * untouched. Calling the function twice is a no-op.
 */

type VocalisedTerm = readonly [plain: string, vocalised: string];

/**
 * Base forms without the definite article. The matcher adds the common
 * prefixes (و/ف/ب/ك/ل/ال/وال/بال/كال/فال/لل) itself, so one entry covers the
 * forms a real reply uses.
 */
const WORD_TERMS: readonly VocalisedTerm[] = [
  // Chemistry — G11 Term 1
  ["فلز", "فِلِزّ"],
  ["فلزات", "فِلِزّات"],
  ["لافلز", "لافِلِزّ"],
  ["لافلزات", "لافِلِزّات"],
  ["ذرة", "ذَرَّة"],
  ["جزيء", "جُزَيْء"],
  ["مركب", "مُرَكَّب"],
  ["عنصر", "عُنْصُر"],
  ["تفاعل", "تَفاعُل"],
  ["معادلة", "مُعادَلة"],
  ["كيميائي", "كِيمِيائي"],
  ["بروتون", "بُرُوتُون"],
  ["نيوترون", "نُيُوتْرُون"],
  ["إلكترون", "إِلِكْتْرُون"],
  ["أيون", "أَيُون"],
  ["تكافؤ", "تَكافُؤ"],
  ["نظائر", "نَظائِر"],
  ["مستوى", "مُسْتَوى"],
  ["دورة", "دَوْرة"],
  ["مجموعة", "مَجْمُوعة"],
  ["رابطة", "رابِطة"],
  ["تساهمية", "تَساهُمِيَّة"],
  ["أيونية", "أَيُونِيَّة"],
  ["فلزية", "فِلِزِّيَّة"],
  ["محلول", "مَحْلُول"],
  ["مذاب", "مُذاب"],
  ["مذيب", "مُذِيب"],
  ["تركيز", "تَرْكِيز"],
  ["حمض", "حِمْض"],
  ["قاعدة", "قاعِدة"],
  ["ملح", "مِلْح"],
  ["تعادل", "تَعادُل"],
  ["أكسدة", "أَكْسَدة"],
  ["اختزال", "اخْتِزال"],
  ["تأكسد", "تَأَكْسُد"],
  ["كهربائي", "كَهْرَبائي"],
  ["أنود", "أَنُود"],
  ["كاثود", "كَاثُود"],
  ["قطب", "قُطْب"],
  ["خلية", "خَلِيَّة"],
  ["تحلل", "تَحَلُّل"],
  ["تبخر", "تَبَخُّر"],
  ["تكاثف", "تَكاثُف"],
  ["تسامي", "تَسامِي"],
  ["انصهار", "انْصِهار"],
  ["تجمد", "تَجَمُّد"],
  ["سائل", "سائِل"],
  ["صلب", "صَلْب"],
  ["ضغط", "ضَغْط"],
  ["حجم", "حَجْم"],
  ["كيمياء", "كِيمْياء"],
  ["عضوية", "عُضْوِيَّة"],
  ["هيدروكربونات", "هِيدْرُوكَرْبُونات"],
  ["ألكانات", "أَلْكانات"],
  ["ألكينات", "أَلْكِنات"],
  ["ألكاينات", "أَلْكاينات"],
  ["بنزين", "بِنْزِين"],
  ["كحول", "كُحُول"],
  ["بروتين", "بُرُوتِين"],
  ["كربوهيدرات", "كَرْبُوهِيدْرات"],
  ["دهون", "دُهُون"],
  ["إنزيمات", "إِنْزِيمات"],
  ["كثافة", "كَثافة"],
  ["ذوبان", "ذَوَبان"],
  ["ذائبية", "ذائِبِيَّة"],
  ["مولارية", "مُولارِيَّة"],
  ["محتوى", "مُحْتَوى"],
  ["حراري", "حَرارِي"],
  ["حرارة", "حَرارة"],
  ["درجة", "دَرَجة"],
  ["طارد", "طارِد"],
  ["ماص", "ماصّ"],
  ["هيدروجيني", "هِيدْرُوجِينِي"],
  ["ذري", "ذَرِّي"],
  ["كتلي", "كُتْلي"],
  ["دوري", "دَوْرِي"],
  ["جلفانية", "جِلْفانِيَّة"],
  ["أكسيد", "أُكْسِيد"],
  ["كربون", "كَرْبُون"],
  ["احتباس", "احْتِباس"],
  ["جدول", "جَدْوَل"],
  ["رقم", "رَقْم"],
  ["نواة", "نَواة"],
  ["مدار", "مَدار"],

  // History — G11 Term 1
  ["طولونية", "طُولُونِيَّة"],
  ["إخشيدية", "إِخْشِيدِيَّة"],
  ["فاطمية", "فاطِمِيَّة"],
  ["أيوبية", "أَيُّوبِيَّة"],
  ["مملوكية", "مَمْلُوكِيَّة"],
  ["عثمانية", "عُثْمانِيَّة"],
  ["حملة", "حَمْلة"],
  ["فرنسية", "فَرَنْسِيَّة"],
  ["احتلال", "احْتِلال"],
  ["بريطاني", "بَرِيطانِي"],
  ["ثورة", "ثَوْرة"],
  ["استعمار", "اسْتِعْمار"],
  ["استقلال", "اسْتِقْلال"],
  ["خلافة", "خِلافَة"],
  ["سلطان", "سُلْطان"],
  ["مقاومة", "مُقاوَمة"],
  ["وطنية", "وَطَنِيَّة"],
  ["دستور", "دُسْتُور"],
  ["معاهدة", "مُعاهَدة"],
  ["اقتصاد", "اقْتِصاد"],
  ["صناعة", "صِناعة"],
  ["زراعة", "زِراعة"],
  ["تجارة", "تِجارة"],
  ["وحدة", "وَحْدة"],
  ["انفصال", "انْفِصال"],
  ["جمهورية", "جُمْهُورِيَّة"],
  ["اشتراكية", "اشْتِراكِيَّة"],
  ["رأسمالية", "رَأْسْمالِيَّة"],
  ["قومية", "قَوْمِيَّة"],
  ["تحرير", "تَحْرِير"],
  ["جلاء", "جَلاء"],

  // Arabic language and rhetoric — G11 Term 1
  ["همزة", "هَمْزة"],
  ["مقصورة", "مَقْصُورة"],
  ["مربوطة", "مَرْبُوطة"],
  ["تنوين", "تَنْوِين"],
  ["شدة", "شَدَّة"],
  ["سكون", "سُكُون"],
  ["مبتدأ", "مُبْتَدَأ"],
  ["فاعل", "فاعِل"],
  ["مفعول", "مَفْعُول"],
  ["نعت", "نَعْت"],
  ["بدل", "بَدَل"],
  ["تمييز", "تَمْيِيز"],
  ["استعارة", "اسْتِعارة"],
  ["تشبيه", "تَشْبِيه"],
  ["كناية", "كِناية"],
  ["جناس", "جِناس"],
  ["سجع", "سَجْع"],
  ["طباق", "طِباق"],
  ["مقابلة", "مُقابَلة"],

  // The teacher's own classroom words
  ["سؤال", "سُؤال"],
  ["إجابة", "إِجابة"],
  ["خطوة", "خَطْوة"],
  ["قادمة", "قادِمة"],
  ["فكرة", "فِكْرة"],
  ["مثال", "مِثال"],
  ["تمرين", "تَمْرين"],
  ["صفحة", "صَفْحة"],
  ["كتاب", "كِتاب"],
  ["معلم", "مُعَلِّم"],
  ["طالب", "طالِب"],
  ["مراجعة", "مُراجَعة"],
  ["تطبيق", "تَطْبِيق"],
  ["مقارنة", "مُقارَنة"],
  ["ملاحظة", "مُلاحَظة"],
];

/**
 * Multi-word terms whose correct reading depends on the phrase, not on the
 * individual words. They are replaced before the word rules, so a phrase is
 * never half-vocalised.
 */
const PHRASE_TERMS: readonly VocalisedTerm[] = [
  ["الجدول الدوري", "الجَدْوَل الدَّوْرِي"],
  ["العدد الذري", "العَدَد الذَّرِّي"],
  ["العدد الكتلي", "العَدَد الكُتْلي"],
  ["ثاني أكسيد الكربون", "ثانِي أُكْسِيد الكَرْبُون"],
  ["الاحتباس الحراري", "الاحْتِباس الحَرارِي"],
  ["درجة الحرارة", "دَرَجة الحَرارة"],
  ["التحليل الكهربائي", "التَّحْلِيل الكَهْرَبائي"],
  ["الخلية الجلفانية", "الخَلِيَّة الجِلْفانِيَّة"],
  ["التفاعل الطارد للحرارة", "التَّفاعُل الطارِد للحَرارة"],
  ["التفاعل الماص للحرارة", "التَّفاعُل الماصّ للحَرارة"],
  ["الكيمياء العضوية", "الكِيمْياء العُضْوِيَّة"],
  ["الرقم الهيدروجيني", "الرَّقْم الهِيدْرُوجِينِي"],
  ["الخطوة القادمة", "الخَطْوة القادِمة"],
];

interface PronunciationRule {
  pattern: RegExp;
  replace: (match: string, prefix: string) => string;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A base word with an optional Arabic prefix. The lookarounds are Unicode
 * script-aware (not ASCII \b, which does not understand Arabic), so a stem is
 * never replaced inside a longer Arabic word, and an already vocalised word is
 * left alone because its letters are separated by harakat.
 */
function wordRule(plain: string, vocalised: string): PronunciationRule {
  return {
    pattern: new RegExp(
      `(?<!\\p{Script=Arabic})((?:[وفبك]{0,2}(?:ال|لل)?)?)(${escapeRegExp(plain)})(?!\\p{Script=Arabic})`,
      "gu",
    ),
    replace: (_match, prefix) => `${prefix}${articleAssimilated(prefix, vocalised)}`,
  };
}

/** Arabic sun letters: the article's ل assimilates into them (الذَّرَّة). */
const SUN_LETTERS = new Set("تثدذرزسشصضطظلن");

/**
 * Adds the shadda of the definite article when the word starts with a sun
 * letter. Without it, «الذرة» becomes «الذَرَّة» — understandable to a human,
 * but the voice may miss the gemination. The base word itself keeps its own
 * shadda (ذَرَّة has one on ر); this only adds the article's assimilation.
 */
function articleAssimilated(prefix: string, vocalised: string): string {
  if (!/(?:ال|لل)$/.test(prefix)) return vocalised;
  const first = vocalised[0];
  if (!first || !SUN_LETTERS.has(first) || vocalised[1] === "\u0651") return vocalised;
  const rest = vocalised.slice(1);
  // Keep the canonical mark order (vowel before shadda) so the same word is
  // byte-identical to human-written tashkeel and does not churn the speech
  // cache with two visually identical strings.
  if (rest[0] === "\u064E" || rest[0] === "\u064F" || rest[0] === "\u0650") {
    return `${first}${rest[0]}\u0651${rest.slice(1)}`;
  }
  return `${first}\u0651${rest}`;
}

function phraseRule(plain: string, vocalised: string): PronunciationRule {
  return {
    pattern: new RegExp(`(?<!\\p{Script=Arabic})${escapeRegExp(plain)}(?!\\p{Script=Arabic})`, "gu"),
    replace: () => vocalised,
  };
}

/**
 * A phrase can be preceded by the same short prefixes a word can; the
 * «لل» form loses the first `ال` of the phrase, exactly as Arabic writes it.
 */
function phraseVariants(plain: string, vocalised: string): PronunciationRule[] {
  const variants: Array<[string, string]> = [[plain, vocalised]];
  for (const prefix of ["و", "ف", "ب", "ك"]) {
    variants.push([`${prefix}${plain}`, `${prefix}${vocalised}`]);
  }
  if (plain.startsWith("ال") && vocalised.startsWith("ال")) {
    variants.push([`لل${plain.slice(2)}`, `لل${vocalised.slice(2)}`]);
  }
  return variants
    .sort((a, b) => b[0].length - a[0].length)
    .map(([p, v]) => phraseRule(p, v));
}

const RULES: readonly PronunciationRule[] = [
  ...PHRASE_TERMS.flatMap(([plain, vocalised]) => phraseVariants(plain, vocalised)),
  ...[...WORD_TERMS]
    .sort((a, b) => b[0].length - a[0].length)
    .map(([plain, vocalised]) => wordRule(plain, vocalised)),
];

/**
 * Returns the same text with a curated Arabic pronunciation layer applied.
 *
 * Non-Arabic lessons are returned untouched: their voice is a different
 * language, and Arabic harakat inside an English word would be a bug.
 */
export function applyPronunciation(text: string, language: SpeechLanguage): string {
  if (language !== "ar" || text.length === 0) return text;
  let out = text;
  for (const rule of RULES) {
    out = out.replace(rule.pattern, rule.replace);
  }
  return out;
}

/**
 * The speech projection used by the live narrator and the 🔊 route. Callers
 * strip markdown first (so list markers are not spoken), then apply this layer
 * to the words that remain.
 */
export function pronounceForSpeech(text: string, language: SpeechLanguage): string {
  return applyPronunciation(text, language);
}
