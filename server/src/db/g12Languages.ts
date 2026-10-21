// PHASE 192 — official G12 language library, first term.
//
// These are the books that depend on the child's first/second foreign language,
// not on the science/literature track:
//   English (second foreign language)   3 units / 12 lessons
//   French (first foreign language)    11 lessons
//   French (second foreign language)    4 units
//   French story                        6 reading units
//   German                              5 lessons (10–14)
//   Italian                             6 units
//   Spanish                             9 units (14–22)
//
// Trees follow the printed tables of contents. The French workbook is a
// companion to the French course, not a separate curriculum, so it is not
// enrolled as a book (the workbook itself remains a documented resource).
import { createG12Book, createG12LocalizedBook } from "./g12.js";

export const G12_LANGUAGE_BASE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/";

const EN_GRADE = "Grade 12 — first term";
const FR_GRADE = "Troisième année secondaire — premier trimestre";
const AR_GRADE = "الصف الثالث الثانوي — الفصل الدراسي الأول";

// ---------------------------------------------------------------------------
// English as a second foreign language — printed Contents, 3 × 4 lessons
// ---------------------------------------------------------------------------

export const EGYPT_ENGLISH2_G12_T1_SOURCE = `${G12_LANGUAGE_BASE}English_Second_Language_SEC3_Tr1.pdf`;

const englishSecond = createG12LocalizedBook({
  subject: "English (second foreign language)",
  grade: EN_GRADE,
  sourceUrl: EGYPT_ENGLISH2_G12_T1_SOURCE,
  language: "en",
  units: [
    {
      key: "1",
      title: "Unit 1: Learning & Ambition",
      lessons: [
        {
          title: "Learning for the Future",
          concepts: ["Education and future careers", "Reading for main ideas", "Expressing plans and intentions"],
          focus: "Connect the reading about learning with the learner's own plans after school.",
        },
        {
          title: "A School Project",
          concepts: ["Project vocabulary", "Present continuous for future arrangements", "Collaboration and presentation"],
          focus: "Use a real school project to practise arrangements, roles and a short presentation.",
        },
        {
          title: "Planning for Success",
          concepts: ["Goals and time management", "First conditional", "Writing a short plan"],
          focus: "Turn a goal into a realistic plan with conditions and deadlines.",
        },
        {
          title: "A Social Media Reflection",
          concepts: ["Social media vocabulary", "Present perfect", "Writing a reflection"],
          focus: "Reflect on online habits while practising present perfect statements.",
        },
      ],
    },
    {
      key: "2",
      title: "Unit 2: Sports & Community",
      lessons: [
        {
          title: "Sports for a Better Community",
          concepts: ["Community sports vocabulary", "Gerunds and infinitives", "Discussing benefits"],
          focus: "Discuss how sport can change a neighbourhood and support a clear opinion.",
        },
        {
          title: "Community Sports Events",
          concepts: ["Event planning", "Passive voice", "Listening for details"],
          focus: "Plan a community event and report what is done, when and by whom.",
        },
        {
          title: "Sports & Community Heroes",
          concepts: ["Describing people", "Relative clauses", "Reading a profile"],
          focus: "Build a profile of a local hero using precise relative clauses.",
        },
        {
          title: "Taking Action!",
          concepts: ["Making suggestions", "Modal verbs", "Writing a proposal"],
          focus: "Propose a practical community action and justify it politely.",
        },
      ],
    },
    {
      key: "3",
      title: "Unit 3: Jobs & Technology",
      lessons: [
        {
          title: "Jobs around Us",
          concepts: ["Jobs and skills", "Present simple vs present continuous", "Talking about routines"],
          focus: "Compare a routine job with a temporary task using the two present forms.",
        },
        {
          title: "Technology at Work",
          concepts: ["Workplace technology", "Future forms", "Reading instructions"],
          focus: "Follow instructions for a workplace tool and predict future changes.",
        },
        {
          title: "Teamwork & Jobs",
          concepts: ["Teamwork vocabulary", "Modals of obligation", "Role-play"],
          focus: "Practise a workplace conversation with clear duties and polite requests.",
        },
        {
          title: "Jobs and Technology",
          concepts: ["Review vocabulary", "Comparatives and superlatives", "Writing a short report"],
          focus: "Compare jobs and technologies, then report a conclusion with evidence.",
        },
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// French as a first foreign language — Champion 3, 11 printed lessons
// ---------------------------------------------------------------------------

export const EGYPT_FRENCH_G12_T1_SOURCE = `${G12_LANGUAGE_BASE}Premiere_langue_francaise_SB_Sec3.pdf`;

const frenchFirst = createG12LocalizedBook({
  subject: "Français (première langue étrangère)",
  grade: FR_GRADE,
  sourceUrl: EGYPT_FRENCH_G12_T1_SOURCE,
  language: "fr",
  units: [
    {
      key: "1",
      title: "Leçon 1 : Une nouvelle créatrice — Curriculum vitae",
      lessons: [
        {
          title: "Une nouvelle créatrice — Curriculum vitae",
          concepts: ["Présenter son curriculum vitae", "Les pronoms personnels compléments", "Le passé composé et l'imparfait"],
          focus: "Présenter un parcours personnel et professionnel en alternant faits achevés et description.",
        },
      ],
    },
    {
      key: "2",
      title: "Leçon 2 : Apprendre une langue étrangère — Quel type d'étudiant(e) êtes-vous ?",
      lessons: [
        {
          title: "Apprendre une langue étrangère — Quel type d'étudiant(e) êtes-vous ?",
          concepts: ["Savoir faire un test", "Décrire les méthodes d'apprentissage", "Questionner, enquêter, discours rapporté"],
          focus: "Analyser ses habitudes d'apprentissage et rapporter les réponses d'un camarade.",
        },
      ],
    },
    {
      key: "3",
      title: "Leçon 3 : Suppositions — Donner votre avis",
      lessons: [
        {
          title: "Suppositions — Donner votre avis",
          concepts: ["Imaginer", "Exprimer une opinion", "Le conditionnel présent"],
          focus: "Formuler des hypothèses et défendre un avis nuancé.",
        },
      ],
    },
    {
      key: "4",
      title: "Leçon 4 : Quelle époque ! — Le gymnase de Nancy",
      lessons: [
        {
          title: "Quelle époque ! — Le gymnase de Nancy",
          concepts: ["Comprendre et raconter une anecdote", "Améliorer son image", "Prendre la parole, situer l'époque et le lieu, maintenir l'attention"],
          focus: "Raconter une anecdote avec un cadre temporel et spatial clair.",
        },
      ],
    },
    {
      key: "5",
      title: "Leçon 5 : La ligne des Cévennes — La protection d'un site naturel",
      lessons: [
        {
          title: "La ligne des Cévennes — La protection d'un site naturel",
          concepts: ["Exprimer la volonté et la nécessité", "Parler de l'environnement", "Le subjonctif présent"],
          focus: "Argumenter sur la protection d'un site naturel avec des verbes de volonté et de nécessité.",
        },
      ],
    },
    {
      key: "6",
      title: "Leçon 6 : La protection des animaux sauvages — Après la tempête",
      lessons: [
        {
          title: "La protection des animaux sauvages — Après la tempête",
          concepts: ["Parler des animaux", "Parler d'une catastrophe", "Les pronoms personnels compléments : choses, idées, le, la, les, y, en"],
          focus: "Décrire une catastrophe et ses conséquences en évitant les répétitions.",
        },
      ],
    },
    {
      key: "7",
      title: "Leçon 7 : Les grands événements — La découverte",
      lessons: [
        {
          title: "Les grands événements — La découverte",
          concepts: ["Présenter une information", "Exprimer la possibilité et la probabilité", "La construction passive ; le subjonctif présent"],
          focus: "Présenter une découverte et mesurer le degré de certitude de l'information.",
        },
      ],
    },
    {
      key: "8",
      title: "Leçon 8 : Coup de cœur — Le jean",
      lessons: [
        {
          title: "Coup de cœur — Le jean",
          concepts: ["Choisir", "Créer", "Les pronoms interrogatifs et démonstratifs"],
          focus: "Présenter un objet culturel et expliquer un choix personnel.",
        },
      ],
    },
    {
      key: "9",
      title: "Leçon 9 : L'entreprise en difficulté — Ces innovations, aux conséquences imprévisibles",
      lessons: [
        {
          title: "L'entreprise en difficulté — Ces innovations, aux conséquences imprévisibles",
          concepts: ["Exprimer la cause", "Exprimer les conséquences", "Enchaîner les idées"],
          focus: "Expliquer un problème économique et enchaîner causes, conséquences et solutions.",
        },
      ],
    },
    {
      key: "10",
      title: "Leçon 10 : Accidents de la route — Journée sans achats",
      lessons: [
        {
          title: "Accidents de la route — Journée sans achats",
          concepts: ["Faire une démonstration", "Justifier une action", "Exprimer le but"],
          focus: "Défendre une action citoyenne avec des arguments et un objectif explicite.",
        },
      ],
    },
    {
      key: "11",
      title: "Leçon 11 : Dépenses des Français — Différents types de lettres",
      lessons: [
        {
          title: "Dépenses des Français — Différents types de lettres",
          concepts: ["Gérer son argent", "Réclamer, imposer par écrit", "La gradation"],
          focus: "Écrire une lettre claire et graduer les arguments selon leur force.",
        },
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// French as a second foreign language — Club@dos PLUS 3, 4 units
// ---------------------------------------------------------------------------

export const EGYPT_FRENCH2_G12_T1_SOURCE = `${G12_LANGUAGE_BASE}Une_deuxieme_langue_francaise_Sec3.pdf`;

const frenchSecond = createG12LocalizedBook({
  subject: "Français (deuxième langue étrangère)",
  grade: FR_GRADE,
  sourceUrl: EGYPT_FRENCH2_G12_T1_SOURCE,
  language: "fr",
  units: [
    {
      key: "1",
      title: "Unité 1 : Le Club des sportifs",
      lessons: [
        {
          title: "Le Club des sportifs",
          concepts: ["Le vocabulaire du sport", "Les adjectifs possessifs et les pronoms COD/COI", "Proposer, accepter ou refuser une activité"],
          focus: "Parler de ses sports et de ses préférences dans un échange de groupe.",
        },
      ],
    },
    {
      key: "2",
      title: "Unité 2 : Le Club des gourmands",
      lessons: [
        {
          title: "Le Club des gourmands",
          concepts: ["Les aliments, les boissons et les rayons du supermarché", "Les articles partitifs et le pronom en", "Faire des achats et exprimer une quantité"],
          focus: "Faire les courses et négocier une quantité dans une situation réaliste.",
        },
      ],
    },
    {
      key: "3",
      title: "Unité 3 : Le Club des explorateurs",
      lessons: [
        {
          title: "Le Club des explorateurs",
          concepts: ["Les animaux de la ferme et les lieux de la campagne", "Savoir + infinitif ; pourquoi / parce que", "Raconter au passé (1)"],
          focus: "Décrire un lieu rural et raconter une découverte au passé.",
        },
      ],
    },
    {
      key: "4",
      title: "Unité 4 : Le Club des voyageurs",
      lessons: [
        {
          title: "Le Club des voyageurs",
          concepts: ["Les moyens de transport et les commerces", "La préposition chez et le pronom y", "Raconter au passé (2)"],
          focus: "Organiser un déplacement et raconter un voyage avec des repères précis.",
        },
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// French story — Le Comte de Monte-Cristo, six reading units
// ---------------------------------------------------------------------------

export const EGYPT_FRENCH_STORY_G12_T1_SOURCE = `${G12_LANGUAGE_BASE}Premiere_langue_francaise_Story_Sec3.pdf`;

const frenchStory = createG12LocalizedBook({
  subject: "Le Comte de Monte-Cristo",
  grade: FR_GRADE,
  sourceUrl: EGYPT_FRENCH_STORY_G12_T1_SOURCE,
  language: "fr",
  units: [
    {
      key: "1",
      title: "Première partie : L'arrivée à Marseille",
      lessons: [
        {
          title: "Le retour du Pharaon",
          concepts: ["Edmond Dantès et Mercédès", "Le bonheur avant le complot", "Les personnages du port"],
          focus: "Situer l'ouverture du roman et comprendre les relations entre les personnages.",
        },
      ],
    },
    {
      key: "2",
      title: "Deuxième partie : Le château d'If",
      lessons: [
        {
          title: "L'arrestation et la prison",
          concepts: ["La dénonciation", "L'abbé Faria", "L'apprentissage et l'amitié"],
          focus: "Suivre la transformation d'Edmond pendant l'emprisonnement.",
        },
      ],
    },
    {
      key: "3",
      title: "Troisième partie : L'évasion",
      lessons: [
        {
          title: "Le trésor de Monte-Cristo",
          concepts: ["La mort de Faria", "L'évasion", "Le trésor de l'île"],
          focus: "Comprendre le tournant de l'évasion et la naissance du comte.",
        },
      ],
    },
    {
      key: "4",
      title: "Quatrième partie : Le retour",
      lessons: [
        {
          title: "La vengeance commence",
          concepts: ["La nouvelle identité", "Les ennemis d'autrefois", "La justice et la vengeance"],
          focus: "Distinguer les projets de justice des désirs de vengeance.",
        },
      ],
    },
    {
      key: "5",
      title: "Cinquième partie : Les intrigues de Paris",
      lessons: [
        {
          title: "Le comte à Paris",
          concepts: ["Les salons parisiens", "Les secrets révélés", "Le rôle de Mercédès"],
          focus: "Suivre les révélations et leurs effets sur les personnages.",
        },
      ],
    },
    {
      key: "6",
      title: "Sixième partie : Le dénouement",
      lessons: [
        {
          title: "La vérité et le départ",
          concepts: ["Le pardon", "Le bilan de la vengeance", "La dernière décision d'Edmond"],
          focus: "Interpréter la fin du roman et le message sur la justice et le pardon.",
        },
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// German — Schritte international 3, Lektionen 10–14
// ---------------------------------------------------------------------------

export const EGYPT_GERMAN_G12_T1_SOURCE = `${G12_LANGUAGE_BASE}Deutsch_language_Sec3.pdf`;

const german = createG12Book({
  subject: "Deutsch (zweite Fremdsprache)",
  grade: AR_GRADE,
  sourceUrl: EGYPT_GERMAN_G12_T1_SOURCE,
  units: [
    {
      key: "10",
      title: "Lektion 10: Gesundheit",
      lessons: [
        {
          title: "Gesundheit",
          concepts: ["Körperteile benennen", "Über das Befinden sprechen", "Anweisungen und Ratschläge geben", "Possessivartikel und Modalverben"],
          focus: "Beschreibe Beschwerden und gib höfliche Ratschläge für einen gesunden Alltag.",
        },
      ],
    },
    {
      key: "11",
      title: "Lektion 11: In der Stadt unterwegs",
      lessons: [
        {
          title: "In der Stadt unterwegs",
          concepts: ["Nach dem Weg fragen und den Weg beschreiben", "Orte und Richtungen bestimmen", "Fahrpläne und Durchsagen verstehen", "Lokale Präpositionen"],
          focus: "Frage nach dem Weg und erkläre eine Route mit den richtigen Präpositionen.",
        },
      ],
    },
    {
      key: "12",
      title: "Lektion 12: Der Kunde ist König",
      lessons: [
        {
          title: "Der Kunde ist König",
          concepts: ["Zeitangaben verstehen und machen", "Höfliche Bitten und Aufforderungen ausdrücken", "Informationstexte und Telefonansagen verstehen", "Temporale Präpositionen"],
          focus: "Formuliere höfliche Bitten und ordne Termine zeitlich richtig ein.",
        },
      ],
    },
    {
      key: "13",
      title: "Lektion 13: Neue Kleider",
      lessons: [
        {
          title: "Neue Kleider",
          concepts: ["Kleidungsstücke benennen und bewerten", "Gefallen und Missfallen ausdrücken", "Einen Zeitungsartikel verstehen", "Demonstrativpronomen und Komparation"],
          focus: "Beschreibe Kleidung, vergleiche sie und begründe deine Wahl.",
        },
      ],
    },
    {
      key: "14",
      title: "Lektion 14: Feste",
      lessons: [
        {
          title: "Feste",
          concepts: ["Das Datum erfragen und nennen", "Über Personen und Dinge sprechen", "Gründe angeben", "Einladungen lesen und schreiben", "Ordinalzahlen und Personalpronomen im Akkusativ"],
          focus: "Plane ein Fest, schreibe eine Einladung und nenne Gründe für deine Wahl.",
        },
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// Italian — Progetto italiano Junior 3, units 1–6
// ---------------------------------------------------------------------------

export const EGYPT_ITALIAN_G12_T1_SOURCE = `${G12_LANGUAGE_BASE}Italiano_language_Sec3.pdf`;

const italian = createG12Book({
  subject: "Italiano (seconda lingua straniera)",
  grade: AR_GRADE,
  sourceUrl: EGYPT_ITALIAN_G12_T1_SOURCE,
  units: [
    {
      key: "1",
      title: "Unità 1: Progetti... extrascolastici",
      lessons: [
        {
          title: "Progetti... extrascolastici",
          concepts: ["Fare progetti e promesse", "Il futuro semplice regolare e irregolare", "Parlare di attività scolastiche"],
          focus: "Parla dei tuoi progetti scolastici usando il futuro in modo naturale.",
        },
      ],
    },
    {
      key: "2",
      title: "Unità 2: Saremo tutti delle stelle!",
      lessons: [
        {
          title: "Saremo tutti delle stelle!",
          concepts: ["Il futuro composto", "I segni zodiacali e le previsioni", "Descrivere il carattere e chiedere conferma"],
          focus: "Fai previsioni e descrivi il carattere delle persone con lessico appropriato.",
        },
      ],
    },
    {
      key: "3",
      title: "Unità 3: Ambiente ed ecologia",
      lessons: [
        {
          title: "Ambiente ed ecologia",
          concepts: ["I pronomi diretti", "Esprimere gioia, rammarico e disappunto", "Proporre soluzioni per l'ambiente"],
          focus: "Discuti problemi ambientali e proponi soluzioni con i pronomi diretti.",
        },
      ],
    },
    {
      key: "4",
      title: "Unità 4: L'ho sentita!",
      lessons: [
        {
          title: "L'ho sentita!",
          concepts: ["I pronomi diretti nei tempi composti", "Il pronome partitivo ne", "Offrire, accettare e rifiutare un aiuto"],
          focus: "Racconta un episodio e usa i pronomi per evitare ripetizioni.",
        },
      ],
    },
    {
      key: "5",
      title: "Unità 5: Facciamo spese",
      lessons: [
        {
          title: "Facciamo spese",
          concepts: ["I verbi riflessivi e reciproci", "Chiedere ed esprimere un parere", "Capi di abbigliamento, colori e stili"],
          focus: "Fai acquisti e confronta opinioni su vestiti e prezzi.",
        },
      ],
    },
    {
      key: "6",
      title: "Unità 6: Che numero porti?",
      lessons: [
        {
          title: "Che numero porti?",
          concepts: ["I verbi riflessivi nei tempi composti", "Espressioni per fare spese", "Fissare un appuntamento"],
          focus: "Gestisci un dialogo in un negozio e fissa un appuntamento.",
        },
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// Spanish — Español 3, units 14–22
// ---------------------------------------------------------------------------

export const EGYPT_SPANISH_G12_T1_SOURCE = `${G12_LANGUAGE_BASE}Espanol_language_Sec3.pdf`;

const spanish = createG12Book({
  subject: "Español (segunda lengua extranjera)",
  grade: AR_GRADE,
  sourceUrl: EGYPT_SPANISH_G12_T1_SOURCE,
  units: [
    {
      key: "14",
      title: "Unidad 14: En mi tiempo libre...",
      lessons: [
        {
          title: "En mi tiempo libre...",
          concepts: ["Expresar gustos, intereses y preferencias", "Valorar actividades culturales", "Pronombres átonos de objeto indirecto"],
          focus: "Habla de tu tiempo libre y valora las actividades que prefieres.",
        },
      ],
    },
    {
      key: "15",
      title: "Unidad 15: Mi personaje",
      lessons: [
        {
          title: "Mi personaje",
          concepts: ["Contar la vida de una persona", "El ciclo de la vida", "Contraste entre indefinido y perfecto"],
          focus: "Presenta la biografía de un personaje con los tiempos del pasado adecuados.",
        },
      ],
    },
    {
      key: "16",
      title: "Unidad 16: En Internet",
      lessons: [
        {
          title: "En Internet",
          concepts: ["Dar órdenes o instrucciones", "La informática y las nuevas tecnologías", "El imperativo irregular y los pronombres de objeto"],
          focus: "Explica cómo usar una herramienta digital con instrucciones claras.",
        },
      ],
    },
    {
      key: "17",
      title: "Unidad 17: ¿Qué voy a ser de mayor?",
      lessons: [
        {
          title: "¿Qué voy a ser de mayor?",
          concepts: ["Expresar deseos y planes", "Las profesiones y las titulaciones", "Perífrasis verbales de futuro"],
          focus: "Describe tus planes profesionales y justifica tus elecciones.",
        },
      ],
    },
    {
      key: "18",
      title: "Unidad 18: En el centro comercial",
      lessons: [
        {
          title: "En el centro comercial",
          concepts: ["Invitar y proponer planes", "Pedir y dar información sobre productos", "Artículos definidos e indefinidos"],
          focus: "Compra en un centro comercial y pide información con cortesía.",
        },
      ],
    },
    {
      key: "19",
      title: "Unidad 19: En el país del Nilo",
      lessons: [
        {
          title: "En el país del Nilo",
          concepts: ["Expresar obligación y necesidad", "Geografía, economía y sociedad de Egipto", "Cuantificadores"],
          focus: "Presenta Egipto y explica necesidades y obligaciones de su sociedad.",
        },
      ],
    },
    {
      key: "20",
      title: "Unidad 20: En tiempos del faraón",
      lessons: [
        {
          title: "En tiempos del faraón",
          concepts: ["Describir y narrar en el pasado", "El antiguo Egipto y las costumbres", "El pretérito imperfecto"],
          focus: "Narra la vida en el antiguo Egipto y describe sus costumbres.",
        },
      ],
    },
    {
      key: "21",
      title: "Unidad 21: ¡Buena idea!",
      lessons: [
        {
          title: "¡Buena idea!",
          concepts: ["Describir objetos y opinar", "Forma, color, material y utilidad", "Frases de finalidad y pronombres posesivos"],
          focus: "Describe un invento y explica para qué sirve.",
        },
      ],
    },
    {
      key: "22",
      title: "Unidad 22: Deporte y vida sana",
      lessons: [
        {
          title: "Deporte y vida sana",
          concepts: ["Dar consejos generales y personalizados", "La alimentación y el deporte", "Perífrasis verbales e imperativo plural"],
          focus: "Da consejos para una vida sana y habla de acciones recientes.",
        },
      ],
    },
  ],
});

export const G12_LANGUAGE_BOOKS = {
  englishSecond,
  frenchFirst,
  frenchSecond,
  frenchStory,
  german,
  italian,
  spanish,
} as const;
