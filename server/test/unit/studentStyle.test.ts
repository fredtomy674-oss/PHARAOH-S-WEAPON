import { describe, expect, it } from "vitest";
import { analyzeStudentStyle, studentStyleRule } from "../../src/modules/tutor/studentStyle.js";
import { ARABIC_TUTOR_VOICE, LANGUAGE_STYLES } from "../../src/modules/tutor/language.js";
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
  gradeNameAr: "الصف السادس",
  subjectNameAr: "الرياضيات",
  curriculumTitle: "المنهج",
  termTitle: "الفصل",
  unitTitle: "الوحدة",
  lessonTitle: "الجمع",
  conceptTitles: ["الجمع"],
};

describe("PHASE 184 — the student's speaking style", () => {
  it("hears Egyptian dialect and hesitation in a short message", () => {
    const style = analyzeStudentStyle("مش فاهم ازاي اجمع ده");
    expect(style.register).toBe("egyptian");
    expect(style.energy).toBe("hesitant");
    expect(style.pace).toBe("brief");
    expect(style.samples).toBe(1);
  });

  it("recognises a formal schoolbook register without making the tutor formal", () => {
    const style = analyzeStudentStyle("لماذا هذا الدرس صعب؟ أريد شرحًا مبسطًا");
    expect(style.register).toBe("formal");
    const rule = studentStyleRule(style);
    expect(rule).toContain("فصحى/عربية مدرسية");
    expect(rule).toContain("أجب بعامية مصرية خفيفة");
    expect(rule).not.toContain("أجب بالفصحى");
  });

  it("mirrors playfulness and long messages", () => {
    const playful = analyzeStudentStyle("هههههه الدرس جامد");
    expect(playful.energy).toBe("playful");
    expect(playful.register).toBe("egyptian");

    const chatty = analyzeStudentStyle(
      "احنا النهارده حلينا مسألة الجمع وانا فهمت الخطوة الأولى بس الخطوة التانية لخبطتني شوية وعايز اعرف ازاي اكمل المسألة لو الأرقام كبيرة والخطوات كتير",
    );
    expect(chatty.pace).toBe("chatty");
  });

  it("keeps a neutral message neutral instead of inventing a mood", () => {
    const style = analyzeStudentStyle("اشرح الدرس");
    expect(style).toEqual({ register: "mixed", energy: "steady", pace: "brief", samples: 1 });
  });

  it("reads the recent student turns, not the tutor's own words", () => {
    const style = analyzeStudentStyle("اشرح تاني", [
      { role: "assistant", content: "بالتأكيد سأشرح لك بالطبع" },
      { role: "user", content: "مش فاهم خالص" },
    ]);
    expect(style.register).toBe("egyptian");
    expect(style.energy).toBe("hesitant");
    expect(style.samples).toBe(2);
  });
});

describe("PHASE 184 — the Egyptian tutor prompt", () => {
  it("replaces the MSA-only Arabic rule with a natural Egyptian voice", () => {
    expect(LANGUAGE_STYLES.ar.rule).toContain("العامية المصرية");
    expect(LANGUAGE_STYLES.ar.rule).not.toContain("الفصحى المبسطة");
    expect(LANGUAGE_STYLES.ar.reply).toContain("العامية المصرية");
  });

  it("asks for light tashkeel and forbids emoji in the reply (PHASE 187)", () => {
    expect(LANGUAGE_STYLES.ar.rule).toContain("تشكيل خفيف");
    expect(LANGUAGE_STYLES.ar.rule).toContain("تشكيل خفيف وموضعي");
    expect(LANGUAGE_STYLES.ar.rule).toContain("إيموجي");
    expect(ARABIC_TUTOR_VOICE).toContain("الفتحة");
    expect(ARABIC_TUTOR_VOICE).toContain("الشدة");
    expect(ARABIC_TUTOR_VOICE).toContain("المصطلحات العلمية");
    expect(ARABIC_TUTOR_VOICE).toContain("ممنوع تمامًا أي إيموجي");
  });

  it("puts the student's style and the no-robot voice in the Arabic prompt", () => {
    const { messages } = new PromptBuilder().build({
      intent: "explanation",
      question: "اشرح تاني",
      lesson,
      chunks: [],
      memory: emptyMemory,
      studentName: "طالب",
      history: [{ role: "user", content: "مش فاهم" }],
    });
    const system = messages[0]!.content;
    expect(system).toContain("نبرتك (مصري طبيعي");
    expect(system).toContain("أسلوب الطالب الآن");
    expect(system).toContain("متعثر");
    expect(system).toContain("المصطلحات والاقتباسات");
    expect(system).toContain("تشكيل خفيف");
    expect(system).toContain("الخطوة القادمة");
    expect(system).not.toContain("💙");
    expect(system).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it("does not inject the Arabic style block into another lesson language", () => {
    const { messages } = new PromptBuilder().build({
      intent: "explanation",
      question: "Explain the lesson",
      lesson,
      chunks: [],
      memory: emptyMemory,
      studentName: "Student",
      language: "en",
    });
    expect(messages[0]!.content).not.toContain("أسلوب الطالب الآن");
    expect(messages[0]!.content).not.toContain("مصري طبيعي");
  });
});
