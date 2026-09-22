// API client — speaks to the Fastify server through the Vite `/api` proxy.
// The session cookie is handled by the browser automatically; the CSRF token
// is attached to every state-changing request and refreshed on login/register.

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  student?: { id: string; displayName: string; gradeId: string | null };
}

export interface Country {
  id: string;
  code: string;
  name: string;
  nameAr: string;
}

export interface EduSystem {
  id: string;
  countryId: string;
  code: string;
  name: string;
  nameAr: string;
  sortOrder: number;
}

export interface Grade {
  id: string;
  educationSystemId: string;
  code: string;
  name: string;
  nameAr: string;
  levelOrder: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  nameAr: string;
}

export interface Curriculum {
  id: string;
  gradeId: string;
  subjectId: string;
  code: string;
  title: string;
  version: string;
  isActive: boolean;
  createdAt: string;
}

export interface Term {
  id: string;
  curriculumId: string;
  code: string;
  title: string;
  sortOrder: number;
}

export interface Unit {
  id: string;
  termId: string;
  code: string;
  title: string;
  sortOrder: number;
}

export interface Lesson {
  id: string;
  unitId: string;
  code: string;
  title: string;
  sortOrder: number;
}

export interface Concept {
  id: string;
  lessonId: string;
  code: string;
  title: string;
  description: string | null;
}

export interface Breadcrumb {
  breadcrumb: {
    country: { nameAr: string };
    system: { nameAr: string };
    grade: { nameAr: string; id: string };
    subject: { nameAr: string; id: string };
    curriculum: { title: string; id: string };
    term: { title: string };
    unit: { title: string };
    lesson: { title: string; id: string };
  };
}

export interface LearningSession {
  id: string;
  studentId: string;
  lessonId: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "tutor";
  kind: string;
  content: string;
  createdAt: string;
}

export interface TurnResult {
  userMessage: Message;
  tutorMessage: Message;
  contextChunkCount: number;
  remainingBudget: number;
  safetyTripwire: boolean;
}

export interface ProgressConcept {
  id: string;
  title: string;
  mastery: number;
}

export interface ProgressDetail {
  progress: {
    concepts: ProgressConcept[];
    /** مفاهيم يتقنها الطالب — تصبح أكثر دقة بعد عدة محاولات. */
    strengths: string[];
    weaknesses: string[];
  };
  tutorUsageToday: number;
}

let csrfToken: string | null = localStorage.getItem("alfarouq_csrf");

export function currentCsrf(): string | null {
  return csrfToken;
}

function storeCsrf(token: string): void {
  csrfToken = token;
  localStorage.setItem("alfarouq_csrf", token);
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {};
  // Only send a JSON content-type when there is a body: Fastify rejects
  // (400 FST_ERR_CTP_EMPTY_JSON_BODY) POSTs with application/json + no body.
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken) headers["x-csrf-token"] = csrfToken;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "same-origin",
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  const data = (await res.json().catch(() => null)) as
    | { error?: { code?: string; message?: string }; csrfToken?: string }
    | null;

  if (data?.csrfToken) storeCsrf(data.csrfToken);

  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? "حدث خطأ غير متوقع", res.status, data?.error?.code ?? "UNKNOWN");
  }
  return data as T;
}

export async function whoami(): Promise<User> {
  const res = await api<{ user: User }>("/auth/me");
  return res.user;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api<{ user: User }>("/auth/login", { method: "POST", body: { email, password } });
  return res.user;
}

export async function register(email: string, password: string, displayName: string): Promise<User> {
  const res = await api<{ user: User }>("/auth/register", {
    method: "POST",
    body: { email, password, displayName },
  });
  return res.user;
}

export async function logout(): Promise<void> {
  await api("/auth/logout", { method: "POST" });
}

export async function listCountries(): Promise<Country[]> {
  const res = await api<{ countries: Country[] }>("/curriculum/countries");
  return res.countries;
}

export async function listSystems(countryId: string): Promise<EduSystem[]> {
  const res = await api<{ systems: EduSystem[] }>(`/curriculum/systems?countryId=${encodeURIComponent(countryId)}`);
  return res.systems;
}

export async function listGrades(systemId: string): Promise<Grade[]> {
  const res = await api<{ grades: Grade[] }>(`/curriculum/grades?systemId=${encodeURIComponent(systemId)}`);
  return res.grades;
}

export async function listSubjects(): Promise<Subject[]> {
  const res = await api<{ subjects: Subject[] }>("/curriculum/subjects");
  return res.subjects;
}

export async function listCurricula(gradeId: string, subjectId: string): Promise<Curriculum[]> {
  const res = await api<{ curricula: Curriculum[] }>(
    `/curriculum/curricula?gradeId=${encodeURIComponent(gradeId)}&subjectId=${encodeURIComponent(subjectId)}`,
  );
  return res.curricula;
}

export async function listTerms(curriculumId: string): Promise<Term[]> {
  const res = await api<{ terms: Term[] }>(`/curriculum/terms?curriculumId=${encodeURIComponent(curriculumId)}`);
  return res.terms;
}

export async function listUnits(termId: string): Promise<Unit[]> {
  const res = await api<{ units: Unit[] }>(`/curriculum/units?termId=${encodeURIComponent(termId)}`);
  return res.units;
}

export async function listLessons(unitId: string): Promise<Lesson[]> {
  const res = await api<{ lessons: Lesson[] }>(`/curriculum/lessons?unitId=${encodeURIComponent(unitId)}`);
  return res.lessons;
}

export async function lessonBreadcrumb(lessonId: string): Promise<Breadcrumb["breadcrumb"]> {
  const res = await api<Breadcrumb>(`/curriculum/lessons/${encodeURIComponent(lessonId)}/breadcrumb`);
  return res.breadcrumb;
}

export async function startSession(input: { curriculumId: string; gradeId: string; subjectId: string; lessonId: string }): Promise<LearningSession> {
  const res = await api<{ session: LearningSession }>("/sessions", { method: "POST", body: input });
  return res.session;
}

export async function listSessions(): Promise<LearningSession[]> {
  const res = await api<{ sessions: LearningSession[] }>("/sessions");
  return res.sessions;
}

export async function getSession(sessionId: string): Promise<{ session: LearningSession; messages: Message[] }> {
  return api(`/sessions/${encodeURIComponent(sessionId)}`);
}

export async function sendMessage(sessionId: string, content: string): Promise<TurnResult> {
  return api<TurnResult>(`/sessions/${encodeURIComponent(sessionId)}/messages`, { method: "POST", body: { content } });
}

export async function endSession(sessionId: string): Promise<void> {
  await api(`/sessions/${encodeURIComponent(sessionId)}/end`, { method: "POST" });
}

export async function myProgress(): Promise<ProgressDetail> {
  return api<ProgressDetail>("/progress/me");
}