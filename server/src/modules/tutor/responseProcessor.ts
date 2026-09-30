import { z } from "zod";
import { NumberLineWidgetSchema } from "./widgets.js";

/** Structured output contract shared between builders, parsers and tests. */
export const TutorResponseSchema = z.object({
  content: z.string().min(1),
  tone: z.string().optional(),
  parts: z
    .array(
      z.union([
        z.object({
          type: z.enum(["text", "question", "hint", "example"]),
          text: z.string(),
        }),
        // PHASE 51 — a widget part draws an interactive line inside the reply.
        // `text` stays (a fallback line for readers that ignore widgets); the
        // numbers are validated, so a hallucinating model cannot send a line
        // the room cannot draw.
        z.object({
          type: z.literal("widget"),
          text: z.string().default(""),
          widget: NumberLineWidgetSchema,
        }),
      ]),
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
 * Every balanced `{...}` block in the text, in document order. A provider
 * that ignores JSON mode (observed with a fallback model) can interleave an
 * internal analysis preamble with the real JSON payload at the end — and the
 * preamble's mini-fragments (e.g. `{ "type": "text", ... }`) fail the schema
 * while the trailing payload passes. Collecting ALL blocks (not just the first)
 * lets the parser reach that payload instead of surrendering to plain text.
 */
function collectBalancedBlocks(raw: string): string[] {
  const blocks: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== "{") continue;
    const end = lastBalanced(raw.slice(i));
    if (end > 0) blocks.push(raw.slice(i, i + end + 1));
  }
  return blocks;
}

/**
 * Tolerant parser: try JSON directly, then with fences stripped, then extract
 * every balanced {...} block. Falls back to a plain-text passthrough so a
 * provider without reliable JSON mode never bricks the tutor.
 */
export function parseTutorResponse(raw: string): TutorResponse {
  const trimmed = raw.trim();
  const attempts: string[] = [trimmed, stripFences(trimmed), ...collectBalancedBlocks(trimmed)];
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