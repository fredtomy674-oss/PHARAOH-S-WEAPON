import type { TutorLanguage } from "./language.js";
import type { TeachingActionType } from "./teachingActions.js";

/**
 * PHASE 188 — كل ردّ ينتهي بخطوة تعليمية مشتركة.
 *
 * The owner's requirement is pedagogical, not cosmetic: a lesson turn that
 * ends with an explanation and no next move leaves the student passive, and a
 * teacher who never says what *he* will do next is only broadcasting. Every
 * reply must therefore close with one concrete action for the student and one
 * follow-up action for the teacher.
 *
 * The prompt asks the model for this line, but prompts are not a contract. This
 * module is the deterministic close: it recognises the model's own close (in
 * any of the four reply languages) and appends one only when it is missing.
 * `content` is the field the room renders and the voice reads, so the close
 * lives there — not in a new protocol field the client would have to learn.
 */

export type PedagogicalCloseLanguage = TutorLanguage;

/** The phrase that marks a close, without its colon. */
export const PEDAGOGICAL_CLOSE_LABELS: Record<PedagogicalCloseLanguage, string> = {
  ar: "الخطوة القادمة",
  en: "Next step",
  fr: "Étape suivante",
  de: "Nächster Schritt",
};

const CLOSES: Record<PedagogicalCloseLanguage, Record<TeachingActionType, string>> = {
  ar: {
    explain:
      "اكتب المثال في دفترك بخطواته، وأنا سأراجع معك الخطوة الأولى وأصححها إن احتجت.",
    diagnose:
      "أجب عن السؤال في سطر واحد، وأنا سأحدد من إجابتك نقطة البداية المناسبة.",
    hint:
      "جرّب الخطوة الأولى بنفسك، وأنا سأتابع محاولتك وأعطيك تلميحًا أدق.",
    visual_explanation:
      "ارسم الخطوات أو رتّبها في دفترك، وأنا سأقارن رسمك بالشرح وأصححه معك.",
    interactive_board:
      "حرّك الدبوس أو أكمل الرسم، وأنا سأتحقق من إجابتك وأشرح سببها.",
    textbook_reference:
      "افتح كتابك على الصفحة المذكورة واكتب المثال، وأنا سأشرحه معك خطوة بخطوة.",
    practice:
      "حل السؤال في دفترك ثم اكتب إجابتك هنا، وأنا سأصححها وأشرح سبب الخطأ إن وجد.",
    review_prerequisite:
      "راجع الفكرة السابقة واكتب مثالًا بسيطًا عليها، وأنا سأتحقق من الأساس قبل أن نكمل.",
    celebrate_progress:
      "اكتب الفكرة التي فهمتها في جملة واحدة، وأنا سأربطها بالفكرة التالية.",
    continue_learning:
      "اقرأ الفكرة التالية واكتب مثالًا عليها، وأنا سأراجع المثال وأكمل معك.",
  },
  en: {
    explain:
      "write the example and its steps in your notebook, and I will check the first step with you and correct it if needed.",
    diagnose:
      "answer the question in one line, and I will use your answer to choose the right starting point.",
    hint:
      "try the first step on your own, and I will follow your attempt and give you a more precise hint.",
    visual_explanation:
      "draw or order the steps in your notebook, and I will compare your drawing with the explanation and correct it with you.",
    interactive_board:
      "move the pin or finish the drawing, and I will check your answer and explain why.",
    textbook_reference:
      "open your book to the page we named and write the example, and I will go through it with you step by step.",
    practice:
      "solve the question in your notebook and write your answer here, and I will correct it and explain any mistake.",
    review_prerequisite:
      "review the earlier idea and write a simple example, and I will check the foundation before we continue.",
    celebrate_progress:
      "write the idea you understood in one sentence, and I will connect it to the next idea.",
    continue_learning:
      "read the next idea and write an example, and I will review it and continue with you.",
  },
  fr: {
    explain:
      "écris l'exemple et ses étapes dans ton cahier, et je vérifierai la première étape avec toi et la corrigerai si besoin.",
    diagnose:
      "réponds à la question en une ligne, et j'utiliserai ta réponse pour choisir le bon point de départ.",
    hint:
      "essaie la première étape seul, et je suivrai ta tentative pour te donner un indice plus précis.",
    visual_explanation:
      "dessine ou ordonne les étapes dans ton cahier, et je comparerai ton dessin avec l'explication et le corrigerai avec toi.",
    interactive_board:
      "déplace le curseur ou termine le dessin, et je vérifierai ta réponse en expliquant pourquoi.",
    textbook_reference:
      "ouvre ton livre à la page indiquée et écris l'exemple, et je le reprendrai avec toi pas à pas.",
    practice:
      "résous la question dans ton cahier puis écris ta réponse ici, et je la corrigerai en expliquant l'erreur s'il y en a une.",
    review_prerequisite:
      "revois l'idée précédente et écris un exemple simple, et je vérifierai la base avant de continuer.",
    celebrate_progress:
      "écris en une phrase l'idée que tu as comprise, et je la relierai à l'idée suivante.",
    continue_learning:
      "lis l'idée suivante et écris un exemple, et je le corrigerai avant de continuer avec toi.",
  },
  de: {
    explain:
      "Schreibe das Beispiel mit seinen Schritten in dein Heft, und ich prüfe den ersten Schritt mit dir und korrigiere ihn, falls nötig.",
    diagnose:
      "Beantworte die Frage in einer Zeile, und ich wähle anhand deiner Antwort den passenden Einstieg.",
    hint:
      "Versuche den ersten Schritt selbst, und ich verfolge deinen Versuch und gebe dir einen genaueren Hinweis.",
    visual_explanation:
      "Zeichne oder ordne die Schritte in deinem Heft, und ich vergleiche deine Zeichnung mit der Erklärung und korrigiere sie mit dir.",
    interactive_board:
      "Verschiebe den Punkt oder vervollständige die Zeichnung, und ich prüfe deine Antwort und erkläre das Warum.",
    textbook_reference:
      "Öffne dein Buch auf der genannten Seite und schreibe das Beispiel ab, und ich gehe es mit dir Schritt für Schritt durch.",
    practice:
      "Löse die Aufgabe in deinem Heft und schreibe deine Antwort hier, und ich korrigiere sie und erkläre einen Fehler, falls es einen gibt.",
    review_prerequisite:
      "Wiederhole die frühere Idee und schreibe ein einfaches Beispiel, und ich prüfe die Grundlage, bevor wir weitermachen.",
    celebrate_progress:
      "Schreibe die Idee, die du verstanden hast, in einem Satz, und ich verbinde sie mit der nächsten Idee.",
    continue_learning:
      "Lies die nächste Idee und schreibe ein Beispiel, und ich prüfe es und mache mit dir weiter.",
  },
};

/** The label as it appears at the start of the final line. */
function closeLabel(language: PedagogicalCloseLanguage): string {
  // French typography puts a space before the colon; the others do not.
  return language === "fr"
    ? `${PEDAGOGICAL_CLOSE_LABELS[language]} : `
    : `${PEDAGOGICAL_CLOSE_LABELS[language]}: `;
}

/** One complete closing line for a teaching action, in the reply language. */
export function pedagogicalCloseFor(
  action: TeachingActionType,
  language: PedagogicalCloseLanguage,
): string {
  return `${closeLabel(language)}${CLOSES[language][action] ?? CLOSES[language].explain}`;
}

/**
 * True when the reply already contains the closing label near its end. The
 * marker is matched anywhere in the last 500 characters (not only at the very
 * last character) because a model may put the close before a final short
 * sign-off; appending a second close would be worse than accepting the first.
 */
export function hasPedagogicalClose(content: string, language: PedagogicalCloseLanguage): boolean {
  const tail = content.slice(-500).replace(/\s+/g, " ");
  const label = PEDAGOGICAL_CLOSE_LABELS[language];
  return language === "ar"
    ? tail.includes(label)
    : tail.toLowerCase().includes(label.toLowerCase());
}

/**
 * Guarantees the owner's contract: the final visible line names one action for
 * the student and one follow-up for the teacher. Existing model-written closes
 * are preserved verbatim; only a missing close is appended.
 */
export function ensurePedagogicalClose(
  content: string,
  action: TeachingActionType,
  language: PedagogicalCloseLanguage,
): string {
  const trimmed = content.trim();
  if (hasPedagogicalClose(trimmed, language)) return trimmed;
  return `${trimmed}\n\n${pedagogicalCloseFor(action, language)}`;
}
