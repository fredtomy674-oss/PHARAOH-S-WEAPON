import { describe, expect, it } from "vitest";
import { AVATAR_CHARACTERS, characterModelStatus, getCharacter } from "./characterRegistry.js";

describe("character registry", () => {
  it("ships exactly one character with a five-language voice plan", () => {
    expect(AVATAR_CHARACTERS).toHaveLength(1);
    expect(AVATAR_CHARACTERS[0]!.voices.map((v) => v.language)).toEqual(["ar", "en", "fr", "de", "it"]);
  });

  it("marks the bundled slot pending until a licensed model is approved", () => {
    const character = getCharacter("egyptian-teacher")!;
    expect(character.modelUrl).toBeNull();
    expect(characterModelStatus(character)).toBe("pending-model");
  });

  it("returns null for unknown ids", () => {
    expect(getCharacter("no-such-teacher")).toBeNull();
  });
});
