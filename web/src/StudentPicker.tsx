import { useState } from "react";
import { ApiError, activateStudent, type StudentSummary, type User } from "./api.js";
import { Button } from "./components/ui/index.js";
import { ThemeToggle } from "./components/ui/ThemeToggle.js";

interface PickerProps {
  user: User;
  onUser: (user: User) => void;
  onLogout: () => void;
}

/**
 * PHASE 180 — a family account with more than one child starts here. The
 * choice is stored on this login session only, so another device can teach a
 * different child at the same time.
 */
export function StudentPickerScreen({ user, onUser, onLogout }: PickerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const students = user.students ?? [];

  const choose = async (student: StudentSummary) => {
    if (busyId) return;
    setBusyId(student.id);
    setError(null);
    try {
      onUser(await activateStudent(student.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر اختيار الطالب — حاول مرة أخرى");
      setBusyId(null);
    }
  };

  return (
    <div className="sg-wrap" data-testid="student-picker">
      <header className="sg-top">
        <div className="sg-brand">
          <span className="sg-mark" aria-hidden="true">
            ف
          </span>
          <div>
            <strong>سلاح الفرعون</strong>
            <span>من عائلة الفاروق AI</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="sg-main">
        <span className="sg-kicker">أهلاً بعودتك</span>
        <h1>مَن تدرّس الآن؟</h1>
        <p className="sg-lead">لكل طالبٍ صفّه وخطته وتقدّمه وسجلّه المستقل. اختر الطالب الذي ستفتح له التطبيق الآن.</p>

        <div className="sg-list" data-testid="student-pick-list">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              className="sg-student"
              data-testid={`student-pick-${student.id}`}
              disabled={busyId !== null}
              onClick={() => void choose(student)}
            >
              <span className="sg-avatar" aria-hidden="true">
                {student.displayName.trim().charAt(0) || "ط"}
              </span>
              <span className="sg-who">
                <strong>{student.displayName}</strong>
                <span>{student.gradeNameAr ?? "لم يُحدّد الصف بعد"}</span>
              </span>
              <span className="sg-go">{busyId === student.id ? "…" : "ابدأ"}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="sg-error" role="alert" data-testid="student-picker-error">
            {error}
          </p>
        )}

        <p className="sg-note">تريد إضافة طالب آخر؟ اختر طالبًا أولًا ثم افتح قائمة الحساب ☰ ← «إضافة طالب».</p>
        <Button variant="quiet" size="sm" onClick={onLogout}>
          تسجيل الخروج
        </Button>
      </main>
    </div>
  );
}
