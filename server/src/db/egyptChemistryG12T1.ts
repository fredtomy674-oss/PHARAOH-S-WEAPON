// PHASE 191 — official Egypt Secondary-3 (Grade 12) Chemistry, first term.
//
// Source: the 2026/2027 Ministry edition of «الكيمياء — الصف الثالث الثانوي».
// The printed «المحتويات» lists five chapters; the chapter heads are kept as
// the lesson titles. Guides are original teaching notes, not copied book prose.
import { createG12Book } from "./g12.js";

export const EGYPT_CHEMISTRY_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/Chemistry_Arabic_Sec3.pdf";

const book = createG12Book({
  subject: "الكيمياء",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_CHEMISTRY_G12_T1_SOURCE,
  units: [
    {
      key: "chapter-1",
      title: "الفصل الأول: العناصر الانتقالية",
      lessons: [
        {
          title: "العناصر الانتقالية",
          concepts: ["التوزيع الإلكتروني", "الخواص الفيزيائية والكيميائية", "مركبات العناصر الانتقالية وأهميتها"],
          focus: "يقرأ الجدول الدوري من خلال البنية الإلكترونية، ويربط خواص العناصر الانتقالية بتطبيقاتها الصناعية والحيوية.",
        },
      ],
    },
    {
      key: "chapter-2",
      title: "الفصل الثاني: التحليل الكيميائي",
      lessons: [
        {
          title: "التحليل الكيميائي",
          concepts: ["التحليل النوعي", "التحليل الكمي", "المعايرة الحجمية"],
          focus: "يفرق بين معرفة المكونات وقياس كمياتها، ويعلّمك ضبط الحسابات في المعايرة قبل تفسير النتيجة.",
        },
      ],
    },
    {
      key: "chapter-3",
      title: "الفصل الثالث: الاتزان الكيميائي",
      lessons: [
        {
          title: "الاتزان الكيميائي",
          concepts: ["التفاعلات الانعكاسية", "ثابت الاتزان", "مبدأ لوشاتيليه"],
          focus: "يوضح أن الاتزان حالة ديناميكية لا توقفًا، ويطلب منك توقع أثر تغير التركيز أو الحرارة أو الضغط.",
        },
      ],
    },
    {
      key: "chapter-4",
      title: "الفصل الرابع: الكيمياء الكهربية",
      lessons: [
        {
          title: "الكيمياء الكهربية",
          concepts: ["الخلايا الجلفانية", "التحليل الكهربي", "جهد الاختزال والقطب"],
          focus: "يربط بين انتقال الإلكترونات والطاقة، ويعلّمك قراءة الخلية الكهروكيميائية من اتجاه التفاعل لا من الشكل فقط.",
        },
      ],
    },
    {
      key: "chapter-5",
      title: "الفصل الخامس: الكيمياء العضوية",
      lessons: [
        {
          title: "الكيمياء العضوية",
          concepts: ["الهيدروكربونات", "الكحولات والإيثرات", "الأحماض العضوية ومشتقاتها"],
          focus: "يبني خريطة عائلية للمركبات العضوية، ويربط المجموعات الوظيفية بالخواص والتفاعلات.",
        },
      ],
    },
  ],
});

export const EGYPT_CHEMISTRY_G12_T1_BOOK = book.BOOK;
export const EGYPT_CHEMISTRY_G12_T1_UNITS = book.UNITS;
export const isChemistryG12TreeConsistent = book.isTreeConsistent;
export const chemistryG12LessonDocument = book.lessonDocument;
