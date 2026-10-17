import { useEffect, useRef, useState } from "react";
import {
  adminGenerateQuestions,
  getAdminStats,
  ingestCurriculumFile,
  listAdminDocuments,
  listCountries,
  listCurricula,
  listGrades,
  listLessons,
  listSubjects,
  listSubscriptions,
  listSystems,
  listTerms,
  listUnits,
  setStudentSubscription,
  ApiError,
  type AdminDocument,
  type AdminQuestionGenResult,
  type AdminSubscriptionRow,
  type AdminStats,
  type Country,
  type Curriculum,
  type EduSystem,
  type Grade,
  type IngestFileResult,
  type Lesson,
  type Subject,
  type Term,
  type Unit,
} from "./api.js";
import { Button, Card, EmptyState, StatTile } from "./components/ui/index.js";

interface Props {
  onBack: () => void;
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

/** حالة الاشتراك بالعربية — المعروفة تُترجم، والمجهولة تُعرض كما هي (بلا تخمين). */
const STATUS_LABEL: Record<string, string> = {
  active: "نشطة",
  canceled: "ملغاة",
  expired: "منتهية",
  trialing: "تجريبية",
};

/** PHASE 34 — bar height in % relative to the window peak; a floor keeps zero-days visible. */
function barHeight(count: number, series: ReadonlyArray<{ count: number }>): string {
  const peak = Math.max(1, ...series.map((d) => d.count));
  return count === 0 ? "3%" : `${Math.max(6, Math.round((count / peak) * 100))}%`;
}

/** PHASE 34 — «2026-09-27» → «27/09» so the axis reads as a date in RTL. */
function dayLabel(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

/**
 * غرفة العمليات (PHASE 164) — إعادة تصميم لوحة الإدارة كاملة بنفس الأقسام
 * والقدرات: نبض المنصة · الاشتراكات · الذكاء الاصطناعي · النشاط الزمني ·
 * استيراد المناهج · توليد الأسئلة · المستندات والاشتراكات.
 *
 * العقود الصارمة (A1–A6 · O2 · E2) حرفية: كل testid وكل نص تنتظره الاختبارات
 * بقي كما هو — التغيير تصميم وحده، تحت القشرة الموحّدة (AppShell) كمركز ولي
 * الأمر: ترويسة واحدة ودرج حساب واحد (المظهر/الخروج)، بلا شريط تنقّل طلابي.
 */
export function AdminScreen({ onBack }: Props) {
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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // PHASE 20 — subscription management (billing without a payment gateway).
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([]);
  const [subBusy, setSubBusy] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  // PHASE 28 — LLM question generation for coverage of questionless concepts.
  const [genBusy, setGenBusy] = useState(false);
  const [genResult, setGenResult] = useState<AdminQuestionGenResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    listSubscriptions().then(setSubscriptions).catch(() => setSubError("تعذر تحميل الاشتراكات"));
  }, []);

  const grantPlan = async (studentId: string, plan: "free" | "premium") => {
    setSubBusy(studentId);
    setSubError(null);
    try {
      await setStudentSubscription(studentId, { plan, status: "active" });
      setSubscriptions(await listSubscriptions());
    } catch (err) {
      setSubError(err instanceof ApiError ? err.message : "تعذر تحديث الاشتراك");
    } finally {
      setSubBusy(null);
    }
  };

  useEffect(() => {
    listCountries().then(setCountries).catch(() => setError("تعذر تحميل الدول"));
  }, []);

  // Subjects follow the picked grade: only what that grade teaches.
  // Changing the grade invalidates everything below it (same cascade as
  // Onboarding's clearBelow: a stale subject from another grade must not stay
  // selected while the list reloads).
  useEffect(() => {
    if (!gradeId) {
      setSubjects([]);
      return;
    }
    listSubjects(gradeId).then(setSubjects).catch(() => undefined);
  }, [gradeId]);

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

  // PHASE 17 — operational statistics (tolerant: never blocks the admin flow).
  useEffect(() => {
    getAdminStats().then(setStats).catch(() => undefined);
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

  // PHASE 28 — generate one MCQ per questionless concept in the selected
  // curriculum (offline-friendly via mock provider). Metadata-only report.
  const runGenerate = async () => {
    if (!curriculumId) return;
    setGenBusy(true);
    setGenError(null);
    setGenResult(null);
    try {
      setGenResult(await adminGenerateQuestions(curriculumId));
    } catch (err) {
      setGenError(err instanceof ApiError ? err.message : "تعذر توليد الأسئلة");
    } finally {
      setGenBusy(false);
    }
  };

  return (
    <div className="ao-main" data-testid="admin-screen">
      <header className="ao-hero">
        <div className="ao-hero__text">
          <h1 className="ao-hero__title">غرفة العمليات</h1>
          <p className="ao-hero__sub">
            قاعدة المعرفة · الاستيراد · المؤشرات · الاشتراكات — كل ما يشغّل المنصة في شاشة واحدة.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          الرئيسية
        </Button>
      </header>

      {stats && (
        <section className="ao-kpis" data-testid="admin-stats" aria-label="نبض المنصة">
          <StatTile testId="admin-stat-users" value={stats.users.total} label="مستخدم" />
          <StatTile testId="admin-stat-students" value={stats.users.students} label="طالب" />
          <StatTile
            testId="admin-stat-sessions"
            value={stats.sessions.total}
            label="جلسة"
            hint={`${stats.sessions.active} نشطة الآن`}
          />
          <StatTile
            testId="admin-stat-messages"
            value={stats.messages.total}
            label="رسالة"
            hint={`${stats.messages.tutor} من المعلّم`}
          />
          <StatTile
            testId="admin-stat-documents"
            value={stats.documents.ready}
            label="مستند جاهز"
            hint={`من ${stats.documents.total}`}
          />
          <StatTile testId="admin-stat-chunks" value={stats.chunks} label="مقطع معرفي" />
        </section>
      )}

      {stats && (
        <div className="ao-duo">
          <Card data-testid="admin-stats-subscriptions" title="الاشتراكات" hint="نظرة سريعة — بلا بوابة دفع في MVP">
            <div className="ao-stats">
              <StatTile testId="admin-stat-subs-total" value={stats.subscriptions.total} label="طالب مسجّل" />
              <StatTile testId="admin-stat-subs-premium" value={stats.subscriptions.premium} label="خطة مميزة" />
              <StatTile
                testId="admin-stat-subs-active"
                value={stats.subscriptions.active}
                label="مميزة سارية فعليًا"
              />
              <StatTile
                testId="admin-stat-subs-conversion"
                value={`${stats.subscriptions.conversionRate}%`}
                label="معدل التحويل"
              />
            </div>
          </Card>

          <Card data-testid="admin-stats-ai" title="الذكاء الاصطناعي" hint="الاستخدام والوفورات — أرقام حقيقية بلا فاتورة مفاجئة">
            <div className="ao-stats">
              <StatTile testId="admin-stat-ai-calls" value={stats.ai.calls} label="نداء ذكاء اصطناعي" />
              <StatTile
                testId="admin-stat-ai-tokens"
                value={stats.ai.tokens.toLocaleString("en-US")}
                label="رمز (توكن)"
              />
              <StatTile testId="admin-stat-ai-cost" value={`$${stats.ai.costUsd.toFixed(4)}`} label="تكلفة فعلية" />
              <StatTile
                testId="admin-stat-ai-cache-hit"
                value={`${stats.ai.cache.hitRate}%`}
                label={`إصابة الكاش (${stats.ai.cache.hits})`}
              />
              <StatTile
                testId="admin-stat-ai-savings"
                value={`$${stats.ai.estimatedSavingsUsd.toFixed(4)}`}
                label="وفورات تقديرية"
                hint={`${stats.ai.estimatedSavingsTokens.toLocaleString("en-US")} توكن`}
              />
            </div>
          </Card>
        </div>
      )}

      {stats && (
        <Card
          data-testid="admin-stats-trends"
          title={`النشاط الزمني — آخر ${stats.trends.days} يومًا`}
          hint="الجلسات والرسائل والذكاء الاصطناعي، مجمّعة يوميًا (UTC)"
        >
          <div className="ao-stats">
            <StatTile
              testId="admin-stat-trend-sessions"
              value={stats.trends.totals.sessions}
              label="جلسة"
              hint={`${stats.trends.activeDays} يوم نشط`}
            />
            <StatTile testId="admin-stat-trend-messages" value={stats.trends.totals.messages} label="رسالة" />
            <StatTile
              testId="admin-stat-trend-ai-calls"
              value={stats.trends.totals.aiCalls}
              label="نداء ذكاء اصطناعي"
              hint={`$${stats.trends.totals.aiCostUsd.toFixed(4)}`}
            />
          </div>

          {/* Pure-CSS daily bar charts — no charting dependency (D-021 tail). */}
          <div className="ao-charts">
            <figure className="ao-chart" data-testid="admin-trend-chart-sessions">
              <figcaption>الجلسات / اليوم</figcaption>
              <div className="ao-bars" data-testid="admin-trend-bars-sessions">
                {stats.trends.sessionsByDay.map((d) => (
                  <div className="ao-bar-col" key={d.day} title={`${d.day}: ${d.count} جلسة`} data-testid="admin-trend-bar">
                    <div className="ao-bar" style={{ height: barHeight(d.count, stats.trends.sessionsByDay) }} />
                    <span className="ao-bar-label">{dayLabel(d.day)}</span>
                  </div>
                ))}
              </div>
            </figure>

            <figure className="ao-chart" data-testid="admin-trend-chart-messages">
              <figcaption>الرسائل / اليوم</figcaption>
              <div className="ao-bars" data-testid="admin-trend-bars-messages">
                {stats.trends.messagesByDay.map((d) => (
                  <div className="ao-bar-col" key={d.day} title={`${d.day}: ${d.count} رسالة`} data-testid="admin-trend-bar">
                    <div className="ao-bar" style={{ height: barHeight(d.count, stats.trends.messagesByDay) }} />
                    <span className="ao-bar-label">{dayLabel(d.day)}</span>
                  </div>
                ))}
              </div>
            </figure>
          </div>

          <h4 className="ao-sub">الدروس الأكثر نشاطًا</h4>
          {stats.trends.topLessons.length === 0 ? (
            <p className="ao-empty" data-testid="admin-trend-no-lessons">
              لا جلسات على دروس بعد.
            </p>
          ) : (
            <ol className="ao-ranks" data-testid="admin-trend-top-lessons">
              {stats.trends.topLessons.map((l) => (
                <li className="ao-rank" key={l.lessonId} data-testid="admin-trend-top-lesson">
                  <span className="ao-rank__title">{l.title || "(درس محذوف)"}</span>
                  <b className="ao-rank__count">{l.sessions}</b>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      <Card
        data-testid="admin-import"
        title="استيراد ملف منهجي"
        hint="اختَر الدرس ثم ارفع ملفه — يُستخرج نصه ويُضاف إلى قاعدة المعرفة الخاصة بذلك الدرس فقط."
      >
        {error && (
          <p data-testid="admin-upload-error" className="ao-note ao-note--err">
            {error}
          </p>
        )}

        {result && (
          <p data-testid="admin-upload-result" className="ao-note ao-note--ok">
            ✓ تم استيراد الملف بنجاح — {result.chunkCount} مقطع معرفي
          </p>
        )}

        <div className="ao-form">
          <label className="ao-field">
            <span>الملف (PDF / DOCX / نص)</span>
            <input
              className="ao-input ao-input--file"
              data-testid="admin-file-input"
              type="file"
              accept={ACCEPTED}
              ref={fileRef}
              onChange={onFileChange}
            />
            {file && (
              <span className="ao-hint">
                الملف المحدد: {file.name} ({Math.ceil(file.size / 1024)} ك.ب)
              </span>
            )}
          </label>

          <div className="ao-grid2">
            <label className="ao-field">
              <span>العنوان (اختياري — يُستخدم اسم الملف إن تُرك)</span>
              <input
                className="ao-input"
                data-testid="admin-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="مثال: درس الضرب والقسمة — ملخص"
              />
            </label>
            <label className="ao-field">
              <span>المصدر (اختياري)</span>
              <input
                className="ao-input"
                data-testid="admin-source-input"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                maxLength={300}
                placeholder="مثال: كتاب الوزارة 2026"
              />
            </label>
          </div>
        </div>

        <div className="ao-scope">
          <h4 className="ao-sub">نطاق الدرس</h4>
          <div className="ao-scope__grid">
            <label className="ao-field">
              <span>الدولة</span>
              <select
                className="ao-input"
                data-testid="select-country"
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
              >
                <option value="">اختر الدولة…</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr}
                  </option>
                ))}
              </select>
            </label>

            {countryId && (
              <label className="ao-field">
                <span>النظام التعليمي</span>
                <select
                  className="ao-input"
                  data-testid="select-system"
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value)}
                >
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
              <>
                <label className="ao-field">
                  <span>الصف</span>
                  <select
                    className="ao-input"
                    data-testid="select-grade"
                    value={gradeId}
                    onChange={(e) => {
                      setGradeId(e.target.value);
                      setSubjectId("");
                      setCurriculumId("");
                      setCurricula([]);
                      setTermId("");
                      setTerms([]);
                      setUnitId("");
                      setUnits([]);
                      setLessons([]);
                      setSelectedLesson(null);
                    }}
                  >
                    <option value="">اختر الصف…</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nameAr}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ao-field">
                  <span>المادة</span>
                  <select
                    className="ao-input"
                    data-testid="select-subject"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                  >
                    <option value="">اختر المادة…</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {gradeId && subjectId && (
              <label className="ao-field">
                <span>المنهج</span>
                <select
                  className="ao-input"
                  data-testid="select-curriculum"
                  value={curriculumId}
                  onChange={(e) => setCurriculumId(e.target.value)}
                >
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
              <label className="ao-field">
                <span>الفصل الدراسي</span>
                <select
                  className="ao-input"
                  data-testid="select-term"
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                >
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
              <label className="ao-field">
                <span>الوحدة</span>
                <select
                  className="ao-input"
                  data-testid="select-unit"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                >
                  <option value="">اختر الوحدة…</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {lessons.length > 0 && (
            <>
              <h4 className="ao-sub">اختر الدرس الهدف</h4>
              {selectedLesson && (
                <p data-testid="admin-selected-lesson" className="ao-picked">
                  الدرس المحدد: <b>{selectedLesson.title}</b>
                </p>
              )}
              <ul className="ao-lessons">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      className={selectedLesson?.id === l.id ? "ao-lesson ao-lesson--on" : "ao-lesson"}
                      data-testid={`lesson-${l.id}`}
                      onClick={() => setSelectedLesson(l)}
                    >
                      <span className="ao-lesson__title">{l.title}</span>
                      <span className="ao-lesson__hint">{selectedLesson?.id === l.id ? "✓" : "تحديد"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="ao-actions">
          <Button data-testid="admin-submit-upload" size="lg" disabled={!canUpload} onClick={upload}>
            {busy ? "جارِ الاستيراد…" : "استيراد الملف للمنهج"}
          </Button>
        </div>
      </Card>

      <Card
        data-testid="admin-question-gen"
        title="توليد أسئلة بالمفهوم (LLM)"
        hint="سؤال اختيار من متعدد لكل مفهوم بلا أسئلة في المنهج المحدد، من مقاطع الدروس (نمط تجريبي يعمل دون اتصال عبر مزوّد افتراضي)."
      >
        <div className="ao-actions">
          <Button
            data-testid="admin-gen-questions"
            disabled={!curriculumId || genBusy}
            onClick={runGenerate}
          >
            {genBusy ? "جارِ التوليد…" : "توليد أسئلة للمنهج المحدد"}
          </Button>
        </div>
        {genError && (
          <p className="ao-note ao-note--err" data-testid="admin-gen-error">
            {genError}
          </p>
        )}
        {genResult && (
          <p className="ao-note" data-testid="admin-gen-result">
            تم توليد {genResult.generated} سؤالًا، وتخطّى {genResult.skipped} مفاهيم مغطّاة، وفشل {genResult.failed}.
          </p>
        )}
      </Card>

      <Card data-testid="admin-documents" title={`المستندات المستوردة (${documents.length})`}>
        {documents.length === 0 ? (
          <EmptyState
            icon="🗂️"
            title="لا توجد مستندات مستوردة بعد"
            note="ارفع أول ملف منهجي من بطاقة الاستيراد أعلاه — وسيظهر هنا فور قبوله."
          />
        ) : (
          <div className="ao-tablewrap">
            <table className="ao-table">
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
                    <td className="ao-muted">{new Date(d.createdAt).toLocaleDateString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        data-testid="admin-subscriptions"
        title={`الاشتراكات (${subscriptions.length})`}
        hint="إدارة الخطط يدويًا (فوترة بلا بوابة دفع في MVP) — «مميزة» ترفع حد الرسائل اليومي للطالب."
      >
        {subError && <p className="ao-note ao-note--err">{subError}</p>}
        {subscriptions.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="لا توجد اشتراكات بعد"
            note="تنشأ تلقائيًا عند أول نشاط لكل طالب — وتُدار من هنا يدويًا."
          />
        ) : (
          <div className="ao-tablewrap">
            <table className="ao-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الخطة</th>
                  <th>الحالة</th>
                  <th>منذ</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.studentId} data-testid="admin-sub-row" data-student-id={s.studentId} data-plan={s.plan}>
                    <td>
                      <b className="ao-student">{s.studentName ?? s.studentEmail}</b>
                      <span className="ao-student__mail">{s.studentEmail}</span>
                    </td>
                    <td>
                      <span
                        className={s.plan === "premium" ? "ao-plan ao-plan--premium" : "ao-plan"}
                        data-testid={`sub-plan-${s.studentId}`}
                      >
                        {s.plan === "premium" ? "مميزة" : "مجانية"}
                      </span>
                    </td>
                    <td className="ao-muted">{STATUS_LABEL[s.status] ?? s.status}</td>
                    <td className="ao-muted">{new Date(s.startedAt).toLocaleDateString("ar-EG")}</td>
                    <td>
                      {s.plan === "premium" ? (
                        <Button
                          data-testid={`sub-downgrade-${s.studentId}`}
                          variant="ghost"
                          size="sm"
                          disabled={subBusy === s.studentId}
                          onClick={() => grantPlan(s.studentId, "free")}
                        >
                          {subBusy === s.studentId ? "…" : "إلغاء المميزة"}
                        </Button>
                      ) : (
                        <Button
                          data-testid={`sub-upgrade-${s.studentId}`}
                          size="sm"
                          disabled={subBusy === s.studentId}
                          onClick={() => grantPlan(s.studentId, "premium")}
                        >
                          {subBusy === s.studentId ? "…" : "ترقية إلى مميزة"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
