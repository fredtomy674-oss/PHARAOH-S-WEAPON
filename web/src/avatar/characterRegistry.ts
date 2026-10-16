// Avatar Lab — character registry.
//
// One character now, many later: every character is one entry here (look,
// voice per lesson language, interaction style). Nothing in the renderer keys
// off a hardcoded character — adding the second teacher is adding one entry,
// never a second system.
//
// A `modelUrl` of null means "slot reserved, model pending": the Lab renders
// its file-picker path for that character until a commercially-licensed model
// is approved and its source + terms are recorded below. No model of unknown
// license is ever bundled.
//
// The bundled base model is "Sakurada Fumiriya", a VRoid Studio sample character
// whose own embedded VRM meta grants the widest possible rights: LicenseType
// **CC0** (public domain) with allowedUserName "Everyone" and commercial usage
// "Allow" — so it may be used, modified, and redistributed freely, including
// inside this repository, with no attribution required. We still record the
// source + exact metadata below. It is a licensed *base*: a bespoke model can
// replace the file + this entry whenever it is ready, with no renderer change
// (the file is referenced only here).

// Emitted by Vite only when the Lab page is in the build graph (`?url`), so the
// student bundle never ships the model bytes.
import tutorModelUrl from "./assets/tutor.vrm?url";

/** Reply languages the avatar can voice. `it` is probed in the Lab, not claimed. */
export type AvatarVoiceLanguage = "ar" | "en" | "fr" | "de" | "it";

export interface AvatarVoice {
  language: AvatarVoiceLanguage;
  /** Operator voice name for server TTS (absent = provider default). */
  voiceName?: string;
  /** Human note, e.g. why this voice is still unproven. */
  note?: string;
}

export type ModelLicenseStatus = "verified" | "pending" | "not-allowed";

export interface AvatarModelLicense {
  /** Where the file came from (URL or "user-supplied file"). */
  source: string;
  /** The exact permission text the source states. */
  terms: string;
  commercialUse: ModelLicenseStatus;
}

export interface AvatarCharacter {
  id: string;
  nameAr: string;
  descriptionAr: string;
  /** Same-origin URL under /public/avatars, or null while the model is pending. */
  modelUrl: string | null;
  modelLicense?: AvatarModelLicense;
  voices: readonly AvatarVoice[];
  styleNotesAr: string;
}

export const AVATAR_CHARACTERS: readonly AvatarCharacter[] = [
  {
    id: "tutor",
    nameAr: "المعلّم",
    descriptionAr: "معلّم بشري بأسلوب أنيمي نظيف، وقور وودود — الشخصية الأولى للمنصة.",
    modelUrl: tutorModelUrl,
    modelLicense: {
      source: "https://github.com/madjin/vrm-samples/blob/HEAD/vroid/beta/Sakurada_Fumiriya.vrm",
      terms:
        'VRM 0.x embedded meta — LicenseType: "CC0" (public domain), allowedUserName: "Everyone", ' +
        'commercialUssageName: "Allow", violentUssageName: "Allow", sexualUssageName: "Allow". ' +
        "CC0 waives copyright: unrestricted use, modification and redistribution, no attribution required.",
      commercialUse: "verified",
    },
    voices: [
      { language: "ar" },
      { language: "en" },
      { language: "fr" },
      { language: "de" },
      { language: "it", note: "بانتظار إثبات الصوت والشرح بالإيطالية فعلًا" },
    ],
    styleNotesAr:
      "زيّه المهني الأصلي كما هو: قميص أبيض + صديري كحلي + كرافة برتقالية (لا تُبنى ملابس ولا يُضاف حجاب). " +
      "يُحوَّل شعره وحاجباه إلى بني غامق طبيعي عبر إعادة تلوين خامات فقط (tutorLook.ts). النموذج عيّنة VRoid مرخّصة CC0.",
  },
];

export function getCharacter(id: string): AvatarCharacter | null {
  return AVATAR_CHARACTERS.find((c) => c.id === id) ?? null;
}

/** Whether the Lab can render this character right now. */
export function characterModelStatus(character: AvatarCharacter): "ready" | "pending-model" {
  return character.modelUrl ? "ready" : "pending-model";
}
