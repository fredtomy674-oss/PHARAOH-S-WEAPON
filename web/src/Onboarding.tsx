import { useEffect, useState } from "react";
import {
  lessonBreadcrumb,
  listCountries,
  listCurricula,
  listGrades,
  listLessons,
  listSubjects,
  listSystems,
  listTerms,
  listUnits,
  startSession,
  ApiError,
  type Breadcrumb,
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

interface Props {
  user: User;
  onStarted: (s: LearningSession) => void;
  onBack: () => void;
}

export function OnboardingScreen({ onStarted, onBack }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [systems, setSystems] = useState<EduSystem[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb | null>(null);

  const [countryId, setCountryId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [termId, setTermId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyLesson, setBusyLesson] = useState<string | null>(null);

  useEffect(() => {
    listCountries().then(setCountries).catch(() => setError("تعذر تحميل الدول"));
  }, []);

  useEffect(() => {
    if (countryId) listSystems(countryId).then(setSystems).catch(() => undefined);
  }, [countryId]);

  useEffect(() => {
    if (systemId) listGrades(systemId).then(setGrades).catch(() => undefined);
  }, [systemId]);

  useEffect(() => {
    if (!gradeId || !subjectId) return;
    listCurricula(gradeId, subjectId).then(setCurricula).catch(() => undefined);
  }, [gradeId, subjectId]);

  useEffect(() => {
    if (curriculumId) listTerms(curriculumId).then(setTerms).catch(() => undefined);
  }, [curriculumId]);

  useEffect(() => {
    if (termId) listUnits(termId).then(setUnits).catch(() => undefined);
  }, [termId]);

  useEffect(() => {
    if (unitId) listLessons(unitId).then(setLessons).catch(() => undefined);
  }, [unitId]);

  useEffect(() => {
    listSubjects().then(setSubjects).catch(() => undefined);
  }, []);

  const pickLesson = async (lessonId: string) => {
    setError(null);
    setBusyLesson(lessonId);
    try {
      const bc = await lessonBreadcrumb(lessonId);
      setBreadcrumb({ breadcrumb: bc });
      const session = await startSession({
        curriculumId: curriculumId || bc.curriculum.id,
        gradeId: gradeId || bc.grade.id,
        subjectId: subjectId || bc.subject.id,
        lessonId,
      });
      onStarted(session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر بدء الجلسة");
    } finally {
      setBusyLesson(null);
    }
  };

  if (breadcrumb) {
    const b = breadcrumb.breadcrumb;
    return (
      <div className="layout">
        <main className="container narrow">
          <section className="card">
            <h2>{b.lesson.title}</h2>
            <p>
              <span className="muted">{b.country.nameAr} • {b.grade.nameAr} • {b.subject.nameAr}</span>
              <br />
              <span className="muted">المنهج: {b.curriculum.title}</span>
            </p>
            <div className="row-gap">
              <button className="btn small ghost" onClick={() => setBreadcrumb(null)}>
                تغيير الدرس
              </button>
              <button className="btn small ghost" onClick={onBack}>
                الرئيسية
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <strong>اختر درسك</strong>
          <button className="btn ghost" onClick={onBack}>
            الرئيسية
          </button>
        </div>
      </header>

      <main className="container">
        {error && (
          <p data-testid="onboarding-error" className="error-text">
            {error}
          </p>
        )}

        <section className="picker">
          <label className="field">
            <span>الدولة</span>
            <select data-testid="select-country" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
              <option value="">اختر الدولة…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </label>

          {countryId && (
            <label className="field">
              <span>النظام التعليمي</span>
              <select data-testid="select-system" value={systemId} onChange={(e) => setSystemId(e.target.value)}>
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
            <div className="grid-2">
              <label className="field">
                <span>الصف</span>
                <select data-testid="select-grade" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
                  <option value="">اختر الصف…</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameAr}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>المادة</span>
                <select data-testid="select-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">اختر المادة…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {gradeId && subjectId && (
            <label className="field">
              <span>المنهج</span>
              <select data-testid="select-curriculum" value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)}>
                <option value="">اختر المنهج…</option>
                {curricula.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          {curriculumId && (
            <label className="field">
              <span>الفصل الدراسي</span>
              <select data-testid="select-term" value={termId} onChange={(e) => setTermId(e.target.value)}>
                <option value="">اختر الفصل…</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          {termId && (
            <label className="field">
              <span>الوحدة</span>
              <select data-testid="select-unit" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                <option value="">اختر الوحدة…</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        {lessons.length > 0 && (
          <section className="card">
            <h3>دروس الوحدة</h3>
            <ul className="lesson-list">
              {lessons.map((l) => (
                <li key={l.id}>
                  <button className="lesson-item" data-testid={`lesson-${l.id}`} disabled={busyLesson === l.id} onClick={() => pickLesson(l.id)}>
                    <span>{l.title}</span>
                    <span className="muted small">{busyLesson === l.id ? "جارِ البدء…" : "ابدأ ←"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}