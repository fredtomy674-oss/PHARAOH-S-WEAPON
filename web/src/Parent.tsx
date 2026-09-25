import { useEffect, useState } from "react";
import {
  getParentChildDetail,
  getParentSessionDetail,
  getParentSessionRecap,
  linkParentChild,
  listParentChildren,
  unlinkParentChild,
  type ParentChild,
  type ParentChildDetail,
  type ParentSessionDetail,
  type ParentSessionSummary,
  type SessionRecap,
  type User,
} from "./api.js";
import { SessionRecapCard } from "./RecapCard.js";

const KIND_LABEL: Record<string, string> = {
  text: "نص",
  hint: "تلميح",
  question: "سؤال",
  example: "مثال",
  feedback: "تغذية راجعة",
  system: "نظام",
};

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
  const [sessionDetail, setSessionDetail] = useState<ParentSessionDetail | null>(null);
  const [sessionDetailError, setSessionDetailError] = useState<string | null>(null);
  // PHASE 29 (D-027) — safe session recap (idle = button, loading = fetching,
  // loaded = card or empty note). Same metadata-only payload as the student.
  const [parentRecap, setParentRecap] = useState<SessionRecap | null>(null);
  const [parentRecapState, setParentRecapState] = useState<"idle" | "loading" | "loaded">("idle");

  useEffect(() => {
    listParentChildren().then(setChildren).catch(() => undefined);
  }, []);

  const refreshChildren = () =>
    listParentChildren()
      .then(setChildren)
      .catch(() => undefined);

  const openSession = async (child: { studentId: string }, session: ParentSessionSummary) => {
    setBusy(true);
    setSessionDetailError(null);
    setParentRecap(null);
    setParentRecapState("idle");
    try {
      setSessionDetail(await getParentSessionDetail(child.studentId, session.id));
    } catch (e) {
      setSessionDetailError(e instanceof Error ? e.message : "تعذر تحميل تفاصيل الجلسة");
    } finally {
      setBusy(false);
    }
  };

  const loadParentRecap = async () => {
    if (!detail || !sessionDetail) return;
    setParentRecapState("loading");
    setSessionDetailError(null);
    try {
      setParentRecap(await getParentSessionRecap(detail.child.studentId, sessionDetail.session.id));
      setParentRecapState("loaded");
    } catch (e) {
      setSessionDetailError(e instanceof Error ? e.message : "تعذر تحميل ملخص الجلسة");
      setParentRecapState("idle");
    }
  };

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

  if (sessionDetail) {
    const s = sessionDetail.session;
    return (
      <div className="layout">
        <header className="topbar">
          <div className="topbar-inner">
            <strong>سلاح الفرعون</strong>
            <span className="muted">تفاصيل الجلسة — {detail?.child.displayName ?? ""}</span>
            <button className="btn ghost" onClick={() => setSessionDetail(null)} data-testid="parent-session-back">
              عودة للتقدم
            </button>
            <button className="btn ghost" onClick={onLogout} data-testid="logout">
              خروج
            </button>
          </div>
        </header>

        <main className="container" data-testid="parent-session-detail">
          <section className="hero card">
            <h2>
              <span className={`badge ${s.status === "active" ? "ok" : "off"}`}>{s.status === "active" ? "مفتوحة" : "منتهية"}</span>{" "}
              {s.lessonTitle ?? "درس غير محدد"}
            </h2>
            <p className="muted">
              {new Date(s.startedAt).toLocaleString("ar-EG")}
              {s.endedAt ? ` → ${new Date(s.endedAt).toLocaleString("ar-EG")}` : ""} · {s.durationMinutes} دقيقة ·{" "}
              {s.userMessages} سؤالًا · {s.tutorMessages} ردًا
              {s.endedReason && s.endedReason !== "user_request" ? ` · النهاية: ${s.endedReason}` : ""}
            </p>
            {sessionDetailError && (
              <p className="error" data-testid="parent-session-error">
                {sessionDetailError}
              </p>
            )}
          </section>

          {sessionDetail.safety.flaggedTurns > 0 && (
            <section className="card warn" data-testid="parent-safety-warning">
              <h3>⚠️ تنبيه سلامة</h3>
              <p className="muted">
                {sessionDetail.safety.flaggedTurns} محاولة/رد محجوب لأسلوب يتجاوز قواعد النظام أثناء هذه الجلسة — راجعتها
                المعلّم وردّت بأمان.
              </p>
            </section>
          )}

          <section className="card">
            <h3>مفاهيم عُرضت في الجلسة</h3>
            {sessionDetail.concepts.length === 0 ? (
              <p className="muted" data-testid="parent-session-concepts-empty">
                لا توجد تقييمات مفاهيم مسجّلة في هذه الجلسة.
              </p>
            ) : (
              <ul className="progress-list" data-testid="parent-session-concepts">
                {sessionDetail.concepts.map((c) => (
                  <li key={c.conceptId} className="progress-row">
                    <span>{c.title}</span>
                    <span className="muted">
                      {c.correct}/{c.attempts} إجابات صحيحة
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h3>ملخص الجلسة الآمن</h3>
            <p className="muted">عنوان الدرس والأعداد والمفاهيم فقط — لا تعرض نصوص المحادثة أبدًا.</p>
            {parentRecapState === "idle" && (
              <button className="btn small primary" data-testid="parent-recap-button" onClick={loadParentRecap}>
                عرض الملخص
              </button>
            )}
            {parentRecapState === "loading" && (
              <p className="muted" data-testid="parent-recap-loading">
                جارٍ إعداد الملخص…
              </p>
            )}
            {parentRecapState === "loaded" &&
              (parentRecap === null ? (
                <p className="muted" data-testid="parent-recap-empty">
                  لا توجد محادثة في هذه الجلسة لعرض ملخصها.
                </p>
              ) : (
                <SessionRecapCard recap={parentRecap} testIdPrefix="parent-" />
              ))}
          </section>

          <section className="card">
            <h3>النشاط (بيانات وصفية فقط — بلا نصوص)</h3>
            <ul className="session-list" data-testid="parent-timeline">
              {sessionDetail.timeline.map((entry) => (
                <li key={entry.id} className="session-row" data-testid="parent-timeline-entry">
                  <div>
                    <span className={`badge ${entry.role === "user" ? "ok" : "off"}`}>
                      {entry.role === "user" ? "سؤال الطالب" : entry.role === "tutor" ? "إجابة المعلّم" : "نظام"}
                    </span>
                    <b>{KIND_LABEL[entry.kind] ?? entry.kind}</b>
                    <span className="muted">{new Date(entry.createdAt).toLocaleTimeString("ar-EG")}</span>
                    {entry.safetyFlagged && <span className="pill warn" data-testid="parent-flag-badge">محجوب (أمان)</span>}
                  </div>
                  {entry.attachments.length > 0 && (
                    <div className="muted">
                      {entry.attachments.map((a) => (
                        <span key={a.id} className="pill" data-testid="parent-attachment-chip">
                          {a.itemKind === "image" ? "🖼️ صورة" : "📄 مستند"}: {a.fileName ?? a.mimeType}
                          {a.ocrApplied ? " (نص ممسوح ضوئيًا)" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    );
  }

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
                    <span className={`pill ${c.level === "mastered" || c.level === "advanced" ? "ok-pill" : "warn"}`} data-testid="parent-progress-level">
                      {c.labelAr} · {Math.round(c.mastery * 100)}%
                    </span>
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
                    <div className="row-actions">
                      <div className="muted" data-testid="parent-session-counts">
                        رسائل: {s.totalMessages} ({s.userMessages} سؤالًا · {s.tutorMessages} ردًا)
                      </div>
                      <button className="btn small primary" data-testid="parent-session-open" onClick={() => openSession(detail.child, s)}>
                        التفاصيل
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
          <p className="muted">تابع تقدّم أبنائك بقراءة فقط: المفاهيم التي أتقنوها، الجلسات ونشاطها الزمني والوقت المستثمر — دون الاطلاع على نصوص المحادثات.</p>
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