// PHASE 161 (W6) — «دفتر أخطائي»: the student's own recent wrong MCQ picks,
// grouped per question. Pure — rows in, notebook out.
//
// Privacy: this is the student's OWN data (never a parent's view). The notebook
// carries no free text at all — MCQ options are printed by the book and the
// question text comes from the question bank — so nothing here can leak a
// conversation.

export interface MistakeRow {
  questionId: string;
  question: string;
  chosen: string;
  createdAt: Date;
  conceptId: string | null;
  conceptTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
}

export interface MistakeItem {
  questionId: string;
  question: string;
  /** The wrong option picked most recently. */
  chosen: string;
  /** How many times this question was answered wrong. */
  count: number;
  conceptId: string | null;
  conceptTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  /** ISO timestamp of the most recent wrong pick. */
  lastAt: string;
}

/** The notebook shows at most this many questions — the freshest first. */
export const MISTAKE_LIMIT = 10;

/**
 * Groups wrong-answer rows per question: one notebook entry per question with
 * how many times it was missed, the most recent wrong pick, and its concept and
 * lesson. Newest mistake first; ties break by question id so the order is
 * deterministic.
 */
export function groupMistakes(rows: MistakeRow[], limit = MISTAKE_LIMIT): MistakeItem[] {
  const byQuestion = new Map<string, { item: MistakeItem; latest: number }>();
  for (const row of rows) {
    const at = row.createdAt instanceof Date ? row.createdAt.getTime() : new Date(row.createdAt).getTime();
    const entry = byQuestion.get(row.questionId);
    if (!entry) {
      byQuestion.set(row.questionId, {
        latest: at,
        item: {
          questionId: row.questionId,
          question: row.question,
          chosen: row.chosen,
          count: 1,
          conceptId: row.conceptId,
          conceptTitle: row.conceptTitle,
          lessonId: row.lessonId,
          lessonTitle: row.lessonTitle,
          lastAt: new Date(at).toISOString(),
        },
      });
      continue;
    }
    entry.item.count += 1;
    if (at >= entry.latest) {
      entry.latest = at;
      entry.item.chosen = row.chosen;
      entry.item.lastAt = new Date(at).toISOString();
    }
  }
  return [...byQuestion.values()]
    .sort((a, b) => b.latest - a.latest || (a.item.questionId < b.item.questionId ? -1 : 1))
    .map((e) => e.item)
    .slice(0, Math.max(0, limit));
}
