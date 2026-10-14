// PHASE 48 — «مسرح الكتاب»: the official textbook pages as the stage a lesson
// is taught on.
//
// PHASE 47 made the Ministry book the tutor's *grounding* (its OCR text is the
// RAG corpus). It is not yet the tutor's *stage*: the student reads a wall of
// text while the book he owns sits closed next to him. This module turns a
// lesson into the exact pages it occupies, so the session can show the real page
// and point at it instead of describing it.
//
// PHASE 74 — every Egypt Grade-6 book, not only maths. Each tree already knows
// its printed page offset and its lesson→page ranges (`conceptBookRange` /
// `lessonBookRange`), so the stage is a small registry over those trees instead
// of a maths-only special case. A book whose pages were never rasterized still
// returns a stage with `hasImages: false`, which the room treats as text-only.
//
// The page images are a derived artifact of the source PDF (see
// server/scripts/render-book.mjs) and are therefore runtime data, not source:
// a deployment without the PDF simply has no stage, and every caller degrades
// to the text-only room rather than failing.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../../config/env.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_AR_OFFSET,
  EGYPT_T1_BOOK_END,
  allConceptRanges as mathArConceptRanges,
  loadBookPage as loadMathArPage,
} from "../../db/egyptT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_EN_OFFSET,
  EGYPT_MATH_EN_T1_BOOK_END,
  allConceptRanges as mathEnConceptRanges,
  loadBookPage as loadMathEnPage,
} from "../../db/egyptMathEnT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_FR_OFFSET,
  EGYPT_MATH_FR_T1_BOOK_END,
  allConceptRanges as mathFrConceptRanges,
  loadBookPage as loadMathFrPage,
} from "../../db/egyptMathFrT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G9_OFFSET,
  EGYPT_MATH_G9_T1_BOOK_END,
  allLessonRanges as mathG9LessonRanges,
  loadBookPage as loadMathG9Page,
} from "../../db/egyptMathG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_G9_OFFSET,
  EGYPT_SCIENCE_G9_T1_BOOK_END,
  allLessonRanges as scienceG9LessonRanges,
  loadBookPage as loadScienceG9Page,
} from "../../db/egyptScienceG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G9_OFFSET,
  EGYPT_ENGLISH_G9_T1_BOOK_END,
  allLessonRanges as englishG9LessonRanges,
  allLessonExtras as englishG9LessonExtras,
  loadBookPage as loadEnglishG9Page,
} from "../../db/egyptEnglishG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G8_OFFSET,
  EGYPT_ENGLISH_G8_T1_BOOK_END,
  allLessonRanges as englishG8LessonRanges,
  allLessonExtras as englishG8LessonExtras,
  loadBookPage as loadEnglishG8Page,
} from "../../db/egyptEnglishG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G10_OFFSET,
  EGYPT_ENGLISH_G10_T1_BOOK_END,
  allLessonRanges as englishG10LessonRanges,
  allLessonExtras as englishG10LessonExtras,
  loadBookPage as loadEnglishG10Page,
} from "../../db/egyptEnglishG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH2_G10_OFFSET,
  EGYPT_ENGLISH2_G10_T1_BOOK_END,
  allLessonRanges as english2G10LessonRanges,
  allLessonExtras as english2G10LessonExtras,
  loadBookPage as loadEnglish2G10Page,
} from "../../db/egyptEnglish2G10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ITALIAN_G10_OFFSET,
  EGYPT_ITALIAN_G10_T1_BOOK_END,
  allLessonRanges as italianG10LessonRanges,
  allLessonExtras as italianG10LessonExtras,
  loadBookPage as loadItalianG10Page,
} from "../../db/egyptItalianG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as GERMAN_G10_OFFSET,
  EGYPT_GERMAN_G10_T1_BOOK_END,
  allLessonRanges as germanG10LessonRanges,
  allLessonExtras as germanG10LessonExtras,
  loadBookPage as loadGermanG10Page,
} from "../../db/egyptGermanG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as SPANISH_G10_OFFSET,
  EGYPT_SPANISH_G10_T1_BOOK_END,
  allLessonRanges as spanishG10LessonRanges,
  allLessonExtras as spanishG10LessonExtras,
  loadBookPage as loadSpanishG10Page,
} from "../../db/egyptSpanishG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as FRENCH_G10_OFFSET,
  EGYPT_FRENCH_G10_T1_BOOK_END,
  allLessonRanges as frenchG10LessonRanges,
  allLessonExtras as frenchG10LessonExtras,
  loadBookPage as loadFrenchG10Page,
} from "../../db/egyptFrenchG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_P1_OFFSET,
  EGYPT_ENGLISH_P1_T1_BOOK_END,
  allLessonRanges as englishP1LessonRanges,
  allLessonExtras as englishP1LessonExtras,
  loadBookPage as loadEnglishP1Page,
} from "../../db/egyptEnglishP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_G8_OFFSET,
  EGYPT_SOCIAL_G8_T1_BOOK_END,
  allLessonRanges as socialG8LessonRanges,
  loadBookPage as loadSocialG8Page,
} from "../../db/egyptSocialG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as AGRICULTURE_G8_OFFSET,
  EGYPT_AGRICULTURE_G8_T1_BOOK_END,
  allLessonRanges as agricultureG8LessonRanges,
  loadBookPage as loadAgricultureG8Page,
} from "../../db/egyptAgricultureG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as INDUSTRY_G8_OFFSET,
  EGYPT_INDUSTRY_G8_T1_BOOK_END,
  allLessonRanges as industryG8LessonRanges,
  loadBookPage as loadIndustryG8Page,
} from "../../db/egyptIndustryG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as LIBRARIES_G8_OFFSET,
  EGYPT_LIBRARIES_G8_T1_BOOK_END,
  allLessonRanges as librariesG8LessonRanges,
  loadBookPage as loadLibrariesG8Page,
} from "../../db/egyptLibrariesG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_G8_OFFSET,
  EGYPT_SCIENCE_G8_T1_BOOK_END,
  allLessonRanges as scienceG8LessonRanges,
  loadBookPage as loadScienceG8Page,
} from "../../db/egyptScienceG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_G8_EN_OFFSET,
  EGYPT_SCIENCE_G8_EN_T1_BOOK_END,
  allLessonRanges as scienceG8EnLessonRanges,
  loadBookPage as loadScienceG8EnPage,
} from "../../db/egyptScienceG8EnT1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_EN_P1_OFFSET,
  EGYPT_SCIENCE_EN_P1_T1_BOOK_END,
  allLessonRanges as scienceEnP1LessonRanges,
  loadBookPage as loadScienceEnP1Page,
} from "../../db/egyptScienceEnP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G8_OFFSET,
  EGYPT_MATH_G8_T1_BOOK_END,
  allLessonRanges as mathG8LessonRanges,
  loadBookPage as loadMathG8Page,
} from "../../db/egyptMathG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G8_EN_OFFSET,
  EGYPT_MATH_G8_EN_T1_BOOK_END,
  allLessonRanges as mathG8EnLessonRanges,
  loadBookPage as loadMathG8EnPage,
} from "../../db/egyptMathG8EnT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G8_FR_OFFSET,
  EGYPT_MATH_G8_FR_T1_BOOK_END,
  allLessonRanges as mathG8FrLessonRanges,
  loadBookPage as loadMathG8FrPage,
} from "../../db/egyptMathG8FrT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_P1_OFFSET,
  EGYPT_MATH_P1_T1_BOOK_END,
  allLessonRanges as mathP1LessonRanges,
  loadBookPage as loadMathP1Page,
} from "../../db/egyptMathP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_EN_P1_OFFSET,
  EGYPT_MATH_EN_P1_T1_BOOK_END,
  allLessonRanges as mathEnP1LessonRanges,
  loadBookPage as loadMathEnP1Page,
} from "../../db/egyptMathEnP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_P1_OFFSET,
  EGYPT_SCIENCE_P1_T1_BOOK_END,
  allLessonRanges as scienceP1LessonRanges,
  loadBookPage as loadScienceP1Page,
} from "../../db/egyptScienceP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_FR_P1_OFFSET,
  EGYPT_SCIENCE_FR_P1_T1_BOOK_END,
  allLessonRanges as scienceFrP1LessonRanges,
  loadBookPage as loadScienceFrP1Page,
} from "../../db/egyptScienceFrP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_P1_OFFSET,
  EGYPT_SOCIAL_P1_T1_BOOK_END,
  allLessonRanges as socialP1LessonRanges,
  loadBookPage as loadSocialP1Page,
} from "../../db/egyptSocialP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G9_OFFSET,
  EGYPT_ARABIC_G9_T1_BOOK_END,
  allLessonRanges as arabicG9LessonRanges,
  allLessonExtras as arabicG9LessonExtras,
  loadBookPage as loadArabicG9Page,
} from "../../db/egyptArabicG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_STORY_G10_OFFSET,
  EGYPT_ARABIC_STORY_G10_T1_BOOK_END,
  allLessonRanges as arabicStoryG10LessonRanges,
  allLessonExtras as arabicStoryG10LessonExtras,
  loadBookPage as loadArabicStoryG10Page,
} from "../../db/egyptArabicStoryG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as INTEGRATED_SCIENCE_G10_OFFSET,
  EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END,
  allLessonRanges as integratedScienceG10LessonRanges,
  allLessonExtras as integratedScienceG10LessonExtras,
  loadBookPage as loadIntegratedScienceG10Page,
} from "../../db/egyptIntegratedScienceG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as PHILOSOPHY_G10_OFFSET,
  bookToPdfPage as philosophyG10BookToPdfPage,
  EGYPT_PHILOSOPHY_G10_T1_BOOK_END,
  allLessonRanges as philosophyG10LessonRanges,
  allLessonExtras as philosophyG10LessonExtras,
  loadBookPage as loadPhilosophyG10Page,
} from "../../db/egyptPhilosophyG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as NAHW_G10_OFFSET,
  EGYPT_NAHW_G10_T1_BOOK_END,
  allLessonRanges as nahwG10LessonRanges,
  allLessonExtras as nahwG10LessonExtras,
  loadBookPage as loadNahwG10Page,
} from "../../db/egyptNahwG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G10_OFFSET,
  EGYPT_ARABIC_G10_T1_BOOK_END,
  allLessonRanges as arabicG10LessonRanges,
  allLessonExtras as arabicG10LessonExtras,
  loadBookPage as loadArabicG10Page,
} from "../../db/egyptArabicG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_G10_EN_OFFSET,
  EGYPT_ICT_G10_EN_T1_BOOK_END,
  allLessonRanges as ictG10EnLessonRanges,
  loadBookPage as loadIctG10EnPage,
} from "../../db/egyptIctG10EnT1.js";
import {
  BOOK_TO_PDF_OFFSET as FRENCH2_G10_OFFSET,
  EGYPT_FRENCH2_G10_T1_BOOK_END,
  allLessonRanges as french2G10LessonRanges,
  allLessonExtras as french2G10LessonExtras,
  loadBookPage as loadFrench2G10Page,
} from "../../db/egyptFrench2G10T1.js";
import {
  BOOK_TO_PDF_OFFSET as INTEGRATED_SCIENCE_EN_G10_OFFSET,
  EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END,
  allLessonRanges as integratedScienceEnG10LessonRanges,
  allLessonExtras as integratedScienceEnG10LessonExtras,
  loadBookPage as loadIntegratedScienceEnG10Page,
} from "../../db/egyptIntegratedScienceEnG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G1_OFFSET,
  EGYPT_ENGLISH_G1_T1_BOOK_END,
  allLessonRanges as englishG1LessonRanges,
  allLessonExtras as englishG1LessonExtras,
  loadBookPage as loadEnglishG1Page,
} from "../../db/egyptEnglishG1T1.js";
import {
  BOOK_TO_PDF_OFFSET as FRENCH_STORY_G10_OFFSET,
  EGYPT_FRENCH_STORY_G10_T1_BOOK_END,
  allLessonRanges as frenchStoryG10LessonRanges,
  allLessonExtras as frenchStoryG10LessonExtras,
  loadBookPage as loadFrenchStoryG10Page,
} from "../../db/egyptFrenchStoryG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as DISCOVERY_G1_OFFSET,
  EGYPT_DISCOVERY_G1_T1_BOOK_END,
  allLessonRanges as discoveryG1LessonRanges,
  allLessonExtras as discoveryG1LessonExtras,
  loadBookPage as loadDiscoveryG1Page,
} from "../../db/egyptDiscoveryG1T1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_G10_OFFSET,
  EGYPT_ISLAMIC_G10_T1_BOOK_END,
  allLessonRanges as islamicG10LessonRanges,
  allLessonExtras as islamicG10LessonExtras,
  loadBookPage as loadIslamicG10Page,
} from "../../db/egyptIslamicG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G1_OFFSET,
  EGYPT_MATH_G1_T1_BOOK_END,
  allLessonRanges as mathG1LessonRanges,
  allLessonExtras as mathG1LessonExtras,
  loadBookPage as loadMathG1Page,
} from "../../db/egyptMathG1T1.js";
import {
  BOOK_TO_PDF_OFFSET as INTEGRATED_SCIENCE_FR_G10_OFFSET,
  EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END,
  allLessonRanges as integratedScienceFrG10LessonRanges,
  allLessonExtras as integratedScienceFrG10LessonExtras,
  loadBookPage as loadIntegratedScienceFrG10Page,
} from "../../db/egyptIntegratedScienceFrG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_EN_G1_OFFSET,
  EGYPT_MATH_EN_G1_T1_BOOK_END,
  allLessonRanges as mathEnG1LessonRanges,
  allLessonExtras as mathEnG1LessonExtras,
  loadBookPage as loadMathEnG1Page,
} from "../../db/egyptMathEnG1T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_FR_G10_OFFSET,
  EGYPT_MATH_FR_G10_T1_BOOK_END,
  allLessonRanges as mathFrG10LessonRanges,
  allLessonExtras as mathFrG10LessonExtras,
  loadBookPage as loadMathFrG10Page,
} from "../../db/egyptMathFrG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_FR_G1_OFFSET,
  EGYPT_MATH_FR_G1_T1_BOOK_END,
  allLessonRanges as mathFrG1LessonRanges,
  allLessonExtras as mathFrG1LessonExtras,
  loadBookPage as loadMathFrG1Page,
} from "../../db/egyptMathFrG1T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G10_OFFSET,
  EGYPT_MATH_G10_T1_BOOK_END,
  allLessonRanges as mathG10LessonRanges,
  allLessonExtras as mathG10LessonExtras,
  loadBookPage as loadMathG10Page,
} from "../../db/egyptMathG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G10_OFFSET,
  EGYPT_CHRISTIAN_G10_T1_BOOK_END,
  allLessonRanges as christianG10LessonRanges,
  allLessonExtras as christianG10LessonExtras,
  loadBookPage as loadChristianG10Page,
} from "../../db/egyptChristianG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as HISTORY_G10_OFFSET,
  EGYPT_HISTORY_G10_T1_BOOK_END,
  allLessonRanges as historyG10LessonRanges,
  allLessonExtras as historyG10LessonExtras,
  loadBookPage as loadHistoryG10Page,
} from "../../db/egyptHistoryG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_AR_G10_OFFSET,
  EGYPT_ICT_G10_AR_T1_BOOK_END,
  allLessonRanges as ictArG10LessonRanges,
  loadBookPage as loadIctArG10Page,
} from "../../db/egyptIctArG10T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G2_OFFSET,
  EGYPT_ENGLISH_G2_T1_BOOK_END,
  allLessonRanges as englishG2LessonRanges,
  allLessonExtras as englishG2LessonExtras,
  loadBookPage as loadEnglishG2Page,
} from "../../db/egyptEnglishG2T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G1_OFFSET,
  EGYPT_ARABIC_G1_T1_BOOK_END,
  allLessonRanges as arabicG1LessonRanges,
  allLessonExtras as arabicG1LessonExtras,
  loadBookPage as loadArabicG1Page,
} from "../../db/egyptArabicG1T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G2_OFFSET,
  EGYPT_CHRISTIAN_G2_T1_BOOK_END,
  allLessonRanges as christianG2LessonRanges,
  allLessonExtras as christianG2LessonExtras,
  loadBookPage as loadChristianG2Page,
} from "../../db/egyptChristianG2T1.js";
import {
  BOOK_TO_PDF_OFFSET as DISCOVERY_EN_KG1_OFFSET,
  EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END,
  allLessonRanges as discoveryEnKg1LessonRanges,
  allLessonExtras as discoveryEnKg1LessonExtras,
  loadBookPage as loadDiscoveryEnKg1Page,
} from "../../db/egyptDiscoveryEnKg1T1.js";
import {
  BOOK_TO_PDF_OFFSET as DISCOVERY_FR_KG2_OFFSET,
  EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END,
  allLessonRanges as discoveryFrKg2LessonRanges,
  allLessonExtras as discoveryFrKg2LessonExtras,
  loadBookPage as loadDiscoveryFrKg2Page,
} from "../../db/egyptDiscoveryFrKg2T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G8_OFFSET,
  EGYPT_ARABIC_G8_T1_BOOK_END,
  allLessonRanges as arabicG8LessonRanges,
  allLessonExtras as arabicG8LessonExtras,
  loadBookPage as loadArabicG8Page,
} from "../../db/egyptArabicG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G2_OFFSET,
  EGYPT_ARABIC_G2_T1_BOOK_END,
  allLessonRanges as arabicG2LessonRanges,
  allLessonExtras as arabicG2LessonExtras,
  loadBookPage as loadArabicG2Page,
} from "../../db/egyptArabicG2T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G3_OFFSET,
  EGYPT_ARABIC_G3_T1_BOOK_END,
  allLessonRanges as arabicG3LessonRanges,
  allLessonExtras as arabicG3LessonExtras,
  loadBookPage as loadArabicG3Page,
} from "../../db/egyptArabicG3T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G3_OFFSET,
  EGYPT_ENGLISH_G3_T1_BOOK_END,
  allLessonRanges as englishG3LessonRanges,
  allLessonExtras as englishG3LessonExtras,
  loadBookPage as loadEnglishG3Page,
} from "../../db/egyptEnglishG3T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G3_OFFSET,
  EGYPT_CHRISTIAN_G3_T1_BOOK_END,
  allLessonRanges as christianG3LessonRanges,
  allLessonExtras as christianG3LessonExtras,
  loadBookPage as loadChristianG3Page,
} from "../../db/egyptChristianG3T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G4_OFFSET,
  EGYPT_ENGLISH_G4_T1_BOOK_END,
  allLessonRanges as englishG4LessonRanges,
  allLessonExtras as englishG4LessonExtras,
  loadBookPage as loadEnglishG4Page,
} from "../../db/egyptEnglishG4T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_EN_G3_OFFSET,
  EGYPT_MATH_EN_G3_T1_BOOK_END,
  allLessonRanges as mathEnG3LessonRanges,
  allLessonExtras as mathEnG3LessonExtras,
  loadBookPage as loadMathEnG3Page,
} from "../../db/egyptMathEnG3T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G4_OFFSET,
  EGYPT_CHRISTIAN_G4_T1_BOOK_END,
  allLessonRanges as christianG4LessonRanges,
  allLessonExtras as christianG4LessonExtras,
  loadBookPage as loadChristianG4Page,
} from "../../db/egyptChristianG4T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G7_OFFSET,
  EGYPT_ARABIC_P1_T1_BOOK_END,
  allLessonRanges as arabicP1LessonRanges,
  allLessonExtras as arabicP1LessonExtras,
  loadBookPage as loadArabicP1Page,
} from "../../db/egyptArabicP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_OFFSET,
  EGYPT_SCIENCE_T1_BOOK_END,
  allConceptRanges as scienceConceptRanges,
  loadBookPage as loadSciencePage,
} from "../../db/egyptScienceT1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_OFFSET,
  EGYPT_SOCIAL_T1_BOOK_END,
  allLessonRanges as socialLessonRanges,
  loadBookPage as loadSocialPage,
} from "../../db/egyptSocialT1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_OFFSET,
  EGYPT_ARABIC_T1_BOOK_END,
  allLessonExtras as arabicLessonExtras,
  allLessonRanges as arabicLessonRanges,
  loadBookPage as loadArabicPage,
} from "../../db/egyptArabicT1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_OFFSET,
  EGYPT_ISLAMIC_T1_BOOK_END,
  allLessonRanges as islamicLessonRanges,
  loadBookPage as loadIslamicPage,
} from "../../db/egyptIslamicT1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_G9_OFFSET,
  EGYPT_ISLAMIC_G9_T1_BOOK_END,
  allLessonRanges as islamicG9LessonRanges,
  loadBookPage as loadIslamicG9Page,
} from "../../db/egyptIslamicG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_G8_OFFSET,
  EGYPT_ISLAMIC_G8_T1_BOOK_END,
  allLessonRanges as islamicG8LessonRanges,
  loadBookPage as loadIslamicG8Page,
} from "../../db/egyptIslamicG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_P1_OFFSET,
  EGYPT_ISLAMIC_P1_T1_BOOK_END,
  allLessonRanges as islamicP1LessonRanges,
  loadBookPage as loadIslamicP1Page,
} from "../../db/egyptIslamicP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_OFFSET,
  EGYPT_CHRISTIAN_T1_BOOK_END,
  allLessonRanges as christianLessonRanges,
  loadBookPage as loadChristianPage,
} from "../../db/egyptChristianT1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_OFFSET,
  EGYPT_ICT_T1_BOOK_END,
  allLessonRanges as ictLessonRanges,
  loadBookPage as loadIctPage,
} from "../../db/egyptIctT1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_G9_OFFSET,
  EGYPT_ICT_G9_T1_BOOK_END,
  allLessonRanges as ictG9LessonRanges,
  loadBookPage as loadIctG9Page,
} from "../../db/egyptIctG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_P1_OFFSET,
  EGYPT_ICT_P1_T1_BOOK_END,
  allLessonRanges as ictP1LessonRanges,
  loadBookPage as loadIctP1Page,
} from "../../db/egyptIctP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as LIBRARIES_P1_OFFSET,
  EGYPT_LIBRARIES_P1_T1_BOOK_END,
  allLessonRanges as librariesP1LessonRanges,
  loadBookPage as loadLibrariesP1Page,
} from "../../db/egyptLibrariesP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as THEATER_P1_OFFSET,
  EGYPT_THEATER_P1_T1_BOOK_END,
  allLessonRanges as theaterP1LessonRanges,
  loadBookPage as loadTheaterP1Page,
} from "../../db/egyptTheaterP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as EDUCATIONAL_MEDIA_P1_OFFSET,
  EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END,
  allLessonRanges as educationalMediaP1LessonRanges,
  loadBookPage as loadEducationalMediaP1Page,
} from "../../db/egyptEducationalMediaP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_G8_OFFSET,
  EGYPT_ICT_G8_T1_BOOK_END,
  allLessonRanges as ictG8LessonRanges,
  loadBookPage as loadIctG8Page,
} from "../../db/egyptIctG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_G8_EN_OFFSET,
  EGYPT_ICT_G8_EN_T1_BOOK_END,
  allLessonRanges as ictG8EnLessonRanges,
  loadBookPage as loadIctG8EnPage,
} from "../../db/egyptIctG8EnT1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G9_OFFSET,
  EGYPT_CHRISTIAN_G9_T1_BOOK_END,
  allLessonRanges as christianG9LessonRanges,
  loadBookPage as loadChristianG9Page,
} from "../../db/egyptChristianG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G8_OFFSET,
  EGYPT_CHRISTIAN_G8_T1_BOOK_END,
  allLessonRanges as christianG8LessonRanges,
  loadBookPage as loadChristianG8Page,
} from "../../db/egyptChristianG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_P1_OFFSET,
  EGYPT_CHRISTIAN_P1_T1_BOOK_END,
  allLessonRanges as christianP1LessonRanges,
  loadBookPage as loadChristianP1Page,
} from "../../db/egyptChristianP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_G9_OFFSET,
  EGYPT_SOCIAL_G9_T1_BOOK_END,
  allLessonRanges as socialG9LessonRanges,
  loadBookPage as loadSocialG9Page,
} from "../../db/egyptSocialG9T1.js";

/** The book whose pages shipped first; still the reference offset for maths. */
export const EGYPT_G6_MATH_CURRICULUM = "eg-g6-math";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Directory holding one book's `pages-NNN.jpg` (NNN = scan/PDF page, 1-based).
 *
 * Every book gets its own subdirectory named after its curriculum code, because
 * two books can both have a `pages-010.jpg` that mean different pages. The base
 * is resolved relative to this module, not the process CWD, so the stage works
 * the same whether the server is started from the repo root, from `server/`, or
 * from a compiled `dist/` — the same reason the OCR corpus is resolved this way.
 */
export function pagesDir(curriculumCode?: string): string {
  const configured = config.CURRICULUM_PAGES_DIR?.trim();
  const base = configured
    ? path.resolve(configured)
    : path.join(MODULE_DIR, "..", "..", "..", "data", "curriculum-pages");
  return curriculumCode ? path.join(base, curriculumCode) : base;
}

// ---------------------------------------------------------------------------
// The registry: one entry per book whose lessons map to printed pages.
// ---------------------------------------------------------------------------

/**
 * One book's stage data: how a printed page becomes a scan page (`offset`) and
 * which book pages each app lesson owns (`ranges`, keyed by the lesson code the
 * seeder wrote, e.g. `l-con-1-1`). `loadPage` reads that book's OCR text, so the
 * tutor's "the page in front of the student" is the right book's text too.
 */
interface StageBook {
  code: string;
  /** App lesson-code prefix; the remainder is the printed key (`1-1`). */
  prefix: string;
  offset: number;
  bookEnd: number;
  /**
   * PHASE 75 — highest page that can ever appear in a stage for this book: its
   * own content end, or an appendix page a lesson points to (the Arabic listening
   * passages reach page 148). Image/text lookup is bounded by this, while
   * `bookEnd` keeps naming the book's own last unit page.
   */
  maxPage: number;
  ranges: Map<string, { from: number; to: number }>;
  /**
   * PHASE 75 — book-wide pages a lesson points to but does not own (the Arabic
   * listening passages in the back matter), keyed by lesson code. They join the
   * lesson's stage so the student can read the very page the tutor quotes.
   */
  extras: Map<string, number[]>;
  loadPage: (bookPage: number) => string;
  /**
   * A book whose printed page → scan page is not a simple constant shift (the
   * philosophy book has an unnumbered unit divider bound between printed 46 and
   * 47, so its mapping is two-segment). When absent, `offset` is the whole map.
   */
  bookToPdf?: (bookPage: number) => number;
}

function buildBook(opts: {
  code: string;
  prefix: string;
  offset: number;
  bookEnd: number;
  ranges: { key: string; from: number; to: number }[];
  loadPage: (bookPage: number) => string;
  /** Some books print their key with a dot (`1.1`); the seeder writes `1-1`. */
  keyToCode?: (key: string) => string;
  /** PHASE 75 — appendix pages per printed lesson key (`1-1` → `[146]`). */
  extras?: Map<string, number[]>;
  /** Non-affine printed → scan page mapping; falls back to `bookPage + offset`. */
  bookToPdf?: (bookPage: number) => number;
}): StageBook {
  const ranges = new Map<string, { from: number; to: number }>();
  for (const r of opts.ranges) {
    const key = opts.keyToCode ? opts.keyToCode(r.key) : r.key;
    ranges.set(opts.prefix + key, { from: r.from, to: r.to });
  }
  const extras = new Map<string, number[]>();
  for (const [key, pages] of opts.extras ?? []) {
    const code = opts.keyToCode ? opts.keyToCode(key) : key;
    extras.set(opts.prefix + code, [...pages]);
  }
  const maxPage = Math.max(opts.bookEnd, ...[...extras.values()].flat(), 0);
  return {
    code: opts.code,
    prefix: opts.prefix,
    offset: opts.offset,
    bookEnd: opts.bookEnd,
    maxPage,
    ranges,
    extras,
    loadPage: opts.loadPage,
    bookToPdf: opts.bookToPdf,
  };
}

const STAGE_BOOKS: StageBook[] = [
  buildBook({ code: EGYPT_G6_MATH_CURRICULUM, prefix: "l-con-", offset: MATH_AR_OFFSET, bookEnd: EGYPT_T1_BOOK_END, ranges: mathArConceptRanges(), loadPage: loadMathArPage }),
  buildBook({ code: "eg-g6-math-en", prefix: "l-men-", offset: MATH_EN_OFFSET, bookEnd: EGYPT_MATH_EN_T1_BOOK_END, ranges: mathEnConceptRanges(), loadPage: loadMathEnPage, keyToCode: (k) => k.replace(".", "-") }),
  buildBook({ code: "eg-g6-math-fr", prefix: "l-mfr-", offset: MATH_FR_OFFSET, bookEnd: EGYPT_MATH_FR_T1_BOOK_END, ranges: mathFrConceptRanges(), loadPage: loadMathFrPage, keyToCode: (k) => k.replace(".", "-") }),
  buildBook({ code: "eg-g6-science", prefix: "l-sci-con-", offset: SCIENCE_OFFSET, bookEnd: EGYPT_SCIENCE_T1_BOOK_END, ranges: scienceConceptRanges(), loadPage: loadSciencePage }),
  buildBook({ code: "eg-g6-social", prefix: "l-soc-", offset: SOCIAL_OFFSET, bookEnd: EGYPT_SOCIAL_T1_BOOK_END, ranges: socialLessonRanges(), loadPage: loadSocialPage }),
  buildBook({ code: "eg-g6-arabic", prefix: "l-ara-", offset: ARABIC_OFFSET, bookEnd: EGYPT_ARABIC_T1_BOOK_END, ranges: arabicLessonRanges(), loadPage: loadArabicPage, extras: arabicLessonExtras() }),
  buildBook({ code: "eg-g6-islamic-education", prefix: "l-isl-", offset: ISLAMIC_OFFSET, bookEnd: EGYPT_ISLAMIC_T1_BOOK_END, ranges: islamicLessonRanges(), loadPage: loadIslamicPage }),
  buildBook({ code: "eg-g6-christian-education", prefix: "l-chr-", offset: CHRISTIAN_OFFSET, bookEnd: EGYPT_CHRISTIAN_T1_BOOK_END, ranges: christianLessonRanges(), loadPage: loadChristianPage }),
  buildBook({ code: "eg-g6-ict", prefix: "l-ict-", offset: ICT_OFFSET, bookEnd: EGYPT_ICT_T1_BOOK_END, ranges: ictLessonRanges(), loadPage: loadIctPage }),
  buildBook({ code: "eg-g9-ict", prefix: "l-g9-ict-", offset: ICT_G9_OFFSET, bookEnd: EGYPT_ICT_G9_T1_BOOK_END, ranges: ictG9LessonRanges(), loadPage: loadIctG9Page }),
  buildBook({ code: "eg-g7-ict", prefix: "l-g7-ict-", offset: ICT_P1_OFFSET, bookEnd: EGYPT_ICT_P1_T1_BOOK_END, ranges: ictP1LessonRanges(), loadPage: loadIctP1Page }),
  buildBook({ code: "eg-g7-libraries", prefix: "l-g7-lib-", offset: LIBRARIES_P1_OFFSET, bookEnd: EGYPT_LIBRARIES_P1_T1_BOOK_END, ranges: librariesP1LessonRanges(), loadPage: loadLibrariesP1Page }),
  buildBook({ code: "eg-g7-theater", prefix: "l-g7-the-", offset: THEATER_P1_OFFSET, bookEnd: EGYPT_THEATER_P1_T1_BOOK_END, ranges: theaterP1LessonRanges(), loadPage: loadTheaterP1Page }),
  buildBook({ code: "eg-g7-educational-media", prefix: "l-g7-edm-", offset: EDUCATIONAL_MEDIA_P1_OFFSET, bookEnd: EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END, ranges: educationalMediaP1LessonRanges(), loadPage: loadEducationalMediaP1Page }),
  buildBook({ code: "eg-g8-ict", prefix: "l-g8-ict-", offset: ICT_G8_OFFSET, bookEnd: EGYPT_ICT_G8_T1_BOOK_END, ranges: ictG8LessonRanges(), loadPage: loadIctG8Page }),
  buildBook({ code: "eg-g8-ict-en", prefix: "l-g8-ict-en-", offset: ICT_G8_EN_OFFSET, bookEnd: EGYPT_ICT_G8_EN_T1_BOOK_END, ranges: ictG8EnLessonRanges(), loadPage: loadIctG8EnPage }),
  buildBook({ code: "eg-g9-christian-education", prefix: "l-g9-chr-", offset: CHRISTIAN_G9_OFFSET, bookEnd: EGYPT_CHRISTIAN_G9_T1_BOOK_END, ranges: christianG9LessonRanges(), loadPage: loadChristianG9Page }),
  buildBook({ code: "eg-g8-christian-education", prefix: "l-g8-chr-", offset: CHRISTIAN_G8_OFFSET, bookEnd: EGYPT_CHRISTIAN_G8_T1_BOOK_END, ranges: christianG8LessonRanges(), loadPage: loadChristianG8Page }),
  buildBook({ code: "eg-g7-christian-education", prefix: "l-g7-chr-", offset: CHRISTIAN_P1_OFFSET, bookEnd: EGYPT_CHRISTIAN_P1_T1_BOOK_END, ranges: christianP1LessonRanges(), loadPage: loadChristianP1Page }),
  buildBook({ code: "eg-g9-social", prefix: "l-g9-soc-", offset: SOCIAL_G9_OFFSET, bookEnd: EGYPT_SOCIAL_G9_T1_BOOK_END, ranges: socialG9LessonRanges(), loadPage: loadSocialG9Page }),
  buildBook({ code: "eg-g9-islamic-education", prefix: "l-g9-isl-", offset: ISLAMIC_G9_OFFSET, bookEnd: EGYPT_ISLAMIC_G9_T1_BOOK_END, ranges: islamicG9LessonRanges(), loadPage: loadIslamicG9Page }),
  buildBook({ code: "eg-g7-islamic-education", prefix: "l-g7-isl-", offset: ISLAMIC_P1_OFFSET, bookEnd: EGYPT_ISLAMIC_P1_T1_BOOK_END, ranges: islamicP1LessonRanges(), loadPage: loadIslamicP1Page }),
  buildBook({ code: "eg-g8-islamic-education", prefix: "l-g8-isl-", offset: ISLAMIC_G8_OFFSET, bookEnd: EGYPT_ISLAMIC_G8_T1_BOOK_END, ranges: islamicG8LessonRanges(), loadPage: loadIslamicG8Page }),
  buildBook({ code: "eg-g9-math", prefix: "l-g9-math-", offset: MATH_G9_OFFSET, bookEnd: EGYPT_MATH_G9_T1_BOOK_END, ranges: mathG9LessonRanges(), loadPage: loadMathG9Page }),
  buildBook({ code: "eg-g9-science", prefix: "l-g9-sci-", offset: SCIENCE_G9_OFFSET, bookEnd: EGYPT_SCIENCE_G9_T1_BOOK_END, ranges: scienceG9LessonRanges(), loadPage: loadScienceG9Page }),
  buildBook({ code: "eg-g9-english", prefix: "l-g9-eng-", offset: ENGLISH_G9_OFFSET, bookEnd: EGYPT_ENGLISH_G9_T1_BOOK_END, ranges: englishG9LessonRanges(), loadPage: loadEnglishG9Page, extras: englishG9LessonExtras() }),
  buildBook({ code: "eg-g10-english", prefix: "l-g10-eng-", offset: ENGLISH_G10_OFFSET, bookEnd: EGYPT_ENGLISH_G10_T1_BOOK_END, ranges: englishG10LessonRanges(), loadPage: loadEnglishG10Page, extras: englishG10LessonExtras() }),
  buildBook({ code: "eg-g10-english2", prefix: "l-g10-eng2-", offset: ENGLISH2_G10_OFFSET, bookEnd: EGYPT_ENGLISH2_G10_T1_BOOK_END, ranges: english2G10LessonRanges(), loadPage: loadEnglish2G10Page, extras: english2G10LessonExtras() }),
  buildBook({ code: "eg-g10-italian", prefix: "l-g10-ita-", offset: ITALIAN_G10_OFFSET, bookEnd: EGYPT_ITALIAN_G10_T1_BOOK_END, ranges: italianG10LessonRanges(), loadPage: loadItalianG10Page, extras: italianG10LessonExtras() }),
  buildBook({ code: "eg-g10-german", prefix: "l-g10-deu-", offset: GERMAN_G10_OFFSET, bookEnd: EGYPT_GERMAN_G10_T1_BOOK_END, ranges: germanG10LessonRanges(), loadPage: loadGermanG10Page, extras: germanG10LessonExtras() }),
  buildBook({ code: "eg-g10-spanish", prefix: "l-g10-spa-", offset: SPANISH_G10_OFFSET, bookEnd: EGYPT_SPANISH_G10_T1_BOOK_END, ranges: spanishG10LessonRanges(), loadPage: loadSpanishG10Page, extras: spanishG10LessonExtras() }),
  buildBook({ code: "eg-g10-french", prefix: "l-g10-fra-", offset: FRENCH_G10_OFFSET, bookEnd: EGYPT_FRENCH_G10_T1_BOOK_END, ranges: frenchG10LessonRanges(), loadPage: loadFrenchG10Page, extras: frenchG10LessonExtras() }),
  buildBook({ code: "eg-g9-arabic", prefix: "l-g9-ara-", offset: ARABIC_G9_OFFSET, bookEnd: EGYPT_ARABIC_G9_T1_BOOK_END, ranges: arabicG9LessonRanges(), loadPage: loadArabicG9Page, extras: arabicG9LessonExtras() }),
  buildBook({ code: "eg-g10-arabic-story", prefix: "l-g10-story-", offset: ARABIC_STORY_G10_OFFSET, bookEnd: EGYPT_ARABIC_STORY_G10_T1_BOOK_END, ranges: arabicStoryG10LessonRanges(), loadPage: loadArabicStoryG10Page, extras: arabicStoryG10LessonExtras() }),
  buildBook({ code: "eg-g10-integrated-science", prefix: "l-g10-isci-", offset: INTEGRATED_SCIENCE_G10_OFFSET, bookEnd: EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END, ranges: integratedScienceG10LessonRanges(), loadPage: loadIntegratedScienceG10Page, extras: integratedScienceG10LessonExtras() }),
  buildBook({ code: "eg-g10-philosophy", prefix: "l-g10-phil-", offset: PHILOSOPHY_G10_OFFSET, bookToPdf: philosophyG10BookToPdfPage, bookEnd: EGYPT_PHILOSOPHY_G10_T1_BOOK_END, ranges: philosophyG10LessonRanges(), loadPage: loadPhilosophyG10Page, extras: philosophyG10LessonExtras() }),
  buildBook({ code: "eg-g10-nahw", prefix: "l-g10-nahw-", offset: NAHW_G10_OFFSET, bookEnd: EGYPT_NAHW_G10_T1_BOOK_END, ranges: nahwG10LessonRanges(), loadPage: loadNahwG10Page, extras: nahwG10LessonExtras() }),
  buildBook({ code: "eg-g10-arabic", prefix: "l-g10-ara-", offset: ARABIC_G10_OFFSET, bookEnd: EGYPT_ARABIC_G10_T1_BOOK_END, ranges: arabicG10LessonRanges(), loadPage: loadArabicG10Page, extras: arabicG10LessonExtras() }),
  buildBook({ code: "eg-g10-ict-en", prefix: "l-g10-ict-en-", offset: ICT_G10_EN_OFFSET, bookEnd: EGYPT_ICT_G10_EN_T1_BOOK_END, ranges: ictG10EnLessonRanges(), loadPage: loadIctG10EnPage }),
  buildBook({ code: "eg-g10-french2", prefix: "l-g10-fra2-", offset: FRENCH2_G10_OFFSET, bookEnd: EGYPT_FRENCH2_G10_T1_BOOK_END, ranges: french2G10LessonRanges(), loadPage: loadFrench2G10Page, extras: french2G10LessonExtras() }),
  buildBook({ code: "eg-g10-integrated-science-en", prefix: "l-g10-isci-en-", offset: INTEGRATED_SCIENCE_EN_G10_OFFSET, bookEnd: EGYPT_INTEGRATED_SCIENCE_EN_G10_T1_BOOK_END, ranges: integratedScienceEnG10LessonRanges(), loadPage: loadIntegratedScienceEnG10Page, extras: integratedScienceEnG10LessonExtras() }),
  buildBook({ code: "eg-g1-english", prefix: "l-g1-eng-", offset: ENGLISH_G1_OFFSET, bookEnd: EGYPT_ENGLISH_G1_T1_BOOK_END, ranges: englishG1LessonRanges(), loadPage: loadEnglishG1Page, extras: englishG1LessonExtras() }),
  buildBook({ code: "eg-g10-french-story", prefix: "l-g10-fra-story-", offset: FRENCH_STORY_G10_OFFSET, bookEnd: EGYPT_FRENCH_STORY_G10_T1_BOOK_END, ranges: frenchStoryG10LessonRanges(), loadPage: loadFrenchStoryG10Page, extras: frenchStoryG10LessonExtras() }),
  buildBook({ code: "eg-g1-discovery", prefix: "l-g1-dis-", offset: DISCOVERY_G1_OFFSET, bookEnd: EGYPT_DISCOVERY_G1_T1_BOOK_END, ranges: discoveryG1LessonRanges(), loadPage: loadDiscoveryG1Page, extras: discoveryG1LessonExtras() }),
  buildBook({ code: "eg-g10-islamic-education", prefix: "l-g10-isl-", offset: ISLAMIC_G10_OFFSET, bookEnd: EGYPT_ISLAMIC_G10_T1_BOOK_END, ranges: islamicG10LessonRanges(), loadPage: loadIslamicG10Page, extras: islamicG10LessonExtras() }),
  buildBook({ code: "eg-g1-math", prefix: "l-g1-math-", offset: MATH_G1_OFFSET, bookEnd: EGYPT_MATH_G1_T1_BOOK_END, ranges: mathG1LessonRanges(), loadPage: loadMathG1Page, extras: mathG1LessonExtras() }),
  buildBook({ code: "eg-g10-integrated-science-fr", prefix: "l-g10-isci-fr-", offset: INTEGRATED_SCIENCE_FR_G10_OFFSET, bookEnd: EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END, ranges: integratedScienceFrG10LessonRanges(), loadPage: loadIntegratedScienceFrG10Page, extras: integratedScienceFrG10LessonExtras() }),
  buildBook({ code: "eg-g1-math-en", prefix: "l-g1-math-en-", offset: MATH_EN_G1_OFFSET, bookEnd: EGYPT_MATH_EN_G1_T1_BOOK_END, ranges: mathEnG1LessonRanges(), loadPage: loadMathEnG1Page, extras: mathEnG1LessonExtras() }),
  buildBook({ code: "eg-g10-math-fr", prefix: "l-g10-math-fr-", offset: MATH_FR_G10_OFFSET, bookEnd: EGYPT_MATH_FR_G10_T1_BOOK_END, ranges: mathFrG10LessonRanges(), loadPage: loadMathFrG10Page, extras: mathFrG10LessonExtras() }),
  buildBook({ code: "eg-g1-math-fr", prefix: "l-g1-math-fr-", offset: MATH_FR_G1_OFFSET, bookEnd: EGYPT_MATH_FR_G1_T1_BOOK_END, ranges: mathFrG1LessonRanges(), loadPage: loadMathFrG1Page, extras: mathFrG1LessonExtras() }),
  buildBook({ code: "eg-g10-math", prefix: "l-g10-math-", offset: MATH_G10_OFFSET, bookEnd: EGYPT_MATH_G10_T1_BOOK_END, ranges: mathG10LessonRanges(), loadPage: loadMathG10Page, extras: mathG10LessonExtras() }),
  buildBook({ code: "eg-g10-christian-education", prefix: "l-g10-chr-", offset: CHRISTIAN_G10_OFFSET, bookEnd: EGYPT_CHRISTIAN_G10_T1_BOOK_END, ranges: christianG10LessonRanges(), loadPage: loadChristianG10Page, extras: christianG10LessonExtras() }),
  buildBook({ code: "eg-g10-history", prefix: "l-g10-his-", offset: HISTORY_G10_OFFSET, bookEnd: EGYPT_HISTORY_G10_T1_BOOK_END, ranges: historyG10LessonRanges(), loadPage: loadHistoryG10Page, extras: historyG10LessonExtras() }),
  buildBook({ code: "eg-g10-ict", prefix: "l-g10-ict-", offset: ICT_AR_G10_OFFSET, bookEnd: EGYPT_ICT_G10_AR_T1_BOOK_END, ranges: ictArG10LessonRanges(), loadPage: loadIctArG10Page }),
  buildBook({ code: "eg-g2-english", prefix: "l-g2-eng-", offset: ENGLISH_G2_OFFSET, bookEnd: EGYPT_ENGLISH_G2_T1_BOOK_END, ranges: englishG2LessonRanges(), loadPage: loadEnglishG2Page, extras: englishG2LessonExtras() }),
  buildBook({ code: "eg-g1-arabic", prefix: "l-g1-ara-", offset: ARABIC_G1_OFFSET, bookEnd: EGYPT_ARABIC_G1_T1_BOOK_END, ranges: arabicG1LessonRanges(), loadPage: loadArabicG1Page, extras: arabicG1LessonExtras() }),
  buildBook({ code: "eg-g2-arabic", prefix: "l-g2-ara-", offset: ARABIC_G2_OFFSET, bookEnd: EGYPT_ARABIC_G2_T1_BOOK_END, ranges: arabicG2LessonRanges(), loadPage: loadArabicG2Page, extras: arabicG2LessonExtras() }),
  buildBook({ code: "eg-g3-arabic", prefix: "l-g3-ara-", offset: ARABIC_G3_OFFSET, bookEnd: EGYPT_ARABIC_G3_T1_BOOK_END, ranges: arabicG3LessonRanges(), loadPage: loadArabicG3Page, extras: arabicG3LessonExtras() }),
  buildBook({ code: "eg-g3-english", prefix: "l-g3-eng-", offset: ENGLISH_G3_OFFSET, bookEnd: EGYPT_ENGLISH_G3_T1_BOOK_END, ranges: englishG3LessonRanges(), loadPage: loadEnglishG3Page, extras: englishG3LessonExtras() }),
  buildBook({ code: "eg-g3-christian-education", prefix: "l-g3-chr-", offset: CHRISTIAN_G3_OFFSET, bookEnd: EGYPT_CHRISTIAN_G3_T1_BOOK_END, ranges: christianG3LessonRanges(), loadPage: loadChristianG3Page, extras: christianG3LessonExtras() }),
  buildBook({ code: "eg-g4-english", prefix: "l-g4-eng-", offset: ENGLISH_G4_OFFSET, bookEnd: EGYPT_ENGLISH_G4_T1_BOOK_END, ranges: englishG4LessonRanges(), loadPage: loadEnglishG4Page, extras: englishG4LessonExtras() }),
  buildBook({ code: "eg-g3-math-en", prefix: "l-g3-math-en-", offset: MATH_EN_G3_OFFSET, bookEnd: EGYPT_MATH_EN_G3_T1_BOOK_END, ranges: mathEnG3LessonRanges(), loadPage: loadMathEnG3Page, extras: mathEnG3LessonExtras() }),
  buildBook({ code: "eg-g4-christian-education", prefix: "l-g4-chr-", offset: CHRISTIAN_G4_OFFSET, bookEnd: EGYPT_CHRISTIAN_G4_T1_BOOK_END, ranges: christianG4LessonRanges(), loadPage: loadChristianG4Page, extras: christianG4LessonExtras() }),  buildBook({ code: "eg-g2-christian-education", prefix: "l-g2-chr-", offset: CHRISTIAN_G2_OFFSET, bookEnd: EGYPT_CHRISTIAN_G2_T1_BOOK_END, ranges: christianG2LessonRanges(), loadPage: loadChristianG2Page, extras: christianG2LessonExtras() }),
  buildBook({ code: "eg-kg1-discovery-en", prefix: "l-kg1-dis-en-", offset: DISCOVERY_EN_KG1_OFFSET, bookEnd: EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END, ranges: discoveryEnKg1LessonRanges(), loadPage: loadDiscoveryEnKg1Page, extras: discoveryEnKg1LessonExtras() }),
  buildBook({ code: "eg-kg2-discovery-fr", prefix: "l-kg2-dis-fr-", offset: DISCOVERY_FR_KG2_OFFSET, bookEnd: EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END, ranges: discoveryFrKg2LessonRanges(), loadPage: loadDiscoveryFrKg2Page, extras: discoveryFrKg2LessonExtras() }),
  buildBook({ code: "eg-g8-arabic", prefix: "l-g8-ara-", offset: ARABIC_G8_OFFSET, bookEnd: EGYPT_ARABIC_G8_T1_BOOK_END, ranges: arabicG8LessonRanges(), loadPage: loadArabicG8Page, extras: arabicG8LessonExtras() }),
  buildBook({ code: "eg-g7-arabic", prefix: "l-g7-ara-", offset: ARABIC_G7_OFFSET, bookEnd: EGYPT_ARABIC_P1_T1_BOOK_END, ranges: arabicP1LessonRanges(), loadPage: loadArabicP1Page, extras: arabicP1LessonExtras() }),
  buildBook({ code: "eg-g8-english", prefix: "l-g8-eng-", offset: ENGLISH_G8_OFFSET, bookEnd: EGYPT_ENGLISH_G8_T1_BOOK_END, ranges: englishG8LessonRanges(), loadPage: loadEnglishG8Page, extras: englishG8LessonExtras() }),
  buildBook({ code: "eg-g7-english", prefix: "l-g7-eng-", offset: ENGLISH_P1_OFFSET, bookEnd: EGYPT_ENGLISH_P1_T1_BOOK_END, ranges: englishP1LessonRanges(), loadPage: loadEnglishP1Page, extras: englishP1LessonExtras() }),
  buildBook({ code: "eg-g8-social", prefix: "l-g8-soc-", offset: SOCIAL_G8_OFFSET, bookEnd: EGYPT_SOCIAL_G8_T1_BOOK_END, ranges: socialG8LessonRanges(), loadPage: loadSocialG8Page }),
  buildBook({ code: "eg-g8-science", prefix: "l-g8-sci-", offset: SCIENCE_G8_OFFSET, bookEnd: EGYPT_SCIENCE_G8_T1_BOOK_END, ranges: scienceG8LessonRanges(), loadPage: loadScienceG8Page }),
  buildBook({ code: "eg-g8-science-en", prefix: "l-g8-sci-en-", offset: SCIENCE_G8_EN_OFFSET, bookEnd: EGYPT_SCIENCE_G8_EN_T1_BOOK_END, ranges: scienceG8EnLessonRanges(), loadPage: loadScienceG8EnPage }),
  buildBook({ code: "eg-g8-agriculture", prefix: "l-g8-agri-", offset: AGRICULTURE_G8_OFFSET, bookEnd: EGYPT_AGRICULTURE_G8_T1_BOOK_END, ranges: agricultureG8LessonRanges(), loadPage: loadAgricultureG8Page }),
  buildBook({ code: "eg-g8-industry", prefix: "l-g8-ind-", offset: INDUSTRY_G8_OFFSET, bookEnd: EGYPT_INDUSTRY_G8_T1_BOOK_END, ranges: industryG8LessonRanges(), loadPage: loadIndustryG8Page }),
  buildBook({ code: "eg-g8-libraries", prefix: "l-g8-lib-", offset: LIBRARIES_G8_OFFSET, bookEnd: EGYPT_LIBRARIES_G8_T1_BOOK_END, ranges: librariesG8LessonRanges(), loadPage: loadLibrariesG8Page }),
  buildBook({ code: "eg-g7-science-en", prefix: "l-g7-sci-en-", offset: SCIENCE_EN_P1_OFFSET, bookEnd: EGYPT_SCIENCE_EN_P1_T1_BOOK_END, ranges: scienceEnP1LessonRanges(), loadPage: loadScienceEnP1Page }),
  buildBook({ code: "eg-g8-math", prefix: "l-g8-math-", offset: MATH_G8_OFFSET, bookEnd: EGYPT_MATH_G8_T1_BOOK_END, ranges: mathG8LessonRanges(), loadPage: loadMathG8Page }),
  buildBook({ code: "eg-g8-math-en", prefix: "l-g8-math-en-", offset: MATH_G8_EN_OFFSET, bookEnd: EGYPT_MATH_G8_EN_T1_BOOK_END, ranges: mathG8EnLessonRanges(), loadPage: loadMathG8EnPage }),
  buildBook({ code: "eg-g8-math-fr", prefix: "l-g8-math-fr-", offset: MATH_G8_FR_OFFSET, bookEnd: EGYPT_MATH_G8_FR_T1_BOOK_END, ranges: mathG8FrLessonRanges(), loadPage: loadMathG8FrPage }),
  buildBook({ code: "eg-g7-math", prefix: "l-g7-math-", offset: MATH_P1_OFFSET, bookEnd: EGYPT_MATH_P1_T1_BOOK_END, ranges: mathP1LessonRanges(), loadPage: loadMathP1Page }),
  buildBook({ code: "eg-g7-math-en", prefix: "l-g7-math-en-", offset: MATH_EN_P1_OFFSET, bookEnd: EGYPT_MATH_EN_P1_T1_BOOK_END, ranges: mathEnP1LessonRanges(), loadPage: loadMathEnP1Page }),
  buildBook({ code: "eg-g7-science", prefix: "l-g7-sci-", offset: SCIENCE_P1_OFFSET, bookEnd: EGYPT_SCIENCE_P1_T1_BOOK_END, ranges: scienceP1LessonRanges(), loadPage: loadScienceP1Page }),
  buildBook({ code: "eg-g7-science-fr", prefix: "l-g7-sci-fr-", offset: SCIENCE_FR_P1_OFFSET, bookEnd: EGYPT_SCIENCE_FR_P1_T1_BOOK_END, ranges: scienceFrP1LessonRanges(), loadPage: loadScienceFrP1Page }),
  buildBook({ code: "eg-g7-social", prefix: "l-g7-social-", offset: SOCIAL_P1_OFFSET, bookEnd: EGYPT_SOCIAL_P1_T1_BOOK_END, ranges: socialP1LessonRanges(), loadPage: loadSocialP1Page }),
];

const STAGE_BOOK_BY_CODE = new Map(STAGE_BOOKS.map((b) => [b.code, b]));

/** Highest printed page any lesson owns (its range or an appendix page). */
export const MAX_BOOK_PAGE = Math.max(...STAGE_BOOKS.map((b) => b.maxPage));

/** Scan/PDF page that holds a printed book page for this book. */
export function bookPageToPdfPage(curriculumCode: string, bookPage: number): number {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (book?.bookToPdf) return book.bookToPdf(bookPage);
  return bookPage + (book?.offset ?? 0);
}

function pageFileName(pdfPage: number): string {
  return `pages-${String(pdfPage).padStart(3, "0")}.jpg`;
}

/** Absolute path of one page image, or null when it was never extracted. */
export function pageImagePath(curriculumCode: string, bookPage: number): string | null {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return null;
  if (!Number.isInteger(bookPage) || bookPage < 0 || bookPage > book.maxPage) return null;
  const root = path.resolve(pagesDir(curriculumCode));
  const file = path.join(root, pageFileName(bookPageToPdfPage(curriculumCode, bookPage)));
  // Defence in depth: the name is generated, but the resolved path must still
  // stay inside the pages directory before anything is read from it.
  if (path.resolve(file) !== path.join(root, path.basename(file))) return null;
  return existsSync(file) ? file : null;
}

/** Reads one page image, or null when the pages are not installed. */
export function readPageImage(curriculumCode: string, bookPage: number): Buffer | null {
  const file = pageImagePath(curriculumCode, bookPage);
  if (!file) return null;
  try {
    return readFileSync(file);
  } catch {
    return null;
  }
}

export interface StagePage {
  /** Printed page number as the student sees it in the book. */
  bookPage: number;
  /** Scan/PDF page the image came from. */
  pdfPage: number;
  /** True when the image exists on this deployment. */
  present: boolean;
}

export interface LessonStage {
  curriculumId: string;
  /** Lesson code in the curriculum tree, e.g. "l-con-1-1". */
  lessonCode: string;
  /** Concept/lesson key as printed in the book's TOC, e.g. "1-1". */
  conceptKey: string;
  fromBookPage: number;
  toBookPage: number;
  pages: StagePage[];
  /**
   * PHASE 75 — book-wide appendix pages this lesson points to but does not own
   * (the Arabic listening passages). They are already part of `pages`; this is
   * the same set named explicitly, so a caller can label them without inferring
   * from the page numbers.
   */
  appendixPages: number[];
  /**
   * False when no page image was found for this lesson. The room must treat
   * this as "text-only session", never as an error: a deployment without the
   * source PDF is a supported configuration, not a broken one.
   */
  hasImages: boolean;
}

/**
 * The printed pages a lesson occupies, or null when the lesson is not a page of
 * a rasterized book (Saudi/English trees, or a book whose pages never shipped).
 */
export function stageForLesson(curriculumCode: string, lessonCode: string): LessonStage | null {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return null;
  const range = book.ranges.get(lessonCode);
  if (!range) return null;

  // The lesson's own printed range, plus any appendix page it points to (the
  // Arabic listening passages). The union is kept ascending so the room's page
  // strip reads left-to-right like the book; the appendix page stays outside
  // `fromBookPage`/`toBookPage`, which keep naming the lesson's own range.
  const appendixPages = (book.extras.get(lessonCode) ?? []).filter(
    (p) => Number.isInteger(p) && p >= 0 && p <= book.maxPage && (p < range.from || p > range.to),
  );
  const owned: number[] = [];
  for (let bookPage = range.from; bookPage <= range.to; bookPage += 1) owned.push(bookPage);
  const allPages = [...owned, ...appendixPages].sort((a, b) => a - b);

  const pages: StagePage[] = allPages.map((bookPage) => ({
    bookPage,
    pdfPage: bookPageToPdfPage(curriculumCode, bookPage),
    present: pageImagePath(curriculumCode, bookPage) !== null,
  }));
  return {
    curriculumId: curriculumCode,
    lessonCode,
    conceptKey: lessonCode.slice(book.prefix.length),
    fromBookPage: range.from,
    toBookPage: range.to,
    pages,
    appendixPages,
    hasImages: pages.some((p) => p.present),
  };
}

// ---------------------------------------------------------------------------
// PHASE 48 (part 2) — the book as a shared surface: what the tutor *sees*.
// ---------------------------------------------------------------------------

/**
 * The marker the seeder writes in front of every page's OCR text when it builds
 * the lesson document (`loadBookRange`). Because the marker lives *inside* the
 * retrieved chunk, a citation never has to be guessed by the model: the page a
 * fact came from is a fact about the retrieval, not a guess.
 */
export const BOOK_PAGE_MARKER = /\[صفحة الكتاب (\d+)\]/;

/**
 * The printed pages a retrieved passage was taken from (sorted, unique).
 *
 * PHASE 75 — `allowedPages`, when given, is the lesson's own page set: a marker
 * for a page the lesson does not own (a neighbouring lesson's page, or the
 * Arabic appendix when the lesson does not point to it) is dropped. That is the
 * alignment guarantee: every page the tutor's answer stands on is a page the
 * student can turn to in the stage.
 */
export function bookPagesInText(text: string, allowedPages?: ReadonlySet<number>): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(/\[صفحة الكتاب (\d+)\]/g)) {
    const n = Number(match[1]);
    if (!Number.isInteger(n) || n < 0 || n > MAX_BOOK_PAGE) continue;
    if (allowedPages && !allowedPages.has(n)) continue;
    found.add(n);
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * The OCR text of one printed page of a given book — literally what the student
 * is looking at right now. Returns "" when the book has no stage or the corpus
 * has no text for that page, so a caller can treat "no page" and "no text" the
 * same way.
 */
export function bookPageText(curriculumCode: string, bookPage: number): string {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return "";
  if (!Number.isInteger(bookPage) || bookPage < 0 || bookPage > book.maxPage) return "";
  return book.loadPage(bookPage).trim();
}

/**
 * PHASE 78 — the lesson's whole printed text, marker-prefixed page by page
 * exactly like the seeded lesson document (`[صفحة الكتاب N]` ahead of each
 * page). The tutor receives this in full *beside* the retrieved chunks, so a
 * printed worked example or printed تمرين can never be missing from the prompt
 * just because retrieval kept a different five chunks: with the whole lesson on
 * the table, «المعلم يعطي ما في صفحة الكتاب» becomes achievable instead of a
 * lottery.
 *
 * The bound is a defence, not a rounding: when the pages exceed `maxChars` the
 * whole injection is dropped ("" — retrieval keeps grounding the turn). A
 * truncated lesson-pointer could drop the very page that holds its أسئلة الدرس,
 * so we never ship a partial lesson pretending to be the full one. Pages whose
 * OCR is empty (blank/placeholder) are skipped; a book with no stage returns "".
 */
export function loadLessonBookText(
  curriculumCode: string,
  lessonPages: readonly number[] | undefined,
  maxChars: number,
): string {
  if (!lessonPages || lessonPages.length === 0 || maxChars <= 0) return "";
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return "";
  const parts: string[] = [];
  let total = 0;
  const pages = [...new Set(lessonPages)]
    .filter((p) => Number.isInteger(p) && p >= 0 && p <= book.maxPage)
    .sort((a, b) => a - b);
  for (const page of pages) {
    const text = book.loadPage(page).trim();
    if (!text) continue;
    const part = `[صفحة الكتاب ${page}]\n${text}`;
    parts.push(part);
    total += part.length;
  }
  // The "\n\n" separator between pages is part of the final text's length.
  if (parts.length > 1) total += (parts.length - 1) * 2;
  if (total > maxChars) return "";
  return parts.join("\n\n");
}
