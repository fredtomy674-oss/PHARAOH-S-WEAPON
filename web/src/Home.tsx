import { useEffect, useState } from "react";
import {
  getMySubscription,
  getPracticeQuestion,
  listSessions,
  myProgress,
  submitPracticeAnswer,
  type LearningSession,
  type PracticeQuestion,
  type PracticeResult,
  type ProgressDetail,
  type SubscriptionInfo,
  type User,
} from "./api.js";

interface Props {
  user: User;
  onStartLesson: () => void;
  onResume: (s: LearningSession) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenAchievements: () => void;
}

interface PracticeState {
  question: PracticeQuestion | null;
  chosen: number | null;
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

  useEffect(() => {
    listSessions().then(setSessions).catch(() => undefined);
    myProgress().then(setProgress).catch(() => undefined);
    if (user.role === "student") {
      getMySubscription().then(setSubscription).catch(() => undefined);
    }
  }, [user.role]);

  const studentName = user.student?.displayName ?? user.email;

  async function startPractice() {
    setPractice({ question: null, chosen: null, result: null, busy: false, loading: true, error: null });
    try {
      const question = await getPracticeQuestion();
      setPractice((p) => (p ? { ...p, question, loading: false } : p));
    } catch {
      setPractice((p) => (p ? { ...p, loading: false, error: "تعذر تحميل سؤال التمرين." } : p));
    }
  }

  async function nextPractice() {
    setPractice((p) => (p ? { ...p, question: null, chosen: null, result: null, loading: true, error: null } : p));
    try {
      const question = await getPracticeQuestion();
      setPractice((p) => (p ? { ...p, question, loading: false } : p));
    } catch {
      setPractice((p) => (p ? { ...p, loading: false, error: "تعذر تحميل سؤال التمرين." } : p));
    }
  }

  async function submitPractice() {
    if (!practice?.question || practice.chosen === null || practice.busy) return;
    setPractice((p) => (p ? { ...p, busy: true, error: null } : p));
    try {
      const result = await submitPracticeAnswer(practice.question.id, practice.chosen);
      setPractice((p) => (p ? { ...p, busy: false, result } : p));
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
              <button className="btn ghost" onClick={startPractice} data-testid="open-practice">
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
          </section>
        )}

        {practice && (
          <section className="card" data-testid="practice-panel">
            <div className="row-between">
              <h3>تمرين سريع</h3>
              <button className="btn ghost" onClick={() => setPractice(null)} data-testid="practice-close">
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
                <div className="option-list">
                  {practice.question.options.map((opt, i) => (
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
                {practice.result && (
                  <p className={practice.result.correct ? "ok-text" : "warn-text"} data-testid="practice-feedback">
                    {practice.result.correct ? "إجابة صحيحة 🎉" : "إجابة غير صحيحة — راجع الشرح ثم أعد المحاولة."}
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
                    disabled={practice.chosen === null || practice.busy}
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
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}