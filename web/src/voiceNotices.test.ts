import { describe, expect, it } from "vitest";
import {
  LIVE_MAX_UTTERANCE_CHARS,
  SERVER_VOICE_DOWN_NOTE,
  missingVoiceNotice,
  voicePlatform,
} from "./voice.js";

/**
 * PHASE 172 — the owner's phone presented the tutor going silent and then read
 * a notice about opening *Windows* settings: a phone cannot follow that, and a
 * notice that names the wrong machine is just an apology. Every platform's
 * wording is pinned here, because the notice is the only thing a blocked
 * student ever sees.
 */
describe("PHASE 172 — the missing-voice notice names a path the reader can walk", () => {
  it("android names the free Google-TTS install path", () => {
    const notice = missingVoiceNotice("ar", "android");
    expect(notice).toContain("لا يوجد صوت العربية");
    expect(notice).toContain("تحويل النصّ إلى كلام");
    expect(notice).toContain("Google");
    expect(notice).not.toContain("ويندوز");
  });

  it("ios names Settings → Accessibility → Spoken Content", () => {
    const notice = missingVoiceNotice("ar", "ios");
    expect(notice).toContain("إمكانية الوصول");
    expect(notice).toContain("المحتوى المنطوق");
    expect(notice).not.toContain("ويندوز");
  });

  it("desktop keeps the Windows path — the original audience", () => {
    // The established E2E contract (A6) reads these words on the Windows suite.
    expect(missingVoiceNotice("ar", "desktop")).toContain("Language options");
    expect(missingVoiceNotice("ar", "desktop")).toContain("ويندوز");
  });

  it("the language is named, and a non-Arabic lesson names its own", () => {
    expect(missingVoiceNotice("en", "android")).toContain("لا يوجد صوت الإنجليزية");
    expect(missingVoiceNotice("ar", "android")).toContain("مجاني");
  });

  it("the platform answer never throws without a browser and defaults to desktop", () => {
    // vitest runs on node: `navigator` may be missing or be the Node user agent.
    expect(voicePlatform()).toBe("desktop");
  });

  it("the server-down note stands alone as a fact, and is not part of the base notice", () => {
    expect(SERVER_VOICE_DOWN_NOTE).toContain("رصيد النطق");
    expect(missingVoiceNotice("ar", "android")).not.toContain("رصيد النطق");
  });

  it("the text bound and the notice tell one story: a bounded question, never a refused one", () => {
    // The message route refuses past 4000; the live tracker releases far earlier.
    expect(LIVE_MAX_UTTERANCE_CHARS).toBeLessThan(4000);
  });
});
