import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { applyMigrations, createDb, type Db } from "../src/db/index.js";
import { buildApp } from "../src/app.js";
import { AiService } from "../src/modules/ai/aiService.js";
import { KnowledgeService } from "../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../src/modules/rag/vectorStore.js";
import { MemoryService } from "../src/modules/tutor/memoryService.js";
import {
  concepts,
  countries,
  curricula,
  educationSystems,
  grades,
  lessons,
  questions,
  subjects,
  terms,
  units,
  users,
} from "../src/db/schema.js";
import { newId } from "../src/utils/ids.js";

export interface TestApi {
  app: FastifyInstance;
  db: Db;
  ai: AiService;
  knowledge: KnowledgeService;
  memory: MemoryService;
}

export async function makeApp(opts: { seedCorpus?: boolean } = {}): Promise<TestApi> {
  const db = createDb();
  applyMigrations(db);
  const app = await buildApp(db, { logger: false });
  await app.ready();
  const ai = new AiService(db, { forceProvider: "mock" });
  const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
  const api: TestApi = { app, db, ai, knowledge, memory: new MemoryService(db) };
  if (opts.seedCorpus) {
    await seedMiniCorpus(api);
  }
  return api;
}

export interface AuthSession {
  cookie: string;
  csrfToken: string;
  userId: string;
  studentId?: string;
}

export function cookieValueOf(setCookieHeader: string | string[] | undefined): string {
  if (typeof setCookieHeader !== "string") throw new Error("no set-cookie header");
  return setCookieHeader.split(";")[0]!;
}

export async function registerStudent(app: FastifyInstance, email: string, password = "password-123", displayName = "طالب اختبار", gradeId?: string): Promise<AuthSession> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password, displayName, ...(gradeId ? { gradeId } : {}) },
  });
  expectStatus(res.statusCode, 201, res.body);
  const body = res.json() as { user: { id: string; student: { id: string } }; csrfToken: string };
  return { cookie: cookieValueOf(res.headers["set-cookie"]), csrfToken: body.csrfToken, userId: body.user.id, studentId: body.user.student.id };
}

export async function registerParent(app: FastifyInstance, email: string, password = "password-123", displayName = "ولي أمر اختبار"): Promise<AuthSession> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password, displayName, role: "parent" },
  });
  expectStatus(res.statusCode, 201, res.body);
  const body = res.json() as { user: { id: string; role: string }; csrfToken: string };
  if (body.user.role !== "parent") throw new Error(`expected parent role, got ${body.user.role}`);
  return { cookie: cookieValueOf(res.headers["set-cookie"]), csrfToken: body.csrfToken, userId: body.user.id };
}

export async function login(app: FastifyInstance, email: string, password: string): Promise<AuthSession> {
  const res = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password } });
  expectStatus(res.statusCode, 200, res.body);
  const body = res.json() as { user: { id: string }; csrfToken: string };
  return { cookie: cookieValueOf(res.headers["set-cookie"]), csrfToken: body.csrfToken, userId: body.user.id };
}

export async function makeAdmin(app: FastifyInstance, db: Db, email = "admin@test.local", password = "admin-password-123"): Promise<AuthSession> {
  const now = new Date();
  await db.db.insert(users).values({
    id: newId("usr"),
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  return login(app, email, password);
}

export function headers(s: AuthSession): Record<string, string> {
  return { cookie: s.cookie };
}

export function csrfHeaders(s: AuthSession): Record<string, string> {
  return { cookie: s.cookie, "x-csrf-token": s.csrfToken };
}

export interface MiniCorpus {
  countryId: string;
  systemId: string;
  gradeId: string;
  subjectId: string;
  curriculumId: string;
  termId: string;
  unitId: string;
  lessonA: string;
  lessonB: string;
  conceptAId: string;
  conceptBId: string;
  /** PHASE 26 — an extra lesson-A concept carrying a HARD question for difficulty-aware grading. */
  conceptCId: string;
  questionA1Id: string;
  questionA2Id: string;
  questionB1Id: string;
  questionC1Id: string;
}

/** Seeds a two-lesson corpus so RAG isolation can be asserted (A vs B). */
export async function seedMiniCorpus(api: TestApi): Promise<MiniCorpus> {
  const db = api.db.db;
  const now = new Date();
  const c = { id: newId("c"), code: "eg", name: "Egypt", nameAr: "مصر" };
  await db.insert(countries).values(c);
  const sys = { id: newId("sys"), countryId: c.id, code: "mo-edu", name: "Ministry", nameAr: "الوزارة", sortOrder: 1 };
  await db.insert(educationSystems).values(sys);
  const g = { id: newId("g"), educationSystemId: sys.id, code: "grade-6", name: "Grade 6", nameAr: "الصف السادس", levelOrder: 6 };
  await db.insert(grades).values(g);
  const subj = { id: newId("subj"), code: "math", name: "Math", nameAr: "الرياضيات" };
  await db.insert(subjects).values(subj);
  const cur = { id: newId("cur"), countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, code: "corpus-math", title: "منهج الاختبار", version: "1.0", isActive: true, createdAt: now };
  await db.insert(curricula).values(cur);
  const term = { id: newId("t"), curriculumId: cur.id, code: "term-1", title: "الفصل الأول", sortOrder: 1 };
  await db.insert(terms).values(term);
  const unit = { id: newId("u"), termId: term.id, code: "unit-1", title: "الوحدة الأولى", sortOrder: 1 };
  await db.insert(units).values(unit);
  const lessonA = { id: newId("l"), unitId: unit.id, code: "l-a", title: "الجمع ضمن الأعداد حتى 999", sortOrder: 1 };
  const lessonB = { id: newId("l"), unitId: unit.id, code: "l-b", title: "الكسور الاعتيادية", sortOrder: 2 };
  await db.insert(lessons).values([lessonA, lessonB]);
  const conceptA = { id: newId("con"), lessonId: lessonA.id, code: "c-a1", title: "الجمع مع التجميع", description: "مفهوم أ" };
  const conceptB = { id: newId("con"), lessonId: lessonB.id, code: "c-b1", title: "مقارنة الكسور", description: "مفهوم ب" };
  // PHASE 26 — an extra lesson-A concept whose question is HARD, so
  // difficulty-aware mastery deltas can be asserted end-to-end.
  const conceptC = { id: newId("con"), lessonId: lessonA.id, code: "c-a2", title: "الجمع مع إعادة التجميع", description: "مفهوم صعب" };
  await db.insert(concepts).values([conceptA, conceptB, conceptC]);

  // PHASE 24 — practice questions: two on lesson A (weakest-first candidate),
  // one on lesson B (isolation/foreign-scope candidate). PHASE 26 adds a HARD
  // question so difficulty-weighted grading has a real fixture.
  const questionA1 = { id: newId("q"), curriculumId: cur.id, lessonId: lessonA.id, conceptId: conceptA.id, difficulty: "easy" as const, type: "mcq" as const, content: "ما ناتج 487 + 358؟", explanation: "الآحاد 15 نكتب 5 ونرفع 1، فيكون الناتج 845.", optionsJson: JSON.stringify({ options: ["845", "835", "745", "855"], correctIndex: 0 }), answerKey: null, createdAt: new Date(now.getTime() - 60_000) };
  const questionA2 = { id: newId("q"), curriculumId: cur.id, lessonId: lessonA.id, conceptId: conceptA.id, difficulty: "easy" as const, type: "mcq" as const, content: "أكمل: 12 + 8 = ؟", explanation: "12 + 8 = 20.", optionsJson: JSON.stringify({ options: ["20", "18", "22", "21"], correctIndex: 0 }), answerKey: null, createdAt: now };
  const questionB1 = { id: newId("q"), curriculumId: cur.id, lessonId: lessonB.id, conceptId: conceptB.id, difficulty: "easy" as const, type: "mcq" as const, content: "أي الكسرين أكبر: 3/5 أم 2/5؟", explanation: "مع تشابه المقامات، الأكبر بسطًا أكبر.", optionsJson: JSON.stringify({ options: ["3/5", "2/5"], correctIndex: 0 }), answerKey: null, createdAt: now };
  const questionC1 = { id: newId("q"), curriculumId: cur.id, lessonId: lessonA.id, conceptId: conceptC.id, difficulty: "hard" as const, type: "mcq" as const, content: "أكمل النمط: 5، 14، 23، …؟", explanation: "الإضافة الثابتة 9، فيكون التالي 32.", optionsJson: JSON.stringify({ options: ["32", "31", "33", "30"], correctIndex: 0 }), answerKey: null, createdAt: now };
  await db.insert(questions).values([questionA1, questionA2, questionB1, questionC1]);

  const scopeA = { countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonId: lessonA.id };
  const scopeB = { ...scopeA, lessonId: lessonB.id, countryId: c.id };

  await api.knowledge.ingestText({
    title: "محتوى الجمع",
    content:
      "الجمع مع إعادة التجميع: عند جمع 487 و 358 نبدأ من الآحاد فيكون الناتج 845. الفهم الدقيق للجمع يساعدنا في المسائل الحياتية والمالية.",
    kind: "text",
    source: "test-corpus",
    scope: scopeA,
  });
  await api.knowledge.ingestText({
    title: "محتوى الكسور",
    content:
      "الكسور الاعتيادية: مقارنة الكسور ذات المقامات المتشابهة تعتمد على البسط، وتبسيط الكسور يكون بقسمة البسط والمقام على العامل المشترك الأكبر. عبارة الزعفرانة النبتة الاستوائية غير موجودة في هذا الدرس.",
    kind: "text",
    source: "test-corpus",
    scope: scopeB,
  });

  return { countryId: c.id, systemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonA: lessonA.id, lessonB: lessonB.id, conceptAId: conceptA.id, conceptBId: conceptB.id, conceptCId: conceptC.id, questionA1Id: questionA1.id, questionA2Id: questionA2.id, questionB1Id: questionB1.id, questionC1Id: questionC1.id };
}

export interface SaudiCorpus {
  countryId: string;
  systemId: string;
  gradeId: string;
  subjectId: string;
  curriculumId: string;
  termId: string;
  unitId: string;
  lessonId: string;
}

/**
 * Seeds a Saudi (KSA) secondary corpus ON TOP of an existing corpus, reusing
 * the global `math` subject — mirrors the real seeder's country isolation.
 * PHASE 16: proves the catalog + RAG are regional, not Egypt-only.
 */
export async function seedSaudiCorpus(api: TestApi): Promise<SaudiCorpus> {
  const db = api.db.db;
  const now = new Date();
  const c = { id: newId("c"), code: "sa", name: "Saudi Arabia", nameAr: "السعودية" };
  await db.insert(countries).values(c);
  const sys = { id: newId("sys"), countryId: c.id, code: "sa-ministry", name: "Ministry", nameAr: "وزارة التعليم", sortOrder: 1 };
  await db.insert(educationSystems).values(sys);
  const g = { id: newId("g"), educationSystemId: sys.id, code: "sa-grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 };
  await db.insert(grades).values(g);
  const subj = (await db.select().from(subjects).where(eq(subjects.code, "math")).get())!;
  const cur = { id: newId("cur"), countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, code: "sa-g6-math", title: "الرياضيات للصف السادس الابتدائي — السعودية", version: "1.0", isActive: true, createdAt: now };
  await db.insert(curricula).values(cur);
  const term = { id: newId("t"), curriculumId: cur.id, code: "sa-term-1", title: "الفصل الدراسي الأول", sortOrder: 1 };
  await db.insert(terms).values(term);
  const unit = { id: newId("u"), termId: term.id, code: "sa-unit-1", title: "الأعداد والعمليات عليها", sortOrder: 1 };
  await db.insert(units).values(unit);
  const lesson = { id: newId("l"), unitId: unit.id, code: "l-sa-ops", title: "العمليات على الأعداد الطبيعية", sortOrder: 1 };
  await db.insert(lessons).values(lesson);
  await db.insert(concepts).values({
    id: newId("con"),
    lessonId: lesson.id,
    code: "c-sa-1",
    title: "الجمع مع إعادة التجميع",
    description: "مفهوم سعودي",
  });

  const scope = { countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonId: lesson.id };
  await api.knowledge.ingestText({
    title: "العمليات على الأعداد الطبيعية",
    content:
      "العمليات على الأعداد الطبيعية: عند الجمع مع إعادة التجميع في سوق مدينة الرياض نبدأ من الآحاد ثم ننقل كل تجميع للمنزلة الأعلى. الضرب في مضاعفات العشرة يكون بضرب العدد ثم إضافة الصفر. مثال: اشترى خالد في الرياض دفترًا بسعر 9 ريالات سعودية، فدفع عن 15 دفترًا 135 ريالًا. عبارة الزعفرانة النبتة الاستوائية غير موجودة في هذا الدرس.",
    kind: "text",
    source: "test-corpus-saudi",
    scope,
  });

  return { countryId: c.id, systemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonId: lesson.id };
}

function expectStatus(actual: number, expected: number, body: string): void {
  if (actual !== expected) {
    throw new Error(`expected status ${expected}, got ${actual}: ${body}`);
  }
}

export { expectStatus };