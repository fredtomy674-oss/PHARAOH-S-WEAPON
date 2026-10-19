import { useEffect, useState } from "react";
import {
  ApiError,
  createStudent,
  setupStudent,
  type Grade,
  type User,
} from "./api.js";
import { listStudentGradeChoices } from "./studentGrades.js";
import { ThemeToggle } from "./components/ui/ThemeToggle.js";

interface Props {
  user: User;
  /** «ابدأ أول درس» — يحفظ الاسم والصف ثم يفتح منتقي الدروس مباشرة. */
  onStart: (user: User) => void;
  /** «لاحقًا» — يحفظ الاسم والصف (أول دخول لا يكتمل بدونهما) ثم يعود للرئيسية. */
  onSkip: (user: User) => void;
}

/**
 * أول دخول سينمائي (PHASE 157) — مرة واحدة في العمر، بعد التسجيل فقط:
 * المعلّم يرحّب بالاسم، والطالب يكتب اسمه ويختار صفّه ببطاقات كبيرة (لا قوائم)،
 * فيُحفظ الصف في ملفه الشخصي ويُفتح له كتابه وموادّه.
 *
 * PHASE 180 — «لكل طالبٍ ملفّه»: الاسم والصف يُحفظان عبر مسار الإعداد الآمن
 * (لا يمسح بيانات)، ويُفعّل الطالب في جلسة الدخول الحالية.
 */
export function FirstRunScreen({ user, onStart, onSkip }: Props) {
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(user.student?.gradeId ?? null);
  const [name, setName] = useState(user.student?.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cleanName = name.trim();
  const ready = cleanName.length >= 2 && Boolean(selected);
  const greeting = `أهلاً ${cleanName || "يا بطل"}! أنا سعد — معلمك الخصوصي. سنبني معًا خطة تناسب صفّك. لكن أولًا: اكتب اسمك واختر صفّك الدراسي، وسأفتح لك كتابك وموادّه.`;

  useEffect(() => {
    let alive = true;
    listStudentGradeChoices()
      .then((list) => {
        if (alive) setGrades(list);
      })
      .catch(() => {
        if (alive) setLoadFailed(true);
      });
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
      // الصوت تحسين تدريجي — فشله لا يوقف الإعداد.
    }
  };

  const save = async (): Promise<User> => {
    if (!selected) return user;
    if (cleanName.length < 2) throw new ApiError("اكتب اسم الطالب أولًا", 400, "NAME_REQUIRED");
    const input = { displayName: cleanName, gradeId: selected };
    return user.student ? setupStudent(user.student.id, input) : createStudent(input);
  };

  const start = async () => {
    if (busy || !ready) return;
    setBusy(true);
    setError(null);
    try {
      onStart(await save());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ الملف — حاول مرة أخرى");
      setBusy(false);
    }
  };

  const skip = async () => {
    if (busy || !ready) return;
    setBusy(true);
    setError(null);
    try {
      onSkip(await save());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ الملف — حاول مرة أخرى");
      setBusy(false);
    }
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
          <h2>اسمك وصفّك</h2>
          <p className="fr-sub">نحتاج الاسم الذي تحب أن نناديك به، والصف الذي تدرس فيه الآن. الصف يحدد موادك وخطتك.</p>

          <label className="fr-name">
            <span>اسم الطالب</span>
            <input
              data-testid="first-run-name"
              value={name}
              maxLength={80}
              placeholder="اكتب اسمك"
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          {grades === null && !loadFailed && <p className="fr-loading">…جارٍ تحضير الصفوف</p>}
          {loadFailed && (
            <p className="fr-error">تعذّر تحميل الصفوف الآن — يمكنك المحاولة مرة أخرى بعد قليل.</p>
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
              disabled={!ready || busy}
              onClick={() => void start()}
            >
              ابدأ أول درس
            </button>
            <button
              type="button"
              className="fr-skip"
              data-testid="first-run-skip"
              disabled={!ready || busy}
              onClick={() => void skip()}
            >
              لاحقًا — إلى الرئيسية
            </button>
          </div>

          <p className="fr-note">خطة صفّك وحدها ستظهر لك — لا مواد من صفوف أخرى.</p>
        </section>
      </main>
    </div>
  );
}
