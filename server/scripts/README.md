# server/scripts — curriculum book pipeline

Tools used to import an Egyptian Ministry book («كتاب الوزارة») into the app as a
verified curriculum tree. Two things this pipeline produces are committed:

- the OCR text under `server/data/curriculum-ocr/<subject>-<term>/` (fetched text
  is source, not runtime state), and
- the tree itself as `server/src/db/egypt<Topic>T1.ts`.

Run every command **from `server/`** so `dotenv` finds `.env` (it holds
`GEMINI_API_KEY`; the key never leaves the server).

## Import a whole book (one command)

`import-book.mjs` runs the three stages below in order. It is resumable: each
stage skips what already exists, so a re-run only pays for what is missing.

```sh
SUBJECT=science TERM=t2 PDF_PATH="../Downloads/Science_Primary6_T2.pdf" \
  npx tsx scripts/import-book.mjs
```

| Env | Meaning |
|---|---|
| `SUBJECT`, `TERM`, `PDF_PATH` | required |
| `BASE_DIR` | scratch dir, default `scripts/.import-<subject>-<term>` |
| `OCR_OUT` | committed OCR dir, default `data/curriculum-ocr/<subject>-<term>` |
| `TARGET_WIDTH` (1600) | rendered page width in px |
| `CONCURRENCY` (4) | parallel renders / OCR calls |
| `SKIP_RENDER=1` / `SKIP_OCR=1` | run only the later stages |

## Stages

| Stage | Tool | What it does |
|---|---|---|
| render | `render-book.mjs` | Renders each PDF page to `pages-NNN.jpg`. It serves the PDF over a tiny range-capable HTTP server so pdf.js streams one page at a time — fulfilling a 90 MB scan in one response crashed the Chromium renderer. Resumable via `SKIP_EXISTING`. |
| OCR | `ocr-all.mjs` | OCRs every page with Gemini, `CONCURRENCY` calls in flight, per-page retry, and model rotation (`GEMINI_OCR_MODELS` / `GEMINI_OCR_MODEL`) with a pool-wide back-off on 429/503. Resumable: a non-empty `pages-NNN.txt` is skipped. Prints the «ن-م» concept heads it saw. |
| manifest | `book-manifest.mjs` | Reads the OCR corpus and emits a **draft** tree skeleton: the dominant footer offset, chapter/unit openers, and concept heads. A draft, not an authority — the seeder still re-reads the book (`assertTreeMatchesTheBook`) before it will run. |

## Verification and audit

- `audit-curricula.ts` — for every committed Egypt curriculum, checks that lesson
  ranges tile the whole book with no gap and no overlap, and that every page in
  that span carries real OCR text. A page owned by no lesson, an empty page, or
  the OCR model's «لا يوجد نص مكتوب في الصورة المرفقة» placeholder is a gap the
  tutor cannot see. `npx tsx scripts/audit-curricula.ts` → `scripts/.audit-out.txt`.
- `extract-layer-all.mjs` — dumps a PDF's embedded text layer to `pages-NNN.txt`
  and reports pages with garbled font runs (missing `ToUnicode`). Used to decide
  OCR vs. text layer for a book, and to identify pages that are pure images.
- `extract-targets.mjs` — pulls the printed “Learning Target” lines of given
  lessons from an OCR book (`<ocrDir> <offset> <bookPage,...>`); English-medium.
- `probe-models.mjs` — lists every Gemini model the configured key can address.
- `probe-ocr-models.mjs` — OCRs one page with each candidate model and reports
  which still answer; used when a model is 404 or quota-blocked.

## Notes

- The tree modules verify themselves before seeding (`isConsistent` +
  `assertTreeMatchesTheBook`), so a wrong page range fails the seed instead of
  silently hiding book content.
- Dot-prefixed files/dirs here (`.*`) are scratch and gitignored: render output,
  import logs, and the audit output.
- The other `*.mjs` files (`pdf-*.mjs`, `ocr-book.mjs`, `seed-splice.mjs`, …) are
  earlier one-off probes kept for reference.
