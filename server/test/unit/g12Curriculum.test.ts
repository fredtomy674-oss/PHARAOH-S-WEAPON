import { describe, expect, it } from "vitest";
import {
  EGYPT_ARABIC_G12_T1_BOOK,
  EGYPT_ARABIC_G12_T1_UNITS,
  arabicG12LessonDocument,
  isArabicG12TreeConsistent,
} from "../../src/db/egyptArabicG12T1.js";
import {
  EGYPT_ARABIC_STORY_G12_T1_BOOK,
  EGYPT_ARABIC_STORY_G12_T1_UNITS,
  arabicStoryG12LessonDocument,
  isArabicStoryG12TreeConsistent,
} from "../../src/db/egyptArabicStoryG12T1.js";
import {
  EGYPT_ENGLISH_G12_T1_BOOK,
  EGYPT_ENGLISH_G12_T1_UNITS,
  englishG12LessonDocument,
  isEnglishG12TreeConsistent,
} from "../../src/db/egyptEnglishG12T1.js";
import {
  EGYPT_ISLAMIC_G12_T1_BOOK,
  EGYPT_ISLAMIC_G12_T1_UNITS,
  islamicG12LessonDocument,
  isIslamicG12TreeConsistent,
} from "../../src/db/egyptIslamicG12T1.js";
import {
  EGYPT_CHRISTIAN_G12_T1_BOOK,
  EGYPT_CHRISTIAN_G12_T1_UNITS,
  christianG12LessonDocument,
  isChristianG12TreeConsistent,
} from "../../src/db/egyptChristianG12T1.js";
import {
  EGYPT_ICT_G12_T1_BOOK,
  EGYPT_ICT_G12_T1_UNITS,
  ictG12LessonDocument,
  isIctG12TreeConsistent,
} from "../../src/db/egyptIctG12T1.js";
import {
  EGYPT_NATIONAL_EDUCATION_G12_T1_BOOK,
  EGYPT_NATIONAL_EDUCATION_G12_T1_UNITS,
  nationalEducationG12LessonDocument,
  isNationalEducationG12TreeConsistent,
} from "../../src/db/egyptNationalEducationG12T1.js";
import {
  EGYPT_CHEMISTRY_G12_T1_BOOK,
  EGYPT_CHEMISTRY_G12_T1_UNITS,
  chemistryG12LessonDocument,
  isChemistryG12TreeConsistent,
} from "../../src/db/egyptChemistryG12T1.js";
import {
  EGYPT_PHYSICS_G12_T1_BOOK,
  EGYPT_PHYSICS_G12_T1_UNITS,
  physicsG12LessonDocument,
  isPhysicsG12TreeConsistent,
} from "../../src/db/egyptPhysicsG12T1.js";
import {
  EGYPT_BIOLOGY_G12_T1_BOOK,
  EGYPT_BIOLOGY_G12_T1_UNITS,
  biologyG12LessonDocument,
  isBiologyG12TreeConsistent,
} from "../../src/db/egyptBiologyG12T1.js";
import {
  EGYPT_PURE_MATH_G12_T1_BOOK,
  EGYPT_PURE_MATH_G12_T1_UNITS,
  pureMathG12LessonDocument,
  isPureMathG12TreeConsistent,
} from "../../src/db/egyptPureMathG12T1.js";
import {
  EGYPT_APPLIED_MATH_G12_T1_BOOK,
  EGYPT_APPLIED_MATH_G12_T1_UNITS,
  appliedMathG12LessonDocument,
  isAppliedMathG12TreeConsistent,
} from "../../src/db/egyptAppliedMathG12T1.js";
import {
  EGYPT_HISTORY_G12_T1_BOOK,
  EGYPT_HISTORY_G12_T1_UNITS,
  historyG12LessonDocument,
  isHistoryG12TreeConsistent,
} from "../../src/db/egyptHistoryG12T1.js";
import {
  EGYPT_GEOGRAPHY_G12_T1_BOOK,
  EGYPT_GEOGRAPHY_G12_T1_UNITS,
  geographyG12LessonDocument,
  isGeographyG12TreeConsistent,
} from "../../src/db/egyptGeographyG12T1.js";
import {
  EGYPT_PSYCHOLOGY_G12_T1_BOOK,
  EGYPT_PSYCHOLOGY_G12_T1_UNITS,
  psychologyG12LessonDocument,
  isPsychologyG12TreeConsistent,
} from "../../src/db/egyptPsychologyG12T1.js";
import {
  EGYPT_STATISTICS_G12_T1_BOOK,
  EGYPT_STATISTICS_G12_T1_UNITS,
  statisticsG12LessonDocument,
  isStatisticsG12TreeConsistent,
} from "../../src/db/egyptStatisticsG12T1.js";

/**
 * PHASE 191 — G12 Term 1 core slice. These checks prove every book is a real
 * curriculum: official printed heads, at least two concepts per lesson, an
 * original teaching guide, and a verifiable Ministry source.
 */
const books = [
  {
    name: "Arabic",
    units: EGYPT_ARABIC_G12_T1_UNITS,
    check: isArabicG12TreeConsistent,
    document: arabicG12LessonDocument,
    source: EGYPT_ARABIC_G12_T1_BOOK.sourceUrl,
    lessons: 23,
  },
  {
    name: "Arabic Story",
    units: EGYPT_ARABIC_STORY_G12_T1_UNITS,
    check: isArabicStoryG12TreeConsistent,
    document: arabicStoryG12LessonDocument,
    source: EGYPT_ARABIC_STORY_G12_T1_BOOK.sourceUrl,
    lessons: 22,
  },
  {
    name: "English",
    units: EGYPT_ENGLISH_G12_T1_UNITS,
    check: isEnglishG12TreeConsistent,
    document: englishG12LessonDocument,
    source: EGYPT_ENGLISH_G12_T1_BOOK.sourceUrl,
    lessons: 8,
  },
  {
    name: "Islamic Education",
    units: EGYPT_ISLAMIC_G12_T1_UNITS,
    check: isIslamicG12TreeConsistent,
    document: islamicG12LessonDocument,
    source: EGYPT_ISLAMIC_G12_T1_BOOK.sourceUrl,
    lessons: 18,
  },
  {
    name: "Christian Education",
    units: EGYPT_CHRISTIAN_G12_T1_UNITS,
    check: isChristianG12TreeConsistent,
    document: christianG12LessonDocument,
    source: EGYPT_CHRISTIAN_G12_T1_BOOK.sourceUrl,
    lessons: 13,
  },
  {
    name: "ICT",
    units: EGYPT_ICT_G12_T1_UNITS,
    check: isIctG12TreeConsistent,
    document: ictG12LessonDocument,
    source: EGYPT_ICT_G12_T1_BOOK.sourceUrl,
    lessons: 3,
  },
  {
    name: "National Education",
    units: EGYPT_NATIONAL_EDUCATION_G12_T1_UNITS,
    check: isNationalEducationG12TreeConsistent,
    document: nationalEducationG12LessonDocument,
    source: EGYPT_NATIONAL_EDUCATION_G12_T1_BOOK.sourceUrl,
    lessons: 4,
  },
  {
    name: "Chemistry",
    units: EGYPT_CHEMISTRY_G12_T1_UNITS,
    check: isChemistryG12TreeConsistent,
    document: chemistryG12LessonDocument,
    source: EGYPT_CHEMISTRY_G12_T1_BOOK.sourceUrl,
    lessons: 5,
  },
  {
    name: "Physics",
    units: EGYPT_PHYSICS_G12_T1_UNITS,
    check: isPhysicsG12TreeConsistent,
    document: physicsG12LessonDocument,
    source: EGYPT_PHYSICS_G12_T1_BOOK.sourceUrl,
    lessons: 8,
  },
  {
    name: "Biology",
    units: EGYPT_BIOLOGY_G12_T1_UNITS,
    check: isBiologyG12TreeConsistent,
    document: biologyG12LessonDocument,
    source: EGYPT_BIOLOGY_G12_T1_BOOK.sourceUrl,
    lessons: 7,
  },
  {
    name: "Pure Mathematics",
    units: EGYPT_PURE_MATH_G12_T1_UNITS,
    check: isPureMathG12TreeConsistent,
    document: pureMathG12LessonDocument,
    source: EGYPT_PURE_MATH_G12_T1_BOOK.sourceUrl,
    lessons: 23,
  },
  {
    name: "Applied Mathematics",
    units: EGYPT_APPLIED_MATH_G12_T1_UNITS,
    check: isAppliedMathG12TreeConsistent,
    document: appliedMathG12LessonDocument,
    source: EGYPT_APPLIED_MATH_G12_T1_BOOK.sourceUrl,
    lessons: 12,
  },
  {
    name: "History",
    units: EGYPT_HISTORY_G12_T1_UNITS,
    check: isHistoryG12TreeConsistent,
    document: historyG12LessonDocument,
    source: EGYPT_HISTORY_G12_T1_BOOK.sourceUrl,
    lessons: 8,
  },
  {
    name: "Geography",
    units: EGYPT_GEOGRAPHY_G12_T1_UNITS,
    check: isGeographyG12TreeConsistent,
    document: geographyG12LessonDocument,
    source: EGYPT_GEOGRAPHY_G12_T1_BOOK.sourceUrl,
    lessons: 14,
  },
  {
    name: "Psychology and Sociology",
    units: EGYPT_PSYCHOLOGY_G12_T1_UNITS,
    check: isPsychologyG12TreeConsistent,
    document: psychologyG12LessonDocument,
    source: EGYPT_PSYCHOLOGY_G12_T1_BOOK.sourceUrl,
    lessons: 6,
  },
  {
    name: "Statistics",
    units: EGYPT_STATISTICS_G12_T1_UNITS,
    check: isStatisticsG12TreeConsistent,
    document: statisticsG12LessonDocument,
    source: EGYPT_STATISTICS_G12_T1_BOOK.sourceUrl,
    lessons: 15,
  },
] as const;

describe("PHASE 191 — G12 Term 1 curriculum trees", () => {
  for (const book of books) {
    it(`${book.name}: tree is complete and every lesson has a real guide`, () => {
      const result = book.check();
      expect(result.problems).toEqual([]);
      expect(result.ok).toBe(true);
      const count = book.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
      expect(count).toBe(book.lessons);
    });

    it(`${book.name}: documents carry the official source and no empty placeholders`, () => {
      for (let ui = 0; ui < book.units.length; ui += 1) {
        for (let li = 0; li < book.units[ui]!.lessons.length; li += 1) {
          const doc = book.document(ui, li);
          expect(doc).toContain(book.source);
          expect(doc).toContain("شرح تعليمي أصلي");
          expect(doc.length).toBeGreaterThan(500);
          expect(doc).not.toContain("???");
          expect(doc).not.toContain("TODO");
        }
      }
    });
  }

  it("covers the full core slice with 189 lessons", () => {
    const total = books.reduce(
      (sum, book) => sum + book.units.reduce((unitSum, unit) => unitSum + unit.lessons.length, 0),
      0,
    );
    expect(total).toBe(189);
  });
});
