import { describe, expect, it } from "vitest";
import { PromptBuilder } from "../../src/modules/tutor/promptBuilder.js";
import {
  isLanguageSubject,
  LANGUAGE_STYLES,
  readReplyLanguageTag,
  replyLanguageTag,
  resolveTutorLanguage,
  type TutorLanguage,
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

const build = (language?: TutorLanguage, question = "اشرح المضارع البسيط") =>
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

  it("switches to the taught language for foreign-language subjects", () => {
    expect(resolveTutorLanguage({ code: "english" })).toBe("en");
    expect(resolveTutorLanguage({ code: "french" })).toBe("fr");
    expect(resolveTutorLanguage({ code: "german" })).toBe("de");
  });

  it("follows a medium suffix on the subject code (math taught in a foreign language)", () => {
    expect(resolveTutorLanguage({ code: "math-fr" })).toBe("fr");
    expect(resolveTutorLanguage({ code: "math-en" })).toBe("en");
    expect(resolveTutorLanguage({ code: "math-de" })).toBe("de");
    // An Arabic-medium maths subject has no suffix and stays Arabic.
    expect(resolveTutorLanguage({ code: "math" })).toBe("ar");
    // A two-word name is not a medium suffix: "social-studies" stays Arabic.
    expect(resolveTutorLanguage({ code: "social-studies" })).toBe("ar");
  });

  it("degrades an unsupported foreign language to English, never to Arabic", () => {
    // Spanish has no tutor voice; English is the previous, least-surprising reply.
    expect(resolveTutorLanguage({ code: "spanish" })).toBe("en");
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

  it("states the French and German rules for French/German-medium curricula (PHASE 63)", () => {
    const fr = build("fr").messages[0]!.content;
    expect(fr).toContain(replyLanguageTag("fr"));
    expect(fr).toContain(LANGUAGE_STYLES.fr.rule);
    expect(fr).toContain(LANGUAGE_STYLES.fr.reply);
    expect(readReplyLanguageTag(fr)).toBe("fr");

    const de = build("de").messages[0]!.content;
    expect(de).toContain(replyLanguageTag("de"));
    expect(de).toContain(LANGUAGE_STYLES.de.rule);
    expect(de).toContain(LANGUAGE_STYLES.de.reply);
    expect(readReplyLanguageTag(de)).toBe("de");
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

  it("labels a citation in the reply's own language (it is quoted back to the student)", () => {
    expect(build().messages[0]!.content).toContain("[مصدر 1]");
    const en = build("en").messages[0]!.content;
    expect(en).toContain("[source 1]");
    expect(en).not.toContain("[مصدر 1]");
  });
});

describe("offline provider honours the language", () => {
  const ask = async (language?: TutorLanguage) => {
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

  it("replies in French and German for French/German-medium curricula (PHASE 63)", async () => {
    const fr = await ask("fr");
    expect(fr.content).toContain("Bonne question !");
    expect(fr.content).toContain("We use is with he, she and it.");
    expect(fr.content).not.toContain("سؤال جيد");
    expect(fr.content).not.toContain("Great question!");

    const de = await ask("de");
    expect(de.content).toContain("Gute Frage!");
    expect(de.content).toContain("We use is with he, she and it.");
    expect(de.content).not.toContain("سؤال جيد");
    expect(de.content).not.toContain("Bonne question !");
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
