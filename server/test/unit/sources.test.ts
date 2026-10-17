import { describe, expect, it } from "vitest";
import { buildLessonSources, foldArabic, truncateText, type SourcesInput } from "../../src/modules/sources/sources.js";

/**
 * PHASE 160 (W5) — the six study sources are a pure deterministic function of
 * the lesson's own pages. These tests pin the rules that make the tabs
 * trustworthy: the book's own labels drive extraction, tasks/questions never
 * become cards, every book-derived line keeps its printed page, and the same
 * pages always yield the same output (the server caches it forever).
 */

const PAGES: SourcesInput = {
  concepts: [{ title: "أستطيع أن أضيف عددين ضمن 999" }],
  pages: [
    {
      bookPage: 10,
      text: [
        "هدف التعلم",
        ". أستطيع أن أستنتج قابلية القسمة على 2 ، 3 ، 4 ، 5 ،",
        "10 ، 6",
        "ممارسات صفية",
        ". تقديم براهين قابلة للتطبيق ونقد أفكار الآخرين.",
        "استكشف",
        "مسائل حياتية فيما يلي عدد المتطوعين في 6 مدن بجمهورية مصر العربية.",
        "تعلم وفكر",
        "الجمع عملية تجميع المجموعات معًا.",
        "الجمع يُقصد به ضم مجموعة إلى مجموعة أخرى.",
        "انتبه: لا تجمع إلا المتشابهات.",
        "لقد تعلمت في الصف السابق أن الطرح عكس الجمع.",
        "تذكر أن تراجع خطواتك دائمًا.",
        "الأعداد الزوجية هي: ....................................",
        "21 ، 102 ، 225 ، 120",
        "g g g",
        "| العدد | يقبل القسمة على 2 |",
      ].join("\n"),
    },
    {
      bookPage: 11,
      text: [
        "هيا نتحدث معا ناقش مع زميلك خطوات الحل.",
        "\" ناقش مع زملائك واستنتج قاعدة الحل.",
        ". ما ناتج 3 + 5 ؟",
        "مثال",
        "لدى سارة 4 تفاحات وأخذت 2، فكم تبقى معها؟",
        "الحل",
        "4 − 2 = 2",
        "Photo Credit: somebody / Shutterstock.com",
      ].join("\n"),
    },
  ],
};

describe("buildLessonSources — PHASE 160 (W5)", () => {
  const sources = buildLessonSources(PAGES);

  it("reads the lesson's own pages and keeps the printed page on every line", () => {
    expect(sources.hasBookText).toBe(true);
    expect(sources.pageRange).toEqual({ from: 10, to: 11 });

    for (const item of [...sources.summary, ...sources.definitions, ...sources.cards, ...sources.examples, ...sources.errors]) {
      expect(typeof item.page).toBe("number");
      expect(item.page).toBeGreaterThanOrEqual(10);
      expect(item.page).toBeLessThanOrEqual(11);
    }
  });

  it("summarises with the book's own objectives — OCR line breaks merged back", () => {
    const first = sources.summary[0]!;
    expect(first.kind).toBe("objective");
    expect(first.text).toBe("أستطيع أن أستنتج قابلية القسمة على 2 ، 3 ، 4 ، 5 ، 10 ، 6");
    expect(first.page).toBe(10);
    // …plus the topic sentence that opens the «تعلم وفكر» block.
    expect(sources.summary.some((i) => i.kind === "idea" && i.text.includes("الجمع عملية تجميع"))).toBe(true);
  });

  it("extracts definitions with their term — and only real definition sentences", () => {
    const def = sources.definitions.find((i) => i.text.includes("يُقصد به"));
    expect(def).toBeDefined();
    expect(def!.term).toBe("الجمع");
    expect(def!.page).toBe(10);
    // «الجمع عملية تجميع المجموعات معًا.» is a statement, not a definition.
    expect(sources.definitions.some((i) => i.text.includes("عملية تجميع المجموعات"))).toBe(false);
  });

  it("types the cards, counts them, and never turns a task or a question into one", () => {
    const byCard = (card: string) => sources.cards.filter((c) => c.card === card);
    expect(byCard("watch").some((c) => c.text.includes("لا تجمع إلا المتشابهات"))).toBe(true);
    expect(byCard("remember").some((c) => c.text.includes("تراجع خطواتك"))).toBe(true);
    expect(byCard("connect").some((c) => c.text.includes("الطرح عكس الجمع"))).toBe(true);
    expect(byCard("understand").some((c) => c.text.includes("يُقصد به"))).toBe(true);
    expect(sources.cardCounts.watch).toBe(1);
    expect(sources.cardCounts.remember).toBe(1);
    expect(sources.cardCounts.connect).toBe(1);
    expect(sources.cardCounts.understand).toBe(1);
    // Tasks and questions stay out.
    expect(sources.cards.some((c) => c.text.startsWith("ما ناتج"))).toBe(false);
    expect(sources.cards.some((c) => c.text.includes("أكمل"))).toBe(false);
    // …even behind a stray OCR quote («" ناقش …») or a discuss label.
    expect(sources.cards.some((c) => c.text.includes("ناقش"))).toBe(false);
    expect(sources.definitions.some((i) => i.text.includes("ناقش"))).toBe(false);
  });

  it("lists book errors only when the book itself warns", () => {
    expect(sources.errors).toHaveLength(1);
    expect(sources.errors[0]!.kind).toBe("book");
    expect(sources.errors[0]!.text).toContain("لا تجمع إلا المتشابهات");
  });

  it("gathers examples from labelled examples, solutions and explore scenarios", () => {
    expect(sources.examples.some((i) => i.kind === "explore" && i.text.includes("عدد المتطوعين"))).toBe(true);
    expect(sources.examples.some((i) => i.kind === "example" && i.text.includes("4 تفاحات"))).toBe(true);
    expect(sources.examples.some((i) => i.kind === "solution" && i.text.includes("4 − 2 = 2"))).toBe(true);
  });

  it("reviews with the book's objectives and its own questions", () => {
    expect(sources.review.some((i) => i.kind === "check" && i.page === 10)).toBe(true);
    expect(sources.review.some((i) => i.kind === "question" && i.text.includes("ما ناتج 3 + 5"))).toBe(true);
    // The concept library fills gaps without a printed page — grounded, page-less.
    expect(sources.review.some((i) => i.kind === "concept" && i.text === "أستطيع أن أضيف عددين ضمن 999")).toBe(true);
  });

  it("is 100% deterministic — the server caches it forever", () => {
    expect(JSON.stringify(buildLessonSources(PAGES))).toBe(JSON.stringify(sources));
  });

  it("stays honest when there is no book text at all", () => {
    const bare = buildLessonSources({ concepts: [{ title: "أستطيع أن أجمع" }], pages: [] });
    expect(bare.hasBookText).toBe(false);
    expect(bare.pageRange).toBeNull();
    expect(bare.summary).toEqual([]);
    expect(bare.definitions).toEqual([]);
    expect(bare.cards).toEqual([]);
    expect(bare.examples).toEqual([]);
    expect(bare.errors).toEqual([]);
    // The concept library still gives the review tab something real.
    expect(bare.review).toEqual([{ kind: "concept", text: "أستطيع أن أجمع" }]);
  });

  it("drops OCR noise — blanks, number rows, letter grids, table rules, credits", () => {
    const noisy = buildLessonSources({
      concepts: [],
      pages: [
        {
          bookPage: 5,
          text: ["الأعداد الزوجية هي: ....................................", "21 ، 102 ، 225 ، 120", "g g g", "| :--- | :---: |", "Photo Credit: x / Shutterstock.com", "40"].join("\n"),
        },
      ],
    });
    expect(noisy.hasBookText).toBe(false);
  });

  it("folds for matching only — the emitted text keeps the book's spelling", () => {
    expect(foldArabic("أستطيعُ أن أكتبَ")).toBe("استطيع ان اكتب");
    const withTashkeel = buildLessonSources({
      concepts: [],
      pages: [{ bookPage: 3, text: "تعلم وفكر\nتذكّر أن تُراجعَ خطواتِك دائمًا." }],
    });
    expect(withTashkeel.cards[0]!.text).toBe("أن تُراجعَ خطواتِك دائمًا.");
    expect(withTashkeel.cards[0]!.card).toBe("remember");
  });

  it("truncates at word boundaries", () => {
    expect(truncateText("كلمة ".repeat(60), 40).endsWith("…")).toBe(true);
    expect(truncateText("قصير", 40)).toBe("قصير");
  });
});
