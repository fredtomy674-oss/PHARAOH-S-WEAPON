import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startLiveConversation, type LiveConversationCallbacks } from "./voice.js";

/**
 * PHASE 174 — the recovery ladder behind «المحادثة الحيّة لا تعمل»: the owner's
 * phone ended the whole mode on a capture-class recognition error (the same
 * error this project reproduced on a machine with no microphone: live mode
 * opens, says «أسمعك», then dies). The microphone's one extra consumer is the
 * echo probe, and the probe is an enhancement — so a capture failure drops the
 * probe and reopens the recognizer, and only a capture that fails twice with
 * no probe beside it ends the mode. The first permission refusal gets one
 * retry behind a getUserMedia oracle (the Android first-run grant race).
 *
 * These tests drive the ladder exactly like the browser does: fake recognition
 * instances, a seam probe, fake timers, and a stubbed permission oracle.
 */

type FakeRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

let made: FakeRec[] = [];

class FakeSpeechRecognition implements FakeRec {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() {
    made.push(this);
  }
  start(): void {
    /* the session is up the moment start() returns — same as a real engine */
  }
  stop(): void {
    this.onend?.();
  }
}

const g = globalThis as unknown as Record<string, unknown>;

const finalAt = (index: number, text: string) => ({ resultIndex: index, results: [{ isFinal: true, 0: { transcript: text } }] });

const callsOf = (): { callbacks: LiveConversationCallbacks; calls: { live: string[]; utterances: string[]; errors: (string | null)[]; ends: number; barge: number } } => {
  const calls = { live: [] as string[], utterances: [] as string[], errors: [] as (string | null)[], ends: 0, barge: 0 };
  const callbacks: LiveConversationCallbacks = {
    onLive: (text) => calls.live.push(text),
    onBargeIn: () => {
      calls.barge += 1;
    },
    onUtterance: (text) => calls.utterances.push(text),
    onError: (message) => calls.errors.push(message),
    onEnd: () => {
      calls.ends += 1;
    },
  };
  return { callbacks, calls };
};

let probeStops = 0;
let probeRequests = 0;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  made = [];
  probeStops = 0;
  probeRequests = 0;
  g.window = g;
  g.SpeechRecognition = FakeSpeechRecognition;
  g.__liveMicProbe = () => {
    probeRequests += 1;
    return { stop: () => { probeStops += 1; } };
  };
});

const setOracle = (getUserMedia: ((constraints: unknown) => Promise<unknown>) | undefined): void => {
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: getUserMedia ? { getUserMedia } : undefined,
    configurable: true,
  });
};

/** PHASE 175 — `navigator.maxTouchPoints`, the touch-first tell. */
const setTouchPoints = (points: number | null): void => {
  if (points === null) {
    delete (globalThis.navigator as unknown as Record<string, unknown>).maxTouchPoints;
    return;
  }
  Object.defineProperty(globalThis.navigator, "maxTouchPoints", { value: points, configurable: true });
};

afterEach(() => {
  vi.useRealTimers();
  delete g.window;
  delete g.SpeechRecognition;
  delete g.__liveMicProbe;
  setOracle(undefined);
  setTouchPoints(null);
});

describe("PHASE 174 — a capture failure drops the probe, never the mode", () => {
  it("audio-capture: the probe goes, the recognizer reopens, and the words still reach the tutor", async () => {
    setOracle(undefined);
    const { callbacks, calls } = callsOf();
    const handle = startLiveConversation(callbacks)!;
    expect(handle).not.toBeNull();
    expect(made.length).toBe(1);

    made[0].onerror?.({ error: "audio-capture" });
    expect(probeStops).toBe(1); // the field is cleared first
    expect(calls.errors).toEqual([]); // …and the mode does NOT die

    // A real engine also ends the failed session; that late end must not
    // double-open or flush anything.
    made[0].onend?.();
    await vi.advanceTimersByTimeAsync(799);
    expect(made.length).toBe(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(made.length).toBe(2); // reopened, probe-free

    // The reopened session hears a whole question; the silence releases it and
    // it is sent — the probe's absence costs latency, never the turn.
    made[1].onresult?.(finalAt(0, "ما هو ناتج جمع ٣ و ٤؟"));
    expect(calls.live.at(-1)).toBe("ما هو ناتج جمع ٣ و ٤؟");
    await vi.advanceTimersByTimeAsync(1200);
    expect(calls.utterances).toEqual(["ما هو ناتج جمع ٣ و ٤؟"]);
    expect(calls.errors).toEqual([]);
    expect(calls.ends).toBe(0);
    handle.stop();
    expect(calls.ends).toBe(1);
  });

  it("a capture that fails twice with no probe beside it is fatal — with the busy-mic words", async () => {
    setOracle(undefined);
    const { callbacks, calls } = callsOf();
    const handle = startLiveConversation(callbacks)!;

    made[0].onerror?.({ error: "audio-capture" });
    await vi.advanceTimersByTimeAsync(800);
    expect(made.length).toBe(2);
    made[1].onerror?.({ error: "audio-capture" });
    await vi.advanceTimersByTimeAsync(800);
    expect(made.length).toBe(3);

    // The third failure has nothing left to clear — the mode ends honestly.
    made[2].onerror?.({ error: "audio-capture" });
    expect(calls.errors).toHaveLength(1);
    expect(calls.errors[0]).toContain("تطبيق آخر");
    expect(calls.ends).toBe(1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(made.length).toBe(3); // nothing follows a fatal
    handle.stop(); // a stop after the end is a no-op
    expect(calls.ends).toBe(1);
  });
});

describe("PHASE 174 — the first permission refusal gets one retry behind the oracle", () => {
  it("a grant that raced the recognizer restores the mode", async () => {
    const gum = vi.fn(async () => ({ getTracks: () => [] }));
    setOracle(gum);
    const { callbacks, calls } = callsOf();
    const handle = startLiveConversation(callbacks)!;

    made[0].onerror?.({ error: "not-allowed" });
    expect(calls.errors).toEqual([]); // not fatal yet
    await vi.advanceTimersByTimeAsync(0); // the oracle answers
    expect(gum).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1200);
    expect(made.length).toBe(2); // the mode is back

    made[1].onresult?.(finalAt(0, "لحظة أستاذ، أعد الشرح"));
    await vi.advanceTimersByTimeAsync(1200);
    expect(calls.utterances).toEqual(["لحظة أستاذ، أعد الشرح"]);
    handle.stop();
  });

  it("…and a real refusal is fatal, with the permission words, without a second oracle call", async () => {
    const gum = vi.fn(async () => {
      throw new Error("denied");
    });
    setOracle(gum);
    const { callbacks, calls } = callsOf();
    startLiveConversation(callbacks)!;

    made[0].onerror?.({ error: "not-allowed" });
    await vi.advanceTimersByTimeAsync(0);
    expect(gum).toHaveBeenCalledTimes(1);
    expect(calls.errors).toHaveLength(1);
    expect(calls.errors[0]).toContain("غير مسموح");
    expect(calls.ends).toBe(1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(made.length).toBe(1);
  });

  it("no oracle on this machine: the refusal stays honest, instantly", () => {
    setOracle(undefined);
    const { callbacks, calls } = callsOf();
    startLiveConversation(callbacks)!;

    made[0].onerror?.({ error: "not-allowed" });
    expect(calls.errors).toHaveLength(1);
    expect(calls.errors[0]).toContain("غير مسموح");
    expect(calls.ends).toBe(1);
  });
});

describe("PHASE 175 — «أذن واحدة»: a touch-first device listens like the dictation key", () => {
  it("opens a single-utterance session and never asks for the probe", () => {
    setTouchPoints(1);
    const { callbacks } = callsOf();
    const handle = startLiveConversation(callbacks)!;
    expect(made.length).toBe(1);
    // The dictation shape the owner's phone proved it can hear…
    expect(made[0].continuous).toBe(false);
    expect(made[0].interimResults).toBe(true);
    // …and no probe beside it: on this device class the second claim on the
    // microphone is what left the words unheard.
    expect(probeRequests).toBe(0);
    expect(probeStops).toBe(0);
    handle.stop();
  });

  it("a desktop keeps the continuous session and the probe", () => {
    setTouchPoints(0);
    const { callbacks } = callsOf();
    const handle = startLiveConversation(callbacks)!;
    expect(made[0].continuous).toBe(true);
    expect(probeRequests).toBe(1);
    handle.stop();
    expect(probeStops).toBe(1);
  });

  it("a word-less nine seconds clear the field once — probe dropped, session rebuilt — and the words that follow still land", async () => {
    setTouchPoints(0);
    const { callbacks, calls } = callsOf();
    const handle = startLiveConversation(callbacks)!;
    expect(made.length).toBe(1);

    await vi.advanceTimersByTimeAsync(8_999);
    expect(probeStops).toBe(0); // not a moment before the nine
    await vi.advanceTimersByTimeAsync(2);
    expect(probeStops).toBe(1); // the field is cleared at the ninth second
    await vi.advanceTimersByTimeAsync(600);
    expect(made.length).toBe(2); // …and the session is rebuilt

    // The child speaks — the hint's own advice — and the fresh session carries
    // the whole turn: the rescue is invisible except for the words landing.
    made[1].onresult?.(finalAt(0, "اشرح لي الجمع مع إعادة التجميع"));
    await vi.advanceTimersByTimeAsync(1_200);
    expect(calls.utterances).toEqual(["اشرح لي الجمع مع إعادة التجميع"]);
    expect(calls.errors).toEqual([]);

    // One shot per session: another quiet stretch changes nothing.
    await vi.advanceTimersByTimeAsync(20_000);
    expect(probeStops).toBe(1);
    expect(made.length).toBe(2);
    handle.stop();
  });

  it("a touch device has nothing to clear — its sessions cycle on their own and no restart is forced", async () => {
    setTouchPoints(1);
    const { callbacks } = callsOf();
    const handle = startLiveConversation(callbacks)!;
    await vi.advanceTimersByTimeAsync(9_500);
    expect(probeStops).toBe(0);
    expect(made.length).toBe(1); // no reset churn on the phone recipe
    handle.stop();
  });
});
