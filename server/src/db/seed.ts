/* eslint-disable no-console */
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { and, asc, eq } from "drizzle-orm";
import { openDbAndMigrate } from "./index.js";
import { AiService } from "../modules/ai/aiService.js";
import { CurriculumService } from "../modules/curriculum/service.js";
import { KnowledgeService } from "../modules/knowledge/service.js";
import { createVectorStore } from "../modules/rag/factory.js";
import {
  chunks,
  concepts,
  countries,
  curricula,
  educationSystems,
  grades,
  lessons,
  parents,
  questions,
  students,
  studentsParents,
  subjects,
  terms,
  units,
  users,
} from "./schema.js";
import { newId } from "../utils/ids.js";

/** Where one seeded lesson lives — used as the RAG scope for its document. */
interface SeededLesson {
  lessonId: string;
  termId: string;
  unitId: string;
}

interface Seeded {
  countryId: string;
  systemId: string;
  gradeId: string;
  subjectId: string;
  curriculumId: string;
  /** PHASE 43 — every lesson plus the term/unit it was seeded under, so the RAG
   *  metadata describes the real tree instead of the first unit only. */
  lessons: Record<string, SeededLesson>;
}

/** One lesson: its concepts, and optionally the RAG document that grounds it. */
interface LessonSeedSpec {
  code: string;
  title: string;
  concepts: string[];
  doc?: { title: string; content: string };
}

/** A unit groups lessons inside one term (PHASE 43: a curriculum is a tree). */
interface UnitSeedSpec {
  code: string;
  title: string;
  lessons: LessonSeedSpec[];
}

/** A term groups units inside one curriculum. */
interface TermSeedSpec {
  code: string;
  title: string;
  units: UnitSeedSpec[];
}

/** One country's curriculum skeleton + per-lesson RAG documents (PHASE 16: multi-country). */
interface CountrySeedSpec {
  country: { code: string; name: string; nameAr: string };
  system: { code: string; name: string; nameAr: string; sortOrder: number };
  grade: { code: string; name: string; nameAr: string; levelOrder: number };
  /**
   * Global subject catalog entry (shared across countries, PHASE 38). Defaults
   * to Mathematics so the two original specs stay untouched; a language
   * curriculum declares its own code, and that code is what makes the tutor
   * answer in English (D-042).
   */
  subject?: { code: string; name: string; nameAr: string };
  curriculum: { code: string; title: string };
  /**
   * PHASE 43 — the whole curriculum tree. It used to be one term + one unit +
   * a flat lesson list, which is why the seeded "curriculum" was three lessons
   * with no second term, no second unit and nothing for a student to finish.
   */
  terms: TermSeedSpec[];
}

type DbHandle = ReturnType<typeof openDbAndMigrate>;

/** Egyptian Grade-6 Math skeleton + sample lesson documents (original PHASE 1 seed). */
export const EGYPT_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  curriculum: { code: "eg-g6-math", title: "الرياضيات للصف السادس الابتدائي" },
  terms: [
    {
      code: "term-1",
      title: "الفصل الدراسي الأول",
      units: [
        {
          code: "unit-1",
          title: "الأعداد والعمليات عليها",
          lessons: [
          {
            code: "l-add-sub",
            title: "الجمع والطرح على الأعداد الطبيعية",
            concepts: ["الجمع مع إعادة التجميع", "الطرح مع الاستلاف"],
            doc: {
              title: "الجمع مع إعادة التجميع والطرح مع الاستلاف",
              content: `درس الجمع والطرح على الأعداد الطبيعية.
الجمع مع إعادة التجميع: عند جمع عددين مثل 487 + 358 نبدأ من الآحاد: 7 + 8 = 15، نكتب 5 ونرفع 1 للعشرات. ثم نجمع العشرات: 8 + 5 + 1 = 14، نكتب 4 ونرفع 1 للمئات. أخيرًا المئات: 4 + 3 + 1 = 8. الناتج هو 845.
الطرح مع الاستلاف: لحساب 503 - 267 نبدأ من الآحاد: 3 أصغر من 7، نستلف 1 من العشرات ولكن العشرات صفر، فنستلف من المئات: 500 تنقص إلى 400، والعشرات تصبح 9، والآحاد تصبح 13. 13 - 7 = 6، ثم 9 - 6 = 3، ثم 4 - 2 = 2. الناتج 236.
مثال تطبيقي: اشترى تاجر 120 كتابًا في الشهر الأول و95 كتابًا في الشهر الثاني. كم كتابًا اشترى في الشهرين؟ نجمع 120 + 95 = 215 كتابًا.
تذكر: يجب دائمًا البدء من الآحاد عند إجراء الجمع أو الطرح، والفهم الجيد لإعادة التجميع والاستلاف يقي من أخطاء شائعة كثيرة.`,
            },
          },
          {
            code: "l-mul-div",
            title: "الضرب والقسمة",
            concepts: ["الضرب في عدد من رقمين", "القسمة المطولة"],
            doc: {
              title: "الضرب في عدد من رقمين والقسمة المطولة",
              content: `درس الضرب والقسمة.
الضرب في عدد من رقمين: لضرب 34 × 12 نضرب أولًا 34 × 2 = 68، ثم نضرب 34 × 10 = 340، ثم نجمع الناتجين: 68 + 340 = 408.
القسمة المطولة: لحساب 78 ÷ 3 نبدأ بقسمة 7 على 3: الناتج 2 والباقي 1. ننزل 8 بجانب الباقي لتصبح 18، ثم 18 ÷ 3 = 6. إذن 78 ÷ 3 = 26.
خاصية التوزيع تساعدنا على تبسيط الحسابات: 34 × 12 = 34 × (10 + 2) = 340 + 68 = 408.
مثال تطبيقي: توجد 5 صناديق في كل صندوق 24 قلمًا. ما عدد الأقلام الكلي؟ 5 × 24 = 120 قلمًا.
تمرين: احسب 56 × 13 باستخدام خطوات الفصل، ثم تحقق بقسمة الناتج على 13.`,
            },
          },
          {
            code: "l-fractions",
            title: "الكسور الاعتيادية",
            concepts: ["مقارنة الكسور", "تبسيط الكسور", "جمع الكسور ذات المقامات المتشابهة"],
            doc: {
              title: "مقارنة الكسور وتبسيطها وجمعها",
              content: `درس الكسور الاعتيادية.
مقارنة الكسور ذات المقامات المتشابهة: كلما كان البسط أكبر كان الكسر أكبر، فمثلًا 3/5 أكبر من 2/5. أما إذا اختلفت المقامات فنوحد المقامات أولًا.
تبسيط الكسور: نقسم البسط والمقام على العامل المشترك الأكبر. مثال: 8/12 نقسم على 4 فنحصل على 2/3.
جمع الكسور ذات المقامات المتشابهة: نجمع البسطين ونُبقي المقام كما هو: 1/4 + 2/4 = 3/4. إذا اختلفت المقامات، نوحد المقامات قبل الجمع.
مثال تطبيقي: أكل أحمد ربع البيتزا في الصباح وربعًا آخر في المساء، فما مجموع ما أكله؟ 1/4 + 1/4 = 2/4 ويُبسط إلى 1/2.
تذكر دائمًا: الكسر يُعبر عن جزء من الكل، والمقام هو عدد الأجزاء المتساوية التي قُسم إليها الكل.`,
            },
          },
          {
            code: "l-primes",
            title: "الأعداد الأولية والعوامل",
            concepts: ["الأعداد الأولية", "تحليل العدد إلى عوامله"],
            doc: {
              title: "الأعداد الأولية وتحليل العدد إلى عوامله",
              content: `درس الأعداد الأولية والعوامل.
الأعداد الأولية: عدد طبيعي أكبر من 1 لا يقبل القسمة إلا على نفسه وعلى الواحد. أمثلة: 2، 3، 5، 7، 11. العدد 1 ليس أوليًا ولا مركبًا.
تحليل العدد إلى عوامله: نكتب العدد على شكل حاصل ضرب عددين أو أكثر، ونستمر حتى تصبح كل العوامل أولية. مثال: 12 = 2 × 2 × 3، و30 = 2 × 3 × 5.
مثال تطبيقي: يوزع المعلم 36 كراسة على مجموعات متساوية العدد. ما عدد المجموعات الممكنة؟ نبحث في عوامل 36: 1، 2، 3، 4، 6، 9، 12، 18، 36.
تذكر: كل عدد مركب يُكتب على صورة حاصل ضرب عوامل أولية بطريقة واحدة مهما اختلف الترتيب.`,
            },
          },
          {
            code: "l-gcd-lcm",
            title: "القاسم المشترك الأكبر والمضاعف المشترك الأصغر",
            concepts: ["القاسم المشترك الأكبر", "المضاعف المشترك الأصغر"],
            doc: {
              title: "القاسم المشترك الأكبر والمضاعف المشترك الأصغر",
              content: `درس القاسم المشترك الأكبر والمضاعف المشترك الأصغر.
القاسم المشترك الأكبر (ق.م.أ): أكبر عدد يقسم العددين معًا دون باقٍ. قواسم 12 هي 1، 2، 3، 4، 6، 12، وقواسم 18 هي 1، 2، 3، 6، 9، 18، فالقاسم المشترك الأكبر هو 6.
المضاعف المشترك الأصغر (م.م.أ): أصغر عدد موجب يقبل القسمة على العددين معًا. مضاعفات 4 هي 4، 8، 12، 16، 20، ومضاعفات 6 هي 6، 12، 18، 24، فالمضاعف المشترك الأصغر هو 12.
مثال تطبيقي: يوزع وكيل المدرسة 24 قلمًا و36 دفترًا على الطلاب بالتساوي دون باقٍ. ما أكبر عدد من الطلاب يمكن التوزيع عليهم؟ ق.م.أ(24، 36) = 12 طالبًا.
تذكر: ق.م.أ يقيس العوامل المشتركة، بينما م.م.أ يقيس المضاعفات المشتركة، وكلاهما يسهل حل المسائل اللفظية.`,
            },
          },
          ],
        },
        {
          code: "unit-2",
          title: "الكسور والعمليات عليها",
          lessons: [
            {
              code: "l-frac-ops",
              title: "جمع الكسور وطرحها بمقامات مختلفة",
              concepts: ["توحيد المقامات", "جمع الكسور باختلاف المقامات", "طرح الكسور باختلاف المقامات"],
              doc: {
                title: "جمع الكسور وطرحها بمقامات مختلفة",
                content: `درس جمع الكسور وطرحها بمقامات مختلفة.
توحيد المقامات: نوجد المضاعف المشترك الأصغر للمقامين ثم نكتب كل كسر بمقام جديد. مثال: لتوحيد 1/2 و1/3 نستخدم المقام المشترك 6 فيصبحان 3/6 و2/6.
جمع الكسور باختلاف المقامات: نوحد المقامات ثم نجمع البسطين. مثال: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.
طرح الكسور باختلاف المقامات: نوحد المقامات ثم نطرح البسطين. مثال: 3/4 - 1/6 = 9/12 - 2/12 = 7/12.
مثال تطبيقي: شرب مازن ثلث الماء في القارورة في الصباح وخمسها في المساء. ما مجموع ما شربه؟ 1/3 + 1/5 = 5/15 + 3/15 = 8/15.
تذكر: لا نجمع أو نطرح المقامات أبدًا، بل نبقي المقام الموحد كما هو.`,
              },
            },
            {
              code: "l-frac-mul-div",
              title: "ضرب الكسور وقسمتها",
              concepts: ["ضرب الكسور", "قسمة الكسور"],
              doc: {
                title: "ضرب الكسور وقسمتها",
                content: `درس ضرب الكسور وقسمتها.
ضرب الكسور: نضرب البسط في البسط والمقام في المقام ثم نبسط الناتج. مثال: 2/3 × 4/5 = 8/15.
الضرب في عدد صحيح: نكتب العدد كسرًا مقامه 1، فمثلًا 3 × 2/5 = 6/5. ويمكن الاختصار قبل الضرب لتسهيل الحساب.
قسمة الكسور: نقسم بضرب الكسر الأول في مقلوب الكسر الثاني. مثال: 3/4 ÷ 2/5 = 3/4 × 5/2 = 15/8.
مثال تطبيقي: يقطع نجار لوحًا طوله 3/4 متر إلى قطع طول كل منها 1/8 متر. كم قطعة يحصل عليها؟ 3/4 ÷ 1/8 = 3/4 × 8/1 = 6 قطع.
تذكر: في القسمة نعكس الكسر الثاني قبل الضرب، وفي الضرب نبسط الناتج في النهاية.`,
              },
            },
            {
              code: "l-ratio",
              title: "النسبة والتناسب",
              concepts: ["النسبة", "التناسب"],
              doc: {
                title: "النسبة والتناسب",
                content: `درس النسبة والتناسب.
النسبة: مقارنة بين كميتين من النوع نفسه، وتكتب على الصورة أ : ب أو كسرًا أ/ب. مثال: نسبة الأولاد إلى البنات في صف هي 12 : 8 أي 3 : 2 بعد التبسيط.
التناسب: تساوي نسبتين، مثل 2/3 = 4/6. عند الحل نستخدم الضرب التبادلي: 2 × 6 = 3 × 4.
مثال تطبيقي: في رحلة مدرسية سار الطلاب 3 كيلومترات في 30 دقيقة. فكم كيلومترًا يقطعون في 50 دقيقة بالسرعة نفسها؟ نكون التناسب 3/30 = س/50، إذن 30 س = 150، فس = 5 كيلومترات.
تذكر: النسبة تشبه الكسر، وتبسيطها إلى أبسط صورة يجعل المقارنة أوضح.`,
              },
            },
          ],
        },
        {
          code: "unit-3",
          title: "الهندسة والقياس",
          lessons: [
            {
              code: "l-perimeter",
              title: "المحيط",
              concepts: ["محيط المضلع", "محيط الدائرة"],
              doc: {
                title: "محيط المضلع ومحيط الدائرة",
                content: `درس المحيط.
محيط المضلع: مجموع أطوال أضلاعه. محيط المربع = 4 × طول الضلع، ومحيط المستطيل = 2 × (الطول + العرض). مثال: مستطيل طوله 9 سم وعرضه 5 سم، محيطه = 2 × (9 + 5) = 28 سم.
محيط الدائرة: يحسب بالعلاقة المحيط = ط × القطر، حيث ط = 3.14 تقريبًا. مثال: قطر عجلة دراجة 60 سم، فمحيطها = 3.14 × 60 = 188.4 سم.
مثال تطبيقي: حديقة مربعة طول ضلعها 25 مترًا، ما طول السياج المحيط بها؟ المحيط = 4 × 25 = 100 متر.
تذكر: المحيط يقيس الطول حول الشكل فيقاس بالسنتيمتر أو المتر، ولا يختلط بالمساحة التي تقيس السطح.`,
              },
            },
            {
              code: "l-area",
              title: "المساحة",
              concepts: ["مساحة المستطيل والمربع", "مساحة المثلث", "مساحة متوازي الأضلاع"],
              doc: {
                title: "مساحة المستطيل والمثلث ومتوازي الأضلاع",
                content: `درس المساحة.
مساحة المستطيل = الطول × العرض، ومساحة المربع = طول الضلع × نفسه. مثال: مستطيل طوله 12 سم وعرضه 7 سم، مساحته = 84 سم².
مساحة المثلث = (القاعدة × الارتفاع) ÷ 2. مثال: مثلث قاعدته 10 سم وارتفاعه 6 سم، مساحته = (10 × 6) ÷ 2 = 30 سم².
مساحة متوازي الأضلاع = القاعدة × الارتفاع، والارتفاع عمودي على القاعدة. مثال: قاعدة 8 سم وارتفاع 5 سم، المساحة = 40 سم².
مثال تطبيقي: سجادة مستطيلة طولها 4 أمتار وعرضها 3 أمتار، ما مساحتها؟ المساحة = 4 × 3 = 12 مترًا مربعًا.
تذكر: المساحة تقاس بالوحدات المربعة مثل سم² وم²، والارتفاع عمودي دائمًا على القاعدة.`,
              },
            },
            {
              code: "l-measure",
              title: "القياس والتحويل بين الوحدات",
              concepts: ["وحدات الطول والكتلة", "التحويل بين الوحدات"],
              doc: {
                title: "القياس والتحويل بين الوحدات",
                content: `درس القياس والتحويل بين الوحدات.
وحدات الطول: المتر هو الأساس، والسنتيمتر أصغر منه حيث 1 م = 100 سم، والكيلومتر أكبر حيث 1 كم = 1000 م. وحدات الكتلة: الكيلوجرام والجرام حيث 1 كجم = 1000 جم.
التحويل من كبير إلى صغير: نضرب في معامل التحويل. مثال: 3 أمتار = 3 × 100 = 300 سم، و2 كجم = 2000 جم.
التحويل من صغير إلى كبير: نقسم على معامل التحويل. مثال: 5000 جرام = 5000 ÷ 1000 = 5 كجم.
مثال تطبيقي: تزن حقيبة مدرسية 3 كيلوجرامات ونصف، فكم جرامًا تزن؟ 3.5 × 1000 = 3500 جرام.
تذكر: حدد أولًا هل التحويل إلى وحدة أكبر أم أصغر، فضرب للصغير وقسم للكبير.`,
              },
            },
          ],
        },
        {
          code: "unit-4",
          title: "الإحصاء والاحتمال",
          lessons: [
            {
              code: "l-stats",
              title: "المتوسط الحسابي والوسيط",
              concepts: ["المتوسط الحسابي", "الوسيط"],
              doc: {
                title: "المتوسط الحسابي والوسيط",
                content: `درس المتوسط الحسابي والوسيط.
المتوسط الحسابي: مجموع القيم مقسوم على عددها. مثال: درجات خمسة طلاب هي 7، 8، 9، 6، 10، فالمتوسط = (7 + 8 + 9 + 6 + 10) ÷ 5 = 40 ÷ 5 = 8.
الوسيط: القيمة الوسطى بعد ترتيب القيم تصاعديًا. إذا كان عدد القيم فرديًا فالوسيط هو القيمة الوسطى تمامًا، وإذا كان زوجيًا فهو متوسط القيمتين الأوسطين. مثال: القيم 4، 7، 9، 11، 15 متوسطها 9.
مثال تطبيقي: عدد صفحات القراءة في ستة أيام: 10، 12، 10، 14، 12، 14. المتوسط = 72 ÷ 6 = 12 صفحة، وبعد الترتيب 10، 10، 12، 12، 14، 14 يكون الوسيط = 12.
تذكر: المتوسط يتأثر بالقيم المتطرفة، أما الوسيط فيبقى مستقرًا، فنختار الأنسب حسب المسألة.`,
              },
            },
            {
              code: "l-probability",
              title: "الاحتمال",
              concepts: ["الاحتمال", "الأحداث المؤكدة والمستحيلة"],
              doc: {
                title: "الاحتمال والأحداث المؤكدة والمستحيلة",
                content: `درس الاحتمال.
الاحتمال: نسبة حدوث حدث إلى النتائج الممكنة كلها. احتمال الحدث = عدد النتائج المفضلة ÷ عدد النتائج الممكنة. مثال: احتمال ظهور عدد زوجي عند رمي مكعب أرقام هو 3 ÷ 6 = 1/2.
الأحداث المؤكدة والمستحيلة: الحدث المؤكد وقوعه احتماله 1، مثل ظهور يوم بعد الليل. والحدث المستحيل احتماله 0، مثل ظهور الرقم 7 على مكعب أرقام عادٍ.
مثال تطبيقي: في كيس 3 كرات حمراء وكرتان زرقاوان، ما احتمال سحب كرة زرقاء؟ النتائج المفضلة 2 والكل 5، فالاحتمال 2/5.
تذكر: الاحتمال دائمًا عدد بين 0 و1، والكلمات مثل أكيد وممكن ومستحيل تصف حالاته المختلفة.`,
              },
            },
          ],
        },
      ],
    },
    {
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
                content: `درس الأعداد العشرية والعمليات عليها.
قراءة العدد العشري: نقرأ الجزء الصحيح ثم كلمة (و) ثم الجزء العشري. مثال: 3.45 يقرأ ثلاثة و45 من مئة، وأول منزلة بعد الفاصلة هي الأعشار.
ترتيب الأعداد العشرية: نقارن الجزء الصحيح أولًا، ثم ننظر إلى منزلة الأعشار فالجزء من مئة. مثال: 4.3 أصغر من 4.35 لأن 3 أعشار أصغر من 35 من مئة.
جمع الأعداد العشرية وطرحها: نرتب الأرقام بحيث تقع الفواصل تحت بعضها ثم نجمع أو نطرح منزلة لمنزلة. مثال: 12.5 + 3.75 = 16.25.
مثال تطبيقي: اشترى سامي أقلامًا بـ12.75 جنيه ودفترًا بـ7.5 جنيهات. كم دفع؟ 12.75 + 7.50 = 20.25 جنيهًا.
تذكر: أضف أصفارًا نهاية العدد العشري لتساوي عدد المنازل قبل الجمع أو الطرح.`,
              },
            },
            {
              code: "l-rational",
              title: "الأعداد النسبية",
              concepts: ["الأعداد النسبية الموجبة والسالبة", "تمثيل الأعداد النسبية على خط الأعداد"],
              doc: {
                title: "الأعداد النسبية الموجبة والسالبة",
                content: `درس الأعداد النسبية.
الأعداد النسبية: كل عدد يمكن كتابته على صورة أ/ب حيث ب لا يساوي صفرًا، وتشمل الأعداد الصحيحة الموجبة والسالبة والكسور. أمثلة: -3، 1/2، 0.75 أعداد نسبية.
الموجبة والسالبة: الموجبة أكبر من صفر وتقع يمين الصفر على خط الأعداد، والسالبة أصغر من صفر وتقع يسار الصفر. مثال: -4 أصغر من 2 لأنها تقع على يسار الصفر.
تمثيل الأعداد النسبية على خط الأعداد: لكل عدد نسبي نقطة واحدة على الخط، وتقسم المسافة بين صفر و1 حسب المقام. مثال: 3/4 تقع بين 0 و1 قرب 1، والعدد -3/4 يقع على يسار الصفر.
مثال تطبيقي: بلغت درجة حرارة مدينة خمس درجات تحت الصفر، فكيف نكتبها؟ نكتبها -5 درجات.
تذكر: كلما اتجهت يسارًا على خط الأعداد قلت القيمة، وكلما اتجهت يمينًا زادت.`,
              },
            },
            {
              code: "l-equations",
              title: "المعادلات والمسائل اللفظية",
              concepts: ["حل معادلة من خطوة", "كتابة المعادلة من مسألة لفظية"],
              doc: {
                title: "المعادلات والمسائل اللفظية",
                content: `درس المعادلات والمسائل اللفظية.
المعادلة: جملة رياضية تعبر عن تساوي مقدارين وتحتوي مجهولًا. مثال: س + 7 = 15، والمجهول يمثل قيمة نبحث عنها.
حل معادلة من خطوة: نعزل المجهول في طرف باستخدام العملية العكسية. مثال: في س + 7 = 15 نطرح 7 من الطرفين فس = 8. وفي 3 س = 12 نقسم الطرفين على 3 فس = 4.
كتابة المعادلة من مسألة لفظية: نختار رمزًا للمجهول ونترجم الجملة إلى معادلة. مثال: إذا كان عدد الورود في الباقة مضافًا إليه 5 يساوي 20، فنكتب س + 5 = 20.
مثال تطبيقي: ثمن قلمين و3 جنيهات يساوي 11 جنيهًا. ما ثمن القلم الواحد؟ المعادلة 2 س + 3 = 11، إذن 2 س = 8، فس = 4 جنيهات.
تذكر: ما تفعله في أحد الطرفين افعله في الطرف الآخر، وتحقق من الحل بتعويض القيمة في المعادلة الأصلية.`,
              },
            },
          ],
        },
      ],
    },
  ],
};

/** Saudi (KSA) Grade-6 Math skeleton — proves the architecture is truly regional (PHASE 16). */
export const SAUDI_SPEC: CountrySeedSpec = {
  country: { code: "sa", name: "Saudi Arabia", nameAr: "السعودية" },
  system: { code: "sa-ministry", name: "Ministry of Education", nameAr: "وزارة التعليم", sortOrder: 1 },
  grade: { code: "sa-grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  curriculum: { code: "sa-g6-math", title: "الرياضيات للصف السادس الابتدائي" },
  terms: [
    {
      code: "sa-term-1",
      title: "الفصل الدراسي الأول",
      units: [
        {
          code: "sa-unit-1",
          title: "الأعداد والعمليات عليها",
          lessons: [
          {
            code: "l-sa-ops",
            title: "العمليات على الأعداد الطبيعية",
            concepts: ["الجمع مع إعادة التجميع", "الضرب في مضاعفات العشرة"],
            doc: {
              title: "العمليات على الأعداد الطبيعية",
              content: `درس العمليات على الأعداد الطبيعية.
الجمع مع إعادة التجميع: عند جمع 2754 + 386 نبدأ من الآحاد: 4 + 6 = 10، نكتب 0 ونرفع 1 للعشرات. ثم العشرات: 5 + 8 + 1 = 14، نكتب 4 ونرفع 1 للمئات. المئات: 7 + 3 + 1 = 11، نكتب 1 ونرفع 1 للألوف. والألوف: 2 + 1 = 3. الناتج 3140.
الضرب في مضاعفات العشرة: لضرب 43 × 20 نضرب 43 × 2 = 86 ثم نضيف صفرًا فيصبح 860.
مثال تطبيقي: اشترى خالد في سوق مدينة الرياض 15 دفترًا، ثمن الدفتر الواحد 9 ريالات سعودية. كم دفع؟ 15 × 9 = 135 ريالًا سعوديًا.
تذكر: البدء دائمًا من الآحاد، وكتابة أرقام النقل بعناية يمنع الأخطاء الشائعة في الجمع والضرب.`,
            },
          },
          {
            code: "l-sa-units",
            title: "القياس والوحدات المترية",
            concepts: ["وحدات الطول", "التحويل بين الوحدات المترية"],
            doc: {
              title: "القياس والوحدات المترية",
              content: `درس القياس والوحدات المترية.
وحدات الطول: المتر هو الوحدة الأساسية، والمليمتر والسنتيمتر والكيلومتر وحدات فرعية ومضاعفات. المتر الواحد يساوي 100 سنتيمتر، والكيلومتر يساوي 1000 متر.
التحويل بين الوحدات: للتحويل من وحدة كبيرة إلى أصغر نضرب، ومن أصغر إلى أكبر نقسم. مثال: 3 كيلومترات = 3000 متر؛ و250 سنتيمترًا = 2.5 متر.
مثال تطبيقي: يقيس فريق طلاب في مدينة جدة ساحة المدرسة، فوجدوا طولها 120 مترًا. ما طول الساحة بالسنتيمتر؟ 120 × 100 = 12000 سنتيمتر.
تذكر: حدد هل تتحول من كبير إلى صغير (اضرب) أم من صغير إلى كبير (اقسم) قبل الإجابة.`,
            },
          },
          ],
        },
      ],
    },
  ],
};

/**
 * Egyptian Grade-6 **English** curriculum (PHASE 38) — the second subject under
 * the same country/system/grade, so the picker shows two real curricula and the
 * tutor's reply language can be observed end-to-end. Lesson content is English
 * (that is the point), titles bilingual so the Arabic UI stays readable.
 */
export const EGYPT_ENGLISH_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  curriculum: { code: "eg-g6-english", title: "اللغة الإنجليزية للصف السادس الابتدائي" },
  terms: [
    {
      code: "en-term-1",
      title: "الفصل الدراسي الأول",
      units: [
        {
          code: "en-unit-1",
          title: "الوحدة الأولى: Family and Friends — العائلة والأصدقاء",
          lessons: [
          {
            code: "l-en-present-simple",
            title: "Present Simple — المضارع البسيط",
            concepts: ["The verb 'to be'", "Third person singular with -s"],
            doc: {
              title: "Present simple: the verb to be and the -s form",
              content: `Lesson: Present simple.
The verb "to be": we use am, is and are. Use "am" with I: I am a student. Use "is" with he, she and it: She is my sister. Use "are" with you, we and they: They are my friends.
Third person singular: when the subject is he, she or it, we add -s to the verb in the present simple. Example: I play football, but he plays football. The negative uses "does not": He does not play football. The question uses "do you": Do you play football?
Example: Sara lives in Cairo and her brother lives in Giza. Every day Sara goes to school by bus and she arrives at seven o'clock.
Remember: add -s only for he, she and it (and for I am / he is / they are with the verb to be).`,
            },
          },
          {
            code: "l-en-family",
            title: "Family Members and Possessives — أفراد العائلة والملكية",
            concepts: ["Family vocabulary", "Possessive adjectives (my, your, his, her)"],
            doc: {
              title: "Family members and possessive adjectives",
              content: `Lesson: Family members and possessives.
Family vocabulary: father, mother, brother, sister, grandfather, grandmother, uncle, aunt, cousin.
Possessive adjectives: my (for I), your (for you), his (for he), her (for she), its (for it), our (for we), their (for they). Examples: This is my father. That is her bag.
Example: Ahmed is my cousin. His father is a teacher and her mother is a doctor. Their house is near the school.
Remember: "her" comes before a noun that starts with a vowel sound, and "his" is used for things and people alike.`,
            },
          },
          ],
        },
      ],
    },
  ],
};

/**
 * Idempotent multi-country seeder: Egypt (original) + Saudi Arabia (PHASE 16)
 * Grade-6 Math skeletons + Egypt's Grade-6 English curriculum (PHASE 38) +
 * sample lesson documents (→ chunks → mock embeddings) + demo accounts for the
 * manual vertical slice. Running twice is a no-op.
 * The global subject catalog is shared across countries (reused, never duplicated).
 */
async function main(): Promise<void> {
  const db = openDbAndMigrate();
  const ai = new AiService(db, { forceProvider: "mock" });
  // Seed always writes locally — the default factory flavor stays sqlite unless env says otherwise.
  const vectorStore = createVectorStore(db, { kind: "sqlite" });
  const knowledge = new KnowledgeService(db, ai, vectorStore);
  const curriculum = new CurriculumService(db);

  const egypt = await seedCountry(db, knowledge, EGYPT_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH_SPEC);
  await seedCountry(db, knowledge, SAUDI_SPEC);
  await seedUsers(db, curriculum, egypt);

  db.sqlite.close();
  console.log("✓ Seed complete — Egypt (Math + English) + Saudi Grade-6 Math, demo accounts, RAG corpora ready.");
}

/**
 * Idempotent per-LEVEL seeder for one curriculum spec. Every level is created
 * only when missing, so a spec may hang under a country/system/grade that the
 * previous spec already created (PHASE 38: Egypt's English curriculum lives
 * under the same country + system + grade as Egypt's Math one) and re-running
 * the seeder stays a no-op.
 */
export async function seedCountry(db: DbHandle, knowledge: KnowledgeService, spec: CountrySeedSpec): Promise<Seeded> {
  const now = new Date();
  let created = false;

  let c = await db.db.select().from(countries).where(eq(countries.code, spec.country.code)).get();
  if (!c) {
    c = { id: newId("c"), code: spec.country.code, name: spec.country.name, nameAr: spec.country.nameAr };
    await db.db.insert(countries).values(c);
    created = true;
  }
  let sys = await db.db.select().from(educationSystems).where(and(eq(educationSystems.countryId, c.id), eq(educationSystems.code, spec.system.code))).get();
  if (!sys) {
    sys = { id: newId("sys"), countryId: c.id, code: spec.system.code, name: spec.system.name, nameAr: spec.system.nameAr, sortOrder: spec.system.sortOrder };
    await db.db.insert(educationSystems).values(sys);
    created = true;
  }
  let g = await db.db.select().from(grades).where(and(eq(grades.educationSystemId, sys.id), eq(grades.code, spec.grade.code))).get();
  if (!g) {
    g = { id: newId("g"), educationSystemId: sys.id, code: spec.grade.code, name: spec.grade.name, nameAr: spec.grade.nameAr, levelOrder: spec.grade.levelOrder };
    await db.db.insert(grades).values(g);
    created = true;
  }

  // The subject catalog is global and shared across countries — reuse it when a
  // previous country (or a previous spec) already created it, never duplicate.
  const subjectSpec = spec.subject ?? { code: "math", name: "Mathematics", nameAr: "الرياضيات" };
  let subj = await db.db.select().from(subjects).where(eq(subjects.code, subjectSpec.code)).get();
  if (!subj) {
    subj = { id: newId("subj"), ...subjectSpec };
    await db.db.insert(subjects).values(subj);
    created = true;
  }

  let cur = await db.db.select().from(curricula).where(eq(curricula.code, spec.curriculum.code)).get();
  if (!cur) {
    cur = { id: newId("cur"), countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, code: spec.curriculum.code, title: spec.curriculum.title, version: "1.0", isActive: true, createdAt: now };
    await db.db.insert(curricula).values(cur);
    created = true;
  }
  const lessonsMap: Record<string, SeededLesson> = {};
  for (const [ti, termSpec] of spec.terms.entries()) {
    let term = await db.db.select().from(terms).where(and(eq(terms.curriculumId, cur.id), eq(terms.code, termSpec.code))).get();
    if (!term) {
      term = { id: newId("t"), curriculumId: cur.id, code: termSpec.code, title: termSpec.title, sortOrder: ti + 1 };
      await db.db.insert(terms).values(term);
      created = true;
    }
    for (const [ui, unitSpec] of termSpec.units.entries()) {
      let unit = await db.db.select().from(units).where(and(eq(units.termId, term.id), eq(units.code, unitSpec.code))).get();
      if (!unit) {
        unit = { id: newId("u"), termId: term.id, code: unitSpec.code, title: unitSpec.title, sortOrder: ui + 1 };
        await db.db.insert(units).values(unit);
        created = true;
      }
      for (const [i, lessonSpec] of unitSpec.lessons.entries()) {
        let lesson = await db.db.select().from(lessons).where(and(eq(lessons.unitId, unit.id), eq(lessons.code, lessonSpec.code))).get();
        if (!lesson) {
          lesson = { id: newId("l"), unitId: unit.id, code: lessonSpec.code, title: lessonSpec.title, sortOrder: i + 1 };
          await db.db.insert(lessons).values(lesson);
          created = true;
        }
        lessonsMap[lessonSpec.code] = { lessonId: lesson.id, termId: term.id, unitId: unit.id };
        await reconcileConcepts(db, lesson.id, lessonSpec);
      }
    }
  }

  if (created) console.log(`✓ Curriculum skeleton ready (${spec.country.nameAr} — ${spec.curriculum.title}).`);

  const seeded = { countryId: c.id, systemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, lessons: lessonsMap };
  await ingestLessonDocuments(db, knowledge, seeded, spec);
  await ensureDemoQuestions(db, seeded, demoQuestionsOf(spec.curriculum.code));
  await ensureDemoOpenQuestions(db, seeded, demoOpenQuestionsOf(spec.curriculum.code));
  return seeded;
}

/**
 * PHASE 43 — concept seeding converges instead of freezing. Existing concepts
 * are matched by title, missing ones are inserted, and codes are reconciled to
 * `c-<lesson-code>-<n>`: lesson-scoped, so numbering never collides across
 * units the way a per-spec index would. Identity is the row id — the code is a
 * display/order key, which is exactly why renumbering it here is safe.
 */
async function reconcileConcepts(db: DbHandle, lessonId: string, lessonSpec: LessonSeedSpec): Promise<void> {
  const existing = await db.db.select().from(concepts).where(eq(concepts.lessonId, lessonId)).orderBy(asc(concepts.code));
  const byTitle = new Map(existing.map((row) => [row.title, row]));
  for (const [j, title] of lessonSpec.concepts.entries()) {
    const code = `c-${lessonSpec.code}-${j + 1}`;
    const row = byTitle.get(title);
    if (row) {
      if (row.code !== code) {
        await db.db.update(concepts).set({ code }).where(eq(concepts.id, row.id));
      }
    } else {
      await db.db.insert(concepts).values({
        id: newId("con"),
        lessonId,
        code,
        title,
        description: `مفهوم ${title} من درس ${lessonSpec.title}`,
      });
    }
  }
}

async function ingestLessonDocuments(db: DbHandle, knowledge: KnowledgeService, seeded: Seeded, spec: CountrySeedSpec): Promise<void> {
  for (const term of spec.terms) {
    for (const unit of term.units) {
      for (const lessonSpec of unit.lessons) {
        if (!lessonSpec.doc) continue;
        const scoped = seeded.lessons[lessonSpec.code]!;
        const existing = await db.db.select({ id: chunks.id }).from(chunks).where(eq(chunks.lessonId, scoped.lessonId)).limit(1);
        if (existing.length > 0) {
          console.log(`  ↺ Document for "${lessonSpec.doc.title}" already ingested — skipped.`);
          continue;
        }
        await knowledge.ingestText({
          title: lessonSpec.doc.title,
          content: lessonSpec.doc.content,
          kind: "text",
          source: `seed:${spec.curriculum.code}-sample`,
          scope: {
            countryId: seeded.countryId,
            educationSystemId: seeded.systemId,
            gradeId: seeded.gradeId,
            subjectId: seeded.subjectId,
            curriculumId: seeded.curriculumId,
            termId: scoped.termId,
            unitId: scoped.unitId,
            lessonId: scoped.lessonId,
          },
        });
        console.log(`  ✓ Ingested "${lessonSpec.doc.title}" → chunks + vectors.`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 24 — demo practice questions (Egyptian curriculum). Seeded
// idempotently so `npm run db:seed` never duplicates them; they feed the
// practice loop that drives the concept-mastery engine. Saudi Arabia
// intentionally has none — proof the practice scope is truly per-curriculum.
// PHASE 30 — demo OPEN (free-text) questions for the same curriculum, with a
// hidden `answerKey` the server grades via the `grade_open` AI operation.
// ---------------------------------------------------------------------------

interface DemoQuestionSpec {
  lessonCode: string;
  conceptTitle?: string;
  difficulty: "easy" | "medium" | "hard";
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface DemoOpenQuestionSpec {
  lessonCode: string;
  conceptTitle?: string;
  difficulty: "easy" | "medium" | "hard";
  content: string;
  answerKey: string;
  explanation: string;
}

const EGYPT_DEMO_QUESTIONS: DemoQuestionSpec[] = [
  {
    lessonCode: "l-add-sub",
    conceptTitle: "الجمع مع إعادة التجميع",
    difficulty: "easy",
    content: "ما ناتج 487 + 358 مع إعادة التجميع؟",
    options: ["745", "835", "845", "855"],
    correctIndex: 2,
    explanation: "الآحاد: 7 + 8 = 15 نكتب 5 ونرفع 1. العشرات: 8 + 5 + 1 = 14 نكتب 4 ونرفع 1. المئات: 4 + 3 + 1 = 8. الناتج 845.",
  },
  {
    lessonCode: "l-add-sub",
    conceptTitle: "الطرح مع الاستلاف",
    difficulty: "medium",
    content: "ما ناتج 503 − 267 باستخدام الاستلاف؟",
    options: ["236", "246", "226", "336"],
    correctIndex: 0,
    explanation: "نستلف من المئات: 400، وتصبح العشرات 9 والآحاد 13. 13 − 7 = 6، 9 − 6 = 3، 4 − 2 = 2. الناتج 236.",
  },
  {
    lessonCode: "l-mul-div",
    conceptTitle: "الضرب في عدد من رقمين",
    difficulty: "medium",
    content: "ما ناتج 34 × 12؟",
    options: ["408", "340", "368", "428"],
    correctIndex: 0,
    explanation: "نضرب أولًا 34 × 2 = 68 ثم 34 × 10 = 340 ونجمع: 68 + 340 = 408.",
  },
  {
    lessonCode: "l-mul-div",
    conceptTitle: "القسمة المطولة",
    difficulty: "easy",
    content: "ما ناتج 78 ÷ 3 بالقسمة المطولة؟",
    options: ["26", "24", "23", "28"],
    correctIndex: 0,
    explanation: "7 ÷ 3 = 2 والباقي 1، ننزل 8 فتصبح 18، و18 ÷ 3 = 6. الناتج 26.",
  },
  {
    lessonCode: "l-fractions",
    conceptTitle: "تبسيط الكسور",
    difficulty: "easy",
    content: "بعد تبسيط الكسر 8/12 يصبح:",
    options: ["2/3", "4/6", "3/4", "1/2"],
    correctIndex: 0,
    explanation: "نقسم البسط والمقام على العامل المشترك الأكبر 4: 8 ÷ 4 = 2 و 12 ÷ 4 = 3، فيصبح 2/3.",
  },
  {
    lessonCode: "l-fractions",
    conceptTitle: "جمع الكسور ذات المقامات المتشابهة",
    difficulty: "easy",
    content: "ما ناتج 1/4 + 2/4؟",
    options: ["3/4", "3/8", "2/4", "1/2"],
    correctIndex: 0,
    explanation: "نجمع البسطين ونُبقي المقام كما هو: 1 + 2 = 3، إذن الناتج 3/4.",
  },
  {
    lessonCode: "l-primes",
    conceptTitle: "الأعداد الأولية",
    difficulty: "easy",
    content: "ما العدد الأولي من بين الأعداد التالية؟",
    options: ["9", "15", "17", "21"],
    correctIndex: 2,
    explanation: "العدد الأولي لا يقبل القسمة إلا على نفسه وعلى الواحد، ومن بين الخيارات 17 أولي لأن 9 و15 و21 لها قواسم أخرى.",
  },
  {
    lessonCode: "l-gcd-lcm",
    conceptTitle: "القاسم المشترك الأكبر",
    difficulty: "medium",
    content: "ما القاسم المشترك الأكبر للعددين 12 و18؟",
    options: ["3", "6", "9", "2"],
    correctIndex: 1,
    explanation: "قواسم 12: 1، 2، 3، 4، 6، 12 وقواسم 18: 1، 2، 3، 6، 9، 18، فالقاسم المشترك الأكبر هو 6.",
  },
  {
    lessonCode: "l-gcd-lcm",
    conceptTitle: "المضاعف المشترك الأصغر",
    difficulty: "medium",
    content: "ما المضاعف المشترك الأصغر للعددين 4 و6؟",
    options: ["12", "24", "18", "6"],
    correctIndex: 0,
    explanation: "مضاعفات 4: 4، 8، 12، 16 ومضاعفات 6: 6، 12، 18، فالمضاعف المشترك الأصغر هو 12.",
  },
  {
    lessonCode: "l-frac-ops",
    conceptTitle: "جمع الكسور باختلاف المقامات",
    difficulty: "easy",
    content: "ما ناتج 1/2 + 1/3؟",
    options: ["2/5", "5/6", "2/6", "1/5"],
    correctIndex: 1,
    explanation: "نوحد المقامات على 6: 1/2 = 3/6 و1/3 = 2/6، إذن الناتج 3/6 + 2/6 = 5/6.",
  },
  {
    lessonCode: "l-ratio",
    conceptTitle: "النسبة",
    difficulty: "easy",
    content: "في صف دراسي 12 أولادًا و8 بنات، ما نسبة الأولاد إلى البنات في أبسط صورة؟",
    options: ["12 : 8", "3 : 2", "2 : 3", "6 : 4"],
    correctIndex: 1,
    explanation: "نقسم طرفي النسبة 12 : 8 على العامل المشترك الأكبر 4، فنحصل على 3 : 2.",
  },
  {
    lessonCode: "l-area",
    conceptTitle: "مساحة المستطيل والمربع",
    difficulty: "easy",
    content: "ما مساحة مستطيل طوله 12 سم وعرضه 7 سم؟",
    options: ["84 سم²", "38 سم", "19 سم²", "48 سم²"],
    correctIndex: 0,
    explanation: "المساحة = الطول × العرض = 12 × 7 = 84 سم²، وتقاس بالوحدات المربعة.",
  },
];

/**
 * PHASE 30 — demo OPEN questions (free-text, graded by `grade_open`). The
 * answerKey is a short grounded fact (the seeded MCQ explanations use the same
 * wording), so a student writing the exact fact scores 1.0 deterministically.
 */
const EGYPT_DEMO_OPEN_QUESTIONS: DemoOpenQuestionSpec[] = [
  {
    lessonCode: "l-fractions",
    conceptTitle: "تبسيط الكسور",
    difficulty: "easy",
    content: "اكتب الكسر المبسّط للكسر 8/12.",
    answerKey: "2/3",
    explanation: "نقسم البسط والمقام على العامل المشترك الأكبر 4: 8 ÷ 4 = 2 و 12 ÷ 4 = 3، فيصبح 2/3.",
  },
  {
    lessonCode: "l-mul-div",
    conceptTitle: "القسمة المطولة",
    difficulty: "medium",
    content: "ما ناتج 78 ÷ 3 بالقسمة المطولة؟ اكتب إجابتك.",
    answerKey: "26",
    explanation: "7 ÷ 3 = 2 والباقي 1، ننزل 8 فتصبح 18، و18 ÷ 3 = 6. الناتج 26.",
  },
  {
    lessonCode: "l-primes",
    conceptTitle: "الأعداد الأولية",
    difficulty: "easy",
    content: "اكتب العدد الأولي الزوجي الوحيد.",
    answerKey: "2",
    explanation: "العدد 2 هو العدد الأولي الزوجي الوحيد، لأنه لا يقبل القسمة إلا على نفسه وعلى الواحد.",
  },
  {
    lessonCode: "l-frac-ops",
    conceptTitle: "جمع الكسور باختلاف المقامات",
    difficulty: "medium",
    content: "ما ناتج 3/4 + 1/2؟ اكتب إجابتك في صورة كسر.",
    answerKey: "5/4",
    explanation: "نوحد المقامات على 4: 3/4 + 2/4 = 5/4.",
  },
];

/** PHASE 38 — two English MCQs so the new curriculum has a working practice loop. */
const EGYPT_ENGLISH_DEMO_QUESTIONS: DemoQuestionSpec[] = [
  {
    lessonCode: "l-en-present-simple",
    conceptTitle: "Third person singular with -s",
    difficulty: "easy",
    content: "Choose the correct sentence: he ___ to school by bus.",
    options: ["go", "goes", "going", "gone"],
    correctIndex: 1,
    explanation: "With he / she / it we add -s to the verb in the present simple: he goes.",
  },
  {
    lessonCode: "l-en-present-simple",
    conceptTitle: "The verb 'to be'",
    difficulty: "easy",
    content: "Choose the correct sentence: My sister ___ a teacher.",
    options: ["are", "am", "is", "be"],
    correctIndex: 2,
    explanation: "We use \"is\" with he, she and it: she is a teacher.",
  },
];

/** Per-curriculum demo question set — keyed by curriculum code, not country. */
function demoQuestionsOf(curriculumCode: string): DemoQuestionSpec[] {
  if (curriculumCode === "eg-g6-math") return EGYPT_DEMO_QUESTIONS;
  if (curriculumCode === "eg-g6-english") return EGYPT_ENGLISH_DEMO_QUESTIONS;
  return [];
}

/** Per-curriculum demo OPEN question set — Egypt Math only (PHASE 30). */
function demoOpenQuestionsOf(curriculumCode: string): DemoOpenQuestionSpec[] {
  return curriculumCode === "eg-g6-math" ? EGYPT_DEMO_OPEN_QUESTIONS : [];
}

/** Insert each missing demo question for its lesson/concept (idempotent). */
async function ensureDemoQuestions(db: DbHandle, seeded: Seeded, specs: DemoQuestionSpec[]): Promise<void> {
  for (const q of specs) {
    const scoped = seeded.lessons[q.lessonCode];
    if (!scoped) continue;
    const lessonId = scoped.lessonId;
    if (!q.options[q.correctIndex]) continue;
    const existing = await db.db
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.lessonId, lessonId), eq(questions.content, q.content)))
      .limit(1);
    if (existing.length > 0) continue;
    const conceptId = q.conceptTitle
      ? (await db.db.select({ id: concepts.id }).from(concepts).where(and(eq(concepts.lessonId, lessonId), eq(concepts.title, q.conceptTitle))).limit(1).get())?.id ?? null
      : null;
    await db.db.insert(questions).values({
      id: newId("q"),
      curriculumId: seeded.curriculumId,
      lessonId,
      conceptId,
      difficulty: q.difficulty,
      type: "mcq",
      content: q.content,
      explanation: q.explanation,
      optionsJson: JSON.stringify({ options: q.options, correctIndex: q.correctIndex }),
      answerKey: null,
      createdAt: new Date(),
    });
    console.log(`  ✓ Seeded practice question "${q.content}"`);
  }
}

/** Insert each missing demo OPEN question (idempotent; answerKey stays server-side). */
async function ensureDemoOpenQuestions(db: DbHandle, seeded: Seeded, specs: DemoOpenQuestionSpec[]): Promise<void> {
  for (const q of specs) {
    const scoped = seeded.lessons[q.lessonCode];
    if (!scoped) continue;
    const lessonId = scoped.lessonId;
    const existing = await db.db
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.lessonId, lessonId), eq(questions.content, q.content)))
      .limit(1);
    if (existing.length > 0) continue;
    const conceptId = q.conceptTitle
      ? (await db.db.select({ id: concepts.id }).from(concepts).where(and(eq(concepts.lessonId, lessonId), eq(concepts.title, q.conceptTitle))).limit(1).get())?.id ?? null
      : null;
    await db.db.insert(questions).values({
      id: newId("q"),
      curriculumId: seeded.curriculumId,
      lessonId,
      conceptId,
      difficulty: q.difficulty,
      type: "open",
      content: q.content,
      explanation: q.explanation,
      optionsJson: null,
      answerKey: q.answerKey,
      createdAt: new Date(),
    });
    console.log(`  ✓ Seeded practice open question "${q.content}"`);
  }
}

async function seedUsers(db: DbHandle, curriculum: CurriculumService, seeded: Seeded): Promise<void> {
  const demoStudentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@alfarouq.test";
  const demoStudentPassword = process.env.SEED_STUDENT_PASSWORD ?? "student-demo-123";
  const demoAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@alfarouq.test";
  const demoAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin-demo-123";
  const demoParentEmail = process.env.SEED_PARENT_EMAIL ?? "parent@alfarouq.test";
  const demoParentPassword = process.env.SEED_PARENT_PASSWORD ?? "parent-demo-123";
  // Fixed, known code: lets the demo parent link the demo student in E2E/dev.
  const demoLinkCode = process.env.SEED_PARENT_LINK_CODE ?? "SLH7KQ9M";

  let studentId: string | null = null;
  const studentAccount = await db.db.select().from(users).where(eq(users.email, demoStudentEmail)).get();
  if (!studentAccount) {
    const now = new Date();
    const userId = newId("usr");
    await db.db.insert(users).values({
      id: userId,
      email: demoStudentEmail,
      passwordHash: await bcrypt.hash(demoStudentPassword, 12),
      role: "student",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    studentId = newId("stu");
    await db.db.insert(students).values({
      id: studentId,
      userId,
      displayName: "طالب تجريبي",
      countryId: seeded.countryId,
      gradeId: seeded.gradeId,
      parentLinkCode: demoLinkCode,
      createdAt: now,
      updatedAt: now,
    });
    await curriculum.enroll(studentId, seeded.curriculumId);
    console.log(`  ✓ Demo student created: ${demoStudentEmail}`);
  } else {
    console.log(`  ↺ Demo student exists: ${demoStudentEmail}`);
    // Backfill the link code on re-runs (students created before PHASE 18 lack one).
    const existing = await db.db.select().from(students).where(eq(students.userId, studentAccount.id)).get();
    studentId = existing?.id ?? null;
    if (existing && !existing.parentLinkCode) {
      await db.db
        .update(students)
        .set({ parentLinkCode: demoLinkCode, updatedAt: new Date() })
        .where(eq(students.userId, studentAccount.id));
      console.log(`  ✓ Demo student parent-link code backfilled: ${demoLinkCode}`);
    }
  }

  const adminAccount = await db.db.select().from(users).where(eq(users.email, demoAdminEmail)).get();
  if (!adminAccount) {
    const now = new Date();
    await db.db.insert(users).values({
      id: newId("usr"),
      email: demoAdminEmail,
      passwordHash: await bcrypt.hash(demoAdminPassword, 12),
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✓ Demo admin created: ${demoAdminEmail}`);
  } else {
    console.log(`  ↺ Demo admin exists: ${demoAdminEmail}`);
  }

  const parentAccount = await db.db.select().from(users).where(eq(users.email, demoParentEmail)).get();
  if (!parentAccount) {
    const now = new Date();
    const userId = newId("usr");
    await db.db.insert(users).values({
      id: userId,
      email: demoParentEmail,
      passwordHash: await bcrypt.hash(demoParentPassword, 12),
      role: "parent",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await db.db.insert(parents).values({ id: newId("par"), userId });
    console.log(`  ✓ Demo parent created: ${demoParentEmail}`);
  } else {
    console.log(`  ↺ Demo parent exists: ${demoParentEmail}`);
  }

  // PHASE 18: pre-link the demo parent ↔ demo student (idempotent).
  // Re-fetch the parent account: it may have just been created above.
  const parentRowForLink = await db.db.select().from(users).where(eq(users.email, demoParentEmail)).get();
  if (studentId && parentRowForLink) {
    const parentRow = await db.db.select().from(parents).where(eq(parents.userId, parentRowForLink.id)).get();
    const studentRow = await db.db.select().from(students).where(eq(students.id, studentId)).get();
    if (parentRow && studentRow) {
      const alreadyLinked = await db.db
        .select()
        .from(studentsParents)
        .where(and(eq(studentsParents.studentId, studentRow.id), eq(studentsParents.parentId, parentRow.id)))
        .get();
      if (!alreadyLinked) {
        await db.db.insert(studentsParents).values({ studentId: studentRow.id, parentId: parentRow.id });
        console.log(`  ✓ Demo parent linked to demo student (${demoLinkCode})`);
      } else {
        console.log("  ↺ Demo parent already linked to demo student");
      }
    }
  } else {
    console.log("  ↺ Demo student missing — skipping parent↔student link");
  }

  console.log(`\nDemo logins (dev only): student ${demoStudentEmail} / admin ${demoAdminEmail} / parent ${demoParentEmail} — insecure defaults, change in production via env.`);
}

// PHASE 43 — the seeder is importable for tests: it runs only when executed
// directly (the `npm run db:seed` script); importing it is inert.
const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
