import { describe, expect, it } from "vitest";
import { previewText, stripEmoji, stripMarkdown } from "./format.js";

/**
 * PHASE 187 — the browser reads old replies too.
 *
 * The server cleans new tutor replies at the source, but a transcript loaded
 * from before the change still contains the pictographs that were being spoken.
 * `stripMarkdown` is both the renderer's projection and the browser voice's
 * input, so cleaning here fixes the room and the fallback voice together.
 */
describe("tutor reply text (PHASE 187)", () => {
  it("removes emoji from the displayed and spoken projection", () => {
    expect(stripMarkdown("أهلاً 👋 يا بطل.\n\n✅ **صح!**\n❌ غلط.")).toBe(
      "أهلاً يا بطل.\nصح! غلط.",
    );
    expect(stripMarkdown("💡 **تلميح:**\n- راجع المثال\n- جاوب")).toBe("تلميح:\nراجع المثال\nجاوب");
  });

  it("keeps Arabic harakat and arithmetic signs intact", () => {
    expect(stripMarkdown("القِسْمَة على ٢ × ٣ = ٦")).toBe("القِسْمَة على ٢ × ٣ = ٦");
    expect(stripEmoji("الفتحة ﹷ والضمة ﹹ")).toBe("الفتحة ﹷ والضمة ﹹ");
  });

  it("cleans the live preview before it reaches the screen", () => {
    const preview = previewText("أهلاً 👋\n**تلميح");
    expect(preview).toBe("أهلاً");
    expect(preview).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});
