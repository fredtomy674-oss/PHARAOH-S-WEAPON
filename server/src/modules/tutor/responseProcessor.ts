import { z } from "zod";

/** Structured output contract shared between builders, parsers and tests. */
export const TutorResponseSchema = z.object({
  content: z.string().min(1),
  tone: z.string().optional(),
  parts: z
    .array(
      z.object({
        type: z.enum(["text", "question", "hint", "example"]),
        text: z.string(),
      }),
    )
    .optional()
    .default([]),
  assessment: z
    .object({
      conceptsTouched: z.array(z.string()).optional().default([]),
      confidence: z.number().min(0).max(1).optional().default(0),
    })
    .optional()
    .default({ conceptsTouched: [], confidence: 0 }),
});

export type TutorResponse = z.infer<typeof TutorResponseSchema>;

function stripFences(raw: string): string {
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return m?.[1] ?? raw;
}

/**
 * Tolerant parser: try JSON directly, then with fences stripped, then extract
 * the first balanced {...} block. Falls back to a plain-text passthrough so a
 * provider without reliable JSON mode never bricks the tutor.
 */
export function parseTutorResponse(raw: string): TutorResponse {
  const attempts: string[] = [raw.trim(), stripFences(raw.trim())];
  const firstBrace = raw.indexOf("{");
  if (firstBrace > -1) {
    const candidate = raw.slice(firstBrace);
    const end = lastBalanced(candidate);
    if (end > 0) attempts.push(candidate.slice(0, end + 1));
  }
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      const result = TutorResponseSchema.safeParse(parsed);
      if (result.success) return result.data;
    } catch {
      // try next candidate
    }
  }
  // Fallback: treat the whole text as content.
  return { content: raw.trim(), tone: "friendly", parts: [{ type: "text", text: raw.trim() }], assessment: { conceptsTouched: [], confidence: 0 } };
}

function lastBalanced(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}