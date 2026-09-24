import { useEffect, useState } from "react";
import { getMyAchievements, type AchievementsResult, type User } from "./api.js";

interface Props {
  user: User;
  onBack: () => void;
}

/**
 * PHASE 20 — gamification: every definition (earned + locked) of the student's
 * own progress. Earned badges show a date; locked ones stay greyed out.
 */
export function AchievementsScreen({ user, onBack }: Props) {
  const [data, setData] = useState<AchievementsResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMyAchievements()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <strong>سلاح الفرعون</strong>
          <span className="muted">🏆 إنجازاتي</span>
          <button className="btn ghost" onClick={onBack} data-testid="achievements-back">
            عودة
          </button>
        </div>
      </header>

      <main className="container" data-testid="achievements-screen">
        <section className="hero card">
          <h2>🏆 إنجازات {user.student?.displayName ?? user.email}</h2>
          {data && (
            <p className="muted">
              حصلت على <b data-testid="achievements-earned">{data.earned}</b> من <b>{data.total}</b> شارة — تابع واجمعها كلها!
            </p>
          )}
        </section>

        {error && <p className="muted">تعذّر تحميل الإنجازات — حاول مرة أخرى.</p>}

        {data && (
          <section className="card">
            <ul className="achievement-list" data-testid="achievement-list">
              {data.achievements.map((a) => {
                const earned = a.awardedAt !== null;
                return (
                  <li key={a.code} className={`achievement-row ${earned ? "" : "locked"}`} data-testid="achievement-row" data-code={a.code} data-earned={earned}>
                    <span className="achievement-icon" aria-hidden="true">
                      {earned ? "🏆" : "🔒"}
                    </span>
                    <div className="achievement-body">
                      <b className="achievement-title" data-testid="achievement-title">
                        {a.title}
                      </b>
                      <span className="muted">{a.description}</span>
                    </div>
                    <time className="muted">
                      {earned ? new Date(a.awardedAt!).toLocaleDateString("ar-EG") : "غير مكتملة"}
                    </time>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}