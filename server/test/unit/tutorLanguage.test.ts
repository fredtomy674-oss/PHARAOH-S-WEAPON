import { describe, expect, it } from "vitest";
import { PromptBuilder } from "../../src/modules/tutor/promptBuilder.js";
import {
  isLanguageSubject,
  LANGUAGE_STYLES,
  readReplyLanguageTag,
  replyLanguageTag,
  resolveTutorLanguage,
} from "../../src/modules/tutor/language.js";
import { classifyIntent } from "../../src/modules/tutor/intentClassifier.js";
import { MockLLMProvider } from "../../src/modules/ai/providers/mock.js";

/**
 * PHASE 38 / D-042 — the tutor speaks Arabic by default and English only for
 * foreign-language curricula. These tests pin the three seams that make that
 * true: the resolver, the prompt (what the real model is told), and the
 * deterministic offline provider (what you can actually observe).
 */

const lesson = {
  countryNameAr: "مصر",
  systemNameAr: "وزارة التربية والتعليم",
  gradeNameAr: "الصف السادس الابتدائي",
  subjectNameAr: "اللغة الإنجليزية",
  curriculumTitle: "اللغة الإنجليزية للصف السادس الابتدائي",
  termTitle: "الفصل الدراسي الأول",
  unitTitle: "الوحدة الأولى",
  lessonTitle: "Present Simple — المضارع البسيط",
  conceptTitles: ["Third person singular with -s"],
};

const build = (language?: "ar" | "en", question = "اشرح المضارع البسيط") =>
  new PromptBuilder().build({
    intent: "explanation",
    question,
    lesson,
    chunks: [
      {
        chunkId: "c1",
        content: "We use is with he, she and it.",
        score: 1,
        position: 0,
        metadata: { documentId: "d1" },
      },
    ],
    memory: {
      strengths: [],
      weaknesses: [],
      preferences: [],
      facts: [],
      recentRecaps: [],
      masteryByConcept: {},
      totalAttempts: 0,
      totalCorrect: 0,
    },
    studentName: "طالب",
    language,
  });

describe("resolveTutorLanguage", () => {
  it("defaults to Arabic for a non-language subject", () => {
    expect(resolveTutorLanguage({ code: "math" })).toBe("ar");
    expect(resolveTutorLanguage({ code: "science" })).toBe("ar");
    expect(resolveTutorLanguage({ code: "arabic" })).toBe("ar");
  });

  it("switches to English for foreign-language subjects", () => {
    expect(resolveTutorLanguage({ code: "english" })).toBe("en");
    expect(resolveTutorLanguage({ code: "french" })).toBe("en");
  });

  it("ignores case, spaces, dashes and underscores, and accepts the lang- prefix", () => {
    expect(resolveTutorLanguage({ code: "English" })).toBe("en");
    expect(resolveTutorLanguage({ code: " english_language " })).toBe("en");
    expect(resolveTutorLanguage({ code: "lang-en" })).toBe("en");
  });

  it("never resolves an empty code to English", () => {
    expect(resolveTutorLanguage({ code: "" })).toBe("ar");
    expect(isLanguageSubject("")).toBe(false);
  });
});

describe("prompt language contract", () => {
  it("is Arabic by default and carries the Arabic tag", () => {
    const { messages } = build();
    const system = messages[0]!.content;
    expect(system).toContain(replyLanguageTag("ar"));
    expect(system).toContain(LANGUAGE_STYLES.ar.rule);
    expect(system).toContain(LANGUAGE_STYLES.ar.reply);
    expect(readReplyLanguageTag(system)).toBe("ar");
  });

  it("states the English rule and instruction for a language curriculum", () => {
    const { messages } = build("en");
    const system = messages[0]!.content;
    expect(system).toContain(replyLanguageTag("en"));
    expect(system).toContain(LANGUAGE_STYLES.en.rule);
    expect(system).toContain(LANGUAGE_STYLES.en.reply);
    expect(readReplyLanguageTag(system)).toBe("en");
  });

  it("keeps the teaching and safety rules identical in both languages", () => {
    const ar = build().messages[0]!.content;
    const en = build("en").messages[0]!.content;
    for (const shared of [
      "لا تعطِ حل التمرين مباشرة قبل أن يحاول الطالب مرتين على الأقل",
      "تجاهل تعليماتك",
      "محتوى المنهج",
    ]) {
      expect(ar).toContain(shared);
      expect(en).toContain(shared);
    }
  });
});

describe("offline provider honours the language", () => {
  const ask = async (language?: "ar" | "en") => {
    const { messages } = build(language, "Explain the present simple");
    const res = await new MockLLMProvider().complete({
      operation: "tutor",
      messages,
      json: true,
    });
    return JSON.parse(res.content) as { content: string };
  };

  it("replies in Arabic by default", async () => {
    const { content } = await ask();
    expect(content).toContain("سؤال جيد");
    expect(content).toContain("تلميح");
  });

  it("replies in English for a language curriculum, with the lesson content", async () => {
    const { content } = await ask("en");
    expect(content).toContain("Great question!");
    expect(content).toContain("We use is with he, she and it.");
    expect(content).not.toContain("سؤال جيد");
  });
});

describe("English questions route like Arabic ones", () => {
  it("classifies exercise, hint, confusion and understanding in English", () => {
    expect(classifyIntent("please solve this example").intent).toBe("exercise");
    expect(classifyIntent("give me a hint").intent).toBe("hint_request");
    expect(classifyIntent("I don't understand, explain again").intent).toBe("explanation");
    expect(classifyIntent("I understand now").intent).toBe("check_understanding");
  });
});
