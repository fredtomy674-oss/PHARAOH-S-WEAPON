import { describe, expect, it } from "vitest";
import { stripMarkdownForSpeech } from "../../src/modules/ai/speech/stripMarkdown.js";

/**
 * PHASE 53 — spoken words, not syntax: the narration route must read what the
 * student sees, not the markers.
 *
 * This is the server twin of the web `stripMarkdown` (web/src/format.ts). The
 * two are implemented independently (neither package builds against the other),
 * so this file pins the shared cases with identical literals on both sides —
 * web rendering is covered by e2e/formatting.spec.ts instead.
 */
describe("stripMarkdownForSpeech (PHASE 53)", () => {
  it("removes bold and list markers but keeps every word", () => {
    expect(stripMarkdownForSpeech("سؤال جيد! سأشرح ببساطة.\n\n💡 **تلميح:**\n- فكّر في المثال الأول\n- أخبرني بما توصلت إليه")).toBe(
      "سؤال جيد! سأشرح ببساطة.\n💡 تلميح:\nفكّر في المثال الأول\nأخبرني بما توصلت إليه",
    );
  });

  it("numbers steps and keeps code words", () => {
    expect(stripMarkdownForSpeech("خطوات الحل:\n1. اجمع الآحاد\n2. اجمع العشرات\nالناتج `845`.")).toBe(
      "خطوات الحل:\nاجمع الآحاد\nاجمع العشرات\nالناتج 845.",
    );
  });

  it("keeps unclosed markers out of the voice", () => {
    expect(stripMarkdownForSpeech("نص **تلمي")).toBe("نص تلمي");
  });

  it("never mistakes math for markup", () => {
    expect(stripMarkdownForSpeech("2 * 3 = 6")).toBe("2 * 3 = 6");
    expect(stripMarkdownForSpeech("مجموعة القواسم {1، 2}")).toBe("مجموعة القواسم {1، 2}");
  });

  it("leaves plain replies untouched", () => {
    expect(stripMarkdownForSpeech("أهلاً بك يا بطل! لنراجع قابلية القسمة.")).toBe("أهلاً بك يا بطل! لنراجع قابلية القسمة.");
  });
});
