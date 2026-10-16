import { beforeAll, describe, expect, it } from "vitest";
import { newId } from "../../src/utils/ids.js";
import { curricula, lessons, terms, units } from "../../src/db/schema.js";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { IMAGE_READ_MARKER } from "../../src/modules/ai/providers/mock.js";

/** 1x1 transparent PNG — stands in for the marked page (validation, not vision). */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

/**
 * PHASE 50 — «لوح الحبر»: the student draws on the printed page, and the tutor
 * sees the page as he marked it.
 *
 * W2: the room's client now draws on the teacher's board (no page at all), so a
 * page-less ink turn is named «رسم-على-السبورة.jpg» and the prompt calls it a
 * board; the page-marked path below stays for compatibility.
 *
 * The contract worth protecting: a marked-page turn is stored as a picture of
 * *that page* (readable file name, printed page number, stroke count), the
 * tutor is told the marks are the student's own pointer, and a forged page
 * number is ignored — never trusted, never a 400.
 */
describe("ink turn (marked book page) — API", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let s!: AuthSession;
  let plainSessionId!: string;
  let stagedSessionId!: string;

  /** A session on a lesson that owns a real book stage (eg-g6-math / l-con-1-1). */
  const seedStagedLesson = async () => {
    const db = api.db.db;
    const now = new Date();
    const cur = {
      id: newId("cur"),
      countryId: corpus.countryId,
      educationSystemId: corpus.systemId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      code: "eg-g6-math",
      title: "رياضيات السادس — الوزارة",
      version: "1.0",
      isActive: true,
      createdAt: now,
    };
    await db.insert(curricula).values(cur);
    const term = { id: newId("t"), curriculumId: cur.id, code: "t-ink", title: "الفصل", sortOrder: 1 };
    await db.insert(terms).values(term);
    const unit = { id: newId("u"), termId: term.id, code: "u-ink", title: "الوحدة", sortOrder: 1 };
    await db.insert(units).values(unit);
    const lesson = { id: newId("l"), unitId: unit.id, code: "l-con-1-1", title: "المفهوم 1-1", sortOrder: 1 };
    await db.insert(lessons).values(lesson);
    // One grounding chunk so the turn answers from the lesson, like production.
    await api.knowledge.ingestText({
      title: "محتوى المفهوم",
      content: "قابلية القسمة على 2 تعني أن الآحاد زوجي: 0 أو 2 أو 4 أو 6 أو 8.",
      kind: "text",
      source: "test-ink",
      scope: {
        countryId: corpus.countryId,
        educationSystemId: corpus.systemId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        curriculumId: cur.id,
        termId: term.id,
        unitId: unit.id,
        lessonId: lesson.id,
      },
    });
    return { curriculumId: cur.id, lessonId: lesson.id };
  };

  const startSession = async (curriculumId: string, lessonId: string): Promise<string> => {
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId },
    });
    expect(start.statusCode).toBe(201);
    return (start.json() as { session: { id: string } }).session.id;
  };

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, "ink-turn@test.local");
    plainSessionId = await startSession(corpus.curriculumId, corpus.lessonA);
    const staged = await seedStagedLesson();
    stagedSessionId = await startSession(staged.curriculumId, staged.lessonId);
  });

  const ask = (sessionId: string, payload: Record<string, unknown>) =>
    api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload,
    });

  it("stores a marked-page turn as a picture the tutor reads", async () => {
    const res = await ask(stagedSessionId, {
      content: "ما هذا الذي حددته؟",
      ink: { dataUrl: TINY_PNG, page: 5, strokes: 3 },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as {
      userMessage: { attachments: Array<{ mimeType: string; fileName: string | null; inkPage?: number; inkStrokes?: number }> };
      tutorMessage: { content: string };
    };
    expect(turn.userMessage.attachments).toHaveLength(1);
    const att = turn.userMessage.attachments[0]!;
    expect(att.mimeType).toBe("image/png");
    // The record says *which* page he drew on — a picture with no name is a
    // transcript nobody can audit.
    expect(att.fileName).toBe("صفحة-5-مُعلَّمة.jpg");
    expect(att.inkPage).toBe(5);
    expect(att.inkStrokes).toBe(3);
    // …and the tutor really looked at the picture.
    expect(turn.tutorMessage.content).toContain(IMAGE_READ_MARKER);
  });

  it("answers an ink-only turn (the marks are the question)", async () => {
    const res = await ask(stagedSessionId, { ink: { dataUrl: TINY_PNG, page: 6, strokes: 1 } });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { content: string } };
    expect(turn.tutorMessage.content).toContain(IMAGE_READ_MARKER);
  });

  it("ignores a page the lesson does not own, without failing the turn", async () => {
    const res = await ask(stagedSessionId, {
      content: "حددت شيئًا",
      ink: { dataUrl: TINY_PNG, page: 100, strokes: 2 },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as {
      userMessage: { attachments: Array<{ fileName: string | null; inkPage?: number; inkStrokes?: number }> };
    };
    const att = turn.userMessage.attachments[0]!;
    // The marks still travel as a picture; only the unowned page claim is dropped.
    // W2: with no page behind it, the drawing is what it always was on the screen —
    // a board drawing — so the file says so instead of claiming a page.
    expect(att.inkPage).toBeUndefined();
    expect(att.inkStrokes).toBe(2);
    expect(att.fileName).toBe("رسم-على-السبورة.jpg");
  });

  it("records nothing on a lesson with no book at all", async () => {
    const res = await ask(plainSessionId, {
      content: "حددت شيئًا",
      ink: { dataUrl: TINY_PNG, page: 5, strokes: 2 },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as {
      userMessage: { attachments: Array<{ inkPage?: number }> };
      tutorMessage: { content: string };
    };
    expect(turn.userMessage.attachments[0]!.inkPage).toBeUndefined();
    expect(turn.tutorMessage.content).toContain(IMAGE_READ_MARKER);
  });

  it("refuses a photo on top of a marked page — one visual per turn", async () => {
    const res = await ask(stagedSessionId, {
      content: "سؤال",
      image: { dataUrl: TINY_PNG },
      ink: { dataUrl: TINY_PNG, page: 5, strokes: 1 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("MULTIPLE_ATTACHMENTS");
  });

  it("clamps an absurd stroke count instead of storing the client's word", async () => {
    const res = await ask(stagedSessionId, { ink: { dataUrl: TINY_PNG, page: 5, strokes: 10000 } });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as {
      userMessage: { attachments: Array<{ inkStrokes?: number }> };
    };
    expect(turn.userMessage.attachments[0]!.inkStrokes).toBe(200);
  });

  it("re-reading the session still says which page was marked", async () => {
    const history = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${stagedSessionId}`,
      headers: { cookie: s.cookie },
    });
    expect(history.statusCode).toBe(200);
    const messages = history.json().messages as Array<{ attachments: Array<{ inkPage?: number }> }>;
    const marked = messages.flatMap((m) => m.attachments).filter((a) => a.inkPage !== undefined);
    expect(marked.length).toBeGreaterThan(0);
    expect(marked[0]!.inkPage).toBe(5);
  });

  it("streams an ink turn with the same stored record", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${stagedSessionId}/messages/stream`,
      headers: csrfHeaders(s),
      payload: { content: "اشرح لي الموضع المحدد", ink: { dataUrl: TINY_PNG, page: 7, strokes: 2 } },
    });
    expect(res.statusCode).toBe(200);
    const events = res.body
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as { type: string; userMessage?: { attachments: Array<{ inkPage?: number }> } });
    const done = events[events.length - 1]!;
    expect(done.type).toBe("done");
    expect(done.userMessage!.attachments[0]!.inkPage).toBe(7);
  });
});
