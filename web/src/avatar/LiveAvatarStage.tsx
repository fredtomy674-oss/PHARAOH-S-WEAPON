// PHASE 162 (W7.1/W7.5) — مسرح المعلّم الحيّ: الحزمة الثقيلة وحدها.
//
// هذا الملف لا يدخل حزمة الطالب أبدًا إلا عند فتح اللوحة: الغرفة تستورد
// LiveTeacher (هيكل خفيف)، وهي تستورد هذا الملف كسولًا (dynamic import)، وهو
// وحده يستورد three.js + @pixiv/three-vrm + ملف النموذج (18MB). من أطفأ
// «المعلّم الحيّ» لا يُحمِّل منها بايتًا واحدًا.
//
// البديل الثابت (قبول W7.1/W7.5): بلا WebGL، أو فشل تحميل النموذج، أو جهاز
// أبطأ من العتبة (LOW_FPS_THRESHOLD لثانية متصلة) ⇒ رأس خطّي ساكن بدل المشهد
// ثلاثي الأبعاد — «المعلّم معك» يبقى صحيحًا دائمًا.
//
// تقليل الحركة: يُمرَّر كما هو إلى VrmAvatar (وضع ثابت، الفم وحده يتبع الصوت).

import { useMemo, useRef, useState } from "react";
import { LOW_FPS_THRESHOLD, VrmAvatar, type AvatarLoadStatus } from "./VrmAvatar.js";
import { getCharacter } from "./characterRegistry.js";
import type { AvatarState } from "./avatarStates.js";
import type { MouthReader } from "./mouthReader.js";
import { TeacherMascot } from "../TeacherMascot.js";

export interface LiveAvatarStageProps {
  /** الحالة الحيّة من الغرفة — تُمرَّر كما هي، لا تُشتق هنا. */
  state: AvatarState;
  /** قارئ الفم: مظروف صوت الخادم أو نبض حدود المتصفح. */
  mouth: MouthReader;
}

/** عدد تقارير الـFPS المنخفضة المتتالية قبل التحوّل للوضع الخفيف (≈ثانية). */
const LOW_FPS_STREAK = 4;

export function LiveAvatarStage({ state, mouth }: LiveAvatarStageProps) {
  const model = useMemo(() => getCharacter("tutor")?.modelUrl ?? null, []);
  const [status, setStatus] = useState<AvatarLoadStatus>("empty");
  const [detail, setDetail] = useState<string | null>(null);
  const [slowDevice, setSlowDevice] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  const lowStreak = useRef(0);

  const onStatus = (next: AvatarLoadStatus, why?: string) => {
    setStatus(next);
    if (next === "error") setDetail(why ?? null);
  };

  const onFps = (fps: number) => {
    if (fps > 0 && fps < LOW_FPS_THRESHOLD) {
      lowStreak.current += 1;
      if (lowStreak.current >= LOW_FPS_STREAK) setSlowDevice(true);
    } else {
      lowStreak.current = 0;
    }
  };

  const fallback = !model || slowDevice || status === "error";

  if (fallback) {
    const note = slowDevice
      ? "وضع خفيف — جهازك لا يحمل الحركة بسلاسة، والمعلّم معك بلا رسوم متحركة."
      : model
        ? detail ?? "تعذّر تشغيل الرسم على هذا الجهاز — معلّمك معك في الوضع الخفيف."
        : "معلّمك معك — النموذج قيد التجهيز.";
    return (
      <div
        className="w7-av"
        data-status={status}
        data-fallback="1"
        data-motion={reducedMotion ? "reduced" : "full"}
        data-testid="live-teacher-fallback"
        title={note}
      >
        <TeacherMascot className="w7-av__art" label={null} />
        <p className="w7-av__note">{note}</p>
      </div>
    );
  }

  return (
    <div className="w7-av" data-status={status} data-fallback="0" data-motion={reducedMotion ? "reduced" : "full"}>
      <VrmAvatar
        model={model}
        avatarState={state}
        getMouthOpen={mouth.getMouthOpen}
        reducedMotion={reducedMotion}
        onStatus={onStatus}
        onFps={onFps}
      />
      {status !== "ready" && <p className="w7-av__note">يجهّز معلّمك…</p>}
      {reducedMotion && status === "ready" && (
        <p className="w7-av__note">تقليل الحركة مفعّل — الفم وحده يتبع الصوت.</p>
      )}
    </div>
  );
}
