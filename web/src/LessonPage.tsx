import { useEffect, useState } from "react";
import {
  ApiError,
  generatePracticeQuestion,
  getPracticeQuestion,
  lessonBreadcrumb,
  listConcepts,
  myProgress,
  startSession,
  submitPracticeAnswer,
  type Breadcrumb,
  type Concept,
  type LearningSession,
  type MasteryConcept,
  type PracticeQuestion,
  type PracticeResult,
} from "./api.js";
import { Button, Card } from "./components/ui/index.js";

/**
 * PHASE 159 (W3) — صفحة الدرس: الطبقة التي كانت مفقودة بين «تعلّم» والغرفة
 * (الخريطة ٣.٥، هيكلها هنا والمصادر الستة في W5/160).
 *
 * تجيب: «كل شيء عن هذا الدرس في مكان واحد» — عنوانه وموضعه، مفاهيمه وإتقانها
 * الحقيقي، **ابدأ حصة ▶** التي تفتح الغرفة (02 كما هي)، و**اختبرني 🎯**:
 * اختبار قصير مقيّد بمفاهيم الدرس من محرك الأسئلة القائم — تصحيح حتمي، ونتيجة
 * نهاية، وصفر عمل خادم جديد.
 *
 * العقود: `onboarding-error` يبقى معرّف خطأ بدء الجلسة (كان في المنتقي، وصار
 * هنا حيث يقف زر البدء الآن — ON1 يوثّق هذا التنقّل الشرعي).
 */

interface Props {
  lessonId: string;
  onBack: () => void;
  onStarted: (s: LearningSession) => void;
}

interface QuizState {
  phase: "loading" | "empty" | "running" | "done";
  questions: PracticeQuestion[];
  index: number;
  chosen: number | null;
  result: PracticeResult | null;
  busy: boolean;
  correct: number;
  error: string | null;
  /** epoch-ms when the current question was displayed (answer timer, كالتمرين). */
  shownAt: number;
}

/** «اختبار قصير» — حد أقصى لأسئلة الجلسة الواحدة. */
const QUIZ_MAX_QUESTIONS = 6;

export function LessonPage({ lessonId, onBack, onStarted }: Props) {
  const [bc, setBc] = useState<Breadcrumb["breadcrumb"] | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [mastery, setMastery] = useState<MasteryConcept[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  function refreshMastery(): void {
    myProgress()
      .then((p) => setMastery(p.mastery))
      .catch(() => undefined);
  }

  useEffect(() => {
    setBc(null);
    setConcepts([]);
    setQuiz(null);
    setError(null);
    lessonBreadcrumb(lessonId)
      .then(setBc)
      .catch(() => setError("تعذر تحميل بيانات الدرس."));
    listConcepts(lessonId)
      .then(setConcepts)
      .catch(() => setConcepts([]));
    refreshMastery();
  }, [lessonId]);

  async function startLesson(): Promise<void> {
    if (!bc || busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await startSession({
        curriculumId: bc.curriculum.id,
        gradeId: bc.grade.id,
        subjectId: bc.subject.id,
        lessonId,
      });
      onStarted(session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر بدء الجلسة");
    } finally {
      setBusy(false);
    }
  }

  /** أسئلة الدرس: سؤال واحد لكل مفهوم له سؤال متاح (حتى الحد الأقصى). */
  async function openQuiz(): Promise<void> {
    setQuiz({ phase: "loading", questions: [], index: 0, chosen: null, result: null, busy: false, correct: 0, error: null, shownAt: Date.now() });
    const found: PracticeQuestion[] = [];
    for (const c of concepts.slice(0, 10)) {
      try {
        const q = await getPracticeQuestion(c.id, "mcq");
        if (q) found.push(q);
      } catch {
        // مفهوم بلا سؤال — نكمل.
      }
      if (found.length >= QUIZ_MAX_QUESTIONS) break;
    }
    setQuiz((s) => (s ? { ...s, phase: found.length > 0 ? "running" : "empty", questions: found, shownAt: Date.now() } : s));
  }

  async function generateForLesson(): Promise<void> {
    const first = concepts[0];
    if (!first) return;
    setQuiz((s) => (s ? { ...s, busy: true, error: null } : s));
    try {
      const q = await generatePracticeQuestion(first.id, "mcq");
      setQuiz((s) =>
        s ? { ...s, phase: "running", questions: [q], index: 0, chosen: null, result: null, busy: false, correct: 0, shownAt: Date.now() } : s,
      );
    } catch {
      setQuiz((s) => (s ? { ...s, busy: false, error: "تعذر توليد سؤال لهذا الدرس." } : s));
    }
  }

  async function submitQuiz(): Promise<void> {
    if (!quiz || quiz.chosen === null || quiz.busy) return;
    const q = quiz.questions[quiz.index];
    if (!q) return;
    setQuiz((s) => (s ? { ...s, busy: true, error: null } : s));
    try {
      const elapsed = Math.max(1, Math.min(600, Math.round((Date.now() - quiz.shownAt) / 1000)));
      const result = await submitPracticeAnswer(q.id, quiz.chosen, elapsed);
      setQuiz((s) => (s ? { ...s, busy: false, result, correct: s.correct + (result.correct ? 1 : 0) } : s));
    } catch {
      setQuiz((s) => (s ? { ...s, busy: false, error: "تعذر إرسال الإجابة." } : s));
    }
  }

  function nextQuiz(): void {
    setQuiz((s) => {
      if (!s) return s;
      const next = s.index + 1;
      if (next >= s.questions.length) return { ...s, phase: "done", chosen: null, result: null, index: next };
      return { ...s, index: next, chosen: null, result: null, shownAt: Date.now() };
    });
  }

  function retryQuiz(): void {
    setQuiz((s) => (s ? { ...s, phase: "running", index: 0, chosen: null, result: null, correct: 0, error: null, shownAt: Date.now() } : s));
  }

  function closeQuiz(): void {
    setQuiz(null);
    refreshMastery();
  }

  const masteryOf = (conceptId: string): MasteryConcept | null => mastery.find((m) => m.conceptId === conceptId) ?? null;
  const current = quiz && quiz.phase === "running" ? quiz.questions[quiz.index] : null;

  return (
    <div className="ln-layout">
      <main className="ln-main ln-main--lesson" data-testid="lesson-page">
        <button type="button" className="ln-back" data-testid="lesson-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
          رجوع إلى تعلّم
        </button>

        <section className="ln-lessonhead">
          {bc ? (
            <>
              <h2 data-testid="lesson-title">{bc.lesson.title}</h2>
              <p className="ln-lessonhead__place" data-testid="lesson-place">
                {bc.subject.nameAr} · {bc.unit.title} · {bc.term.title}
              </p>
            </>
          ) : (
            <h2 data-testid="lesson-loading" className="ln-note">
              جارٍ تحميل الدرس…
            </h2>
          )}
          <div className="ln-lessonhead__actions">
            <Button data-testid="lesson-start" size="lg" disabled={!bc || busy} onClick={() => void startLesson()}>
              {busy ? "…" : "ابدأ حصة ▶"}
            </Button>
            <Button
              variant="ghost"
              data-testid="lesson-quiz-open"
              disabled={concepts.length === 0 || quiz !== null}
              onClick={() => void openQuiz()}
            >
              اختبرني 🎯
            </Button>
          </div>
          {error && (
            <p data-testid="onboarding-error" className="ln-error">
              {error}
            </p>
          )}
        </section>

        {quiz && (
          <Card
            className="ln-quiz"
            data-testid="quiz-panel"
            title="اختبرني 🎯"
            hint="أسئلة من مفاهيم هذا الدرس — تصحيح فوري ونتيجة في النهاية."
            actions={
              <button type="button" className="ln-change" data-testid="quiz-close" onClick={closeQuiz}>
                إغلاق
              </button>
            }
          >
            {quiz.phase === "loading" && (
              <p className="ln-note" data-testid="quiz-loading">
                جارٍ تحضير أسئلة الدرس…
              </p>
            )}

            {quiz.phase === "empty" && (
              <>
                <p className="ln-note" data-testid="quiz-empty">
                  لا توجد أسئلة جاهزة لمفاهيم هذا الدرس بعد — يمكنك توليد أول سؤال الآن.
                </p>
                <Button data-testid="quiz-generate" disabled={quiz.busy} onClick={() => void generateForLesson()}>
                  {quiz.busy ? "…" : "ولّد سؤالًا لهذا الدرس"}
                </Button>
              </>
            )}

            {quiz.phase === "running" && current && (
              <>
                <p className="ln-quiz__progress" data-testid="quiz-progress">
                  سؤال {quiz.index + 1} من {quiz.questions.length}
                </p>
                <p className="ln-quiz__concept" data-testid="quiz-concept">
                  {current.conceptTitle ?? "تمرين الدرس"}
                </p>
                <p className="ln-quiz__question" data-testid="quiz-question">
                  {current.content}
                </p>
                <div className="ln-quiz__options">
                  {current.options?.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      className={quiz.chosen === i ? "ln-option ln-option--on" : "ln-option"}
                      data-testid="quiz-option"
                      data-option-index={i}
                      disabled={quiz.busy || quiz.result !== null}
                      onClick={() => setQuiz((s) => (s ? { ...s, chosen: i, result: null } : s))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {quiz.result && (
                  <p className={quiz.result.correct ? "ln-feedback ln-feedback--ok" : "ln-feedback ln-feedback--warn"} data-testid="quiz-feedback">
                    {quiz.result.feedback
                      ? quiz.result.feedback
                      : quiz.result.correct
                        ? "إجابة صحيحة 🎉"
                        : "إجابة غير صحيحة — راجع الشرح ثم تابع."}
                  </p>
                )}
                {quiz.result?.explanation && (
                  <p className="ln-note" data-testid="quiz-explanation">
                    {quiz.result.explanation}
                  </p>
                )}
                <div className="ln-quiz__actions">
                  {quiz.result === null ? (
                    <Button data-testid="quiz-submit" disabled={quiz.chosen === null || quiz.busy} onClick={() => void submitQuiz()}>
                      {quiz.busy ? "…" : "تحقق من إجابتي"}
                    </Button>
                  ) : (
                    <Button data-testid="quiz-next" onClick={nextQuiz}>
                      {quiz.index + 1 >= quiz.questions.length ? "اعرض نتيجتي" : "سؤال آخر"}
                    </Button>
                  )}
                </div>
              </>
            )}

            {quiz.phase === "done" && (
              <>
                <p className="ln-quiz__result" data-testid="quiz-result">
                  أجبت {quiz.correct} من {quiz.questions.length}
                </p>
                <p className="ln-note">
                  {quiz.correct === quiz.questions.length
                    ? "ممتاز — أتقنت مفاهيم هذا الدرس 🎉"
                    : quiz.correct >= quiz.questions.length / 2
                      ? "جيد — راجع مفاهيم الدرس ثم أعد المحاولة."
                      : "لا بأس — افتح مفاهيم الدرس أعلاه ثم أعد الاختبار."}
                </p>
                <div className="ln-quiz__actions">
                  <Button data-testid="quiz-retry" onClick={retryQuiz}>
                    أعد الاختبار
                  </Button>
                </div>
              </>
            )}

            {quiz.error && (
              <p className="ln-error" data-testid="quiz-error">
                {quiz.error}
              </p>
            )}
          </Card>
        )}

        <Card className="ln-concepts" title="مفاهيم الدرس" hint="إتقانك الحقيقي لكل مفهوم — من محرك التقييم نفسه.">
          {concepts.length === 0 ? (
            <p className="ln-note" data-testid="lesson-concepts-empty">
              لا توجد مفاهيم مسجلة لهذا الدرس بعد.
            </p>
          ) : (
            <ul className="ln-concepts__list" data-testid="lesson-concepts">
              {concepts.map((c) => {
                const m = masteryOf(c.id);
                return (
                  <li key={c.id} className="ln-concept" data-testid="lesson-concept">
                    <span className="ln-concept__title">{c.title}</span>
                    <span
                      className={m && (m.level === "mastered" || m.level === "advanced") ? "ln-chip ln-chip--ok" : "ln-chip"}
                      data-testid="lesson-mastery"
                    >
                      {m ? `${m.labelAr} · ${Math.round(m.decayedMastery * 100)}%` : "لم يُختبر بعد"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
