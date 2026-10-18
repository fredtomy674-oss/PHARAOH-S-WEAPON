import { describe, expect, it } from "vitest";
import {
  classifyLiveUtterance,
  normalizeForMatch,
  novelTokenCount,
  shouldYieldFloor,
  tokenizeForMatch,
  visibleLiveCaption,
} from "./echoGuard.js";

/**
 * PHASE 169 — the owner-reported loop, proved closed here: his tutor «سمع صوته
 * ونطق ردّه… كأني أنا الذي أتكلم» and answered itself. These are the rules
 * that decide whose words a transcript is; they are pure and browser-free on
 * purpose, because this is the part that must never be wrong.
 */
describe("PHASE 169 — echo exclusion", () => {
  const tutor = "الجمع بإعادة التجميع يعني أن نجمع العشرات أولا ثم الوحدات. هذه خطوة مهمة";

  it("normalises Arabic for matching only (tashkeel, hamza forms, punctuation)", () => {
    expect(normalizeForMatch("الجَمْعُ بإعَادَةِ التَّجْمِيع!")).toBe("الجمع باعاده التجميع");
    expect(tokenizeForMatch("  نجمع، العشرات.  ")).toEqual(["نجمع", "العشرات"]);
    expect(tokenizeForMatch("***")).toEqual([]);
  });

  it("counts the words the tutor never said", () => {
    expect(novelTokenCount("بإعادة التجميع والعشرات", tutor)).toBe(0);
    expect(novelTokenCount("اشرح بمثال", tutor)).toBe(2);
    // A shared four-letter stem counts as the same word …
    expect(novelTokenCount("العشرتين", tutor)).toBe(0);
    // … but never for short words (a 3-letter stem would match too much).
    expect(novelTokenCount("ثم", tutor)).toBe(0);
  });

  it("with the tutor silent, everything heard is the student", () => {
    expect(
      classifyLiveUtterance({ text: "بإعادة التجميع", tutorText: tutor, tutorAudible: false, userVoice: false }),
    ).toBe("user");
  });

  it("the tutor's own sentence can never become a question", () => {
    // The exact reported loop: the speaker read the tutor's words back.
    expect(
      classifyLiveUtterance({ text: "بإعادة التجميع يعني أن نجمع", tutorText: tutor, tutorAudible: true, userVoice: false }),
    ).toBe("echo");
    // Even when the microphone *believes* it heard a voice: echo-rated words
    // are never the student's.
    expect(
      classifyLiveUtterance({ text: "بإعادة التجميع يعني أن نجمع", tutorText: tutor, tutorAudible: true, userVoice: true }),
    ).toBe("echo");
  });

  it("a real interruption over the tutor is the student's", () => {
    expect(
      classifyLiveUtterance({ text: "لحظة أستاذ اشرح بمثال", tutorText: tutor, tutorAudible: true, userVoice: false }),
    ).toBe("user");
    // One word that is not the tutor's needs the microphone's voice evidence.
    expect(
      classifyLiveUtterance({ text: "لحظة", tutorText: tutor, tutorAudible: true, userVoice: true }),
    ).toBe("user");
    expect(
      classifyLiveUtterance({ text: "لحظة", tutorText: tutor, tutorAudible: true, userVoice: false }),
    ).toBe("echo");
  });

  it("yields the floor only on real words (or real voice over the tutor)", () => {
    expect(shouldYieldFloor({ text: "بإعادة التجميع", tutorText: tutor, userVoiceRecently: false })).toBe(false);
    expect(shouldYieldFloor({ text: "لحظة", tutorText: tutor, userVoiceRecently: false })).toBe(false);
    expect(shouldYieldFloor({ text: "لحظة", tutorText: tutor, userVoiceRecently: true })).toBe(true);
    expect(shouldYieldFloor({ text: "اشرح بمثال", tutorText: tutor, userVoiceRecently: false })).toBe(true);
  });

  it("the live caption shows the student's words, never the echo", () => {
    expect(visibleLiveCaption({ text: "بإعادة التجميع", tutorText: tutor, tutorAudible: true })).toBe(false);
    expect(visibleLiveCaption({ text: "لحظة", tutorText: tutor, tutorAudible: true })).toBe(true);
    expect(visibleLiveCaption({ text: "بإعادة التجميع", tutorText: tutor, tutorAudible: false })).toBe(true);
  });
});
