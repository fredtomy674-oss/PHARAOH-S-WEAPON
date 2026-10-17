import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LIVE_TEACHER_STORAGE_KEY,
  readLiveTeacherPref,
  subscribeLiveTeacher,
  writeLiveTeacherPref,
} from "./liveTeacherPref.js";

/** Minimal localStorage so the preference module is tested in plain Node. */
function installStorage(): void {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

describe("PHASE 162 — the Live Teacher preference", () => {
  beforeEach(() => {
    installStorage();
  });

  it("defaults ON and persists OFF/ON as one stored value", () => {
    expect(readLiveTeacherPref()).toBe(true);
    writeLiveTeacherPref(false);
    expect(localStorage.getItem(LIVE_TEACHER_STORAGE_KEY)).toBe("0");
    expect(readLiveTeacherPref()).toBe(false);
    writeLiveTeacherPref(true);
    expect(localStorage.getItem(LIVE_TEACHER_STORAGE_KEY)).toBe("1");
    expect(readLiveTeacherPref()).toBe(true);
  });

  it("reads legacy/foreign values honestly: only '0'/'false' mean off", () => {
    localStorage.setItem(LIVE_TEACHER_STORAGE_KEY, "false");
    expect(readLiveTeacherPref()).toBe(false);
    localStorage.setItem(LIVE_TEACHER_STORAGE_KEY, "true");
    expect(readLiveTeacherPref()).toBe(true);
    localStorage.setItem(LIVE_TEACHER_STORAGE_KEY, "something-else");
    expect(readLiveTeacherPref()).toBe(true);
  });

  it("survives a storage that throws (private mode) with the default", () => {
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => {
        throw new Error("closed");
      },
      setItem: () => {
        throw new Error("closed");
      },
    };
    expect(readLiveTeacherPref()).toBe(true);
    expect(() => writeLiveTeacherPref(false)).not.toThrow();
  });

  it("notifies same-tab listeners on write — the open room flips instantly", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLiveTeacher(listener);
    writeLiveTeacherPref(false);
    expect(listener).toHaveBeenCalledTimes(1);
    writeLiveTeacherPref(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    writeLiveTeacherPref(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
