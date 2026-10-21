// PHASE 191 — official Egypt Secondary-3 (Grade 12) Physics, first term.
//
// Source: the 2026/2027 Ministry edition of «الفيزياء — الصف الثالث الثانوي».
// The tree follows the printed «المحتويات»: two units and eight chapters.
// Guides are original teaching notes, not copied book prose.
import { createG12Book } from "./g12.js";

export const EGYPT_PHYSICS_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/Physics_Arabic_Sec3.pdf";

const book = createG12Book({
  subject: "الفيزياء",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_PHYSICS_G12_T1_SOURCE,
  units: [
    {
      key: "unit-1",
      title: "الوحدة الأولى: الكهرباء والمغناطيسية",
      lessons: [
        {
          title: "التيار الكهربائي وقانون أوم وقوانين كيرشوف",
          concepts: ["التيار والمقاومة", "قانون أوم", "قوانين كيرشوف للدوائر"],
          focus: "ينتقل من العلاقة البسيطة بين الجهد والتيار إلى تحليل دوائر مركبة، ويطلب منك تحديد اتجاه التيار قبل التعويض.",
        },
        {
          title: "التأثير المغناطيسي للتيار الكهربائي",
          concepts: ["المجال المغناطيسي حول السلك", "القوة المؤثرة على موصل", "تطبيقات المغناطيسية"],
          focus: "يربط بين الكهرباء والمغناطيسية عبر المجال، ويعلّمك تطبيق قاعدة اليد اليمنى دون خلط بين الاتجاهات.",
        },
        {
          title: "الحث الكهرومغناطيسي",
          concepts: ["قانون فارادي", "قانون لينز", "المولد الكهربائي"],
          focus: "يفسر توليد الجهد من تغير الفيض، ويظهر أن اتجاه التيار المستحث يعارض التغير وفق قانون لينز.",
        },
        {
          title: "دوائر التيار المتردد",
          concepts: ["المعاوقة", "الرنين", "القدرة في دوائر التيار المتردد"],
          focus: "يعلّمك تحليل دائرة مترددة من خلال المفاعلة والمعاوقة، ويشرح معنى الرنين عمليًا.",
        },
      ],
    },
    {
      key: "unit-2",
      title: "الوحدة الثانية: مقدمة في الفيزياء الحديثة",
      lessons: [
        {
          title: "طبيعة الموجة والجسيم",
          concepts: ["الطبيعة الموجية للضوء", "الطبيعة الجسيمية", "ازدواجية الموجة والجسيم"],
          focus: "يعرض التحول من النموذج الموجي إلى الجسيمي، ويطلب منك تفسير التجارب التي فرضت هذا التحول.",
        },
        {
          title: "أطياف الذرة",
          concepts: ["طيف الانبعاث", "طيف الامتصاص", "نموذج بور ومستويات الطاقة"],
          focus: "يربط الخطوط الطيفية بالانتقالات بين مستويات الطاقة، ويعلّمك قراءة الطيف كبصمة للعنصر.",
        },
        {
          title: "الليزر",
          concepts: ["الانبعاث المستحث", "خصائص شعاع الليزر", "تطبيقات الليزر"],
          focus: "يشرح كيف ينتج الليزر شعاعًا متماسكًا، ويطلب منك التمييز بين خصائصه وتطبيقاته الطبية والصناعية.",
        },
        {
          title: "الإلكترونيات الحديثة",
          concepts: ["أشباه الموصلات", "الديود", "الترانزستور"],
          focus: "يقدّم أشباه الموصلات أساسًا للديودات والترانزستورات، ويعلّمك كيف تتحكم الإشارة الصغيرة في تيار كبير.",
        },
      ],
    },
  ],
});

export const EGYPT_PHYSICS_G12_T1_BOOK = book.BOOK;
export const EGYPT_PHYSICS_G12_T1_UNITS = book.UNITS;
export const isPhysicsG12TreeConsistent = book.isTreeConsistent;
export const physicsG12LessonDocument = book.lessonDocument;
