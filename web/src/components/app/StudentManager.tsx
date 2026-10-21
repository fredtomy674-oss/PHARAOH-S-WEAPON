import { createContext, useContext, useEffect, useState } from "react";
import {
  ApiError,
  activateStudent,
  changeStudentGrade,
  createStudent,
  listTracks,
  updateStudentChoices,
  type G12Choices,
  type Grade,
  type TrackOption,
  type User,
} from "../../api.js";
import { listStudentGradeChoices } from "../../studentGrades.js";
import { isG12Grade } from "../../g12Choices.js";
import { Button, Sheet } from "../ui/index.js";
import { G12ChoiceFields } from "./G12ChoiceFields.js";

export type StudentManagerMode = "switch" | "add" | "grade" | "choices";

interface ManagerContextValue {
  open: (mode: StudentManagerMode) => void;
}

export const StudentManagerContext = createContext<ManagerContextValue | null>(null);

/** Home/Learn ask the shell to open the one student manager. */
export function useStudentManager(): ManagerContextValue {
  return useContext(StudentManagerContext) ?? { open: () => undefined };
}

/**
 * PHASE 180 — «الطالب الذي أدرّسه الآن».
 *
 * A single sheet owns switching, adding and the destructive grade change.
 * Every successful call replaces the auth user in App, and remounts the
 * student-scoped screens, so no stale plan can survive a switch.
 */
interface SheetProps {
  mode: StudentManagerMode | null;
  user: User;
  onClose: () => void;
  onModeChange: (mode: StudentManagerMode) => void;
  onChanged: (user: User) => void;
}

export type { SheetProps as StudentManagerSheetProps };

const TITLES: Record<StudentManagerMode, string> = {
  switch: "الطالب الذي تدرّسه",
  add: "إضافة طالب جديد",
  grade: "تغيير المنهج",
  choices: "اختيارات اللغة والتربية الدينية",
};

function g12ChoicesOf(student: User["student"]): G12Choices {
  return {
    studyLanguage: student?.studyLanguage ?? "ar",
    firstForeignLanguage: student?.firstForeignLanguage ?? "en",
    secondForeignLanguage: student?.secondForeignLanguage ?? "fr",
    religion: student?.religion ?? null,
  };
}

export function StudentManagerSheet({ mode, user, onClose, onModeChange, onChanged }: SheetProps) {
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [gradesFailed, setGradesFailed] = useState(false);
  const [track, setTrack] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksFor, setTracksFor] = useState<string | null>(null);
  const [choices, setChoices] = useState<G12Choices>(() => g12ChoicesOf(user.student));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(false);

  const students = user.students ?? [];
  const active = user.student;

  useEffect(() => {
    if (mode !== "add" && mode !== "grade") return;
    let alive = true;
    setGrades(null);
    setGradesFailed(false);
    listStudentGradeChoices()
      .then((list) => {
        if (alive) setGrades(list);
      })
      .catch(() => {
        if (alive) setGradesFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    setError(null);
    setAck(false);
    // Every close/open starts a fresh request state. Without this, a successful
    // add (which unmounts the sheet body by setting mode=null) left `busy` true
    // and disabled every switch target the next time the sheet opened.
    setBusy(false);
    if (mode === "add") {
      setName("");
      setGradeId(null);
      setTrack(null);
      setChoices(g12ChoicesOf(undefined));
    } else if (mode === "grade") {
      setGradeId(active?.gradeId ?? null);
      setTrack(active?.track ?? null);
      setChoices(g12ChoicesOf(active));
    } else if (mode === "choices") {
      setChoices(g12ChoicesOf(active));
    }
  }, [
    mode,
    active?.id,
    active?.displayName,
    active?.gradeId,
    active?.track,
    active?.studyLanguage,
    active?.firstForeignLanguage,
    active?.secondForeignLanguage,
    active?.religion,
  ]);

  // PHASE 185 — tracks are a property of the chosen grade. Until the server
  // answers, we neither guess nor let the parent save a half-formed choice.
  useEffect(() => {
    if (mode !== "add" && mode !== "grade") return;
    if (!gradeId) {
      setTracks([]);
      setTracksLoading(false);
      setTracksFor(null);
      return;
    }
    let alive = true;
    setTracksLoading(true);
    listTracks(gradeId)
      .then((list) => {
        if (!alive) return;
        setTracks(list);
        setTrack((current) => {
          if (current && list.some((option) => option.code === current)) return current;
          return list.length === 1 ? list[0]!.code : null;
        });
        setTracksFor(gradeId);
      })
      .catch(() => {
        if (!alive) return;
        setTracks([]);
        setTrack(null);
        setTracksFor(gradeId);
      })
      .finally(() => {
        if (alive) setTracksLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [mode, gradeId]);

  const selectedGrade = grades?.find((grade) => grade.id === gradeId) ?? null;
  const isG12 = isG12Grade(
    selectedGrade?.code ?? (mode === "choices" ? active?.gradeCode : null),
  );
  const choicesReady = !isG12 || Boolean(choices.religion);
  const choicesChanged =
    Boolean(active) &&
    (active?.studyLanguage !== choices.studyLanguage ||
      active?.firstForeignLanguage !== choices.firstForeignLanguage ||
      active?.secondForeignLanguage !== choices.secondForeignLanguage ||
      active?.religion !== choices.religion);
  const trackReady =
    Boolean(gradeId) && tracksFor === gradeId && !tracksLoading && (tracks.length === 0 || Boolean(track));
  const selectionChanged =
    Boolean(active) && (gradeId !== active?.gradeId || (track ?? null) !== (active?.track ?? null));

  const switchTo = async (id: string) => {
    if (busy || id === active?.id) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(await activateStudent(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر اختيار الطالب");
      setBusy(false);
    }
  };

  const add = async () => {
    if (busy || name.trim().length < 2 || !gradeId || !trackReady || !choicesReady) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(
        await createStudent({
          displayName: name.trim(),
          gradeId,
          ...(track ? { track } : {}),
          ...(isG12 ? choices : {}),
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إضافة الطالب");
      setBusy(false);
    }
  };

  const changeGrade = async () => {
    if (busy || !active || !gradeId || !selectionChanged || !ack || !trackReady || !choicesReady) return;
    setBusy(true);
    setError(null);
    try {
      const result = await changeStudentGrade(
        active.id,
        gradeId,
        track ?? undefined,
        isG12 ? choices : undefined,
      );
      onChanged(result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تغيير المنهج");
      setBusy(false);
    }
  };

  const saveChoices = async () => {
    if (busy || !active || !isG12 || !choicesReady || !choicesChanged) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(await updateStudentChoices(active.id, choices));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ الاختيارات");
      setBusy(false);
    }
  };

  if (!mode) return null;

  return (
    <Sheet open onClose={onClose} title={TITLES[mode]} className="sm-sheet">
      {mode === "add" && (
        <label className="sm-field">
          <span>اسم الطالب</span>
          <input
            data-testid="student-add-name"
            value={name}
            maxLength={80}
            placeholder="اكتب اسم الطالب"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      )}

      {mode === "grade" && (
        <p className="sm-lead">
          الطالب: <b>{active?.displayName}</b> — الاسم لا يتغيّر من هنا.
        </p>
      )}

      {mode === "choices" && (
        <p className="sm-lead">
          الطالب: <b>{active?.displayName}</b> — غيّر نسخ الكتب التي يدرسها. تقدّمه الحالي يبقى محفوظًا،
          وإذا عدت إلى نسخة سابقة وجدت تقدّمها كما هو.
        </p>
      )}

      {mode === "switch" && (
        <div className="sm-list" data-testid="student-switch-list">
          <p className="sm-lead">كل طالب له صفّه وخطته وتقدّمه وسجلّه المستقل. اختر من تدرّس الآن.</p>
          {students.map((student) => {
            const isActive = student.id === active?.id;
            return (
              <button
                key={student.id}
                type="button"
                className={isActive ? "sm-student sm-student--on" : "sm-student"}
                data-testid={`student-choice-${student.id}`}
                disabled={busy || isActive}
                onClick={() => void switchTo(student.id)}
              >
                <span className="sm-student__avatar" aria-hidden="true">
                  {student.displayName.trim().charAt(0) || "ط"}
                </span>
                <span className="sm-student__who">
                  <strong>{student.displayName}</strong>
                  <span>
                    {student.gradeNameAr ?? "لم يُحدّد الصف"}
                    {student.trackNameAr ? ` — ${student.trackNameAr}` : ""}
                  </span>
                </span>
                <span className="sm-student__state">{isActive ? "تدرّس الآن" : busy ? "…" : "دراسة"}</span>
              </button>
            );
          })}
          {active?.gradeCode === "grade-12" && (
            <Button
              variant="ghost"
              block
              data-testid="student-edit-choices"
              onClick={() => onModeChange("choices")}
            >
              تعديل اختيارات اللغة والتربية الدينية
            </Button>
          )}
          <Button variant="ghost" block data-testid="student-add" onClick={() => onModeChange("add")}>
            + إضافة طالب آخر
          </Button>
        </div>
      )}

      {(mode === "add" || mode === "grade") && (
        <>
          <p className="sm-label">الصف والمنهج</p>
          {grades === null && !gradesFailed && <p className="sm-muted">جارٍ تحميل الصفوف…</p>}
          {gradesFailed && <p className="sm-error">تعذّر تحميل الصفوف — حاول مرة أخرى.</p>}
          {grades !== null && (
            <div className="sm-grades">
              {grades.map((grade) => (
                <button
                  key={grade.id}
                  type="button"
                  className={gradeId === grade.id ? "sm-grade sm-grade--on" : "sm-grade"}
                  data-testid={`student-grade-${grade.id}`}
                  aria-pressed={gradeId === grade.id}
                  onClick={() => {
                    setGradeId(grade.id);
                    setError(null);
                  }}
                >
                  {grade.nameAr}
                </button>
              ))}
            </div>
          )}

          {tracksLoading && <p className="sm-muted">جارٍ تحضير المسارات…</p>}
          {tracks.length > 0 && (
            <div className="sm-tracks" data-testid="student-tracks">
              <p className="sm-label">المسار الدراسي</p>
              <div className="sm-grades">
                {tracks.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={track === option.code ? "sm-grade sm-grade--on" : "sm-grade"}
                    data-testid={`student-track-${option.code}`}
                    aria-pressed={track === option.code}
                    onClick={() => setTrack(option.code)}
                  >
                    {option.nameAr}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isG12 && mode !== "switch" && (
        <G12ChoiceFields
          choices={choices}
          onChange={(patch) => setChoices((current) => ({ ...current, ...patch }))}
          testIdPrefix="student"
        />
      )}

      {error && (
        <p className="sm-error" role="alert" data-testid="student-manager-error">
          {error}
        </p>
      )}

      {mode === "add" && (
        <Button
          block
          disabled={busy || name.trim().length < 2 || !gradeId || !trackReady || !choicesReady}
          data-testid="student-add-submit"
          onClick={() => void add()}
        >
          {busy ? "جارٍ الإضافة…" : "أضف الطالب وابدأ معه"}
        </Button>
      )}

      {mode === "choices" && (
        <Button
          block
          disabled={busy || !choicesReady || !choicesChanged}
          data-testid="student-choices-save"
          onClick={() => void saveChoices()}
        >
          {busy ? "جارٍ الحفظ…" : "حفظ الاختيارات"}
        </Button>
      )}

      {mode === "grade" && (
        <div className="sm-danger" data-testid="student-grade-warning">
          <strong>تنبيه قبل الحفظ</strong>
          <p>
            تغيير منهج هذا الطالب سيمسح نهائيًا <b>كل جلساته وإحصائياته وخطته التعليمية وإنجازاته</b>. لا يمكن التراجع. يبقى
            اسمه وكود ولي الأمر واشتراكه فقط.
          </p>
          <label className="sm-check">
            <input
              type="checkbox"
              data-testid="student-grade-ack"
              checked={ack}
              onChange={(event) => setAck(event.target.checked)}
            />
            <span>أفهم أن بيانات هذا الطالب التعليمية ستُمسح.</span>
          </label>
          <Button
            block
            disabled={busy || !ack || !gradeId || !selectionChanged || !trackReady || !choicesReady}
            data-testid="student-grade-confirm"
            onClick={() => void changeGrade()}
          >
            {busy ? "جارٍ المسح والتحويل…" : "أكّد تغيير المنهج ومسح البيانات"}
          </Button>
        </div>
      )}

      {mode === "switch" && (
        <Button block variant="primary" data-testid="student-change-grade" onClick={() => onModeChange("grade")}>
          تغيير منهج الطالب الحالي
        </Button>
      )}
    </Sheet>
  );
}
