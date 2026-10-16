// Avatar Lab public surface (the lesson room never imports this).
export { AVATAR_CHARACTERS, characterModelStatus, getCharacter } from "./characterRegistry.js";
export type { AvatarCharacter, AvatarModelLicense, AvatarVoice, AvatarVoiceLanguage, ModelLicenseStatus } from "./characterRegistry.js";
export { AVATAR_STATE_AR, nextState } from "./avatarStates.js";
export type { AvatarEvent, AvatarState } from "./avatarStates.js";
export { EXPRESSION_PRESETS, FULL_OPEN_RMS, SILENCE_RMS, amplitudeToMouth, expressionForState, isBlinkTime, rms, smoothLevel } from "./visemeMapper.js";
export {
  BASE_ARMS_POSE,
  LIFE_BONES,
  createLifeAnimator,
  lifeBlinkWeight,
  lifePoseAt,
  poseForState,
} from "./lifeLayer.js";
export type { LifeBone, LifeFrame, LifeInput, LifePose } from "./lifeLayer.js";
export { useMouthSync } from "./useMouthSync.js";
export { LOW_FPS_THRESHOLD, VrmAvatar } from "./VrmAvatar.js";
export type { AvatarLoadStatus, VrmAvatarProps } from "./VrmAvatar.js";
export { AvatarLab } from "./AvatarLab.js";
