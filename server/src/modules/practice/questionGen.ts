/**
 * PHASE 28 — LLM question generation for the practice engine.
 * Pure helpers around the AI output: the parser validates the provider's
 * structured MCQ JSON (providers or prompts can change; grading correctness
 * depends on this boundary), and `groundingPrompt` builds the Arabic prompt
 * with the lesson context embedded as a <context> block — exactly the same
 * convention the mock provider's `extractContextBlock` reads.
 *
 * No I/O here — the service layer (practice/service.ts) owns DB + AI calls.
 */

export interface ParsedGeneratedQuestion {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

/** How many chunks are used as grounding text for one generated question. */
export const QUESTION_GEN_MAX_CHUNKS = 6;
/** Soft cap on grounding characters sent to the model (lesson-sized prompts). */
export const QUESTION_GEN_MAX_CONTEXT_CHARS = 4000;

/**
 * Parses + validates a provider reply. Tolerates a fenced JSON block
 * (```json … ```), requires a non-empty stem, 2–6 non-empty options and an
 * integer correctIndex inside the range. Returns null when anything is off —
 * callers turn that into a clear "could not generate" error, never a crash.
 */
export function parseGeneratedQuestion(raw: string): ParsedGeneratedQuestion | null {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (text.length === 0) return null;
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;

  if (typeof v.content !== "string" || v.content.trim().length < 5) return null;
  if (!Array.isArray(v.options)) return null;
  if (v.options.length < 2 || v.options.length > 6) return null;
  if (v.options.some((o) => typeof o !== "string" || o.trim().length === 0)) return null;
  if (typeof v.correctIndex !== "number" || !Number.isInteger(v.correctIndex)) return null;
  if (v.correctIndex < 0 || v.correctIndex >= v.options.length) return null;

  const explanation =
    typeof v.explanation === "string" && v.explanation.trim().length > 0 ? v.explanation.trim() : null;
  return {
    content: v.content.trim(),
    options: (v.options as string[]).map((o) => o.trim()),
    correctIndex: v.correctIndex,
    explanation,
  };
}

/**
 * Builds the system + user messages for ONE grounded MCQ. The system prompt
 * carries the lesson content inside <context> (never the system rules), and
 * the user message names the target concept — the mock provider reads both.
 */
export function groundingPrompt(args: {
  conceptTitle: string;
  context: string;
}): { system: string; user: string } {
  const system = [
    "أنت مولد أسئلة رياضيات للصف السادس الابتدائي باللغة العربية.",
    "مهمتك: إنشاء سؤال واحد باختيار من متعدد (MCQ) مبني حرفيًا على محتوى الدرس داخل <context> أدناه.",
    "قواعد صارمة: لا تخترع معلومات أو أرقامًا خارج المحتوى، وليكن الخيار الصحيح مطابقًا حرفيًا لجملة من المحتوى، والخيارات الأخرى إمّا من خارج الدرس أو تحريف واضح للمعنى.",
    'أخرج JSON فقط بالصيغة التالية: {"content": "سؤال", "options": ["خيار1", "خيار2", "خيار3", "خيار4"], "correctIndex": N, "explanation": "لماذا الخيار الصحيح صحيح"}',
    "",
    `<context>${args.context}</context>`,
  ].join("\n");
  const user = `المفهوم: «${args.conceptTitle}». أنشئ سؤالًا واحدًا بهذه الصيغة، مبنيًا على محتوى الدرس فقط.`;
  return { system, user };
}