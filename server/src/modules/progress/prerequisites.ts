import { describeMastery, type MasteryLevel } from "./mastery.js";

/**
 * PHASE 95 — شبكة المتطلّبات السابقة (prerequisite graph) + نِسَب الإتقان.
 *
 * المشكلة التي يحلّها هذا الملف: «المتطلّب السابق» و«الفكرة التالية» كانا
 * حقلين فارغين دائمًا في قرار المحرك (`prerequisite`/`nextConcept`)، لأن المحرك
 * لم يكن يملك ترتيب المفاهيم. المنهج نفسه يحمل هذا الترتيب فعلًا: مفاهيم الدرس
 * مخزونة بترتيب `concepts.code` (ترتيب الكتاب المطبوع)، والمفهوم التالي هو
 * التالي في هذا الترتيب.
 *
 * هذا الملف يشتق الشبكة من **الترتيب الحقيقي المخزون** فقط — لا علاقات
 * مُختلقة ولا تخمين. الحافة `from → to` تعني: «يجب أن يسبق إتقانُ `from`
 * الانتقالَ إلى `to`». ونِسبة الإتقان تُقرأ من بيانات `studentProgress`
 * الموجودة (عبر لقطة الذاكرة)؛ مفهوم لم يجربه الطالب بعد تبقى نسبته `null`
 * (لا نمنحه إتقانًا وهميًّا بنسبة صفر).
 *
 * كل الدوال نقية (بلا I/O) وحتميّة: نفس المدخلات ⇒ نفس المخرجات.
 */

export interface ConceptRef {
  id: string;
  title: string;
}

export interface PrerequisiteNode {
  conceptId: string;
  title: string;
  /** Raw persisted mastery in [0,1], or null when the student never attempted it. */
  mastery: number | null;
  /** 0..100 integer for display, or null when untracked. */
  percent: number | null;
  /** Mastery band, or null when untracked. */
  level: MasteryLevel | null;
  /** Arabic label of the band, or null when untracked. */
  labelAr: string | null;
}

/** A directed edge: `from` must be understood before `to`. */
export interface PrerequisiteEdge {
  from: string;
  to: string;
}

export interface PrerequisiteGraph {
  nodes: PrerequisiteNode[];
  edges: PrerequisiteEdge[];
  /** The tracked node with the lowest mastery, or null when nothing is tracked yet. */
  weakest: PrerequisiteNode | null;
}

/**
 * Normalize Arabic (and Latin) text for a tolerant title match: strip Arabic
 * diacritics and tatweel, unify alef/yaa forms, collapse whitespace, lowercase.
 * The goal is that «الأعدادُ العشريّة» and «الاعداد العشرية» compare equal.
 */
export function normalizeConcept(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Build the prerequisite graph from the lesson's concepts **in printed order**
 * plus the student's mastery-by-concept map. Edges chain consecutive concepts;
 * mastery is only attached where the student has real progress.
 */
export function buildPrerequisiteGraph(
  concepts: readonly ConceptRef[],
  masteryByConcept: Record<string, number>,
): PrerequisiteGraph {
  const nodes: PrerequisiteNode[] = concepts.map((c) => {
    const raw = masteryByConcept[c.id];
    if (typeof raw !== "number" || Number.isNaN(raw)) {
      return { conceptId: c.id, title: c.title, mastery: null, percent: null, level: null, labelAr: null };
    }
    const mastery = clamp01(raw);
    const { level, labelAr } = describeMastery(mastery);
    return {
      conceptId: c.id,
      title: c.title,
      mastery: Math.round(mastery * 100) / 100,
      percent: Math.round(mastery * 100),
      level,
      labelAr,
    };
  });

  const edges: PrerequisiteEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i]!.conceptId, to: nodes[i + 1]!.conceptId });
  }

  const tracked = nodes.filter((n): n is PrerequisiteNode & { mastery: number } => n.mastery !== null);
  const weakest =
    tracked.length > 0
      ? tracked.reduce((a, b) => (b.mastery < a.mastery ? b : a))
      : null;

  return { nodes, edges, weakest };
}

/**
 * Which concept in the chain the conversation is currently about.
 *
 * The question alone often names nothing an answer turn ("٩") or a vague
 * follow-up («مش فاهم»), so the caller passes the tutor's last message too —
 * that is where the concept-in-progress lives. We pick the **longest** concept
 * title found in the texts, because a longer literal match is far less likely
 * to be a coincidental substring (e.g. «الأعداد» inside «الأعداد العشرية»).
 *
 * Returns -1 when nothing matches — never guesses.
 */
export function conceptIndexFor(concepts: readonly ConceptRef[], texts: readonly (string | undefined)[]): number {
  if (concepts.length === 0) return -1;
  const haystacks = texts
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map(normalizeConcept);
  if (haystacks.length === 0) return -1;

  let bestIndex = -1;
  let bestLength = 0;
  concepts.forEach((c, i) => {
    const title = normalizeConcept(c.title);
    // Very short titles match almost anything; require a real word.
    if (title.length < 3) return;
    if (title.length <= bestLength) return;
    if (haystacks.some((h) => h.includes(title))) {
      bestIndex = i;
      bestLength = title.length;
    }
  });
  return bestIndex;
}

/**
 * The prerequisite of the concept at `index` in the graph — the immediately
 * preceding concept in printed order. Null at the start of the chain or when
 * the index is unknown.
 */
export function prerequisiteOf(
  graph: PrerequisiteGraph,
  index: number,
): { title: string; mastery: number | null } | null {
  if (index <= 0 || index >= graph.nodes.length) return null;
  const node = graph.nodes[index - 1]!;
  return { title: node.title, mastery: node.mastery };
}

/** The next objective after `index`, or null at the end of the lesson. */
export function nextConceptAfter(nodes: readonly ConceptRef[], index: number): string | null {
  if (index < 0 || index >= nodes.length - 1) return null;
  return nodes[index + 1]!.title;
}
