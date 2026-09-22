import { useState } from "react";
import { login, register, ApiError, type User } from "./api.js";

interface Props {
  onAuthed: (user: User) => void;
}

export function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = mode === "login" ? await login(email.trim(), password) : await register(email.trim(), password, displayName.trim());
      onAuthed(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="brand">
        <div className="brand-mark">الف</div>
        <h1>المعلم الفاروق</h1>
        <p className="muted">معلمك الخصوصي الذكي — يشرح دروسك بالمنهج المدرسي خطوة بخطوة</p>
      </div>

      <form className="card auth-card" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}>
            تسجيل الدخول
          </button>
          <button type="button" className={mode === "register" ? "tab active" : "tab"} onClick={() => setMode("register")}>
            حساب جديد
          </button>
        </div>

        {mode === "register" && (
          <label className="field">
            <span>الاسم</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} maxLength={80} placeholder="مثال: أحمد محمد" />
          </label>
        )}

        <label className="field">
          <span>البريد الإلكتروني</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" dir="ltr" />
        </label>

        <label className="field">
          <span>كلمة المرور</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="٨ أحرف على الأقل" />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button className="btn primary block" disabled={busy}>
          {busy ? "…جارِ التنفيذ" : mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>

        <p className="hint muted">بياناتك محمية، والجلسات مشفّرة ومنفصلة بين الطلاب.</p>
      </form>
    </div>
  );
}