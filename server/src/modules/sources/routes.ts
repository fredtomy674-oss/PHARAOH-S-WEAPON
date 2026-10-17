import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";
import { answers, questions } from "../../db/schema.js";
import { bookPageText, stageForLesson } from "../curriculum/bookStage.js";
import { buildLessonSources, truncateText, type LessonSources, type SourceItem } from "./sources.js";

/**
 * PHASE 160 (W5) — GET /api/lessons/:lessonId/sources
 *
 * The lesson page's six study tabs (ملخص · تعريفات · بطاقات · أخطاء شائعة ·
 * أمثلة · مراجعة), built deterministically from the lesson's own book pages
 * (OCR) plus its concepts — no LLM, no new tables. Student-only.
 *
 * «أخطاء شائعة» adds a second, live source: aggregate wrong MCQ answers
 * actually recorded for the lesson's questions. Aggregates only — never a
 * student identity, never free text (MCQ options are printed by the book).
 *
 * Cache: the book-derived tabs are a pure function of a static corpus, so they
 * are cached per lesson for the process lifetime (a redeploy — the only way the
 * corpus changes — clears the cache with it). The observed-error aggregates are
 * NOT cached: they change with every practice attempt.
 */

const idPattern = /^[A-Za-z0-9_-]{1,64}$/;
const CACHE_MAX = 512;
const cache = new Map<string, LessonSources>();

async function coreFor(
  app: FastifyInstance,
  lessonId: string,
  curriculumCode: string,
  lessonCode: string,
): Promise<LessonSources> {
  const hit = cache.get(lessonId);
  if (hit) return hit;
  const stage = stageForLesson(curriculumCode, lessonCode);
  const pages = (stage?.pages ?? []).map((p) => ({
    bookPage: p.bookPage,
    text: bookPageText(curriculumCode, p.bookPage),
  }));
  const concepts = await app.curriculum.listConcepts(lessonId);
  const value = buildLessonSources({ concepts, pages });
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(lessonId, value);
  return value;
}

/** Aggregate wrong MCQ picks per question — the most-picked mistake first. */
async function observedErrors(app: FastifyInstance, lessonId: string): Promise<SourceItem[]> {
  const rows = await app.db.db
    .select({ questionId: questions.id, question: questions.content, chosen: answers.content })
    .from(answers)
    .innerJoin(questions, eq(answers.questionId, questions.id))
    .where(and(eq(questions.lessonId, lessonId), eq(questions.type, "mcq"), eq(answers.correct, 0)));

  const byQuestion = new Map<string, { question: string; total: number; wrong: Map<string, number> }>();
  for (const row of rows) {
    const entry = byQuestion.get(row.questionId) ?? { question: row.question, total: 0, wrong: new Map<string, number>() };
    entry.total += 1;
    entry.wrong.set(row.chosen, (entry.wrong.get(row.chosen) ?? 0) + 1);
    byQuestion.set(row.questionId, entry);
  }

  return [...byQuestion.entries()]
    .sort((a, b) => b[1].total - a[1].total || (a[0] < b[0] ? -1 : 1))
    .slice(0, 3)
    .map(([, entry]) => {
      const top = [...entry.wrong.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]!;
      return {
        kind: "observed",
        text: truncateText(entry.question, 140),
        wrong: truncateText(top[0], 60),
        count: top[1],
      };
    });
}

export const sourcesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:lessonId/sources", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student") {
      throw Errors.forbidden("مصادر الدرس مخصصة لحسابات الطلاب");
    }
    const { lessonId } = request.params as { lessonId: string };
    if (!idPattern.test(lessonId)) {
      throw Errors.badRequest("معرّف الدرس غير صالح", "INVALID_LESSON_ID");
    }
    const { curriculum, lesson } = await app.curriculum.lessonBreadcrumb(lessonId);
    const core = await coreFor(app, lessonId, curriculum.code, lesson.code);
    const observed = await observedErrors(app, lessonId);
    return { sources: { ...core, errors: [...observed, ...core.errors] } };
  });
};
