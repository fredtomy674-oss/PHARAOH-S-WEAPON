import { useEffect, useState } from "react";
import {
  getParentChildDetail,
  getParentSessionDetail,
  getParentSessionRecap,
  getParentWeeklyReport,
  linkParentChild,
  listParentChildren,
  unlinkParentChild,
  type ParentChild,
  type ParentChildDetail,
  type ParentSessionDetail,
  type ParentSessionSummary,
  type ParentWeeklyReport,
  type SessionRecap,
  type User,
} from "./api.js";
import { Button, Card, Chip } from "./components/ui/index.js";
import { SessionRecapCard } from "./RecapCard.js";

const KIND_LABEL: Record<string, string> = {
  text: "نص",
  hint: "تلميح",
  question: "سؤال",
  example: "مثال",
  feedback: "تغذية راجعة",
  system: "نظام",
};

/**
 * عدد صحيح بصيغة عربية سليمة: ١ ⇒ forms.one (بلا رقم) · ٢ ⇒ forms.two ·
 * ٣–١٠ ⇒ جمع القلة · ١١+ ⇒ مفرد منصوب. (٠ يقع على «many» — «0 جلسة» مقروءة.)
 */
function arCount(n: number, forms: { one: string; two: string; few: string; many: string }): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

const SESSIONS_WORD = { one: "جلسة واحدة", two: "جلستان", few: "جلسات", many: "جلسة" };
const MINUTES_WORD = { one: "دقيقة واحدة", two: "دقيقتان", few: "دقائق", many: "دقيقة" };
const ASK_WORD = { one: "سؤال واحد", two: "سؤالان", few: "أسئلة", many: "سؤالًا" };
const REPLY_WORD = { one: "رد واحد", two: "ردان", few: "ردود", many: "ردًا" };

/**
 * PHASE 178 — جدول المناهج كان يُلقى كاملًا في سطر واحد (طالب تجريبي واحد:
 * ٤٥ تسجيلًا = جدار نصّ يتجاوز الشاشة). نعرض اسمين ثم عدّادًا — والقائمة
 * الكاملة تبقى متاحة في `title` (يقرأها قارئ الشاشة واللمسة المطوّلة).
 */
function summarizeCurricula(list: string[], max = 2): { text: string; full: string } {
  const names = [...new Set(list)];
  const full = names.join("، ");
  if (names.length === 0) return { text: "بدون مناهج", full: "" };
  if (names.length <= max) return { text: full, full };
  return { text: `${names.slice(0, max).join("، ")} +${names.length - max} أخرى`, full };
}

interface Props {
  user: User;
}

/**
 * PHASE 163 (W9) — «مركز ولي الأمر»: إعادة بناء كاملة لواجهة PHASE 18/23/35/93
 * بالهوية الجديدة — نفس البيانات ونفس العقود (`parent-*` كلها حرفية) لكن بسرد
 * بشري مطمئن: رسالة المعلّم الأسبوعية، «كيف أساعد؟» بثلاث خطوات، خريطة إتقان
 * حيّة، وتقرير أسبوعي — وكلها من بيانات وصفية فقط: صفر نصوص محادثات، وشارة
 * صريحة بذلك. الجلسات وتفاصيلها (الخط الزمني الآمن) كما هي بعقودها.
 */
export function ParentScreen({ user }: Props) {
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
  // PHASE 93 — the child's weekly digest; PHASE 163 adds the human layer
  // (teacher message + help plan) on the same payload.
  const [weekly, setWeekly] = useState<ParentWeeklyReport | null>(null);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
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
    setWeekly(null);
    setWeeklyError(null);
    setWeeklyLoading(true);
    try {
      setDetail(await getParentChildDetail(child.studentId));
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "تعذر تحميل بيانات الطالب");
    } finally {
      setBusy(false);
    }
    // The digest is a separate, optional surface: a failure here must not hide
    // the child's progress view, so it owns its own error state.
    try {
      setWeekly(await getParentWeeklyReport(child.studentId));
    } catch (e) {
      setWeeklyError(e instanceof Error ? e.message : "تعذر تحميل تقرير الأسبوع");
    } finally {
      setWeeklyLoading(false);
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

  // ------------------------------ تفاصيل الجلسة ------------------------------
  if (sessionDetail) {
    const s = sessionDetail.session;
    return (
      <main className="pc-main" data-testid="parent-session-detail">
        <div className="pc-topbar">
          <Button variant="ghost" size="sm" data-testid="parent-session-back" onClick={() => setSessionDetail(null)}>
            → عودة للتقدّم
          </Button>
        </div>

        <header className="pc-lead">
          <h1 className="pc-lead__title">{s.lessonTitle ?? "درس غير محدد"}</h1>
          <div className="pc-hero__meta">
            <span className={`pc-status ${s.status === "active" ? "pc-status--on" : "pc-status--off"}`}>
              {s.status === "active" ? "مفتوحة" : "منتهية"}
            </span>
            <Chip>{new Date(s.startedAt).toLocaleString("ar-EG")}</Chip>
            {s.endedAt && <Chip>حتى {new Date(s.endedAt).toLocaleString("ar-EG")}</Chip>}
            <Chip>{arCount(s.durationMinutes, MINUTES_WORD)}</Chip>
            <Chip>
              {arCount(s.userMessages, ASK_WORD)} · {arCount(s.tutorMessages, REPLY_WORD)}
            </Chip>
            {s.endedReason && s.endedReason !== "user_request" && <Chip>النهاية: {s.endedReason}</Chip>}
          </div>
          <p className="pc-lead__sub">
            {detail?.child.displayName ?? ""} — هذه الصفحة وصفية فقط: الأعداد والمفاهيم والزمن، ولا تعرض نصوص المحادثة أبدًا.
          </p>
          {sessionDetailError && (
            <p className="pc-error" data-testid="parent-session-error">
              {sessionDetailError}
            </p>
          )}
        </header>

        {sessionDetail.safety.flaggedTurns > 0 && (
          <section className="pc-safety" data-testid="parent-safety-warning">
            <h3 className="pc-safety__title">⚠️ تنبيه سلامة</h3>
            <p className="pc-safety__text">
              {sessionDetail.safety.flaggedTurns} محاولة/رد محجوب لأسلوب يتجاوز قواعد النظام أثناء هذه الجلسة — راجعتها المعلّم
              وردّت بأمان.
            </p>
          </section>
        )}

        <Card title="مفاهيم عُرضت في الجلسة">
          {sessionDetail.concepts.length === 0 ? (
            <p className="pc-empty" data-testid="parent-session-concepts-empty">
              لا توجد تقييمات مفاهيم مسجّلة في هذه الجلسة.
            </p>
          ) : (
            <ul className="pc-rows" data-testid="parent-session-concepts">
              {sessionDetail.concepts.map((c) => (
                <li key={c.conceptId} className="pc-row">
                  <span className="pc-row__title">{c.title}</span>
                  <span className="pc-row__meta">
                    <span className="pc-recency">
                      {c.correct}/{c.attempts} إجابات صحيحة
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="ملخص الجلسة الآمن" hint="عنوان الدرس والأعداد والمفاهيم فقط — لا تعرض نصوص المحادثة أبدًا.">
          {parentRecapState === "idle" && (
            <Button size="sm" data-testid="parent-recap-button" onClick={loadParentRecap}>
              عرض الملخص
            </Button>
          )}
          {parentRecapState === "loading" && (
            <p className="pc-empty" data-testid="parent-recap-loading">
              جارٍ إعداد الملخص…
            </p>
          )}
          {parentRecapState === "loaded" &&
            (parentRecap === null ? (
              <p className="pc-empty" data-testid="parent-recap-empty">
                لا توجد محادثة في هذه الجلسة لعرض ملخصها.
              </p>
            ) : (
              <SessionRecapCard recap={parentRecap} testIdPrefix="parent-" />
            ))}
        </Card>

        <Card title="النشاط" hint="سجل وصفي فقط — الأدوار والأزمنة والمرفقات، بلا نصوص.">
          <ul className="pc-timeline" data-testid="parent-timeline">
            {sessionDetail.timeline.map((entry) => (
              <li key={entry.id} className="pc-timeline__entry" data-testid="parent-timeline-entry">
                <div className="pc-timeline__line">
                  <span
                    className={`pc-role ${
                      entry.role === "user" ? "pc-role--user" : entry.role === "tutor" ? "pc-role--tutor" : "pc-role--system"
                    }`}
                  >
                    {entry.role === "user" ? "رسالة الطالب" : entry.role === "tutor" ? "إجابة المعلّم" : "نظام"}
                  </span>
                  <span className="pc-timeline__kind">{KIND_LABEL[entry.kind] ?? entry.kind}</span>
                  <span className="pc-timeline__when">{new Date(entry.createdAt).toLocaleTimeString("ar-EG")}</span>
                  {entry.safetyFlagged && (
                    <span className="pc-flag" data-testid="parent-flag-badge">
                      محجوب (أمان)
                    </span>
                  )}
                </div>
                {entry.attachments.length > 0 && (
                  <div>
                    {entry.attachments.map((a) => (
                      <span key={a.id} className="pc-attach" data-testid="parent-attachment-chip">
                        {a.itemKind === "image" ? "🖼️ صورة" : "📄 مستند"}: {a.fileName ?? a.mimeType}
                        {a.ocrApplied ? " (نص ممسوح ضوئيًا)" : ""}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </main>
    );
  }

  // ------------------------------ تقدّم ابن/ابنة ------------------------------
  if (detail) {
    return (
      <main className="pc-main" data-testid="parent-child-detail">
        <div className="pc-topbar">
          <Button variant="ghost" size="sm" data-testid="parent-back" onClick={() => setDetail(null)}>
            → عودة لمركز ولي الأمر
          </Button>
        </div>

        <header className="pc-lead">
          <h1 className="pc-lead__title">تقدّم {detail.child.displayName}</h1>
          <span className="pc-privacy" data-testid="parent-privacy-badge">
            🛡️ وصفية فقط — لا نقرأ محادثات ابنك
          </span>
          <p className="pc-lead__sub">
            كل ما هنا مبني على البيانات الوصفية: الأعداد، المفاهيم، الإتقان والزمن. المحادثات تبقى بين الطالب والمعلّم.
          </p>
        </header>

        <Card>
          <div className="pc-hero__meta">
            <Chip tone="gold">{detail.child.gradeNameAr ?? "بدون تحديد صف"}</Chip>
            {/* نفس المنهج قد يُسجَّل أكثر من مرة في البيانات (تسجيل مزدوج) —
                نعرضه مرة واحدة: لا مفتاح React مكرر ولا تكرار بصري. */}
            {(() => {
              const names = [...new Set(detail.child.curricula)];
              return (
                <>
                  {names.slice(0, 3).map((c) => (
                    <Chip key={c}>{c}</Chip>
                  ))}
                  {names.length > 3 && <Chip>+{names.length - 3}</Chip>}
                </>
              );
            })()}
            <Chip>{arCount(detail.child.sessionCount, SESSIONS_WORD)}</Chip>
          </div>
          {detailError && (
            <p className="pc-error" data-testid="parent-detail-error">
              {detailError}
            </p>
          )}
        </Card>

        {weeklyError && (
          <p className="pc-error" data-testid="parent-weekly-error">
            {weeklyError}
          </p>
        )}
        {weeklyLoading && !weekly && (
          <Card data-testid="parent-weekly-loading">
            <p className="pc-empty">جارٍ إعداد رسالة المعلّم وتقرير الأسبوع…</p>
          </Card>
        )}

        {/* رسالة المعلّم — إنجاز الأسبوع · نقطة تحتاج نظرة · خطوة واحدة */}
        {weekly && (
          <section className="pc-letter" data-testid="parent-teacher-message">
            <span className="pc-letter__from">
              <span aria-hidden="true">✉️</span> رسالة المعلّم — آخر {weekly.window.days} أيام
            </span>
            {weekly.teacherMessage.achieved.length > 0 && (
              <div className="pc-letter__sec">
                <span className="pc-letter__label">أنجز {detail.child.displayName}:</span>
                <ul className="pc-letter__list" data-testid="parent-teacher-achieved">
                  {weekly.teacherMessage.achieved.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {weekly.teacherMessage.attention && (
              <p className="pc-letter__attention" data-testid="parent-teacher-attention">
                ⚠️ {weekly.teacherMessage.attention}
              </p>
            )}
            <div className="pc-letter__step">
              <span className="pc-letter__step-icon" aria-hidden="true">
                🎯
              </span>
              <span className="pc-letter__step-text" data-testid="parent-teacher-step">
                {weekly.teacherMessage.step}
              </span>
            </div>
          </section>
        )}

        {/* كيف أساعد؟ — ثلاث خطوات عملية حتمية من أرقام الأسبوع */}
        {weekly && (
          <Card
            title={`كيف أساعد ${detail.child.displayName} هذا الأسبوع؟`}
            hint="ثلاث خطوات عملية من أرقام الأسبوع — بلا نصوص محادثات."
          >
            <ol className="pc-help" data-testid="parent-help-plan">
              {weekly.helpPlan.map((s, i) => (
                <li key={i} className="pc-help__step" data-testid="parent-help-step">
                  <span className="pc-help__num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="pc-help__body">
                    <span className="pc-help__title">{s.title}</span>
                    <p className="pc-help__detail">{s.detail}</p>
                    <span className="pc-help__mins">⏱ {arCount(s.minutes, MINUTES_WORD)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* تقرير الأسبوع — نفس أرقام PHASE 93 بنفس العقود */}
        {weekly && (
          <Card data-testid="parent-weekly-report" title={`تقرير الأسبوع · آخر ${weekly.window.days} أيام`}>
            <p className="pc-weekly__headline" data-testid="parent-weekly-headline">
              {weekly.headline}
            </p>
            <div className="pc-stats" data-testid="parent-weekly-stats">
              <div className="pc-stat">
                <span className="pc-stat__value" data-testid="parent-weekly-sessions">
                  {weekly.activity.sessions}
                </span>
                <span className="pc-stat__label">جلسات</span>
              </div>
              <div className="pc-stat">
                <span className="pc-stat__value" data-testid="parent-weekly-minutes">
                  {weekly.activity.studyMinutes}
                </span>
                <span className="pc-stat__label">دقيقة تعلّم</span>
              </div>
              <div className="pc-stat">
                <span className="pc-stat__value" data-testid="parent-weekly-activedays">
                  {weekly.activity.activeDays}
                </span>
                <span className="pc-stat__label">أيام نشاط</span>
              </div>
              <div className="pc-stat">
                <span className="pc-stat__value" data-testid="parent-weekly-streak">
                  {weekly.streak.currentDays}
                </span>
                <span className="pc-stat__label">أيام متتالية</span>
              </div>
            </div>
            {weekly.highlights.length > 0 && (
              <ul className="pc-bullets" data-testid="parent-weekly-highlights">
                {weekly.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
            {weekly.parentActions.length > 0 && (
              <div className="pc-actions" data-testid="parent-weekly-actions">
                <h4 className="pc-actions__title">ماذا تفعل هذا الأسبوع؟</h4>
                <ul className="pc-bullets">
                  {weekly.parentActions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {weekly.focus.needsWork.length > 0 && (
              <p className="pc-hint" data-testid="parent-weekly-needswork">
                <span className="pc-hint__key">تحتاج دعمًا هذا الأسبوع:</span>{" "}
                {weekly.focus.needsWork.map((c) => `${c.title} (${Math.round(c.accuracy * 100)}%)`).join("، ")}
              </p>
            )}
          </Card>
        )}

        {/* خريطة الإتقان — شريط توزيع حيّ فوق صفوف المفاهيم القائمة */}
        <Card data-testid="parent-progress-card" title="خريطة الإتقان">
          {weekly && weekly.masteryLevels.strong + weekly.masteryLevels.developing + weekly.masteryLevels.weak > 0 && (
            <div className="pc-map" data-testid="parent-mastery-map">
              <div
                className="pc-map__bar"
                role="img"
                aria-label={`${weekly.masteryLevels.strong} متقن · ${weekly.masteryLevels.developing} في الطريق · ${weekly.masteryLevels.weak} يحتاج دعمًا`}
              >
                <span className="pc-map__seg pc-map__seg--strong" style={{ flexGrow: weekly.masteryLevels.strong }} />
                <span className="pc-map__seg pc-map__seg--developing" style={{ flexGrow: weekly.masteryLevels.developing }} />
                <span className="pc-map__seg pc-map__seg--weak" style={{ flexGrow: weekly.masteryLevels.weak }} />
              </div>
              <div className="pc-map__legend">
                <span>
                  <span className="pc-dot pc-dot--strong" aria-hidden="true" />
                  متقن: {weekly.masteryLevels.strong}
                </span>
                <span>
                  <span className="pc-dot pc-dot--developing" aria-hidden="true" />
                  في الطريق: {weekly.masteryLevels.developing}
                </span>
                <span>
                  <span className="pc-dot pc-dot--weak" aria-hidden="true" />
                  يحتاج دعمًا: {weekly.masteryLevels.weak}
                </span>
              </div>
            </div>
          )}
          {detail.progress.concepts.length === 0 ? (
            <p className="pc-empty" data-testid="parent-progress-empty">
              لا توجد بيانات تقدّم بعد.
            </p>
          ) : (
            <ul className="pc-rows" data-testid="parent-progress-list">
              {detail.progress.concepts.map((c) => (
                <li key={c.conceptId} className="pc-row" data-testid="parent-progress-row">
                  <span className="pc-row__title">{c.title}</span>
                  <span className="pc-row__meta">
                    <span
                      className={`pc-level ${c.level === "mastered" || c.level === "advanced" ? "pc-level--ok" : "pc-level--warn"}`}
                      data-testid="parent-progress-level"
                    >
                      {c.labelAr} · {Math.round(c.mastery * 100)}%
                    </span>
                    {/* PHASE 35 (D-037 tail) — «آخر ممارسة» counts graded
                        answers only, so a parent can tell real practice from
                        mere exposure to a lesson. */}
                    <span className="pc-recency" data-testid="parent-progress-last-practice">
                      {c.daysSinceRealPractice === 0 ? "آخر ممارسة اليوم" : `آخر ممارسة منذ ${c.daysSinceRealPractice} يوم`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {detail.progress.strengths.length > 0 && (
            <p className="pc-hint">
              <span className="pc-hint__key">نقاط قوة:</span> {detail.progress.strengths.join("، ")}
            </p>
          )}
          {detail.progress.weaknesses.length > 0 && (
            <p className="pc-hint">
              <span className="pc-hint__key">تحتاج تركيزًا:</span> {detail.progress.weaknesses.join("، ")}
            </p>
          )}
        </Card>

        {/* الجلسات */}
        <Card title="الجلسات" hint="بيانات وصفية فقط — الأعداد والتواريخ، بلا نصوص.">
          {detail.sessions.length === 0 ? (
            <p className="pc-empty" data-testid="parent-sessions-empty">
              لا توجد جلسات بعد.
            </p>
          ) : (
            <ul className="pc-sessions" data-testid="parent-sessions-list">
              {detail.sessions.map((s) => (
                <li key={s.id} className="pc-session" data-testid="parent-session-row">
                  <div className="pc-session__text">
                    <span className={`pc-status ${s.status === "active" ? "pc-status--on" : "pc-status--off"}`}>
                      {s.status === "active" ? "مفتوحة" : "منتهية"}
                    </span>
                    <span className="pc-session__title">{s.lessonTitle ?? "درس غير محدد"}</span>
                    <span className="pc-session__when">{new Date(s.startedAt).toLocaleString("ar-EG")}</span>
                  </div>
                  <div className="pc-session__side">
                    <span className="pc-session__counts" data-testid="parent-session-counts">
                      رسائل: {s.totalMessages} ({arCount(s.userMessages, ASK_WORD)} · {arCount(s.tutorMessages, REPLY_WORD)})
                    </span>
                    <Button size="sm" data-testid="parent-session-open" onClick={() => openSession(detail.child, s)}>
                      التفاصيل
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    );
  }

  // ------------------------------ مركز ولي الأمر ------------------------------
  return (
    <main className="pc-main" data-testid="parent-screen">
      <header className="pc-lead">
        <h1 className="pc-lead__title">مركز ولي الأمر</h1>
        <span className="pc-privacy" data-testid="parent-privacy-badge">
          🛡️ وصفية فقط — لا نقرأ محادثات ابنك
        </span>
        <p className="pc-lead__sub">
          أهلاً {user.email} 👋 — تابع تقدّم أبنائك بقراءة فقط: رسالة المعلّم الأسبوعية، خريطة الإتقان، والجلسات — دون الاطلاع على
          نصوص المحادثات.
        </p>
      </header>

      <Card title="ربط طالب جديد" hint="اسأل الطالب عن «كود ولي الأمر» الظاهر في درج حسابه ☰ ثم أدخله هنا.">
        <div className="pc-field">
          <input
            className="pc-input"
            data-testid="parent-link-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleLink();
            }}
            placeholder="مثال: SLH7KQ9M"
            maxLength={32}
            disabled={busy}
            aria-label="كود ربط الطالب"
          />
          <Button data-testid="parent-link-submit" onClick={handleLink} disabled={busy || code.trim().length === 0}>
            ربط
          </Button>
        </div>
        {linkError && (
          <p className="pc-error" data-testid="parent-link-error">
            {linkError}
          </p>
        )}
        {linkMessage && (
          <p className="pc-ok" data-testid="parent-link-success">
            {linkMessage}
          </p>
        )}
      </Card>

      <Card title="أبنائي" hint="كل شيء هنا بقراءة فقط — والتفاصيل وصفية أبدًا.">
        {listError && (
          <p className="pc-error" data-testid="parent-list-error">
            {listError}
          </p>
        )}
        {children.length === 0 ? (
          <p className="pc-empty" data-testid="parent-no-children">
            لا يوجد أبناء مربوطون بعد — أدخل كود ربط أحد الطلاب أعلاه.
          </p>
        ) : (
          <ul className="pc-children" data-testid="parent-children-list">
            {children.map((c) => {
              const curricula = summarizeCurricula(c.curricula);
              return (
              <li key={c.studentId} className="pc-child" data-testid="parent-child-row" data-student-id={c.studentId}>
                <span className="pc-child__avatar" aria-hidden="true">
                  {c.displayName.trim().charAt(0) || "ط"}
                </span>
                <div className="pc-child__text">
                  <span className="pc-child__name">{c.displayName}</span>
                  <span className="pc-child__meta">
                    {c.gradeNameAr ?? "بدون صف"} · <span title={curricula.full}>{curricula.text}</span>
                  </span>
                  <span className="pc-child__meta">
                    {arCount(c.sessionCount, SESSIONS_WORD)}
                    {c.lastSession ? ` · آخرها: ${c.lastSession.lessonTitle ?? "—"}` : ""}
                  </span>
                </div>
                <div className="pc-child__actions">
                  <Button size="sm" data-testid="parent-child-open" onClick={() => openChild(c)}>
                    عرض التقدّم
                  </Button>
                  <Button size="sm" variant="ghost" data-testid="parent-child-unlink" onClick={() => handleUnlink(c)}>
                    إلغاء الربط
                  </Button>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
