// PHASE 162 (W7) — «المعلّم الحيّ» في غرفة الدرس: لوحة قابلة للطيّ.
//
// قواعد التصميم التي تحكم هذا الملف:
//  • صفر بايتات لمَن أطفأه: لا يُستورد هنا شيء من عالم الأفاتار — المسرح
//    ثلاثي الأبعاد (VrmAvatar + النموذج) يُحمَّل كسولًا عند فتح اللوحة فقط.
//  • الحالات تأتي جاهزة من الغرفة (مشتقة من أحداث حقيقية فقط) — هذه اللوحة
//    لا تخترع حالة، ولا تفسّر صمتًا، وتعرض التسمية العربية نفسها للآلة الثمانية.
//  • الإشارة المرجعية (§١٥ «المرجع لا النسخ»): المعلّم يشير إلى صفحة كتاب
//    الطالب نفسه — «صفحة ٦» — بلا أي صورة من الكتاب؛ وبلا مرجع ⇒ بلا إشارة.

import { Suspense, lazy, useState } from "react";
import { AVATAR_STATE_AR, type AvatarState } from "./avatar/avatarStates.js";
import type { MouthReader } from "./avatar/mouthReader.js";
import { TeacherMascot } from "./TeacherMascot.js";

/** المسرح ثلاثي الأبعاد في حزمة منفصلة — لا تُطلَب إلا عند فتح اللوحة. */
const LiveAvatarStage = lazy(() =>
  import("./avatar/LiveAvatarStage.js").then((module) => ({ default: module.LiveAvatarStage })),
);

export interface LiveTeacherProps {
  /** الحالة الحيّة (من آلة الحالات الثماني — أحداث حقيقية فقط). */
  state: AvatarState;
  /** قارئ الفم: مظروف صوت الخادم الحقيقي / نبض حدود صوت المتصفح. */
  mouth: MouthReader;
  /** الصفحة الحالية من شريط المرجع نفسه، أو null (بلا مرجع ⇒ بلا إشارة). */
  reference: { page: number; label: string; total: number } | null;
  /** يحرّك شريط المرجع إلى الصفحة — نفس سلوك رقائق «كتابك». */
  onOpenReference: (page: number) => void;
}

export function LiveTeacher({ state, mouth, reference, onOpenReference }: LiveTeacherProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="w7-panel" data-testid="live-teacher" data-state={state}>
      <header className="w7-head">
        <TeacherMascot className="w7-head__mascot" />
        <div className="w7-head__who">
          <strong>معلّمك الحيّ</strong>
          <span className="w7-state" data-testid="live-teacher-state" data-state={state}>
            <i className="w7-state__dot" aria-hidden="true" />
            {AVATAR_STATE_AR[state]}
          </span>
        </div>
        {reference && (
          <button
            type="button"
            className="w7-ref"
            data-testid="live-teacher-ref"
            title="افتح كتابك على صفحة المعلّم الحالية"
            onClick={() => onOpenReference(reference.page)}
          >
            <span aria-hidden="true">📖</span> {reference.label}
          </button>
        )}
        <button
          type="button"
          className="w7-open"
          data-testid="live-teacher-open"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "أخفِ الحركة" : "شغّل الحركة ▶"}
        </button>
      </header>
      {/* PHASE 182 — the 3D model is optional and heavy; say so BEFORE a phone
          downloads it. The lesson itself never depends on these bytes. */}
      {!open && (
        <p className="w7-size" data-testid="live-teacher-size">
          الحركة نموذج ثلاثي الأبعاد اختياري (≈19 ميجابايت) — الحصة تعمل كاملة بدونه.
        </p>
      )}
      {open && (
        <div className="w7-stage" data-testid="live-teacher-stage">
          <Suspense fallback={<p className="w7-stage__note">يجهّز معلّمك…</p>}>
            <LiveAvatarStage state={state} mouth={mouth} />
          </Suspense>
        </div>
      )}
    </section>
  );
}
