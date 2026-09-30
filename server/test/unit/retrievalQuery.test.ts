import { describe, expect, it } from "vitest";
import { buildRetrievalQuery } from "../../src/modules/tutor/tutorEngine.js";

/**
 * PHASE 55 — what the retriever searches for.
 *
 * Observed live: a vague «مش فاهم، اشرح بطريقة أسهل» retrieved GCD chunks
 * into a divisibility-by-2 explanation, and the tutor followed them off a
 * cliff. A follow-up that names no concept must stay anchored on the concept
 * in progress (the tutor's last message), never drift on the vague words.
 */
describe("buildRetrievalQuery (PHASE 55)", () => {
  const lastTutor = "قابلية القسمة على 2 تعني أن الآحاد زوجي. هل العدد 10 يقبل القسمة على 2؟";

  it("anchors a concept-less follow-up on the tutor's last message", () => {
    const q = buildRetrievalQuery({
      question: "مش فاهم، اشرح بطريقة أسهل من فضلك",
      intent: "explanation",
      intentConcepts: [],
      isAnswerTurn: false,
      anchorMessage: lastTutor,
      hasDocument: false,
    });
    expect(q).toContain("قابلية القسمة على 2");
    expect(q).toContain("مش فاهم");
  });

  it("leaves a question that names its concept alone", () => {
    const q = buildRetrievalQuery({
      question: "اشرح لي قابلية القسمة على 2",
      intent: "explanation",
      intentConcepts: ["قابلية القسمة"],
      isAnswerTurn: false,
      anchorMessage: lastTutor,
      hasDocument: false,
    });
    expect(q).toBe("اشرح لي قابلية القسمة على 2");
  });

  it("leaves a self-contained exercise alone, so repeats embed identically", () => {
    // The embedding cache is deterministic per question text: anchoring an
    // exercise would attach the ever-changing last reply and kill every hit.
    for (const intent of ["exercise", "check_understanding", "motivation"] as const) {
      const q = buildRetrievalQuery({
        question: "ما ناتج جمع 487 و 358؟",
        intent,
        intentConcepts: [],
        isAnswerTurn: false,
        anchorMessage: lastTutor,
        hasDocument: false,
      });
      expect(q).toBe("ما ناتج جمع 487 و 358؟");
    }
  });

  it("still retrieves on the pending question for an answer turn", () => {
    const q = buildRetrievalQuery({
      question: "نعم",
      intent: "answer",
      intentConcepts: [],
      isAnswerTurn: true,
      lastTutorMessage: lastTutor,
      anchorMessage: lastTutor,
      hasDocument: false,
    });
    expect(q).toBe(lastTutor);
  });

  it("keeps the neutral fallbacks for content-less turns", () => {
    expect(
      buildRetrievalQuery({ question: "   ", intent: "explanation", intentConcepts: [], isAnswerTurn: false, anchorMessage: lastTutor, hasDocument: false }),
    ).toBe("سؤال مصور في هذا الدرس");
    expect(
      buildRetrievalQuery({ question: "", intent: "explanation", intentConcepts: [], isAnswerTurn: false, anchorMessage: undefined, hasDocument: true }),
    ).toBe("سؤال عن محتوى الملف المرفق في هذا الدرس");
  });

  it("does not anchor when there is nothing to anchor on", () => {
    expect(
      buildRetrievalQuery({ question: "مش فاهم", intent: "explanation", intentConcepts: [], isAnswerTurn: false, anchorMessage: undefined, hasDocument: false }),
    ).toBe("مش فاهم");
  });

  it("anchors on the student's earlier question when no tutor reply exists", () => {
    // A failed first turn leaves no tutor message; the student's own earlier
    // words still name the concept in progress.
    expect(
      buildRetrievalQuery({
        question: "مش فاهم",
        intent: "explanation",
        intentConcepts: [],
        isAnswerTurn: false,
        anchorMessage: "اشرح لي قابلية القسمة على 2",
        hasDocument: false,
      }),
    ).toBe("اشرح لي قابلية القسمة على 2 مش فاهم");
  });
});
