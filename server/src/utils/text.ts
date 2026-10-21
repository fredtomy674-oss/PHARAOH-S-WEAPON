/**
 * PHASE 187 — a reply is read aloud, so a pictograph is not decoration.
 *
 * The owner listened to a real G11 tutor reply and heard the emoji spoken by
 * the voice ("قلب أزرق", a check mark, a light bulb). Removing the emoji only
 * from the narration is not enough: the same text is shown in the room, copied
 * into the transcript, and read by the browser voice when the server voice is
 * unavailable. So the reply is cleaned once at its source, and every downstream
 * projection (display, streaming preview, speech) keeps the same words.
 *
 * The ranges below cover emoji proper, their presentation selectors, skin-tone
 * modifiers, keycap marks, flags and tag sequences. Arabic letters and harakat
 * are outside every range and are never touched — the owner wants more tashkeel,
 * not less.
 */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

/**
 * Removes emoji and leaves readable prose.
 *
 * Deleting a pictograph between two words must not leave a double space, and
 * deleting one at the start of a line must not leave an indentation that turns
 * the line into a markdown code block. Lines that become empty after the
 * removal (a bullet that carried only an emoji) are dropped rather than shipped
 * as a blank bullet.
 */
export function stripEmoji(input: string): string {
  if (!input) return input;
  return input
    // Remove the pictographs themselves.
    .replace(EMOJI, "")
    // A removed emoji between two words leaves two spaces; one is enough.
    .replace(/[ \t]{2,}/g, " ")
    // A removed emoji before punctuation leaves a space the voice would pause on.
    .replace(/[ \t]+(?=[،,.!?؟؛:])/g, "")
    // Keep newlines exact: a streamed chunk may end with one. Only clean the
    // spaces that belong to a line, never the chunk boundary in the middle.
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    // A bullet that carried only an emoji is not a bullet any more.
    .replace(/^[ \t]*[-*•][ \t]*(?=\n|$)/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}
