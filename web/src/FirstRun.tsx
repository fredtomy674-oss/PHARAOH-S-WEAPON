import { useEffect, useState } from "react";
import {
  ApiError,
  listCountries,
  listGrades,
  listSystems,
  updateStudentProfile,
  type Grade,
  type User,
} from "./api.js";
import { ThemeToggle } from "./components/ui/ThemeToggle.js";

interface Props {
  user: User;
  /** «ابدأ أول درس» — يحفظ الصف ثم يفتح منتقي الدروس مباشرة. */
  onStart: (user: User) => void;
  /** «لاحقًا» — يحفظ الصف إن اختير (أفضل جهد) ثم يعود للرئيسية. */
  onSkip: (user: User) => void;
}

/**
 * أول دخول سينمائي (PHASE 157) — مرة واحدة في العمر، بعد التسجيل فقط:
 * المعلّم يرحّب بالاسم، والطالب يختار صفّه ببطاقات كبيرة (لا قوائم)،
 * فيُحفظ الصف في ملفه الشخصي ويُفتح له كتابه وموادّه.
 * الصوت تحسين تدريجي (صوت المتصفح) — والصوت الخادمي الحقيقي يأتي مع W7.
 */
export function FirstRunScreen({ user, onStart, onSkip }: Props) {
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const name = user.student?.displayName?.trim() || "يا بطل";
  const greeting = `أهلًا ${name}! أنا سلاح الفرعون — معلّمك الخاص. سنبدأ رحلتك من هنا: اختر صفّك الدراسي، وسأجهّز لك كتابك ودروسك صفحةً صفحة.`;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const countries = await listCountries();
        const egypt = countries.find((c) => c.nameAr === "مصر") ?? countries[0];
        if (!egypt) throw new Error("no countries");
        const systems = await listSystems(egypt.id);
        const firstSystem = systems[0];
        if (!firstSystem) throw new Error("no systems");
        const list = await listGrades(firstSystem.id);
        if (alive) setGrades(list);
      } catch {
        if (alive) setLoadFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const listen = () => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.lang = "ar-EG";
      synth.speak(utterance);
    } catch {
      // الصوت تحسين تدريجي — فشله لا يوقف شيئًا
    }
  };

  const withSavedGrade = async (): Promise<User> => {
    if (!selected) return user;
    const student = await updateStudentProfile({ gradeId: selected });
    return { ...user, student: { ...user.student, id: student.id, displayName: student.displayName, gradeId: student.gradeId } };
  };

  const start = async () => {
    if (busy || !selected) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await withSavedGrade();
      onStart(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حفظ الصف — حاول مرة أخرى");
      setBusy(false);
    }
  };

  const skip = async () => {
    if (busy) return;
    setBusy(true);
    // أفضل جهد: لو اختار صفًّا نحفظه، وفشل الحفظ لا يمنعه من المتابعة أبدًا.
    let updated = user;
    try {
      updated = await withSavedGrade();
    } catch {
      // يُتجاهل — يمكن اختيار الصف لاحقًا من منتقي الدروس
    }
    onSkip(updated);
  };

  return (
    <div className="fr-wrap" data-testid="first-run">
      <header className="fr-top">
        <div className="fr-brand">
          <span className="fr-mark" aria-hidden="true">
            ف
          </span>
          <span>سلاح الفرعون</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="fr-main">
        <section className="fr-teacher">
          <div className="fr-avatar" aria-hidden="true">
            ف
          </div>
          <div className="fr-bubble">
            <p>{greeting}</p>
            <button type="button" className="fr-listen" data-testid="first-run-listen" onClick={listen}>
              🔊 اسمع الترحيب
            </button>
          </div>
        </section>

        <section className="fr-grades">
          <h2>اختر صفّك الدراسي</h2>
          <p className="fr-sub">مرة واحدة فقط — وبعدها يُفتح لك كتابك وموادّك مباشرة.</p>

          {grades === null && !loadFailed && <p className="fr-loading">…جارٍ تجهيز الصفوف</p>}
          {loadFailed && (
            <p className="fr-error">تعذّر تحميل الصفوف الآن — يمكنك المتابعة، وسيُسألك عن صفّك عند بدء أول درس.</p>
          )}

          {grades !== null && grades.length > 0 && (
            <div className="fr-grid">
              {grades.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  data-testid={`first-run-grade-${g.id}`}
                  className={selected === g.id ? "fr-grade fr-grade--on" : "fr-grade"}
                  aria-pressed={selected === g.id}
                  onClick={() => setSelected(g.id)}
                >
                  {g.nameAr}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="fr-error" data-testid="first-run-error" role="alert">
              {error}
            </p>
          )}

          <div className="fr-actions">
            <button
              type="button"
              className="fr-start"
              data-testid="first-run-start"
              disabled={!selected || busy}
              onClick={() => void start()}
            >
              ابدأ أول درس
            </button>
            <button type="button" className="fr-skip" data-testid="first-run-skip" disabled={busy} onClick={() => void skip()}>
              لاحقًا — إلى الرئيسية
            </button>
          </div>

          <p className="fr-note">أول حصة كاملة مجانية — بلا بطاقة، وبلا التزام.</p>
        </section>
      </main>
    </div>
  );
}
