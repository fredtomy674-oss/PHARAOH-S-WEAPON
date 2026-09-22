import type { FastifyInstance } from "fastify";
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

export async function registerStudent(app: FastifyInstance, email: string, password = "password-123", displayName = "طالب اختبار"): Promise<AuthSession> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password, displayName },
  });
  expectStatus(res.statusCode, 201, res.body);
  const body = res.json() as { user: { id: string; student: { id: string } }; csrfToken: string };
  return { cookie: cookieValueOf(res.headers["set-cookie"]), csrfToken: body.csrfToken, userId: body.user.id, studentId: body.user.student.id };
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
  await db.insert(concepts).values([
    { id: newId("con"), lessonId: lessonA.id, code: "c-a1", title: "الجمع مع التجميع", description: "مفهوم أ" },
    { id: newId("con"), lessonId: lessonB.id, code: "c-b1", title: "مقارنة الكسور", description: "مفهوم ب" },
  ]);

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

  return { countryId: c.id, systemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, termId: term.id, unitId: unit.id, lessonA: lessonA.id, lessonB: lessonB.id };
}

function expectStatus(actual: number, expected: number, body: string): void {
  if (actual !== expected) {
    throw new Error(`expected status ${expected}, got ${actual}: ${body}`);
  }
}

export { expectStatus };