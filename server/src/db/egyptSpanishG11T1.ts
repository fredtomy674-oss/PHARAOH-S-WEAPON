// PHASE 190 — official Egypt Secondary-2 (Grade 11) Spanish as a second foreign
// language, first term.
//
// Source: the 2026/2027 Ministry edition of the Spanish textbook «Español 2».
// The tree follows the printed «Contenidos, volumen 2»: units 7–13 and the
// review section «Para recordar 1». The guides are original notes in Spanish.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_SPANISH_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/Espanol_language_Sec2_Tr1.pdf";

export const EGYPT_SPANISH_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "7",
    title: "Unidad 7: En casa",
    lessons: [
      {
        key: "7-1",
        title: "En casa",
        concepts: [
          "Tipos de vivienda, habitaciones y objetos de la casa",
          "Dar y pedir información sobre lugares y cosas",
          "Preposiciones de lugar y para + infinitivo",
        ],
        guide: `La unidad abre con un tema cotidiano: la casa. Los estudiantes describen distintos tipos de vivienda, nombran habitaciones y objetos, y sitúan cada cosa en el espacio con preposiciones de lugar. También aprenden a expresar finalidad con para + infinitivo, por ejemplo «uso la mesa para estudiar». El objetivo no es acumular vocabulario, sino organizar una descripción comprensible de un espacio real o imaginario. Una actividad útil es dibujar una casa y explicarla a un compañero, que debe reconstruirla escuchando. Así se practican la precisión léxica, la ubicación espacial y la claridad al hablar.`,
      },
    ],
  },
  {
    key: "8",
    title: "Unidad 8: ¡A comer!",
    lessons: [
      {
        key: "8-1",
        title: "¡A comer!",
        concepts: [
          "Comidas y alimentos; expresar gustos",
          "Ofrecer, invitar, aceptar y rechazar una invitación",
          "Verbos irregulares en presente",
        ],
        guide: `¡A comer! lleva al aula el lenguaje de la comida y la hospitalidad. Los estudiantes hablan de sus gustos, distinguen comidas y alimentos, y aprenden a ofrecer, invitar, aceptar o rechazar con cortesía. La gramática se centra en los verbos irregulares en presente, que aparecen dentro de situaciones reales: pedir un plato, recomendar algo o explicar qué se prefiere. Es importante practicar la entonación y las fórmulas de cortesía, porque un rechazo puede sonar brusco si no se acompaña de una razón amable. La unidad puede cerrar con un menú de clase y una breve presentación de gustos y hábitos alimentarios.`,
      },
    ],
  },
  {
    key: "9",
    title: "Unidad 9: Mi barrio",
    lessons: [
      {
        key: "9-1",
        title: "Mi barrio",
        concepts: [
          "Dirección, orientación y espacios urbanos",
          "Compras, tiendas y establecimientos",
          "Hay / está y verbos en presente",
        ],
        guide: `Esta unidad convierte el barrio en un mapa de comunicación. Los estudiantes piden y dan información sobre lugares, explican cómo llegar a una tienda o un servicio y describen qué hay en su zona. La diferencia entre hay y está es clave: hay presenta la existencia de algo, mientras que está sitúa algo que ya conocemos. Las tiendas y los establecimientos permiten practicar diálogos de compra y orientación. Un recorrido por un plano imaginario ayuda a usar el lenguaje en secuencia: primero se ubica el punto de partida, después se indica el camino y finalmente se comprueba si el interlocutor ha entendido.`,
      },
    ],
  },
  {
    key: "10",
    title: "Unidad 10: ¡Vamos de excursión!",
    lessons: [
      {
        key: "10-1",
        title: "¡Vamos de excursión!",
        concepts: [
          "El tiempo, el clima y las estaciones",
          "Viajes, transportes y planes",
          "Querer / ir a + infinitivo, estar + gerundio y comparaciones",
        ],
        guide: `¡Vamos de excursión! combina el mundo del viaje con la descripción del tiempo y del paisaje. Los estudiantes hablan del clima, de las estaciones y de los medios de transporte, y aprenden a hacer planes con querer e ir a + infinitivo. La estructura estar + gerundio permite describir una acción en desarrollo, mientras que las comparaciones ayudan a elegir entre destinos, precios o formas de viajar. La tarea final puede ser la organización de una excursión: destino, época del año, transporte, presupuesto y actividades. Al justificar cada decisión, los estudiantes usan la lengua para resolver un problema real y no solo para repetir vocabulario.`,
      },
    ],
  },
  {
    key: "review-1",
    title: "Para recordar 1: Repaso",
    lessons: [
      {
        key: "review-1-1",
        title: "Para recordar 1",
        concepts: [
          "Repaso de las funciones de las unidades 7–10",
          "Repaso del léxico de la casa, la comida, el barrio y los viajes",
          "Repaso de preposiciones, hay/está, gustos y planes",
        ],
        guide: `Para recordar 1 es una pausa de consolidación antes de las últimas unidades del curso. No introduce contenidos nuevos: reorganiza lo aprendido para que el estudiante pueda usarlo con más seguridad. El repaso debe ser activo, no una simple relectura. Conviene agrupar el léxico por situaciones, comparar estructuras que se confunden y pedir pequeñas producciones orales o escritas donde aparezcan varias funciones a la vez. Por ejemplo, describir una casa, invitar a comer y explicar cómo llegar. Así el estudiante comprueba qué sabe hacer con la lengua y qué necesita repasar antes de avanzar.`,
      },
    ],
  },
  {
    key: "11",
    title: "Unidad 11: El viernes",
    lessons: [
      {
        key: "11-1",
        title: "El viernes",
        concepts: [
          "Dar y pedir información sobre el pasado",
          "Narrar de forma oral y escrita",
          "El pretérito indefinido y los interrogativos",
        ],
        guide: `El viernes introduce la narración del pasado a través del ocio y de los planes que ya ocurrieron. Los estudiantes cuentan qué hicieron, cuándo y con quién, usando el pretérito indefinido y los interrogativos. La narración exige orden: no basta con una lista de acciones, hay que situarlas y relacionarlas. Las actividades de escucha y de escritura de una carta o un mensaje ayudan a distinguir el relato oral, más espontáneo, del escrito, que necesita más precisión. El docente puede pedir una anécdota breve y trabajar sobre los marcadores temporales, la concordancia y la claridad de la secuencia.`,
      },
    ],
  },
  {
    key: "12",
    title: "Unidad 12: Hoy no voy a clase",
    lessons: [
      {
        key: "12-1",
        title: "Hoy no voy a clase",
        concepts: [
          "El estado físico y anímico; la salud y la enfermedad",
          "Llamadas telefónicas y expresión de órdenes o instrucciones",
          "Estar + adjetivo, tener + nombre, doler e imperativo",
        ],
        guide: `Esta unidad aborda un día distinto: no ir a clase por enfermedad o por otro motivo. Los estudiantes aprenden a describir cómo se sienten, a explicar síntomas y a pedir ayuda por teléfono. Las estructuras estar + adjetivo, tener + nombre y el verbo doler permiten hablar de estados físicos y anímicos con precisión. El imperativo aparece en instrucciones y consejos, desde «descansa» hasta «llama al médico». Es importante practicar un registro adecuado: no se habla igual con un amigo que con un adulto o con un servicio de urgencias. Un juego de roles telefónico permite reunir todo lo aprendido en una situación verosímil.`,
      },
    ],
  },
  {
    key: "13",
    title: "Unidad 13: ¿Qué has hecho hoy?",
    lessons: [
      {
        key: "13-1",
        title: "¿Qué has hecho hoy?",
        concepts: [
          "Dar y pedir información sobre acciones recientes",
          "Valorar acciones realizadas",
          "El pretérito perfecto y ya / aún / todavía no",
        ],
        guide: `La última unidad del bloque mira al pasado inmediato: lo que ya se ha hecho y lo que todavía no. El pretérito perfecto se presenta en relación con marcadores como ya, aún y todavía no, que expresan el grado de avance de una acción. Los estudiantes hablan de tareas, experiencias y logros del día, y aprenden a valorar lo realizado con comentarios breves. La conversación gana naturalidad cuando se pregunta por el resultado y no solo por la acción: ¿has terminado?, ¿qué te ha parecido? Un balance personal del día o de la semana permite cerrar el curso con una producción integradora, sencilla y comunicativa.`,
      },
    ],
  },
];

export const EGYPT_SPANISH_G11_T1_BOOK = {
  subject: "Español — lengua extranjera",
  grade: "Segundo curso de secundaria",
  sourceUrl: EGYPT_SPANISH_G11_T1_SOURCE,
};

export function isSpanishG11TreeConsistent() {
  return checkG11Tree("Español — segundo curso de secundaria", EGYPT_SPANISH_G11_T1_UNITS);
}

export function spanishG11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_SPANISH_G11_T1_BOOK, EGYPT_SPANISH_G11_T1_UNITS, unitIndex, lessonIndex);
}
