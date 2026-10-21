// PHASE 190 — official Egypt Secondary-2 (Grade 11) Italian as a second foreign
// language, first term.
//
// Source: the 2026/2027 Ministry edition of «Progetto italiano Junior 2 Plus».
// The tree follows the printed «Indice»: six Unità with their A–D sections. The
// guides are original teaching notes in Italian.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_ITALIAN_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/Italiano_language_Sec2_Tr1.pdf";

export const EGYPT_ITALIAN_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "1",
    title: "Unità 1: In contatto",
    lessons: [
      {
        key: "1-1",
        title: "In contatto",
        concepts: [
          "Parlare di cellulari, computer e mezzi di comunicazione",
          "Le preposizioni articolate",
          "Chiedere e dire l'orario di apertura e chiusura; esprimere incertezza",
        ],
        guide: `La prima unità parte da una situazione quotidiana: restare in contatto con amici e famiglia attraverso il telefono e il computer. Gli studenti imparano a descrivere come e quando usano questi strumenti, a chiedere informazioni su orari e servizi e a esprimere dubbio o incertezza con espressioni come «mah, non so». Le preposizioni articolate vengono presentate dentro i dialoghi, non come elenco astratto, perché servono a collocare azioni e oggetti nel tempo e nello spazio. L'unità alterna ascolto, lettura e produzione orale, così la lingua diventa uno strumento per organizzare la giornata e mantenere relazioni.`,
      },
    ],
  },
  {
    key: "2",
    title: "Unità 2: Dov'è?",
    lessons: [
      {
        key: "2-1",
        title: "Dov'è?",
        concepts: [
          "Localizzare oggetti e persone nello spazio",
          "C'è / ci sono e il partitivo",
          "Esprimere possesso e ringraziare",
        ],
        guide: `Questa unità insegna a orientarsi in uno spazio concreto: la casa, la classe, la città. Gli studenti chiedono e danno informazioni sulla posizione di oggetti e persone usando espressioni di luogo, c'è e ci sono, e imparano a usare il partitivo per indicare una quantità non precisata. I possessivi permettono di dire a chi appartiene un oggetto, mentre le formule di ringraziamento rendono i dialoghi più naturali. Il lavoro di coppia è centrale: uno descrive una scena, l'altro la ricostruisce ascoltando. In questo modo lessico, grammatica e attenzione all'interlocutore crescono insieme.`,
      },
    ],
  },
  {
    key: "3",
    title: "Unità 3: Una festa",
    lessons: [
      {
        key: "3-1",
        title: "Una festa",
        concepts: [
          "Parlare di fatti avvenuti nel passato",
          "Il passato prossimo e la scelta dell'ausiliare",
          "Scrivere un'email per invitare e raccontare",
        ],
        guide: `L'unità porta gli studenti a raccontare una festa e altri eventi passati. Il passato prossimo viene introdotto con i participi regolari e irregolari, poi con la scelta tra essere e avere. Non basta memorizzare le forme: bisogna capire quale ausiliare richiede il verbo e come cambia il participio con essere. Le espressioni di tempo aiutano a situare gli avvenimenti e a dare ritmo al racconto. La scrittura di un'email per invitare, accettare o raccontare un evento collega la grammatica a un compito comunicativo reale. L'unità insiste sulla coerenza del racconto, non solo sulla correttezza della singola frase.`,
      },
    ],
  },
  {
    key: "4",
    title: "Unità 4: Quanti regali!",
    lessons: [
      {
        key: "4-1",
        title: "Quanti regali!",
        concepts: [
          "Parlare e scegliere un regalo per un compleanno",
          "Date, mesi e stagioni",
          "I verbi modali al passato prossimo",
        ],
        guide: `Il tema del regalo permette di unire affetti, gusti personali e scelte concrete. Gli studenti parlano di compleanni, date, mesi e stagioni, e imparano a motivare la scelta di un regalo. I verbi modali al passato prossimo richiedono attenzione all'ausiliare e al participio, quindi l'unità ripassa il passato prossimo in un contesto nuovo. Le attività di dialogo allenano a chiedere l'opinione dell'altro, a proporre alternative e a rispondere con cortesia. Il progetto finale può essere una lista di regali motivata, presentata alla classe con una breve spiegazione delle scelte.`,
      },
    ],
  },
  {
    key: "5",
    title: "Unità 5: A tavola",
    lessons: [
      {
        key: "5-1",
        title: "A tavola",
        concepts: [
          "Parlare dei pasti e della famiglia",
          "I possessivi e i nomi di parentela",
          "Descrivere piatti e gusti alimentari",
        ],
        guide: `A tavola è un'unità dedicata al cibo, alla famiglia e alle abitudini quotidiane. Gli studenti imparano a parlare dei pasti, dei componenti della famiglia e dei rapporti di parentela, usando i possessivi anche con i nomi di parentela. Il lessico degli alimenti e dei piatti permette di descrivere una ricetta semplice e di esprimere preferenze. La cultura italiana entra attraverso esempi di piatti tradizionali, senza ridurla a uno stereotipo. Il lavoro di gruppo può portare alla creazione di un menù equilibrato, con una spiegazione delle scelte e delle tradizioni familiari che rappresenta.`,
      },
    ],
  },
  {
    key: "6",
    title: "Unità 6: Cosa cuciniamo?",
    lessons: [
      {
        key: "6-1",
        title: "Cosa cuciniamo?",
        concepts: [
          "Parlare di piatti italiani ed esprimere preferenze",
          "Mi piace / mi piacciono, vorrei, volerci e metterci",
          "Preparare un menù e usare il lessico delle posate",
        ],
        guide: `L'ultima unità mette in pratica tutto il lessico del cibo e della cucina. Gli studenti parlano di piatti italiani, esprimono preferenze con mi piace e mi piacciono, formulano richieste cortesi con vorrei e usano volerci e metterci per parlare del tempo necessario a preparare una ricetta. La creazione di un menù e la descrizione di una preparazione semplice richiedono ordine, chiarezza e scelta lessicale precisa. L'unità si presta a un compito autentico: cucinare simbolicamente un piatto, raccontarlo alla classe e spiegare perché lo si è scelto. Così la lingua diventa azione e condivisione.`,
      },
    ],
  },
];

export const EGYPT_ITALIAN_G11_T1_BOOK = {
  subject: "Italiano — lingua straniera",
  grade: "Seconda classe secondaria",
  sourceUrl: EGYPT_ITALIAN_G11_T1_SOURCE,
};

export function isItalianG11TreeConsistent() {
  return checkG11Tree("Italiano — seconda classe secondaria", EGYPT_ITALIAN_G11_T1_UNITS);
}

export function italianG11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_ITALIAN_G11_T1_BOOK, EGYPT_ITALIAN_G11_T1_UNITS, unitIndex, lessonIndex);
}
