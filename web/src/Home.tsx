import { useEffect, useState } from "react";
import { listSessions, myProgress, type User, type LearningSession, type ProgressDetail } from "./api.js";

interface Props {
  user: User;
  onStartLesson: () => void;
  onResume: (s: LearningSession) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export function HomeScreen({ user, onStartLesson, onResume, onLogout, onOpenAdmin }: Props) {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [progress, setProgress] = useState<ProgressDetail | null>(null);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => undefined);
    myProgress().then(setProgress).catch(() => undefined);
  }, []);

  const studentName = user.student?.displayName ?? user.email;

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <strong>المعلم الفاروق</strong>
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

        {progress && (
          <section className="card" data-testid="progress-card">
            <h3>تقدّمك</h3>
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