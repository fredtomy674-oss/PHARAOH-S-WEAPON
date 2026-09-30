/**
 * PHASE 46 — prompt-mirror guard.
 *
 * A weak model occasionally answers a tutor turn by MIRRORING the system
 * prompt instead of tutoring: the reply restates the persona, the lesson
 * context and the constraints (often in English) and never addresses the
 * student. The tokens these echoes share are internal to our own prompt and
 * never appear in a legitimate reply, so matching them carries no risk of a
 * false positive on a real answer — while a bare "did it mention our name?"
 * check would (the tutor is allowed to greet as «سلاح الفرعون»).
 *
 * PHASE 52 — gemma's second dialect. Beside the `Persona:`/`Constraints:`
 * mirror, the model also answers thin prompts with a bullet list of its own
 * assignment (`* Role: 6th-grade math teacher. * Task: Define … * Constraint:
 * Output must be *only* a valid, parseable JSON … * Concept: … * Draft 1
 * (Arabic): … * Refining for 6th grade: …`), observed live. Variants drop the
 * `Constraint:` line (`* My Role:` / `* User Role:` / `* Task:`), which is
 * exactly what the PHASE 46 markers miss.
 */

/** Distinctive fingerprints of a mirror reply (our prompt's own internal wording). */
const ECHO_MARKERS: RegExp[] = [
  /\bPersona\s*:/i,
  /\bUser'?s?\s+Question\s*:/i,
  /\bConstraints?\s*:/i,
  /\bDon'?t\s+give\s+the\s+answer\b/i,
  /حماية\s*النظام/i,
  /قواعد\s*سلوكية\s*ثابتة/i,
  // The user-turn lines we write ourselves; a reply never starts with them.
  /^\s*الطالب\s+(?:يسأل|يجيب)/m,
];

/**
 * Gemma's bullet dialect (`* Role:`, `* Task:`, …). These fire only as a PAIR:
 * a single `* Task:` bullet can be a legitimate exercise line (especially in a
 * foreign-language lesson), but a real reply never stacks two assignment
 * bullets — while a mirror is a list by nature (the live capture carries
 * seven).
 */
const BULLET_MIRROR_MARKERS: RegExp[] = [
  /^\s*\*\s*Role\s*:/im,
  /^\s*\*\s*Task\s*:/im,
  /^\s*\*\s*Concept\s*:/im,
  /^\s*\*\s*Language\s*:/im,
];

/**
 * Smoking guns: internal drafting the tutor never does out loud. No
 * legitimate 6th-grade reply numbers its own drafts, narrates refining them,
 * states a JSON output contract, or assigns English bullet roles.
 */
const MIRROR_SMOKING_GUNS: RegExp[] = [
  /^\s*\*\s*(?:My|User)\s+Role\s*:/im,
  /^\s*\*\s*Draft\s+\d/im,
  /^\s*\*\s*Refining\s+for/im,
  /parseable\s+JSON/i,
];

/** True when `text` looks like a mirror of our own prompt rather than a reply. */
export function looksLikePromptEcho(text: string): boolean {
  if (ECHO_MARKERS.some((p) => p.test(text))) return true;
  if (MIRROR_SMOKING_GUNS.some((p) => p.test(text))) return true;
  return BULLET_MIRROR_MARKERS.filter((p) => p.test(text)).length >= 2;
}

export interface RegenerateResult<T> {
  /** The last produced response (after bounded regeneration). */
  response: T;
  /** How many times an echo reply was regenerated (0 = clean on first try). */
  regens: number;
}

/**
 * Runs `produce` and, while the produced content looks like a prompt echo,
 * regenerates it — bounded, so a model that keeps mirroring cannot stall the
 * turn forever. The `attempt` index (0 = first call, 1..n = regenerations)
 * lets the caller vary the request per attempt — a blind repetition of an
 * identical prompt does not break a model stuck mirroring, a short nudge does.
 * The final response is always returned (even an echo): the caller decides
 * whether to degrade it gracefully.
 */
export async function regenerateEchoes<T extends { content: string }>(
  produce: (attempt: number) => Promise<T>,
  maxRegens: number,
): Promise<RegenerateResult<T>> {
  let response = await produce(0);
  let regens = 0;
  while (regens < maxRegens && looksLikePromptEcho(response.content)) {
    regens += 1;
    response = await produce(regens);
  }
  return { response, regens };
}
