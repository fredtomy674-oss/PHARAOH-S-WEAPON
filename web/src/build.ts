/**
 * PHASE 174 — the build the running page came from. The live-conversation
 * defect survived several rounds of "please try again" partly because a phone
 * can keep an old bundle open for hours (a tab that never reloads, an
 * installed PWA resumed from memory): the fix shipped, the page never got it.
 * This number is bumped with every web deploy and reported once per page load
 * (`main.tsx` → GET /api/health?v=…), so the server can always answer "which
 * build is talking to me right now?".
 */
export const APP_BUILD = "176";
