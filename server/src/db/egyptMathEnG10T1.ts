// Secondary 1 (Grade 10, الصف الأول الثانوي) Mathematics, English-medium
// (Mathematics — First form secondary — First term).
//
// Reserved id (header only — this module wires nothing): curriculum
// `eg-g10-math-en`, subject `math-en` (name "Mathematics", nameAr
// "الرياضيات"), lesson prefix `l-g10-math-en-`.
//
// The curriculum tree is rebuilt from the Ministry textbook (123 scanned
// pages, no text layer, OCR'd page by page). This module is the single source
// of truth for its structure: the four printed units of the first term, their
// seventeen printed lessons, and, for every lesson, the book's own printed
// heads — the lesson head, the «You will Learn» objectives and the
// activity-flow heads the lesson prints (Think and discuss, Learn, Example,
// Try to solve, Notice that, Definition, Postulate, Theorem, Corollary, Fact,
// Remember, Group work, Oral exercise, Check your understanding, Exercises, …)
// — verbatim and with the printed page each starts on. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS +4 — book page N = scan page N + 4 (verified: the 1-1 opener
// book 4 = pages-008; the term's last page book 119 = pages-123).
//
// The English book paginates like the Arabic one (same lesson starts); this
// table follows the English pages themselves. Where the translation moved,
// dropped or added a head — the unit lists say «Quadratic Inequalities», the
// lesson prints «Quadratic Inequalities in one variable»; the contents say
// «Related Angles» and so does the page; book 40's ribbon «theorem 1» was not
// readable in the scan, so the box title the OCR did read («sss Similarity
// theorem (Proof is not required)») is recorded instead, and the margin
// callout «Add to your knowledge» of book 40 (visible on the image, absent
// from the OCR) is not recorded — the page wins.
//
// The OCR renders this book's formulas in LaTeX («\theta», «\alpha»,
// «^{\circ}», «\left»). `normalize` below maps those back to the printed
// symbols (θ, α, β, °, ±) and drops layout-only commands before matching, so a
// head like «Relation between trigonometric functions of angles θ, 180° ± θ»
// still proves itself against the scan. A handful of heads the two-column
// layout interleaved line by line are listed in `SPLIT_OCR_HEADS` and proved
// through their own OCR fragments instead.
//
// The book prints no running head — only the folio, at the foot of the page:
// bare («27»), glued to the start of the footer («27 Mathematics - First form
// secondary») or to its end («Student book - First term 27»), alternating
// between the two footer texts. The eight unnumbered unit-intro pages (books
// 2, 3, 30, 31, 60, 61, 80, 81) carry no folio and are anchored instead.
//
// A lesson's range runs from the unit's first page (for its first lesson —
// the intro spread rides with it) or its own head page, down to the page
// before the next lesson starts, bounded by the unit — so every «Exercises»
// closing page stays inside the lesson it closes.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.4 = scan p.8). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Unit 1 intro page (scan 6). */
export const EGYPT_MATH_EN_G10_T1_BOOK_START = 2;

/** Last printed page of the term — lesson 4-6's last exercises page (scan 123). */
export const EGYPT_MATH_EN_G10_T1_BOOK_END = 119;

/** The scanned pages before the term: cover, credits, INTRODUCTION, Contents. */
export const EGYPT_MATH_EN_G10_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: none — the term ends on the last scan. */
export const EGYPT_MATH_EN_G10_T1_BACK_MATTER = { from: 124, to: 123 } as const;

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathEnG10T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Lesson», «You will Learn» or «Activity». */
  kind: string;
  /** The printed head, verbatim. */
  title: string;
}

/** One printed lesson (one numbered lesson of a unit). */
export interface MathEnG10T1Lesson {
  /** App-addressable key, e.g. "4-3" (unit 4, lesson 3). */
  key: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: MathEnG10T1Concept[];
}

/** One printed unit of the book — one of the four units of the first term. */
export interface MathEnG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"4", in book order. */
  key: string;
  /** Section title as printed on the unit intro page and in the Contents. */
  title: string;
  /** The section's title as the book prints it (same string, kept for parity). */
  footerTitle: string;
  /** First printed page of the section (its unnumbered intro spread). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next intro spread). */
  bookTo: number;
  lessons: MathEnG10T1Lesson[];
}

const HEAD = "Lesson";
const LEARN = "You will Learn";
const ACT = "Activity";

function concept(bookFrom: number, kind: string, title: string): MathEnG10T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The four units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit starts are the unnumbered intro spreads (books 2, 30, 60, 80); lesson
 * starts and unit titles come from the book's «Contents» (scans 4–5) and are
 * confirmed by every lesson opener. Where the Contents and the page disagree
 * (1-2, 1-3, 1-5, 2-3, 4-4), the page's own printing is the title. A lesson's
 * range runs from the unit's first page (for its first lesson — the intro
 * spread rides with it) or its own head page, down to the page before the next
 * lesson starts, bounded by the unit — so every «Exercises» closing page stays
 * inside the lesson it closes.
 */
export const EGYPT_MATH_EN_G10_T1_UNITS: MathEnG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Algebra, relations and functions",
    footerTitle: "Algebra, relations and functions",
    bookFrom: 2,
    bookTo: 29,
    lessons: [
      {
        key: "1-1",
        type: HEAD,
        title: "An Introduction in Complex Numbers",
        printedHead: "An Introduction in Complex Numbers",
        bookFrom: 4,
        concepts: [
          concept(4, HEAD, "An Introduction in Complex Numbers"),
          concept(4, LEARN, "Concept of the imaginary number."),
          concept(4, LEARN, "Integer power of i ."),
          concept(4, LEARN, "Concept of the complex number."),
          concept(4, LEARN, "Equality of two complex numbers."),
          concept(4, LEARN, "Operations on the complex numbers."),
          concept(4, ACT, "Think and discuss"),
          concept(4, ACT, "Learn"),
          concept(4, ACT, "Imaginary numbers"),
          concept(5, ACT, "Integer powers of i"),
          concept(5, ACT, "Example"),
          concept(5, ACT, "Try to solve"),
          concept(5, ACT, "Complex number"),
          concept(6, ACT, "Equality of two complex numbers"),
          concept(7, ACT, "Operations on complex numbers"),
          concept(7, ACT, "Conjugate Numbers"),
          concept(9, ACT, "Check your understanding"),
          concept(9, ACT, "Exercises (1 - 1)"),
        ],
      },
      {
        key: "1-2",
        type: HEAD,
        // The Contents print «Determining the Types of the two Roots of a
        // Quadratic Equation»; the lesson's own page prints it without «the
        // two» — the page wins.
        title: "Determining the Types of Roots of a Quadratic Equation",
        printedHead: "Determining the Types of Roots of a Quadratic Equation",
        bookFrom: 10,
        concepts: [
          concept(10, HEAD, "Determining the Types of Roots of a Quadratic Equation"),
          concept(10, LEARN, "How to determine the type of the two roots of the quadratic equation"),
          concept(10, ACT, "Think and discuss"),
          concept(10, ACT, "Learn"),
          concept(10, ACT, "Discriminant"),
          concept(10, ACT, "Example"),
          concept(11, ACT, "Notice that"),
          concept(11, ACT, "Try to solve"),
          concept(12, ACT, "Exercises (1 - 2)"),
        ],
      },
      {
        key: "1-3",
        type: HEAD,
        // The Contents print «The Relation Between…»; the page drops the «The».
        title: "Relation Between the Two Roots of the Second Degree Equation and the Coefficients of its Terms",
        printedHead: "Relation Between the Two Roots of the Second Degree Equation and the Coefficients of its Terms",
        bookFrom: 14,
        concepts: [
          concept(14, HEAD, "Relation Between the Two Roots of the Second Degree Equation and the Coefficients of its Terms"),
          concept(14, LEARN, "How to find the sum of the two roots of a given quadratic equation."),
          concept(14, LEARN, "How to find the product of the two roots."),
          concept(14, LEARN, "Finding a quadratic equation in terms of another quadratic equation"),
          concept(14, ACT, "Think and discuss"),
          concept(14, ACT, "Learn"),
          concept(14, ACT, "Sum and product of two roots"),
          concept(14, ACT, "Oral exercise"),
          concept(14, ACT, "Example"),
          concept(15, ACT, "Try to solve"),
          concept(16, ACT, "Forming the quadratic equation whose two roots are known"),
          concept(17, ACT, "Forming a quadratic equation from the roots of another equation"),
          concept(17, ACT, "Notice that"),
          concept(17, ACT, "Check your understanding"),
          concept(18, ACT, "Exercises (1 - 3)"),
        ],
      },
      {
        key: "1-4",
        type: HEAD,
        title: "Sign of a Function",
        printedHead: "Sign of a Function",
        bookFrom: 20,
        concepts: [
          concept(20, HEAD, "Sign of a Function"),
          concept(20, LEARN, "Investigate the sign of: constant function - Linear function - quadratic function."),
          concept(20, ACT, "Think and discuss"),
          concept(20, ACT, "Learn"),
          concept(20, ACT, "First: Sign of the Constant Function"),
          concept(20, ACT, "Example"),
          concept(21, ACT, "Second: Sign of the Linear Function"),
          concept(21, ACT, "Try to solve"),
          concept(22, ACT, "Third: Sign of the Quadratic Function."),
          concept(24, ACT, "Check your understanding"),
          concept(25, ACT, "Exercises (1 - 4)"),
        ],
      },
      {
        key: "1-5",
        type: HEAD,
        // The Contents print «Quadratic Inequalities»; the page prints the
        // full «Quadratic Inequalities in one variable».
        title: "Quadratic Inequalities in one variable",
        printedHead: "Quadratic Inequalities in one variable",
        bookFrom: 27,
        concepts: [
          concept(27, HEAD, "Quadratic Inequalities in one variable"),
          concept(27, LEARN, "Solving the quadratic inequality in one variable."),
          concept(27, ACT, "Think and discuss"),
          concept(27, ACT, "Notice that:"),
          concept(27, ACT, "Learn"),
          concept(27, ACT, "Solving the quadratic inequality in one variable"),
          concept(27, ACT, "Example"),
          concept(28, ACT, "Try to solve"),
          concept(29, ACT, "Exercises (1 - 5)"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Similarity",
    footerTitle: "Similarity",
    bookFrom: 30,
    bookTo: 59,
    lessons: [
      {
        key: "2-1",
        type: HEAD,
        title: "Similarity of Polygons",
        printedHead: "Similarity of Polygons",
        bookFrom: 32,
        concepts: [
          concept(32, HEAD, "Similarity of Polygons"),
          concept(32, LEARN, "Concept of similarity."),
          concept(32, LEARN, "Similarity of polygons"),
          concept(32, LEARN, "The ratio between the perimeters of two similar polygon and the Drawing scale"),
          concept(32, ACT, "Think and discuss"),
          concept(32, ACT, "Similar polygons"),
          concept(32, ACT, "Definition:"),
          concept(32, ACT, "Notice that:"),
          concept(33, ACT, "Example"),
          concept(33, ACT, "Think"),
          concept(34, ACT, "Similarity ratio of two polygons"),
          concept(35, ACT, "Exercises (2 - 1)"),
        ],
      },
      {
        key: "2-2",
        type: HEAD,
        title: "Similarity of Triangles",
        printedHead: "Similarity of Triangles",
        bookFrom: 36,
        concepts: [
          concept(36, HEAD, "Similarity of Triangles"),
          concept(36, LEARN, "Cases of similarity of triangles."),
          concept(36, LEARN, "Properties of the perpendicular drawn from the vertex of the right angle to the hypotenuse of the right angled triangle"),
          concept(36, ACT, "Think and discuss"),
          concept(36, ACT, "Group work"),
          concept(37, ACT, "Postulate"),
          concept(37, ACT, "AA similarity postulate"),
          concept(37, ACT, "Notice that"),
          concept(37, ACT, "Example"),
          concept(38, ACT, "Important corollaries"),
          concept(38, ACT, "corollary 1"),
          concept(38, ACT, "Try to solve"),
          concept(39, ACT, "corollary 2"),
          // Book 40's ribbon prints «theorem 1» but the scan could not read the
          // ribbon; the box title it did read stands for it.
          concept(40, ACT, "sss Similarity theorem (Proof is not required)"),
          concept(42, ACT, "theorem 2"),
          concept(42, ACT, "SAS Similarity theorem (Proof is not required)"),
          concept(43, ACT, "Exercises (2 - 2)"),
        ],
      },
      {
        key: "2-3",
        type: HEAD,
        // The Contents print «The Relation Between the Area of two Similar
        // Polygons»; the page prints the plural «Areas».
        title: "The Relation Between the Areas of two Similar Polygons",
        printedHead: "The Relation Between the Areas of two Similar Polygons",
        bookFrom: 45,
        concepts: [
          concept(45, HEAD, "The Relation Between the Areas of two Similar Polygons"),
          concept(45, LEARN, "The relation between the perimeters of two similar polygons and similarity ratio (scale factor)"),
          concept(45, LEARN, "The relation between areas of two similar polygons and similarity ratio."),
          concept(45, ACT, "Think and discuss"),
          concept(45, ACT, "First: the ratio of Areas of two similar triangles:"),
          concept(45, ACT, "Theorem 3:"),
          concept(46, ACT, "Notice that:"),
          concept(47, ACT, "Example"),
          concept(47, ACT, "Try to solve"),
          concept(48, ACT, "Fact:"),
          concept(48, ACT, "Note:"),
          concept(49, ACT, "theorem 4"),
          concept(49, ACT, "Notice"),
          concept(52, ACT, "Exercises (2 - 3)"),
        ],
      },
      {
        key: "2-4",
        type: HEAD,
        title: "Applications of Similarity in the circle",
        printedHead: "Applications of Similarity in the circle",
        bookFrom: 53,
        concepts: [
          concept(53, HEAD, "Applications of Similarity in the circle"),
          concept(53, LEARN, "The relation between two intersecting chords in a circle."),
          concept(53, LEARN, "The relation between two secants to the circle from a point outside it."),
          concept(53, LEARN, "The relation between the length of a tangent and the lengths of the two parts of a secant to the circle drawn from a point outside it."),
          concept(53, LEARN, "Modeling, solving problems, and life applications using similarity of polygons in a circle."),
          concept(53, ACT, "Think and discuss"),
          concept(53, ACT, "Well known problem"),
          concept(54, ACT, "Example"),
          concept(54, ACT, "Try to solve"),
          concept(55, ACT, "Corollary 1"),
          concept(56, ACT, "Converse of the well known problem"),
          concept(56, ACT, "Notice that:"),
          concept(56, ACT, "Corollary 2"),
          concept(58, ACT, "Exercises (2 - 4)"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "The Triangle Proportionality Theorems",
    footerTitle: "The Triangle Proportionality Theorems",
    bookFrom: 60,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        type: HEAD,
        title: "Parallel Lines and Proportional Parts",
        printedHead: "Parallel Lines and Proportional Parts",
        bookFrom: 62,
        concepts: [
          concept(62, HEAD, "Parallel Lines and Proportional Parts"),
          concept(62, LEARN, "Properties of the straight line which is parallel to any side of a triangle."),
          concept(62, LEARN, "Use proportion in calculation of lengths and in prove relations to line segments resulting from the transversals of parallel lines."),
          concept(62, LEARN, "Modelling and solving life problems including parallel lines and their transversals"),
          concept(62, ACT, "Think and discuss"),
          concept(62, ACT, "Theorem 1"),
          concept(63, ACT, "Notice that:"),
          concept(63, ACT, "Example"),
          concept(63, ACT, "Try to solve"),
          concept(64, ACT, "Corollary"),
          concept(65, ACT, "Converse of theorem 1"),
          concept(65, ACT, "Logical thinking:"),
          concept(67, ACT, "Modeling"),
          concept(68, ACT, "Talis' Theorem"),
          concept(68, ACT, "theorem 2"),
          concept(69, ACT, "Special cases"),
          concept(69, ACT, "Talis's Special theorem"),
          concept(70, ACT, "Exercises (3 - 1)"),
        ],
      },
      {
        key: "3-2",
        type: HEAD,
        title: "Angle Bisectors and Proportional Parts",
        printedHead: "Angle Bisectors and Proportional Parts",
        bookFrom: 72,
        concepts: [
          concept(72, HEAD, "Angle Bisectors and Proportional Parts"),
          concept(72, LEARN, "Properties of bisectors of angles of triangles ."),
          concept(72, LEARN, "Use proportion to calculate the lengths of line segments resulting from bisecting an angle in a triangle."),
          concept(72, LEARN, "Modelling and solving life problems including bisectors of angles of triangle"),
          concept(72, ACT, "Group work"),
          concept(72, ACT, "Bisector of an Angle of a Triangle"),
          concept(72, ACT, "theorem 3"),
          concept(73, ACT, "Example"),
          concept(73, ACT, "Try to solve"),
          concept(74, ACT, "Important note"),
          concept(75, ACT, "Finding the length of the interior and the exterior bisectors of an angle of a triangle"),
          concept(75, ACT, "well known problem"),
          concept(75, ACT, "Remember"),
          concept(76, ACT, "Notice that:"),
          concept(77, ACT, "Special cases"),
          concept(77, ACT, "Fact:"),
          concept(78, ACT, "Exercises (3 - 2)"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Trigonometry",
    footerTitle: "Trigonometry",
    bookFrom: 80,
    bookTo: 119,
    lessons: [
      {
        key: "4-1",
        type: HEAD,
        title: "Directed Angle",
        printedHead: "Directed Angle",
        bookFrom: 82,
        concepts: [
          concept(82, HEAD, "Directed Angle"),
          concept(82, LEARN, "Concept of directed angle."),
          concept(82, LEARN, "Standard position of directed angle."),
          concept(82, LEARN, "Positive and negative measure of the directed angle."),
          concept(82, LEARN, "Position of the directed angle in the coordinates plane."),
          concept(82, LEARN, "Concept of the equivalent angles."),
          concept(82, ACT, "Think and discuss"),
          concept(82, ACT, "Degree Measure System"),
          concept(82, ACT, "Learn"),
          concept(82, ACT, "Directed Angle"),
          concept(83, ACT, "Definition"),
          concept(83, ACT, "Standard position of the directed angle"),
          concept(83, ACT, "Oral exercises"),
          concept(83, ACT, "Try to solve"),
          concept(84, ACT, "Positive and negative measures of a directed angle"),
          concept(84, ACT, "Example"),
          concept(84, ACT, "Angle's position in the orthogonal coordinate plane:"),
          concept(85, ACT, "Note:"),
          concept(86, ACT, "Add to your knowledge"),
          concept(86, ACT, "Equivalent angles"),
          concept(87, ACT, "Check your understanding"),
          concept(88, ACT, "Exercises (4 - 1)"),
        ],
      },
      {
        key: "4-2",
        type: HEAD,
        // The Contents print «Systems of Measuring Angle. (degree - radian)»;
        // the page prints it without the parenthetical.
        title: "Systems of Measuring Angle",
        printedHead: "Systems of Measuring Angle",
        bookFrom: 90,
        concepts: [
          concept(90, HEAD, "Systems of Measuring Angle"),
          concept(90, LEARN, "Concept of radian measure of an angle."),
          concept(90, LEARN, "Relation between radian and degree measure."),
          concept(90, LEARN, "How to find the length of an arc in a circle."),
          concept(90, ACT, "Think and discuss"),
          concept(90, ACT, "Radian Measure"),
          concept(90, ACT, "Group work"),
          concept(90, ACT, "Definition"),
          concept(91, ACT, "Example"),
          concept(91, ACT, "Try to solve"),
          concept(91, ACT, "Relation between degree measure and radian measure:"),
          concept(92, ACT, "Add to your knowledge"),
          concept(93, ACT, "Exercises (4 - 2)"),
        ],
      },
      {
        key: "4-3",
        type: HEAD,
        title: "Trigonometric Functions",
        printedHead: "Trigonometric Functions",
        bookFrom: 95,
        concepts: [
          concept(95, HEAD, "Trigonometric Functions"),
          concept(95, LEARN, "Basic trigonometric functions"),
          concept(95, LEARN, "Reciprocals of basic trigonometric functions."),
          concept(95, LEARN, "Signs of the trigonometric functions."),
          concept(95, LEARN, "Trigonometric functions of some special angles."),
          concept(95, ACT, "Think and discuss"),
          concept(95, ACT, "Notice that:"),
          concept(96, ACT, "The unit circle"),
          concept(96, ACT, "The basic trigonometric functions of an angle"),
          concept(96, ACT, "Reciprocals of the basic trigonometric functions"),
          concept(97, ACT, "Signs of the Trigonometric Functions"),
          concept(97, ACT, "Example"),
          concept(98, ACT, "Try to solve"),
          concept(99, ACT, "Trigonometric ratios of some special angles"),
          concept(100, ACT, "Check your understanding"),
          concept(101, ACT, "Exercises (4 - 3)"),
        ],
      },
      {
        key: "4-4",
        type: HEAD,
        // The unit list says «Relations between Trigonometric Functions»; the
        // Contents and the lesson's own page print «Related Angles».
        title: "Related Angles",
        printedHead: "Related Angles",
        bookFrom: 103,
        concepts: [
          concept(103, HEAD, "Related Angles"),
          concept(103, LEARN, "Relation between trigonometric functions of angles θ, 180° ± θ"),
          concept(103, LEARN, "Relation between trigonometric functions of angles θ, 360° - θ"),
          concept(103, LEARN, "Relation between trigonometric functions of angles θ, 90° ± θ"),
          concept(103, LEARN, "Relation between trigonometric functions of angles θ, 270° ± θ"),
          concept(103, LEARN, "The general solution of trigonometric equations in the form:"),
          concept(103, LEARN, "sin α = cos β"),
          concept(103, LEARN, "sec α = csc β"),
          concept(103, LEARN, "tan α = cot β"),
          concept(103, ACT, "Think and discuss"),
          concept(103, ACT, "1- Trigonometric functions of two supplementary angles θ, (180° - θ)"),
          concept(103, ACT, "Try to solve"),
          concept(103, ACT, "Notice that:"),
          concept(103, ACT, "Definition"),
          concept(104, ACT, "2- Trigonometric functions of angles of measures θ, (180° + θ)"),
          concept(104, ACT, "3- Trigonometric functions of angles of measures θ, (360° - θ)"),
          concept(105, ACT, "Example"),
          concept(105, ACT, "4- Trigonometric functions of two complementary angles θ and (90° - θ)"),
          concept(106, ACT, "5- trigonometric functions of angles of measures θ and (90° + θ)"),
          concept(107, ACT, "6- Trigonometric functions of angles of measures θ and (270° - θ)"),
          concept(107, ACT, "7- Trigonometric functions of angles of measures θ and (270° + θ)"),
          concept(108, ACT, "General solution of trigonometric equations in the form [sin(α) = cos(β), sec(α) = csc(β), tan(α) = cot(β)]"),
          concept(108, ACT, "Learn"),
          concept(109, ACT, "Check your understanding"),
          concept(110, ACT, "Exercises (4 - 4)"),
        ],
      },
      {
        key: "4-5",
        type: HEAD,
        title: "Graphing Trigonometric Functions",
        printedHead: "Graphing Trigonometric Functions",
        bookFrom: 112,
        concepts: [
          concept(112, HEAD, "Graphing Trigonometric Functions"),
          concept(112, LEARN, "Graph the sine function , and deduce its properties."),
          concept(112, LEARN, "Graph the cosine function, and deduce its properties."),
          concept(112, ACT, "Think and discuss"),
          concept(112, ACT, "Graphical representation of the sine function"),
          concept(112, ACT, "Group work"),
          concept(113, ACT, "Learn"),
          concept(113, ACT, "Properties of the sine function"),
          concept(113, ACT, "Graphical representation of the cosine function"),
          concept(113, ACT, "Properties of the cosine function"),
          concept(114, ACT, "Example"),
          concept(114, ACT, "Try to solve"),
          concept(114, ACT, "Check your understanding"),
          concept(115, ACT, "Exercises (4-5)"),
        ],
      },
      {
        key: "4-6",
        type: HEAD,
        title: "Finding the Measure of an Angle Given the Value of One of its Trigonometric Ratios",
        printedHead: "Finding the Measure of an Angle Given the Value of One of its Trigonometric Ratios",
        bookFrom: 116,
        concepts: [
          concept(116, HEAD, "Finding the Measure of an Angle Given the Value of One of its Trigonometric Ratios"),
          concept(116, LEARN, "Find the measure of an angle given a trigonometric function."),
          concept(116, ACT, "Think and discuss"),
          concept(116, ACT, "Learn"),
          concept(116, ACT, "Example"),
          concept(117, ACT, "Try to solve"),
          concept(117, ACT, "Check your understanding"),
          concept(118, ACT, "Exercises (4 - 6)"),
        ],
      },
    ],
  },
];

/**
 * The first page of a lesson: the unit's first page for a unit's first lesson
 * (the intro spread rides with it), the lesson's own head page otherwise; the
 * last page is the page before the next lesson starts, bounded by the unit.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_EN_G10_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_EN_G10_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a unit. Kept as a function
 * so the seeder and the stage share one shape across all the books.
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
  "math-en-g10-t1",
);

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** One page of a lesson's document, with a stable printed-page marker. */
function pageBlock(book: number, text: string): string {
  return `### صفحة ${book}\n${text}`;
}

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
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
 * Strips everything but letters and digits, so OCR spacing cannot break a
 * match — after mapping this book's LaTeX formula tokens back to the symbols
 * the page actually prints (\theta → θ, ^{\circ} → °, …) and dropping the
 * layout-only commands that stand for no printed word (\left, \frac, \text…).
 */
function normalize(text: string): string {
  return text
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\circ/g, "°")
    .replace(/\\pm/g, "±")
    .replace(/\\bullet/g, "•")
    .replace(
      /\\(?:left|right|frac|dfrac|tfrac|text|mathrm|mathbb|mathbf|mathit|vec|overline|underline|widehat|hat|bar|sqrt|quad|qquad|displaystyle|begin|end|ldots|cdots|dots|vdots|ddots|because|therefore|forall|in|notin|cup|cap|subset|le|leq|ge|geq|ne|neq|to|rightarrow|leftarrow|mapsto|times|cdot|div|ast|angle|triangle|sim|simeq|cong|equiv|infty)/g,
      "",
    )
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).toLowerCase().includes(normalize(needle).toLowerCase());
}

/**
 * Printed heads whose lines the OCR read in the wrong order (the two-column
 * layout interleaves them, or a line break split a word). Each entry lists the
 * fragments the OCR did read contiguously; the check requires every fragment,
 * in order, so the head is still proven against its own page.
 */
const SPLIT_OCR_HEADS: Readonly<Record<string, readonly string[]>> = {
  "72|Use proportion to calculate the lengths of line segments resulting from bisecting an angle in a triangle.": [
    "Use proportion to calculate",
    "the lengths of line segments",
    "resulting from bisecting an",
    "angle in a triangle.",
  ],
  "72|Modelling and solving life problems including bisectors of angles of triangle": [
    "Modelling and solving life",
    "problems including bisectors of",
    "angles of triangle",
  ],
  "53|Modeling, solving problems, and life applications using similarity of polygons in a circle.": [
    "Modeling, solving problems,",
    "and life applications using",
    "arity of polygons in a circle.",
  ],
};

/** Whether `page` prints `title` as printed or through its OCR fragments. */
function printsHead(page: number, title: string): boolean {
  if (pagePrints(page, title)) return true;
  const fragments = SPLIT_OCR_HEADS[`${page}|${title}`];
  if (!fragments) return false;
  return fragments.every((fragment) => pagePrints(page, fragment));
}

/**
 * Page-number candidates a content page prints. This book carries no running
 * head — only the folio, at the foot of the page: bare («27»), glued to the
 * start of either footer line («27 Mathematics - First form secondary») or to
 * its end («Student book - First term 27»). We therefore take every number on
 * a footer-worded line plus every bare-number line. Exercise numbers and
 * figure labels also match the bare shape, which is harmless: `printedFooter`
 * below only asks whether the page's OWN number is among them.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    if (/student|mathematics|first|form|secondary|term/i.test(line)) {
      for (const m of line.matchAll(/\d{1,3}/g)) candidates.add(Number(m[0]));
      continue;
    }
    const alone = line.match(/^(\d{1,3})$/);
    if (alone) candidates.add(Number(alone[1]));
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null. Every content page that
 * carries a folio prints its own number among the candidates, which is what
 * fixes the offset; the eight pages named in `FOLIO_LESS_ANCHORS` carry no
 * parseable folio and are handled there instead. A mismatch returns the
 * largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The eight term pages that print no parseable folio — the two unnumbered
 * intro pages of each unit — each with the anchor the check accepts in place
 * of a page number.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  2: "Unit objectives",
  3: "Lesson of the unit",
  30: "Unit objectives",
  31: "Lessons of the Unit",
  60: "Unit objectives",
  61: "Lessons of the Unit",
  80: "Unit objectives",
  81: "Lessons of the unit",
};

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G10_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.footerTitle.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
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
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول نشاط`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: بلا عنوان`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات الأنشطة تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: نشاطه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
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
  if (first && first.bookFrom !== EGYPT_MATH_EN_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_EN_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_EN_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_EN_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio, or, on the eight unnumbered intro pages, from the
 *     anchor named in `FOLIO_LESS_ANCHORS`;
 *  2. every unit intro spread prints the unit title and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title is printed somewhere in the pages it owns, and
 *     every activity's printed head is on its own page;
 *  4. every printed page in [2, 119] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_EN_G10_T1_BOOK_START || book > EGYPT_MATH_EN_G10_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).toLowerCase().includes(normalize(anchor).toLowerCase())) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${anchor}»`);
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

  if (printedPages.size !== EGYPT_MATH_EN_G10_T1_BOOK_END - EGYPT_MATH_EN_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_EN_G10_T1_BOOK_START} و${EGYPT_MATH_EN_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit intro spread prints the unit title, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.title)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.title}»`);
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

  // 3b. every activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!printsHead(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة النشاط ${c.bookFrom} لا تطبع «${c.title}»`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owner = new Map<number, string>();
  for (const { key, from, to } of allLessonRanges()) {
    for (let p = from; p <= to; p++) {
      const prev = owner.get(p);
      if (prev) problems.push(`الصفحة ${p} يملكها درسان: ${prev} و${key}`);
      owner.set(p, key);
    }
  }
  for (let p = EGYPT_MATH_EN_G10_T1_BOOK_START; p <= EGYPT_MATH_EN_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
