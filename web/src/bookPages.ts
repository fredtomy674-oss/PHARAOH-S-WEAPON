/**
 * PHASE 182 — one way to name a printed book page.
 *
 * The book's opening page carries no printed number. Showing «صفحة 0» sends a
 * child hunting for a zero that is not in the book, and a range «0–13» reads
 * like a bug. A range starts at the first numbered page; a single opening page
 * is named for what it is.
 */
export function bookPageLabel(page: number): string {
  return page === 0 ? "صفحة الافتتاح" : `صفحة ${page}`;
}

export function bookPagesLabel(from: number, to: number): string {
  if (from === to) return bookPageLabel(from);
  return `صفحات ${Math.max(1, from)}–${to}`;
}

/** The plan's lesson reference: `null` when this book ships no page stage. */
export function planPageLabel(start: number | null | undefined, end: number | null | undefined): string | null {
  if (start === null || start === undefined) return null;
  if (end === null || end === undefined || end === start) return bookPageLabel(start);
  return bookPagesLabel(start, end);
}
