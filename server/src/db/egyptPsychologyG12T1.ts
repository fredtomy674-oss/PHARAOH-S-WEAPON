// PHASE 191 — official Egypt Secondary-3 (Grade 12) Psychology and Sociology, first term.
//
// Source: the 2026/2027 Ministry edition of «علم النفس والاجتماع — الصف الثالث
// الثانوي». The tree follows the printed «الفهرس»: six units (three psychology,
// three sociology) and their printed chapters. Guides are original notes.
import { createG12Book } from "./g12.js";

export const EGYPT_PSYCHOLOGY_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/Psychology_Sociology_Sec3.pdf";

const book = createG12Book({
  subject: "علم النفس والاجتماع",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_PSYCHOLOGY_G12_T1_SOURCE,
  units: [
    {
      key: "psych-1",
      title: "علم النفس — الوحدة الأولى: الذكاء والتعلم",
      lessons: [
        {
          title: "الذكاء والتعلم",
          concepts: ["الذكاء الواحد والذكاءات المتعددة", "نظريات التعلم وتطبيقاتها التربوية", "مبادئ التعلم الجيد وأسس الاستذكار الفعال"],
          focus: "يجمع بين نظريات الذكاء ونظريات التعلم ليصنع صورة عملية عن كيف يتعلم الطالب ويطور قدراته.",
        },
      ],
    },
    {
      key: "psych-2",
      title: "علم النفس — الوحدة الثانية: النمو الإنساني",
      lessons: [
        {
          title: "النمو الإنساني",
          concepts: ["النمو: تعريفه ومبادئه والعوامل المؤثرة فيه", "النمو في مرحلة الطفولة", "النمو في مرحلة المراهقة"],
          focus: "يتتبع النمو بوصفه عملية مستمرة ومتعددة الجوانب، ويطلب منك ربط خصائص المرحلة بسلوك المراهق.",
        },
      ],
    },
    {
      key: "psych-3",
      title: "علم النفس — الوحدة الثالثة: الشخصية وأساليب التوافق",
      lessons: [
        {
          title: "الشخصية وأساليب التوافق النفسي والاجتماعي",
          concepts: ["الشخصية", "الاتجاهات والقيم", "أساليب التوافق", "أساليب حل الصراعات ومواجهة الإحباطات"],
          focus: "يقدّم الشخصية كتفاعل بين الوراثة والبيئة، ويعلّمك قراءة أساليب التوافق دون وصم أو تبسيط.",
        },
      ],
    },
    {
      key: "soc-1",
      title: "علم الاجتماع — الوحدة الأولى: النظرية والعمليات الاجتماعية",
      lessons: [
        {
          title: "نظرية علم الاجتماع والعمليات الاجتماعية",
          concepts: ["النظرية الاجتماعية: بناؤها ووظائفها", "التفاعل الاجتماعي والعلاقات الاجتماعية", "العمليات الاجتماعية", "الظاهرة الاجتماعية"],
          focus: "يؤسس النظرية الاجتماعية كأداة لفهم المجتمع، ويطلب منك التمييز بين الظاهرة والرأي الشخصي.",
        },
      ],
    },
    {
      key: "soc-2",
      title: "علم الاجتماع — الوحدة الثانية: علم الاجتماع وقضايا التنمية",
      lessons: [
        {
          title: "علم الاجتماع وقضايا التنمية",
          concepts: ["علاقة علم الاجتماع بالعلوم الأخرى", "الثقافة من منظور علم الاجتماع", "ثقافة العمل التطوعي", "ثقافة العمل الحر"],
          focus: "يربط علم الاجتماع بالتنمية والثقافة، ويظهر كيف تشكل قيم العمل والتطوع فرص النهوض.",
        },
      ],
    },
    {
      key: "soc-3",
      title: "علم الاجتماع — الوحدة الثالثة: بعض القضايا المجتمعية",
      lessons: [
        {
          title: "علم الاجتماع وبعض القضايا المجتمعية",
          concepts: ["توظيف البحوث الاجتماعية في خدمة قضايا التنمية", "العولمة", "التطرف"],
          focus: "يستخدم البحث الاجتماعي لفهم قضايا العولمة والتطرف، ويطلب منك اقتراح معالجة مجتمعية قائمة على الدليل.",
        },
      ],
    },
  ],
});

export const EGYPT_PSYCHOLOGY_G12_T1_BOOK = book.BOOK;
export const EGYPT_PSYCHOLOGY_G12_T1_UNITS = book.UNITS;
export const isPsychologyG12TreeConsistent = book.isTreeConsistent;
export const psychologyG12LessonDocument = book.lessonDocument;
