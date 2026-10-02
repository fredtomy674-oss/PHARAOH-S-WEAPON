// Live end-to-end check of the running API: the catalog serves the official
// English- and French-medium maths trees, the badge language matches the subject
// medium (math-en → en, math-fr → fr), and real-embedding retrieval for a lesson
// in each returns that book's own pages — not empty and not another curriculum.
// It also confirms the live tree carries the printed concept lists (47 Arabic
// maths objectives, the 22 printed science learning topics).
// Usage (server running, from server/): npx tsx scripts/verify-live.mjs
import { openDbAndMigrate } from "../src/db/index.js";
import { AiService } from "../src/modules/ai/aiService.js";
import { createVectorStore } from "../src/modules/rag/factory.js";
import { RetrievalService, LexicalReranker } from "../src/modules/rag/retrieval.js";

const BASE = "http://127.0.0.1:3001/api/curriculum";
const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
};

const { countries } = await get("/countries");
const eg = countries.find((c) => c.code === "eg");
if (!eg) throw new Error("Egypt country not found");
const { systems } = await get(`/systems?countryId=${eg.id}`);
const sys = systems.find((s) => s.code === "mo-edu");
const { grades } = await get(`/grades?systemId=${sys.id}`);
const g6 = grades.find((g) => g.code === "grade-6");
const { subjects } = await get("/subjects");

const checks = [
  { subject: "math-en", curriculum: "eg-g6-math-en", lesson: "l-men-1-1", lang: "en", question: "What is divisibility? How do I find the GCF and the LCM?" },
  { subject: "math-fr", curriculum: "eg-g6-math-fr", lesson: "l-mfr-1-1", lang: "fr", question: "Qu'est-ce que la divisibilité ? Comment trouver le P.G.C.D et le P.P.C.M ?" },
];

const db = openDbAndMigrate();
const ai = new AiService(db, { forceProvider: "gemini" });
const retrieval = new RetrievalService(db, ai, createVectorStore(db), new LexicalReranker());

let failures = 0;
const verdict = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

for (const c of checks) {
  console.log(`\n=== ${c.curriculum} (${c.subject}) ===`);
  const subj = subjects.find((s) => s.code === c.subject);
  if (!subj) { verdict(false, "subject exists", c.subject); continue; }
  const { curricula } = await get(`/curricula?gradeId=${g6.id}&subjectId=${subj.id}`);
  const cur = curricula.find((x) => x.code === c.curriculum);
  if (!cur) { verdict(false, "curriculum exists", c.curriculum); continue; }

  const { terms } = await get(`/terms?curriculumId=${cur.id}`);
  const t1 = terms.find((t) => t.code === "term-1");
  const { units } = await get(`/units?termId=${t1.id}`);
  const lessons = [];
  for (const u of units) lessons.push(...(await get(`/lessons?unitId=${u.id}`)).lessons);
  verdict(units.length === 7 && lessons.length === 10, "official shape 7 units / 10 concepts", `${units.length}/${lessons.length}`);

  const lesson = lessons.find((l) => l.code === c.lesson);
  if (!lesson) { verdict(false, "anchor lesson exists", c.lesson); continue; }

  const br = await get(`/lessons/${lesson.id}/breadcrumb`);
  verdict(br.replyLanguage === c.lang, `breadcrumb language = ${c.lang}`, `got ${br.replyLanguage} (subject ${br.breadcrumb?.subject?.code ?? "?"})`);

  const { concepts } = await get(`/lessons/${lesson.id}/concepts`);
  verdict(concepts.length > 0, "lesson carries printed targets", `${concepts.length} concepts`);

  // Real-embedding retrieval against the live corpus, scoped to the lesson.
  const chunk = db.sqlite
    .prepare("SELECT country_id, education_system_id, grade_id, subject_id, curriculum_id, term_id, unit_id, lesson_id FROM chunks WHERE lesson_id = ? LIMIT 1")
    .get(lesson.id);
  if (!chunk) { verdict(false, "lesson has book chunks", "none"); continue; }
  const result = await retrieval.retrieve({ question: c.question, topK: 4, scope: {
    countryId: chunk.country_id, educationSystemId: chunk.education_system_id, gradeId: chunk.grade_id,
    subjectId: chunk.subject_id, curriculumId: chunk.curriculum_id, termId: chunk.term_id,
    unitId: chunk.unit_id, lessonId: chunk.lesson_id,
  } });
  const inside = result.chunks.filter((x) => x.metadata.lessonId === lesson.id).length;
  const sample = String(result.chunks[0]?.content ?? "").replace(/\s+/g, " ").slice(0, 90);
  verdict(inside === result.chunks.length && result.chunks.length > 0, "retrieval stays in the lesson", `${inside}/${result.chunks.length}, model ${result.model}`);
  console.log(`        book text: ${sample}`);
}

// PHASE 69 live-tree confirmation.
console.log("\n=== PHASE 69 live tree ===");
const mathTargets = db.sqlite.prepare("SELECT COUNT(*) n FROM concepts WHERE code LIKE 'c-l-con-%'").get().n;
const sciTopics = db.sqlite.prepare("SELECT COUNT(*) n FROM concepts WHERE code LIKE 'c-l-sci-con-%'").get().n;
const sciFirst = db.sqlite.prepare("SELECT title FROM concepts WHERE code = 'c-l-sci-con-1-1-1'").get()?.title;
verdict(mathTargets === 47, "Arabic maths printed objectives", `${mathTargets}`);
verdict(sciTopics === 22, "science printed learning topics", `${sciTopics}`);
verdict(sciFirst === "الهواء والاحتراق", "science 1-1 topic is the printed «تعلّم» heading", `${sciFirst}`);

db.sqlite.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exitCode = failures === 0 ? 0 : 1;
