import { createContext, useContext, useEffect, useState } from "react";
import {
  ApiError,
  activateStudent,
  changeStudentGrade,
  createStudent,
  type Grade,
  type User,
} from "../../api.js";
import { listStudentGradeChoices } from "../../studentGrades.js";
import { Button, Sheet } from "../ui/index.js";

export type StudentManagerMode = "switch" | "add" | "grade";

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
};

export function StudentManagerSheet({ mode, user, onClose, onModeChange, onChanged }: SheetProps) {
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [gradesFailed, setGradesFailed] = useState(false);
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
    } else if (mode === "grade") {
      setGradeId(active?.gradeId ?? null);
    }
  }, [mode, active?.id, active?.displayName, active?.gradeId]);

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
    if (busy || name.trim().length < 2 || !gradeId) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(await createStudent({ displayName: name.trim(), gradeId }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إضافة الطالب");
      setBusy(false);
    }
  };

  const changeGrade = async () => {
    if (busy || !active || !gradeId || gradeId === active.gradeId || !ack) return;
    setBusy(true);
    setError(null);
    try {
      const result = await changeStudentGrade(active.id, gradeId);
      onChanged(result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تغيير المنهج");
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
                  <span>{student.gradeNameAr ?? "لم يُحدّد الصف"}</span>
                </span>
                <span className="sm-student__state">{isActive ? "تدرّس الآن" : busy ? "…" : "دراسة"}</span>
              </button>
            );
          })}
          <Button variant="ghost" block data-testid="student-add" onClick={() => onModeChange("add")}>
            + إضافة طالب آخر
          </Button>
        </div>
      )}

      {mode !== "switch" && (
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
                  onClick={() => setGradeId(grade.id)}
                >
                  {grade.nameAr}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="sm-error" role="alert" data-testid="student-manager-error">
          {error}
        </p>
      )}

      {mode === "add" && (
        <Button
          block
          disabled={busy || name.trim().length < 2 || !gradeId}
          data-testid="student-add-submit"
          onClick={() => void add()}
        >
          {busy ? "جارٍ الإضافة…" : "أضف الطالب وابدأ معه"}
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
            disabled={busy || !ack || !gradeId || gradeId === active?.gradeId}
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
