import { Fragment } from "react";
import { parseBlocks, type Span } from "./format.js";

/**
 * PHASE 53 — renders a tutor reply with its formatting (bold, lists, steps,
 * headings) instead of a flat wall of text.
 *
 * No `dangerouslySetInnerHTML` anywhere: every word travels as a React text
 * node, so a reply can never inject markup no matter what the model emits.
 * Newline text nodes between blocks keep the DOM text identical to
 * `stripMarkdown(text)` — narration and assertions read the same words.
 */
export default function FormattedText({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <>
      {blocks.map((b, i) => (
        <Fragment key={i}>
          {i > 0 ? "\n" : null}
          {b.k === "p" && (
            <p dir="auto" className="fmt-p">
              <Spans spans={b.spans} />
            </p>
          )}
          {b.k === "h" && (
            <h4 dir="auto" className="fmt-h">
              <Spans spans={b.spans} />
            </h4>
          )}
          {b.k === "ul" && (
            <ul dir="auto" className="fmt-ul">
              {b.items.map((item, j) => (
                <Fragment key={j}>
                  {j > 0 ? "\n" : null}
                  <li>
                    <Spans spans={item} />
                  </li>
                </Fragment>
              ))}
            </ul>
          )}
          {b.k === "ol" && (
            <ol dir="auto" className="fmt-ol">
              {b.items.map((item, j) => (
                <Fragment key={j}>
                  {j > 0 ? "\n" : null}
                  <li>
                    <Spans spans={item} />
                  </li>
                </Fragment>
              ))}
            </ol>
          )}
        </Fragment>
      ))}
    </>
  );
}

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) =>
        s.t === "strong" ? (
          <strong key={i}>{s.v}</strong>
        ) : s.t === "code" ? (
          <code key={i} dir="auto">
            {s.v}
          </code>
        ) : (
          <Fragment key={i}>{s.v}</Fragment>
        ),
      )}
    </>
  );
}
