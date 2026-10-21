/**
 * PHASE 53 — reply formatting: the tutor writes light markdown (bold, bullets,
 * numbered steps, headings), and a wall of unformatted text is exactly what
 * the student complained about ("لا يوجد تنسيق فى الجلسه").
 *
 * Deliberately tiny and dependency-free: paragraphs, `**bold**`, `` `code` ``,
 * `-`/`*` bullets, `1.` steps, `#` headings. Anything else renders as plain
 * text — an unknown syntax must degrade to readable words, never vanish.
 *
 * The one invariant everything depends on: the rendered text (textContent) is
 * EXACTLY `stripMarkdown(text)`. The component inserts newline text nodes
 * between blocks so the DOM text matches the stripped projection character for
 * character — which is what keeps voice narration (spoken === shown) and every
 * textContent-based test true by construction.
 */

/**
 * PHASE 187 — the room is read aloud (server voice, or the browser voice when
 * the server voice is down), so a pictograph in a tutor reply becomes a spoken
 * word. The server cleans new replies at the source; this is the display and
 * old-transcript defence, and it keeps `stripMarkdown` — and therefore the
 * browser fallback — free of the same characters.
 */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

/** Remove emoji without touching Arabic letters, harakat or arithmetic signs. */
export function stripEmoji(input: string): string {
  if (!input) return input;
  return input
    .replace(EMOJI, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+(?=[،,.!?؟؛:])/g, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^[ \t]*[-*•][ \t]*(?=\n|$)/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}

export type Span = { t: "text" | "strong" | "code"; v: string };

export type Block =
  | { k: "p"; spans: Span[] }
  | { k: "ul"; items: Span[][] }
  | { k: "ol"; items: Span[][] }
  | { k: "h"; spans: Span[] };

const HEADING_RE = /^#{1,4}\s+(.*)$/;
const UL_RE = /^\s*[-*•]\s+(.*)$/;
const OL_RE = /^\s*(\d+)[.)]\s+(.*)$/;

/** Split the reply into renderable blocks (blank lines separate paragraphs). */
export function parseBlocks(input: string): Block[] {
  const blocks: Block[] = [];
  // Every rendering and narration path goes through this function, so cleaning
  // here covers the live reply, an old stored reply, and the browser voice.
  const lines = stripEmoji(input).split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }
    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push({ k: "h", spans: parseSpans(heading[1]!.trim()) });
      i += 1;
      continue;
    }
    const ul = UL_RE.exec(line);
    if (ul) {
      const items: Span[][] = [];
      while (i < lines.length) {
        const m = UL_RE.exec(lines[i]!);
        if (!m) break;
        items.push(parseSpans(m[1]!.trim()));
        i += 1;
      }
      if (items.some((s) => spansText(s).length > 0)) blocks.push({ k: "ul", items });
      continue;
    }
    const ol = OL_RE.exec(line);
    if (ol) {
      const items: Span[][] = [];
      while (i < lines.length) {
        const m = OL_RE.exec(lines[i]!);
        if (!m) break;
        items.push(parseSpans(m[2]!.trim()));
        i += 1;
      }
      if (items.some((s) => spansText(s).length > 0)) blocks.push({ k: "ol", items });
      continue;
    }
    // A paragraph runs to the next blank line; single newlines inside it are
    // soft breaks (one breath, not a new block).
    const acc: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i]!.trim().length > 0 && !isBlockStart(lines[i]!)) {
      acc.push(lines[i]!.trim());
      i += 1;
    }
    blocks.push({ k: "p", spans: parseSpans(acc.join(" ")) });
  }
  return blocks;
}

function isBlockStart(line: string): boolean {
  return HEADING_RE.test(line) || UL_RE.test(line) || OL_RE.test(line);
}

/** Inline spans: `**bold**` and `` `code` `` — unclosed markers stay literal. */
export function parseSpans(input: string): Span[] {
  const spans: Span[] = [];
  const re = /(\*\*.+?\*\*|`[^`]+?`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) spans.push({ t: "text", v: input.slice(last, m.index) });
    const token = m[0]!;
    if (token.startsWith("**")) spans.push({ t: "strong", v: token.slice(2, -2) });
    else spans.push({ t: "code", v: token.slice(1, -1) });
    last = m.index + token.length;
  }
  if (last < input.length) spans.push({ t: "text", v: input.slice(last) });
  return spans.filter((s) => s.v.length > 0);
}

function spansText(spans: Span[]): string {
  return spans.map((s) => s.v).join("");
}

/**
 * The canonical plain-text projection of a reply: markers removed, text kept,
 * blocks separated by single newlines. The rendered DOM text equals this
 * exactly (see the invariant above), so narration reads what is shown and
 * string assertions on either view agree.
 */
export function stripMarkdown(input: string): string {
  return parseBlocks(input)
    .map((b) => {
      switch (b.k) {
        case "p":
        case "h":
          return spansText(b.spans);
        case "ul":
        case "ol":
          return b.items.map(spansText).join("\n");
      }
    })
    .join("\n");
}

/**
 * The live preview's text: `stripMarkdown`, except a trailing UNCLOSED marker
 * run (`**…` / `` `… ``) is held back instead of leaking literal asterisks
 * into the bubble.
 *
 * Why the preview needs its own projection: the E2E live contract is that
 * every frame is a prefix of the kept reply. A frame cut mid-`**bold**` would
 * render the literal `**` while the finished reply renders `bold` — a flicker
 * that reads as the room taking words back. Closed pairs and block markers
 * are stable (they parse the same in the prefix and the whole), so only the
 * trailing unclosed run is special — found by parity: an odd count leaves
 * exactly one run open, starting at its last occurrence.
 */
export function previewText(input: string): string {
  return stripMarkdown(cutTrailingUnclosed(cutTrailingUnclosed(input, "**"), "`"));
}

function cutTrailingUnclosed(input: string, marker: string): string {
  let count = 0;
  let from = 0;
  while (true) {
    const at = input.indexOf(marker, from);
    if (at < 0) break;
    count += 1;
    from = at + marker.length;
  }
  if (count % 2 === 0) return input;
  return input.slice(0, input.lastIndexOf(marker));
}
