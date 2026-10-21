import { stripEmoji } from "../../../utils/text.js";

/**
 * PHASE 53 — spoken words, not syntax.
 *
 * The tutor's replies carry light markdown (bold, lists); the narration route
 * must read what the student sees, not the markers. This is the server twin of
 * the web `stripMarkdown` (web/src/format.ts): the same block grammar, ported
 * line by line so both voices agree — implemented independently so neither
 * package builds against the other. The unit tests pin the shared cases.
 */
export function stripMarkdownForSpeech(input: string): string {
  const blocks: string[] = [];
  // PHASE 187 — speech is where an emoji becomes a spoken word. Strip it before
  // the block grammar runs, so a bullet that was only an emoji disappears
  // instead of being read as a name.
  const lines = stripEmoji(input).split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }
    if (/^#{1,4}\s+/.test(line)) {
      blocks.push(stripSpans(line.replace(/^#{1,4}\s+/, "").trim()));
      i += 1;
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i]!)) {
        const text = stripSpans(lines[i]!.replace(/^\s*[-*•]\s+/, "").trim());
        if (text.length > 0) items.push(text);
        i += 1;
      }
      if (items.length > 0) blocks.push(items.join("\n"));
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i]!)) {
        const text = stripSpans(lines[i]!.replace(/^\s*\d+[.)]\s+/, "").trim());
        if (text.length > 0) items.push(text);
        i += 1;
      }
      if (items.length > 0) blocks.push(items.join("\n"));
      continue;
    }
    const acc: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i]!.trim().length > 0 && !isBlockStart(lines[i]!)) {
      acc.push(lines[i]!.trim());
      i += 1;
    }
    blocks.push(stripSpans(acc.join(" ")));
  }
  return blocks.join("\n");
}

function isBlockStart(line: string): boolean {
  return /^#{1,4}\s+/.test(line) || /^\s*[-*•]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line);
}

/**
 * `**bold**` and `` `code` `` contribute their words. A trailing unclosed run
 * stays out of the voice: hearing "star star" is exactly the bug this file
 * exists to remove.
 */
function stripSpans(input: string): string {
  return input
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/(\*\*|`)/g, "");
}
