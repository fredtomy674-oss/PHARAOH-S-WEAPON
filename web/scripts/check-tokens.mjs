/**
 * حارس الرموز (W0) — «لا لون/ظل خام خارج الرموز» في الشاشات المهاجَرة.
 *
 * النطاق: الملفات الجديدة لطبقة التصميم (المكوّنات + الأنماط + المظهر).
 * المسموح: القيم داخل styles/tokens.css فقط (مصدر الحقيقة البصرية).
 * الشاشات القديمة (styles.css) على جدول الهجرة W1+، فلا تُفحص هنا بعد.
 *
 * يُشغَّل من web/:  node scripts/check-tokens.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const TOKEN_FILE = "src/styles/tokens.css";

/** الشاشات/الملفات المهاجَرة التي يجب ألا تحمل أي قيمة بصرية خام. */
const GUARDED = [
  "src/styles/ui.css",
  "src/styles/style-guide.css",
  "src/styles/home.css",
  "src/styles/entry.css",
  "src/styles/app.css",
  "src/components/ui/Button.tsx",
  "src/components/ui/Card.tsx",
  "src/components/ui/Chip.tsx",
  "src/components/ui/Badge.tsx",
  "src/components/ui/IconTile.tsx",
  "src/components/ui/StatTile.tsx",
  "src/components/ui/EmptyState.tsx",
  "src/components/ui/RingProgress.tsx",
  "src/components/ui/Sheet.tsx",
  "src/components/ui/ThemeToggle.tsx",
  "src/components/app/AppShell.tsx",
  "src/components/SubjectGlyph.tsx",
  "src/StyleGuide.tsx",
  "src/Learn.tsx",
  "src/LessonPage.tsx",
  "src/styles/learn.css",
  "src/styles/sources.css",
  "src/styles/journey.css",
  "src/Journey.tsx",
  "src/journey/NileGarden.tsx",
  "src/styles/liveTeacher.css",
  "src/LiveTeacher.tsx",
  "src/TeacherMascot.tsx",
  "src/avatar/LiveAvatarStage.tsx",
];

/** لون خام: hex أو rgb()/rgba()/hsl() — داخل var() كبديل مسموح لأنه لا يُستخدم. */
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/;
/** ظل خام: box-shadow بقيمة مباشرة (المسموح var(--shadow-*)). */
const RAW_SHADOW = /box-shadow:(?!\s*var\()/;

function stripVarFallbacks(line) {
  // var(--x, #fff) → var(--x)  (البديل لا يُستخدم ما دام الرمز معرّفًا)
  return line.replace(/var\(\s*--[\w-]+\s*,[^)]*\)/g, "var(--x)");
}

let failures = 0;

function check(relPath, rules) {
  let source;
  try {
    source = readFileSync(path.join(root, relPath), "utf8");
  } catch {
    console.log("SKIP (missing) " + relPath);
    return;
  }
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    const text = stripVarFallbacks(line);
    for (const rule of rules) {
      if (rule.re.test(text)) {
        failures += 1;
        console.log(
          "RAW " + relPath + ":" + (index + 1) + " [" + rule.name + "] " + line.trim().slice(0, 90),
        );
      }
    }
  });
}

for (const file of GUARDED) {
  check(file, [
    { name: "color", re: RAW_COLOR },
    { name: "shadow", re: RAW_SHADOW },
  ]);
}

// الرموز نفسها: لا تُشترط (هي المصدر)، لكن نتحقق أنها موجودة ومعرَّفة في الوضعين.
try {
  const tokens = readFileSync(path.join(root, TOKEN_FILE), "utf8");
  const required = ["--gold:", "--bg:", "--card:", "--ink:", "--muted:", "--primary-ink:", "--font-ui:", "--font-learn:"];
  const missing = required.filter((name) => !tokens.includes(name));
  if (!tokens.includes(':root[data-theme="dark"]')) missing.push('block :root[data-theme="dark"]');
  if (missing.length) {
    failures += 1;
    console.log("TOKENS missing: " + missing.join(", "));
  }
} catch {
  failures += 1;
  console.log("TOKENS file unreadable: " + TOKEN_FILE);
}

if (failures > 0) {
  console.log("\nFAIL — " + failures + " raw visual value(s) outside tokens. Use the tokens in " + TOKEN_FILE + ".");
  process.exit(1);
}
console.log("OK — no raw colors/shadows outside " + TOKEN_FILE + " in " + GUARDED.length + " guarded file(s).");
