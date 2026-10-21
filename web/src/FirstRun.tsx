import { useEffect, useState } from "react";
import {
  ApiError,
  createStudent,
  listTracks,
  setupStudent,
  type G12Choices,
  type Grade,
  type TrackOption,
  type User,
} from "./api.js";
import { listStudentGradeChoices } from "./studentGrades.js";
import { ThemeToggle } from "./components/ui/ThemeToggle.js";
import { G12ChoiceFields } from "./components/app/G12ChoiceFields.js";
import { isG12Grade } from "./g12Choices.js";

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
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [track, setTrack] = useState<string | null>(user.student?.track ?? null);
  const [tracksLoading, setTracksLoading] = useState(false);
  // The grade whose track list is actually in `tracks`. Until it matches the
  // selected grade, we do not know whether a track is required — so we do not
  // let the child save a half-formed choice.
  const [tracksFor, setTracksFor] = useState<string | null>(null);
  const [choices, setChoices] = useState<G12Choices>({
    studyLanguage: user.student?.studyLanguage ?? "ar",
    firstForeignLanguage: user.student?.firstForeignLanguage ?? "en",
    secondForeignLanguage: user.student?.secondForeignLanguage ?? "fr",
    religion: user.student?.religion ?? null,
  });
  const [name, setName] = useState(user.student?.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cleanName = name.trim();
  const selectedGrade = grades?.find((grade) => grade.id === selected) ?? null;
  const isG12 = isG12Grade(selectedGrade?.code);
  const tracksKnown = Boolean(selected) && tracksFor === selected;
  const choicesKnown = !isG12 || Boolean(choices.religion);
  const ready =
    cleanName.length >= 2 &&
    Boolean(selectedGrade) &&
    tracksKnown &&
    !tracksLoading &&
    (tracks.length === 0 || Boolean(track)) &&
    choicesKnown;
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

  // PHASE 185 — a grade may split into tracks. Ask the server for the tracks
  // that grade actually offers; a grade with none stays exactly as before.
  useEffect(() => {
    if (!selected) {
      setTracks([]);
      setTrack(null);
      setTracksLoading(false);
      setTracksFor(null);
      return;
    }
    let alive = true;
    setTracksLoading(true);
    listTracks(selected)
      .then((list) => {
        if (!alive) return;
        setTracks(list);
        setTrack((current) => {
          if (current && list.some((option) => option.code === current)) return current;
          return list.length === 1 ? list[0]!.code : null;
        });
        setTracksFor(selected);
      })
      .catch(() => {
        if (!alive) return;
        setTracks([]);
        setTrack(null);
        setTracksFor(selected);
      })
      .finally(() => {
        if (alive) setTracksLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selected]);

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
    if (isG12 && !choices.religion) {
      throw new ApiError("اختر كتاب التربية الدينية لإكمال ملفك", 400, "RELIGION_REQUIRED");
    }
    const input = {
      displayName: cleanName,
      gradeId: selected,
      ...(track ? { track } : {}),
      ...(isG12 ? choices : {}),
    };
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
                  onClick={() => {
                    setSelected(g.id);
                    setError(null);
                  }}
                >
                  {g.nameAr}
                </button>
              ))}
            </div>
          )}

          {tracksLoading && selected && <p className="fr-loading">…جارٍ تحضير المسارات</p>}

          {tracks.length > 0 && (
            <div className="fr-track-picker" data-testid="first-run-tracks">
              <h3>اختر مسارك الدراسي</h3>
              <p className="fr-sub">
                بعض الصفوف فيها أكثر من مسار؛ كل مسار له مواده. اختر مسارك مرة واحدة، وستظهر لك مواده فقط.
              </p>
              <div className="fr-grid">
                {tracks.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    data-testid={`first-run-track-${option.code}`}
                    className={track === option.code ? "fr-grade fr-grade--on" : "fr-grade"}
                    aria-pressed={track === option.code}
                    onClick={() => setTrack(option.code)}
                  >
                    {option.nameAr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isG12 && (
            <G12ChoiceFields
              choices={choices}
              onChange={(patch) => setChoices((current) => ({ ...current, ...patch }))}
              testIdPrefix="first-run"
            />
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
