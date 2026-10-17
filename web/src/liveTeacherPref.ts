// PHASE 162 (W7.5) — «المعلّم الحيّ»: مفتاح الطالب، افتراضيًا مفتوح.
//
// قيمته واحدة في localStorage (نمط theme.ts نفسه): "1" أو "0". الإطفاء فوري
// في نفس الجلسة (اشتراك محلي) وفي التبويبات الأخرى (حدث storage). لا يلمس
// أي بيانات ولا أي شيء على الخادم — الطالب يملك هذا القرار وحده.
//
// حارس القبول في الخطة: «مستخدم أطفأ المعلّم = حزمة بلا بايتات VRM». هذا
// الملف لا يعرف شيئًا عن الأفاتار — من يقرؤه هو من يقرر هل يُحمَّل أصلًا.

import { useSyncExternalStore } from "react";

export const LIVE_TEACHER_STORAGE_KEY = "alfarouq_live_teacher";

const listeners = new Set<() => void>();

/** Value the student chose. Default: ON (الافتراضي مفتوح — قرار الخطة). */
export function readLiveTeacherPref(): boolean {
  try {
    const value = localStorage.getItem(LIVE_TEACHER_STORAGE_KEY);
    if (value === "0" || value === "false") return false;
  } catch {
    /* وضع خاص / تخزين مغلق: الافتراضي */
  }
  return true;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Persist the choice and wake every listener (this tab and the next one). */
export function writeLiveTeacherPref(on: boolean): void {
  try {
    localStorage.setItem(LIVE_TEACHER_STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* تجاهل — التطبيق يعمل بلا حفظ */
  }
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** قناة التنبيه — تُصدَّر للاختبار ولأي مستمع غير React. */
export const subscribeLiveTeacher = subscribe;

let storageHooked = false;
function hookStorage(): void {
  if (storageHooked || typeof window === "undefined") return;
  storageHooked = true;
  window.addEventListener("storage", (event) => {
    if (event.key === LIVE_TEACHER_STORAGE_KEY) notify();
  });
}

/** The preference as React state — the room updates the moment it flips. */
export function useLiveTeacherPref(): boolean {
  hookStorage();
  return useSyncExternalStore(subscribe, readLiveTeacherPref, () => true);
}
