import { describe, expect, it } from "vitest";
import { applyPronunciation, pronounceForSpeech } from "../../src/modules/tutor/pronunciation.js";

/**
 * PHASE 188 — the speech layer must read the curriculum word correctly even
 * when the model's own tashkeel is missing. These tests pin the properties the
 * voice depends on: prefix-aware replacement, idempotence, and no damage to
 * Latin text or to a word that is already vocalised.
 */
describe("PHASE 188 — Arabic pronunciation layer", () => {
  it("vocalises high-risk science terms in the forms a reply actually uses", () => {
    const text = "الفلزات والفلزات وبالفلزات وللفلزات، والذرة والجزيء والمركب.";
    expect(applyPronunciation(text, "ar")).toBe(
      "الفِلِزّات والفِلِزّات وبالفِلِزّات وللفِلِزّات، والذَّرَّة والجُزَيْء والمُرَكَّب.",
    );
  });

  it("vocalises a multi-word term as a phrase, not word by word", () => {
    expect(applyPronunciation("الخطوة القادمة: اكتب المثال.", "ar")).toBe(
      "الخَطْوة القادِمة: اكتب المِثال.",
    );
    expect(applyPronunciation("الرقم الهيدروجيني للحمض", "ar")).toBe(
      "الرَّقْم الهِيدْرُوجِينِي للحِمْض",
    );
  });

  it("keeps a bare conjunction or preposition attached to the word", () => {
    expect(applyPronunciation("وسؤال وكتاب بالسؤال", "ar")).toBe(
      "وسُؤال وكِتاب بالسُّؤال",
    );
    // Electrode names are transliterations, not words the TTS can infer:
    // «أَنُود» (not أَنْوْد) and «كَاثُود» carry the vowel the textbook uses.
    expect(applyPronunciation("الأنود والكاثود", "ar")).toBe("الأَنُود والكَاثُود");
  });

  it("is idempotent and never disturbs a word that is already vocalised", () => {
    const once = applyPronunciation("الفِلِزّات والجُزَيْء", "ar");
    expect(once).toBe("الفِلِزّات والجُزَيْء");
    expect(applyPronunciation(once, "ar")).toBe(once);
  });

  it("leaves Latin, arithmetic and non-Arabic lessons untouched", () => {
    expect(applyPronunciation("pH = 7 و H2O", "ar")).toBe("pH = 7 و H2O");
    expect(applyPronunciation("الفلزات", "en")).toBe("الفلزات");
    expect(applyPronunciation("الفلزات", "fr")).toBe("الفلزات");
    expect(applyPronunciation("الفلزات", "de")).toBe("الفلزات");
  });

  it("exports the same rule under the speech name", () => {
    expect(pronounceForSpeech("الخلية", "ar")).toBe("الخَلِيَّة");
  });
});
