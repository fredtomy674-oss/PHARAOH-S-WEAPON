import { cyrb128, sha256Hex } from "../../../utils/ids.js";
import type { DocumentInput, EmbeddingProvider, EmbeddingResponse, LLMProvider, LLMResponse, LLMRequest, OcrProvider, OcrRequest, OcrResponse } from "../types.js";

const MOCK_DIM = 64;

function hashVector(str: string, dim = MOCK_DIM): number[] {
  const v = new Array<number>(dim).fill(0);
  const tokens = str.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0);
  for (const token of tokens) {
    const [a, b, c, d] = cyrb128(token);
    const idx = Math.abs(a ^ (b << 5)) % dim;
    const sign = (c & 1) === 0 ? 1 : -1;
    v[idx]! += sign * (0.5 + (d % 1000) / 2000);
  }
  // Normalize.
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => x / norm);
}

/**
 * Deterministic offline embedding provider: term-overlap hashing.
 * Good enough for the RAG pipeline on dev/test; real semantic embeddings
 * come from the `gemini` provider in production.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly id = "mock";

  async embed(request: { texts: string[]; model?: string }): Promise<EmbeddingResponse> {
    return {
      vectors: request.texts.map((t) => hashVector(t)),
      model: "mock-hash-64",
      dims: MOCK_DIM,
    };
  }
}

/**
 * Deterministic offline LLM provider. Produces pedagogically-shaped,
 * curriculum-grounded replies so the whole vertical slice works with zero
 * keys. Also honors `json` requests with a structured JSON reply.
 */
export class MockLLMProvider implements LLMProvider {
  readonly id = "mock";

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const started = Date.now();

    const system = request.messages.find((m) => m.role === "system")?.content ?? "";
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const images = request.images ?? [];
    const documents = request.documents ?? [];

    // Extract the REAL context block (curriculum content) if present, similar to
    // what the real provider receives. The system rules contain a literal
    // "<context>" in prose BEFORE the actual block, so the last open tag in the
    // system message is the real one — a first-match regex would capture the
    // whole middle of the prompt instead of the curriculum content.
    const context = extractContextBlock(system);

    // PHASE 28 — question generation: the mock must emit a structured MCQ JSON
    // grounded in the lesson context (never invented facts). The generator
    // service is what turns this into a stored row; here we only produce the
    // AI-shaped reply, deterministically, so tests stay stable.
    if (request.operation === "question_gen") {
      const conceptMatch = /المفهوم: «([^»]+)»/.exec(lastUser);
      const conceptTitle = conceptMatch?.[1] ?? null;
      const content = JSON.stringify(buildMockQuestion(context, conceptTitle));
      return {
        content,
        model: "mock-question",
        inputTokens: estimateTokens(system + lastUser),
        outputTokens: estimateTokens(content),
        latencyMs: Date.now() - started,
      };
    }

    if (request.json) {
      const content = JSON.stringify({
        content: buildTutorText({ user: lastUser, context, images, documents }),
        tone: "friendly",
        parts: [{ type: "text", text: buildTutorText({ user: lastUser, context, images, documents }) }],
        assessment: { conceptsTouched: [], confidence: 0.5 },
      });
      return { content, model: "mock-tutor", inputTokens: estimateTokens(system + lastUser), outputTokens: estimateTokens(content), latencyMs: Date.now() - started };
    }

    const body = buildTutorText({ user: lastUser, context, images, documents });
    return { content: body, model: "mock-tutor", inputTokens: estimateTokens(system + lastUser), outputTokens: estimateTokens(body), latencyMs: Date.now() - started };
  }
}

/** Stable marker the tutor reply contains when an image was attached (used by tests/E2E). */
export const IMAGE_READ_MARKER = "قرأت الصورة المرفقة";

/** Stable marker the tutor reply contains when a document was attached (used by tests/E2E). */
export const DOCUMENT_READ_MARKER = "قرأت الملف المرفق";

/** How many leading characters of the extracted document text are echoed into the mock reply. */
const DOC_SNIPPET_CHARS = 60;

/**
 * Pulls the curriculum `<context>` block out of a system prompt. The prompt
 * builder places the real block last, but the fixed rules may mention a literal
 * "<context>" in prose before it — so we take the LAST open tag and its
 * closing tag. The "no retrieval" placeholder is treated as an empty context.
 */
function extractContextBlock(system: string): string {
  const open = system.lastIndexOf("<context>");
  if (open < 0) return "";
  const close = system.indexOf("</context>", open + "<context>".length);
  if (close < 0) return "";
  const ctx = system.slice(open + "<context>".length, close).trim();
  return ctx === "(لا يوجد محتوى مسترجع لهذا السؤال)" ? "" : ctx;
}

/**
 * PHASE 28 — deterministic offline MCQ generator. Splits the lesson context
 * into stable fact sentences, picks one as the correct answer (verbatim, so
 * grading is unambiguous), and derives 3 distractors deterministically from
 * the same text. Same input → same output, so cache hits and repeated
 * generation stay byte-identical.
 */
export interface MockQuestionJson {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTION_FILLER_1 = "هذه العبارة لا وردت في محتوى الدرس إطلاقًا.";
const QUESTION_FILLER_2 = "لا يمكن استنتاج هذه العبارة من محتوى الدرس.";
const QUESTION_FILLER_3 = "عبارة من موضوع رياضي آخر لا يتصل بهذا الدرس.";

export function buildMockQuestion(context: string, conceptTitle: string | null): MockQuestionJson {
  const facts = (context.split(/[.!؟؛\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && !s.includes("غير موجود")));

  const seed = cyrb128(context);
  const h = Math.abs(seed[0]! ^ (seed[1]! << 4)) || 7;

  let correct: string;
  let other: string;
  if (facts.length > 0) {
    correct = facts[h % facts.length]!;
    if (facts.length > 1) {
      other = facts[(h + 1 + (h >> 3)) % facts.length]!;
      if (other === correct) other = facts[(h + 2) % facts.length]!;
    } else {
      other = QUESTION_FILLER_1;
    }
  } else {
    correct = (context.trim() || "المحتوى المسترجع لهذا الدرس").slice(0, 200);
    other = QUESTION_FILLER_1;
  }

  const mutated = mutateFact(correct);
  const options = [correct, other, mutated ?? QUESTION_FILLER_2, QUESTION_FILLER_3];
  const unique = [...new Set(options)];
  for (const filler of [QUESTION_FILLER_1, QUESTION_FILLER_2, QUESTION_FILLER_3, "خيار غير وارد في الدرس."]) {
    if (unique.length >= 4) break;
    if (!unique.includes(filler)) unique.push(filler);
  }

  // Deterministic rotation keeps the same 4 options but a stable order.
  const k = h % unique.length;
  const rotated = unique.map((_, i) => unique[(i + k) % unique.length]!);
  const correctIndex = (unique.indexOf(correct) - k + unique.length) % unique.length;

  return {
    content: conceptTitle
      ? `حسب درسنا عن «${conceptTitle}»، أي العبارات التالية وردت في الدرس؟`
      : "أي العبارات التالية وردت في الدرس؟",
    options: rotated,
    correctIndex,
    explanation: `العبارة الصحيحة وردت حرفيًا في درسنا: «${correct}». أما الخيارات الأخرى فإمّا من خارج الدرس أو بصيغة تغيّر المعنى.`,
  };
}

/** Change the first digit of a fact (e.g. "487 + 358" → "587 + 358") for a plausible wrong answer. */
function mutateFact(fact: string): string | null {
  const m = /(\d)/.exec(fact);
  if (!m) return null;
  const next = String((Number(m[1]) + 1) % 10);
  return fact.slice(0, m.index) + next + fact.slice(m.index + 1);
}

function buildTutorText(args: {
  user: string;
  context: string;
  images?: { mimeType: string; base64: string }[];
  documents?: DocumentInput[];
}): string {
  const { user, context, images = [], documents = [] } = args;
  const contextNote = context
    ? `\n\nوفقًا لمحتوى الدرس: ${context.slice(0, 900)}`
    : "\n\nلم أستطع الوصول لمحتوى الدرس في الوقت الحالي؛ راجع المدرس المباشر.";
  const imageNote = images.length > 0
    ? `📸 ${IMAGE_READ_MARKER} (${images.length}) — سأشرح حلها اعتمادًا على درسنا خطوة بخطوة.`
    : "";
  const doc = documents[0];
  const docNote = doc
    ? `📄 ${DOCUMENT_READ_MARKER} «${doc.fileName ?? "بدون اسم"}» — قرأته وسأشرح سؤالك اعتمادًا عليه وعلى الدرس. أهم ما ورد فيه: "${doc.text.slice(0, DOC_SNIPPET_CHARS)}".`
    : "";
  const parts: string[] = [];
  if (imageNote) parts.push(imageNote);
  if (docNote) parts.push(docNote);
  if (/سؤال|مثال|تمرين|حل/.test(user)) {
    parts.push("هيا نبدأ خطوة بخطوة. أعتقد أنك تقصد جزءًا من الدرس الحالي.");
  }
  parts.push(`سؤال جيد! هذا من موضوع درسنا. سأشرحه بطريقة مبسطة:${contextNote}`);
  parts.push("💡 تلميح: جرب التفكير في المثال الأول في الدرس قبل الإجابة، وأخبرني بما توصلت إليه.");
  parts.push("هل تريد أن أشرح مرة أخرى بطريقة مختلفة، أم ننتقل لسؤال للتأكد من الفهم؟");
  return parts.join("\n\n");
}

/** Stable marker the mock OCR provider puts in every recognized text (used by tests/E2E). */
export const OCR_TEXT_MARKER = "نص الصفحة الممسوحة ضوئيًا";

/**
 * Deterministic offline OCR provider: scanned PDF/DOCX pages always yield a
 * fixed, curriculum-shaped Arabic fixture (bytes-derived token so distinct
 * files produce distinct-but-stable text — never identical chunk content).
 * Real OCR of actual page images comes from the `gemini` provider.
 */
export class MockOcrProvider implements OcrProvider {
  readonly id = "mock";

  async ocr(request: OcrRequest): Promise<OcrResponse> {
    const started = Date.now();
    const token = sha256Hex(request.base64).slice(0, 8);
    const text = [
      `${OCR_TEXT_MARKER} — صفحة من كتاب الرياضيات (الصف السادس).`,
      `نص الصفحة: «جمع الأعداد الطبيعية حتى 999 مع إعادة التجميع — مثال محلول: 487 + 358 = 845 (الرمز ${token}).»`,
      "ثمة تمرين مطلوب: اكتب مسودة الحل ثم تحقق من التقدير قبل الإجابة النهائية.",
    ].join("\n");
    return {
      text,
      model: "mock-ocr",
      inputTokens: Math.ceil(request.base64.length / 4),
      outputTokens: estimateTokens(text),
      latencyMs: Date.now() - started,
    };
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}