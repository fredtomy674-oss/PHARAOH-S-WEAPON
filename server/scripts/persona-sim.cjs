// Persona token simulation — REAL calls through the running dev server.
//
// Usage:  node server/scripts/persona-sim.cjs
// Needs:  the dev server running on 127.0.0.1:3001 (npm run dev --workspace server)
//         and the dev database at server/data/alfarouq.sqlite (read for usage rows).
//
// What it does:
//   1. Creates (idempotently) two sim students — a struggling one and a top one —
//      and plays a scripted 10-turn session for each on the same lesson
//      (eg-g6-math: divisibility / GCF / LCM).
//   2. Reads ai_usage_logs for those users and prints per-turn + per-session
//      tokens and cost, plus daily/monthly projections per student.
//
// It never sends images, documents or speech — those are separate cost paths
// (see docs/research/TOKEN_PRICING_STUDY.md). Cost uses the flash-lite anchor
// $0.10/M input, $0.40/M output; replace with the contracted price when it moves.
const Database = require("better-sqlite3");
const path = require("node:path");
const BASE = "http://127.0.0.1:3001";

const IDS = {
  curriculumId: "cur_LGE9fsStvSOc33dbZxCbZ", // eg-g6-math
  gradeId: "g_vrTcdpJ8WczHbnSkTj9VG", // grade-6 (Egypt)
  subjectId: "subj_pJCP49c5WQ3CsrEkcJry2", // math
  lessonId: "l_FSyAtVpzePqd4z5FMIIHO", // divisibility / GCF / LCM
};

const PERSONAS = [
  {
    key: "weak",
    label: "الطالب المتعثر",
    email: "sim-weak-1@alfarouq.test",
    password: "sim-password-123",
    displayName: "سيم المتعثر",
    messages: [
      "مش فاهم الدرس ده خالص",
      "اشرح تاني ببساطة من الأول",
      "لسه مش فاهم يعني إيه قابلية القسمة",
      "ممكن مثال تاني أسهل",
      "أنا تايه خالص",
      "طيب يعني إيه العامل المشترك الأكبر",
      "مش عارف أحل",
      "اشرح بالراحة شوية",
      "جرب تشرح بطريقة تانية خالص",
      "تمام شكرا",
    ],
  },
  {
    key: "top",
    label: "الطالب المتفوق",
    email: "sim-top-1@alfarouq.test",
    password: "sim-password-123",
    displayName: "سيم المتفوق",
    messages: [
      "عايز أبدأ درس قابلية القسمة والعامل المشترك الأكبر",
      "تمام فهمت الفكرة، اديني مثال صعب شوية",
      "طب ليه بنستخدم العامل المشترك الأكبر في تبسيط الكسور؟",
      "اديني سؤال أختبر نفسي",
      "أظن الإجابة 12",
      "حلو، عايز أمثلة على المضاعف المشترك الأصغر مع ثلاثة أرقام",
      "إيه الفرق بين استخدامات العامل المشترك الأكبر والمضاعف المشترك الأصغر؟",
      "اديني سؤال تاني أصعب",
      "أظن الإجابة 36",
      "تمام، لخصلي الدرس في خمس نقاط",
    ],
  },
];

const PRICE = { input: 0.1, output: 0.4 }; // USD per 1M tokens (flash-lite anchor)

async function api(path, opts = {}, cookie) {
  const res = await fetch(BASE + path, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(opts.csrf ? { "x-csrf-token": opts.csrf } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text, setCookie: res.headers.getSetCookie ? res.headers.getSetCookie() : [] };
}

async function ensureUser(p, db) {
  await api("/api/auth/register", {
    method: "POST",
    body: { email: p.email, password: p.password, displayName: p.displayName, gradeId: IDS.gradeId },
  });
  const r = await api("/api/auth/login", { method: "POST", body: { email: p.email, password: p.password } });
  if (r.status >= 400) throw new Error("login failed " + r.status + " " + r.text.slice(0, 300));
  const cookieHeader = r.setCookie.map((c) => c.split(";")[0]).join("; ");
  const urow = db.prepare("SELECT id FROM users WHERE email = ?").get(p.email);
  return { cookie: cookieHeader, csrf: r.json?.csrfToken ?? null, userId: urow ? urow.id : null };
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const usd = (n) => "$" + n.toFixed(4);

(async () => {
  const db = new Database(path.join(__dirname, "..", "data", "alfarouq.sqlite"), { readonly: true });
  const results = [];
  for (const p of PERSONAS) {
    console.log("== persona " + p.key + " (" + p.label + ") ==");
    const auth = await ensureUser(p, db);
    console.log("  userId:", auth.userId);
    const s = await api("/api/sessions", { method: "POST", body: IDS, csrf: auth.csrf }, auth.cookie);
    if (s.status >= 400) throw new Error("start failed " + s.status + " " + s.text.slice(0, 300));
    const sessionId = s.json?.session?.id ?? s.json?.id;
    console.log("  session:", sessionId);
    let turn = 0;
    for (const m of p.messages) {
      turn += 1;
      const t0 = Date.now();
      const r = await api("/api/sessions/" + sessionId + "/messages", { method: "POST", body: { content: m }, csrf: auth.csrf }, auth.cookie);
      const dt = Date.now() - t0;
      console.log("  turn " + turn + ": " + r.status + " (" + dt + "ms)");
      if (r.status >= 400) {
        console.log("  ERR BODY:", r.text.slice(0, 300));
        break;
      }
      await new Promise((res) => setTimeout(res, 1500));
    }
    const rows = db
      .prepare(
        "SELECT operation, model, input_tokens, output_tokens, latency_ms FROM ai_usage_logs WHERE user_id = ? ORDER BY created_at"
      )
      .all(auth.userId);
    results.push({ persona: p.key, label: p.label, sessionId, turnsDone: turn, rows });
    console.log("  usage rows collected:", rows.length);
  }

  console.log("\n=== RESULTS (session totals) ===");
  const summaries = {};
  for (const r of results) {
    const sum = (rows, k) => rows.reduce((a, b) => a + b[k], 0);
    const totalIn = sum(r.rows, "input_tokens");
    const totalOut = sum(r.rows, "output_tokens");
    const cost = (totalIn / 1e6) * PRICE.input + (totalOut / 1e6) * PRICE.output;
    summaries[r.persona] = { turns: r.rows.length, totalIn, totalOut };
    console.log(
      `[${r.persona}] turns ${r.rows.length} | in ${fmt(totalIn)} (avg ${fmt(totalIn / Math.max(1, r.rows.length))}/turn) | out ${fmt(totalOut)} (avg ${fmt(
        totalOut / Math.max(1, r.rows.length)
      )}/turn) | session ${fmt(totalIn + totalOut)} tokens | ${usd(cost)}`
    );
  }

  console.log("\n=== DAILY PROJECTIONS (per student) ===");
  for (const key of Object.keys(summaries)) {
    const s = summaries[key];
    const perTurnIn = s.totalIn / Math.max(1, s.turns);
    const perTurnOut = s.totalOut / Math.max(1, s.turns);
    for (const n of [5, 10, 15, 30, 50]) {
      const dayCost = ((perTurnIn * n) / 1e6) * PRICE.input + ((perTurnOut * n) / 1e6) * PRICE.output;
      console.log(
        `  [${key}] ${String(n).padStart(2)} msg/day → ${fmt((perTurnIn + perTurnOut) * n)} tokens/day | ${usd(dayCost)}/day | ${usd(dayCost * 30)}/month`
      );
    }
  }
  console.log("\nDONE");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
