// PHASE 191 — official Egypt Secondary-3 (Grade 12) ICT, first term.
//
// Source: the 2026/2027 Ministry edition of «تكنولوجيا المعلومات والاتصالات —
// الصف الثالث الثانوي», unit one. Its printed «جدول المحتويات» lists three
// topics: number systems, the VB.NET conversion project, and the PHP conversion
// project. Guides are original teaching notes; code examples stay in the book.
import { createG12Book } from "./g12.js";

export const EGYPT_ICT_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/ICT_AR_Sec3.pdf";

const book = createG12Book({
  subject: "تكنولوجيا المعلومات والاتصالات",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_ICT_G12_T1_SOURCE,
  units: [
    {
      key: "unit-1",
      title: "الوحدة الأولى: مشروع إنتاج برمجية لتحويل عدد بين النظم العددية",
      lessons: [
        {
          title: "النظم العددية",
          concepts: ["النظام العشري", "النظام الثنائي", "النظام السداسي عشر والتحويل بينها"],
          focus: "يبني خلفية نظرية دقيقة للتحويل بين الأنظمة، ويطلب منك إجراء التحويل بالخطوات لا الاعتماد على الآلة وحدها.",
        },
        {
          title: "إجراءات تنفيذ المشروع باستخدام VB.NET",
          concepts: ["تصميم واجهة المستخدم", "ضبط خصائص عناصر التحكم", "كتابة الكود واختباره"],
          focus: "يحوّل المشروع من فكرة إلى خطوات هندسية: تصميم الواجهة، ربط الأحداث، ثم اختبار النتائج على حالات مختلفة.",
        },
        {
          title: "إنتاج المشروع باستخدام لغة PHP",
          concepts: ["صفحة الويب الديناميكية", "أدوات الإدخال والإخراج", "معالجة النموذج والتحقق"],
          focus: "يقارن بين حل سطح المكتب وحل الويب، ويعلّمك كيف تتحقق من صحة المدخلات قبل عرض الناتج.",
        },
      ],
    },
  ],
});

export const EGYPT_ICT_G12_T1_BOOK = book.BOOK;
export const EGYPT_ICT_G12_T1_UNITS = book.UNITS;
export const isIctG12TreeConsistent = book.isTreeConsistent;
export const ictG12LessonDocument = book.lessonDocument;
