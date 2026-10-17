// PHASE 166 — «القراءة التلقائية»: كل رد يُسمع فور وصوله، افتراضيًا مفتوح.
//
// هذا ما طلبه المالك بالحرف: «اريد ان يكون الرد تلقائى مستمع بدون الحاجه الى
// الضغط على زر الاستماع و يكون زر الاستماع دوره للاستماع مره اخرى». القيمة
// واحدة في localStorage (نمط liveTeacherPref.ts نفسه): "1" أو "0". تُقرأ في
// لحظة الإرسال: كل دور يتحدث فيه المعلّم يُسمَع — بالمحرّك المحلي المجاني أولًا،
// وبصوت الخادم إن لم يوجد صوت محلي — وزر 🔊 في كل رسالة يبقى «الاستماع مرة
// أخرى». إطفاؤها قرار الطالب وحده، وفوري في هذا التبويب وفي غيره.

import { useSyncExternalStore } from "react";

export const AUTO_READ_STORAGE_KEY = "alfarouq_auto_read";

const listeners = new Set<() => void>();

/** Value the student chose. Default: ON (طلب المالك الصريح — الافتراضي مفتوح). */
export function readAutoReadPref(): boolean {
  try {
    const value = localStorage.getItem(AUTO_READ_STORAGE_KEY);
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
export function writeAutoReadPref(on: boolean): void {
  try {
    localStorage.setItem(AUTO_READ_STORAGE_KEY, on ? "1" : "0");
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
export const subscribeAutoRead = subscribe;

let storageHooked = false;
function hookStorage(): void {
  if (storageHooked || typeof window === "undefined") return;
  storageHooked = true;
  window.addEventListener("storage", (event) => {
    if (event.key === AUTO_READ_STORAGE_KEY) notify();
  });
}

/** The preference as React state — the room updates the moment it flips. */
export function useAutoReadPref(): boolean {
  hookStorage();
  return useSyncExternalStore(subscribe, readAutoReadPref, () => true);
}
