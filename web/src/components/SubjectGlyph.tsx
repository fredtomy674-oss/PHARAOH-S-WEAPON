import type { ReactElement } from "react";

/**
 * رمز المادة — لغة أشكال هندسية بلا صور (W0)، بلا أي لون خارج العائلة
 * (الخط يرث currentColor). مستخرج من الرئيسية 2.0 (PHASE 156) ليستخدمه
 * منتقي «تعلّم» (PHASE 159) بنفس الشكل — مصدر واحد للرمز.
 */
export function SubjectGlyph({ nameAr }: { nameAr: string }): ReactElement {
  if (nameAr.includes("رياض")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20h16M6.5 20L11 7l4.5 13M8.6 14.5h4.8" />
      </svg>
    );
  }
  if (nameAr.includes("علوم")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.5 3h5M10.5 3v5.5L5.8 17a2 2 0 001.8 3h8.8a2 2 0 001.8-3l-4.7-8.5V3" />
        <path d="M7.5 14.5h9" />
      </svg>
    );
  }
  if (nameAr.includes("عربي") || nameAr.includes("لغ")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2V5z" />
        <path d="M4 18a2 2 0 012-2h13" />
      </svg>
    );
  }
  if (nameAr.includes("دراس") || nameAr.includes("اجتماع")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.6 2.3 2.6 14.7 0 17M12 3.5c-2.6 2.3-2.6 14.7 0 17" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12h7M12 8.5v7" />
    </svg>
  );
}
