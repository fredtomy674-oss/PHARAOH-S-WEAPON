import { describe, expect, it } from "vitest";
import { parseSourceBlocks } from "./sourceMarkdown.js";

describe("lesson source Markdown tables (PHASE 182)", () => {
  it("turns a pipe table into header + rows instead of showing raw pipes", () => {
    const blocks = parseSourceBlocks("| الكلمة | المعنى |\n| --- | --- |\n| نهر | مجرى ماء |\n| واحة | أرض خضراء |");
    expect(blocks).toEqual([
      {
        kind: "table",
        header: ["الكلمة", "المعنى"],
        rows: [
          ["نهر", "مجرى ماء"],
          ["واحة", "أرض خضراء"],
        ],
      },
    ]);
  });

  it("keeps headings, lists and paragraphs around a table", () => {
    const blocks = parseSourceBlocks("## مقارنة\n\n- الأولى\n- الثانية\n\n| أ | ب |\n|:--:|--:|\n| 1 | 2 |\n\nخلاصة.");
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "list", "table", "paragraph"]);
  });

  it("does not treat a lone pipe line as a table", () => {
    const blocks = parseSourceBlocks("نستخدم | للفصل أحيانًا.");
    expect(blocks).toEqual([{ kind: "paragraph", text: "نستخدم | للفصل أحيانًا." }]);
  });

  it("leaves a malformed separator row as words", () => {
    const blocks = parseSourceBlocks("| أ | ب |\n| لا | ليس |\n| 1 | 2 |");
    expect(blocks[0]?.kind).toBe("paragraph");
  });
});
