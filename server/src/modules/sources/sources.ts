// PHASE 160 (W5) — «مصادر الدرس»: a lesson's own book pages, distilled into
// six deterministic study tabs (ملخص · تعريفات · بطاقات · أخطاء شائعة · أمثلة ·
// مراجعة) — no LLM, no invention, no guessing.
//
// The rules that govern everything here:
//  - «المرجع لا النسخ»: nothing renders a book page; every line is text the
//    book itself prints, and every book-derived line carries the printed page
//    it came from.
//  - «لا نخمن أبدًا»: extraction keys off the book's own section labels
//    (هدف التعلم · استكشف · تعلم وفكر · هيا نتحدث معا · تحقق من فهمك · مثال ·
//    تدرب · انتبه …) and a small registry of Arabic definition/rule patterns.
//    When the book does not label something, the tab stays honestly empty —
//    an invented summary would be worse than none.
//  - 100% deterministic, zero AI: the same pages always yield the same tabs
//    (the unit tests pin this), so the server may cache them forever.
//
// The builder is pure: pages and concepts in, tabs out. The route owns the
// stage lookup, the OCR text, the observed-error aggregates and the cache.

export type CardType = "memorise" | "understand" | "watch" | "connect" | "remember";

export interface SourceItem {
  kind: string;
  text: string;
  /** Printed book page the line came from (book-derived items only). */
  page?: number;
  /** For definitions: the term the sentence defines, when the sentence names it. */
  term?: string;
  /** For observed errors: the wrong answer students actually picked. */
  wrong?: string;
  /** For observed errors: how many times it was picked. */
  count?: number;
}

export interface SourceCard extends SourceItem {
  card: CardType;
}

export interface LessonSources {
  /** False for a book with no OCR on this deployment — tabs stay honest. */
  hasBookText: boolean;
  pageRange: { from: number; to: number } | null;
  summary: SourceItem[];
  definitions: SourceItem[];
  cards: SourceCard[];
  cardCounts: Partial<Record<CardType, number>>;
  /** Book errors only — the route prepends the observed-error aggregates. */
  errors: SourceItem[];
  examples: SourceItem[];
  review: SourceItem[];
}

export interface SourcesConcept {
  title: string;
  description?: string | null;
}

export interface SourcesPage {
  bookPage: number;
  text: string;
}

export interface SourcesInput {
  concepts: SourcesConcept[];
  pages: SourcesPage[];
}

// ---------------------------------------------------------------------------
// Matching helpers — folding never leaks into the emitted text.
// ---------------------------------------------------------------------------

/** Arabic folding for MATCHING only (tashkeel/tatweel/hamza/ya/ta-marbuta). */
export function foldArabic(text: string): string {
  return text
    .replace(/[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[،؛:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]+$/, "");
}

/** Strips the OCR's leading bullets/dots/quotes and collapses whitespace. */
function cleanText(raw: string): string {
  return raw
    .replace(/^[\s.·•*\-–—:"'«»“”‘’]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Truncates at a word boundary with an ellipsis. */
export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).trimEnd()}…`;
}

// Lines that carry no teachable text: pure number/math rows, table rules,
// photo credits, letter-grids of drawn objects (g g g), exercise blanks.
const PURE_MATH = /^[\d\s.,%×÷+\-=()\[\]{}|:√°٠-٩،]+$/;
const LETTER_GRID = /^(?:[a-zA-Z]\s*){1,6}$/;
const FILL_IN = /[.\u2026]{4,}$/;
const PHOTO_CREDIT = /^photo credit/i;

// ---------------------------------------------------------------------------
// The book's own section labels
// ---------------------------------------------------------------------------

export type SectionLabel =
  | "objective"
  | "practices"
  | "explore"
  | "discuss"
  | "learn"
  | "check"
  | "example"
  | "solution"
  | "practice"
  | "warn"
  | "remember"
  | "note"
  | "review"
  | "vocab"
  | "activity";

const LABEL_TEXTS: Array<{ label: SectionLabel; text: string }> = [
  { label: "objective", text: "اهداف التعلم" },
  { label: "objective", text: "هدف التعلم" },
  { label: "objective", text: "هدف الدرس" },
  { label: "practices", text: "ممارسات صفيه" },
  { label: "explore", text: "استكشف" },
  { label: "discuss", text: "هيا نتحدث معا" },
  { label: "discuss", text: "هيا نتحدث" },
  { label: "learn", text: "تعلم وفكر" },
  { label: "check", text: "تحقق من فهمك" },
  { label: "example", text: "مثال محلول" },
  { label: "example", text: "مثال" },
  { label: "solution", text: "الحل" },
  { label: "practice", text: "تدرب" },
  { label: "practice", text: "تدريب" },
  { label: "warn", text: "انتبه" },
  { label: "warn", text: "احذر" },
  { label: "remember", text: "تذكر" },
  { label: "note", text: "لاحظ" },
  { label: "review", text: "مراجعه" },
  { label: "vocab", text: "مفردات" },
  { label: "activity", text: "نشاط" },
  { label: "activity", text: "اختبر فهمك" },
  { label: "activity", text: "فكر" },
];

interface ParsedLine {
  page: number;
  label: SectionLabel | null;
  body: string;
  folded: string;
  /** Number/math row or drawn-letter grid — merges only as a continuation. */
  pure: boolean;
}

/**
 * Splits one original line into its label (matched on the folded form) and the
 * body after it. The boundary check keeps «مثال» from swallowing «مثالية» and
 * «فكر» from swallowing «فكرة».
 */
function stripLabel(original: string, folded: string): { label: SectionLabel | null; body: string } {
  for (const { label, text } of LABEL_TEXTS) {
    if (!folded.startsWith(text)) continue;
    const rest = folded.slice(text.length);
    if (rest && !rest.startsWith(" ")) continue;
    const words = text.split(" ").length;
    const parts = original.split(" ");
    if (parts.length <= words) return { label, body: "" };
    return { label, body: cleanText(parts.slice(words).join(" ")) };
  }
  return { label: null, body: cleanText(original) };
}

function parseLines(pages: SourcesPage[]): ParsedLine[] {
  const out: ParsedLine[] = [];
  for (const page of pages) {
    if (!page.text) continue;
    for (const raw of page.text.split(/\r?\n/)) {
      const cleaned = cleanText(raw);
      if (!cleaned || PHOTO_CREDIT.test(cleaned)) continue;
      const pure = PURE_MATH.test(cleaned) || LETTER_GRID.test(cleaned);
      const folded = foldArabic(cleaned);
      if (!folded) continue;
      const { label, body } = stripLabel(cleaned, folded);
      if (body && FILL_IN.test(body)) continue;
      if (!label && !body) continue;
      out.push({ page: page.bookPage, label, body, folded: foldArabic(body), pure });
    }
  }
  return mergeContinuations(out);
}

/**
 * The OCR breaks sentences at the printed line — an objective like «… على 2 ،
 * 3 ، 4 ، 5 ،» continues on the next line with «10 ، 6». Continuations are
 * merged back only when the previous line does not end a sentence and the next
 * is unlabelled, bounded, same-page — never across labels or pages. A number
 * row that merges nowhere is OCR noise and is dropped.
 */
function mergeContinuations(lines: ParsedLine[]): ParsedLine[] {
  const out: ParsedLine[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    const canMerge =
      prev !== undefined &&
      line.label === null &&
      line.page === prev.page &&
      prev.body.length > 0 &&
      line.body.length > 0 &&
      (!line.pure || line.body.length <= 24) &&
      !/[.!؟…]$/.test(prev.body) &&
      prev.body.length + line.body.length <= 340;
    if (canMerge && prev) {
      prev.body = `${prev.body} ${line.body}`;
      prev.folded = foldArabic(prev.body);
      continue;
    }
    if (line.pure) continue;
    out.push({ ...line });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Extraction rules
// ---------------------------------------------------------------------------

/** A line that starts a task/instruction — never a card or a definition. */
const TASK_STARTS =
  /^(?:معا\s+)?(?:ما|ماذا|كيف|لماذا|هل|اي|اكتب|اكتبي|استنتج|اكمل|اوجد|احسب|رتب|ارسم|ناقش|اجب|حدد|ضع|فسر|اشرح|مثل|قارن|صنف|اختر|اذكر|بين|حل|صف|برهن|تحقق|فكر|استخدم|اعد|كون|حول|اختبر|اتبع|ساعد|لاحظ|راجع|اجعل|ضعي|استكشف|املأ|صل|ظلل|شارك|تعاون|اقرأ|اقرا|تامل|تخيل|اكتبوا|صفوا)/;

function isStatement(line: ParsedLine): boolean {
  const t = line.body;
  if (t.length < 15 || t.length > 240) return false;
  if (t.includes("|")) return false;
  if (/[؟?]\s*$/.test(t)) return false;
  if (/[:：]\s*$/.test(t)) return false;
  if (FILL_IN.test(t)) return false;
  if (TASK_STARTS.test(line.folded)) return false;
  return true;
}

const DEF_MARKERS: string[] = [
  "يقصد بها",
  "يقصد به",
  "المقصود",
  "تعني ان",
  "يعني ان",
  "هي اعداد",
  "هو عدد",
  "هي مقدار",
  "هو مقدار",
  "هي مجموعه",
  "هو مجموعه",
  "هي المسافه",
  "هو ناتج",
  "هي ناتج",
  "هو الفرق",
  "هي العلاقه",
  "هو العدد",
  "هي القيمه",
  "هو القيمه",
  "هو الشكل",
  "هي طريقه",
  "هو طريقه",
  "هي العمليه",
  "هو العمليه",
  "هي خاصيه",
  "هو خاصيه",
  "هي عمليه",
  "هو عمليه",
  "يسمي",
  "تسمي",
  "تعريف",
];

function definitionOf(line: ParsedLine): { term?: string; marker: string } | null {
  const marker = DEF_MARKERS.find((m) => line.folded.includes(m));
  if (!marker) return null;
  const firstWord = marker.split(" ")[0] ?? marker;
  const words = line.body.split(" ");
  let cut = -1;
  for (let i = 0; i < words.length; i += 1) {
    if (foldArabic(words[i] ?? "").includes(firstWord)) {
      cut = i;
      break;
    }
  }
  if (cut <= 0) return { marker };
  const termWords = (words.slice(0, cut).join(" ") ?? "").replace(/[،:]+$/, "").trim();
  const term = termWords && termWords.split(" ").length <= 6 ? termWords : undefined;
  return { term, marker };
}

const WATCH_RE = /(?:انتبه|احذر|لا تنس|تاكد من|من الخطا|خطا شائع)/;
const MEMORISE_RE = /(?:قاعده|خاصيه|يجب|لا بد|دائما|ينطبق|تعميم|قانون)/;
const REMEMBER_INLINE_RE = /(?:تذكر ان|تذكير)/;
const CONNECT_RE = /(?:لقد تعلمت|كما تعلمت|سبق ان|في الصف السابق|تعلمت سابقا|تعلمنا في|راجع ما تعلمت|تتذكر)/;

function cardTypeOf(line: ParsedLine, isDefinition: boolean): CardType | null {
  if (line.label === "warn" || WATCH_RE.test(line.folded)) return "watch";
  // The book's own label beats keyword patterns: a «تذكر …» reminder stays a
  // reminder even when it also says «دائمًا».
  if (line.label === "remember" || REMEMBER_INLINE_RE.test(line.folded)) return "remember";
  if (MEMORISE_RE.test(line.folded)) return "memorise";
  if (CONNECT_RE.test(line.folded)) return "connect";
  if (isDefinition) return "understand";
  return null;
}

/** Body of a block: the label's own remainder, else the first body after it. */
function blockBody(lines: ParsedLine[], index: number, maxLines: number): string {
  const parts: string[] = [];
  const line = lines[index];
  if (!line) return "";
  if (line.body) parts.push(line.body);
  for (let j = index + 1; j < lines.length && parts.length < maxLines; j += 1) {
    const next = lines[j];
    if (!next || next.label) break;
    if (!next.body) continue;
    parts.push(next.body);
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// The six tabs
// ---------------------------------------------------------------------------

function isObjective(line: ParsedLine): boolean {
  return line.folded.startsWith("استطيع ان");
}

function buildSummary(lines: ParsedLine[]): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  const push = (kind: string, line: ParsedLine, text?: string) => {
    const body = text ?? line.body;
    if (!body) return;
    const folded = foldArabic(body);
    if (seen.has(folded)) return;
    seen.add(folded);
    items.push({ kind, text: body, page: line.page });
  };

  // 1) The book's own objectives — the lesson's own summary of itself.
  for (const line of lines) {
    if (items.length >= 6) break;
    if (isObjective(line)) push("objective", line);
  }

  // 2) The topic sentence that opens each «تعلم وفكر» block.
  let ideas = 0;
  for (let i = 0; i < lines.length && ideas < 4 && items.length < 8; i += 1) {
    const line = lines[i];
    if (!line || line.label !== "learn") continue;
    const body = blockBody(lines, i, 1);
    if (!body || body.length < 20) continue;
    const before = items.length;
    push("idea", line, truncateText(body, 220));
    if (items.length > before) ideas += 1;
  }

  // 3) Books that print no objectives: fall back to the explore scenarios —
  //    still the book's own text, still page-tagged.
  if (items.length === 0) {
    for (let i = 0; i < lines.length && items.length < 5; i += 1) {
      const line = lines[i];
      if (!line || line.label !== "explore") continue;
      const body = blockBody(lines, i, 1);
      if (body) push("explore", line, truncateText(body, 220));
    }
  }
  return items;
}

function buildDefinitions(lines: ParsedLine[]): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (items.length >= 8) break;
    if (!line.body || !isStatement(line)) continue;
    const def = definitionOf(line);
    if (!def) continue;
    if (seen.has(line.folded)) continue;
    seen.add(line.folded);
    items.push({ kind: "definition", text: line.body, page: line.page, ...(def.term ? { term: def.term } : {}) });
  }
  return items;
}

function buildCards(lines: ParsedLine[]): { cards: SourceCard[]; counts: Partial<Record<CardType, number>> } {
  const cards: SourceCard[] = [];
  const counts: Partial<Record<CardType, number>> = {};
  const seen = new Set<string>();
  for (const line of lines) {
    if (cards.length >= 12) break;
    if (!line.body) continue;
    const byLabel = line.label === "warn" || line.label === "remember";
    if (!byLabel && !isStatement(line)) continue;
    if (byLabel && line.body.length < 8) continue;
    const isDefinition = definitionOf(line) !== null;
    const card = cardTypeOf(line, isDefinition);
    if (!card) continue;
    if (seen.has(line.folded)) continue;
    seen.add(line.folded);
    cards.push({ kind: "card", card, text: truncateText(line.body, 240), page: line.page });
    counts[card] = (counts[card] ?? 0) + 1;
  }
  return { cards, counts };
}

function buildExamples(lines: ParsedLine[]): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  const push = (kind: string, line: ParsedLine, text: string) => {
    const folded = foldArabic(text);
    if (!text || seen.has(folded)) return;
    seen.add(folded);
    items.push({ kind, text, page: line.page });
  };
  for (let i = 0; i < lines.length && items.length < 6; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (line.label === "example" || line.label === "solution") {
      const body = blockBody(lines, i, 2);
      if (body) push(line.label === "solution" ? "solution" : "example", line, truncateText(body, 300));
    }
  }
  for (let i = 0; i < lines.length && items.length < 6; i += 1) {
    const line = lines[i];
    if (!line || line.label !== "explore") continue;
    const body = blockBody(lines, i, 1);
    if (body) push("explore", line, truncateText(body, 260));
  }
  return items;
}

function buildReview(lines: ParsedLine[], concepts: SourcesConcept[]): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();

  // The book's own objectives — a checklist the student can honestly answer.
  for (const line of lines) {
    if (items.length >= 6) break;
    if (!isObjective(line) || seen.has(line.folded)) continue;
    seen.add(line.folded);
    items.push({ kind: "check", text: line.body, page: line.page });
  }

  // The book's own questions (discussion and understanding checks).
  let questions = 0;
  for (const line of lines) {
    if (questions >= 5 || items.length >= 11) break;
    if (!line.body || line.body.length < 12 || line.body.length > 200) continue;
    if (!/[؟?]\s*$/.test(line.body)) continue;
    if (seen.has(line.folded)) continue;
    seen.add(line.folded);
    items.push({ kind: "question", text: line.body, page: line.page });
    questions += 1;
  }

  // The concept library's objectives (the book's own «أستطيع أن …» lines) fill
  // the gap when the OCR misses them — grounded, but with no printed page.
  for (const concept of concepts) {
    if (items.length >= 12) break;
    const title = concept.title.trim();
    if (!title) continue;
    const folded = foldArabic(title);
    if (seen.has(folded)) continue;
    seen.add(folded);
    items.push({ kind: "concept", text: title });
  }
  return items;
}

function buildBookErrors(lines: ParsedLine[]): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (items.length >= 4) break;
    if (!line.body || line.body.length < 8) continue;
    if (line.label !== "warn" && !WATCH_RE.test(line.folded)) continue;
    if (seen.has(line.folded)) continue;
    seen.add(line.folded);
    items.push({ kind: "book", text: truncateText(line.body, 200), page: line.page });
  }
  return items;
}

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

export function buildLessonSources(input: SourcesInput): LessonSources {
  const allPages = input.pages.filter((p) => Number.isInteger(p.bookPage));
  const pages = allPages.filter((p) => typeof p.text === "string" && p.text.trim().length > 0);
  const lines = parseLines(pages);
  const hasBookText = lines.length > 0;
  const pageRange = allPages.length > 0 ? { from: allPages[0]!.bookPage, to: allPages[allPages.length - 1]!.bookPage } : null;
  const { cards, counts } = buildCards(lines);
  return {
    hasBookText,
    pageRange,
    summary: buildSummary(lines),
    definitions: buildDefinitions(lines),
    cards,
    cardCounts: counts,
    errors: buildBookErrors(lines),
    examples: buildExamples(lines),
    review: buildReview(lines, input.concepts),
  };
}
