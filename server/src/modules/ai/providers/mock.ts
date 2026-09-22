import { cyrb128 } from "../../../utils/ids.js";
import type { EmbeddingProvider, EmbeddingResponse, LLMProvider, LLMResponse, LLMRequest } from "../types.js";

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

    // Extract the context block (curriculum content) if present, similar to
    // what the real provider receives.
    const contextMatch = system.match(/<context>([\s\S]*?)<\/context>/);
    const context = contextMatch?.[1]?.trim() ?? "";

    if (request.json) {
      const content = JSON.stringify({
        content: buildTutorText({ user: lastUser, context }),
        tone: "friendly",
        parts: [{ type: "text", text: buildTutorText({ user: lastUser, context }) }],
        assessment: { conceptsTouched: [], confidence: 0.5 },
      });
      return { content, model: "mock-tutor", inputTokens: estimateTokens(system + lastUser), outputTokens: estimateTokens(content), latencyMs: Date.now() - started };
    }

    const body = buildTutorText({ user: lastUser, context });
    return { content: body, model: "mock-tutor", inputTokens: estimateTokens(system + lastUser), outputTokens: estimateTokens(body), latencyMs: Date.now() - started };
  }
}

function buildTutorText(args: { user: string; context: string }): string {
  const { user, context } = args;
  const contextNote = context
    ? `\n\nوفقًا لمحتوى الدرس: ${context.slice(0, 900)}`
    : "\n\nلم أستطع الوصول لمحتوى الدرس في الوقت الحالي؛ راجع المدرس المباشر.";
  const parts: string[] = [];
  if (/سؤال|مثال|تمرين|حل/.test(user)) {
    parts.push("هيا نبدأ خطوة بخطوة. أعتقد أنك تقصد جزءًا من الدرس الحالي.");
  }
  parts.push(`سؤال جيد! هذا من موضوع درسنا. سأشرحه بطريقة مبسطة:${contextNote}`);
  parts.push("💡 تلميح: جرب التفكير في المثال الأول في الدرس قبل الإجابة، وأخبرني بما توصلت إليه.");
  parts.push("هل تريد أن أشرح مرة أخرى بطريقة مختلفة، أم ننتقل لسؤال للتأكد من الفهم؟");
  return parts.join("\n\n");
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}