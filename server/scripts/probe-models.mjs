// List every Gemini model the configured GEMINI_API_KEY can address.
// Usage: node scripts/probe-models.mjs   (from server/, so .env is found)
import "dotenv/config";
const key = process.env.GEMINI_API_KEY ?? "";
const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models?key=" + key,
  { headers: { "content-type": "application/json" } },
);
const data = await res.json();
console.log("status:", res.status);
if (!res.ok) {
  console.log(JSON.stringify(data).slice(0, 400));
  process.exit(0);
}
const models = (data.models ?? []).map((m) => m.name).sort();
console.log("total models:", models.length);
console.log(models.join("\n"));