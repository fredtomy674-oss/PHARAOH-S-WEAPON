// One-off surgical edit (dev-time): swap the old hand-written EGYPT_SPEC and
// demo question sets for the OFFICIAL PHASE 47 spec (term-1 = كتاب الوزارة T1,
// grounded on OCR page text; term-2 = placeholder kept). Everything else in
// seed.ts is untouched.
import { readFileSync, renameSync, writeFileSync } from "node:fs";

const file = "./src/db/seed.ts";
const src = readFileSync(file, "utf8");

// ---- 1) EGYPT_SPEC (the apply section at the bottom performs the swap) -----

const NEW_SPEC = `/**
 * Egyptian Grade-6 Math — OFFICIAL curriculum (PHASE 47).
 *
 * The first-term tree IS the Ministry textbook (Math Techbook™ G6 T1): 7 units
 * with 10 printed concepts («المفاهيم» → app lessons), each grounded on the OCR
 * text of the book's own pages (server/data/curriculum-ocr/) so the tutor's RAG
 * retrieval reads from «كتاب الوزارة» verbatim. The second term remains a
 * hand-written placeholder until the T2 book is imported the same way.
 */
export const EGYPT_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  curriculum: { code: "eg-g6-math", title: "الرياضيات للصف السادس الابتدائي" },
  terms: [buildEgyptT1Term(), buildEgyptT2Placeholder()],
};

/** Term 1 = the official book: one app lesson per printed مفهوم, pages OCR'd. */
function buildEgyptT1Term(): TermSeedSpec {
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_T1_UNITS.map((unit, ui) => ({
      code: \`unit-\${ui + 1}\`,
      title: unit.title,
      lessons: unit.concepts.map((concept, ci) => {
        const title = \`المفهوم \${concept.key}: \${concept.title}\`;
        return {
          code: \`l-con-\${concept.key}\`,
          title,
          concepts: [concept.title],
          doc: { title, content: conceptDocument(ui, ci) },
        };
      }),
    })),
  };
}

/** Term 2 placeholder — hand-written until the second-term book is imported. */
function buildEgyptT2Placeholder(): TermSeedSpec {
  return {
    code: "term-2",
    title: "الفصل الدراسي الثاني",
    units: [
      {
        code: "unit-1",
        title: "الأعداد العشرية والنسبية",
        lessons: [
          {
            code: "l-decimals",
            title: "الأعداد العشرية والعمليات عليها",
            concepts: ["قراءة الأعداد العشرية وترتيبها", "جمع الأعداد العشرية وطرحها"],
            doc: {
              title: "الأعداد العشرية والعمليات عليها",
              content: \`درس الأعداد العشرية والعمليات عليها.
قراءة العدد العشري: نقرأ الجزء الصحيح ثم كلمة (و) ثم الجزء العشري. مثال: 3.45 يقرأ ثلاثة و45 من مئة، وأول منزلة بعد الفاصلة هي الأعشار.
ترتيب الأعداد العشرية: نقارن الجزء الصحيح أولًا، ثم ننظر إلى منزلة الأعشار فالجزء من مئة. مثال: 4.3 أصغر من 4.35 لأن 3 أعشار أصغر من 35 من مئة.
جمع الأعداد العشرية وطرحها: نرتب الأرقام بحيث تقع الفواصل تحت بعضها ثم نجمع أو نطرح منزلة لمنزلة. مثال: 12.5 + 3.75 = 16.25.
مثال تطبيقي: اشترى سامي أقلامًا بـ12.75 جنيه ودفترًا بـ7.5 جنيهات. كم دفع؟ 12.75 + 7.50 = 20.25 جنيهًا.
تذكر: أضف أصفارًا نهاية العدد العشري لتساوي عدد المنازل قبل الجمع أو الطرح.\`,
            },
          },
          {
            code: "l-rational",
            title: "الأعداد النسبية",
            concepts: ["الأعداد النسبية الموجبة والسالبة", "تمثيل الأعداد النسبية على خط الأعداد"],
            doc: {
              title: "الأعداد النسبية الموجبة والسالبة",
              content: \`درس الأعداد النسبية.
الأعداد النسبية: كل عدد يمكن كتابته على صورة أ/ب حيث ب لا يساوي صفرًا، وتشمل الأعداد الصحيحة الموجبة والسالبة والكسور. أمثلة: -3، 1/2، 0.75 أعداد نسبية.
الموجبة والسالبة: الموجبة أكبر من صفر وتقع يمين الصفر على خط الأعداد، والسالبة أصغر من صفر وتقع يسار الصفر. مثال: -4 أصغر من 2 لأنها تقع على يسار الصفر.
تمثيل الأعداد النسبية على خط الأعداد: لكل عدد نسبي نقطة واحدة على الخط، وتقسم المسافة بين صفر و1 حسب المقام. مثال: 3/4 تقع بين 0 و1 قرب 1، والعدد -3/4 يقع على يسار الصفر.
مثال تطبيقي: بلغت درجة حرارة مدينة خمس درجات تحت الصفر، فكيف نكتبها؟ نكتبها -5 درجات.
تذكر: كلما اتجهت يسارًا على خط الأعداد قلت القيمة، وكلما اتجهت يمينًا زادت.\`,
            },
          },
          {
            code: "l-equations",
            title: "المعادلات والمسائل اللفظية",
            concepts: ["حل معادلة من خطوة", "كتابة المعادلة من مسألة لفظية"],
            doc: {
              title: "المعادلات والمسائل اللفظية",
              content: \`درس المعادلات والمسائل اللفظية.
المعادلة: جملة رياضية تعبر عن تساوي مقدارين وتحتوي مجهولًا. مثال: س + 7 = 15، والمجهول يمثل قيمة نبحث عنها.
حل معادلة من خطوة: نعزل المجهول في طرف باستخدام العملية العكسية. مثال: في س + 7 = 15 نطرح 7 من الطرفين فس = 8. وفي 3 س = 12 نقسم الطرفين على 3 فس = 4.
كتابة المعادلة من مسألة لفظية: نختار رمزًا للمجهول ونترجم الجملة إلى معادلة. مثال: إذا كان عدد الورود في الباقة مضافًا إليه 5 يساوي 20، فنكتب س + 5 = 20.
مثال تطبيقي: ثمن قلمين و3 جنيهات يساوي 11 جنيهًا. ما ثمن القلم الواحد؟ المعادلة 2 س + 3 = 11، إذن 2 س = 8، فس = 4 جنيهات.
تذكر: ما تفعله في أحد الطرفين افعله في الطرف الآخر، وتحقق من الحل بتعويض القيمة في المعادلة الأصلية.\`,
            },
          },
        ],
      },
    ],
  };
}
`;

// ---- 2) Demo questions ------------------------------------------------------
const L1_1 = "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر";
const L1_2 = "استكشاف خط الأعداد";
const L3_2 = "تفسير القيمة المطلقة واستخدامها";
const L2_3 = "المقادير الجبرية والأسس";
const L1_4 = "كتابة المعادلات والمتباينات واستراتيجيات حلها";
const L1_6 = "جمع البيانات وتمثيلها وتطبيقات عليها";
const L1_7 = "استكشاف مقاييس النزعة المركزية والانتشار";

const NEW_MCQ = `const EGYPT_DEMO_QUESTIONS: DemoQuestionSpec[] = [
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "medium",
    content: "ما القاسم المشترك الأكبر للعددين 12 و18؟",
    options: ["3", "6", "9", "2"],
    correctIndex: 1,
    explanation: "قواسم 12: 1، 2، 3، 4، 6، 12 وقواسم 18: 1، 2، 3، 6، 9، 18، فالقاسم المشترك الأكبر هو 6.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "medium",
    content: "ما المضاعف المشترك الأصغر للعددين 4 و6؟",
    options: ["12", "24", "18", "6"],
    correctIndex: 0,
    explanation: "مضاعفات 4: 4، 8، 12، 16 ومضاعفات 6: 6، 12، 18، فالمضاعف المشترك الأصغر هو 12.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "easy",
    content: "بعد تبسيط الكسر 8/12 يصبح:",
    options: ["2/3", "4/6", "3/4", "1/2"],
    correctIndex: 0,
    explanation: "نقسم البسط والمقام على العامل المشترك الأكبر 4: 8 ÷ 4 = 2 و 12 ÷ 4 = 3، فيصبح 2/3.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "easy",
    content: "ما ناتج 1/4 + 2/4؟",
    options: ["3/4", "3/8", "2/4", "1/2"],
    correctIndex: 0,
    explanation: "نجمع البسطين ونُبقي المقام كما هو: 1 + 2 = 3، إذن الناتج 3/4.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "easy",
    content: "ما العدد الأولي من بين الأعداد التالية؟",
    options: ["9", "15", "17", "21"],
    correctIndex: 2,
    explanation: "العدد الأولي لا يقبل القسمة إلا على نفسه وعلى الواحد، ومن بين الخيارات 17 أولي لأن 9 و15 و21 لها قواسم أخرى.",
  },
  {
    lessonCode: "l-con-1-2",
    conceptTitle: "${L1_2}",
    difficulty: "easy",
    content: "على خط الأعداد، يقع الكسر 1/2 بين:",
    options: ["0 و1", "1 و2", "−1 و0", "−2 و−1"],
    correctIndex: 0,
    explanation: "العدد النسبي 1/2 أكبر من صفر وأصغر من 1، فيقع بين 0 و1 على خط الأعداد.",
  },
  {
    lessonCode: "l-con-3-2",
    conceptTitle: "${L3_2}",
    difficulty: "easy",
    content: "ما قيمة |−5|؟",
    options: ["5", "−5", "0", "10"],
    correctIndex: 0,
    explanation: "القيمة المطلقة تعبر عن البعد عن الصفر دون اتجاه، فـ|−5| = 5.",
  },
  {
    lessonCode: "l-con-2-3",
    conceptTitle: "${L2_3}",
    difficulty: "easy",
    content: "ما قيمة 2³؟",
    options: ["8", "6", "9", "4"],
    correctIndex: 0,
    explanation: "الأس يعني تكرار الضرب: 2³ = 2 × 2 × 2 = 8.",
  },
  {
    lessonCode: "l-con-1-4",
    conceptTitle: "${L1_4}",
    difficulty: "easy",
    content: "ما حل المعادلة س + 7 = 15؟",
    options: ["8", "22", "7", "15"],
    correctIndex: 0,
    explanation: "نطرح 7 من الطرفين: س = 15 − 7 = 8.",
  },
  {
    lessonCode: "l-con-1-6",
    conceptTitle: "${L1_6}",
    difficulty: "medium",
    content: "ما المتوسط الحسابي للدرجات 7، 8، 9، 6، 10؟",
    options: ["8", "7", "9", "40"],
    correctIndex: 0,
    explanation: "المتوسط = (7 + 8 + 9 + 6 + 10) ÷ 5 = 40 ÷ 5 = 8.",
  },
  {
    lessonCode: "l-con-1-7",
    conceptTitle: "${L1_7}",
    difficulty: "medium",
    content: "ما الوسيط للقيم 4، 7، 9، 11، 15؟",
    options: ["9", "7", "11", "15"],
    correctIndex: 0,
    explanation: "القيم مرتبة تصاعديًا وعددها 5، فالوسيط هو القيمة الوسطى 9.",
  },
];`;

const NEW_OPEN = `const EGYPT_DEMO_OPEN_QUESTIONS: DemoOpenQuestionSpec[] = [
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "easy",
    content: "اكتب الكسر المبسّط للكسر 8/12.",
    answerKey: "2/3",
    explanation: "نقسم البسط والمقام على العامل المشترك الأكبر 4: 8 ÷ 4 = 2 و 12 ÷ 4 = 3، فيصبح 2/3.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "easy",
    content: "اكتب العدد الأولي الزوجي الوحيد.",
    answerKey: "2",
    explanation: "العدد 2 هو العدد الأولي الزوجي الوحيد، لأنه لا يقبل القسمة إلا على نفسه وعلى الواحد.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "${L1_1}",
    difficulty: "medium",
    content: "ما ناتج 78 ÷ 3 بالقسمة المطولة؟ اكتب إجابتك.",
    answerKey: "26",
    explanation: "7 ÷ 3 = 2 والباقي 1، ننزل 8 فتصبح 18، و18 ÷ 3 = 6. الناتج 26.",
  },
  {
    lessonCode: "l-con-1-4",
    conceptTitle: "${L1_4}",
    difficulty: "medium",
    content: "ما حل المعادلة س + 5 = 20؟ اكتب القيمة.",
    answerKey: "15",
    explanation: "نطرح 5 من الطرفين: س = 20 − 5 = 15.",
  },
];`;

// ---- apply ----------------------------------------------------------------
// Write to a temp file, self-verify, then atomically replace — never leave a
// broken seed.ts behind.
import { writeFileSync as _w } from "node:fs";

// 1) Normalize line endings so line-array math is predictable.
const norm = src.replace(/\r\n/g, "\n").split("\n");

// 2) Replace the EGYPT_SPEC block: everything from its start up to (not
//    including) the Saudi comment that follows it.
const start = norm.findIndex((l) => l.startsWith("export const EGYPT_SPEC: CountrySeedSpec = {"));
if (start < 0) throw new Error("EGYPT_SPEC start not found");
const saudiMark = norm.findIndex((l, i) => i > start && l.includes("/** Saudi (KSA) Grade-6 Math skeleton"));
if (saudiMark < 0) throw new Error("SAUDI comment not found");
const specEnd = saudiMark - 1; // the `};` line right before the comment
let out = [...norm.slice(0, start), ...NEW_SPEC.trim().split("\n"), ...norm.slice(specEnd + 1)];

// 3) Replace the demo question arrays (bottom-up so earlier indices stay valid).
function blockBounds(marker) {
  const a = out.findIndex((l) => l.startsWith(marker));
  if (a < 0) throw new Error(`${marker} not found`);
  const b = out.findIndex((l, i) => i > a && l.trim() === "];");
  if (b < 0) throw new Error(`${marker} close not found`);
  return [a, b];
}
let [oqA, oqB] = blockBounds("const EGYPT_DEMO_OPEN_QUESTIONS: DemoOpenQuestionSpec[] = [");
out = [...out.slice(0, oqA), ...NEW_OPEN.trim().split("\n"), ...out.slice(oqB + 1)];
let [mqA, mqB2] = blockBounds("const EGYPT_DEMO_QUESTIONS: DemoQuestionSpec[] = [");
out = [...out.slice(0, mqA), ...NEW_MCQ.trim().split("\n"), ...out.slice(mqB2 + 1)];

// 4) Add the official-curriculum import next to the other seed imports.
const impIdx = out.findIndex((l) => l.startsWith('import { newId } from "../utils/ids.js";'));
if (impIdx < 0) throw new Error("newId import not found");
out.splice(impIdx + 1, 0, 'import { EGYPT_T1_UNITS, conceptDocument } from "./egyptT1.js";');

// 5) Self-verify before touching the real file.
const verify = out.join("\n");
const checks = [
  ["EGYPT_SPEC present", /export const EGYPT_SPEC: CountrySeedSpec = \{/.test(verify)],
  ["no old term-1 demo", !/l-add-sub/.test(verify)],
  ["no old q array", !/l-frac-ops/.test(verify)],
  ["new term builder", /function buildEgyptT1Term\(\)/.test(verify)],
  ["official lesson code in Qs", /l-con-1-1/.test(verify)],
  ["open Qs present", /answerKey: "15"/.test(verify)],
  ["import added", /import \{ EGYPT_T1_UNITS, conceptDocument \} from "\.\/egyptT1\.js";/.test(verify)],
  ["no carriage returns", !verify.includes("\r")],
];
const bad = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (bad.length) throw new Error(`Self-verify failed: ${bad.join(", ")}`);

// 6) Write atomically via a temp file.
const tmp = `${file}.tmp`;
writeFileSync(tmp, `${verify}\n`, "utf8");
const tmpLines = readFileSync(tmp, "utf8").split("\n").length;
if (tmpLines < 800 || tmpLines > 1400) throw new Error(`Suspicious line count ${tmpLines} — aborting`);
renameSync(tmp, file);
console.log(`OK — EGYPT_SPEC, MCQ & OPEN blocks replaced; new file: ${tmpLines} lines, ${checks.length}/${checks.length} self-checks passed.`);