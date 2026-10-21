/**
 * PHASE 185 — مسارات الثانوية.
 *
 * The grade alone is not enough from Secondary-2 onward: a science student and
 * a literature student in the same grade study different subjects, and the app
 * must never enroll one in the other's books. A curriculum with `track = null`
 * is common to both; a curriculum with a track belongs to that track only.
 *
 * Codes are stable (stored on `students.track` / `curricula.track`); labels are
 * presentation. More specific G12 tracks (`science-biology`, `science-math`)
 * can be added here later without a schema change.
 */
export const TRACKS = [
  { code: "science", name: "Science", nameAr: "علمي" },
  { code: "literature", name: "Literature", nameAr: "أدبي" },
] as const;

export type TrackCode = (typeof TRACKS)[number]["code"];

export interface TrackOption {
  code: string;
  name: string;
  nameAr: string;
}

const BY_CODE = new Map<string, TrackOption>(TRACKS.map((track) => [track.code, { ...track }]));

export function isKnownTrack(code: string | null | undefined): code is TrackCode {
  return Boolean(code && BY_CODE.has(code));
}

export function trackLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return BY_CODE.get(code)?.nameAr ?? code;
}

export function trackOption(code: string): TrackOption {
  return BY_CODE.get(code) ?? { code, name: code, nameAr: code };
}

/** Stable display order: science then literature, unknown codes last. */
export function sortTrackCodes(codes: string[]): string[] {
  const order = new Map<string, number>(TRACKS.map((track, i) => [track.code, i]));
  return [...new Set(codes)].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99) || a.localeCompare(b));
}
