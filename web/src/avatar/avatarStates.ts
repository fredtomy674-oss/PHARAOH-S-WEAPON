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
  }
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
