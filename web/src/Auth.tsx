import { useState } from "react";
import { login, register, ApiError, type User } from "./api.js";
import { ThemeToggle } from "./components/ui/ThemeToggle.js";

interface Props {
  /** PHASE 180 — the shell gate handles first-run (name + grade) itself. */
  onAuthed: (user: User) => void;
}

/**
 * الافتتاح (Auth 2.0) — أول انطباع بهوية الفاروق الكاملة.
 * العقود محفوظة حرفيًا (auth.spec): كل الـtestids، والنصوص الملصقة للحقول،
 * وترتيب Tab (البريد ← كلمة المرور)، وEnter يُرسل، وdir=rtl/lang=ar من الشل.
 */
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
      const user =
        mode === "login" ? await login(email.trim(), password) : await register(email.trim(), password, displayName.trim());
      onAuthed(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="au-wrap">
      <header className="au-top">
        <div className="au-brand">
          <span className="au-mark" aria-hidden="true">
            ف
          </span>
          <div className="au-brandtext">
            <strong>سلاح الفرعون</strong>
            <span>من عائلة الفاروق AI</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="au-main">
        <section className="au-hero">
          <h1>
            معلّمك الخصوصي <em>الذكي</em>
          </h1>
          <p className="au-lede">
            يعرف كتابك صفحةً صفحة، ويفهم أين تعثّرت، ويشرح لك على السبورة خطوة بخطوة — بالفهم لا بالحفظ.
          </p>
          <ul className="au-points">
            <li>
              <span aria-hidden="true">🖍️</span> سبورة معلّم حقيقية — يشرح ويرسم معك على صفحة درسك
            </li>
            <li>
              <span aria-hidden="true">🔊</span> كل شرح يمكن سماعه بصوت حقيقي، في أي وقت
            </li>
            <li>
              <span aria-hidden="true">🔒</span> جلساتك منفصلة ومحمية — ولا يطّلع على محادثاتك أحد
            </li>
          </ul>
          <p className="au-free">أول حصة كاملة مجانية — بلا بطاقة، وبلا التزام.</p>
        </section>

        <form className="au-card" onSubmit={submit}>
          <div className="au-tabs">
            <button
              type="button"
              data-testid="tab-login"
              className={mode === "login" ? "au-tab au-tab--on" : "au-tab"}
              onClick={() => setMode("login")}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              data-testid="tab-register"
              className={mode === "register" ? "au-tab au-tab--on" : "au-tab"}
              onClick={() => setMode("register")}
            >
              حساب جديد
            </button>
          </div>

          {mode === "register" && (
            <label className="au-field">
              <span className="au-label">الاسم</span>
              <input
                className="au-input"
                data-testid="input-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="مثال: أحمد محمد"
              />
            </label>
          )}

          <label className="au-field">
            <span className="au-label">البريد الإلكتروني</span>
            <input
              className="au-input"
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              dir="ltr"
            />
          </label>

          <label className="au-field">
            <span className="au-label">كلمة المرور</span>
            <input
              className="au-input"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="٨ أحرف على الأقل"
            />
          </label>

          {error && (
            <p data-testid="auth-error" className="au-error" role="alert">
              {error}
            </p>
          )}

          <button data-testid="submit-auth" className="au-submit" disabled={busy}>
            {busy ? "…جارِ التنفيذ" : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>

          <p className="au-trust">
            <span aria-hidden="true">🛡️</span> بياناتك محمية · جلساتك منفصلة بين الطلاب · لا نبيع بياناتك أبدًا
          </p>
          {mode === "login" && (
            <p className="au-hint">ولي أمر؟ استخدم كود الربط الظاهر في حساب ابنك من درج الحساب ☰.</p>
          )}
        </form>
      </main>

      <footer className="au-foot">صُنع في مصر 🇪🇬 — بالمنهج الرسمي، وبمعلّم يفهمك.</footer>
    </div>
  );
}
