import { useEffect, useState } from "react";
import {
  getParentChildDetail,
  linkParentChild,
  listParentChildren,
  unlinkParentChild,
  type ParentChild,
  type ParentChildDetail,
  type User,
} from "./api.js";

interface Props {
  user: User;
  onLogout: () => void;
}

/**
 * Parent dashboard (PHASE 18): a read-only window into linked children's
 * progress and session summaries. Built on the student's sharing code.
 */
export function ParentScreen({ user, onLogout }: Props) {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ParentChildDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    listParentChildren().then(setChildren).catch(() => undefined);
  }, []);

  const refreshChildren = () =>
    listParentChildren()
      .then(setChildren)
      .catch(() => undefined);

  const handleLink = async () => {
    setBusy(true);
    setLinkError(null);
    setLinkMessage(null);
    try {
      const child = await linkParentChild(code);
      setLinkMessage(`تم ربط ${child.displayName} بنجاح.`);
      setCode("");
      refreshChildren();
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const openChild = async (child: ParentChild) => {
    setBusy(true);
    setDetailError(null);
    try {
      setDetail(await getParentChildDetail(child.studentId));
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "تعذر تحميل بيانات الطالب");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async (child: ParentChild) => {
    setBusy(true);
    setListError(null);
    try {
      await unlinkParentChild(child.studentId);
      refreshChildren();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "تعذر إلغاء الربط");
    } finally {
      setBusy(false);
    }
  };

  if (detail) {
    return (
      <div className="layout">
        <header className="topbar">
          <div className="topbar-inner">
            <strong>سلاح الفرعون</strong>
            <span className="muted">حساب ولي الأمر — {detail.child.displayName}</span>
            <button className="btn ghost" onClick={() => setDetail(null)} data-testid="parent-back">
              عودة
            </button>
            <button className="btn ghost" onClick={onLogout} data-testid="logout">
              خروج
            </button>
          </div>
        </header>

        <main className="container" data-testid="parent-child-detail">
          <section className="hero card">
            <h2>تقدّم {detail.child.displayName}</h2>
            <p className="muted">
              {detail.child.gradeNameAr ?? "بدون تحديد صف"} · {detail.child.curricula.join("، ")} · {detail.child.sessionCount}{" "}
              جلسة
            </p>
            {detailError && (
              <p className="error" data-testid="parent-detail-error">
                {detailError}
              </p>
            )}
          </section>

          <section className="card" data-testid="parent-progress-card">
            <h3>التقدّم حسب المفاهيم</h3>
            {detail.progress.concepts.length === 0 ? (
              <p className="muted" data-testid="parent-progress-empty">
                لا توجد بيانات تقدّم بعد.
              </p>
            ) : (
              <ul className="progress-list" data-testid="parent-progress-list">
                {detail.progress.concepts.map((c) => (
                  <li key={c.conceptId} className="progress-row" data-testid="parent-progress-row">
                    <span>{c.title}</span>
                    <span className={`pill ${c.mastery >= 0.6 ? "ok-pill" : "warn"}`}>{Math.round(c.mastery * 100)}%</span>
                  </li>
                ))}
              </ul>
            )}
            {detail.progress.strengths.length > 0 && (
              <p className="muted">
                <span className="pill ok-pill">نقاط قوة:</span> {detail.progress.strengths.join("، ")}
              </p>
            )}
            {detail.progress.weaknesses.length > 0 && (
              <p className="muted">
                <span className="pill warn">تحتاج تركيزًا:</span> {detail.progress.weaknesses.join("، ")}
              </p>
            )}
          </section>

          <section className="card">
            <h3>الجلسات</h3>
            {detail.sessions.length === 0 ? (
              <p className="muted" data-testid="parent-sessions-empty">
                لا توجد جلسات بعد.
              </p>
            ) : (
              <ul className="session-list" data-testid="parent-sessions-list">
                {detail.sessions.map((s) => (
                  <li key={s.id} className="session-row" data-testid="parent-session-row">
                    <div>
                      <span className={`badge ${s.status === "active" ? "ok" : "off"}`}>
                        {s.status === "active" ? "مفتوحة" : "منتهية"}
                      </span>
                      <b>{s.lessonTitle ?? "درس غير محدد"}</b>
                      <span className="muted">{new Date(s.startedAt).toLocaleString("ar-EG")}</span>
                    </div>
                    <div className="muted" data-testid="parent-session-counts">
                      رسائل: {s.totalMessages} ({s.userMessages} سؤالًا · {s.tutorMessages} ردًا)
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <strong>سلاح الفرعون</strong>
          <span className="muted">لوحة ولي الأمر</span>
          <button className="btn ghost" onClick={onLogout} data-testid="logout">
            خروج
          </button>
        </div>
      </header>

      <main className="container" data-testid="parent-screen">
        <section className="hero card">
          <h2>أهلاً {user.email} 👋</h2>
          <p className="muted">تابع تقدّم أبنائك بقراءة فقط: المفاهيم التي أتقنوها، الجلسات، والوقت المستثمر — دون الاطلاع على تفاصيل المحادثات.</p>
        </section>

        <section className="card">
          <h3>ربط طالب جديد</h3>
          <p className="muted">اسأل الطالب عن «كود ولي الأمر» الظاهر في صفحته الرئيسية ثم أدخله هنا.</p>
          <div className="row">
            <input
              data-testid="parent-link-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleLink();
              }}
              placeholder="مثال: SLH7KQ9M"
              maxLength={32}
              disabled={busy}
            />
            <button
              className="btn primary"
              data-testid="parent-link-submit"
              onClick={handleLink}
              disabled={busy || code.trim().length === 0}
            >
              ربط
            </button>
          </div>
          {linkError && (
            <p className="error" data-testid="parent-link-error">
              {linkError}
            </p>
          )}
          {linkMessage && (
            <p className="ok" data-testid="parent-link-success">
              {linkMessage}
            </p>
          )}
        </section>

        <section className="card">
          <h3>أبنائي</h3>
          {listError && (
            <p className="error" data-testid="parent-list-error">
              {listError}
            </p>
          )}
          {children.length === 0 ? (
            <p className="muted" data-testid="parent-no-children">
              لا يوجد أبناء مربوطون بعد — أدخل كود ربط أحد الطلاب أعلاه.
            </p>
          ) : (
            <ul className="child-list" data-testid="parent-children-list">
              {children.map((c) => (
                <li key={c.studentId} className="child-row" data-testid="parent-child-row" data-student-id={c.studentId}>
                  <div>
                    <b>{c.displayName}</b>
                    <span className="muted">
                      {c.gradeNameAr ?? "بدون صف"} · {c.curricula.length > 0 ? c.curricula.join("، ") : "بدون مناهج"}
                    </span>
                    <span className="muted">
                      {c.sessionCount} جلسة
                      {c.lastSession ? ` · آخرها: ${c.lastSession.lessonTitle ?? "—"}` : ""}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button className="btn small primary" data-testid="parent-child-open" onClick={() => openChild(c)}>
                      عرض التقدم
                    </button>
                    <button className="btn small ghost" data-testid="parent-child-unlink" onClick={() => handleUnlink(c)}>
                      إلغاء الربط
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}