import { describe, expect, it } from "vitest";
import { AVATAR_CHARACTERS, characterModelStatus, getCharacter } from "./characterRegistry.js";

describe("character registry", () => {
  it("ships exactly one character with a five-language voice plan", () => {
    expect(AVATAR_CHARACTERS).toHaveLength(1);
    expect(AVATAR_CHARACTERS[0]!.voices.map((v) => v.language)).toEqual(["ar", "en", "fr", "de", "it"]);
  });

  it("bundles one commercially-verified model for the slot", () => {
    const character = getCharacter("egyptian-teacher")!;
    expect(typeof character.modelUrl).toBe("string");
    expect(character.modelUrl && character.modelUrl.length > 0).toBe(true);
    expect(character.modelLicense?.commercialUse).toBe("verified");
    expect(characterModelStatus(character)).toBe("ready");
  });

  it("returns null for unknown ids", () => {
    expect(getCharacter("no-such-teacher")).toBeNull();
  });
});
