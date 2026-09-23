import { useEffect, useRef, useState } from "react";
import {
  ingestCurriculumFile,
  listAdminDocuments,
  listCountries,
  listCurricula,
  listGrades,
  listLessons,
  listSubjects,
  listSystems,
  listTerms,
  listUnits,
  ApiError,
  type AdminDocument,
  type Country,
  type Curriculum,
  type EduSystem,
  type Grade,
  type IngestFileResult,
  type Lesson,
  type Subject,
  type Term,
  type Unit,
  type User,
} from "./api.js";

interface Props {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

const KIND_LABEL: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  text: "نص",
  csv: "CSV",
};

const ACCEPTED = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

// Mirrors the server cap (MAX_CURRICULUM_FILE_KB default 20480) for a friendlier UX error.
const MAX_CURRICULUM_FILE_BYTES = 20 * 1024 * 1024;

export function AdminScreen({ onBack, onLogout }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [systems, setSystems] = useState<EduSystem[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [countryId, setCountryId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [termId, setTermId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestFileResult | null>(null);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    listCountries().then(setCountries).catch(() => setError("تعذر تحميل الدول"));
  }, []);

  useEffect(() => {
    listSubjects().then(setSubjects).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!countryId) return;
    listSystems(countryId).then(setSystems).catch(() => undefined);
  }, [countryId]);

  useEffect(() => {
    if (!systemId) return;
    listGrades(systemId).then(setGrades).catch(() => undefined);
  }, [systemId]);

  useEffect(() => {
    if (!gradeId || !subjectId) return;
    listCurricula(gradeId, subjectId).then(setCurricula).catch(() => undefined);
  }, [gradeId, subjectId]);

  useEffect(() => {
    if (!curriculumId) return;
    listTerms(curriculumId).then(setTerms).catch(() => undefined);
  }, [curriculumId]);

  useEffect(() => {
    if (!termId) return;
    listUnits(termId).then(setUnits).catch(() => undefined);
  }, [termId]);

  useEffect(() => {
    if (!unitId) return;
    listLessons(unitId).then(setLessons).catch(() => undefined);
  }, [unitId]);

  useEffect(() => {
    listAdminDocuments().then(setDocuments).catch(() => undefined);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setDataUrl(null);
    if (!f) return;
    if (f.size > MAX_CURRICULUM_FILE_BYTES) {
      setError("الملف أكبر من 20 ميغابايت — الحد الأقصى لملفات المنهج");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  };

  const canUpload = Boolean(dataUrl && selectedLesson && !busy);

  const upload = async () => {
    if (!dataUrl || !selectedLesson || !file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await ingestCurriculumFile({
        fileName: file.name,
        dataUrl,
        title: title.trim() || undefined,
        source: source.trim() || undefined,
        scope: {
          countryId,
          educationSystemId: systemId,
          gradeId,
          subjectId,
          curriculumId,
          termId,
          unitId,
          lessonId: selectedLesson.id,
        },
      });
      setResult(res);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setTitle("");
      setSource("");
      listAdminDocuments().then(setDocuments).catch(() => undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر استيراد الملف");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="layout" data-testid="admin-screen">
      <header className="topbar">
        <div className="topbar-inner">
          <strong>لوحة الإدارة — قاعدة المعرفة</strong>
          <span className="muted">استيراد ملفات المنهج (PDF/DOCX) وربطها بالدروس</span>
          <button className="btn ghost" onClick={onBack}>
            الرئيسية
          </button>
          <button className="btn ghost" onClick={onLogout} data-testid="logout">
            خروج
          </button>
        </div>
      </header>

      <main className="container">
        <section className="card">
          <h2>استيراد ملف منهجي</h2>
          <p className="muted">اختَر الدرس ثم ارفع ملف الدرس — يُستخرج نصه ويُضاف إلى قاعدة المعرفة الخاصة بذلك الدرس فقط.</p>

          {error && (
            <p data-testid="admin-upload-error" className="error-text">
              {error}
            </p>
          )}

          {result && (
            <p data-testid="admin-upload-result" className="admin-success">
              ✓ تم استيراد الملف بنجاح — {result.chunkCount} مقطع معرفي
            </p>
          )}

          <div className="admin-fields">
            <label className="field">
              <span>الملف (PDF / DOCX / نص)</span>
              <input
                data-testid="admin-file-input"
                type="file"
                accept={ACCEPTED}
                ref={fileRef}
                onChange={onFileChange}
              />
            </label>

            <div className="grid-2">
              <label className="field">
                <span>العنوان (اختياري — يُستخدم اسم الملف إن تُرك)</span>
                <input data-testid="admin-title-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="مثال: درس الضرب والقسمة — ملخص" />
              </label>
              <label className="field">
                <span>المصدر (اختياري)</span>
                <input data-testid="admin-source-input" value={source} onChange={(e) => setSource(e.target.value)} maxLength={300} placeholder="مثال: كتاب الوزارة 2026" />
              </label>
            </div>

            {file && (
              <p className="muted small">
                الملف المحدد: {file.name} ({Math.ceil(file.size / 1024)} ك.ب)
              </p>
            )}
          </div>

          <h3 className="admin-scope-title">نطاق الدرس</h3>
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
            <section>
              <h3 className="admin-scope-title">اختر الدرس الهدف</h3>
              {selectedLesson && (
                <p data-testid="admin-selected-lesson" className="admin-selected">
                  الدرس المحدد: <b>{selectedLesson.title}</b>
                </p>
              )}
              <ul className="lesson-list">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <button
                      className={selectedLesson?.id === l.id ? "lesson-item selected" : "lesson-item"}
                      data-testid={`lesson-${l.id}`}
                      onClick={() => setSelectedLesson(l)}
                    >
                      <span>{l.title}</span>
                      <span className="muted small">{selectedLesson?.id === l.id ? "✓" : "تحديد"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="row-gap admin-actions">
            <button
              data-testid="admin-submit-upload"
              className="btn primary big"
              disabled={!canUpload}
              onClick={upload}
            >
              {busy ? "جارِ الاستيراد…" : "استيراد الملف للمنهج"}
            </button>
          </div>
        </section>

        <section className="card" data-testid="admin-documents">
          <h3>المستندات المستوردة ({documents.length})</h3>
          {documents.length === 0 ? (
            <p className="muted">لا توجد مستندات مستوردة بعد.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>النوع</th>
                  <th>الدرس</th>
                  <th>المقاطع</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} data-testid="admin-doc-row" data-chunks={d.chunkCount}>
                    <td>{d.title}</td>
                    <td>{KIND_LABEL[d.kind] ?? d.kind}</td>
                    <td>{d.lessonTitle ?? "—"}</td>
                    <td>{d.chunkCount}</td>
                    <td className="muted small">{new Date(d.createdAt).toLocaleDateString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}