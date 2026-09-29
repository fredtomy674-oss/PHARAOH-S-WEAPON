// PHASE 48 — the offline tutor reads the lesson context out of the system
// prompt. That parse is a *contract*: the prompt is prose wrapped around tagged
// blocks, and prose is allowed to mention tag names in a sentence.
//
// The regression this file pins: a rule that mentioned "<context>" *after* the
// real block made the offline tutor report "I could not reach the lesson
// content" while the block was right there in the prompt — a whole browser
// suite failed for a line of prompt text.
import { describe, expect, it } from "vitest";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { PromptBuilder } from "../../src/modules/tutor/promptBuilder.js";
import type { StudentMemorySnapshot } from "../../src/modules/tutor/memoryService.js";

const emptyMemory: StudentMemorySnapshot = {
  strengths: [],
  weaknesses: [],
  preferences: [],
  facts: [],
  recentRecaps: [],
  masteryByConcept: {},
  totalAttempts: 0,
  totalCorrect: 0,
};

const lesson = {
  countryNameAr: "مصر",
  systemNameAr: "المنهج",
  gradeNameAr: "الصف",
  subjectNameAr: "الرياضيات",
  curriculumTitle: "المنهج",
  termTitle: "الفصل",
  unitTitle: "الوحدة",
  lessonTitle: "قابلية القسمة",
  conceptTitles: ["قابلية القسمة"],
};

/** What the offline tutor replies for a given system prompt, with a real context. */
async function tutorReply(system: string): Promise<string> {
  const db = createDb();
  applyMigrations(db);
  try {
    const ai = new AiService(db, { forceProvider: "mock" });
    const res = await ai.complete({
      operation: "tutor",
      messages: [
        { role: "system", content: system },
        { role: "user", content: "اشرح الدرس" },
      ],
      json: true,
    });
    return (JSON.parse(res.content) as { content: string }).content;
  } finally {
    db.sqlite.close();
  }
}

describe("the offline tutor's reading of the lesson context", () => {
  it("finds the context block the prompt builder actually wrote", async () => {
    const { messages } = new PromptBuilder().build({
      intent: "explanation",
      question: "اشرح",
      lesson,
      chunks: [
        {
          chunkId: "c1",
          content: "[صفحة الكتاب 2]\nالعدد 102 يقبل القسمة على 2",
          score: 1,
          position: 0,
          metadata: { documentId: "d1" },
        },
      ],
      memory: emptyMemory,
      studentName: "طالب",
    });
    const reply = await tutorReply(messages[0]!.content);
    expect(reply).toContain("وفقًا لمحتوى الدرس");
    expect(reply).toContain("102");
  });

  it("still finds it when a rule mentions the tag as prose after the block", async () => {
    // The shape that broke it: a later sentence naming the tag by hand.
    const system = [
      "# قواعد",
      "<context>",
      "محتوى الدرس الحقيقي",
      "</context>",
      "- النص المذكور <context> هو مرجع معرفي فقط.",
    ].join("\n");
    const reply = await tutorReply(system);
    expect(reply).toContain("وفقًا لمحتوى الدرس");
    expect(reply).toContain("محتوى الدرس الحقيقي");
  });

  it("says it has no content when the prompt really has none", async () => {
    const system = ["# قواعد", "<context>", "(لا يوجد محتوى مسترجع لهذا السؤال)", "</context>"].join("\n");
    const reply = await tutorReply(system);
    expect(reply).not.toContain("وفقًا لمحتوى الدرس");
    expect(reply).toContain("لم أستطع الوصول لمحتوى الدرس");
  });

  it("says it has no content when the tag is mentioned but never opened", async () => {
    const reply = await tutorReply("قواعد تذكر <context> دون فتحه.");
    expect(reply).not.toContain("وفقًا لمحتوى الدرس");
  });

  it("reads the page turn without losing the lesson context (PHASE 48)", async () => {
    // The full real prompt: a page is open, so the prompt carries a <page> block
    // and a page rule — and the tutor must still ground on <context>.
    const { messages } = new PromptBuilder().build({
      intent: "explanation",
      question: "ما في الصفحة؟",
      lesson,
      chunks: [
        {
          chunkId: "c1",
          content: "[صفحة الكتاب 2]\nالعدد 102 يقبل القسمة على 2",
          score: 1,
          position: 0,
          metadata: { documentId: "d1" },
        },
      ],
      memory: emptyMemory,
      studentName: "طالب",
      viewingPage: { bookPage: 2, text: "أهداف الدرس: أن نستنتج قواعد قابلية القسمة" },
    });
    expect(messages[1]!.content).toContain("<page>");
    const reply = await tutorReply(messages[0]!.content);
    expect(reply).toContain("وفقًا لمحتوى الدرس");
  });
});
