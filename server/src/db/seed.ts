/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
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

interface Seeded {
  countryId: string;
  systemId: string;
  gradeId: string;
  subjectId: string;
  curriculumId: string;
  termId: string;
  unitId: string;
  lessonIds: Record<string, string>;
}

/** One country's curriculum skeleton + per-lesson RAG documents (PHASE 16: multi-country). */
interface CountrySeedSpec {
  country: { code: string; name: string; nameAr: string };
  system: { code: string; name: string; nameAr: string; sortOrder: number };
  grade: { code: string; name: string; nameAr: string; levelOrder: number };
  curriculum: { code: string; title: string };
  term: { code: string; title: string };
  unit: { code: string; title: string };
  lessons: Array<{
    code: string;
    title: string;
    concepts: string[];
    doc?: { title: string; content: string };
  }>;
}

type DbHandle = ReturnType<typeof openDbAndMigrate>;

/** Egyptian Grade-6 Math skeleton + sample lesson documents (original PHASE 1 seed). */
const EGYPT_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  curriculum: { code: "eg-g6-math", title: "الرياضيات للصف السادس الابتدائي" },
  term: { code: "term-1", title: "الفصل الدراسي الأول" },
  unit: { code: "unit-1", title: "الأعداد والعمليات عليها" },
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
  ],
};

/** Saudi (KSA) Grade-6 Math skeleton — proves the architecture is truly regional (PHASE 16). */
const SAUDI_SPEC: CountrySeedSpec = {
  country: { code: "sa", name: "Saudi Arabia", nameAr: "السعودية" },
  system: { code: "sa-ministry", name: "Ministry of Education", nameAr: "وزارة التعليم", sortOrder: 1 },
  grade: { code: "sa-grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  curriculum: { code: "sa-g6-math", title: "الرياضيات للصف السادس الابتدائي" },
  term: { code: "sa-term-1", title: "الفصل الدراسي الأول" },
  unit: { code: "sa-unit-1", title: "الأعداد والعمليات عليها" },
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
};

/**
 * Idempotent multi-country seeder: Egypt (original) + Saudi Arabia (PHASE 16)
 * Grade-6 Math skeletons + sample lesson documents (→ chunks → mock embeddings)
 * + demo accounts for the manual vertical slice. Running twice is a no-op.
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
  await seedCountry(db, knowledge, SAUDI_SPEC);
  await seedUsers(db, curriculum, egypt);

  db.sqlite.close();
  console.log("✓ Seed complete — Egypt + Saudi Grade-6 Math, demo accounts, RAG corpora ready.");
}

/** Seeds (or re-fetches, idempotently) one country's catalog + lesson documents. */
async function seedCountry(db: DbHandle, knowledge: KnowledgeService, spec: CountrySeedSpec): Promise<Seeded> {
  const now = new Date();

  const existing = await db.db.select().from(countries).where(eq(countries.code, spec.country.code)).get();
  if (existing) {
    console.log(`  ↺ ${spec.country.nameAr} already seeded — skipped (idempotent).`);
    const sys = (await db.db
      .select()
      .from(educationSystems)
      .where(and(eq(educationSystems.countryId, existing.id), eq(educationSystems.code, spec.system.code)))
      .get())!;
    const grade = (await db.db.select().from(grades).where(and(eq(grades.educationSystemId, sys.id), eq(grades.code, spec.grade.code))).get())!;
    const cur = (await db.db.select().from(curricula).where(eq(curricula.code, spec.curriculum.code)).get())!;
    const term = (await db.db.select().from(terms).where(and(eq(terms.curriculumId, cur.id), eq(terms.code, spec.term.code))).get())!;
    const unit = (await db.db.select().from(units).where(and(eq(units.termId, term.id), eq(units.code, spec.unit.code))).get())!;
    const lessonRows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id));
    const lessonIds: Record<string, string> = {};
    for (const lesson of lessonRows) lessonIds[lesson.code] = lesson.id;
    const seeded = { countryId: existing.id, systemId: sys.id, gradeId: grade.id, subjectId: cur.subjectId, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonIds };
    await ensureDemoQuestions(db, seeded, demoQuestionsOf(spec.country.code));
    return seeded;
  }

  const c = { id: newId("c"), code: spec.country.code, name: spec.country.name, nameAr: spec.country.nameAr };
  await db.db.insert(countries).values(c);
  const sys = { id: newId("sys"), countryId: c.id, code: spec.system.code, name: spec.system.name, nameAr: spec.system.nameAr, sortOrder: spec.system.sortOrder };
  await db.db.insert(educationSystems).values(sys);
  const g = { id: newId("g"), educationSystemId: sys.id, code: spec.grade.code, name: spec.grade.name, nameAr: spec.grade.nameAr, levelOrder: spec.grade.levelOrder };
  await db.db.insert(grades).values(g);

  // The subject catalog is global and shared across countries — reuse it when a
  // previous country already created it, never duplicate.
  let subj = await db.db.select().from(subjects).where(eq(subjects.code, "math")).get();
  if (!subj) {
    subj = { id: newId("subj"), code: "math", name: "Mathematics", nameAr: "الرياضيات" };
    await db.db.insert(subjects).values(subj);
  }

  const cur = { id: newId("cur"), countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, code: spec.curriculum.code, title: spec.curriculum.title, version: "1.0", isActive: true, createdAt: now };
  await db.db.insert(curricula).values(cur);
  const term = { id: newId("t"), curriculumId: cur.id, code: spec.term.code, title: spec.term.title, sortOrder: 1 };
  await db.db.insert(terms).values(term);
  const unit = { id: newId("u"), termId: term.id, code: spec.unit.code, title: spec.unit.title, sortOrder: 1 };
  await db.db.insert(units).values(unit);

  const lessonIds: Record<string, string> = {};
  for (const [i, lessonSpec] of spec.lessons.entries()) {
    const lesson = { id: newId("l"), unitId: unit.id, code: lessonSpec.code, title: lessonSpec.title, sortOrder: i + 1 };
    await db.db.insert(lessons).values(lesson);
    lessonIds[lessonSpec.code] = lesson.id;
    for (const [j, title] of lessonSpec.concepts.entries()) {
      await db.db.insert(concepts).values({
        id: newId("con"),
        lessonId: lesson.id,
        code: `c-${i + 1}-${j + 1}`,
        title,
        description: `مفهوم ${title} من درس ${lessonSpec.title}`,
      });
    }
  }

  console.log(`✓ Curriculum skeleton created (${spec.country.nameAr}).`);

  const seeded = { countryId: c.id, systemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonIds };
  await ingestLessonDocuments(db, knowledge, seeded, spec.lessons, spec.curriculum.code);
  await ensureDemoQuestions(db, seeded, demoQuestionsOf(spec.country.code));
  return seeded;
}

async function ingestLessonDocuments(db: DbHandle, knowledge: KnowledgeService, seeded: Seeded, lessonSpecs: CountrySeedSpec["lessons"], curriculumCode: string): Promise<void> {
  for (const lessonSpec of lessonSpecs) {
    if (!lessonSpec.doc) continue;
    const lessonId = seeded.lessonIds[lessonSpec.code]!;
    const existing = await db.db.select({ id: chunks.id }).from(chunks).where(eq(chunks.lessonId, lessonId)).limit(1);
    if (existing.length > 0) {
      console.log(`  ↺ Document for "${lessonSpec.doc.title}" already ingested — skipped.`);
      continue;
    }
    await knowledge.ingestText({
      title: lessonSpec.doc.title,
      content: lessonSpec.doc.content,
      kind: "text",
      source: `seed:${curriculumCode}-sample`,
      scope: {
        countryId: seeded.countryId,
        educationSystemId: seeded.systemId,
        gradeId: seeded.gradeId,
        subjectId: seeded.subjectId,
        curriculumId: seeded.curriculumId,
        termId: seeded.termId,
        unitId: seeded.unitId,
        lessonId,
      },
    });
    console.log(`  ✓ Ingested "${lessonSpec.doc.title}" → chunks + vectors.`);
  }
}

// ---------------------------------------------------------------------------
// PHASE 24 — demo practice questions (Egyptian curriculum). Seeded
// idempotently so `npm run db:seed` never duplicates them; they feed the
// practice loop that drives the concept-mastery engine. Saudi Arabia
// intentionally has none — proof the practice scope is truly per-curriculum.
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
];

/** Per-country demo question set — only Egypt ships questions in this seed. */
function demoQuestionsOf(countryCode: string): DemoQuestionSpec[] {
  return countryCode === "eg" ? EGYPT_DEMO_QUESTIONS : [];
}

/** Insert each missing demo question for its lesson/concept (idempotent). */
async function ensureDemoQuestions(db: DbHandle, seeded: Seeded, specs: DemoQuestionSpec[]): Promise<void> {
  for (const q of specs) {
    const lessonId = seeded.lessonIds[q.lessonCode];
    if (!lessonId) continue;
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

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});