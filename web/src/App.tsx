import { useEffect, useState } from "react";
import { whoami, logout, type User, type LearningSession } from "./api.js";
import { AuthScreen } from "./Auth.js";
import { HomeScreen } from "./Home.js";
import { OnboardingScreen } from "./Onboarding.js";
import { LessonRoom } from "./LessonRoom.js";
import { AdminScreen } from "./Admin.js";
import { ParentScreen } from "./Parent.js";
import { AchievementsScreen } from "./Achievements.js";
import { FirstRunScreen } from "./FirstRun.js";
import { AppShell, type StudentTab } from "./components/app/AppShell.js";

type Screen = "loading" | "auth" | "home" | "onboarding" | "chat" | "admin" | "achievements" | "first-run";

export function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<LearningSession | null>(null);

  useEffect(() => {
    whoami()
      .then((u) => {
        setUser(u);
        setScreen("home");
      })
      .catch(() => setScreen("auth"));
  }, []);

  const handleAuthed = (u: User, fresh = false) => {
    setUser(u);
    // PHASE 157 — «أول دخول سينمائي»: مرة واحدة فقط، وبعد التسجيل فقط،
    // ولطالب لم يُختر له صفّ بعد. تسجيل الدخول العادي لا يمر من هنا أبدًا.
    if (fresh && u.role === "student" && !u.student?.gradeId) {
      setScreen("first-run");
      return;
    }
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
    else if (tab === "learn") setScreen("onboarding");
    else setScreen("achievements");
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

  if (screen === "chat" && session) {
    return <LessonRoom user={user} session={session} onEnded={handleSessionEnded} />;
  }

  if (screen === "first-run" && user.role === "student") {
    return (
      <FirstRunScreen
        user={user}
        onStart={(u) => {
          setUser(u);
          setScreen("onboarding");
        }}
        onSkip={(u) => {
          setUser(u);
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "onboarding") {
    return (
      <AppShell
        user={user}
        active="learn"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenAchievements={() => setScreen("achievements")}
      >
        <OnboardingScreen user={user} onStarted={handleSessionStarted} />
      </AppShell>
    );
  }

  if (screen === "admin" && user.role === "admin") {
    return <AdminScreen user={user} onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  if (screen === "achievements" && user.role === "student") {
    return (
      <AppShell
        user={user}
        active="journey"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenAchievements={() => setScreen("achievements")}
      >
        <AchievementsScreen user={user} onBack={() => setScreen("home")} />
      </AppShell>
    );
  }

  if (user.role === "parent") {
    return <ParentScreen user={user} onLogout={handleLogout} />;
  }

  return (
    <AppShell
      user={user}
      active="today"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onOpenAchievements={() => setScreen("achievements")}
    >
      <HomeScreen
        user={user}
        onStartLesson={() => setScreen("onboarding")}
        onResume={(s) => {
          setSession(s);
          setScreen("chat");
        }}
        onOpenAdmin={() => setScreen("admin")}
      />
    </AppShell>
  );
}