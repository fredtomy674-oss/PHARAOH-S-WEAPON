// PHASE 47 fix-up: re-OCR specific pages with a "pushy" instruction prompt that
// forbids the "لا يوجد نص مكتوب" refusal and asks for any visible Arabic text
// (headers, labels, exercise numbers, diagram annotations). Pages that are truly
// textless get an EMPTY output file (loadBookRange skips them).
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OCR_DIR = path.join(HERE, "..", "data", "curriculum-ocr");
const JPG_DIR = path.join(HERE, ".curriculum-pages");

const PAGES = (process.env.PAGES ?? "22").split(",").map((s) => Number(s));
const MODEL = process.env.OCR_MODEL ?? process.env.GEMINI_OCR_MODEL ?? "gemini-3.8-flash";
const KEY = process.env.GEMINI_API_KEY ?? "";
if (!KEY) throw new Error("GEMINI_API_KEY missing");

const INSTRUCTIONS = [
  "أنت قارئ دقيق لصفحة ممسوحة من كتاب الرياضيات المدرسي المصري (قد تحتوي رسومًا وجداولًا ومخططات).",
  "استخرج كل النص العربي الظاهر في الصفحة حرفيًا كما هو: العناوين، الأسئلة والأرقام، تسميات الأشكال، جداول، أي كلمات داخل الصورة.",
  "ممنوع تمامًا أن ترد \"لا يوجد نص\" — إذا كان النص قليلًا أو داخل رسوم، اكتب ما يظهر ولو كان مقطعًا.",
  "إن كانت الصفحة تحتوي رسمًا فقط بلا أي نص قابل للقراءة، اكتب كلمة واحدة فقط: NONE",
  "أخرج النص مباشرة دون مقدمات.",
];
const body = (b64) => ({
  contents: [{ parts: [{ text: INSTRUCTIONS.join("\n") }, { inline_data: { mime_type: "image/jpeg", data: b64 } }] }],
  generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
});

for (const p of PAGES) {
  const pad = String(p).padStart(3, "0");
  const b64 = readFileSync(path.join(JPG_DIR, `pages-${pad}.jpg`)).toString("base64");
  let text = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body(b64)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
      text = (json?.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "").trim();
      break;
    } catch (err) {
      console.log(`page ${p}: attempt ${attempt} failed (${String(err).slice(0, 140)})`);
      if (attempt < 4) await new Promise((r) => setTimeout(r, 2500 * attempt));
    }
  }
  const cleaned = text === "NONE" || /^لا يوجد نص/.test(text) ? "" : text;
  writeFileSync(path.join(OCR_DIR, `pages-${pad}.txt`), cleaned, "utf8");
  console.log(`page ${p}: ${cleaned ? `OK chars=${cleaned.length}` : "EMPTY (truly textless page)"}`);
  if (cleaned) console.log("   |", cleaned.replace(/\s+/g, " ").slice(0, 160));
}