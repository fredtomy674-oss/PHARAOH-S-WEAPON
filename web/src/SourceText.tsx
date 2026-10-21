import { Fragment } from "react";
import { parseSpans, type Span } from "./format.js";
import { parseSourceBlocks } from "./sourceMarkdown.js";

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

/**
 * PHASE 182 — lesson-source text with real tables.
 *
 * No HTML injection: every cell is a React text node. A pipe table becomes a
 * semantic <table>; everything else keeps the readable paragraph/list shape
 * the sources already use.
 */
export default function SourceText({ text }: { text: string }) {
  const blocks = parseSourceBlocks(text);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          return (
            <p key={i} className="ln-src__heading">
              <Spans spans={parseSpans(b.text)} />
            </p>
          );
        }
        if (b.kind === "table") {
          return (
            <div key={i} className="ln-src__tablewrap">
              <table className="ln-src__table" data-testid="source-table">
                <thead>
                  <tr>
                    {b.header.map((cell, j) => (
                      <th key={j} scope="col">
                        <Spans spans={parseSpans(cell)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>
                          <Spans spans={parseSpans(cell)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (b.kind === "list") {
          const List = b.ordered ? "ol" : "ul";
          return (
            <List key={i} className="ln-src__list">
              {b.items.map((item, j) => (
                <li key={j}>
                  <Spans spans={parseSpans(item)} />
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={i} className="ln-src__text" data-testid="source-text">
            <Spans spans={parseSpans(b.text)} />
          </p>
        );
      })}
    </>
  );
}
