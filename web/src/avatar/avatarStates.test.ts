import { describe, expect, it } from "vitest";
import { AVATAR_STATE_AR, nextState, type AvatarState } from "./avatarStates.js";

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
