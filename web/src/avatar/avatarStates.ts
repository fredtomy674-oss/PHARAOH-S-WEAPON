// Avatar Lab — explicit state machine for the teacher's presence.
//
// States are entered ONLY on explicit events (audio started/ended, a verdict
// the engine computed, the tester pressing a button). Silence alone never
// implies an emotion: a quiet student is thinking, not failing, and the avatar
// must not perform disappointment it was never told about.

export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "correct"
  | "partial"
  | "incorrect"
  | "off";

export type AvatarEvent =
  | "mic-open"
  | "mic-close"
  | "thinking-start"
  | "audio-start"
  | "audio-end"
  | "verdict-correct"
  | "verdict-partial"
  | "verdict-incorrect"
  /** PHASE 162 — the turn completed with no audio to play: thinking ends. */
  | "reply-done"
  /** PHASE 162 — the verdict pose's display window elapsed; the lesson moved on. */
  | "verdict-settle"
  | "toggle-off"
  | "toggle-on";

const VERDICT_FROM: ReadonlySet<AvatarState> = new Set(["idle", "speaking", "correct", "partial", "incorrect"]);

/**
 * Deterministic transition. `off` swallows everything except `toggle-on`;
 * a new audio turn always takes the avatar back to `speaking` (even from a
 * verdict pose — the lesson moved on); verdicts land from any performing
 * state, never from `listening`/`thinking`/`off` (no verdict was computed).
 */
export function nextState(state: AvatarState, event: AvatarEvent): AvatarState {
  if (event === "toggle-off") return "off";
  if (state === "off") return event === "toggle-on" ? "idle" : "off";
  switch (event) {
    case "toggle-on":
      return "idle";
    case "mic-open":
      return state === "idle" ? "listening" : state;
    case "mic-close":
      return state === "listening" ? "idle" : state;
    case "thinking-start":
      return state === "idle" || state === "listening" ? "thinking" : state;
    case "audio-start":
      return "speaking";
    case "audio-end":
      return state === "speaking" ? "idle" : state;
    case "verdict-correct":
      return VERDICT_FROM.has(state) ? "correct" : state;
    case "verdict-partial":
      return VERDICT_FROM.has(state) ? "partial" : state;
    case "verdict-incorrect":
      return VERDICT_FROM.has(state) ? "incorrect" : state;
    case "reply-done":
      // PHASE 162 — a real turn end (the reply is complete and no audio played).
      // Only `thinking` is waiting on exactly this; every other state moves on
      // through its own events (audio, mic, verdict).
      return state === "thinking" ? "idle" : state;
    case "verdict-settle":
      // PHASE 162 — presentation timing of a REAL verdict: the pose is held for
      // its moment, then the lesson continues. Never fires from a non-verdict
      // state, so it can only end a pose the engine actually produced.
      return state === "correct" || state === "partial" || state === "incorrect" ? "idle" : state;
  }
}

/**
 * PHASE 162 — the engine's teaching-action `reason` → the avatar event it is.
 *
 * The wire carries the engine's decision (WHY it reacted), and only two reasons
 * carry a verdict about the student's answer: `answer_correct` (celebrate_progress)
 * and the wrong-answer pair (`hint` with `answer_wrong`, `review_prerequisite`
 * with `answer_wrong_prerequisite`). Everything else is a teaching move, not a
 * judgment — and the server has no `partial` verdict at all (boolean|null), so
 * `partial` stays reachable only from explicit Lab events. Honest by omission.
 */
export function verdictEventFromReason(reason: string | null | undefined): AvatarEvent | null {
  if (reason === "answer_correct") return "verdict-correct";
  if (reason === "answer_wrong" || reason === "answer_wrong_prerequisite") return "verdict-incorrect";
  return null;
}

/** Arabic label for the Lab's state buttons and status line. */
export const AVATAR_STATE_AR: Record<AvatarState, string> = {
  idle: "انتظار",
  listening: "استماع",
  thinking: "تفكير",
  speaking: "كلام",
  correct: "إجابة صحيحة",
  partial: "إجابة جزئية",
  incorrect: "إجابة خاطئة",
  off: "مطفأ",
};
