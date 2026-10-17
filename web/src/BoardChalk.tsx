import type { BoardLineKind, TutorBoard } from "./api.js";

/**
 * PHASE 166 — «طباشير السبورة»: what the teacher writes while explaining.
 *
 * The room's board always carried the student's own ink. This layer adds what a
 * real classroom board also has: the teacher's write-up of the lesson — a short
 * title and a few short lines (the key idea, the steps, the example, the
 * result), refreshed with every reply the way a teacher wipes and rewrites the
 * board while the class moves on.
 *
 * It is a pure view over a stored, sanitized payload (server `tutor/board.ts`
 * caps count and length): no state, no effects, nothing here can invent a line.
 * It sits BENEATH the ink canvas with `pointer-events: none`, so the student
 * still draws "over" the board the way he would in class — his strokes travel
 * to the tutor as before and the chalk is untouched by them.
 */

/** Leading mark per line kind — chalk, not chrome; the digits count steps. */
const KIND_MARK: Record<BoardLineKind, string> = {
  point: "•",
  step: "١",
  example: "✎",
  answer: "✓",
  note: "✱",
};

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function arabicNumeral(value: number): string {
  return String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]!);
}

export default function BoardChalk({ board }: { board: TutorBoard }) {
  let step = 0;
  return (
    <div className="board-chalk" data-testid="board-chalk" aria-label="ما كتبه المعلّم على السبورة">
      {board.title && (
        <div className="board-chalk-title" data-testid="board-chalk-title">
          {board.title}
        </div>
      )}
      <ul className="board-chalk-lines">
        {board.lines.map((line, index) => {
          const mark = line.kind === "step" ? arabicNumeral(++step) : KIND_MARK[line.kind];
          return (
            <li
              key={`${index}-${line.text}`}
              className="board-chalk-line"
              data-testid="board-chalk-line"
              data-kind={line.kind}
              // A chalk line "lands" one after the other; `prefers-reduced-motion`
              // removes the motion, never the line (see styles.css).
              style={{ animationDelay: `${Math.min(index, 5) * 130}ms` }}
            >
              <span className="board-chalk-mark" aria-hidden="true">
                {mark}
              </span>
              <span className="board-chalk-text">{line.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
