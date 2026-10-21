// PHASE 190 — official Egypt Secondary-2 (Grade 11) German as a second foreign
// language, first term.
//
// Source: the 2026/2027 Ministry edition of «Schritte international 2»
// (Kursbuch, Lektionen 5–9). The tree follows the printed «Inhalt Kursbuch»;
// each lesson keeps the printed Lektion title and its A–E step topics. Guides
// are original teaching notes in German.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_GERMAN_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/Deutsch_language_Sec2_Tr1.pdf";

export const EGYPT_GERMAN_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "5",
    title: "Lektion 5: Mein Tag",
    lessons: [
      {
        key: "5-1",
        title: "Mein Tag",
        concepts: [
          "Uhrzeit offiziell und inoffiziell nennen",
          "Tagesablauf und Alltagsaktivitäten beschreiben",
          "Trennbare Verben und die Stellung des Verbs im Satz",
        ],
        guide: `Die Lektion beginnt mit einem alltäglichen Thema: Wie sieht ein normaler Tag aus? Die Lernenden wiederholen und erweitern Uhrzeiten, Tageszeiten und Aktivitäten vom Aufstehen bis zum Schlafengehen. Wichtig ist dabei nicht nur der Wortschatz, sondern die Satzstellung: Bei trennbaren Verben steht die Vorsilbe am Satzende, zum Beispiel „Ich stehe um sieben Uhr auf“. Die Präsentation eines Tagesablaufs trainiert außerdem die Reihenfolge mit Wörtern wie zuerst, danach, dann und schließlich. In Partnerarbeit vergleichen die Schülerinnen und Schüler zwei Tagesabläufe und achten auf Gemeinsamkeiten und Unterschiede. So wird Grammatik aus einer konkreten Mitteilungsabsicht heraus geübt.`,
      },
    ],
  },
  {
    key: "6",
    title: "Lektion 6: Freizeit",
    lessons: [
      {
        key: "6-1",
        title: "Freizeit",
        concepts: [
          "Über Freizeitaktivitäten und Hobbys sprechen",
          "Einladungen, Zustimmung und Ablehnung formulieren",
          "Akkusativ, Ja/Nein-Fragen und Verben wie lesen, treffen, schlafen, fahren, nehmen, möchten",
        ],
        guide: `In dieser Lektion geht es um Freizeit, Wetter und kleine Alltagsgespräche. Die Lernenden beschreiben, was sie gern machen, verabreden sich und reagieren auf Einladungen. Dabei üben sie den Akkusativ mit Verben wie lesen, treffen, nehmen und möchten sowie Ja/Nein-Fragen mit passender Antwort. Ein wichtiger Sprechanlass ist das Gespräch im Restaurant oder Café: bestellen, nachfragen, zustimmen und höflich ablehnen. Die Grammatik wird nicht isoliert eingeführt, sondern in kurzen Dialogen angewendet. Am Ende können die Schülerinnen und Schüler einen eigenen Freizeitplan präsentieren und begründen, warum ihnen eine Aktivität wichtig ist.`,
      },
    ],
  },
  {
    key: "7",
    title: "Lektion 7: Lernen – ein Leben lang",
    lessons: [
      {
        key: "7-1",
        title: "Lernen – ein Leben lang",
        concepts: [
          "Fähigkeiten und Absichten ausdrücken",
          "Über Ereignisse in der Vergangenheit berichten",
          "Modalverben und Perfekt mit haben oder sein",
        ],
        guide: `Die Lektion verbindet das Thema Lernen mit Biografie und Zukunft. Die Lernenden sprechen über Fähigkeiten, Wünsche und Absichten und berichten, was sie in der Vergangenheit gelernt haben. Dafür brauchen sie Modalverben wie können und wollen sowie das Perfekt mit haben oder sein. Die Satzklammer hilft, die Reihenfolge der Verbteile bewusst zu steuern. Ein Portfolio oder ein kurzer Lebenslauf in Stichpunkten dient als Schreibanlass: Was kann ich schon? Was möchte ich noch lernen? Die Lektion zeigt, dass Lernen nicht mit der Schule endet, sondern eine lebenslange Aufgabe bleibt.`,
      },
    ],
  },
  {
    key: "8",
    title: "Lektion 8: Beruf und Arbeit",
    lessons: [
      {
        key: "8-1",
        title: "Beruf und Arbeit",
        concepts: [
          "Berufe benennen und nach Berufen fragen",
          "Über Vergangenheit mit dem Präteritum berichten",
          "Nomen bilden und über Praktika und ungewöhnliche Berufe sprechen",
        ],
        guide: `Diese Lektion öffnet den Blick auf die Arbeitswelt. Die Lernenden benennen Berufe, fragen nach Tätigkeiten und beschreiben, welche Aufgaben zu einem Beruf gehören. Mit dem Präteritum von sein und haben berichten sie über frühere Situationen, zum Beispiel über ein Praktikum oder einen Ferienjob. Die Wortbildung hilft, Berufsbezeichnungen zu verstehen: aus Lehrer wird Lehrerin, aus Kaufmann wird Kauffrau. Ein Bewerbungsgespräch oder ein Telefonat dient als Rollenspiel, in dem Höflichkeit und klare Informationen wichtig sind. So verbindet die Lektion Grammatik mit einer konkreten Vorbereitung auf Beruf und Ausbildung.`,
      },
    ],
  },
  {
    key: "9",
    title: "Lektion 9: In einer fremden Stadt",
    lessons: [
      {
        key: "9-1",
        title: "In einer fremden Stadt",
        concepts: [
          "Wegbeschreibungen geben und Abläufe erklären",
          "Über Erlaubtes, Verbotenes und Regeln sprechen",
          "Modalverben müssen/dürfen, Pronomen man und Imperativ",
        ],
        guide: `Die letzte Lektion führt in eine fremde Stadt und in typische Situationen unterwegs: nach dem Weg fragen, Anweisungen verstehen, Öffnungszeiten erfragen und an der Hotelrezeption um Hilfe bitten. Die Lernenden üben den Imperativ für klare Aufforderungen und die Modalverben müssen und dürfen für Regeln und Erlaubnisse. Das Pronomen man erlaubt allgemeine Aussagen, ohne eine bestimmte Person zu nennen. Ein Stadtplan und kurze Dialoge machen die Aufgabe anschaulich. Die Lektion schließt den Term mit einer praktischen Kompetenz: sich in einer unbekannten Umgebung höflich und sicher verständigen zu können.`,
      },
    ],
  },
];

export const EGYPT_GERMAN_G11_T1_BOOK = {
  subject: "Deutsch — zweite Fremdsprache",
  grade: "Zweite Sekundarstufe",
  sourceUrl: EGYPT_GERMAN_G11_T1_SOURCE,
};

export function isGermanG11TreeConsistent() {
  return checkG11Tree("Deutsch — zweite Sekundarstufe", EGYPT_GERMAN_G11_T1_UNITS);
}

export function germanG11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_GERMAN_G11_T1_BOOK, EGYPT_GERMAN_G11_T1_UNITS, unitIndex, lessonIndex);
}
