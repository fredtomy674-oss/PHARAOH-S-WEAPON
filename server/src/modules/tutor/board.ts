/**
 * PHASE 166 — «سبورة الفصل الحيّة» (the classroom board).
 *
 * The room has always had a board the STUDENT draws on. This module adds what a
 * real classroom board also carries: what the TEACHER writes while explaining.
 * Every tutor reply may bring a short write-up — a title and a few short lines
 * (the key idea, the solved steps, the example or problem) — and the room puts
 * it on the board, the way a chalk board carries «أهم ما يجب أن يبقى أمام عين
 * الطالب» while the teacher talks.
 *
 * Three rules shape this contract:
 *
 *  • The board is DATA the model emits, so it is sanitized on the way in — a
 *    model that writes an essay on the board must not push the student's own
 *    drawing off it. Hard caps below; a line that overflows is trimmed, never
 *    a reason to lose the reply.
 *  • A malformed board NEVER kills a reply: the field is parsed leniently in
 *    `responseProcessor.ts` (`z.unknown()`) and this module decides what is
 *    drawable — the vocabulary of `widgets.ts` (validate, then degrade).
 *  • The board is what the STUDENT sees, so it must not answer the teacher's
 *    own exercise: the prompt forbids answer keys here, and nothing in a board
 *    line is ever resolved against a stored key.
 */

import { stripEmoji } from "../../utils/text.js";

/** Hard limits: a board the room cannot show is a board the model may not send. */
export const BOARD_MAX_LINES = 6;
export const BOARD_LINE_MAX_CHARS = 72;
export const BOARD_TITLE_MAX_CHARS = 48;

/** What a chalk line IS, so the room can mark it (a step, an example, a result…). */
export const BOARD_LINE_KINDS = ["point", "step", "example", "answer", "note"] as const;
export type BoardLineKind = (typeof BOARD_LINE_KINDS)[number];

export interface BoardLine {
  kind: BoardLineKind;
  text: string;
}

/** The board one reply wrote: a short title (optional) and its lines. */
export interface TutorBoard {
  title: string | null;
  lines: BoardLine[];
}

function isKind(raw: unknown): raw is BoardLineKind {
  return typeof raw === "string" && (BOARD_LINE_KINDS as readonly string[]).includes(raw);
}

/** One clean line: whitespace collapsed, trimmed, capped; empty → null. */
function cleanText(raw: string, maxChars: number): string | null {
  // PHASE 187 — the board is part of the reply the student sees. An emoji here
  // would still be a pictograph on the classroom wall, so it is cleaned with the
  // same rule as the spoken words.
  const text = stripEmoji(raw).replace(/\s+/g, " ").trim();
  if (!text) return null;
  // Cut on a word boundary when one is near the cap, so a trimmed line does not
  // end mid-word (the room shows the board as-is; a broken word reads wrong).
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * What the model actually wrote → what the room can draw, or null.
 *
 * Tolerant by design (like `parseTutorResponse`): a line may arrive as a plain
 * string or as `{ kind, text }`; an unknown `kind` degrades to "point" instead
 * of discarding the line; empty lines are dropped; the caps are enforced here,
 * not trusted from the model.
 */
export function sanitizeBoard(raw: unknown): TutorBoard | null {
  if (raw === null || typeof raw !== "object") return null;
  const source = raw as { title?: unknown; lines?: unknown };

  const title =
    typeof source.title === "string" ? cleanText(source.title, BOARD_TITLE_MAX_CHARS) : null;

  const lines: BoardLine[] = [];
  const rawLines = Array.isArray(source.lines) ? source.lines : [];
  for (const item of rawLines) {
    const text =
      typeof item === "string"
        ? cleanText(item, BOARD_LINE_MAX_CHARS)
        : item !== null && typeof item === "object" && typeof (item as { text?: unknown }).text === "string"
          ? cleanText((item as { text: string }).text, BOARD_LINE_MAX_CHARS)
          : null;
    if (text === null) continue;
    const kindRaw = item !== null && typeof item === "object" ? (item as { kind?: unknown }).kind : undefined;
    lines.push({ kind: isKind(kindRaw) ? kindRaw : "point", text });
    if (lines.length >= BOARD_MAX_LINES) break;
  }

  if (title === null && lines.length === 0) return null;
  return { title, lines };
}

/** Parse one stored board cell — a row written by an older build is "no board", never a 500. */
export function parseStoredBoard(raw: string | null | undefined): TutorBoard | null {
  if (!raw) return null;
  try {
    return sanitizeBoard(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** The wire view of a board: identical to the stored one (nothing here is secret). */
export function boardForWire(board: TutorBoard | null): TutorBoard | undefined {
  if (!board) return undefined;
  const sanitized = sanitizeBoard(board);
  return sanitized ?? undefined;
}
