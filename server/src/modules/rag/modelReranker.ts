import type { AiService } from "../ai/aiService.js";
import type { RankedChunk, Reranker } from "./types.js";

const RERANK_SYSTEM =
  "أنت مصنّف صلة للمحتوى التعليمي العربي. أعد ترتيب مقاطع الدرس حسب أهميتها للإجابة عن سؤال الطالب. " +
  "لا تشرح ولا تكتب نصًا — أجب بمصفوفة JSON واحدة فقط.";

/**
 * Model-based reranker (PHASE 21 / D-025): asks the LLM to reorder the
 * candidate chunks by relevance to the question. Strict-parse, safe-fallback:
 * ANY failure (model error, non-JSON reply, invalid indices) returns the input
 * order untouched — reranking must never break or distort a retrieval turn.
 * The order is applied as position-only; vector/lexical scores are preserved.
 */
export class ModelReranker implements Reranker {
  constructor(
    private readonly ai: AiService,
    private readonly opts: { maxChunks?: number } = {},
  ) {}

  async rerank(query: string, chunks: RankedChunk[]): Promise<RankedChunk[]> {
    const items = this.opts.maxChunks === undefined ? chunks : chunks.slice(0, this.opts.maxChunks);
    if (items.length <= 1) return chunks;

    const list = items.map((c, i) => `[${i + 1}] ${c.content.slice(0, 600)}`).join("\n");
    const user = `سؤال الطالب: "${query}"\n\nالمقاطع المرشحة:\n${list}\n\nأعد مصفوفة أرقام المقاطع مرتبة من الأهم إلى الأقل أهمية — مثال: [3, 1, 2]. لا شيء غير ذلك.`;

    let content = "";
    try {
      const res = await this.ai.complete({
        operation: "rerank",
        messages: [
          { role: "system", content: RERANK_SYSTEM },
          { role: "user", content: user },
        ],
        json: true,
        temperature: 0,
        maxOutputTokens: 256,
      });
      content = res.content;
    } catch {
      return chunks; // model failure must never break the turn
    }

    const order = parseRanking(content, items.length);
    if (order === null) return chunks;

    const chosen = new Set(order);
    const remainder = items
      .map((c, i) => ({ c, i }))
      .filter(({ i }) => !chosen.has(i))
      .map(({ c }) => c);
    return [...order.map((i) => items[i]!), ...remainder].map((c, i) => ({ ...c, position: i }));
  }
}

/**
 * Parses a strict JSON ranking, e.g. `[3,1,2]`, possibly inside prose or a
 * code fence. Valid only when every index is an integer in [1..total] and no
 * duplicate is present — anything else returns null (unchanged order).
 */
export function parseRanking(content: string, total: number): number[] | null {
  const match = content.match(/\[[\d,\s]+\]/);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const seen = new Set<number>();
  const order: number[] = [];
  for (const value of parsed) {
    if (typeof value !== "number" || !Number.isInteger(value)) return null;
    if (value < 1 || value > total) return null;
    if (seen.has(value)) return null; // duplicates are ambiguous — refuse
    seen.add(value);
    order.push(value - 1);
  }
  return order.length === 0 ? null : order;
}