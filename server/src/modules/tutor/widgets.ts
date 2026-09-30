import { z } from "zod";

/**
 * PHASE 51 — «خط الأعداد»: the tutor draws a number line inside its own reply,
 * the student drags a pin on it, and the tutor verifies the position.
 *
 * The widget is *data*, not decoration: every number is validated on the way
 * in (a model that invents `from: "a lot"` must not reach the room), the
 * correct answer travels to the prompt but never to the browser, and the
 * verification key is resolved from the stored transcript — never from the
 * client's echo of it.
 */

/** Hard limits: a line the room cannot draw is a line the model may not send. */
const MAX_SPAN = 1000;
const MAX_TICKS = 101;
const MAX_MARKERS = 20;
const MAX_LABEL_CHARS = 40;
const MAX_QUESTION_CHARS = 300;

export const NumberLineWidgetSchema = z.object({
  kind: z.literal("numberline"),
  from: z.number().finite(),
  to: z.number().finite(),
  step: z.number().finite().positive(),
  markers: z
    .array(
      z.object({
        value: z.number().finite(),
        label: z.string().max(MAX_LABEL_CHARS).optional(),
      }),
    )
    .max(MAX_MARKERS)
    .optional()
    .default([]),
  question: z.string().max(MAX_QUESTION_CHARS).optional(),
  /**
   * The correct pin position (the teacher's answer key). Stored server-side and
   * fed to the prompt on verification — stripped before anything reaches the
   * browser, or the exercise would answer itself in devtools.
   */
  answer: z.number().finite().optional(),
});

export type NumberLineWidget = z.infer<typeof NumberLineWidgetSchema>;

/**
 * What the browser receives: the line without its answer key. A student who
 * opens the network tab finds the question, never the answer.
 */
export type NumberLineView = Omit<NumberLineWidget, "answer">;

/**
 * Validate a model-emitted widget. Returns the sanitized line, or null when
 * the numbers do not draw: reversed range, a step that would paint a thousand
 * ticks, markers off the line, or an answer key outside the line.
 */
export function parseNumberLineWidget(raw: unknown): NumberLineWidget | null {
  const result = NumberLineWidgetSchema.safeParse(raw);
  if (!result.success) return null;
  const w = result.data;
  if (!(w.from < w.to)) return null;
  const span = w.to - w.from;
  if (span > MAX_SPAN) return null;
  if (span / w.step > MAX_TICKS) return null;
  if (w.markers.some((m) => m.value < w.from || m.value > w.to)) return null;
  if (w.answer !== undefined && (w.answer < w.from || w.answer > w.to)) return null;
  return w;
}

/** Parse tolerantly — a row written by an older build, or hand-edited, is "no widgets", never a 500. */
export function parseStoredWidgets(raw: string | null): NumberLineWidget[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    const widgets = parsed.map(parseNumberLineWidget).filter((w): w is NumberLineWidget => w !== null);
    return widgets.length > 0 ? widgets : undefined;
  } catch {
    return undefined;
  }
}

/** The wire view of stored widgets: same lines, no answer keys. */
export function widgetsForWire(stored: NumberLineWidget[] | undefined): NumberLineView[] | undefined {
  if (!stored) return undefined;
  const views = stored.map(({ answer: _answer, ...view }) => view);
  return views.length > 0 ? views : undefined;
}

/**
 * What the student placed, as sent by the room. Deliberately tiny: the value
 * of the pin, nothing else. Which line it belongs to and what the key is are
 * resolved server-side from the transcript, so a forged client cannot grade
 * itself correct.
 */
export const PinPlacementSchema = z.object({ value: z.number().finite() });

export type PinPlacement = z.infer<typeof PinPlacementSchema>;

/** Snap a pin to the line's own step — the tutor and the room must agree on the value. */
export function snapToStep(value: number, from: number, step: number): number {
  const n = Math.round((value - from) / step);
  // Round to 6 decimals: binary steps like 0.1 would otherwise print 0.30000000000000004.
  return Math.round((from + n * step) * 1e6) / 1e6;
}

interface WidgetPartLike {
  type: string;
  text?: string;
  widget?: unknown;
}

/**
 * Split a parsed reply's parts into display text parts and valid widgets.
 *
 * The schema guarantees *shape*; this guarantees *sense* (an ordered range, a
 * drawable tick count, markers on the line). A widget that fails sense is
 * demoted to its text fallback — the student still reads the explanation, he
 * just does not get a broken line.
 */
export function splitReplyWidgets(parts: WidgetPartLike[] | undefined): {
  parts: Array<{ type: "text" | "question" | "hint" | "example"; text: string }>;
  widgets: NumberLineWidget[];
} {
  const kept: Array<{ type: "text" | "question" | "hint" | "example"; text: string }> = [];
  const widgets: NumberLineWidget[] = [];
  for (const p of parts ?? []) {
    if (p.type === "widget") {
      const valid = parseNumberLineWidget(p.widget);
      if (valid) {
        widgets.push(valid);
        if ((p.text ?? "").trim().length > 0) kept.push({ type: "text", text: p.text! });
      } else if ((p.text ?? "").trim().length > 0) {
        kept.push({ type: "text", text: p.text! });
      }
      continue;
    }
    if (p.type === "text" || p.type === "question" || p.type === "hint" || p.type === "example") {
      kept.push({ type: p.type, text: p.text ?? "" });
    }
  }
  return { parts: kept, widgets };
}
