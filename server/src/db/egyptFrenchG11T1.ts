// PHASE 190 — official Egypt Secondary-2 (Grade 11) French as a first foreign
// language, first term.
//
// Source: the 2026/2027 Ministry textbook «Champion 2 — Français, Première
// langue étrangère, deuxième année secondaire». The tree follows the printed
// «Tableau des contenus» at the end of the book: six thematic units with their
// grammar and savoir-faire. The guides are original teaching notes in French.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_FRENCH_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/Premiere_langue_francaise_SB_Sec2_Tr1-125.pdf";

export const EGYPT_FRENCH_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "1",
    title: "Unité 1 : Famille / Condition féminine",
    lessons: [
      {
        key: "1-1",
        title: "Famille et condition féminine",
        concepts: [
          "La concordance des temps : imparfait, conditionnel présent et passé",
          "L'expression de la durée : depuis, il y a, pendant, en",
          "Rapporter des propos et exprimer la réprobation",
        ],
        guide: `Cette unité part d'un thème social proche des élèves : la famille et la place des femmes. Le texte et les documents servent de point de départ pour décrire une situation, comparer des époques et réagir à une injustice. La concordance des temps est travaillée à travers le récit et le discours rapporté : l'imparfait plante le décor, le conditionnel exprime une hypothèse ou une conséquence possible. Les expressions de durée ne sont pas interchangeables ; il faut choisir selon que l'action continue, a commencé à un moment précis ou s'est achevée. Enfin, le savoir-faire « exprimer sa réprobation » invite à argumenter avec respect, en s'appuyant sur des faits et non sur des préjugés.`,
      },
    ],
  },
  {
    key: "2",
    title: "Unité 2 : Ordinateur / Technologie",
    lessons: [
      {
        key: "2-1",
        title: "Ordinateur et technologie",
        concepts: [
          "La condition réalisée et non réalisée : si + présent, si + imparfait",
          "La proposition infinitive",
          "La place des pronoms personnels doubles",
        ],
        guide: `L'unité place la technologie au centre de la communication : décrire un usage, expliquer un problème, demander de l'aide et exprimer une hypothèse. La structure conditionnelle est présentée dans deux cas : une condition probable avec si + présent, et une condition irréelle avec si + imparfait. Les élèves apprennent aussi à construire une proposition infinitive après des verbes de volonté ou de perception, et à placer correctement deux pronoms compléments. Le savoir-faire est pragmatique : insister, refuser poliment, concéder et proposer une solution. Les exercices de rôle aident à transférer ces structures dans une conversation réelle.`,
      },
    ],
  },
  {
    key: "3",
    title: "Unité 3 : Environnement / Pollution",
    lessons: [
      {
        key: "3-1",
        title: "Environnement et pollution",
        concepts: [
          "La condition non réalisée dans le passé",
          "Le conditionnel passé du verbe devoir",
          "Le subjonctif dans l'expression du regret et du conseil",
        ],
        guide: `Cette unité relie la langue à une question citoyenne : l'environnement et la pollution. Les documents amènent les élèves à décrire des causes, à imaginer des conséquences et à formuler des reproches ou des conseils. Le conditionnel passé permet de parler d'une action qui aurait pu avoir lieu mais n'a pas eu lieu ; avec devoir, il exprime le regret ou l'obligation non accomplie. Le subjonctif apparaît dans les structures de nécessité, de volonté et de jugement. Le savoir-faire « exprimer son soutien » et « reprocher » exige un ton adapté : on peut critiquer un comportement sans attaquer une personne, et proposer une alternative concrète.`,
      },
    ],
  },
  {
    key: "4",
    title: "Unité 4 : Santé / Action humanitaire",
    lessons: [
      {
        key: "4-1",
        title: "Santé et action humanitaire",
        concepts: [
          "L'expression de la cause",
          "L'expression de la conséquence",
          "Argumenter et exprimer l'indifférence ou la colère",
        ],
        guide: `L'unité associe la santé à l'engagement humanitaire. Les textes décrivent des situations de fragilité et les réponses possibles : prévention, solidarité, accès aux soins. La cause et la conséquence sont travaillées ensemble, car un argument complet ne se contente pas d'affirmer : il explique pourquoi et montre l'effet. Les élèves apprennent à nuancer leur réaction, depuis l'indifférence apparente jusqu'à la colère justifiée, et à choisir le registre qui convient au destinataire. Un débat structuré, avec des rôles et des contraintes de temps, permet de réinvestir le lexique de la santé et de l'action humanitaire sans tomber dans la simple récitation.`,
      },
    ],
  },
  {
    key: "5",
    title: "Unité 5 : Argent, publicité, promotions",
    lessons: [
      {
        key: "5-1",
        title: "Argent, publicité et promotions",
        concepts: [
          "L'expression du but",
          "Le participe présent et le gérondif",
          "Présenter des objectifs, des moyens et une menace",
        ],
        guide: `Cette unité explore le langage de la publicité et de la consommation. Les élèves analysent une annonce, repèrent les promesses et distinguent l'information de la persuasion. L'expression du but permet de dire pourquoi une campagne existe et à quoi elle sert ; le participe présent et le gérondif ajoutent une circonstance de manière, de simultanéité ou de cause. Le savoir-faire inclut la présentation d'objectifs et de moyens, mais aussi la mise en garde et l'expression de l'incompréhension devant une offre trompeuse. Le travail final peut être la création d'une publicité responsable, avec un slogan clair et une justification des choix langagiers.`,
      },
    ],
  },
  {
    key: "6",
    title: "Unité 6 : Enseignement des langues",
    lessons: [
      {
        key: "6-1",
        title: "Enseignement des langues",
        concepts: [
          "L'expression de la concession",
          "Les propositions participiales",
          "La condition concessive et le regret",
        ],
        guide: `La dernière unité porte sur l'apprentissage des langues et sur les méthodes qui le rendent efficace. Les textes présentent des expériences, des difficultés et des stratégies, ce qui permet de travailler la concession : certes, il est difficile de parler devant les autres, mais on progresse par la pratique. Les propositions participiales allègent le style, tandis que la condition concessive introduit une réserve ou une hypothèse. Le savoir-faire « exprimer le regret » et « l'exaspération » donne aux élèves les moyens de parler de leur propre parcours avec nuance. La présentation d'un document publicitaire clôt l'unité en réinvestissant analyse, argumentation et créativité.`,
      },
    ],
  },
];

export const EGYPT_FRENCH_G11_T1_BOOK = {
  subject: "Français — première langue étrangère",
  grade: "Deuxième année secondaire",
  sourceUrl: EGYPT_FRENCH_G11_T1_SOURCE,
};

export function isFrenchG11TreeConsistent() {
  return checkG11Tree("Français — deuxième année secondaire", EGYPT_FRENCH_G11_T1_UNITS);
}

export function frenchG11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_FRENCH_G11_T1_BOOK, EGYPT_FRENCH_G11_T1_UNITS, unitIndex, lessonIndex);
}
