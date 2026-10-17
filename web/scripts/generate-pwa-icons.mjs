/**
 * PHASE 165 (W8) — أيقونات PWA من نفس هندسة favicon.svg (الشعار: ليل + ذهب).
 *
 * أداة تطوير تُشغَّل يدويًا عند تغيّر الشعار فقط — لا تدخل البناء ولا الإنتاج:
 *   node web/scripts/generate-pwa-icons.mjs
 * الناتج يُلتزم في web/public/icons/ (استخدام Playwright الموجود أصلًا للاختبار
 * كراسم SVG→PNG — بلا أي تبعية جديدة).
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

/* نفس قيم favicon.svg — مصدر الهوية البصري واحد. */
const NIGHT = "#0A0908";

/** هندسة favicon.svg في viewBox 64: ثلاث دوائر (18/32/46، 30، r=4.6) + شريط قاعدة. */
function iconSvg(size, { rounded, scale = 1 } = {}) {
  const background = rounded
    ? `<rect width="64" height="64" rx="14" fill="${NIGHT}"/>`
    : `<rect width="64" height="64" fill="${NIGHT}"/>`;
  // مركز الشعار في viewBox 64 هو (32، 34.9) — يُمرَّز إلى مركز الأيقونة عند الطلب.
  const open = rounded
    ? "<g>"
    : `<g transform="translate(32 32) scale(${scale}) translate(-32 -34.9)">`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F2CD7C"/>
      <stop offset="0.55" stop-color="#D9A95C"/>
      <stop offset="1" stop-color="#B98A41"/>
    </linearGradient>
  </defs>
  ${background}
  ${open}
    <circle cx="18" cy="30" r="4.6" fill="url(#g)"/>
    <circle cx="32" cy="30" r="4.6" fill="url(#g)"/>
    <circle cx="46" cy="30" r="4.6" fill="url(#g)"/>
    <rect x="14" y="41" width="36" height="3.4" rx="1.7" fill="url(#g)"/>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, svg: iconSvg(192, { rounded: true }) },
  { file: "icon-512.png", size: 512, svg: iconSvg(512, { rounded: true }) },
  // قناع Android يقصّ دائريًا: خلفية ممتدة + شعار داخل المنطقة الآمنة (58% من العرض).
  { file: "icon-maskable-512.png", size: 512, svg: iconSvg(512, { rounded: false }) },
  // iOS يقصّ بنفسه: بلا حواف دائرية مسبقة، والشعار ممرَّز.
  { file: "apple-touch-icon.png", size: 180, svg: iconSvg(180, { rounded: false }) },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
const written = [];
for (const target of targets) {
  await page.setViewportSize({ width: target.size, height: target.size });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}</style>${target.svg}`,
    { waitUntil: "load" },
  );
  const file = path.join(outDir, target.file);
  await page.locator("svg").screenshot({ path: file, omitBackground: true });
  const bytes = readFileSync(file);
  written.push(
    `${target.file} — ${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)} · ${bytes.length}B`,
  );
}
await browser.close();
console.log("أيقونات PWA كُتبت في web/public/icons/:\n - " + written.join("\n - "));
