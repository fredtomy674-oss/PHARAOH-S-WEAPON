// PHASE 162 (W7.1) — البديل الثابت: رأس معلّم خطّي بلا أي رسوم ثلاثية الأبعاد.
//
// يظهر في ثلاثة مواضع بنفس الرسم الواحد: رأس اللوحة المطويّة، ووضع «بلا WebGL
// أو جهاز بطيء» داخل المسرح، وبطاقة الرئيسية. لا شخصية جديدة تُخترع هنا —
// رسم خطّي محيّد بلون رمز واحد (يرث لون النص من الصنف)، يُستبدل بكلمة من المالك
// إن أراد غيره.

export interface TeacherMascotProps {
  className?: string;
  /** نصّ قارئ الشاشة؛ مرّر null للرسم الزخرفي بجانب نصّ يشرح نفسه. */
  label?: string | null;
}

export function TeacherMascot({ className, label = "معلّمك الحيّ" }: TeacherMascotProps) {
  const classes = ["w7-mascot", className ?? ""].filter(Boolean).join(" ");
  return (
    <svg
      className={classes}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
    >
      <circle cx="24" cy="24" r="21" strokeWidth="1.6" opacity="0.45" />
      <circle cx="24" cy="19.6" r="6.2" />
      <path d="M11.8 39c1.6-6.3 6.5-9.7 12.2-9.7S34.6 32.7 36.2 39" />
    </svg>
  );
}
