import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  IconTile,
  RingProgress,
  Sheet,
  StatTile,
  ThemeToggle,
} from "./components/ui/index.js";
import { useTheme, type ThemeChoice } from "./theme.js";

/* ------------------------------------------------------------------ */
/* قياس حيّ: كل الأرقام أدناه تُحسب من رموز الوضع المعروض الآن        */
/* ------------------------------------------------------------------ */

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(value: string): Rgba {
  const text = value.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const body = hex[1];
    return {
      r: parseInt(body.slice(0, 2), 16),
      g: parseInt(body.slice(2, 4), 16),
      b: parseInt(body.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgb = /rgba?\(([^)]+)\)/i.exec(text);
  if (rgb?.[1]) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0, a: parts[3] ?? 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  };
}

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Rgba): number {
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrastRatio(fg: string, bg: string, under: string): number {
  const card = parseColor(under);
  const back = parseColor(bg);
  const solidBack = back.a < 1 ? over(back, card) : back;
  const front = parseColor(fg);
  const solidFront = front.a < 1 ? over(front, solidBack) : front;
  const a = luminance(solidFront);
  const b = luminance(solidBack);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function verdict(ratio: number, need: number): { text: string; tone: "ok" | "warn" | "danger" } {
  if (ratio >= need) return { text: need >= 4.5 ? (ratio >= 7 ? "AAA" : "AA") : "مقبول", tone: "ok" };
  return { text: "دون الحد", tone: "danger" };
}

const TOKEN_KEYS = [
  "--bg",
  "--card",
  "--card-2",
  "--ink",
  "--muted",
  "--line",
  "--gold",
  "--gold-deep",
  "--gold-soft",
  "--primary-ink",
  "--on-primary",
  "--ok-bg",
  "--ok-fg",
  "--warn-fg",
  "--danger-fg",
  "--night",
  "--paper",
  "--sage",
] as const;

const SWATCHES: Array<{ key: string; label: string }> = [
  { key: "--bg", label: "خلفية الصفحة" },
  { key: "--card", label: "سطح البطاقة" },
  { key: "--card-2", label: "سطح ثانوي" },
  { key: "--ink", label: "الحبر (النص)" },
  { key: "--muted", label: "الهامش (ثانوي)" },
  { key: "--gold", label: "الذهبي الأساسي" },
  { key: "--gold-deep", label: "ذهبي عميق" },
  { key: "--gold-soft", label: "تظليل ذهبي" },
  { key: "--primary-ink", label: "نص ذهبي" },
  { key: "--on-primary", label: "نص فوق الذهبي" },
  { key: "--line", label: "الحدود" },
  { key: "--night", label: "ليل (ثابت)" },
];

export function StyleGuide() {
  const { mode, choice, setChoice } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fonts, setFonts] = useState<{
    uiLoaded: boolean;
    learnLoaded: boolean;
    uiWidth: number;
    learnWidth: number;
  } | null>(null);

  const tokens = useMemo(() => {
    const computed = getComputedStyle(document.documentElement);
    const map: Record<string, string> = {};
    for (const key of TOKEN_KEYS) map[key] = computed.getPropertyValue(key).trim();
    return map;
  }, [mode]);

  const pairs = useMemo(() => {
    const card = tokens["--card"] ?? tokens["--bg"] ?? "";
    return [
      { name: "الحبر على البطاقة", fg: tokens["--ink"] ?? "", bg: card, need: 4.5 },
      { name: "الهامش على البطاقة", fg: tokens["--muted"] ?? "", bg: card, need: 4.5 },
      { name: "نص ذهبي على البطاقة", fg: tokens["--primary-ink"] ?? "", bg: card, need: 4.5 },
      {
        name: "نص ذهبي على تظليل ذهبي",
        fg: tokens["--primary-ink"] ?? "",
        bg: tokens["--gold-soft"] ?? "",
        need: 4.5,
      },
      { name: "النص الداكن على الذهبي", fg: tokens["--on-primary"] ?? "", bg: tokens["--gold"] ?? "", need: 4.5 },
      { name: "الحبر على خلفية الصفحة", fg: tokens["--ink"] ?? "", bg: tokens["--bg"] ?? "", need: 4.5 },
      { name: "الذهب العميق على الخلفية (رسم)", fg: tokens["--gold-deep"] ?? "", bg: tokens["--bg"] ?? "", need: 3 },
      { name: "وسم النجاح", fg: tokens["--ok-fg"] ?? "", bg: tokens["--ok-bg"] ?? "", need: 4.5 },
    ].map((pair) => {
      const ratio = contrastRatio(pair.fg, pair.bg, card);
      return { ...pair, ratio, verdict: verdict(ratio, pair.need) };
    });
  }, [tokens]);

  useEffect(() => {
    let cancelled = false;
    const measure = (): void => {
      const probe = (family: string): number => {
        const el = document.createElement("span");
        el.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:32px;font-family:${family}`;
        el.textContent = "الترتيب لا يغيّر الناتج ٣ + ٥ = ٨";
        document.body.appendChild(el);
        const width = Math.round(el.getBoundingClientRect().width);
        el.remove();
        return width;
      };
      if (cancelled) return;
      setFonts({
        uiLoaded: document.fonts.check('16px "IBM Plex Sans Arabic"'),
        learnLoaded: document.fonts.check('16px "Cairo"'),
        uiWidth: probe('"IBM Plex Sans Arabic", monospace'),
        learnWidth: probe('"Cairo", monospace'),
      });
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(measure);
    } else {
      measure();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sg-wrap">
      <header className="sg-head">
        <div className="sg-head__titles">
          <h1>دليل الأنماط — سلاح الفرعون</h1>
          <p>
            صفحة داخلية (W0). كل الأرقام هنا تُقاس حيًّا من رموز الوضع المعروض — لا صور ولا CDN: خطوط
            OFL مستضافة ذاتيًا، وأشكال هندسية فقط.
          </p>
        </div>
        <div className="sg-seg" role="group" aria-label="اختيار المظهر">
          {(
            [
              ["light", "نهاري"],
              ["dark", "ليلي"],
              ["system", "حسب جهازي"],
            ] as Array<[ThemeChoice, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={choice === value}
              onClick={() => setChoice(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </header>

      <section className="sg-section">
        <h2>الهوية — رموز الوضع الحالي</h2>
        <p>
          الوضع المعروض الآن: <b>{mode === "dark" ? "ليلي" : "نهاري"}</b> · اختيار الطالب: <b>{choice}</b>.
          الذهبي هو الأساسي في الوضعين، وبلا أي لون خارج العائلة.
        </p>
        <div className="sg-swatches">
          {SWATCHES.map((swatch) => (
            <div className="sg-swatch" key={swatch.key}>
              <i style={{ background: tokens[swatch.key] }} />
              <span>
                <b>{swatch.label}</b>
                <span>{tokens[swatch.key] || "—"}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="sg-section">
        <h2>التباين — مقيس الآن (WCAG)</h2>
        <p>
          القاعدة: نص عادي ≥ ٤.٥:١ · رسم/عنصر واجهة ≥ ٣:١. الأرقام محسوبة في المتصفح من قيم الرموز
          الفعلية بعد تفعيل الوضع.
        </p>
        <table className="sg-table">
          <thead>
            <tr>
              <th>الزوج</th>
              <th>النسبة</th>
              <th>الحد المطلوب</th>
              <th>الحكم</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <tr key={pair.name}>
                <td>{pair.name}</td>
                <td>
                  <span className="sg-ratio">{pair.ratio.toFixed(2)}:1</span>
                </td>
                <td>
                  <span className="sg-ratio">{pair.need.toFixed(1)}:1</span>
                </td>
                <td>
                  <Badge tone={pair.verdict.tone}>{pair.verdict.text}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="sg-section">
        <h2>الخطوط — طبقتان</h2>
        <p>
          الواجهة: <b>IBM Plex Sans Arabic</b> · المحتوى التعليمي: <b>Cairo</b> (مصري · OFL). قياس
          فعلي: تحميل الخط + عرض سطر مرجعي بالبكسل.
        </p>
        <div className="sg-type">
          <div className="sg-type__row">
            <span className="sg-type__tag">font-ui · 400/600/700</span>
            <span className="sg-ui" style={{ fontSize: 22, fontWeight: 700 }}>
              خواص الجمع — الصف السادس الابتدائي
            </span>
          </div>
          <div className="sg-type__row">
            <span className="sg-type__tag">font-learn · 500</span>
            <span className="sg-learn" style={{ fontSize: 20, fontWeight: 500 }}>
              الترتيب لا يغيّر ناتج الجمع: ٣ + ٥ = ٥ + ٣
            </span>
          </div>
          <div className="sg-type__row">
            <span className="sg-type__tag">font-latin · Space Grotesk</span>
            <span style={{ fontFamily: "var(--font-latin)", fontSize: 18 }}>
              Pharaoh&apos;s Weapon — Al Farouq AI · 0123456789
            </span>
          </div>
          <div className="sg-type__row">
            <span className="sg-type__tag">مقياس النص</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "var(--fs-1)", color: "var(--muted)" }}>fs-1 · وسم صغير</span>
              <span style={{ fontSize: "var(--fs-2)" }}>fs-2 · نص ثانوي ومعلومات</span>
              <span style={{ fontSize: "var(--fs-3)" }}>fs-3 · نص الواجهة</span>
              <span style={{ fontSize: "var(--fs-4)" }}>fs-4 · فقرة قراءة</span>
              <span style={{ fontSize: "var(--fs-5)", fontWeight: 600 }}>fs-5 · عنوان بطاقة</span>
              <span style={{ fontSize: "var(--fs-6)", fontWeight: 700 }}>fs-6 · عنوان قسم</span>
            </span>
          </div>
          <div className="sg-type__row">
            <span className="sg-type__tag">قياس محمّل</span>
            <span className="sg-note">
              {fonts
                ? `Plex: ${fonts.uiLoaded ? "محمّل ✓" : "غير محمّل ✗"} (عرض ${fonts.uiWidth}px) · Cairo: ${
                    fonts.learnLoaded ? "محمّل ✓" : "غير محمّل ✗"
                  } (عرض ${fonts.learnWidth}px)`
                : "…قياس"}
            </span>
          </div>
        </div>
      </section>

      <section className="sg-section">
        <h2>المكوّنات — الأزرار</h2>
        <div className="sg-demo">
          <Button>فهمت ✓</Button>
          <Button variant="ghost">مش فاهم</Button>
          <Button variant="quiet">تخطّي</Button>
          <Button size="sm">صغير</Button>
          <Button size="lg">كبير</Button>
          <Button disabled>معطّل</Button>
          <Button
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M11 5L6.5 9H4v6h2.5L11 19V5z" />
                <path d="M14.5 9.2a4.2 4.2 0 010 5.6" />
              </svg>
            }
          >
            استمع
          </Button>
        </div>
      </section>

      <section className="sg-section">
        <h2>المكوّنات — شرائح ووسوم ومربعات</h2>
        <div className="sg-demo">
          <Chip>الرياضيات</Chip>
          <Chip tone="outline">الصف السادس</Chip>
          <Chip tone="gold">الخطوة ٢ من ٥</Chip>
          <Chip tone="soft" onClick={() => undefined}>
            قابل للنقر
          </Chip>
        </div>
        <div className="sg-demo">
          <Badge tone="gold">ذهبي</Badge>
          <Badge tone="ok">مقبول</Badge>
          <Badge tone="warn">انتبه</Badge>
          <Badge tone="danger">دون الحد</Badge>
          <Badge tone="muted">غير مفعّل</Badge>
        </div>
        <div className="sg-demo">
          <IconTile>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </IconTile>
          <IconTile tone="deep" size="lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M12 4v16M4 12h16" />
            </svg>
          </IconTile>
          <IconTile tone="sage">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </IconTile>
          <IconTile tone="paper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M5 5h14v14H5z" />
            </svg>
          </IconTile>
          <IconTile tone="night">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconTile>
        </div>
      </section>

      <section className="sg-section">
        <h2>المكوّنات — بطاقات وأرقام وحلقات</h2>
        <div className="sg-demo sg-demo--column">
          <Card
            title="خواص الجمع"
            hint="رياضيات · الصف السادس الابتدائي"
            actions={<Chip tone="gold">الخطوة ٢ من ٥</Chip>}
            footer={<span className="sg-note">آخر جلسة: أمس · ١٤ دقيقة</span>}
          >
            <p style={{ margin: 0 }}>
              بطاقة المحتوى الأساسية: سطح ورق دافئ، حدود رقيقة، وظل من الرموز — بلا أي قيمة خام.
            </p>
          </Card>
          <div className="ui-grid">
            <StatTile label="دقائق هذا الأسبوع" value="٨٤" hint="+١٢ عن الأسبوع الماضي" />
            <StatTile label="مفاهيم أُتقنت" value="٧" hint="من ١٢" />
            <StatTile label="جلسات مكتملة" value="١٩" />
          </div>
          <div className="ui-row">
            <RingProgress value={0.62} caption="إتقان الرياضيات" />
            <RingProgress value={0.28} caption="إتقان العلوم" />
          </div>
        </div>
      </section>

      <section className="sg-section">
        <h2>المكوّنات — حالة فراغ ولوحة سفلية</h2>
        <div className="sg-demo sg-demo--column">
          <EmptyState
            title="لا توجد جلسات بعد"
            note="ابدأ أول حصة وسنُكمل من حيث توقفت في المرة القادمة."
            actionLabel="ابدأ أول حصة"
            onAction={() => undefined}
          />
          <Button variant="ghost" onClick={() => setSheetOpen(true)}>
            افتح لوحة سفلية (Sheet)
          </Button>
        </div>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="أدوات السبورة">
          <p style={{ margin: 0 }}>القلم · الممحاة · مسح الكل — داخل لوحة سفلية بدل شريط مستقل.</p>
          <div className="ui-row">
            <Button size="sm">قلم</Button>
            <Button size="sm" variant="ghost">
              ممحاة
            </Button>
            <Button size="sm" variant="quiet">
              مسح الكل
            </Button>
          </div>
        </Sheet>
      </section>

      <section className="sg-section">
        <h2>حالة W0</h2>
        <p>
          منجز: رموز تصميم كاملة (وضعان) · خطوط OFL مستضافة ذاتيًا · مبدّل مظهر بحفظ اختيار الطالب ·
          مكتبة مكوّنات أساسية · هذه الصفحة بقياسات حيّة. التالي: W1 ترحّل الشاشات القائمة إلى
          المكوّنات والرموز (الشاشات المهاجَرة بلا لون خام)، ثم W2 الرئيسية الجديدة.
        </p>
      </section>
    </div>
  );
}
