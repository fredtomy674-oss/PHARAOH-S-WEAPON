/**
 * PHASE 182 — the lesson sources sometimes carry a small Markdown table (the
 * book's comparison charts, grammar tables, etc.). Printing the pipes at a
 * child is not teaching, so this tiny parser turns those rows into a real
 * table. It deliberately supports only what the sources actually use:
 * headings, lists, paragraphs and pipe tables. Anything unknown stays words.
 */

export type SourceBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

const HEADING_RE = /^#{1,4}\s+(.*)$/;
const LIST_RE = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;
const TABLE_SEPARATOR_RE = /^:?-{2,}:?$/;

function cellsOf(line: string): string[] {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (body.endsWith("|")) body = body.slice(0, -1);
  return body.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  if (!line.includes("|")) return false;
  const cells = cellsOf(line);
  return cells.length > 0 && cells.every((cell) => TABLE_SEPARATOR_RE.test(cell.replace(/\s/g, "")));
}

function isTableStart(lines: string[], index: number): boolean {
  if (index + 1 >= lines.length) return false;
  const header = lines[index]!;
  const separator = lines[index + 1]!;
  return header.includes("|") && isTableSeparator(separator) && cellsOf(header).length === cellsOf(separator).length;
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index]!;
  return HEADING_RE.test(line) || LIST_RE.test(line) || isTableStart(lines, index);
}

/** Split a source string into safe, renderable blocks. */
export function parseSourceBlocks(input: string): SourceBlock[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: SourceBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1]!.trim() });
      i += 1;
      continue;
    }

    if (isTableStart(lines, i)) {
      const header = cellsOf(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i]!.includes("|") && lines[i]!.trim().length > 0) {
        const row = cellsOf(lines[i]!);
        // A row with a different arity is not this table; leave it for the
        // paragraph path rather than shifting cells into the wrong column.
        if (row.length !== header.length) break;
        rows.push(row);
        i += 1;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    const list = LIST_RE.exec(line);
    if (list) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length) {
        const item = LIST_RE.exec(lines[i]!);
        if (!item) break;
        items.push(item[1]!.trim());
        i += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i]!.trim().length > 0 && !isBlockStart(lines, i)) {
      paragraph.push(lines[i]!.trim());
      i += 1;
    }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}
