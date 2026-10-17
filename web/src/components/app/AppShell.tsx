import { useState, type ReactNode } from "react";
import { Button, Sheet, ThemeToggle } from "../ui/index.js";
import { useInstallOffer } from "../../pwa/install.js";
import { useLiveTeacherPref, writeLiveTeacherPref } from "../../liveTeacherPref.js";
import type { User } from "../../api.js";

/** مساحات الطالب الثلاث — السؤال الذي تجيب كل مساحة عنه. */
export type StudentTab = "today" | "learn" | "journey";

interface Props {
  user: User;
  /** المساحة المفتوحة الآن (تُبرز تبويبها في التنقّل) — للطلاب فقط. */
  active?: StudentTab;
  onNavigate?: (tab: StudentTab) => void;
  onLogout: () => void;
  onOpenAchievements?: () => void;
  children: ReactNode;
}

/**
 * القشرة الموحّدة (PHASE 158) — ترويسة واحدة ودرج حساب واحد وتنقّل واحد
 * للمساحات الثلاث (اليوم · تعلّم · رحلتي)، بدل ترويسات مكرّرة في كل شاشة.
 *
 * التنقّل: جوال ← شريط سفلي ثابت (إبهام أولًا) · سطح مكتب ← شريط علوي لاصق
 * تحت الترويسة. عنصر واحد لكل testid — لا نسخ.
 *
 * PHASE 163 — تُستخدم أيضًا لـ«مركز ولي الأمر»: بلا تنقّل سفلي وبلا صف
 * «المعلّم الحيّ» — تلك تفضيلات الطالب وحده.
 *
 * العقود كما في الرئيسية 2.0 حرفيًا: `account-menu` · `open-achievements` ·
 * `account-close` · `parent-link-card` · `link-code-value` ·
 * `account-theme-toggle` · `logout` — أما `theme-toggle` فمبدّل الترويسة.
 */
export function AppShell({ user, active, onNavigate, onLogout, onOpenAchievements, children }: Props) {
  const [accountOpen, setAccountOpen] = useState(false);
  const studentName = user.student?.displayName ?? user.email;
  const isStudent = user.role === "student";
  // PHASE 162 (W7.5) — قرار «المعلّم الحيّ» يُقرأ هنا ويُقلب فورًا: الغرفة
  // المفتوحة تتلقى التغيير في نفس اللحظة (اشتراك محلي واحد).
  const liveTeacherOn = useLiveTeacherPref();
  // PHASE 165 (W8) — التثبيت يُعرض حين يعرضه المتصفح وحده (أو تلميح iOS).
  const install = useInstallOffer();

  return (
    <div className="app-shell">
      <div className="app-head">
        <header className="app-bar">
          <div className="app-bar__inner">
            {/* ☰ في البداية (يمين الشاشة في RTL) — والدرج ينزلق من اليمين. */}
            <button
              type="button"
              className="app-iconbtn"
              data-testid="account-menu"
              onClick={() => setAccountOpen(true)}
              aria-label="الحساب والقائمة"
              title="الحساب والقائمة"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </button>
            <span className="app-bar__mark" aria-hidden="true">
              ف
            </span>
            <div className="app-bar__text">
              <strong>سلاح الفرعون</strong>
              <span>معلمك الخصوصي الذكي</span>
            </div>
            {isStudent && onOpenAchievements && (
              <button
                type="button"
                className="app-iconbtn"
                data-testid="open-achievements"
                onClick={onOpenAchievements}
                aria-label="إنجازاتي"
                title="إنجازاتي"
              >
                🏆
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {isStudent && (
          <nav className="app-nav" aria-label="مساحات التعلّم">
            <button
              type="button"
              className={active === "today" ? "app-nav__tab app-nav__tab--on" : "app-nav__tab"}
              data-testid="nav-today"
              aria-current={active === "today" ? "page" : undefined}
              onClick={() => onNavigate?.("today")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 10.2L12 4.5l7 5.7" />
                <path d="M6.5 9.4V19a1 1 0 001 1h9a1 1 0 001-1V9.4" />
              </svg>
              <span>اليوم</span>
            </button>
            <button
              type="button"
              className={active === "learn" ? "app-nav__tab app-nav__tab--on" : "app-nav__tab"}
              data-testid="nav-learn"
              aria-current={active === "learn" ? "page" : undefined}
              onClick={() => onNavigate?.("learn")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 6.4C10.5 5 8.6 4.5 6.2 4.5H4.5v12.6h1.7c2.4 0 4.3.5 5.8 1.9 1.5-1.4 3.4-1.9 5.8-1.9h1.7V4.5h-1.7c-2.4 0-4.3.5-5.8 1.9z" />
                <path d="M12 6.4v12.6" />
              </svg>
              <span>تعلّم</span>
            </button>
            <button
              type="button"
              className={active === "journey" ? "app-nav__tab app-nav__tab--on" : "app-nav__tab"}
              data-testid="nav-journey"
              aria-current={active === "journey" ? "page" : undefined}
              onClick={() => onNavigate?.("journey")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 21V4" />
                <path d="M6 4.5h11.5l-2.8 3.9 2.8 3.9H6" />
              </svg>
              <span>رحلتي</span>
            </button>
          </nav>
        )}
      </div>

      <div className="app-content">{children}</div>

      {/* درج الحساب ☰ — كود ولي الأمر · التفضيلات · الخروج */}
      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} className="app-drawer">
        <div className="app-drawer__head">
          <span className="app-drawer__avatar" aria-hidden="true">
            {studentName.trim().charAt(0) || "ط"}
          </span>
          <div className="app-drawer__who">
            <strong>{studentName}</strong>
            <span>{user.email}</span>
          </div>
          <button type="button" className="app-iconbtn" data-testid="account-close" onClick={() => setAccountOpen(false)} aria-label="إغلاق القائمة">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="app-drawer__body">
          {user.linkCode && (
            <>
              <div className="app-drawer__sec">حسابي</div>
              <div className="app-drawer__row app-drawer__row--stack" data-testid="parent-link-card">
                <span className="app-drawer__line">
                  <span className="app-drawer__k">كود ولي الأمر</span>
                  <code className="app-code" data-testid="link-code-value">
                    {user.linkCode}
                  </code>
                </span>
                <span className="app-drawer__meta">شاركه مع ولي أمرك ليطّلع على تقدّمك وجلساتك (قراءة فقط).</span>
              </div>
            </>
          )}

          <div className="app-drawer__sec">التفضيلات</div>
          <div className="app-drawer__row">
            <span className="app-drawer__k">المظهر</span>
            <ThemeToggle testId="account-theme-toggle" />
          </div>
          <div className="app-drawer__row">
            <span className="app-drawer__k">اللغة</span>
            <span>العربية</span>
          </div>
          {install.kind === "button" && (
            <div className="app-drawer__row">
              <span className="app-drawer__k">ثبّت التطبيق</span>
              <Button size="sm" data-testid="install-app" onClick={() => void install.install()}>
                تثبيت
              </Button>
            </div>
          )}
          {install.kind === "ios-hint" && (
            <div className="app-drawer__row app-drawer__row--stack" data-testid="install-ios-hint">
              <span className="app-drawer__k">ثبّت التطبيق</span>
              <span className="app-drawer__meta">
                من سفاري: زر المشاركة ← «إضافة إلى الشاشة الرئيسية» — فيفتح كتطبيق بلا متجر.
              </span>
            </div>
          )}
          {isStudent && (
            <div className="app-drawer__row">
              <span className="app-drawer__k">المعلّم الحيّ</span>
              <button
                type="button"
                role="switch"
                aria-checked={liveTeacherOn}
                className="w7-switch"
                data-testid="live-teacher-toggle"
                data-on={liveTeacherOn ? "1" : "0"}
                aria-label={liveTeacherOn ? "إطفاء المعلّم الحيّ" : "تشغيل المعلّم الحيّ"}
                onClick={() => writeLiveTeacherPref(!liveTeacherOn)}
              >
                <span className="w7-switch__thumb" aria-hidden="true" />
                <span className="w7-switch__state">{liveTeacherOn ? "مفعّل" : "مطفأ"}</span>
              </button>
            </div>
          )}

          <div className="app-drawer__sec">الجلسة</div>
          <button type="button" className="app-drawer__link app-drawer__link--danger" data-testid="logout" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" />
              <path d="M15 8l4 4-4 4M19 12H9" />
            </svg>
            خروج
          </button>
        </div>
      </Sheet>
    </div>
  );
}
