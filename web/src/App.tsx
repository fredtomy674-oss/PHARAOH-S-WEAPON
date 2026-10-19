import { useEffect, useState } from "react";
import { whoami, logout, type User, type LearningSession } from "./api.js";
import { AuthScreen } from "./Auth.js";
import { HomeScreen } from "./Home.js";
import { LearnScreen } from "./Learn.js";
import { LessonPage } from "./LessonPage.js";
import { LessonRoom } from "./LessonRoom.js";
import { AdminScreen } from "./Admin.js";
import { ParentScreen } from "./Parent.js";
import { JourneyScreen } from "./Journey.js";
import { FirstRunScreen } from "./FirstRun.js";
import { StudentPickerScreen } from "./StudentPicker.js";
import { AppShell, type StudentTab } from "./components/app/AppShell.js";

type Screen = "loading" | "auth" | "home" | "learn" | "lesson" | "chat" | "admin" | "achievements";

export function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<LearningSession | null>(null);
  /** PHASE 159 — الدرس المفتوح في صفحة الدرس (الطبقة بين «تعلّم» والغرفة). */
  const [lessonId, setLessonId] = useState("");
  /** PHASE 178 — مادةٌ قادمة من الرئيسية تُحدَّد مسبقًا في «تعلّم» (فتح مباشر). */
  const [learnSubjectId, setLearnSubjectId] = useState("");

  useEffect(() => {
    whoami()
      .then((u) => {
        setUser(u);
        setScreen("home");
      })
      .catch(() => setScreen("auth"));
  }, []);

  const handleAuthed = (u: User) => {
    setUser(u);
    // PHASE 180 — the gate below decides: pick a child first, or finish that
    // child's name + grade. A complete profile lands on Home.
    setScreen("home");
  };

  /** Switch/add/reset done in the shell: a clean, remounted student scope. */
  const handleStudentChanged = (u: User) => {
    setUser(u);
    setSession(null);
    setLearnSubjectId("");
    setLessonId("");
    setScreen("home");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // session may already be gone — ignore
    }
    localStorage.removeItem("alfarouq_csrf");
    setUser(null);
    setSession(null);
    setScreen("auth");
  };

  const handleSessionStarted = (s: LearningSession) => {
    setSession(s);
    setScreen("chat");
  };

  const handleSessionEnded = () => {
    setSession(null);
    setScreen("home");
  };

  /** PHASE 158 — تنقّل المساحات الثلاث: اليوم · تعلّم · رحلتي. */
  const handleNavigate = (tab: StudentTab) => {
    if (tab === "today") setScreen("home");
    else if (tab === "learn") {
      // PHASE 178 — التنقّل العام يفتح المادة الأخيرة لا مادةً معلّقة من الرئيسية.
      setLearnSubjectId("");
      setScreen("learn");
    } else setScreen("achievements");
  };

  /** PHASE 178 — «رياضيات» من الرئيسية = «تعلّم» ومادتها محدّدة، بلمسة واحدة. */
  const handleOpenSubject = (subjectId: string) => {
    setLearnSubjectId(subjectId);
    setScreen("learn");
  };

  const handleStartLesson = () => {
    setLearnSubjectId("");
    setScreen("learn");
  };

  /** PHASE 159 — فتح صفحة درس من منتقي «تعلّم» أو من بطاقة «آخر درس». */
  const handleOpenLesson = (id: string) => {
    setLessonId(id);
    setScreen("lesson");
  };

  if (screen === "loading") {
    return (
      <div className="center-screen">
        <p className="muted">جارِ التحميل…</p>
      </div>
    );
  }

  if (screen === "auth" || !user) {
    return <AuthScreen onAuthed={handleAuthed} />;
  }

  // PHASE 180 — the student gate: a family account picks a child, and a child
  // with no grade completes name + grade before any student route is mounted.
  if (user.role === "student") {
    if (!user.student && (user.students?.length ?? 0) > 0) {
      return <StudentPickerScreen user={user} onUser={handleAuthed} onLogout={handleLogout} />;
    }
    if (!user.student || !user.student.gradeId) {
      return (
        <FirstRunScreen
          user={user}
          onStart={(u) => {
            setUser(u);
            setScreen("learn");
          }}
          onSkip={(u) => {
            setUser(u);
            setScreen("home");
          }}
        />
      );
    }
  }

  if (screen === "chat" && session) {
    return <LessonRoom user={user} session={session} onEnded={handleSessionEnded} />;
  }

  if (screen === "learn") {
    return (
      <AppShell
        user={user}
        active="learn"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenAchievements={() => setScreen("achievements")}
        onStudentChanged={handleStudentChanged}
      >
        <LearnScreen
          key={`learn-${user.student?.id ?? "none"}-${user.student?.gradeId ?? "none"}`}
          user={user}
          initialSubjectId={learnSubjectId}
          onResume={(s) => {
            setSession(s);
            setScreen("chat");
          }}
          onOpenLesson={handleOpenLesson}
        />
      </AppShell>
    );
  }

  if (screen === "lesson" && lessonId) {
    return (
      <AppShell
        user={user}
        active="learn"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenAchievements={() => setScreen("achievements")}
        onStudentChanged={handleStudentChanged}
      >
        <LessonPage lessonId={lessonId} onBack={() => setScreen("learn")} onStarted={handleSessionStarted} />
      </AppShell>
    );
  }

  if (screen === "admin" && user.role === "admin") {
    // PHASE 164 — غرفة العمليات تحت القشرة الموحّدة (ترويسة + درج حساب:
    // المظهر والخروج)، بلا شريط تنقّل طلابي — كمركز ولي الأمر (PHASE 163).
    return (
      <AppShell user={user} onLogout={handleLogout}>
        <AdminScreen onBack={() => setScreen("home")} />
      </AppShell>
    );
  }

  if (screen === "achievements" && user.role === "student") {
    return (
      <AppShell
        user={user}
        active="journey"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenAchievements={() => setScreen("achievements")}
        onStudentChanged={handleStudentChanged}
      >
        <JourneyScreen key={`journey-${user.student?.id ?? "none"}`} user={user} onBack={() => setScreen("home")} />
      </AppShell>
    );
  }

  if (user.role === "parent") {
    // PHASE 163 (W9) — مركز ولي الأمر تحت القشرة الموحّدة (ترويسة + درج حساب:
    // المظهر والخروج)، بلا شريط تنقّل طلابي.
    return (
      <AppShell user={user} onLogout={handleLogout}>
        <ParentScreen user={user} />
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      active="today"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onOpenAchievements={() => setScreen("achievements")}
      onStudentChanged={handleStudentChanged}
    >
      <HomeScreen
        key={`home-${user.student?.id ?? "none"}-${user.student?.gradeId ?? "none"}`}
        user={user}
        onStartLesson={handleStartLesson}
        onOpenSubject={handleOpenSubject}
        onResume={(s) => {
          setSession(s);
          setScreen("chat");
        }}
        onOpenAdmin={() => setScreen("admin")}
      />
    </AppShell>
  );
}