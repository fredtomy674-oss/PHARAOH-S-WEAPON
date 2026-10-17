// API client — speaks to the Fastify server through the Vite `/api` proxy.
// The session cookie is handled by the browser automatically; the CSRF token
// is attached to every state-changing request and refreshed on login/register.

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  student?: { id: string; displayName: string; gradeId: string | null };
  /** Student only: the sharing code a parent enters to link/observe them (PHASE 18). */
  linkCode?: string | null;
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

/**
 * PHASE 38/D-042 — the tutor's reply language for a curriculum. The server
 * decides it (from the subject); the client only displays it.
 * PHASE 63 — added fr/de for curricula taught in French or German.
 */
export type TutorLanguage = "ar" | "en" | "fr" | "de";

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
  /** PHASE 38/D-042 — the language the tutor will answer in for this subject. */
  replyLanguage: TutorLanguage;
}

export interface LearningSession {
  id: string;
  studentId: string;
  lessonId: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  mimeType: string;
  fileName: string | null;
  sizeBytes: number;
  /** Document attachments only: extracted text length (0 when none). */
  textChars?: number;
  /** Document attachments only: true when the text was cut to the chars budget. */
  truncated?: boolean;
  /** Document attachments only: true when the text came from OCR (scanned file, PHASE 19). */
  ocr?: boolean;
  /**
   * PHASE 50 legacy — the printed book page a pre-W2 ink attachment marked.
   * Board drawings (W2+) carry no page: the drawing is on the board, and the
   * room captions it «رسمك على السبورة». Kept so old transcripts still read
   * right.
   */
  inkPage?: number;
  /** PHASE 50 — ink attachments only: how many strokes the student drew. */
  inkStrokes?: number;
}

/**
 * PHASE 51 — a number line the tutor drew inside its reply. The room renders
 * it with a draggable pin; the correct position is never here (the server
 * strips it before sending), so the exercise keeps its key.
 */
export interface NumberLineView {
  kind: "numberline";
  from: number;
  to: number;
  step: number;
  markers?: Array<{ value: number; label?: string }>;
  question?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "tutor";
  kind: string;
  content: string;
  createdAt: string;
  /** Photos attached to this message (owner-loaded via attachmentUrl). */
  attachments?: MessageAttachment[];
  /**
   * PHASE 48 — tutor replies only: the printed textbook pages this answer was
   * grounded in. Stored server-side, so it survives re-opening the session.
   */
  bookPages?: number[];
  /**
   * PHASE 51 — tutor replies only: number lines this answer drew, without
   * their answer keys. Stored server-side, so a reopened session redraws the
   * same lines the student saw live.
   */
  widgets?: NumberLineView[];
  /**
   * PHASE 93/95 — tutor replies only: the typed teaching action the ENGINE chose
   * for this turn (see server `teachingActions.ts`). Persisted, so the room
   * shows the same teaching move after a reload. The model performs it; it never
   * chooses it.
   */
  teachingAction?: TeachingAction;
}

/** The teaching-action contract, mirrored from the server (display subset). */
export type TeachingActionType =
  | "explain"
  | "diagnose"
  | "hint"
  | "visual_explanation"
  | "interactive_board"
  | "textbook_reference"
  | "practice"
  | "review_prerequisite"
  | "celebrate_progress"
  | "continue_learning";

export interface TeachingAction {
  type: TeachingActionType;
  concept: string | null;
  reason: string;
  board?: "numberline" | "ink";
  level?: number;
  pages?: number[];
  difficulty?: "easier" | "same" | "harder";
  approach?: "book_example" | "simpler" | "alternative" | "default";
  medium?: "text_steps" | "diagram";
  /** review_prerequisite only. */
  prerequisite?: string;
  mastery?: number | null;
  /** continue_learning only. */
  nextConcept?: string | null;
}

export interface TurnResult {
  userMessage: Message;
  tutorMessage: Message;
  contextChunkCount: number;
  /**
   * PHASE 48 — printed book pages this answer is grounded in, derived from the
   * retrieved passages. The room turns them into one-tap jumps on the stage.
   */
  citedBookPages?: number[];
  remainingBudget: number;
  safetyTripwire: boolean;
  /** True when the attached document had no text layer and was read via OCR (PHASE 19). */
  ocrUsed: boolean;
}

export interface ProgressConcept {
  conceptId: string;
  conceptTitle: string;
  conceptCode: string;
  mastery: number;
  attempts: number;
  correct: number;
  lastSeenAt: string;
}

// PHASE 24 — one concept's mastery summary (level, decay, trend).
export type MasteryLevel = "mastered" | "advanced" | "developing" | "needs_review";

export interface MasteryConcept {
  conceptId: string;
  code: string;
  title: string;
  mastery: number;
  decayedMastery: number;
  level: MasteryLevel;
  labelAr: string;
  attempts: number;
  correct: number;
  lastSeenAt: string;
  daysSinceLastPractice: number;
  trend: "up" | "steady" | "down";
}

export interface ProgressDetail {
  progress: {
    concepts: ProgressConcept[];
    /** مفاهيم يتقنها الطالب — تصبح أكثر دقة بعد عدة محاولات. */
    strengths: string[];
    weaknesses: string[];
  };
  mastery: MasteryConcept[];
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

/** PHASE 157 — حفظ ملف الطالب (الصف الدراسي المختار في «أول دخول»). */
export async function updateStudentProfile(input: {
  displayName?: string;
  gradeId?: string | null;
}): Promise<{ id: string; displayName: string; gradeId: string | null }> {
  const res = await api<{ student: { id: string; displayName: string; gradeId: string | null } }>(
    "/profile/me/student",
    { method: "PUT", body: input },
  );
  return res.student;
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

export async function listSubjects(gradeId?: string): Promise<Subject[]> {
  const res = await api<{ subjects: Subject[] }>(
    gradeId ? `/curriculum/subjects?gradeId=${encodeURIComponent(gradeId)}` : "/curriculum/subjects",
  );
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

export async function listConcepts(lessonId: string): Promise<Concept[]> {
  const res = await api<{ concepts: Concept[] }>(`/curriculum/lessons/${encodeURIComponent(lessonId)}/concepts`);
  return res.concepts;
}

export async function lessonBreadcrumb(lessonId: string): Promise<Breadcrumb["breadcrumb"]> {
  const res = await api<Breadcrumb>(`/curriculum/lessons/${encodeURIComponent(lessonId)}/breadcrumb`);
  return res.breadcrumb;
}

/**
 * PHASE 38/D-042 — the breadcrumb plus the server's own verdict on the reply
 * language for this lesson, in a single round-trip, so the header badge can
 * never disagree with the language the tutor actually uses.
 * Absent (older server) → Arabic, the product default.
 */
export async function lessonContext(lessonId: string): Promise<{
  breadcrumb: Breadcrumb["breadcrumb"];
  replyLanguage: TutorLanguage;
}> {
  const res = await api<Breadcrumb>(`/curriculum/lessons/${encodeURIComponent(lessonId)}/breadcrumb`);
  return { breadcrumb: res.breadcrumb, replyLanguage: res.replyLanguage ?? "ar" };
}

// --- PHASE 48 — «مسرح الكتاب» ------------------------------------------------

export interface BookStagePage {
  /** Printed page number as it appears on the paper. */
  bookPage: number;
  /** Scan/PDF page the image came from. */
  pdfPage: number;
  /** False when this deployment has no rasterized pages. */
  present: boolean;
}

/**
 * W2 — the printed pages a lesson occupies, for the reference bar only: page
 * numbers, never page images. `null` for a curriculum with no page map — the
 * room then has no reference bar and still teaches from the book's content.
 */
export interface LessonStage {
  curriculumId: string;
  lessonCode: string;
  conceptKey: string;
  fromBookPage: number;
  toBookPage: number;
  pages: BookStagePage[];
  /** PHASE 75 — appendix pages this lesson points to (already inside `pages`). */
  appendixPages: number[];
  hasImages: boolean;
}

export async function lessonStage(lessonId: string): Promise<LessonStage | null> {
  const res = await api<{ stage: LessonStage | null }>(`/curriculum/lessons/${encodeURIComponent(lessonId)}/stage`);
  return res.stage;
}

// --- PHASE 160 (W5) — «مصادر الدرس» -----------------------------------------

export type SourceCardType = "memorise" | "understand" | "watch" | "connect" | "remember";

export interface SourceItem {
  kind: string;
  text: string;
  /** Printed book page the line came from (book-derived items only). */
  page?: number;
  /** For definitions: the term the sentence defines, when the sentence names it. */
  term?: string;
  /** For observed errors: the wrong answer students actually picked. */
  wrong?: string;
  /** For observed errors: how many times it was picked (aggregate, no names). */
  count?: number;
  /** For cards: the card's type. */
  card?: SourceCardType;
}

/**
 * W5 — the lesson's six study tabs, built on the server deterministically from
 * the lesson's own printed pages. Every book-derived line carries its page;
 * nothing here is invented.
 */
export interface LessonSources {
  hasBookText: boolean;
  pageRange: { from: number; to: number } | null;
  summary: SourceItem[];
  definitions: SourceItem[];
  cards: SourceItem[];
  cardCounts: Partial<Record<SourceCardType, number>>;
  errors: SourceItem[];
  examples: SourceItem[];
  review: SourceItem[];
}

export async function lessonSources(lessonId: string): Promise<LessonSources> {
  const res = await api<{ sources: LessonSources }>(`/lessons/${encodeURIComponent(lessonId)}/sources`);
  return res.sources;
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

/** The picture the tutor sees for an ink turn: the board as the student marked it. */
export interface InkPayload {
  dataUrl: string;
  strokes: number;
}

/** PHASE 51 — the pin the student placed on the tutor's number line. */
export interface WidgetPayload {
  value: number;
}

export async function sendMessage(
  sessionId: string,
  content: string,
  image?: { dataUrl: string; fileName?: string },
  document?: { dataUrl: string; fileName?: string },
  /**
   * PHASE 48 — the page of his own book the student follows on (named by the
   * room's reference bar). Sent with the turn so the tutor reads the same page
   * the student reads (a lookup on the server, not a vision upload: no added
   * latency).
   */
  bookPage?: number,
  /**
   * PHASE 50/W2 — «لوح الحبر»: the board as the student marked it, composited
   * in the room from the very surface he draws on.
   */
  ink?: InkPayload,
  /** PHASE 51 — the pin the student placed on the tutor's number line. */
  widget?: WidgetPayload,
): Promise<TurnResult> {
  return api<TurnResult>(`/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: "POST",
    body: {
      content,
      ...(image ? { image } : {}),
      ...(document ? { document } : {}),
      ...(bookPage !== undefined ? { bookPage } : {}),
      ...(ink ? { ink } : {}),
      ...(widget ? { widget } : {}),
    },
  });
}

/**
 * PHASE 49 — the live turn: the same request, with the reply arriving as it is
 * written.
 *
 * The body is NDJSON (one JSON object per line). A network chunk may split a
 * line anywhere, so a partial line is kept until its newline arrives — reading
 * each chunk as a whole event is the classic way to lose the last word of a
 * reply.
 *
 * Throwing is a legitimate outcome, not just a crash: the caller is expected to
 * fall back to the buffered endpoint. That is what happens behind a proxy that
 * buffers, on an older browser, or on any network error — the student gets the
 * same answer, a moment later.
 */
export async function streamMessage(
  sessionId: string,
  body: { content: string; image?: { dataUrl: string; fileName?: string }; document?: { dataUrl: string; fileName?: string }; bookPage?: number; ink?: InkPayload; widget?: WidgetPayload; speak?: boolean },
  handlers: {
    onUser?: (message: Message) => void;
    onDelta?: (text: string) => void;
    onDiscard?: () => void;
    /**
     * PHASE 57 — one playable piece of the reply's voice, in sentence order. The
     * pieces ride the reply's own stream, so the caller can start playing the
     * first one while the rest of the answer is still being written.
     */
    onAudio?: (piece: { seq: number; base64: string; mimeType: string }) => void;
    /** The server has no more voice for this turn; `ok:false` means it had none. */
    onAudioEnd?: (ok: boolean) => void;
  },
): Promise<TurnResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/messages/stream`, {
    method: "POST",
    headers,
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // A rejected request (auth, validation) never becomes a stream — the error
    // is a normal JSON response and must be raised as such.
    const data = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string }; csrfToken?: string } | null;
    if (data?.csrfToken) storeCsrf(data.csrfToken);
    throw new ApiError(data?.error?.message ?? "تعذّر بدء المحادثة", res.status, data?.error?.code ?? "STREAM_REFUSED");
  }
  if (!res.body) throw new Error("هذا المتصفح لا يدعم البثّ الحي");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let result: TurnResult | null = null;

  const handle = (event: TutorStreamEvent): void => {
    if (event.type === "user") handlers.onUser?.(event.message as Message);
    else if (event.type === "delta") handlers.onDelta?.(event.text);
    else if (event.type === "discard") handlers.onDiscard?.();
    else if (event.type === "audio") handlers.onAudio?.({ seq: event.seq, base64: event.base64, mimeType: event.mimeType });
    else if (event.type === "audio-end") handlers.onAudioEnd?.(event.ok);
    else if (event.type === "done") result = event as unknown as TurnResult;
    else if (event.type === "error") throw new ApiError(event.message, 200, "STREAM_ERROR");
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      let boundary = pending.indexOf("\n");
      while (boundary >= 0) {
        const line = pending.slice(0, boundary).trim();
        pending = pending.slice(boundary + 1);
        if (line) handle(JSON.parse(line) as TutorStreamEvent);
        boundary = pending.indexOf("\n");
      }
    }
    if (pending.trim()) handle(JSON.parse(pending.trim()) as TutorStreamEvent);
  } finally {
    // Leaving the reader open would keep the connection — and the turn — alive.
    await reader.cancel().catch(() => undefined);
  }

  if (!result) throw new Error("انقطع البثّ قبل اكتمال الرد");
  return result;
}

/** The wire shape of one line of a live turn (see `TutorStreamEvent` server-side). */
export type TutorStreamEvent =
  | { type: "user"; message: Message }
  | { type: "delta"; text: string }
  | { type: "discard" }
  /** PHASE 57 — one playable piece of the reply's voice, played in `seq` order. */
  | { type: "audio"; seq: number; base64: string; mimeType: string }
  /** PHASE 57 — no more voice for this turn. */
  | { type: "audio-end"; ok: boolean }
  | ({ type: "done" } & TurnResult)
  | { type: "error"; message: string };

/** Browser URL to load an attachment's bytes (auth via cookie; GET-only → no CSRF). */
export function attachmentUrl(sessionId: string, attachmentId: string): string {
  return `/api/sessions/${encodeURIComponent(sessionId)}/attachments/${encodeURIComponent(attachmentId)}`;
}

/**
 * PHASE 40 (D-044) — the server cannot produce audio (speech off, provider
 * error, or no network). Not an error the student should ever see: the caller
 * reads the reply with the browser's own voice instead.
 */
export class SpeechUnavailableError extends Error {}

/**
 * Remembers a server that said "no voice": one 503 is enough to know this
 * deployment narrates with the browser, so later presses skip the round-trip.
 * Reset to null (try again) whenever the app loads a new chat.
 *
 * PHASE 44 — REMOVED the persistent latch: a single transient quota failure
 * must not exile every later reply to the browser's (possibly English) voice
 * for the rest of the chat. Availability is re-probed on every press now; the
 * server cache makes repeated presses near-free.
 */
export function resetSpeechAvailability(): void {}

/**
 * PHASE 57 — one stored reply's voice, sentence by sentence, as it is made.
 *
 * The reason this exists next to `fetchSpeechAudio` is measured: that call
 * answers "give me the whole reply's audio", so nothing could be played until
 * the *last* sentence was synthesized — 6.9–7.7s for a 160-character reply,
 * while the text was on screen in 1.5s. A button that silent for seven seconds
 * reads as broken. This stream starts delivering the moment the first sentence
 * exists (~3s), and a second press is nearly free because each sentence is
 * cached on its own.
 *
 * Same guarantees as the buffered route: ids only, never text; the words come
 * from the stored reply. Throwing is meaningful — a 503 (`SpeechUnavailableError`)
 * or any other failure means "use `fetchSpeechAudio`, or the browser's voice".
 */
export async function streamSpeechAudio(
  sessionId: string,
  messageId: string,
  handlers: {
    /** One playable piece, in sentence order (`seq` starts at 0). */
    onAudio: (piece: { seq: number; base64: string; mimeType: string }) => void;
    /** No more pieces; `ok:false` means the server had no usable voice. */
    onAudioEnd: (ok: boolean) => void;
  },
  /** Lets the caller stop the server synthesizing a reply nobody is listening to. */
  signal?: AbortSignal,
): Promise<void> {
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  let res: Response;
  try {
    res = await fetch(
      `/api/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}/speech/stream`,
      { method: "POST", headers, credentials: "same-origin", ...(signal ? { signal } : {}) },
    );
  } catch {
    throw new SpeechUnavailableError("تعذّر الوصول إلى الخادم");
  }
  if (res.status === 503) throw new SpeechUnavailableError("النطق على الخادم غير متاح");
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
    throw new ApiError(data?.error?.message ?? "تعذّر تحضير الصوت", res.status, data?.error?.code ?? "UNKNOWN");
  }
  if (!res.body) throw new SpeechUnavailableError("هذا المتصفح لا يدعم البثّ الحي");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  // A voice can end without an explicit `audio-end` (a dropped connection), so
  // the pieces are what decide success — not the flag's presence.
  let played = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      let boundary = pending.indexOf("\n");
      while (boundary >= 0) {
        const line = pending.slice(0, boundary).trim();
        pending = pending.slice(boundary + 1);
        if (line) {
          const event = JSON.parse(line) as ProgressStreamEvent;
          if (event.type === "audio") {
            played += 1;
            handlers.onAudio({ seq: event.seq, base64: event.base64, mimeType: event.mimeType });
          } else {
            handlers.onAudioEnd(event.ok);
          }
        }
        boundary = pending.indexOf("\n");
      }
    }
    const tail = pending.trim();
    if (tail) {
      const event = JSON.parse(tail) as ProgressStreamEvent;
      if (event.type === "audio") {
        played += 1;
        handlers.onAudio({ seq: event.seq, base64: event.base64, mimeType: event.mimeType });
      } else {
        handlers.onAudioEnd(event.ok);
      }
    }
  } finally {
    // Leaving the reader open would keep the connection (and the server's
    // synthesis) alive.
    await reader.cancel().catch(() => undefined);
  }
  if (played === 0) throw new SpeechUnavailableError("لم يصل أي صوت من الخادم");
}

/** The wire shape of one line of a streamed reply's voice. */
type ProgressStreamEvent = { type: "audio"; seq: number; base64: string; mimeType: string } | { type: "audio-end"; ok: boolean };

/** Fetches the server-generated audio for one of the student's own tutor replies. */
export async function fetchSpeechAudio(sessionId: string, messageId: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  let res: Response;
  try {
    res = await fetch(
      `/api/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}/speech`,
      { method: "POST", headers, credentials: "same-origin" },
    );
  } catch {
    throw new SpeechUnavailableError("تعذّر الوصول إلى الخادم");
  }
  // 503 = the server has no voice right now. The caller reads the reply with
  // the browser's voice for THIS press and retries the server next time.
  if (res.status === 503) {
    throw new SpeechUnavailableError("النطق على الخادم غير متاح");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
    throw new ApiError(data?.error?.message ?? "تعذّر تحضير الصوت", res.status, data?.error?.code ?? "UNKNOWN");
  }
  return res.blob();
}

export async function endSession(sessionId: string): Promise<void> {
  await api(`/sessions/${encodeURIComponent(sessionId)}/end`, { method: "POST" });
}

// PHASE 29 (D-027) — safe session recap: a metadata-only (never message
// content) summary the student and a linked parent can both read.
export interface SessionRecap {
  headline: string;
  focus: string;
  lessonTitle: string | null;
  durationMinutes: number;
  userMessages: number;
  tutorMessages: number;
  attachmentCount: number;
  safetyFlagged: number;
  concepts: Array<{ title: string; attempts: number; correct: number }>;
  strengths: string[];
  suggestions: string[];
  /** True when the AI output was unusable/unsafe → deterministic fallback shown. */
  fallback: boolean;
}

export async function getSessionRecap(sessionId: string): Promise<SessionRecap | null> {
  const res = await api<{ recap: SessionRecap | null }>(`/sessions/${encodeURIComponent(sessionId)}/recap`);
  return res.recap;
}

export async function myProgress(): Promise<ProgressDetail> {
  return api<ProgressDetail>("/progress/me");
}

// --- Prerequisite graph (PHASE 95) -----------------------------------------

export interface PrerequisiteNode {
  conceptId: string;
  title: string;
  /** Raw mastery 0..1, or null when the student never attempted it. */
  mastery: number | null;
  /** 0..100 integer for display, or null when untracked. */
  percent: number | null;
  level: MasteryLevel | null;
  labelAr: string | null;
}

export interface PrerequisiteGraph {
  nodes: Array<{
    conceptId: string;
    title: string;
    mastery: number | null;
    percent: number | null;
    level: MasteryLevel | null;
    labelAr: string | null;
  }>;
  edges: Array<{ from: string; to: string }>;
  weakest: PrerequisiteNode | null;
}

/**
 * PHASE 95 — the lesson's prerequisite graph (concept order) with the student's
 * real mastery percentages. Locked to the session's own student.
 */
export async function getPrerequisites(lessonId: string): Promise<PrerequisiteGraph> {
  const res = await api<{ graph: PrerequisiteGraph }>(`/progress/prerequisites/${encodeURIComponent(lessonId)}`);
  return res.graph;
}

// --- Practice loop (PHASE 24) ----------------------------------------------

export interface PracticeQuestion {
  id: string;
  content: string;
  /** null for open (free-text) questions — options exist for MCQ only. */
  options: string[] | null;
  type: "mcq" | "open";
  conceptId: string | null;
  conceptTitle: string | null;
  difficulty: "easy" | "medium" | "hard";
}

export interface PracticeResult {
  correct: boolean;
  explanation: string | null;
  /** PHASE 30 — LLM grading of open answers: 0..1 estimate + written feedback (null for MCQ). */
  score: number | null;
  feedback: string | null;
  /** null when the question is not linked to a concept (no mastery impact). */
  mastery: { score: number; decayedScore: number; level: MasteryLevel; labelAr: string } | null;
}

/** Next practice question (weakest tracked concept first), or null when none. */
export async function getPracticeQuestion(conceptId?: string, type: "mcq" | "open" = "mcq"): Promise<PracticeQuestion | null> {
  const params = new URLSearchParams();
  if (conceptId) params.set("conceptId", conceptId);
  params.set("type", type);
  const res = await api<{ question: PracticeQuestion | null }>(`/practice/question?${params.toString()}`);
  return res.question;
}

/** Submit an MCQ answer; PHASE 31 — `timeTakenSeconds` (display → submit) is
 * sent when the client measured it, so the mastery delta can be speed-scaled. */
export async function submitPracticeAnswer(
  questionId: string,
  optionIndex: number,
  timeTakenSeconds?: number,
): Promise<PracticeResult> {
  return api<PracticeResult>(`/practice/questions/${encodeURIComponent(questionId)}/submit`, {
    method: "POST",
    body: { optionIndex, ...(timeTakenSeconds !== undefined ? { timeTakenSeconds } : {}) },
  });
}

/** PHASE 30 — submit a free-text answer to an open question (graded via `grade_open`). */
export async function submitOpenPracticeAnswer(questionId: string, answer: string): Promise<PracticeResult> {
  return api<PracticeResult>(`/practice/questions/${encodeURIComponent(questionId)}/submit`, {
    method: "POST",
    body: { answer },
  });
}

// PHASE 25 — the ranked practice plan (weakest tracked concepts first).
export interface PracticePlanItem {
  conceptId: string;
  code: string;
  title: string;
  lessonId: string | null;
  lessonTitle: string | null;
  mastery: number;
  decayedMastery: number;
  level: MasteryLevel;
  labelAr: string;
  trend: "up" | "steady" | "down";
  attempts: number;
  correct: number;
  daysSinceLastPractice: number;
  availableQuestions: number;
  /** PHASE 30 — open (free-text) questions available for this concept. */
  openQuestions: number;
  /** PHASE 28 — false for concepts never practiced (discoverable, mastery 0). */
  tracked: boolean;
  /**
   * PHASE 35 (D-037 tail) — true when the last exposure (study OR practice) is
   * at least 14 days old: decay is now eroding the concept with nothing new
   * coming in, so the plan ranks it first («راجع قبل أن ينسى»).
   */
  dueForReview: boolean;
}

/** PHASE 25 + 32 — the ranked practice plan plus the student's current daily
 * activity streak (consecutive UTC days with any answer or session). */
export interface PracticePlanResponse {
  plan: PracticePlanItem[];
  streak: number;
}

export async function getPracticePlan(): Promise<PracticePlanResponse> {
  return api<PracticePlanResponse>("/practice/plan");
}

/** PHASE 28 + 30 — generate one MCQ (default) or open question for a questionless concept. */
export async function generatePracticeQuestion(conceptId: string, kind: "mcq" | "open" = "mcq"): Promise<PracticeQuestion> {
  const res = await api<{ question: PracticeQuestion | null }>("/practice/generate", {
    method: "POST",
    body: { conceptId, kind },
  });
  if (!res.question) throw new ApiError("تعذر توليد سؤال لهذا المفهوم.", 502, "EMPTY_GENERATION");
  return res.question;
}

// --- Parent dashboard (PHASE 18) -------------------------------------------

export interface ParentLastSession {
  id: string;
  lessonTitle: string | null;
  status: "active" | "ended" | "abandoned";
  startedAt: string;
}

export interface ParentChild {
  studentId: string;
  displayName: string;
  gradeNameAr: string | null;
  curricula: string[];
  lastSession: ParentLastSession | null;
  sessionCount: number;
}

export interface ParentSessionSummary {
  id: string;
  lessonId: string | null;
  lessonTitle: string | null;
  status: "active" | "ended" | "abandoned";
  startedAt: string;
  endedAt: string | null;
  userMessages: number;
  tutorMessages: number;
  totalMessages: number;
}

export interface ParentChildDetail {
  child: {
    studentId: string;
    displayName: string;
    gradeNameAr: string | null;
    curricula: string[];
    sessionCount: number;
  };
  progress: {
    // PHASE 24: concepts carry the mastery level + Arabic label (decayed
    // read-side score) alongside the raw persisted mastery.
    // PHASE 35 (D-037 tail): practice recency (a graded answer) beside
    // exposure recency (a lesson session).
    concepts: Array<{
      conceptId: string;
      title: string;
      mastery: number;
      decayedMastery: number;
      level: MasteryLevel;
      labelAr: string;
      trend: "up" | "steady" | "down";
      lastPracticedAt: string;
      daysSinceRealPractice: number;
    }>;
    strengths: string[];
    weaknesses: string[];
  };
  sessions: ParentSessionSummary[];
}

// PHASE 23 — per-session privacy-safe detail (metadata only, never content).
export interface ParentSessionAttachment {
  id: string;
  mimeType: string;
  fileName: string | null;
  sizeBytes: number;
  itemKind: "image" | "document";
  ocrApplied: boolean;
}

export interface ParentTimelineEntry {
  id: string;
  role: "user" | "tutor" | "system";
  kind: string;
  createdAt: string;
  attachments: ParentSessionAttachment[];
  safetyFlagged: boolean;
}

export interface ParentSessionDetail {
  session: {
    id: string;
    lessonTitle: string | null;
    status: "active" | "ended" | "abandoned";
    startedAt: string;
    endedAt: string | null;
    endedReason: string | null;
    durationMinutes: number;
    userMessages: number;
    tutorMessages: number;
    totalMessages: number;
  };
  concepts: Array<{ conceptId: string; title: string; attempts: number; correct: number }>;
  safety: { flaggedTurns: number };
  timeline: ParentTimelineEntry[];
}

export async function linkParentChild(code: string): Promise<ParentChild> {
  const res = await api<{ child: ParentChild }>("/parent/link", { method: "POST", body: { code } });
  return res.child;
}

export async function listParentChildren(): Promise<ParentChild[]> {
  const res = await api<{ children: ParentChild[] }>("/parent/children");
  return res.children;
}

export async function getParentChildDetail(studentId: string): Promise<ParentChildDetail> {
  return api<ParentChildDetail>(`/parent/children/${encodeURIComponent(studentId)}`);
}

export async function getParentSessionDetail(studentId: string, sessionId: string): Promise<ParentSessionDetail> {
  return api<ParentSessionDetail>(
    `/parent/children/${encodeURIComponent(studentId)}/sessions/${encodeURIComponent(sessionId)}`,
  );
}

// PHASE 29 — parent-facing safe recap (same metadata-only guarantee).
export async function getParentSessionRecap(studentId: string, sessionId: string): Promise<SessionRecap | null> {
  const res = await api<{ recap: SessionRecap | null }>(
    `/parent/children/${encodeURIComponent(studentId)}/sessions/${encodeURIComponent(sessionId)}/recap`,
  );
  return res.recap;
}

// PHASE 93 — the parent's periodic (weekly) digest: metadata-only roll-up of
// the child's last seven days with a headline, highlights and suggested actions.
export interface ParentWeeklyFocusConcept {
  conceptId: string;
  title: string;
  attempts: number;
  correct: number;
  accuracy: number;
  mastery: number | null;
  labelAr: string | null;
}

export interface ParentWeeklyReport {
  child: { studentId: string; displayName: string; gradeNameAr: string | null };
  window: { from: string; to: string; days: number };
  activity: {
    sessions: number;
    studyMinutes: number;
    activeDays: number;
    studentMessages: number;
    tutorMessages: number;
  };
  streak: { currentDays: number; daysThisWeek: number };
  focus: {
    practiced: ParentWeeklyFocusConcept[];
    improving: ParentWeeklyFocusConcept[];
    needsWork: ParentWeeklyFocusConcept[];
  };
  masteryLevels: { strong: number; developing: number; weak: number };
  headline: string;
  highlights: string[];
  parentActions: string[];
}

export async function getParentWeeklyReport(studentId: string, days = 7): Promise<ParentWeeklyReport> {
  const res = await api<{ report: ParentWeeklyReport }>(
    `/parent/children/${encodeURIComponent(studentId)}/weekly-report?days=${days}`,
  );
  return res.report;
}

export async function unlinkParentChild(studentId: string): Promise<void> {
  await api(`/parent/children/${encodeURIComponent(studentId)}`, { method: "DELETE" });
}

/** Admin-only: a curriculum document as shown in the admin dashboard. */
export interface AdminDocument {
  id: string;
  kind: string;
  title: string;
  status: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  /** Lesson this document feeds (via its chunks). */
  lessonId: string | null;
  lessonTitle: string | null;
  chunkCount: number;
}

/** RAG scope for an ingested curriculum document (lessonId is mandatory). */
export interface CurriculumIngestScope {
  countryId: string;
  educationSystemId?: string;
  gradeId: string;
  subjectId: string;
  curriculumId: string;
  termId?: string;
  unitId?: string;
  lessonId: string;
}

export interface IngestFileResult {
  documentId: string;
  versionId: string;
  chunkCount: number;
}

export async function listAdminDocuments(): Promise<AdminDocument[]> {
  const res = await api<{ documents: AdminDocument[] }>("/admin/documents");
  return res.documents;
}

/** Admin-only: operational statistics shown on the dashboard (PHASE 17). */
export interface AdminStats {
  users: { total: number; students: number };
  sessions: { total: number; active: number; ended: number };
  messages: { total: number; user: number; tutor: number };
  documents: { total: number; ready: number };
  chunks: number;
  curricula: number;
  lessons: number;
  /** PHASE 27 — subscription funnel (stored tiers + effective premium). */
  subscriptions: {
    total: number;
    free: number;
    premium: number;
    /** Effective premium: trialing/active AND not expired. */
    active: number;
    /** Percentage of students with an effective premium plan (0–100). */
    conversionRate: number;
  };
  /** PHASE 27 — AI usage + cache savings (counters only, no content). */
  ai: {
    calls: number;
    byOperation: Record<string, number>;
    tokens: number;
    costUsd: number;
    cache: { hits: number; misses: number; hitRate: number; size: number; maxEntries: number };
    /** Estimate: recorded per-call average × cache hits (tokens). */
    estimatedSavingsTokens: number;
    /** Estimate: recorded per-call average × cache hits (USD). */
    estimatedSavingsUsd: number;
  };
  /** PHASE 34 — time analytics: UTC-day activity buckets + most-active lessons. */
  trends: {
    /** Window length in days (14). */
    days: number;
    /** Days in the window that had at least one session. */
    activeDays: number;
    sessionsByDay: Array<{ day: string; count: number }>;
    messagesByDay: Array<{ day: string; count: number }>;
    aiByDay: Array<{ day: string; calls: number; tokens: number; costUsd: number }>;
    topLessons: Array<{ lessonId: string; title: string; sessions: number }>;
    /** Sums over the whole window (the chart's headline numbers). */
    totals: { sessions: number; messages: number; aiCalls: number; aiCostUsd: number };
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await api<{ stats: AdminStats }>("/admin/stats");
  return res.stats;
}

/** PHASE 28 — admin bulk generation: one MCQ per eligible concept in a curriculum. */
export interface AdminQuestionGenResult {
  generated: number;
  skipped: number;
  failed: number;
  items: Array<{ conceptId: string; title: string; status: "generated" | "skipped" | "failed"; error?: string }>;
}

export async function adminGenerateQuestions(curriculumId: string): Promise<AdminQuestionGenResult> {
  const res = await api<{ result: AdminQuestionGenResult }>("/admin/questions/generate", {
    method: "POST",
    body: { curriculumId },
  });
  return res.result;
}

export async function ingestCurriculumFile(input: {
  fileName: string;
  dataUrl: string;
  title?: string;
  source?: string;
  scope: CurriculumIngestScope;
}): Promise<IngestFileResult> {
  const res = await api<{ document: IngestFileResult }>("/admin/documents/ingest-file", {
    method: "POST",
    body: input,
  });
  return res.document;
}

// --- PHASE 20 — subscriptions & achievements ---------------------------------

export type SubscriptionPlan = "free" | "premium";

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: "trialing" | "active" | "past_due" | "cancelled";
  startedAt: string | null;
  expiresAt: string | null;
  /** Daily tutor-call allowance from the effective plan (0 = unlimited). */
  dailyLimit: number;
}

export async function getMySubscription(): Promise<SubscriptionInfo> {
  return api<SubscriptionInfo>("/me/subscription");
}

export interface AchievementInfo {
  code: string;
  title: string;
  description: string | null;
  /** ISO timestamp when earned, or null while still locked. */
  awardedAt: string | null;
}

export interface AchievementsResult {
  achievements: AchievementInfo[];
  earned: number;
  total: number;
}

export async function getMyAchievements(): Promise<AchievementsResult> {
  return api<AchievementsResult>("/achievements/me");
}

/** Admin-only: every student's subscription row (PHASE 20). */
export interface AdminSubscriptionRow {
  studentId: string;
  plan: SubscriptionPlan;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  studentName: string | null;
  studentEmail: string;
}

export async function listSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const res = await api<{ subscriptions: AdminSubscriptionRow[] }>("/admin/subscriptions");
  return res.subscriptions;
}

export async function setStudentSubscription(
  studentId: string,
  body: { plan: SubscriptionPlan; status?: string; expiresAt?: string | null },
): Promise<SubscriptionInfo> {
  const res = await api<{ subscription: SubscriptionInfo }>(`/admin/subscriptions/students/${encodeURIComponent(studentId)}`, {
    method: "PUT",
    body,
  });
  return res.subscription;
}