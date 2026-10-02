export interface ChunkInput {
  content: string;
  position: number;
}

/**
 * True when a chunk carries at least one letter or digit, in any script.
 *
 * OCR of a real book sometimes yields pure-noise runs — the detached «......»
 * dot columns of a printed answer key, rules, or stray punctuation. Such a run
 * has nothing to explain and nothing to retrieve, so it must never become a
 * searchable chunk (a teacher would see a chunk of dots as a defect).
 */
export function hasMeaningfulContent(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

/**
 * Splits cleaned text into overlapping chunks sized for retrieval.
 * Strategy: paragraph blocks merged up to a target size with small overlap.
 * Content-free pieces (see `hasMeaningfulContent`) are dropped.
 */
export function chunkText(text: string, opts: { targetChars?: number; overlapChars?: number } = {}): ChunkInput[] {
  const target = opts.targetChars ?? 500;
  const overlap = opts.overlapChars ?? 40;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const chunks: ChunkInput[] = [];
  let buffer = "";
  let position = 0;

  const flush = (final = false) => {
    if (buffer.trim().length === 0) return;
    const content = buffer.trim();
    if (!final && content.length > target) {
      // Split oversized buffer into pieces.
      const pieces = sliceByChars(content, target, overlap);
      pieces.forEach((piece) => {
        chunks.push({ content: piece, position: position++ });
      });
    } else {
      chunks.push({ content, position: position++ });
    }
    buffer = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length >= target) {
      flush();
      sliceByChars(paragraph, target, overlap).forEach((piece) => chunks.push({ content: piece, position: position++ }));
      continue;
    }
    if (buffer.length + paragraph.length + 2 > target * 1.6) flush();
    buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
  }
  flush(true);
  // Drop content-free pieces and renumber so positions stay contiguous.
  return chunks.filter((c) => hasMeaningfulContent(c.content)).map((c, i) => ({ content: c.content, position: i }));
}

function sliceByChars(text: string, size: number, overlap: number): string[] {
  const pieces: string[] = [];
  let start = 0;
  while (start < text.length) {
    const piece = text.slice(start, start + size);
    pieces.push(piece.trim());
    if (start + size >= text.length) break;
    start += size - overlap;
  }
  return pieces;
}