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
// The bundled base model is a VRM 1.0 sample published by pixiv Inc. Its own
// embedded VRM meta grants exactly the rights we need (commercial use by a
// corporation, redistribution, modification, no credit required), so it is the
// one file allowed in the repo. It is a licensed *base*: a bespoke Egyptian
// teacher model can replace the file + this entry whenever it is ready, with no
// renderer change (the file is referenced only here).

// Emitted by Vite only when the Lab page is in the build graph (`?url`), so the
// student bundle never ships the model bytes.
import teacherModelUrl from "./assets/egyptian-teacher.vrm?url";

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
    id: "egyptian-teacher",
    nameAr: "المعلمة (مصرية)",
    descriptionAr: "معلمة مصرية بالغة، ودودة وواثقة — الشخصية الأولى للمنصة.",
    modelUrl: teacherModelUrl,
    modelLicense: {
      source:
        "https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm",
      terms:
        'VRM 1.0 embedded meta — authors: ["pixiv Inc."], copyrightInformation: "(c) 2022 pixiv Inc.", ' +
        "licenseUrl: https://vrm.dev/licenses/1.0/, commercialUsage: corporation, avatarPermission: everyone, " +
        "allowRedistribution: true, modification: allowModificationRedistribution, creditNotation: unnecessary.",
      commercialUse: "verified",
    },
    voices: [
      { language: "ar" },
      { language: "en" },
      { language: "fr" },
      { language: "de" },
      { language: "it", note: "بانتظار إثبات الصوت والشرح بالإيطالية فعلًا" },
    ],
    styleNotesAr: "ملامح طبيعية، تصميم احترافي مناسب لمنصة تعليمية عالمية.",
  },
];

export function getCharacter(id: string): AvatarCharacter | null {
  return AVATAR_CHARACTERS.find((c) => c.id === id) ?? null;
}

/** Whether the Lab can render this character right now. */
export function characterModelStatus(character: AvatarCharacter): "ready" | "pending-model" {
  return character.modelUrl ? "ready" : "pending-model";
}
