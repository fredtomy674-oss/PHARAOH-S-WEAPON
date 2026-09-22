/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { openDbAndMigrate } from "./index.js";
import { AiService } from "../modules/ai/aiService.js";
import { CurriculumService } from "../modules/curriculum/service.js";
import { KnowledgeService } from "../modules/knowledge/service.js";
import { SqliteVectorStore } from "../modules/rag/vectorStore.js";
import {
  chunks,
  concepts,
  countries,
  curricula,
  educationSystems,
  grades,
  lessons,
  students,
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

type DbHandle = ReturnType<typeof openDbAndMigrate>;

/**
 * Idempotent seeder: Egyptian Grade-6 Math skeleton + sample lesson documents
 * (→ chunks → mock embeddings) + demo accounts for the manual vertical slice.
 * Running twice is a no-op for existing rows.
 */
async function main(): Promise<void> {
  const db = openDbAndMigrate();
  const ai = new AiService(db, { forceProvider: "mock" });
  const vectorStore = new SqliteVectorStore(db);
  const knowledge = new KnowledgeService(db, ai, vectorStore);
  const curriculum = new CurriculumService(db);

  const seeded = await seedCurriculum(db);
  await ingestLessonDocuments(db, knowledge, seeded);
  await seedUsers(db, curriculum, seeded);

  db.sqlite.close();
  console.log("✓ Seed complete — Egypt/Grade 6 Math, demo accounts, RAG corpus ready.");
}

async function seedCurriculum(db: DbHandle): Promise<Seeded> {
  const country = await db.db.select().from(countries).where(eq(countries.code, "eg")).get();
  if (country) {
    const system = (await db.db.select().from(educationSystems).where(eq(educationSystems.code, "mo-edu")).get())!;
    const grade = (await db.db.select().from(grades).where(eq(grades.code, "grade-6")).get())!;
    const subject = (await db.db.select().from(subjects).where(eq(subjects.code, "math")).get())!;
    const cur = (await db.db.select().from(curricula).where(eq(curricula.code, "eg-g6-math")).get())!;
    const term = (await db.db.select().from(terms).where(eq(terms.code, "term-1")).get())!;
    const unit = (await db.db.select().from(units).where(eq(units.code, "unit-1")).get())!;
    const lessonRows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id));
    const lessonIds: Record<string, string> = {};
    for (const lesson of lessonRows) lessonIds[lesson.code] = lesson.id;
    console.log("✓ Curriculum already seeded — skipped (idempotent).");
    return { countryId: country.id, systemId: system.id, gradeId: grade.id, subjectId: subject.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonIds };
  }

  const now = new Date();
  const c = { id: newId("c"), code: "eg", name: "Egypt", nameAr: "مصر" };
  await db.db.insert(countries).values(c);
  const sys = { id: newId("sys"), countryId: c.id, code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 };
  await db.db.insert(educationSystems).values(sys);
  const g = { id: newId("g"), educationSystemId: sys.id, code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 };
  await db.db.insert(grades).values(g);
  const subj = { id: newId("subj"), code: "math", name: "Mathematics", nameAr: "الرياضيات" };
  await db.db.insert(subjects).values(subj);
  const cur = { id: newId("cur"), countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, code: "eg-g6-math", title: "الرياضيات للصف السادس الابتدائي", version: "1.0", isActive: true, createdAt: now };
  await db.db.insert(curricula).values(cur);
  const term = { id: newId("t"), curriculumId: cur.id, code: "term-1", title: "الفصل الدراسي الأول", sortOrder: 1 };
  await db.db.insert(terms).values(term);
  const unit = { id: newId("u"), termId: term.id, code: "unit-1", title: "الأعداد والعمليات عليها", sortOrder: 1 };
  await db.db.insert(units).values(unit);

  const lessonSpecs = [
    { code: "l-add-sub", title: "الجمع والطرح على الأعداد الطبيعية", concepts: ["الجمع مع إعادة التجميع", "الطرح مع الاستلاف"] },
    { code: "l-mul-div", title: "الضرب والقسمة", concepts: ["الضرب في عدد من رقمين", "القسمة المطولة"] },
    { code: "l-fractions", title: "الكسور الاعتيادية", concepts: ["مقارنة الكسور", "تبسيط الكسور", "جمع الكسور ذات المقامات المتشابهة"] },
  ];

  const lessonIds: Record<string, string> = {};
  for (const [i, spec] of lessonSpecs.entries()) {
    const lesson = { id: newId("l"), unitId: unit.id, code: spec.code, title: spec.title, sortOrder: i + 1 };
    await db.db.insert(lessons).values(lesson);
    lessonIds[spec.code] = lesson.id;
    for (const [j, title] of spec.concepts.entries()) {
      await db.db.insert(concepts).values({
        id: newId("con"),
        lessonId: lesson.id,
        code: `c-${i + 1}-${j + 1}`,
        title,
        description: `مفهوم ${title} من درس ${spec.title}`,
      });
    }
  }

  console.log("✓ Curriculum skeleton created.");
  return { countryId: c.id, systemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonIds };
}

async function ingestLessonDocuments(db: DbHandle, knowledge: KnowledgeService, seeded: Seeded): Promise<void> {
  const lessonDocs: Array<{ code: string; title: string; content: string }> = [
    {
      code: "l-add-sub",
      title: "الجمع مع إعادة التجميع والطرح مع الاستلاف",
      content: `درس الجمع والطرح على الأعداد الطبيعية.
الجمع مع إعادة التجميع: عند جمع عددين مثل 487 + 358 نبدأ من الآحاد: 7 + 8 = 15، نكتب 5 ونرفع 1 للعشرات. ثم نجمع العشرات: 8 + 5 + 1 = 14، نكتب 4 ونرفع 1 للمئات. أخيرًا المئات: 4 + 3 + 1 = 8. الناتج هو 845.
الطرح مع الاستلاف: لحساب 503 - 267 نبدأ من الآحاد: 3 أصغر من 7، نستلف 1 من العشرات ولكن العشرات صفر، فنستلف من المئات: 500 تنقص إلى 400، والعشرات تصبح 9، والآحاد تصبح 13. 13 - 7 = 6، ثم 9 - 6 = 3، ثم 4 - 2 = 2. الناتج 236.
مثال تطبيقي: اشترى تاجر 120 كتابًا في الشهر الأول و95 كتابًا في الشهر الثاني. كم كتابًا اشترى في الشهرين؟ نجمع 120 + 95 = 215 كتابًا.
تذكر: يجب دائمًا البدء من الآحاد عند إجراء الجمع أو الطرح، والفهم الجيد لإعادة التجميع والاستلاف يقي من أخطاء شائعة كثيرة.`,
    },
    {
      code: "l-mul-div",
      title: "الضرب في عدد من رقمين والقسمة المطولة",
      content: `درس الضرب والقسمة.
الضرب في عدد من رقمين: لضرب 34 × 12 نضرب أولًا 34 × 2 = 68، ثم نضرب 34 × 10 = 340، ثم نجمع الناتجين: 68 + 340 = 408.
القسمة المطولة: لحساب 78 ÷ 3 نبدأ بقسمة 7 على 3: الناتج 2 والباقي 1. ننزل 8 بجانب الباقي لتصبح 18، ثم 18 ÷ 3 = 6. إذن 78 ÷ 3 = 26.
خاصية التوزيع تساعدنا على تبسيط الحسابات: 34 × 12 = 34 × (10 + 2) = 340 + 68 = 408.
مثال تطبيقي: توجد 5 صناديق في كل صندوق 24 قلمًا. ما عدد الأقلام الكلي؟ 5 × 24 = 120 قلمًا.
تمرين: احسب 56 × 13 باستخدام خطوات الفصل، ثم تحقق بقسمة الناتج على 13.`,
    },
    {
      code: "l-fractions",
      title: "مقارنة الكسور وتبسيطها وجمعها",
      content: `درس الكسور الاعتيادية.
مقارنة الكسور ذات المقامات المتشابهة: كلما كان البسط أكبر كان الكسر أكبر، فمثلًا 3/5 أكبر من 2/5. أما إذا اختلفت المقامات فنوحد المقامات أولًا.
تبسيط الكسور: نقسم البسط والمقام على العامل المشترك الأكبر. مثال: 8/12 نقسم على 4 فنحصل على 2/3.
جمع الكسور ذات المقامات المتشابهة: نجمع البسطين ونُبقي المقام كما هو: 1/4 + 2/4 = 3/4. إذا اختلفت المقامات، نوحد المقامات قبل الجمع.
مثال تطبيقي: أكل أحمد ربع البيتزا في الصباح وربعًا آخر في المساء، فما مجموع ما أكله؟ 1/4 + 1/4 = 2/4 ويُبسط إلى 1/2.
تذكر دائمًا: الكسر يُعبر عن جزء من الكل، والمقام هو عدد الأجزاء المتساوية التي قُسم إليها الكل.`,
    },
  ];

  for (const doc of lessonDocs) {
    const lessonId = seeded.lessonIds[doc.code]!;
    const existing = await db.db.select({ id: chunks.id }).from(chunks).where(eq(chunks.lessonId, lessonId)).limit(1);
    if (existing.length > 0) {
      console.log(`  ↺ Document for "${doc.title}" already ingested — skipped.`);
      continue;
    }
    await knowledge.ingestText({
      title: doc.title,
      content: doc.content,
      kind: "text",
      source: "seed:egypt-g6-math-sample",
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
    console.log(`  ✓ Ingested "${doc.title}" → chunks + vectors.`);
  }
}

async function seedUsers(db: DbHandle, curriculum: CurriculumService, seeded: Seeded): Promise<void> {
  const demoStudentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@alfarouq.test";
  const demoStudentPassword = process.env.SEED_STUDENT_PASSWORD ?? "student-demo-123";
  const demoAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@alfarouq.test";
  const demoAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin-demo-123";

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
    const studentId = newId("stu");
    await db.db.insert(students).values({
      id: studentId,
      userId,
      displayName: "طالب تجريبي",
      countryId: seeded.countryId,
      gradeId: seeded.gradeId,
      createdAt: now,
      updatedAt: now,
    });
    await curriculum.enroll(studentId, seeded.curriculumId);
    console.log(`  ✓ Demo student created: ${demoStudentEmail}`);
  } else {
    console.log(`  ↺ Demo student exists: ${demoStudentEmail}`);
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

  console.log(`\nDemo logins (dev only): student ${demoStudentEmail} / admin ${demoAdminEmail} — insecure defaults, change in production via env.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});