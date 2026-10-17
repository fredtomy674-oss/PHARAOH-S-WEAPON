import { describe, expect, it } from "vitest";
import { AVATAR_STATE_AR, nextState, verdictEventFromReason, type AvatarState } from "./avatarStates.js";

describe("avatar state machine", () => {
  it("walks the speaking lifecycle on explicit audio events", () => {
    let state: AvatarState = "idle";
    state = nextState(state, "audio-start");
    expect(state).toBe("speaking");
    state = nextState(state, "audio-end");
    expect(state).toBe("idle");
  });

  it("enters listening only from idle via mic-open, thinking before answering", () => {
    expect(nextState("idle", "mic-open")).toBe("listening");
    expect(nextState("speaking", "mic-open")).toBe("speaking");
    expect(nextState("listening", "mic-close")).toBe("idle");
    expect(nextState("idle", "thinking-start")).toBe("thinking");
    expect(nextState("listening", "thinking-start")).toBe("thinking");
    expect(nextState("speaking", "thinking-start")).toBe("speaking");
    expect(nextState("thinking", "audio-start")).toBe("speaking");
  });

  it("lands verdicts only where a verdict was computed — never from silence", () => {
    expect(nextState("speaking", "verdict-correct")).toBe("correct");
    expect(nextState("idle", "verdict-partial")).toBe("partial");
    expect(nextState("idle", "verdict-incorrect")).toBe("incorrect");
    // Listening/thinking/off carry no verdict: silence is not an emotion.
    expect(nextState("listening", "verdict-incorrect")).toBe("listening");
    expect(nextState("thinking", "verdict-correct")).toBe("thinking");
    expect(nextState("off", "verdict-correct")).toBe("off");
  });

  it("a new audio turn always returns to speaking, and off swallows everything", () => {
    expect(nextState("correct", "audio-start")).toBe("speaking");
    expect(nextState("speaking", "toggle-off")).toBe("off");
    expect(nextState("off", "audio-start")).toBe("off");
    expect(nextState("off", "toggle-on")).toBe("idle");
  });

  it("labels every state in Arabic", () => {
    const states: AvatarState[] = ["idle", "listening", "thinking", "speaking", "correct", "partial", "incorrect", "off"];
    for (const s of states) expect(AVATAR_STATE_AR[s].length).toBeGreaterThan(0);
  });
});

describe("PHASE 162 — the room's real turn events", () => {
  it("a completed reply (no audio) ends thinking, and only thinking", () => {
    expect(nextState("thinking", "reply-done")).toBe("idle");
    expect(nextState("idle", "reply-done")).toBe("idle");
    expect(nextState("listening", "reply-done")).toBe("listening");
    expect(nextState("speaking", "reply-done")).toBe("speaking");
    expect(nextState("correct", "reply-done")).toBe("correct");
  });

  it("a verdict pose settles back to idle — and settling never invents a verdict", () => {
    expect(nextState("correct", "verdict-settle")).toBe("idle");
    expect(nextState("incorrect", "verdict-settle")).toBe("idle");
    expect(nextState("partial", "verdict-settle")).toBe("idle");
    // Settling a state that holds no verdict changes nothing.
    expect(nextState("idle", "verdict-settle")).toBe("idle");
    expect(nextState("speaking", "verdict-settle")).toBe("speaking");
    expect(nextState("listening", "verdict-settle")).toBe("listening");
    expect(nextState("thinking", "verdict-settle")).toBe("thinking");
    expect(nextState("off", "verdict-settle")).toBe("off");
  });

  it("maps only verdict-bearing engine reasons — teaching moves stay silent", () => {
    expect(verdictEventFromReason("answer_correct")).toBe("verdict-correct");
    expect(verdictEventFromReason("answer_wrong")).toBe("verdict-incorrect");
    expect(verdictEventFromReason("answer_wrong_prerequisite")).toBe("verdict-incorrect");
    // Teaching moves and missing reasons are not judgments.
    for (const reason of [
      null,
      undefined,
      "",
      "answer_unverified",
      "exercise_request",
      "hint_request",
      "explanation_request",
      "confused_first_time",
      "start_teaching",
      "understood_advance",
    ]) {
      expect(verdictEventFromReason(reason)).toBeNull();
    }
  });

  it("a wrong answer lands through the settle cycle exactly once", () => {
    let state: AvatarState = "idle";
    state = nextState(state, "verdict-incorrect");
    expect(state).toBe("incorrect");
    state = nextState(state, "verdict-settle");
    expect(state).toBe("idle");
    // A new audio turn still wins over any lingering pose.
    state = nextState("correct", "audio-start");
    expect(state).toBe("speaking");
  });
});
