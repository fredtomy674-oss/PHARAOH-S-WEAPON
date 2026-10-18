import { useEffect, useRef, useState } from "react";
import {
  lessonBreadcrumb,
  listCountries,
  listCurricula,
  listGrades,
  listLessons,
  listSessions,
  listSubjects,
  listSystems,
  listTerms,
  listUnits,
  type Country,
  type Curriculum,
  type EduSystem,
  type Grade,
  type LearningSession,
  type Lesson,
  type Subject,
  type Term,
  type Unit,
  type User,
} from "./api.js";
import { Button, Card } from "./components/ui/index.js";
import { SubjectGlyph } from "./components/SubjectGlyph.js";

/**
 * PHASE 159 (W3) — «تعلّم»: هدم `Onboarding.tsx` وإعادة بناء المنتقي بصريًا.
 *
 * الرحلة (الخريطة ٣.٤): «أكمل من حيث توقفت» ← الصف محفوظ في الملف ← **بطاقات
 * المواد** ← **بطاقات الوحدات** ← قائمة الدروس ← صفحة الدرس (وهي التي تبدأ
 * الحصة — الطبقة التي كانت مفقودة بين الرئيسية والغرفة).
 *
 * العقود (قرار ARCH): كل خطوة منتقٍ تحتفظ بمعرّفها القديم (`select-country` …
 * `select-unit`) والخيارات **بطاقات داخلها** (`data-value`)؛ الدروس `lesson-*`
 * كما هي؛ الخطوات الأعمق (نظام/منهج/فصل) مطويّة تحت «خيارات أعمق»؛ ومساعدا
 * الاختبار (selectFirst/selectOptionByLabel) يعملان بوضع مزدوج (select أو
 * بطاقات) فيبقى كل مستخدمٍ لهما بلا تعديل — عدا موضعَي «التصفير» في ON2
 * (تغيّر تنقّل شرعي موثَّق).
 */

const LAST_PICK_KEY = "alfarouq_last_pick";

/** «آخر اختيار» (W3): المادة والوحدة اللتان كان عليهما الطالب — للعودة المباشرة. */
function readLastPick(): { subjectId: string; unitId: string } | null {
  try {
    const raw = localStorage.getItem(LAST_PICK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { subjectId?: unknown; unitId?: unknown };
    if (typeof parsed.subjectId !== "string") return null;
    return { subjectId: parsed.subjectId, unitId: typeof parsed.unitId === "string" ? parsed.unitId : "" };
  } catch {
    return null;
  }
}

interface Props {
  user: User;
  /** PHASE 178 — مادةٌ محدّدة قادمة من الرئيسية (بطاقة «موادك»). */
  initialSubjectId?: string;
  onResume: (s: LearningSession) => void;
  onOpenLesson: (lessonId: string) => void;
  /** PHASE 159 — اختيار الصف من «خيارات أعمق» يُحفظ في ملف الطالب (كما في أول دخول). */
  onGradeChange?: (gradeId: string) => void;
}

export function LearnScreen({ user, initialSubjectId, onResume, onOpenLesson, onGradeChange }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [systems, setSystems] = useState<EduSystem[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [countryId, setCountryId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [gradeId, setGradeId] = useState(user.student?.gradeId ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [termId, setTermId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(!user.student?.gradeId);

  // «أكمل من حيث توقفت» — من بيانات الجلسات الحقيقية.
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [lastLesson, setLastLesson] = useState<{ id: string; title: string } | null>(null);

  /**
   * حارس سباق: كل تغيير في المنتقي يبطل أي تحميل قديم (طالب يغيّر الصف بينما
   * مواد الصف السابق في الطريق) — فلا تُكتب حالة قديمة فوق الجديدة.
   */
  const loadSeq = useRef(0);
  /** PHASE 178 — اختيار الطفل مادةً بنفسه يقفز إلى وحداتها؛ الاستعادة الصامتة لا تقفز. */
  const userPickedRef = useRef(false);

  useEffect(() => {
    listCountries().then(setCountries).catch(() => undefined);
    listSessions()
      .then((all) => {
        const active = all.find((s) => s.status === "active") ?? null;
        setActiveSession(active);
        const latest = [...all].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
        if (latest) {
          lessonBreadcrumb(latest.lessonId)
            .then((bc) => setLastLesson({ id: latest.lessonId, title: bc.lesson.title }))
            .catch(() => setLastLesson({ id: latest.lessonId, title: "" }));
        }
      })
      .catch(() => undefined);
    const saved = user.student?.gradeId ?? "";
    if (saved) {
      listSubjects(saved)
        .then((list) => {
          setSubjects(list);
          // PHASE 178 — مادةٌ جاءت من الرئيسية تسبق «آخر اختيار»: الطفل طلب
          // رياضيات صراحةً الآن؛ وإلا نعود لآخر جلسة كما كان (W3).
          const fromHome = initialSubjectId && list.some((s) => s.id === initialSubjectId) ? initialSubjectId : "";
          const last = fromHome ? { subjectId: fromHome, unitId: "" } : readLastPick();
          if (last && list.some((s) => s.id === last.subjectId)) void pickSubject(last.subjectId, saved, last.unitId);
        })
        .catch(() => setSubjects([]));
    }
  }, []);

  useEffect(() => {
    if (!userPickedRef.current || units.length === 0) return;
    userPickedRef.current = false;
    const el = document.querySelector('[data-testid="select-unit"]');
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [units]);

  /**
   * تصفير متسلسل (0 = دولة … 6 = وحدة) — تغيير مستوى يُبطل كل ما تحته، تمامًا
   * كما كان في المنتقي القديم: منهج/صف قديم مع درس من نطاق آخر هو بالضبط ما
   * يرفضه الخادم (LESSON_CURRICULUM_MISMATCH). قائمة المواد لا تُمسّ هنا:
   * من غيّر مادته يريد رؤية بقية المواد (وحدها تغييرات الصف تُفرّغها).
   */
  const clearBelow = (level: number) => {
    loadSeq.current += 1;
    if (level <= 0) {
      setSystemId("");
      setSystems([]);
    }
    if (level <= 1) {
      setGradeId("");
      setGrades([]);
    }
    if (level <= 2) {
      setSubjectId("");
      localStorage.removeItem(LAST_PICK_KEY);
    }
    if (level <= 3) {
      setCurriculumId("");
      setCurricula([]);
    }
    if (level <= 4) {
      setTermId("");
      setTerms([]);
    }
    if (level <= 5) {
      setUnitId("");
      setUnits([]);
    }
    if (level <= 6) setLessons([]);
  };

  /** الصف (محفوظ أو مختار) يقود المواد — وهذا كل ما يحتاجه المسار المرئي. */
  async function loadSubjects(gid: string): Promise<void> {
    const seq = ++loadSeq.current;
    try {
      const list = await listSubjects(gid);
      if (seq !== loadSeq.current) return;
      setSubjects(list);
    } catch {
      if (seq === loadSeq.current) setSubjects([]);
    }
  }

  /**
   * اختيار مادة: يُحمّل المنهج النشط ثم أول فصل ثم وحداته — بلا خطوات إضافية
   * (المسار المرئي: مادة ← وحدة ← درس). والاختيار الأعمق يظل ممكنًا من اللوحة.
   * `restoreUnitId` يُستخدم عند العودة: آخر وحدة للطالب تعود مباشرة (W3).
   */
  async function pickSubject(id: string, gid = gradeId, restoreUnitId = ""): Promise<void> {
    const seq = ++loadSeq.current;
    setSubjectId(id);
    setCurriculumId("");
    setCurricula([]);
    setTermId("");
    setTerms([]);
    setUnitId("");
    setUnits([]);
    setLessons([]);
    // ملاحظة StrictMode: التهيئة تُشغَّل مرتين في التطوير، والحفظ يجب أن يكون
    // idempotent — وإلا محت القراءة الثانية وحدةَ الاستعادة قبل تطبيقها.
    localStorage.setItem(LAST_PICK_KEY, JSON.stringify({ subjectId: id, unitId: restoreUnitId }));
    if (!gid) return;
    try {
      const list = await listCurricula(gid, id);
      if (seq !== loadSeq.current) return;
      setCurricula(list);
      const first = list.find((c) => c.isActive) ?? list[0];
      if (!first) return;
      setCurriculumId(first.id);
      const tlist = await listTerms(first.id);
      if (seq !== loadSeq.current) return;
      setTerms(tlist);
      const ft = tlist[0];
      if (!ft) return;
      setTermId(ft.id);
      const ulist = await listUnits(ft.id);
      if (seq !== loadSeq.current) return;
      setUnits(ulist);
      if (restoreUnitId && ulist.some((u) => u.id === restoreUnitId)) void pickUnit(restoreUnitId, id);
    } catch {
      // تبقى البطاقات ظاهرة — الطالب يجرّب غيرها.
    }
  }

  /** «تغيير» المادة — تصفير المادة وكل ما تحتها (موضع ON2 الأول). */
  function resetSubject(): void {
    clearBelow(2);
  }

  async function pickUnit(id: string, sid = subjectId): Promise<void> {
    const seq = ++loadSeq.current;
    setUnitId(id);
    setLessons([]);
    localStorage.setItem(LAST_PICK_KEY, JSON.stringify({ subjectId: sid, unitId: id }));
    try {
      const list = await listLessons(id);
      if (seq !== loadSeq.current) return;
      setLessons(list);
    } catch {
      // لا دروس بعد — يجرّب وحدة أخرى.
    }
  }

  const pickCountry = async (id: string) => {
    setCountryId(id);
    clearBelow(0);
    setSubjects([]);
    const seq = loadSeq.current;
    if (!id) return;
    try {
      const list = await listSystems(id);
      if (seq === loadSeq.current) setSystems(list);
    } catch {
      // تبقى اللوحة صالحة — يجرّب دولة أخرى.
    }
  };

  const pickSystem = async (id: string) => {
    setSystemId(id);
    clearBelow(1);
    setSubjects([]);
    const seq = loadSeq.current;
    if (!id) return;
    try {
      const list = await listGrades(id);
      if (seq === loadSeq.current) setGrades(list);
    } catch {
      // يجرّب نظامًا آخر.
    }
  };

  const pickGrade = async (id: string) => {
    setGradeId(id);
    clearBelow(2);
    if (id) {
      void loadSubjects(id);
      onGradeChange?.(id);
    } else {
      setSubjects([]);
    }
  };

  const pickCurriculum = async (id: string) => {
    setCurriculumId(id);
    clearBelow(4);
    const seq = loadSeq.current;
    if (!id) return;
    try {
      const tlist = await listTerms(id);
      if (seq !== loadSeq.current) return;
      setTerms(tlist);
      const ft = tlist[0];
      if (!ft) return;
      setTermId(ft.id);
      const ulist = await listUnits(ft.id);
      if (seq !== loadSeq.current) return;
      setUnits(ulist);
    } catch {
      // تبقى اللوحة صالحة.
    }
  };

  const pickTerm = async (id: string) => {
    setTermId(id);
    clearBelow(5);
    const seq = loadSeq.current;
    if (!id) return;
    try {
      const list = await listUnits(id);
      if (seq === loadSeq.current) setUnits(list);
    } catch {
      // يجرّب فصلًا آخر.
    }
  };

  const pickedSubject = subjects?.find((s) => s.id === subjectId) ?? null;
  const pickedTerm = terms.find((t) => t.id === termId) ?? null;

  return (
    <div className="ln-layout">
      <main className="ln-main" data-testid="learn-screen">
        <section className="ln-hero">
          <span className="ln-hero__label">تعلّم</span>
          <h2>ماذا تدرس الآن؟</h2>
          <p className="ln-hero__sub">مواد صفّك جاهزة — اختر مادة ثم وحدة ثم درسًا، وسيفتح لك الدرس صفحته كاملة.</p>

          {activeSession ? (
            <div className="ln-resume" data-testid="learn-resume">
              <p className="ln-resume__text">لديك جلسة مفتوحة — عد إليها الآن.</p>
              <div className="ln-resume__actions">
                <Button data-testid="learn-resume-open" onClick={() => onResume(activeSession)}>
                  أكمل الجلسة
                </Button>
                <Button variant="ghost" data-testid="learn-resume-lesson" onClick={() => onOpenLesson(activeSession.lessonId)}>
                  صفحة الدرس
                </Button>
              </div>
            </div>
          ) : lastLesson ? (
            <div className="ln-resume" data-testid="learn-last">
              <p className="ln-resume__text">
                آخر درس: <strong>{lastLesson.title || "درسك السابق"}</strong>
              </p>
              <div className="ln-resume__actions">
                <Button data-testid="learn-last-lesson" onClick={() => onOpenLesson(lastLesson.id)}>
                  افتح صفحة الدرس
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <Card
          className="ln-picker"
          title="اختر درسك"
          hint="الصف محفوظ — الخطوات الأعمق (نظام · منهج · فصل) داخل «خيارات أعمق»."
          actions={
            <button
              type="button"
              className="ln-adv-toggle"
              data-testid="advanced-toggle"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((v) => !v)}
            >
              {advancedOpen ? "إخفاء الخيارات الأعمق" : "خيارات أعمق"}
            </button>
          }
        >
          {advancedOpen && (
            <div className="ln-adv" data-testid="advanced-options">
              <label className="ln-field">
                <span>الدولة</span>
                <select data-testid="select-country" value={countryId} onChange={(e) => void pickCountry(e.target.value)}>
                  <option value="">اختر الدولة…</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </label>

              {countryId && (
                <label className="ln-field">
                  <span>النظام التعليمي</span>
                  <select data-testid="select-system" value={systemId} onChange={(e) => void pickSystem(e.target.value)}>
                    <option value="">اختر النظام…</option>
                    {systems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {systemId && (
                <label className="ln-field">
                  <span>الصف</span>
                  <select data-testid="select-grade" value={gradeId} onChange={(e) => void pickGrade(e.target.value)}>
                    <option value="">اختر الصف…</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nameAr}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {curricula.length > 0 && (
                <label className="ln-field">
                  <span>المنهج</span>
                  <select data-testid="select-curriculum" value={curriculumId} onChange={(e) => void pickCurriculum(e.target.value)}>
                    <option value="">اختر المنهج…</option>
                    {curricula.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {terms.length > 0 && (
                <label className="ln-field">
                  <span>الفصل الدراسي</span>
                  <select data-testid="select-term" value={termId} onChange={(e) => void pickTerm(e.target.value)}>
                    <option value="">اختر الفصل…</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {/* ١) المادة — بطاقات مرئية (select-subject يحتفظ بالمعرّف القديم) */}
          <div className="ln-step" data-testid="select-subject">
            <div className="ln-step__head">
              <h4>{pickedSubject ? `المادة: ${pickedSubject.nameAr}` : "المادة"}</h4>
              {subjectId && (
                <button type="button" className="ln-change" data-testid="subject-change" onClick={resetSubject}>
                  تغيير
                </button>
              )}
            </div>
            {subjects === null ? (
              <p className="ln-note" data-testid="subjects-loading">
                جارٍ تحضير موادك…
              </p>
            ) : subjects.length === 0 ? (
              <p className="ln-note" data-testid="subjects-empty">
                {gradeId ? "لا توجد مواد لهذا الصف بعد." : "اختر صفّك من «خيارات أعمق» لتظهر موادك."}
              </p>
            ) : (
              <div className="ln-cards ln-cards--subjects">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={subjectId === s.id ? "ln-subject ln-subject--on" : "ln-subject"}
                    data-value={s.id}
                    data-testid="subject-option"
                    aria-pressed={subjectId === s.id}
                    onClick={() => {
                      userPickedRef.current = true;
                      void pickSubject(s.id);
                    }}
                  >
                    <span className="ln-subject__icon">
                      <SubjectGlyph nameAr={s.nameAr} />
                    </span>
                    <span className="ln-subject__name">{s.nameAr}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ٢) الوحدة — بطاقات (تُحمَّل مع أول فصل للمنهج النشط) */}
          {units.length > 0 && (
            <div className="ln-step" data-testid="select-unit">
              <div className="ln-step__head">
                <h4>الوحدة</h4>
                {pickedTerm && <span className="ln-step__hint">{pickedTerm.title}</span>}
              </div>
              <div className="ln-cards ln-cards--units">
                {units.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={unitId === u.id ? "ln-unit ln-unit--on" : "ln-unit"}
                    data-value={u.id}
                    data-testid="unit-option"
                    aria-pressed={unitId === u.id}
                    onClick={() => void pickUnit(u.id)}
                  >
                    <span className="ln-unit__title">{u.title}</span>
                    <svg className="ln-unit__go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 5l-7 7 7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ٣) الدروس — قائمة الدرس تفتح صفحة الدرس */}
          {lessons.length > 0 && (
            <div className="ln-step">
              <div className="ln-step__head">
                <h4>الدروس</h4>
                <span className="ln-step__hint">افتح الدرس لترى مفاهيمه ومصادره</span>
              </div>
              <ul className="ln-lessons">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <button type="button" className="ln-lesson" data-testid={`lesson-${l.id}`} onClick={() => onOpenLesson(l.id)}>
                      <span className="ln-lesson__title">{l.title}</span>
                      <span className="ln-lesson__go">صفحة الدرس ←</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
