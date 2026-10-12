// PHASE 113 — official Egypt Secondary-1 (Grade 10) Integrated Science,
// English edition (`INTEGRATED SCIENCE — FIRST SECONDARY GRADE`), first term,
// Ministry 2026/2027 edition.
//
// The curriculum tree for the Egypt `eg-g10-integrated-science-en` curriculum is
// rebuilt from the Ministry textbook `INTEGRATED SCIENCE - FIRST SECONDARY GRADE`
// (114 born-digital pages). This module is the single source of truth for its
// structure: the two units of the first term, their fourteen printed lessons
// and, for every lesson, the book's own printed heads — the unit
// `Learning Outcomes`/`Included Issues` and each lesson's printed topical and
// `Exercise` heads — verbatim and with the printed page they start on. The
// self-checks at the bottom prove that mapping against the text layer itself,
// page by page.
//
// THE OFFSET IS FIVE — book page = scan page − 5
// Every content page prints its own folio, so `BOOK_TO_PDF_OFFSET` is fixed by
// the text layer itself and quoted here: scan 10 prints `First Secondary Grade
// 5` (book 5), scan 13 prints `UNIT 1 : AQUATIC ECOSYSTEMS 1 8 Integrated
// Sciences` (book 8), scan 94 prints `... 89 ...` (book 89), scan 103 prints
// `... 98 ...` (book 98) and scan 113 prints `... 108 ...` (book 108). The
// book's own `Content` (scan 5) independently confirms it: it lists every lesson
// with the very book page its head prints on (1-1 → 5, 1-2 → 8, 1-3 → 16, …
// 4-2 → 98). Every term page except the unit 2 opener prints a folio, and every
// printed folio is its own number (see `FOLIO_LESS_PAGES`).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–7 are before the term: the cover (1), the contributors masthead
// (2), the `Introduction` (3), the `General Objectives of the Integrated Science
// Curriculum` (4), the printed `Content` (5), the first-term divider (6) and
// one fully blank page (7). Scan page 114 is the back cover. The term runs from
// the unit 1 opener (book 3 = scan 8) to the last `Exercise` (book 108 = scan
// 113): `EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START` / `_END` are exactly those
// two pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 108 − 3 + 1 = 106.
//
// ONE TERM PAGE PRINTS NO FOLIO
// The unit 2 opener (book 67 = scan 72) prints no standalone folio in the text
// layer. Rather than weaken the page-number check, it is exempt from it and
// anchored on its own unit head (`Unit Two: The Atmosphere`). See
// `FOLIO_LESS_PAGES` and step 1 of `assertTreeMatchesTheBook`.
//
// ONE TEXT-LAYER NUMBER INTRUSION (DOCUMENTED, NOT LOOSENED)
// Unit 2 outcome 8 absorbs the next item's number mid-sentence: the layer reads
// `different 9. physical factors` where the printed book reads `different
// physical factors`. The concept carries the layer-verbatim string so the
// strict substring check keeps proving against the actual source text — the
// same measured-value philosophy as `FOOTER_OCR_MISREADS` in the Arabic books.
//
// THE UNIT OPENER AND THE UNIT INTRO RIDE WITH THE UNIT'S FIRST LESSON
// Each unit opens with a one-page opener (the unit title, its `Learning
// Outcomes` and its `Included Issues`) followed by a `Get Ready!`/intro page and
// then the unit's first numbered lesson. Neither the opener nor the intro is a
// lesson, so — as in the other Ministry books — both ride with the unit's first
// lesson, whose range therefore starts at the unit opener.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// This book prints no per-lesson objectives; its only printed objectives are
// the unit's `Learning Outcomes` (and its `Included Issues`) on the opener
// page. Those objective lines are carried, verbatim, as the concepts of the
// unit's first lesson, and every lesson additionally carries its own printed
// topical heads and its closing `Exercise` head. Every concept title below is a
// string the book itself prints on the page its `bookFrom` names; nothing is
// invented.
//
// THE BOOK NUMBERS ITS LESSONS INCONSISTENTLY
// The `Content` writes the unit's lessons as (unit-lesson) — `1 - 1`, `1 - 2`
// … — but the lesson heads themselves mostly print the reverse order
// (`2-1`, `4-1`, `1 - 2`, `3 - 2`), and lessons 3, 8 and 9 differ again
// (`1 - 3`, `1-8`, `1-9`). The app ignores the book's own numbering and keys every
// lesson by its position (unit then lesson: `1-1` … `2-4`), while each lesson's
// `printedHead` keeps the head exactly as the text layer reads it on the page.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 5 (verified: book p.8 = scan p.13). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the term — the unit 1 opener (scan 8). */
export const EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START = 3;

/** Last printed page of the term — the last lesson's `Exercise` (scan 113). */
export const EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END = 108;

/** The scanned pages before the term: cover, masthead, مقدمة, general aims, المحتويات, divider, blank. */
export const EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_FRONT_MATTER = { from: 1, to: 7 } as const;

/** The scanned page after the term: the back cover. */
export const EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BACK_MATTER = { from: 114, to: 114 } as const;

/** One printed component of a lesson — becomes one concept in the app tree. */
export interface IntegratedScienceEnG10T1Concept {
  /** Printed book page where this component starts. */
  bookFrom: number;
  /** The printed component kind: `Learning Outcome`, `Included Issue`, `Component` or `Exercise`. */
  kind: string;
  /** The printed head of this component, verbatim. */
  title: string;
}

/** One lesson of the textbook — becomes one lesson in the app tree. */
export interface IntegratedScienceEnG10T1Lesson {
  /** App-addressable key, e.g. "1-2" (unit 1, lesson 2). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثاني". */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: IntegratedScienceEnG10T1Concept[];
}

/** One printed section of the book — one of the two units of the first term. */
export interface IntegratedScienceEnG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unit One: The Aquatic Ecosystem". */
  title: string;
  /** The unit head the opener page prints, e.g. "AQUATIC ECOSYSTEMS". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IntegratedScienceEnG10T1Lesson[];
}

/**
 * The two units of the first term with their fourteen lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's `Content` (scan 5); the unit openers'
 * `Learning Outcomes` and `Included Issues` are the first lessons' leading concepts,
 * and each lesson's topical and `Exercise` heads follow, all verbatim.
 */
export const EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_UNITS: IntegratedScienceEnG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unit One: The Aquatic Ecosystem",
    printedHead: "AQUATIC ECOSYSTEMS",
    bookFrom: 3,
    bookTo: 66,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "Learning Outcome",
        title: "Hydrosphere on Earth",
        printedHead: "1-1 Hydrosphere on Earth",
        bookFrom: 5,
        concepts: [
          { bookFrom: 3, kind: "Learning Outcome", title: "Identify the hydrosphere and explain its relationships with the other systems on Earth." },
          { bookFrom: 3, kind: "Learning Outcome", title: "Explain the water cycle in nature and how it contributes to environmental changes." },
          {
            bookFrom: 3,
            kind: "Learning Outcome",
            title:
              "Describe the chemical reactions in the aquatic ecosystem and evaluate their effect on water quality and sustainability of marine life.",
          },
          { bookFrom: 3, kind: "Learning Outcome", title: "Interpret the role of transpiration in the water cycle and its importance to ecosystem sustainability." },
          {
            bookFrom: 3,
            kind: "Learning Outcome",
            title:
              "Explain the effect of the physical properties of water - such as specific heat - and the environmental factors, including temperature and pressure, on the distribution of living organisms and sustainability of aquatic ecosystems.",
          },
          { bookFrom: 3, kind: "Learning Outcome", title: "Recognize the biological importance of water and its role in maintaining cellular structure and function." },
          { bookFrom: 3, kind: "Learning Outcome", title: "Assess the biological adaptations of aquatic organisms and their contribution to ecosystem sustainability." },
          { bookFrom: 3, kind: "Included Issue", title: "Water Pollution" },
          { bookFrom: 3, kind: "Included Issue", title: "Climate Change" },
          { bookFrom: 3, kind: "Included Issue", title: "Sustainability of Water Resources" },
          { bookFrom: 3, kind: "Included Issue", title: "Conservation of Biodiversity" },
          { bookFrom: 3, kind: "Included Issue", title: "Water Resources Management" },
          { bookFrom: 3, kind: "Included Issue", title: "Sustainability Challenges in the Context of Population Growth" },
          { bookFrom: 4, kind: "Component", title: "Get Ready!" },
          { bookFrom: 4, kind: "Component", title: "Unit Introduction" },
          { bookFrom: 5, kind: "Component", title: "First: The Hydrosphere" },
          { bookFrom: 5, kind: "Component", title: "Water Cycle in Nature" },
          { bookFrom: 7, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "Component",
        title: "Chemical Properties of Water",
        printedHead: "1-2 Chemical Properties of Water",
        bookFrom: 8,
        concepts: [
          { bookFrom: 8, kind: "Component", title: "Chemical Composition of Water" },
          { bookFrom: 8, kind: "Component", title: "Polarity of Water" },
          { bookFrom: 9, kind: "Component", title: "Water as a Universal Solvent" },
          { bookFrom: 10, kind: "Component", title: "Dissociation of Table Salt (NaCl) in Water" },
          { bookFrom: 10, kind: "Component", title: "Ionic Equilibrium of Water" },
          { bookFrom: 11, kind: "Component", title: "Hydrolysis of Salts" },
          { bookFrom: 11, kind: "Component", title: "Acidic salts" },
          { bookFrom: 11, kind: "Component", title: "Basic salts" },
          { bookFrom: 11, kind: "Component", title: "Neutral Salts" },
          { bookFrom: 12, kind: "Component", title: "pH Value" },
          { bookFrom: 12, kind: "Component", title: "Activity: Measuring pH Values of Various Water Samples" },
          { bookFrom: 13, kind: "Component", title: "Experiment Procedure" },
          { bookFrom: 13, kind: "Component", title: "Measuring pH Value Using Test Strips" },
          { bookFrom: 14, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "Component",
        title: "Physical Properties of Water",
        printedHead: "1-3 Physical Properties of Water",
        bookFrom: 16,
        concepts: [
          { bookFrom: 16, kind: "Component", title: "Density" },
          { bookFrom: 16, kind: "Component", title: "Hydrometer (Liquid Density Meter)" },
          { bookFrom: 17, kind: "Component", title: "Activity: Measuring Density of Different Water Samples" },
          { bookFrom: 18, kind: "Component", title: "Density of Ocean Water" },
          { bookFrom: 18, kind: "Component", title: "Water Pressure" },
          { bookFrom: 18, kind: "Component", title: "Amount of Dissolved Salts" },
          { bookFrom: 18, kind: "Component", title: "Water Temperature" },
          { bookFrom: 19, kind: "Component", title: "Water Density and Temperature in Polar Regions" },
          { bookFrom: 20, kind: "Component", title: "Heat and Temperature" },
          { bookFrom: 21, kind: "Component", title: "Specific Heat (c)" },
          { bookFrom: 23, kind: "Component", title: "Latent Heat of Vaporization" },
          { bookFrom: 23, kind: "Component", title: "Effect of Heat and Temperature on Marine Organisms" },
          { bookFrom: 25, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "Component",
        title: "Properties of Aqueous Solutions",
        printedHead: "1-4 Properties of Aqueous Solutions",
        bookFrom: 28,
        concepts: [
          { bookFrom: 28, kind: "Component", title: "Colligative Properties of Solutions" },
          { bookFrom: 28, kind: "Component", title: "Decrease in the vapor pressure of a liquid" },
          { bookFrom: 29, kind: "Component", title: "Rising in Boiling Point" },
          { bookFrom: 30, kind: "Component", title: "Decrease in the freezing point of water (melting point of ice)" },
          { bookFrom: 30, kind: "Component", title: "Osmosis and Osmotic Pressure" },
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: "Component",
        title: "Biological Importance of Water",
        printedHead: "1-5 Biological Importance of Water",
        bookFrom: 31,
        concepts: [
          { bookFrom: 31, kind: "Component", title: "Water in Living Cells" },
          { bookFrom: 34, kind: "Component", title: "Importance of Water to Living Organisms" },
          { bookFrom: 34, kind: "Component", title: "Water and Metabolism" },
          { bookFrom: 36, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: "Component",
        title: "Biological Adaptations of Living Organisms in Aquatic Environments",
        printedHead: "1-6 Biological Adaptations of Living Organisms in Aquatic Environments",
        bookFrom: 37,
        concepts: [
          { bookFrom: 37, kind: "Component", title: "First: Structural Adaptations:" },
          { bookFrom: 38, kind: "Component", title: "Second: Behavioral Adaptations:" },
          { bookFrom: 38, kind: "Component", title: "Third: Physiological (Functional) Adaptations:" },
          { bookFrom: 39, kind: "Component", title: "Physiological adaptation of freshwater organisms to low osmotic pressure:" },
          { bookFrom: 40, kind: "Component", title: "Physiological adaptation of saltwater organisms to high osmotic pressure" },
          { bookFrom: 41, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: "Component",
        title: "Effect of Atmospheric Air Gases on Aquatic Environments",
        printedHead: "1-7 Effect of Atmospheric Air Gases on Aquatic Environments",
        bookFrom: 43,
        concepts: [
          { bookFrom: 43, kind: "Component", title: "Oxygen and Carbon Dioxide in the Aquatic Environment" },
          { bookFrom: 43, kind: "Component", title: "Sources of Oxygen in the Aquatic Environment" },
          { bookFrom: 43, kind: "Component", title: "Sources of Carbon Dioxide in the Aquatic Environment" },
          { bookFrom: 44, kind: "Component", title: "Solubility of the Two Gases in Water" },
          { bookFrom: 45, kind: "Component", title: "Effect of an Increase in the Percentage of Dissolved Oxygen in Water:" },
          { bookFrom: 46, kind: "Component", title: "Effect of the Increase in CO 2 ratio in Water on Aquatic Organisms" },
          { bookFrom: 46, kind: "Component", title: "Acidification" },
          { bookFrom: 46, kind: "Component", title: "Impairing Respiration" },
          { bookFrom: 46, kind: "Component", title: "Weakening Support Structure" },
          { bookFrom: 47, kind: "Component", title: "Effect of the Decrease in CO 2 ratio in Water on Aquatic Organisms:" },
          { bookFrom: 48, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: "Component",
        title: "Effect of Light and Solar Radiation on Aquatic Environments",
        printedHead: "1-8 Effect of Light and Solar Radiation on Aquatic Environments",
        bookFrom: 50,
        concepts: [
          { bookFrom: 51, kind: "Component", title: "Solar Radiation Through Water:" },
          { bookFrom: 52, kind: "Component", title: "Absorption of Solar Radiation in Water" },
          { bookFrom: 52, kind: "Component", title: "The Role of Solar Radiation in the Distribution of Marine Organisms" },
          { bookFrom: 53, kind: "Component", title: "Effect of Solar Radiation on Water Temperatures:" },
          { bookFrom: 53, kind: "Component", title: "Effect of Changes in the Intensity of Solar Radiation:" },
          { bookFrom: 53, kind: "Component", title: "Effect of Solar Radiation on Ocean Currents:" },
          { bookFrom: 54, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: "Component",
        title: "Effect of Water Pressure on Organisms",
        printedHead: "1-9: Effect of Water Pressure on Organisms",
        bookFrom: 56,
        concepts: [
          { bookFrom: 56, kind: "Component", title: "Pressure at a Point Inside a Static Liquid" },
          { bookFrom: 56, kind: "Component", title: "Water Pressure" },
          { bookFrom: 57, kind: "Component", title: "Effects of Pressure on Biological Adaptations of Marine Organisms" },
          { bookFrom: 57, kind: "Component", title: "First: The Air Bladder (Swim Bladder)" },
          { bookFrom: 58, kind: "Component", title: "Second: Bony and Cartilaginous Skeletons" },
          { bookFrom: 59, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: "Component",
        title: "Ecological Balance and the Human Role in Sustaining Aquatic Life",
        printedHead: "1-10 Ecological Balance and the Human Role in Sustaining Aquatic Life",
        bookFrom: 60,
        concepts: [
          { bookFrom: 60, kind: "Component", title: "How Can Human Activities Affect Aquatic Ecosystems?" },
          { bookFrom: 60, kind: "Component", title: "Importance of Ecological Balance in Aquatic Ecosystems" },
          { bookFrom: 60, kind: "Component", title: "Nutrient Balance" },
          { bookFrom: 60, kind: "Component", title: "Balance Among Living Organisms" },
          { bookFrom: 60, kind: "Component", title: "Energy Flow Through the Food Web" },
          { bookFrom: 61, kind: "Component", title: "Example of Ecological Balance in Aquatic Ecosystems" },
          { bookFrom: 61, kind: "Component", title: "Coral Reefs and the Marine Ecosystem" },
          { bookFrom: 61, kind: "Component", title: "Impact of Human Activities on Aquatic Life" },
          { bookFrom: 61, kind: "Component", title: "Human Role in Maintaining Ecological Balance" },
          { bookFrom: 62, kind: "Component", title: "Conserving Natural Resources" },
          { bookFrom: 63, kind: "Component", title: "Research-Guiding Questions" },
          { bookFrom: 64, kind: "Exercise", title: "Exercise" },
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unit Two: The Atmosphere",
    printedHead: "Unit Two: The Atmosphere",
    bookFrom: 67,
    bookTo: 108,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "Learning Outcome",
        title: "Components and Layers of the Atmosphere",
        printedHead: "2.1 Components and Layers of the Atmosphere",
        bookFrom: 68,
        concepts: [
          { bookFrom: 67, kind: "Learning Outcome", title: "Explain the structure of the atmosphere, identify its main components and its effect on the Earth's surface." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Distinguish between different atmospheric layers and describe the characteristics of each layer." },
          {
            bookFrom: 67,
            kind: "Learning Outcome",
            title: "Analyze the effect of physical factors in the atmosphere, such as: heat, pressure, humidity, solar radiation, and wind speed, on living organisms.",
          },
          { bookFrom: 67, kind: "Learning Outcome", title: "Analyze the impact of changes in the ozone layer on human health and vital organ functions." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Explain the effect of atmospheric pressure variations on living organisms." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Explain strategies of living organisms to adapt to environments with harsh climates." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Compare between types of simple plant tissues in terms of their structure and role in supporting the plant." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Compare between the effects of different 9. physical factors in the atmosphere on climate." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Explain how chemical reactions in the atmosphere affect air quality and climate change." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Explain chemically the formation of acid rain from nitrogen and sulfur oxides and analyze its impact on humans and plants." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Evaluate the role of gaseous pollutants in threatening atmospheric sustainability." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Illustrate how science and technology have helped reduce pollution and protect the atmosphere." },
          { bookFrom: 67, kind: "Learning Outcome", title: "Suggest practical solutions to air pollution and climate change problems based on what has been learned." },
          { bookFrom: 67, kind: "Included Issue", title: "Air pollution." },
          { bookFrom: 67, kind: "Included Issue", title: "Climate change." },
          { bookFrom: 67, kind: "Included Issue", title: "Resource sustainability." },
          { bookFrom: 67, kind: "Included Issue", title: "Biodiversity conservation." },
          { bookFrom: 68, kind: "Component", title: "Atmospheric Dynamics:" },
          { bookFrom: 68, kind: "Component", title: "Components and Layers of the Atmosphere" },
          { bookFrom: 69, kind: "Component", title: "Importance of the Atmosphere:" },
          { bookFrom: 69, kind: "Component", title: "Main Chemical Components of the Atmosphere." },
          { bookFrom: 70, kind: "Component", title: "Layers of the Atmosphere:" },
          { bookFrom: 71, kind: "Component", title: "Tropopause" },
          { bookFrom: 71, kind: "Component", title: "Biodiversity in the Troposphere" },
          { bookFrom: 71, kind: "Component", title: "Stratosphere" },
          { bookFrom: 72, kind: "Component", title: "Ozone Layer" },
          { bookFrom: 72, kind: "Component", title: "Mesosphere" },
          { bookFrom: 72, kind: "Component", title: "Thermosphere" },
          { bookFrom: 72, kind: "Component", title: "Ionosphere" },
          { bookFrom: 73, kind: "Component", title: "Aurora" },
          { bookFrom: 73, kind: "Component", title: "Exosphere" },
          { bookFrom: 74, kind: "Component", title: "Escape Velocity" },
          { bookFrom: 75, kind: "Component", title: "Activity: Model of the Atmospheric Layers" },
          { bookFrom: 76, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "Component",
        title: "Chemical Reactions in the Atmosphere",
        printedHead: "2-2 : Chemical Reactions in the Atmosphere",
        bookFrom: 78,
        concepts: [
          { bookFrom: 78, kind: "Component", title: "Ultraviolet Rays:" },
          { bookFrom: 79, kind: "Component", title: "Ozone Formation:" },
          { bookFrom: 79, kind: "Component", title: "Ozone Layer Depletion:" },
          { bookFrom: 80, kind: "Component", title: "Effects of Ozone Layer Depletion on Human Health:" },
          { bookFrom: 81, kind: "Component", title: "Reducing Ozone Layer Depletion" },
          { bookFrom: 81, kind: "Component", title: "Ozone in the Troposphere" },
          { bookFrom: 82, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "Component",
        title: "Physical factors and their effect on the atmosphere",
        printedHead: "2-3 Physical factors and their effect on the atmosphere",
        bookFrom: 84,
        concepts: [
          { bookFrom: 84, kind: "Component", title: "First: Heat:" },
          { bookFrom: 84, kind: "Component", title: "Measuring Air Temperature:" },
          { bookFrom: 84, kind: "Component", title: "The Relationship Between Temperature Scales:" },
          { bookFrom: 85, kind: "Component", title: "Mechanisms of Heat Transfer:" },
          { bookFrom: 86, kind: "Component", title: "Radiation" },
          { bookFrom: 86, kind: "Component", title: "Adaptation of Living Organisms to Natural Changes in Temperature:" },
          { bookFrom: 86, kind: "Component", title: "Adaptation to Freezing" },
          { bookFrom: 87, kind: "Component", title: "Ice Fish:" },
          { bookFrom: 87, kind: "Component", title: "Adaptation to High Temperatures" },
          { bookFrom: 87, kind: "Component", title: "Desert Lizards" },
          { bookFrom: 88, kind: "Component", title: "Second: Atmospheric Pressure (Air pressure)" },
          { bookFrom: 88, kind: "Component", title: "Standard Atmospheric Pressure:" },
          { bookFrom: 89, kind: "Component", title: "Atmospheric Pressure and Living Organisms:" },
          { bookFrom: 89, kind: "Component", title: "Blood Components" },
          { bookFrom: 90, kind: "Component", title: "Third: Wind" },
          { bookFrom: 91, kind: "Component", title: "Wind Speed:" },
          { bookFrom: 91, kind: "Component", title: "The Role of Plant Tissues in Wind Resistance:" },
          { bookFrom: 91, kind: "Component", title: "Parenchyma Tissue:" },
          { bookFrom: 91, kind: "Component", title: "Collenchyma Tissue:" },
          { bookFrom: 92, kind: "Component", title: "Sclerenchyma Tissue:" },
          { bookFrom: 92, kind: "Component", title: "Fourth: Humidity" },
          { bookFrom: 92, kind: "Component", title: "Effect of Humidity on Humans:" },
          { bookFrom: 93, kind: "Component", title: "Osmoregulation" },
          { bookFrom: 94, kind: "Component", title: "Effect of Humidity on Living Organisms:" },
          { bookFrom: 94, kind: "Component", title: "Measuring the Effect of Physical Factors:" },
          { bookFrom: 95, kind: "Component", title: "Weather Data Analysis:" },
          { bookFrom: 96, kind: "Exercise", title: "Exercise" },
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "Component",
        title: "The Atmosphere and the Role of Science in Its Sustainability",
        printedHead: "2-4:The Atmosphere and the Role of Science in Its Sustainability",
        bookFrom: 98,
        concepts: [
          { bookFrom: 98, kind: "Component", title: "Understanding and Protecting the Atmosphere:" },
          { bookFrom: 98, kind: "Component", title: "Global Warming and Climate Change:" },
          { bookFrom: 99, kind: "Component", title: "Negative Effects of Global Warming:" },
          { bookFrom: 99, kind: "Component", title: "Melting of Ice" },
          { bookFrom: 99, kind: "Component", title: "Some strategies to reduce global warming:" },
          { bookFrom: 100, kind: "Component", title: "Air pollution and its impact on atmospheric sustainability" },
          { bookFrom: 101, kind: "Component", title: "Carbon monoxide" },
          { bookFrom: 101, kind: "Component", title: "Sulfur oxides and nitrogen oxides" },
          { bookFrom: 102, kind: "Component", title: "Formation of acid rain:" },
          { bookFrom: 102, kind: "Component", title: "First: Formation of sulfuric acid" },
          { bookFrom: 102, kind: "Component", title: "Second: Formation of nitric acid" },
          { bookFrom: 102, kind: "Component", title: "Harmful Effects Resulting:" },
          { bookFrom: 103, kind: "Component", title: "The role of science and technology in protection and recovery" },
          { bookFrom: 103, kind: "Component", title: "Monitoring and forecasting" },
          { bookFrom: 104, kind: "Component", title: "Satellites and Remote Sensing" },
          { bookFrom: 104, kind: "Component", title: "Meteorological Monitoring Stations" },
          { bookFrom: 105, kind: "Component", title: "Climate Models" },
          { bookFrom: 105, kind: "Component", title: "The Biological Importance of Forecasting" },
          { bookFrom: 107, kind: "Component", title: "Various scientific activities" },
          { bookFrom: 107, kind: "Component", title: "Developing projects or models for environmental solutions" },
          { bookFrom: 107, kind: "Component", title: "Discussing Real Case Studies" },
          { bookFrom: 107, kind: "Component", title: "Field Visit" },
          { bookFrom: 107, kind: "Component", title: "Integration of Sciences (Technology and Environmental Science)" },
          { bookFrom: 108, kind: "Exercise", title: "Exercise" },
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the unit
 * — so the unit opener and its «مقدمة الوحدة» stay inside the unit they belong to.
 * A lesson's own head page can print only the opening paragraph (lesson 1-8), so
 * the range keys off `bookFrom`, not off the first component.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has no
 * appendix and no back matter that any lesson quotes: every page of the term
 * belongs to a unit. Kept as a function so the seeder and the stage share one
 * shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  return new Map<string, number[]>();
}

// ---------------------------------------------------------------------------
// OCR loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "integrated-science-en-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. Only the front
 * matter (scan 7) is blank; the loader normalises such pages to "" so a future
 * page map cannot mistake a blank for content.
 */
const NO_TEXT = /لا يوجد نص/;

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    const text = readFileSync(file, "utf8").trim();
    return NO_TEXT.test(text) ? "" : text;
  } catch {
    return "";
  }
}

/** One page of a lesson's document, with a stable printed-page marker. */
function pageBlock(book: number, text: string): string {
  return `### صفحة ${book}\n${text}`;
}

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const parts: string[] = [];
  for (let p = from; p <= to; p++) {
    const text = loadBookPage(p);
    if (text) parts.push(pageBlock(p, text));
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: lowercases English and removes every non-letter or
 * digit, so text-layer spacing and punctuation cannot break a match. The born-
 * digital layer misdecodes the right single quotation mark as `�?T` (e.g.
 * `Earth�?Ts` for `Earth's`), which is stripped so possessives still match.
 */
function normalize(text: string): string {
  return text
    .replace(/�\?T/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring text-layer spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints in its running head. Even scans
 * print the folio on the second non-empty line (`First Secondary Grade 5`);
 * odd scans glue it into the first line (`UNIT 1 : AQUATIC ECOSYSTEMS 1 8
 * Integrated Sciences`). Unit 2's heads split the last word (`Integrated S
 * ciences`), which the pattern below accepts explicitly. A line is accepted
 * only when it matches one of those two shapes, and then only the folio beside
 * the grade or `Integrated [S ]ciences` is a candidate.
 */
export function footerCandidates(book: number): number[] {
  const lines = loadBookPage(book)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const first = lines[0] ?? "";
  const second = lines[1] ?? "";
  const grade = /^First Secondary Grade (\d{1,3})$/.exec(second);
  if (grade) return [Number(grade[1])];
  const head = /(\d{1,3})\s+Integrated\s+S\s*ciences$/.exec(first);
  if (head) return [Number(head[1])];
  return [];
}

/**
 * The book number a content page prints in its running head, or null. Every
 * content page that carries a folio prints exactly one number there and it is
 * its own, which is what fixes `BOOK_TO_PDF_OFFSET = 5`; a page whose head
 * carries no folio returns null and must be anchored another way.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The one term page whose printed folio the text layer did not capture: the
 * unit 2 opener (book 67 = scan 72). Rather than weaken the page-number check,
 * it is exempt from it and anchored on its own unit head.
 */
const FOLIO_LESS_PAGES: ReadonlySet<number> = new Set([67]);

/** The running head every non-opener content page of this book prints. */
const RUNNING_FOOT = "Integrated Sciences";

/** The section that owns a term page, or undefined. */
function sectionForPage(book: number): IntegratedScienceEnG10T1Section | undefined {
  return EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_UNITS.find((s) => book >= s.bookFrom && book <= s.bookTo);
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, component pages rise inside their lesson, the sections tile the book
 * with no gaps or overlaps, and the first/last sections hit the book's own bounds.
 * A content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.printedHead.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${unit.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن «${lesson.concepts[0]!.kind}»`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((concept, ci) => {
        if (!concept.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (concept.bookFrom < unit.bookFrom || concept.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${concept.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && concept.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${concept.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const lastConcept = lesson.concepts.at(-1)!;
      if (lastConcept.bookFrom < from || lastConcept.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${lastConcept.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`القسم ${unit.title} يتداخل مع ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.title} و${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the ten OCR-missed pages, from the page's own unit
 *     head (the two openers) or the book's running foot «العلوم المتكاملة»;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page);
 *  4. every printed page in [3, 108] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_UNITS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START || book > EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END) {
      continue;
    }
    printedPages.add(book);
    pagesChecked += 1;

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    if (FOLIO_LESS_PAGES.has(book)) {
      // The folio was lost in the OCR: anchor the page on its unit head (the two
      // openers) or the book's running foot, instead of weakening the page-number
      // check for every page.
      const section = sectionForPage(book);
      const anchored =
        normalize(text).includes(normalize(RUNNING_FOOT)) ||
        (section !== undefined && normalize(text).includes(normalize(section.printedHead)));
      if (!anchored) {
        problems.push(
          `صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع ترويسة الكتاب «${RUNNING_FOOT}» ولا عنوان وحدتها`,
        );
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END - EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START} و${EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first page its
  // head, and every lesson's title is printed somewhere in the pages it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }

      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every concept's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((concept) => {
        if (!pagePrints(concept.bookFrom, concept.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${concept.title}»`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_START; book <= EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(
        `صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`,
      );
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
