import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTO_READ_STORAGE_KEY,
  readAutoReadPref,
  subscribeAutoRead,
  writeAutoReadPref,
} from "./autoReadPref.js";

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

describe("PHASE 166 — the auto-read preference", () => {
  beforeEach(() => {
    installStorage();
  });

  it("defaults ON and persists OFF/ON as one stored value", () => {
    expect(readAutoReadPref()).toBe(true);
    writeAutoReadPref(false);
    expect(localStorage.getItem(AUTO_READ_STORAGE_KEY)).toBe("0");
    expect(readAutoReadPref()).toBe(false);
    writeAutoReadPref(true);
    expect(localStorage.getItem(AUTO_READ_STORAGE_KEY)).toBe("1");
    expect(readAutoReadPref()).toBe(true);
  });

  it("reads legacy/foreign values honestly: only '0'/'false' mean off", () => {
    localStorage.setItem(AUTO_READ_STORAGE_KEY, "false");
    expect(readAutoReadPref()).toBe(false);
    localStorage.setItem(AUTO_READ_STORAGE_KEY, "true");
    expect(readAutoReadPref()).toBe(true);
    localStorage.setItem(AUTO_READ_STORAGE_KEY, "something-else");
    expect(readAutoReadPref()).toBe(true);
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
    expect(readAutoReadPref()).toBe(true);
    expect(() => writeAutoReadPref(false)).not.toThrow();
  });

  it("notifies same-tab listeners on write — the open room flips instantly", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAutoRead(listener);
    writeAutoReadPref(false);
    expect(listener).toHaveBeenCalledTimes(1);
    writeAutoReadPref(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    writeAutoReadPref(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
