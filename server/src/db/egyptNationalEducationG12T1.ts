// PHASE 191 — official Egypt Secondary-3 (Grade 12) National Education, first term.
//
// Source: the 2026/2027 Ministry edition of «التربية الوطنية — الصف الثالث
// الثانوي». The tree follows the printed «المحتويات»: four chapters. Guides are
// original teaching notes, not copied book prose.
import { createG12Book } from "./g12.js";

export const EGYPT_NATIONAL_EDUCATION_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/National_Education_Sec3_tr1.pdf";

const book = createG12Book({
  subject: "التربية الوطنية",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_NATIONAL_EDUCATION_G12_T1_SOURCE,
  units: [
    {
      key: "chapter-1",
      title: "الفصل الأول: القانون والدستور",
      lessons: [
        {
          title: "القانون والدستور",
          concepts: ["مفهوم القانون", "الدستور وأهميته", "سيادة القانون"],
          focus: "يشرح كيف ينظم الدستور السلطة والحقوق، ويعلّمك التمييز بين وجود القانون وتطبيقه العادل.",
        },
      ],
    },
    {
      key: "chapter-2",
      title: "الفصل الثاني: الديمقراطية",
      lessons: [
        {
          title: "الديمقراطية",
          concepts: ["مفهوم الديمقراطية", "المشاركة والتداول السلمي", "حقوق الأقلية"],
          focus: "يقدّم الديمقراطية كثقافة وممارسة لا مجرد صناديق انتخاب، ويطلب منك ربطها بالمساءلة وحقوق الأقلية.",
        },
      ],
    },
    {
      key: "chapter-3",
      title: "الفصل الثالث: الأحزاب السياسية",
      lessons: [
        {
          title: "الأحزاب السياسية",
          concepts: ["وظائف الأحزاب", "التعددية الحزبية", "تمويل الأحزاب والرقابة"],
          focus: "يشرح دور الأحزاب في تنظيم المصالح وطرح البرامج، ويبيّن شروط عملها الديمقراطي.",
        },
      ],
    },
    {
      key: "chapter-4",
      title: "الفصل الرابع: المشاركة السياسية",
      lessons: [
        {
          title: "المشاركة السياسية",
          concepts: ["أشكال المشاركة", "المشاركة والمواطنة", "معوقات المشاركة"],
          focus: "يوسّع مفهوم المشاركة ليشمل التصويت والعمل المدني والرقابة، ويطلب منك تحليل أسباب العزوف السياسي.",
        },
      ],
    },
  ],
});

export const EGYPT_NATIONAL_EDUCATION_G12_T1_BOOK = book.BOOK;
export const EGYPT_NATIONAL_EDUCATION_G12_T1_UNITS = book.UNITS;
export const isNationalEducationG12TreeConsistent = book.isTreeConsistent;
export const nationalEducationG12LessonDocument = book.lessonDocument;
