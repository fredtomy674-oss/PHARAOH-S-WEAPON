/**
 * PHASE 49 — live check of the streaming provider against the real API.
 *
 * The offline tests prove the *shape* of a stream; only the real endpoint can
 * prove that Gemini's SSE dialect is what we assume (framing, where the text
 * sits, whether usage metadata rides along). This prints measurements only —
 * never the key, never the whole reply beyond a short sample.
 *
 *   npx tsx scripts/stream-probe.ts
 */
import { GeminiLLMProvider } from "../src/modules/ai/providers/gemini.js";
import { TutorReplyStream } from "../src/modules/tutor/responseStream.js";

const provider = new GeminiLLMProvider();
const deltas: string[] = [];
const started = Date.now();

// The same output contract the tutor prompt states, so the probe exercises the
// real shape (a JSON reply with a `content` field) rather than a bare answer.
const SYSTEM =
  "أنت معلم رياضيات لطالب في الصف السادس الابتدائي. أجب دائمًا بصيغة JSON " +
  'بالشكل التالي حصرًا: {"content": "نص الرد بالعربية"}';

const request = {
  operation: "tutor" as const,
  messages: [
    { role: "system" as const, content: SYSTEM },
    { role: "user" as const, content: "عرّف «قابلية القسمة» في جملتين قصيرتين." },
  ],
  json: true,
  maxOutputTokens: 300,
};

const response = await provider.stream(request, (text) => {
  deltas.push(text);
});

// The same reader the tutor turn uses, fed with exactly what the provider sent.
const reader = new TutorReplyStream();
const preview: string[] = [];
for (const d of deltas) {
  const fresh = reader.push(d);
  if (fresh) preview.push(fresh);
}

let content = "";
let parseError: string | null = null;
try {
  content = (JSON.parse(response.content) as { content?: string }).content ?? "";
} catch (err) {
  parseError = err instanceof Error ? err.message : String(err);
}

// The comparison that matters most: streaming must not change what the model
// says. If the buffered path answers with prose where the streamed path answered
// with JSON, the two dialects are not the same request in the eyes of the API.
const buffered = await provider.complete(request);

console.log(
  JSON.stringify(
    {
      model: response.model,
      deltas: deltas.length,
      // If this is 1, the whole reply arrived in one piece and nothing was proven.
      firstDeltaChars: deltas[0]?.length ?? 0,
      reassemblesExactly: deltas.join("") === response.content,
      readerFoundContent: reader.found,
      previewEqualsStored: parseError === null && preview.join("") === content,
      parseError,
      storedChars: content.length,
      outputTokens: response.outputTokens,
      elapsedMs: Date.now() - started,
      sample: content.slice(0, 90),
      // Both dialects must agree on the *shape* of the answer.
      bufferedIsJson: buffered.content.trimStart().startsWith("{"),
      streamedIsJson: response.content.trimStart().startsWith("{"),
      bufferedHead: buffered.content.slice(0, 60).replace(/\s+/g, " "),
      streamedHead: response.content.slice(0, 60).replace(/\s+/g, " "),
    },
    null,
    2,
  ),
);
