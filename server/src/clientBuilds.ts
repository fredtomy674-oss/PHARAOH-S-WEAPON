/**
 * PHASE 174 — which web build is really running on a device.
 *
 * The live-conversation defect survived rounds of "please try again" partly
 * because a phone can keep an old bundle open for hours: the fix shipped, the
 * page never got it, and the next report described the previous week's
 * behaviour. The page now reports itself once per load
 * (`main.tsx` → GET /api/health?v=…). Only the LATEST sighting is kept: the
 * question this answers is "is the fix in the bundle the caller is holding
 * right now?" — not traffic accounting.
 */
export interface ClientBuild {
  build: string;
  /** When this build last spoke to the server (ISO-8601). */
  at: string;
}

let last: ClientBuild | null = null;

/** Records one page-load beacon. Unrecognized shapes are ignored in silence. */
export function recordClientBuild(raw: unknown): void {
  if (typeof raw !== "string") return;
  const build = raw.trim();
  // A build id is small and plain; anything else is noise, not a sighting —
  // truncated junk must never masquerade as a build.
  if (build.length === 0 || build.length > 24) return;
  if (!/^[0-9A-Za-z._-]+$/.test(build)) return;
  last = { build, at: new Date().toISOString() };
}

/** The last build any page reported, or null before the first beacon. */
export function lastClientBuild(): ClientBuild | null {
  return last;
}
