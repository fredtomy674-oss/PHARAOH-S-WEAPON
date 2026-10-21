// PHASE 191 — official Egypt Secondary-3 (Grade 12) Biology, first term.
//
// Source: the 2026/2027 Ministry edition of «الأحياء — الصف الثالث الثانوي».
// The printed «المحتويات» lists seven chapters. Guides are original teaching
// notes, not copied book prose.
import { createG12Book } from "./g12.js";

export const EGYPT_BIOLOGY_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/Biology_ARABIC_Sec3.pdf";

const book = createG12Book({
  subject: "الأحياء",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_BIOLOGY_G12_T1_SOURCE,
  units: [
    {
      key: "chapter-1",
      title: "الفصل الأول: الدعامة والحركة",
      lessons: [
        {
          title: "الدعامة والحركة",
          concepts: ["الجهاز الهيكلي", "آلية الحركة", "الأمراض والإصابات المرتبطة"],
          focus: "يربط بين تركيب الجهاز الهيكلي ووظيفة الحركة، ويطلب منك تفسير الحركة من خلال العضلات والمفاصل.",
        },
      ],
    },
    {
      key: "chapter-2",
      title: "الفصل الثاني: التنسيق الهرموني",
      lessons: [
        {
          title: "التنسيق الهرموني",
          concepts: ["الغدد الصماء", "الهرمونات وأثرها", "تنظيم الوظائف الحيوية"],
          focus: "يوضح كيف تنظم الهرمونات وظائف الجسم عبر التغذية الراجعة، ويميز بينها وبين التنسيق العصبي.",
        },
      ],
    },
    {
      key: "chapter-3",
      title: "الفصل الثالث: التكاثر",
      lessons: [
        {
          title: "التكاثر",
          concepts: ["التكاثر اللاجنسي", "التكاثر الجنسي", "التكاثر في النبات والحيوان"],
          focus: "يقارن بين طرق التكاثر من حيث التنوع الوراثي وتكلفة الطاقة، ويشرح أمثلة من النبات والحيوان.",
        },
      ],
    },
    {
      key: "chapter-4",
      title: "الفصل الرابع: المناعة",
      lessons: [
        {
          title: "المناعة",
          concepts: ["المناعة الطبيعية", "المناعة المكتسبة", "اللقاحات والأمصال"],
          focus: "يفرق بين خطوط الدفاع والاستجابة المتخصصة، ويعلّمك تفسير عمل اللقاح دون خلطه بالمصل.",
        },
      ],
    },
    {
      key: "chapter-5",
      title: "الفصل الخامس: الحمض النووي DNA",
      lessons: [
        {
          title: "الحمض النووي DNA",
          concepts: ["تركيب DNA", "تضاعف DNA", "أهمية المادة الوراثية"],
          focus: "يشرح البناء اللولبي المزدوج وعلاقة القواعد، ويطلب منك تفسير كيف يحفظ التضاعف المعلومات الوراثية.",
        },
      ],
    },
    {
      key: "chapter-6",
      title: "الفصل السادس: الأحماض النووية وتخليق البروتين",
      lessons: [
        {
          title: "الأحماض النووية وتخليق البروتين",
          concepts: ["RNA وأنواعه", "النسخ والترجمة", "الشيفرة الوراثية"],
          focus: "يتتبع مسار المعلومة من DNA إلى البروتين، ويعلّمك قراءة الشيفرة الوراثية خطوة بخطوة.",
        },
      ],
    },
    {
      key: "chapter-7",
      title: "الفصل السابع: الأحياء وعلوم الأرض",
      lessons: [
        {
          title: "الأحياء وعلوم الأرض",
          concepts: ["نشأة الحياة وتطورها", "الحفريات والأدلة", "التفاعل بين الأحياء والبيئة"],
          focus: "يجمع بين الأدلة الجيولوجية والحيوية لفهم تاريخ الحياة، ويطلب منك التمييز بين الفرضية والدليل.",
        },
      ],
    },
  ],
});

export const EGYPT_BIOLOGY_G12_T1_BOOK = book.BOOK;
export const EGYPT_BIOLOGY_G12_T1_UNITS = book.UNITS;
export const isBiologyG12TreeConsistent = book.isTreeConsistent;
export const biologyG12LessonDocument = book.lessonDocument;
