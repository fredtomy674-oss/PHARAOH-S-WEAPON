// PHASE 190 — official Egypt Secondary-2 (Grade 11) French as a second foreign
// language, first term.
//
// Source: the 2026/2027 Ministry edition of «Club@dos plus 2». The tree follows
// the printed «Tableau des contenus»: Unité 0 Révisions, four thematic units,
// and the Aide-Mémoire. The guides are original teaching notes in French.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_FRENCH2_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/Une_deuxieme_langue_francaise_Sec2_Tr1.pdf";

export const EGYPT_FRENCH2_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "0",
    title: "Unité 0 : Révisions",
    lessons: [
      {
        key: "0-1",
        title: "Révisions",
        concepts: [
          "Réactivation du présent, du passé composé et du futur proche",
          "Lexique de la classe, des loisirs et de la vie quotidienne",
          "Se présenter, poser des questions et décrire un lieu",
        ],
        guide: `L'unité zéro n'est pas une simple révision de formes : elle remet en route les outils dont les élèves auront besoin dans les quatre unités suivantes. On rappelle le présent pour décrire, le passé composé pour raconter, et le futur proche pour annoncer un projet. Le lexique de la classe et des loisirs est réactivé à travers des situations concrètes : se présenter, demander une information, décrire son quartier. Les activités courtes et variées permettent de diagnostiquer les lacunes sans alourdir le début du terme. L'objectif est que chaque élève ose parler, même avec des phrases simples, avant d'aborder des contenus plus exigeants.`,
      },
    ],
  },
  {
    key: "1",
    title: "Unité 1 : Le Club des citadins",
    lessons: [
      {
        key: "1-1",
        title: "Le Club des citadins",
        concepts: [
          "Décrire mon quartier et nommer ma ville",
          "Indiquer un itinéraire",
          "Parler des professions et des moyens de transport",
        ],
        guide: `Cette unité invite les élèves à parler de leur environnement urbain. Ils apprennent à nommer les lieux d'un quartier, à situer un bâtiment et à expliquer un trajet avec des verbes de déplacement et des prépositions de lieu. Le lexique de la circulation et des transports permet de comparer plusieurs façons de se rendre au même endroit. On travaille aussi les professions, non comme une liste isolée, mais à travers la question « qui fait quoi dans la ville ? ». Le projet de classe peut être un petit guide du quartier, avec un plan, des descriptions et des conseils pratiques pour un visiteur.`,
      },
    ],
  },
  {
    key: "2",
    title: "Unité 2 : Le Club des photographes",
    lessons: [
      {
        key: "2-1",
        title: "Le Club des photographes",
        concepts: [
          "Parler du climat et des saisons",
          "Identifier des lieux et dire la nationalité",
          "Annoncer des projets et parler de l'origine",
        ],
        guide: `L'unité transforme les élèves en reporters : ils observent des paysages, décrivent le temps et situent des lieux. Le lexique de la nature et des saisons est mis en relation avec les vêtements, les activités et les projets de voyage. On révise les nationalités et les continents pour présenter une personne ou un lieu sans confondre pays, langue et origine. Les élèves apprennent à annoncer un projet avec le futur proche et à justifier un choix par le climat ou le cadre de vie. Une galerie de photos commentées permet de réinvestir tous ces points dans une production courte, claire et personnelle.`,
      },
    ],
  },
  {
    key: "3",
    title: "Unité 3 : Le Club des lookés",
    lessons: [
      {
        key: "3-1",
        title: "Le Club des lookés",
        concepts: [
          "Nommer et décrire les vêtements et les accessoires",
          "Donner son opinion sur une tenue",
          "Exprimer la volonté, la possibilité et la permission",
        ],
        guide: `Cette unité porte sur la mode et sur la manière de parler de son apparence sans se limiter à des jugements rapides. Les élèves décrivent des vêtements, des matières, des motifs et des couleurs, puis comparent des tenues et justifient leur préférence. Les pronoms personnels et les structures de volonté, de possibilité et de permission sont travaillés dans des situations de choix : peut-on porter ce vêtement à l'école ? Que veut-on acheter ? Que peut-on se permettre ? Le savoir-faire « parler de quelqu'un sans dire son nom » ajoute une dimension ludique et précise. Le projet final peut être un défilé commenté ou un catalogue responsable.`,
      },
    ],
  },
  {
    key: "4",
    title: "Unité 4 : Le Club des décorateurs",
    lessons: [
      {
        key: "4-1",
        title: "Le Club des décorateurs",
        concepts: [
          "Nommer les pièces de la maison et les meubles",
          "Parler des activités quotidiennes et des tâches ménagères",
          "Comparer, exprimer une préférence et une action récente",
        ],
        guide: `La dernière unité ramène les élèves dans un espace familier : la maison. Ils nomment les pièces, les meubles et les objets de décoration, puis décrivent les activités quotidiennes et la répartition des tâches. La comparaison et l'expression de la préférence permettent de justifier un choix de disposition ou de style. On travaille aussi le passé récent pour parler de ce qui vient de se produire. Le projet de classe est une chambre idéale : chaque groupe présente un plan, un choix de couleurs et une explication des fonctions de l'espace. L'unité relie ainsi langue, créativité et vie quotidienne.`,
      },
    ],
  },
];

export const EGYPT_FRENCH2_G11_T1_BOOK = {
  subject: "Français — deuxième langue étrangère",
  grade: "Deuxième année secondaire",
  sourceUrl: EGYPT_FRENCH2_G11_T1_SOURCE,
};

export function isFrench2G11TreeConsistent() {
  return checkG11Tree("Français 2 — deuxième année secondaire", EGYPT_FRENCH2_G11_T1_UNITS);
}

export function french2G11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_FRENCH2_G11_T1_BOOK, EGYPT_FRENCH2_G11_T1_UNITS, unitIndex, lessonIndex);
}
