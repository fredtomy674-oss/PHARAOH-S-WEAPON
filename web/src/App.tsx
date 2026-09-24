import { useEffect, useState } from "react";
import { whoami, logout, type User, type LearningSession } from "./api.js";
import { AuthScreen } from "./Auth.js";
import { HomeScreen } from "./Home.js";
import { OnboardingScreen } from "./Onboarding.js";
import { ChatScreen } from "./Chat.js";
import { AdminScreen } from "./Admin.js";
import { ParentScreen } from "./Parent.js";
import { AchievementsScreen } from "./Achievements.js";

type Screen = "loading" | "auth" | "home" | "onboarding" | "chat" | "admin" | "achievements";

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

  const handleAuthed = (u: User) => {
    setUser(u);
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
    return <ChatScreen user={user} session={session} onEnded={handleSessionEnded} />;
  }

  if (screen === "onboarding") {
    return <OnboardingScreen user={user} onStarted={handleSessionStarted} onBack={() => setScreen("home")} />;
  }

  if (screen === "admin" && user.role === "admin") {
    return <AdminScreen user={user} onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  if (screen === "achievements" && user.role === "student") {
    return <AchievementsScreen user={user} onBack={() => setScreen("home")} />;
  }

  if (user.role === "parent") {
    return <ParentScreen user={user} onLogout={handleLogout} />;
  }

  return (
    <HomeScreen
      user={user}
      onStartLesson={() => setScreen("onboarding")}
      onResume={(s) => {
        setSession(s);
        setScreen("chat");
      }}
      onLogout={handleLogout}
      onOpenAdmin={() => setScreen("admin")}
      onOpenAchievements={() => setScreen("achievements")}
    />
  );
}