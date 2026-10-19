import { useEffect, useRef, useState } from "react";
import {
  generatePracticeQuestion,
  getMySubscription,
  getPracticePlan,
  getPracticeQuestion,
  getSessionRecap,
  lessonBreadcrumb,
  listSessions,
  listSubjects,
  myProgress,
  submitPracticeAnswer,
  submitOpenPracticeAnswer,
  type LearningSession,
  type PracticePlanItem,
  type PracticeQuestion,
  type PracticeResult,
  type ProgressDetail,
  type SessionRecap,
  type Subject,
  type SubscriptionInfo,
  type User,
} from "./api.js";
import { SessionRecapCard } from "./RecapCard.js";
import { SubjectGlyph } from "./components/SubjectGlyph.js";
import { TeacherMascot } from "./TeacherMascot.js";
import { useLiveTeacherPref } from "./liveTeacherPref.js";
import { useStudentManager } from "./components/app/StudentManager.js";
import { readLastPick, weeklyPracticeItem } from "./learnPrefs.js";
import { learningStrength, strengthProgress } from "./journey/strength.js";

/**
 * PHASE 156 (W2) — الرئيسية 2.0: أُعيد بناؤها من الصفر على هوية الفاروق
 * (المرجع البصري: docs/design-lab/04-home.html — وضعان: ليل/نهار).
 *
 * الرحلة: قرار واحد بارز («خطوتك القادمة») ← مواد الطالب ← تقدّمه وخطة
 * ممارسته ← جلساته. وكل ما هو «حسابي» (كود ولي الأمر · التفضيلات · الخروج)
 * يسكن درج ☰ — والترويسة والدرج والتنقّل كلها في القشرة الموحّدة AppShell
 * (PHASE 158) التي تغلّف هذه الشاشة مع شقيقتيها (تعلّم · رحلتي).
 *
 * العقود محفوظة حرفيًا: كل الـtestids القديمة والتدفقات كما هي (تُحدَّث
 * الاختبارات فقط عند تغيّر تنقّل شرعي — وهنا: فتح الدرج قبل الخروج/كود ولي
 * الأمر، عبر helpers.openAccount).
 */

interface Props {
  user: User;
  onStartLesson: () => void;
  /** PHASE 178 — بطاقة المادة تفتح «تعلّم» وهي محدّدة: لا عودة إلى الصفر. */
  onOpenSubject: (subjectId: string) => void;
  onResume: (s: LearningSession) => void;
  onOpenAdmin: () => void;
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
  /** PHASE 31 — epoch-ms when the current question was first displayed (answer timer). */
  shownAt: number;
}

const DIFFICULTY_LABEL: Record<PracticeQuestion["difficulty"], string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

function trendArrow(t: "up" | "steady" | "down"): string {
  return t === "up" ? "↑" : t === "down" ? "↓" : "→";
}

/** PHASE 32 — Arabic pluralization for the streak chip (1/2/3-10/11+). */
function streakLabel(n: number): string {
  if (n === 1) return "يوم";
  if (n === 2) return "يومان";
  if (n <= 10) return "أيام";
  return "يومًا";
}

/** PHASE 179 — حلقة «مستواك الآن» (نفس هندسة رحلتي: viewBox 100). */
const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

/**
 * PHASE 179 — ترتيب مواد الصف: المواد الأساسية أولًا، ثم المواد ذات
 * الوسيط اللغوي الموازي («الرياضيات (بالإنجليزية)»…) في الآخر. قبل ذلك
 * كان الترتيب الأبجدي يدفن العربية والإنجليزية والعلوم خلف «عرض الكل».
 */
const CORE_SUBJECT_ORDER: ReadonlyArray<string> = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "الدراسات الاجتماعية",
  "التربية الدينية الإسلامية",
  "التربية الدينية المسيحية",
];

function subjectOrder(nameAr: string): number {
  const idx = CORE_SUBJECT_ORDER.indexOf(nameAr);
  if (idx >= 0) return idx;
  // النسخة اللغوية الموازية للمادة نفسها تُعرض بعد كل المواد الأساسية.
  return /\((?:بالإنجليزية|بالفرنسية)\)/.test(nameAr) ? 90 : 50;
}

/** «مفهومٌ واحد» · «مفهومان» · «N مفاهيم» · «N مفهومًا» — بصيغة عربية سليمة. */
function conceptsLabel(n: number): string {
  if (n === 1) return "مفهوم واحد";
  if (n === 2) return "مفهومان";
  return n <= 10 ? `${n} مفاهيم` : `${n} مفهومًا`;
}

export function HomeScreen({ user, onStartLesson, onOpenSubject, onResume, onOpenAdmin }: Props) {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [progress, setProgress] = useState<ProgressDetail | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [practice, setPractice] = useState<PracticeState | null>(null);
  // PHASE 25 — ranked practice plan (null = still loading, [] = loaded + empty).
  const [plan, setPlan] = useState<PracticePlanItem[] | null>(null);
  // PHASE 32 — the student's current daily-activity streak (days in a row).
  const [streak, setStreak] = useState(0);
  // PHASE 29 — session recaps per ended session (undefined = not loaded yet,
  // null = loaded but empty/no recap).
  const [recaps, setRecaps] = useState<Record<string, SessionRecap | null | undefined>>({});
  // PHASE 156 — the student's real subjects for their grade (one call), shown
  // as cards so a lesson is two taps away instead of a long dropdown walk.
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  // PHASE 170 — اسم الدرس لكل جلسة حديثة (٦ صفوف): الطفل يقرأ «جلسته» باسم
  // درسها، لا بتاريخ خام وحده.
  const [sessionTitles, setSessionTitles] = useState<Record<string, string>>({});
  // PHASE 156 — a grade can hold 15 subjects; show the first six and let the
  // student expand, so «موادك» stays a launchpad, not a wall.
  const [subjectsExpanded, setSubjectsExpanded] = useState(false);
  // PHASE 179 — «خطتي» تُبنى على المادة التي يعمل عليها الطفل فعلًا (آخر اختيار)
  // وعلى مفاهيم صفّه وحده (الخادم يقصّها) — لا مواد صفوف أخرى.
  const [lastPick] = useState(() => readLastPick(user.student?.id));
  const [planExpanded, setPlanExpanded] = useState(false);
  const [masteryExpanded, setMasteryExpanded] = useState(false);
  // PHASE 162 (W7.4) — بطاقة «المعلّم الحيّ» تقرأ المفتاح نفسه الحقيقي: لا
  // وعد بما ليس مفعّلًا، ولا حالة مصطنعة.
  const liveTeacherOn = useLiveTeacherPref();
  const { open: openStudentManager } = useStudentManager();
  const practiceRef = useRef<HTMLElement | null>(null);

  function loadRecap(s: LearningSession): void {
    setRecaps((r) => ({ ...r, [s.id]: undefined }));
    getSessionRecap(s.id)
      .then((recap) => setRecaps((r) => ({ ...r, [s.id]: recap ?? null })))
      .catch(() => setRecaps((r) => ({ ...r, [s.id]: null })));
  }

  function refreshPlan(): void {
    getPracticePlan()
      .then((res) => {
        setPlan(res.plan);
        setStreak(res.streak);
      })
      .catch(() => undefined);
  }

  /** PHASE 179 — المؤشر الحيّ: بعد كل إجابة يُعاد حساب قوة التعلم فورًا. */
  function refreshProgress(): void {
    myProgress().then(setProgress).catch(() => undefined);
  }

  useEffect(() => {
    listSessions().then(setSessions).catch(() => undefined);
    if (user.role === "student") {
      refreshProgress();
      getMySubscription().then(setSubscription).catch(() => undefined);
      refreshPlan();
      const gradeId = user.student?.gradeId;
      if (gradeId) {
        listSubjects(gradeId).then(setSubjects).catch(() => undefined);
      }
    }
  }, [user.role]);

  // PHASE 170 — أسماء دروس الجلسات المعروضة: طلب واحد لكل درس، والفشل يعني
  // سطرًا ودودًا («درسك») لا صفًا مكسورًا.
  useEffect(() => {
    const newest = [...sessions]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 6);
    if (newest.length === 0) return;
    let alive = true;
    Promise.all(
      newest.map((s) =>
        lessonBreadcrumb(s.lessonId)
          .then((bb) => [s.id, bb.lesson.title] as const)
          .catch(() => null),
      ),
    ).then((pairs) => {
      if (!alive) return;
      const map: Record<string, string> = {};
      for (const p of pairs) if (p) map[p[0]] = p[1];
      setSessionTitles(map);
    });
    return () => {
      alive = false;
    };
  }, [sessions]);

  const studentName = user.student?.displayName ?? user.email;

  // Determine next best action using existing data
  const activeSession = sessions.find((s) => s.status === "active") ?? null;
  const practicablePlan = (plan ?? []).filter((p) => p.availableQuestions > 0 || p.openQuestions > 0);
  const needsPractice = practicablePlan.length > 0;

  // PHASE 179 — «مؤشر حيّ»: قوة التعلم من الإتقان المتدهور الحقيقي (لا عدّ
  // أهداف مكتملة)، وخطة أسبوع من ثلاث خطوات ملموسة على صفّ الطفل وحده.
  const strength = learningStrength(progress?.mastery ?? []);
  const strengthPct = Math.round(strengthProgress(strength) * 100);
  const weeklyItem = weeklyPracticeItem(plan ?? []);
  const dueItem = practicablePlan.find((p) => p.dueForReview) ?? null;
  const dueCount = practicablePlan.filter((p) => p.dueForReview).length;
  const fullPlan = plan ?? [];
  const weakItem = fullPlan[0] ?? null;
  const focusSubjectId = lastPick?.subjectId ?? weeklyItem?.subjectId ?? weakItem?.subjectId ?? "";
  const focusSubjectName = subjects?.find((s) => s.id === focusSubjectId)?.nameAr ?? "";
  const gradeLabel = user.gradeNameAr ?? "";
  // «تدرّب» يجب أن يفتح نوع السؤال الموجود فعلًا: مفاهيم كثيرة لها سؤال مقالي
  // فقط — طلب MCQ لها كان يفتح لوحة فارغة («لا توجد أسئلة»).
  const weeklyMode: "mcq" | "open" =
    weeklyItem && weeklyItem.availableQuestions === 0 && weeklyItem.openQuestions > 0 ? "open" : "mcq";
  const reviewMode: "mcq" | "open" =
    dueItem && dueItem.availableQuestions === 0 && dueItem.openQuestions > 0 ? "open" : "mcq";
  const orderedSubjects = [...(subjects ?? [])].sort(
    (a, b) => subjectOrder(a.nameAr) - subjectOrder(b.nameAr) || a.nameAr.localeCompare(b.nameAr, "ar"),
  );
  const shownMastery = masteryExpanded ? progress?.mastery ?? [] : (progress?.mastery ?? []).slice(0, 4);
  const shownPlan = planExpanded ? fullPlan : fullPlan.slice(0, 3);

  // PHASE 156 — when practice opens, bring it into view (respecting motion).
  const practiceOpen = practice !== null;
  useEffect(() => {
    if (!practiceOpen || !practiceRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    practiceRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [practiceOpen]);

  function focusPlan(): void {
    const el = document.querySelector('[data-testid="plan-section"]');
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function newPracticeState(mode: "mcq" | "open"): PracticeState {
    return { mode, question: null, chosen: null, text: "", result: null, busy: false, loading: true, error: null, shownAt: Date.now() };
  }

  async function startPractice(conceptId?: string, mode: "mcq" | "open" = "mcq") {
    setPractice(newPracticeState(mode));
    try {
      const question = await getPracticeQuestion(conceptId, mode);
      setPractice((p) => (p ? { ...p, question, loading: false, shownAt: Date.now() } : p));
    } catch {
      setPractice((p) => (p ? { ...p, loading: false, error: "تعذر تحميل سؤال التمرين." } : p));
    }
  }

  // PHASE 28 + 30 — self-healing practice: the concept has no question of the
  // requested kind yet, so we ask the tutor's question generator to create one
  // (grounded in the lesson), then hand it straight to the practice panel.
  async function generateAndPractice(conceptId: string, kind: "mcq" | "open" = "mcq") {
    setPractice(newPracticeState(kind));
    try {
      const question = await generatePracticeQuestion(conceptId, kind);
      setPractice((p) => (p ? { ...p, question, loading: false, shownAt: Date.now() } : p));
      refreshPlan();
    } catch {
      setPractice((p) => (p ? { ...p, loading: false, error: "تعذر توليد سؤال لهذا المفهوم." } : p));
    }
  }

  async function nextPractice() {
    if (!practice) return;
    setPractice((p) => (p ? { ...p, question: null, chosen: null, text: "", result: null, loading: true, error: null, shownAt: Date.now() } : p));
    try {
      const question = await getPracticeQuestion(undefined, practice.mode);
      setPractice((p) => (p ? { ...p, question, loading: false, shownAt: Date.now() } : p));
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
      // PHASE 31 — measure display → submit for MCQ answers (open answers keep
      // ms, but writing time isn't a mastery signal so only MCQ sends it).
      const elapsed = Math.max(0, Math.round((Date.now() - (practice.shownAt ?? Date.now())) / 1000));
      const timeTakenSeconds = practice.mode === "mcq" ? Math.min(600, Math.max(1, elapsed)) : undefined;
      const result =
        practice.mode === "open"
          ? await submitOpenPracticeAnswer(practice.question.id, practice.text)
          : await submitPracticeAnswer(practice.question.id, practice.chosen as number, timeTakenSeconds);
      setPractice((p) => (p ? { ...p, busy: false, result } : p));
      // المؤشر والخطة يتغيران الآن — لا انتظارًا لإعادة تحميل الصفحة.
      refreshProgress();
      refreshPlan();
    } catch {
      setPractice((p) => (p ? { ...p, busy: false, error: "تعذر إرسال الإجابة." } : p));
    }
  }

  return (
    <div className="hm-layout">
      <main className="hm-main" data-testid="home-screen">
        <section className="hm-greet">
          <h2>
            أهلاً <span>{studentName}</span> 👋
          </h2>
          <p className="hm-greet__sub">جاهز نكمّل من حيث وقفنا؟ أنا معك خطوة بخطوة.</p>
          {(gradeLabel || streak > 0 || (user.students?.length ?? 0) > 1) && (
            <div className="hm-chips">
              {gradeLabel && (
                <span className="hm-chip" data-testid="grade-chip">
                  🎓 {gradeLabel}
                </span>
              )}
              {streak > 0 && (
                <span className="hm-chip hm-chip--gold" data-testid="practice-streak">
                  🔥 تعاقب {streak} {streakLabel(streak)}
                </span>
              )}
              {gradeLabel && (
                <button type="button" className="hm-chip hm-chip--action" data-testid="change-curriculum" onClick={() => openStudentManager("grade")}>
                  تغيير المنهج
                </button>
              )}
              {(user.students?.length ?? 0) > 1 && (
                <button type="button" className="hm-chip hm-chip--action" data-testid="student-switch" onClick={() => openStudentManager("switch")}>
                  🔁 تبديل الطالب
                </button>
              )}
            </div>
          )}
        </section>

        {/* PHASE 178 — عمودان على الشاشات العريضة: «مسار الطفل» يمينًا
            (قرار ← معلّم ← مواد) و«لوحة المتابعة» يسارًا (تقدّم ← تمرين ←
            جلسات). على الجوال يبقى الترتيب نفسه عموديًا — لا نقل ولا حذف. */}
        <div className="hm-cols">
          <div className="hm-col hm-col--main">
        {/* القرار الواحد البارز */}
        <section className="hm-hero">
          <span className="hm-hero__label">خطوتك القادمة</span>
          <h3>
            {activeSession ? "أكمل من حيث توقفت" : needsPractice ? "تمرّن على نقاط ضعفك" : "ابدأ درسًا جديدًا"}
          </h3>
          <p className="hm-hero__sub">
            {activeSession
              ? "لديك جلسة مفتوحة — عد إليها الآن."
              : needsPractice
                ? "خطة صفّك جاهزة — ابدأ بأول خطوة في «خطة هذا الأسبوع»."
                : "اختر درسك وابدأ معي — أشرح، وأسأل، ونتأكد معًا أنك فهمت."}
          </p>
          <div className="hm-hero__actions">
            {activeSession && (
              <button className="hm-btn hm-btn--primary" onClick={() => onResume(activeSession)} data-testid="home-resume-inline">
                استئناف الجلسة
              </button>
            )}
            {!activeSession && needsPractice && (
              <button className="hm-btn hm-btn--primary" onClick={focusPlan} data-testid="home-focus-practice-inline">
                عرض خطة الممارسة
              </button>
            )}
            {/* Starting a new lesson is ALWAYS available — the contextual action
                above is a suggestion, not a replacement. Keeping the stable
                `start-lesson` handler here preserves the browser suite and never
                traps a student who already has an active session. */}
            <button
              className={activeSession || needsPractice ? "hm-btn hm-btn--ghost" : "hm-btn hm-btn--primary"}
              onClick={onStartLesson}
              data-testid="start-lesson"
            >
              ابدأ درسًا جديدًا
            </button>
          </div>
        </section>

        {/* PHASE 162 (W7.4) + PHASE 170 — «المعلّم الحيّ» صار سطرًا هادئًا:
            الحضور نفسه (نفس المفتاح ونفس الصدق) بلا زر يزاحم قرار البطاقة
            الرئيسية التي فوقه. */}
        {user.role === "student" && (
          <section className="hm-teacher-strip" data-testid="home-teacher-card" data-enabled={liveTeacherOn ? "1" : "0"}>
            <TeacherMascot className="hm-teacher-strip__art" label={null} />
            <p className="hm-note" data-testid="home-teacher-note">
              {liveTeacherOn
                ? "معلّمك الحيّ جاهز في غرفة الدرس — يشرح بصوته ويشير إلى صفحة كتابك."
                : "المعلّم الحيّ مطفأ — شغّله من قائمة الحساب ☰ في أي وقت."}
            </p>
          </section>
        )}

        {/* الإدارة — للمدير فقط (الطلاب لا يرون هذا المدخل إطلاقًا) */}
        {user.role === "admin" && (
          <section className="hm-card" data-testid="admin-card">
            <div className="hm-sec__head">
              <h4>الإدارة</h4>
            </div>
            <p className="hm-note">استيراد ملفات المنهج (PDF/DOCX) إلى قاعدة معرفة الدروس ومتابعة المنصة.</p>
            <div className="hm-actions">
              <button data-testid="open-admin" className="hm-btn hm-btn--primary" onClick={onOpenAdmin}>
                لوحة الإدارة
              </button>
            </div>
          </section>
        )}

        {/* المواد — مواد الصف الحقيقية بنداء واحد (أول ست مواد + عرض الكل) */}
        {user.role === "student" && subjects && subjects.length > 0 && (
          <section className="hm-sec" data-testid="subjects-section">
            <div className="hm-sec__head">
              <h4>مواد صفّك</h4>
              {orderedSubjects.length > 6 ? (
                <button
                  type="button"
                  className="hm-btn hm-btn--ghost hm-btn--sm"
                  data-testid="subjects-more"
                  onClick={() => setSubjectsExpanded((v) => !v)}
                >
                  {subjectsExpanded ? "أقل" : `عرض الكل (${orderedSubjects.length})`}
                </button>
              ) : (
                <span className="hm-sec__hint">{gradeLabel || "اختر مادة وابدأ"}</span>
              )}
            </div>
            <div className="hm-subjects">
              {(subjectsExpanded ? orderedSubjects : orderedSubjects.slice(0, 6)).map((s) => (
                <button key={s.id} type="button" className="hm-subject" data-testid="subject-card" onClick={() => onOpenSubject(s.id)}>
                  <span className="hm-subject__icon"><SubjectGlyph nameAr={s.nameAr} /></span>
                  <span className="hm-subject__name">{s.nameAr}</span>
                  <svg className="hm-subject__go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </section>
        )}

          </div>
          <div className="hm-col hm-col--rail">
        {/* PHASE 179 — «خطة هذا الأسبوع»: ثلاث خطوات ملموسة من بيانات صفّ
            الطفل نفسه (درس ↔ تدريب ↔ مراجعة). ليست قائمة مهام ولا عدّ أهداف:
            كل خطوة تفتح الفعل الحقيقي مباشرة. */}
        {user.role === "student" && (
          <section className="hm-card hm-card--week" data-testid="weekly-plan">
            <div className="hm-sec__head">
              <h4>خطة هذا الأسبوع</h4>
              <span className="hm-sec__hint">{gradeLabel || "منهج صفّك"}</span>
            </div>
            <ol className="hm-week">
              <li className="hm-week__step" data-testid="weekly-step-lesson">
                <span className="hm-week__num" aria-hidden="true">١</span>
                <div className="hm-week__text">
                  <strong>{focusSubjectName ? `أكمل التعلّم في ${focusSubjectName}` : "اختر مادتك الأولى"}</strong>
                  <span>{focusSubjectName ? "من حيث توقفت — خطوة واحدة تكفي." : "مواد صفّك جاهزة في «تعلّم»."}</span>
                </div>
                <button
                  type="button"
                  className="hm-btn hm-btn--soft hm-btn--sm"
                  data-testid="weekly-lesson-cta"
                  onClick={() => (focusSubjectId ? onOpenSubject(focusSubjectId) : onStartLesson())}
                >
                  {focusSubjectName ? "أكمل" : "اختر"}
                </button>
              </li>
              <li className="hm-week__step" data-testid="weekly-step-practice">
                <span className="hm-week__num" aria-hidden="true">٢</span>
                <div className="hm-week__text">
                  <strong>
                    {weeklyItem
                      ? `تدرّب على: ${weeklyItem.title}`
                      : weakItem
                        ? `ولّد سؤالًا على: ${weakItem.title}`
                        : "لا خطة بعد — ابدأ درسًا"}
                  </strong>
                  <span>
                    {weeklyItem?.subjectNameAr ??
                      weakItem?.subjectNameAr ??
                      (weakItem ? "أول سؤال في هذه المادة يولّده معلّمك." : "أول درس يبني خطتك تلقائيًا.")}
                  </span>
                </div>
                <button
                  type="button"
                  className="hm-btn hm-btn--soft hm-btn--sm"
                  data-testid="weekly-practice-cta"
                  onClick={() => {
                    if (weeklyItem) void startPractice(weeklyItem.conceptId, weeklyMode);
                    else if (weakItem) void generateAndPractice(weakItem.conceptId);
                    else onStartLesson();
                  }}
                >
                  {weeklyItem ? "تدرّب" : weakItem ? "ولّد" : "ابدأ"}
                </button>
              </li>
              <li className="hm-week__step" data-testid="weekly-step-review">
                <span className="hm-week__num" aria-hidden="true">٣</span>
                <div className="hm-week__text">
                  <strong>{dueItem ? `راجع: ${dueItem.title}` : "المراجعة عندما تستحق"}</strong>
                  <span>
                    {dueItem
                      ? `${conceptsLabel(dueCount)} مستحقة قبل أن تُنسى`
                      : "لا شيء مستحق الآن — تابع درسك ولا تحمل همًّا."}
                  </span>
                </div>
                {dueItem ? (
                  <button
                    type="button"
                    className="hm-btn hm-btn--ghost hm-btn--sm"
                    data-testid="weekly-review-cta"
                    onClick={() => void startPractice(dueItem.conceptId, reviewMode)}
                  >
                    راجع
                  </button>
                ) : (
                  <span className="hm-week__done" aria-hidden="true">✓</span>
                )}
              </li>
            </ol>
          </section>
        )}
        {progress && (
          <section className="hm-card hm-card--progress" data-testid="progress-card">
            <div className="hm-sec__head">
              <h4>مستواك الآن</h4>
              <button className="hm-btn hm-btn--soft hm-btn--sm" onClick={() => startPractice()} data-testid="open-practice">
                ✏️ تمرين سريع
              </button>
            </div>

            {/* PHASE 179 — مؤشر حيّ: قوة التعلم من الإتقان المتدهور + نسبة
                المفاهيم المتقنة، لا من عدد الأهداف المكتملة. */}
            <div className="hm-level" data-testid="level-card">
              <div className="hm-ring" role="img" aria-label={`قوة التعلم ${strength.score} من 100`}>
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="hm-ring__track" cx="50" cy="50" r={RING_R} />
                  <circle
                    className="hm-ring__value"
                    cx="50"
                    cy="50"
                    r={RING_R}
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - strength.score / 100)}
                  />
                </svg>
                <div className="hm-ring__center">
                  <b data-testid="strength-score">{strength.score}</b>
                  <span>من ١٠٠</span>
                </div>
              </div>
              <div className="hm-level__text">
                <span className="hm-level__eyebrow">قوة التعلم</span>
                <strong data-testid="strength-level">{strength.levelNameAr}</strong>
                <p>
                  {strength.practiced === 0
                    ? "لم تُسجَّل إجابات بعد — أول تمرين يحرّك المؤشر."
                    : `${strength.mastered} ${conceptsLabel(strength.mastered)} في «متقن» · ${strength.practiced} تمّت ممارستها.`}
                </p>
                <div className="hm-level__bar" aria-hidden="true">
                  <span style={{ width: `${strengthPct}%` }} />
                </div>
                <span className="hm-level__next">
                  {strength.nextLevelAt === null
                    ? "أعلى مستوى — حافظ عليه"
                    : `بعد ${strength.nextLevelAt - strength.score} نقطة للمستوى التالي`}
                </span>
              </div>
            </div>

            <div className="hm-stats">
              <div className="hm-stat">
                <b data-testid="stat-concepts">{progress.progress.concepts.length}</b>
                <span>مفاهيم متتبَّعة</span>
              </div>
              <div className="hm-stat">
                <b data-testid="stat-usage-today">{progress.tutorUsageToday}</b>
                <span>رسالة اليوم</span>
              </div>
              <div className="hm-stat">
                <b data-testid="stat-strengths">{progress.progress.strengths.length}</b>
                <span>نقطة قوة</span>
              </div>
            </div>

            {(progress.progress.strengths.length > 0 || progress.progress.weaknesses.length > 0) && (
              <div className="hm-pills">
                {progress.progress.strengths.length > 0 && (
                  <span className="hm-pill">💪 نقاط قوتك: {progress.progress.strengths.map((s) => s.title).join("، ")}</span>
                )}
                {progress.progress.weaknesses.length > 0 && (
                  <span className="hm-pill hm-pill--warn">🎯 تحتاج تركيزًا: {progress.progress.weaknesses.map((w) => w.title).join("، ")}</span>
                )}
              </div>
            )}

            {/* PHASE 24 — concept mastery with levels, decay and trajectory. */}
            <div className="hm-block" data-testid="mastery-section">
              <div className="hm-block__head">
                <h5 className="hm-block__title">إتقان المفاهيم</h5>
                {progress.mastery.length > 4 && (
                  <button
                    type="button"
                    className="hm-btn hm-btn--ghost hm-btn--sm"
                    data-testid="mastery-more"
                    onClick={() => setMasteryExpanded((v) => !v)}
                  >
                    {masteryExpanded ? "أقل" : `عرض الكل (${progress.mastery.length})`}
                  </button>
                )}
              </div>
              {progress.mastery.length === 0 ? (
                <p className="hm-note" data-testid="mastery-empty">
                  لا توجد مفاهيم متتبعة بعد — أجب عن تمارين لتظهر هنا.
                </p>
              ) : (
                <ul className="hm-list" data-testid="mastery-list">
                  {shownMastery.map((m) => (
                    <li key={m.conceptId} className="hm-row" data-testid="mastery-concept-row">
                      <span className="hm-row__main">
                        <strong>{m.title}</strong>
                        <span
                          className={`hm-pill ${m.level === "mastered" || m.level === "advanced" ? "" : "hm-pill--warn"}`}
                          data-testid="mastery-level"
                        >
                          {m.labelAr}
                        </span>
                      </span>
                      <span className="hm-row__meta" data-testid="mastery-meta">
                        {Math.round(m.decayedMastery * 100)}% · {m.daysSinceLastPractice === 0 ? "اليوم" : `منذ ${m.daysSinceLastPractice} يوم`}{" "}
                        <span data-testid="mastery-trend">{trendArrow(m.trend)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* PHASE 25 — ranked practice plan feeding the practice panel. */}
            <div className="hm-block" data-testid="plan-section">
              <div className="hm-block__head">
                <h5 className="hm-block__title">خطة ممارستك</h5>
                {fullPlan.length > 3 && (
                  <button
                    type="button"
                    className="hm-btn hm-btn--ghost hm-btn--sm"
                    data-testid="plan-more"
                    onClick={() => setPlanExpanded((v) => !v)}
                  >
                    {planExpanded ? "أقل" : `عرض الكل (${fullPlan.length})`}
                  </button>
                )}
              </div>
              {plan === null ? (
                <p className="hm-note" data-testid="plan-loading">
                  جارٍ تحضير خطتك…
                </p>
              ) : plan.length === 0 ? (
                <p className="hm-note" data-testid="plan-empty">
                  لا توجد مفاهيم في خطتك بعد — انضم إلى منهج دراسي لتظهر خطة ممارستك هنا.
                </p>
              ) : (
                <ul className="hm-list" data-testid="plan-list">
                  {shownPlan.map((item) => (
                    <li key={item.conceptId} className="hm-row" data-testid="plan-row">
                      <span className="hm-row__main hm-row__main--stack">
                        <span className="hm-row__main">
                          <strong>{item.title}</strong>
                          <span
                            className={`hm-pill ${item.level === "mastered" || item.level === "advanced" ? "" : "hm-pill--warn"}`}
                            data-testid="plan-level"
                          >
                            {item.labelAr}
                          </span>
                          {/* PHASE 35 (D-037 tail) — exposure is old enough that
                              decay alone is eroding this concept. */}
                          {item.dueForReview && (
                            <span className="hm-pill hm-pill--warn" data-testid="plan-due">
                              راجع قبل أن ينسى
                            </span>
                          )}
                        </span>
                        <span className="hm-row__meta" data-testid="plan-meta">
                          <span data-testid="plan-lesson">{item.lessonTitle ?? "درس غير معروف"}</span> ·{" "}
                          <span data-testid="plan-questions">{item.availableQuestions} سؤال متاح</span> ·{" "}
                          {item.attempts === 0
                            ? "لم يُمارَس بعد"
                            : item.daysSinceLastPractice === 0
                              ? "اليوم"
                              : `منذ ${item.daysSinceLastPractice} يوم`}{" "}
                          <span data-testid="plan-trend">{trendArrow(item.trend)}</span>
                        </span>
                      </span>
                      <span className="hm-row__actions">
                        {item.availableQuestions === 0 ? (
                          // PHASE 28 — no MCQ yet → generate one on demand.
                          <button className="hm-btn hm-btn--primary hm-btn--sm" data-testid="plan-generate" onClick={() => generateAndPractice(item.conceptId)}>
                            توليد سؤال
                          </button>
                        ) : (
                          <button className="hm-btn hm-btn--primary hm-btn--sm" data-testid="plan-practice" onClick={() => startPractice(item.conceptId)}>
                            تمرّن الآن
                          </button>
                        )}
                        {item.openQuestions > 0 ? (
                          // PHASE 30 — an open (free-text) question exists for this concept.
                          <button className="hm-btn hm-btn--ghost hm-btn--sm" data-testid="plan-open-practice" onClick={() => startPractice(item.conceptId, "open")}>
                            سؤال مقالي
                          </button>
                        ) : (
                          <button className="hm-btn hm-btn--ghost hm-btn--sm" data-testid="plan-open-generate" onClick={() => generateAndPractice(item.conceptId, "open")}>
                            توليد سؤال مقالي
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* PHASE 20 — خطة الطالب: شريط هادئ في ذيل بطاقة التقدّم */}
            <div className="hm-planstrip" data-testid="subscription-card">
              <span className="hm-row__meta">خطتك</span>
              {subscription ? (
                <>
                  <span
                    className={`hm-pill ${subscription.plan === "premium" ? "hm-pill--gold" : "hm-pill--muted"}`}
                    data-testid="subscription-plan"
                  >
                    {subscription.plan === "premium" ? "مميزة" : "مجانية"}
                  </span>
                  <span className="hm-row__meta" data-testid="subscription-limit">
                    {subscription.dailyLimit === 0 ? "رسائل اليوم: غير محدودة" : `رسائل اليوم: ${subscription.dailyLimit}`}
                    {subscription.expiresAt ? ` · تنتهي ${new Date(subscription.expiresAt).toLocaleDateString("ar-EG")}` : ""}
                  </span>
                </>
              ) : (
                <span className="hm-row__meta">خطتك مجانية — ارفعها عبر لوحة الإدارة.</span>
              )}
            </div>
          </section>
        )}

        {practice && (
          <section className="hm-card hm-practice" data-testid="practice-panel" ref={practiceRef}>
            <div className="hm-sec__head">
              <h4>تمرين سريع</h4>
              <button
                className="hm-btn hm-btn--ghost hm-btn--sm"
                onClick={() => {
                  setPractice(null);
                  refreshPlan();
                }}
                data-testid="practice-close"
              >
                إغلاق
              </button>
            </div>
            {practice.loading ? (
              <p className="hm-note" data-testid="practice-loading">
                جارٍ تحضير سؤال لك…
              </p>
            ) : practice.error || !practice.question ? (
              <p className="hm-error" data-testid="practice-error">
                {practice.error ?? "لا توجد أسئلة متاحة في منهجك بعد."}
              </p>
            ) : (
              <>
                <p className="hm-note" data-testid="practice-concept">
                  {practice.question.conceptTitle ?? "تمرين عام"} · {DIFFICULTY_LABEL[practice.question.difficulty]}
                </p>
                <p className="hm-question" data-testid="practice-question">
                  {practice.question.content}
                </p>
                {practice.question.type === "open" ? (
                  // PHASE 30 — free-text answer for open questions.
                  <textarea
                    className="hm-answer"
                    data-testid="practice-open-input"
                    rows={3}
                    maxLength={1500}
                    placeholder="اكتب إجابتك هنا بجملة أو جملتين…"
                    value={practice.text}
                    disabled={practice.busy}
                    onChange={(e) => setPractice((p) => (p ? { ...p, text: e.target.value, result: null, chosen: null } : p))}
                  />
                ) : (
                  <div className="hm-options">
                    {practice.question.options?.map((opt, i) => (
                      <button
                        key={i}
                        className={`hm-option ${practice.chosen === i ? "hm-option--on" : ""}`}
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
                  <p className={practice.result.correct ? "hm-feedback hm-feedback--ok" : "hm-feedback hm-feedback--warn"} data-testid="practice-feedback">
                    {practice.result.feedback
                      ? practice.result.feedback
                      : practice.result.correct
                        ? "إجابة صحيحة 🎉"
                        : "إجابة غير صحيحة — راجع الشرح ثم أعد المحاولة."}
                    {practice.result.score !== null && practice.result.score !== undefined && (
                      <span className="hm-pill hm-pill--warn" data-testid="practice-score">
                        التقدير: {Math.round(practice.result.score * 100)}%
                      </span>
                    )}
                    {practice.result.mastery && (
                      <span
                        className={`hm-pill ${practice.result.mastery.level === "mastered" || practice.result.mastery.level === "advanced" ? "" : "hm-pill--warn"}`}
                        data-testid="practice-mastery"
                      >
                        {practice.result.mastery.labelAr} · {Math.round(practice.result.mastery.score * 100)}%
                      </span>
                    )}
                  </p>
                )}
                {practice.result?.explanation && (
                  <p className="hm-note" data-testid="practice-explanation">
                    {practice.result.explanation}
                  </p>
                )}
                <div className="hm-actions">
                  <button
                    className="hm-btn hm-btn--primary"
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
                    <button className="hm-btn hm-btn--ghost" data-testid="practice-next" onClick={nextPractice}>
                      سؤال آخر
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        <section className="hm-card hm-card--sessions">
          <div className="hm-sec__head">
            <h4>جلساتك</h4>
          </div>
          {sessions.length === 0 ? (
            <p className="hm-note" data-testid="no-sessions">
              لا توجد جلسات بعد — ابدأ أول درس لنا!
            </p>
          ) : (
            <>
              <ul className="hm-list" data-testid="session-list">
                {[...sessions]
                  .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                  .slice(0, 6)
                  .map((s) => (
                    <li key={s.id} className="hm-row hm-row--session" data-testid="session-row" data-session-id={s.id} data-session-status={s.status}>
                      <span className="hm-row__main hm-row__main--stack">
                        <span className="hm-row__main">
                          <span className={`hm-badge ${s.status === "active" ? "hm-badge--on" : "hm-badge--off"}`}>
                            {s.status === "active" ? "مفتوحة" : "منتهية"}
                          </span>
                          <strong>{sessionTitles[s.id] ?? "درسك"}</strong>
                        </span>
                        <span className="hm-row__meta">{new Date(s.startedAt).toLocaleString("ar-EG")}</span>
                      </span>
                      {s.status === "active" && (
                        <span className="hm-row__actions">
                          <button data-testid="resume-session" className="hm-btn hm-btn--soft hm-btn--sm" onClick={() => onResume(s)}>
                            متابعة
                          </button>
                        </span>
                      )}
                      {s.status === "ended" && recaps[s.id] === undefined && (
                        <span className="hm-row__actions">
                          <button data-testid="session-recap-button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => loadRecap(s)}>
                            ملخص الجلسة
                          </button>
                        </span>
                      )}
                      {s.status === "ended" && recaps[s.id] === null && (
                        <p className="hm-note hm-recap-slot" data-testid="session-recap-empty">
                          لا توجد محادثة في هذه الجلسة لعرض ملخصها.
                        </p>
                      )}
                      {s.status === "ended" && recaps[s.id] && (
                        <span className="hm-recap-slot">
                          <SessionRecapCard recap={recaps[s.id]!} />
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
              {sessions.length > 6 && (
                <p className="hm-note" data-testid="sessions-truncated">
                  … وتوجد {sessions.length - 6} جلسات أخرى.
                </p>
              )}
            </>
          )}
        </section>
          </div>
        </div>
      </main>
    </div>
  );
}
