// Re-OCR a TOC page with a custom instruction prompt that suppresses the
// dotted leader lines, so the full unit/concept list survives the token cap.
import "dotenv/config";
import { readFileSync } from "node:fs";

const PAGES = (process.env.PAGES ?? "6").split(",");
const MODEL = process.env.OCR_MODEL ?? process.env.GEMINI_OCR_MODEL ?? "gemini-3.8-flash";
const KEY = process.env.GEMINI_API_KEY ?? "";
if (!KEY) throw new Error("GEMINI_API_KEY missing");

for (const raw of PAGES) {
  const p = Number(raw);
  const b64 = readFileSync(`./scripts/.curriculum-pages/pages-${String(p).padStart(3, "0")}.jpg`).toString("base64");
  const instructions = [
    "أنت قارئ دقيق لفهرس كتاب الرياضيات المدرسي الممسوح." +
      "أخرج محتوى الفهرس كأسطر نصية فقط، بلا أرقام دليل النقاط ولا خطوط النقاط ولا أي تنسيق." +
      "لكل سطر الفهرس (عنوان وحدة أو مفهوم أو رقم صفحة) أخرجه في سطر مستقل." +
      "احتفظ بالأرقام العربية/اللاتينية كما هي. تجاهل ترويسة/تذييل الصفحة إذا لم تكن جزءًا من الفهرس.",
    "هيا: أخرج الأسطر فقط.",
  ];
  const body = {
    contents: [
      {
        parts: [
          { text: instructions.join("\n") },
          { inline_data: { mime_type: "image/jpeg", data: b64 } },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: 6000, temperature: 0.1 },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    console.log(`page ${p}: HTTP ${res.status}`, JSON.stringify(json).slice(0, 400));
    continue;
  }
  const text = json?.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
  const { writeFileSync } = await import("node:fs");
  writeFileSync(`./scripts/.curriculum-pages/toc2-p${p}.txt`, text);
  console.log(`page ${p}: OK ${text.length} chars`);
  for (const line of text.split(/\r?\n/)) if (line.trim()) console.log("   |", line.trim().slice(0, 140));
}