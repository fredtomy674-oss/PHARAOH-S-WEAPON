// PHASE 190 — official Egypt Secondary-2 (Grade 11) French story, first term.
//
// Source: the 2026/2027 Ministry edition of «La Tulipe Noire» by Alexandre
// Dumas, adapted for learners (six printed chapters). The tree follows the
// book's chapter divisions; the guides are original reading notes in French.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_FRENCH_STORY_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/Premiere_langue_francaise_STORY_Sec2_Tr1.pdf";

export const EGYPT_FRENCH_STORY_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "story",
    title: "La Tulipe Noire — Alexandre Dumas",
    lessons: [
      {
        key: "1",
        title: "Chapitre I",
        concepts: [
          "Le contexte historique : la Hollande de 1672",
          "La passion des tulipes et le concours de Harlem",
          "La rivalité entre Corneille van Baerle et Boxtel",
        ],
        guide: `Le récit s'ouvre sur une Hollande traversée par les troubles politiques et par la fièvre des tulipes. Corneille van Baerle, filleul du grand pensionnaire Jean de Witt, cultive des tulipes avec patience et ambition ; il rêve de produire une tulipe noire, fleur presque impossible qui doit lui valoir la gloire. Face à lui, Boxtel observe, envie et attend la moindre faille. Dumas installe donc deux ressorts : l'histoire collective, avec la chute des frères de Witt, et l'histoire individuelle, avec la jalousie d'un voisin. Cette double intrigue montre comment les grands événements politiques peuvent détruire une vie privée en quelques heures.`,
      },
      {
        key: "2",
        title: "Chapitre II",
        concepts: [
          "La dénonciation de Corneille par Boxtel",
          "L'arrestation et l'emprisonnement à Loewestein",
          "L'innocence face à la raison d'État",
        ],
        guide: `La jalousie de Boxtel trouve son occasion dans les lettres que Corneille reçoit de son parrain. En dénonçant son voisin, il transforme un différend de jardiniers en affaire politique. Corneille est arrêté, jugé et conduit à la forteresse de Loewestein, où il attend son sort. Le chapitre fait comprendre que l'innocence ne suffit pas quand la peur collective cherche un coupable. La tulipe, symbole de beauté et de patience, devient alors un secret fragile entre les murs d'une prison. Le lecteur mesure la distance entre la violence des hommes et la douceur du travail de la terre.`,
      },
      {
        key: "3",
        title: "Chapitre III",
        concepts: [
          "La rencontre avec Rosa, fille du geôlier",
          "La prison comme espace de confiance",
          "Le projet de faire fleurir la tulipe malgré l'enfermement",
        ],
        guide: `À Loewestein, Corneille rencontre Rosa, la fille du geôlier Gryphus. Contre la brutalité de son père, Rosa apporte une présence douce et curieuse ; elle devient peu à peu les yeux et les mains de Corneille dans le monde extérieur. Le prisonnier lui confie une part de son secret et lui apprend à reconnaître les signes de la future fleur. La prison, lieu de privation, se transforme en espace de transmission : Corneille ne peut plus agir seul, mais il peut enseigner. Ce chapitre déplace l'intrigue de la rivalité vers la confiance, et prépare le lecteur à comprendre que la tulipe noire sera autant l'œuvre de Rosa que celle de Corneille.`,
      },
      {
        key: "4",
        title: "Chapitre IV",
        concepts: [
          "La protection des bulbes par Rosa",
          "Le vol commis par Boxtel",
          "La preuve et la stratégie pour rétablir la vérité",
        ],
        guide: `Les bulbes de la tulipe noire deviennent un trésor menacé. Rosa les protège avec un courage discret, tandis que Boxtel, toujours à l'affût, cherche à s'en emparer pour s'attribuer la réussite. Le vol fait basculer le récit dans une enquête : il ne suffit plus de cultiver, il faut prouver. Dumas oppose deux formes d'intelligence, celle qui crée et celle qui prend. Rosa comprend qu'une fleur sans témoignage peut être volée, et elle commence à rassembler les éléments qui établiront la vérité. Ce chapitre rappelle que la justice dépend souvent de la mémoire et du courage de ceux qui ont vu.`,
      },
      {
        key: "5",
        title: "Chapitre V",
        concepts: [
          "Le concours de la tulipe noire à Harlem",
          "La fausse revendication de Boxtel",
          "Le témoignage de Rosa et la reconnaissance de la vraie propriété",
        ],
        guide: `À Harlem, la tulipe noire est exposée et le prix doit couronner son créateur. Boxtel se présente comme le propriétaire de la fleur, mais Rosa arrive avec la preuve de ce qu'elle et Corneille ont accompli. Le chapitre organise une tension de reconnaissance : qui croira une jeune fille contre un homme respecté ? Les juges, les témoins et la foule deviennent les arbitres d'une vérité qui ne peut plus rester privée. La fleur, objet de beauté, se transforme en pièce à conviction. Dumas montre que le triomphe de la vérité n'est pas automatique ; il faut du courage pour parler et des institutions capables d'écouter.`,
      },
      {
        key: "6",
        title: "Chapitre VI",
        concepts: [
          "L'intervention de Guillaume d'Orange",
          "La récompense de Rosa et la libération de Corneille",
          "Le mariage et le triomphe de la justice",
        ],
        guide: `Le dénouement vient de l'autorité politique : Guillaume d'Orange reconnaît l'innocence de Corneille et la valeur de Rosa. La jeune fille reçoit la récompense promise, tandis que Corneille est libéré et peut enfin épouser celle qui a partagé sa prison et sa passion. Boxtel, vaincu par sa propre ruse, disparaît de la scène. Le chapitre ne se contente pas de punir le méchant ; il récompense la fidélité, le travail et le courage. La tulipe noire devient ainsi le symbole d'une beauté qui ne s'épanouit que dans la confiance. La fin heureuse répond aux malheurs du début, mais elle garde la mémoire des injustices traversées.`,
      },
    ],
  },
];

export const EGYPT_FRENCH_STORY_G11_T1_BOOK = {
  subject: "Français — lecture suivie",
  grade: "Deuxième année secondaire",
  sourceUrl: EGYPT_FRENCH_STORY_G11_T1_SOURCE,
};

export function isFrenchStoryG11TreeConsistent() {
  return checkG11Tree("La Tulipe Noire — deuxième année secondaire", EGYPT_FRENCH_STORY_G11_T1_UNITS);
}

export function frenchStoryG11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_FRENCH_STORY_G11_T1_BOOK, EGYPT_FRENCH_STORY_G11_T1_UNITS, unitIndex, lessonIndex);
}
