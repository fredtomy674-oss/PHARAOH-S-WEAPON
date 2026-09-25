import { useEffect, useState } from "react";
import {
  generatePracticeQuestion,
  getMySubscription,
  getPracticePlan,
  getPracticeQuestion,
  getSessionRecap,
  listSessions,
  myProgress,
  submitPracticeAnswer,
  submitOpenPracticeAnswer,
  type LearningSession,
  type PracticePlanItem,
  type PracticeQuestion,
  type PracticeResult,
  type ProgressDetail,
  type SessionRecap,
  type SubscriptionInfo,
  type User,
} from "./api.js";
import { SessionRecapCard } from "./RecapCard.js";

interface Props {
  user: User;
  onStartLesson: () => void;
  onResume: (s: LearningSession) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenAchievements: () => void;
}

interface PracticeState {
  mode: "mcq" | "open";
  question: PracticeQuestion | null;
  chosen: number | null;
  /** Free-text answer for open questions (PHASE 30). */
  text: string;
  result: PracticeResult | null;
  busy: boolean;
  loading: boolean;
  error: string | null;
}

const DIFFICULTY_LABEL: Record<PracticeQuestion["difficulty"], string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

function trendArrow(t: "up" | "steady" | "down"): string {
  return t === "up" ? "↑" : t === "down" ? "↓" : "→";
}

export function HomeScreen({ user, onStartLesson, onResume, onLogout, onOpenAdmin, onOpenAchievements }: Props) {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [progress, setProgress] = useState<ProgressDetail | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [practice, setPractice] = useState<PracticeState | null>(null);
  // PHASE 25 — ranked practice plan (null = still loading, [] = loaded + empty).
  const [plan, setPlan] = useState<PracticePlanItem[] | null>(null);
  // PHASE 29 — session recaps per ended session (undefined = not loaded yet,
  // null = loaded but empty/no recap).
  const [recaps, setRecaps] = useState<Record<string, SessionRecap | null | undefined>>({});

  function loadRecap(s: LearningSession): void {
    setRecaps((r) => ({ ...r, [s.id]: undefined }));
    getSessionRecap(s.id)
      .then((recap) => setRecaps((r) => ({ ...r, [s.id]: recap ?? null })))
      .catch(() => setRecaps((r) => ({ ...r, [s.id]: null })));
  }

  function refreshPlan(): void {
    getPracticePlan().then(setPlan).catch(() => undefined);
  }

  useEffect(() => {
    listSessions().then(setSessions).catch(() => undefined);
    myProgress().then(setProgress).catch(() => undefined);
    if (user.role === "student") {
      getMySubscription().then(setSubscription).catch(() => undefined);
      refreshPlan();
    }
  }, [user.role]);

  const studentName = user.student?.displayName ?? user.email;

  function newPracticeState(mode: "mcq" | "open"): PracticeState {
  return { mode, question: null, chosen: null, text: "", result: null, busy: false, loading: true, error: null };
}

  async function startPractice(conceptId?: string, mode: "mcq" | "open" = "mcq") {
    setPractice(newPracticeState(mode));
    try {
      const question = await getPracticeQuestion(conceptId, mode);
      setPractice((p) => (p ? { ...p, question, loading: false } : p));
    } catch {
      setPractice((p) => (p ? { ...p, loading: false, error: "تعذر تحميل سؤال التمرين." } : p));
    }
  }

  // PHASE 28 + 30 — self-healing practice: the concept has no question of the
  // requested kind yet, so we ask the tutor's question generator to create one
  // (grounded in the lesson), then hand it straight to the practice panel.
  // Works offline via mocks.
  async function generateAndPractice(conceptId: string, kind: "mcq" | "open" = "mcq") {
    setPractice(newPracticeState(kind));
    try {
      const question = await generatePracticeQuestion(conceptId, kind);
      setPractice((p) => (p ? { ...p, question, loading: false } : p));
      refreshPlan();
    } catch {
      setPractice((p) => (p ? { ...p, loading: false, error: "تعذر توليد سؤال لهذا المفهوم." } : p));
    }
  }

  async function nextPractice() {
    if (!practice) return;
    setPractice((p) => (p ? { ...p, question: null, chosen: null, text: "", result: null, loading: true, error: null } : p));
    try {
      const question = await getPracticeQuestion(undefined, practice.mode);
      setPractice((p) => (p ? { ...p, question, loading: false } : p));
    } catch {
      setPractice((p) => (p ? { ...p, loading: false, error: "تعذر تحميل سؤال التمرين." } : p));
    }
  }

  async function submitPractice() {
    if (!practice?.question || practice.busy) return;
    if (practice.mode === "open" && !practice.text.trim()) return;
    if (practice.mode === "mcq" && practice.chosen === null) return;
    setPractice((p) => (p ? { ...p, busy: true, error: null } : p));
    try {
      const result =
        practice.mode === "open"
          ? await submitOpenPracticeAnswer(practice.question.id, practice.text)
          : await submitPracticeAnswer(practice.question.id, practice.chosen as number);
      setPractice((p) => (p ? { ...p, busy: false, result } : p));
      refreshPlan();
    } catch {
      setPractice((p) => (p ? { ...p, busy: false, error: "تعذر إرسال الإجابة." } : p));
    }
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <strong>سلاح الفرعون</strong>
          <span className="muted">معلمك الخصوصي الذكي</span>
          <button className="btn ghost" onClick={onLogout} data-testid="logout">
            خروج
          </button>
        </div>
      </header>

      <main className="container" data-testid="home-screen">
        <section className="hero card">
          <h2>أهلاً {studentName} 👋</h2>
          <p className="muted">اختر درسك من المنهج وابدأ جلسة تعلّم معي. أنا أشرح، وأسأل، ونتأكد معًا أنك فهمت فعلًا.</p>
          <button data-testid="start-lesson" className="btn primary big" onClick={onStartLesson}>
            ابدأ درسًا جديدًا
          </button>
        </section>

        {user.linkCode && (
          <section className="card" data-testid="parent-link-card">
            <h3>كود ولي الأمر</h3>
            <p className="muted">شارك هذا الكود مع ولي أمرك ليطّلع على تقدّمك وجلساتك (قراءة فقط):</p>
            <code className="link-code" data-testid="link-code-value">
              {user.linkCode}
            </code>
          </section>
        )}

        {user.role === "student" && (
          <section className="card" data-testid="subscription-card">
            <div className="row-between">
              <div>
                <h3>خطتك</h3>
                {subscription ? (
                  <p className="muted">
                    <span className={`pill ${subscription.plan === "premium" ? "ok-pill" : "off-pill"}`} data-testid="subscription-plan">
                      {subscription.plan === "premium" ? "مميزة" : "مجانية"}
                    </span>
                    {subscription.expiresAt && (
                      <span> — تنتهي {new Date(subscription.expiresAt).toLocaleDateString("ar-EG")}</span>
                    )}
                    {" "}
                    <span data-testid="subscription-limit">
                      {subscription.dailyLimit === 0 ? "رسائل اليوم: غير محدودة" : `رسائل اليوم: ${subscription.dailyLimit}`}
                    </span>
                  </p>
                ) : (
                  <p className="muted">خطتك مجانية — ارفعها عبر لوحة الإدارة.</p>
                )}
                <button className="btn ghost" onClick={onOpenAchievements} data-testid="open-achievements">
                  🏆 إنجازاتي
                </button>
              </div>
            </div>
          </section>
        )}

        {progress && (
          <section className="card" data-testid="progress-card">
            <div className="row-between">
              <h3>تقدّمك</h3>
              <button className="btn ghost" onClick={() => startPractice()} data-testid="open-practice">
                ✏️ تمرين على نقاط ضعفك
              </button>
            </div>
            <div className="stats">
              <div className="stat">
                <b data-testid="stat-concepts">{progress.progress.concepts.length}</b>
                <span className="muted">مفهوم تم تتبعه</span>
              </div>
              <div className="stat">
                <b data-testid="stat-usage-today">{progress.tutorUsageToday}</b>
                <span className="muted">رسالة اليوم</span>
              </div>
              <div className="stat">
                <b data-testid="stat-strengths">{progress.progress.strengths.length}</b>
                <span className="muted">نقطة قوة</span>
              </div>
            </div>
            {progress.progress.strengths.length > 0 && (
              <p className="muted">
                <span className="pill ok-pill">نقاط قوتك:</span> {progress.progress.strengths.join("، ")}
              </p>
            )}
            {progress.progress.weaknesses.length > 0 && (
              <p className="muted">
                <span className="pill warn">نقاط تحتاج تركيزًا:</span> {progress.progress.weaknesses.join("، ")}
              </p>
            )}

            {/* PHASE 24 — concept mastery with levels, decay and trajectory. */}
            <div className="mastery-block" data-testid="mastery-section">
              <h4>إتقان المفاهيم</h4>
              {progress.mastery.length === 0 ? (
                <p className="muted" data-testid="mastery-empty">
                  لا توجد مفاهيم متتبعة بعد — أجب عن تمارين لتظهر هنا.
                </p>
              ) : (
                <ul className="progress-list" data-testid="mastery-list">
                  {progress.mastery.map((m) => (
                    <li key={m.conceptId} className="progress-row" data-testid="mastery-concept-row">
                      <span>
                        {m.title}{" "}
                        <span className={`pill ${m.level === "mastered" || m.level === "advanced" ? "ok-pill" : "warn"}`} data-testid="mastery-level">
                          {m.labelAr}
                        </span>
                      </span>
                      <span className="muted" data-testid="mastery-meta">
                        {Math.round(m.decayedMastery * 100)}% · {m.daysSinceLastPractice === 0 ? "اليوم" : `منذ ${m.daysSinceLastPractice} يوم`}{" "}
                        <span data-testid="mastery-trend">{trendArrow(m.trend)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* PHASE 25 — ranked practice plan feeding the practice panel. */}
            <div className="plan-block" data-testid="plan-section">
              <h4>خطة ممارستك</h4>
              {plan === null ? (
                <p className="muted" data-testid="plan-loading">
                  جارٍ تحضير خطتك…
                </p>
              ) : plan.length === 0 ? (
                <p className="muted" data-testid="plan-empty">
                  لا توجد مفاهيم في خطتك بعد — انضم إلى منهج دراسي لتظهر خطة ممارستك هنا.
                </p>
              ) : (
                <ul className="progress-list" data-testid="plan-list">
                  {plan.map((item) => (
                    <li key={item.conceptId} className="progress-row" data-testid="plan-row">
                      <div className="plan-main">
                        <span>
                          {item.title}{" "}
                          <span className={`pill ${item.level === "mastered" || item.level === "advanced" ? "ok-pill" : "warn"}`} data-testid="plan-level">
                            {item.labelAr}
                          </span>
                        </span>
                        <span className="muted" data-testid="plan-meta">
                          <span data-testid="plan-lesson">{item.lessonTitle ?? "درس غير معروف"}</span> ·{" "}
                          <span data-testid="plan-questions">{item.availableQuestions} سؤال متاح</span> ·{" "}
                          {item.attempts === 0
                            ? "لم يُمارَس بعد"
                            : item.daysSinceLastPractice === 0
                              ? "اليوم"
                              : `منذ ${item.daysSinceLastPractice} يوم`}{" "}
                          <span data-testid="plan-trend">{trendArrow(item.trend)}</span>
                        </span>
                      </div>
                      <div className="plan-actions">
                        {item.availableQuestions === 0 ? (
                          // PHASE 28 — no MCQ yet → generate one on demand.
                          <button
                            className="btn small primary"
                            data-testid="plan-generate"
                            onClick={() => generateAndPractice(item.conceptId)}
                          >
                            توليد سؤال
                          </button>
                        ) : (
                          <button
                            className="btn small primary"
                            data-testid="plan-practice"
                            onClick={() => startPractice(item.conceptId)}
                          >
                            تمرّن الآن
                          </button>
                        )}
                        {item.openQuestions > 0 ? (
                          // PHASE 30 — an open (free-text) question exists for this concept.
                          <button
                            className="btn small ghost"
                            data-testid="plan-open-practice"
                            onClick={() => startPractice(item.conceptId, "open")}
                          >
                            سؤال مقالي
                          </button>
                        ) : (
                          <button
                            className="btn small ghost"
                            data-testid="plan-open-generate"
                            onClick={() => generateAndPractice(item.conceptId, "open")}
                          >
                            توليد سؤال مقالي
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {practice && (
          <section className="card" data-testid="practice-panel">
            <div className="row-between">
              <h3>تمرين سريع</h3>
              <button className="btn ghost" onClick={() => { setPractice(null); refreshPlan(); }} data-testid="practice-close">
                إغلاق
              </button>
            </div>
            {practice.loading ? (
              <p className="muted" data-testid="practice-loading">
                جارٍ تحضير سؤال لك…
              </p>
            ) : practice.error || !practice.question ? (
              <p className="error" data-testid="practice-error">
                {practice.error ?? "لا توجد أسئلة متاحة في منهجك بعد."}
              </p>
            ) : (
              <>
                <p className="muted" data-testid="practice-concept">
                  {practice.question.conceptTitle ?? "تمرين عام"} · {DIFFICULTY_LABEL[practice.question.difficulty]}
                </p>
                <p className="question-text" data-testid="practice-question">
                  {practice.question.content}
                </p>
                {practice.question.type === "open" ? (
                  // PHASE 30 — free-text answer for open questions.
                  <div className="option-list">
                    <textarea
                      className="answer-input"
                      data-testid="practice-open-input"
                      rows={3}
                      maxLength={1500}
                      placeholder="اكتب إجابتك هنا بجملة أو جملتين…"
                      value={practice.text}
                      disabled={practice.busy}
                      onChange={(e) => setPractice((p) => (p ? { ...p, text: e.target.value, result: null, chosen: null } : p))}
                    />
                  </div>
                ) : (
                  <div className="option-list">
                    {practice.question.options?.map((opt, i) => (
                      <button
                        key={i}
                        className={`btn option ${practice.chosen === i ? "selected" : ""}`}
                        data-testid="practice-option"
                        data-option-index={i}
                        disabled={practice.busy}
                        onClick={() => setPractice((p) => (p ? { ...p, chosen: i, result: null } : p))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {practice.result && (
                  <p className={practice.result.correct ? "ok-text" : "warn-text"} data-testid="practice-feedback">
                    {practice.result.feedback
                      ? practice.result.feedback
                      : practice.result.correct
                        ? "إجابة صحيحة 🎉"
                        : "إجابة غير صحيحة — راجع الشرح ثم أعد المحاولة."}
                    {practice.result.score !== null && practice.result.score !== undefined && (
                      <span className="pill warn" data-testid="practice-score">
                        التقدير: {Math.round(practice.result.score * 100)}%
                      </span>
                    )}
                    {practice.result.mastery && (
                      <span
                        className={`pill ${practice.result.mastery.level === "mastered" || practice.result.mastery.level === "advanced" ? "ok-pill" : "warn"}`}
                        data-testid="practice-mastery"
                      >
                        {practice.result.mastery.labelAr} · {Math.round(practice.result.mastery.score * 100)}%
                      </span>
                    )}
                  </p>
                )}
                {practice.result?.explanation && (
                  <p className="muted" data-testid="practice-explanation">
                    {practice.result.explanation}
                  </p>
                )}
                <div className="row-gap">
                  <button
                    className="btn primary"
                    data-testid="practice-submit"
                    disabled={
                      (practice.question.type === "open" ? practice.text.trim().length === 0 : practice.chosen === null) ||
                      practice.busy
                    }
                    onClick={submitPractice}
                  >
                    {practice.busy ? "…" : "تحقق من إجابتي"}
                  </button>
                  {practice.result && (
                    <button className="btn ghost" data-testid="practice-next" onClick={nextPractice}>
                      سؤال آخر
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {user.role === "admin" && (
          <section className="card" data-testid="admin-card">
            <h3>الإدارة</h3>
            <p className="muted">استيراد ملفات المنهج (PDF/DOCX) إلى قاعدة معرفة الدروس.</p>
            <button data-testid="open-admin" className="btn ghost" onClick={onOpenAdmin}>
              لوحة الإدارة
            </button>
          </section>
        )}

        <section className="card">
          <h3>جلساتي السابقة</h3>
          {sessions.length === 0 ? (
            <p className="muted" data-testid="no-sessions">
              لا توجد جلسات بعد — ابدأ أول درس لنا!
            </p>
          ) : (
            <ul className="session-list" data-testid="session-list">
              {sessions.map((s) => (
                <li key={s.id} className="session-row" data-testid="session-row" data-session-id={s.id} data-session-status={s.status}>
                  <div>
                    <span className={`badge ${s.status === "active" ? "ok" : "off"}`}>{s.status === "active" ? "مفتوحة" : "منتهية"}</span>
                    <span className="muted">{new Date(s.startedAt).toLocaleString("ar-EG")}</span>
                  </div>
                  {s.status === "active" && (
                    <button data-testid="resume-session" className="btn small primary" onClick={() => onResume(s)}>
                      متابعة
                    </button>
                  )}
                  {s.status === "ended" && (
                    <div className="session-recap">
                      {recaps[s.id] === undefined ? (
                        <button data-testid="session-recap-button" className="btn small ghost" onClick={() => loadRecap(s)}>
                          ملخص الجلسة
                        </button>
                      ) : recaps[s.id] === null ? (
                        <p className="muted" data-testid="session-recap-empty">
                          لا توجد محادثة في هذه الجلسة لعرض ملخصها.
                        </p>
                      ) : (
                        <SessionRecapCard recap={recaps[s.id]!} />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}