import { describe, expect, it } from "vitest";
import {
  EGYPT_ARABIC_G11_T1_BOOK,
  EGYPT_ARABIC_G11_T1_UNITS,
  arabicG11LessonDocument,
  isArabicG11TreeConsistent,
} from "../../src/db/egyptArabicG11T1.js";
import {
  EGYPT_ENGLISH_G11_T1_BOOK,
  EGYPT_ENGLISH_G11_T1_UNITS,
  englishG11LessonDocument,
  isEnglishG11TreeConsistent,
} from "../../src/db/egyptEnglishG11T1.js";
import {
  EGYPT_CHEMISTRY_G11_T1_BOOK,
  EGYPT_CHEMISTRY_G11_T1_UNITS,
  chemistryG11LessonDocument,
  isChemistryG11TreeConsistent,
} from "../../src/db/egyptChemistryG11T1.js";
import {
  EGYPT_HISTORY_G11_T1_BOOK,
  EGYPT_HISTORY_G11_T1_UNITS,
  historyG11LessonDocument,
  isHistoryG11TreeConsistent,
} from "../../src/db/egyptHistoryG11T1.js";
import {
  EGYPT_PHYSICS_G11_T1_BOOK,
  EGYPT_PHYSICS_G11_T1_UNITS,
  physicsG11LessonDocument,
  isPhysicsG11TreeConsistent,
} from "../../src/db/egyptPhysicsG11T1.js";
import {
  EGYPT_PURE_MATH_G11_T1_BOOK,
  EGYPT_PURE_MATH_G11_T1_UNITS,
  pureMathG11LessonDocument,
  isPureMathG11TreeConsistent,
} from "../../src/db/egyptPureMathG11T1.js";
import {
  EGYPT_GENERAL_MATH_G11_T1_BOOK,
  EGYPT_GENERAL_MATH_G11_T1_UNITS,
  generalMathG11LessonDocument,
  isGeneralMathG11TreeConsistent,
} from "../../src/db/egyptGeneralMathG11T1.js";
import {
  EGYPT_GEOGRAPHY_G11_T1_BOOK,
  EGYPT_GEOGRAPHY_G11_T1_UNITS,
  geographyG11LessonDocument,
  isGeographyG11TreeConsistent,
} from "../../src/db/egyptGeographyG11T1.js";
import {
  EGYPT_PSYCHOLOGY_G11_T1_BOOK,
  EGYPT_PSYCHOLOGY_G11_T1_UNITS,
  psychologyG11LessonDocument,
  isPsychologyG11TreeConsistent,
} from "../../src/db/egyptPsychologyG11T1.js";
import {
  EGYPT_ISLAMIC_G11_T1_BOOK,
  EGYPT_ISLAMIC_G11_T1_UNITS,
  islamicG11LessonDocument,
  isIslamicG11TreeConsistent,
} from "../../src/db/egyptIslamicG11T1.js";
import {
  EGYPT_CHRISTIAN_G11_T1_BOOK,
  EGYPT_CHRISTIAN_G11_T1_UNITS,
  christianG11LessonDocument,
  isChristianG11TreeConsistent,
} from "../../src/db/egyptChristianG11T1.js";
import {
  EGYPT_ICT_G11_T1_BOOK,
  EGYPT_ICT_G11_T1_UNITS,
  ictG11LessonDocument,
  isIctG11TreeConsistent,
} from "../../src/db/egyptIctG11T1.js";
import {
  EGYPT_CITIZENSHIP_G11_T1_BOOK,
  EGYPT_CITIZENSHIP_G11_T1_UNITS,
  citizenshipG11LessonDocument,
  isCitizenshipG11TreeConsistent,
} from "../../src/db/egyptCitizenshipG11T1.js";
import {
  EGYPT_ARABIC_STORY_G11_T1_BOOK,
  EGYPT_ARABIC_STORY_G11_T1_UNITS,
  arabicStoryG11LessonDocument,
  isArabicStoryG11TreeConsistent,
} from "../../src/db/egyptArabicStoryG11T1.js";
import {
  EGYPT_APPLIED_MATH_G11_T1_BOOK,
  EGYPT_APPLIED_MATH_G11_T1_UNITS,
  appliedMathG11LessonDocument,
  isAppliedMathG11TreeConsistent,
} from "../../src/db/egyptAppliedMathG11T1.js";
import {
  EGYPT_ENGLISH2_G11_T1_BOOK,
  EGYPT_ENGLISH2_G11_T1_UNITS,
  english2G11LessonDocument,
  isEnglish2G11TreeConsistent,
} from "../../src/db/egyptEnglish2G11T1.js";
import {
  EGYPT_FRENCH_G11_T1_BOOK,
  EGYPT_FRENCH_G11_T1_UNITS,
  frenchG11LessonDocument,
  isFrenchG11TreeConsistent,
} from "../../src/db/egyptFrenchG11T1.js";
import {
  EGYPT_FRENCH2_G11_T1_BOOK,
  EGYPT_FRENCH2_G11_T1_UNITS,
  french2G11LessonDocument,
  isFrench2G11TreeConsistent,
} from "../../src/db/egyptFrench2G11T1.js";
import {
  EGYPT_FRENCH_STORY_G11_T1_BOOK,
  EGYPT_FRENCH_STORY_G11_T1_UNITS,
  frenchStoryG11LessonDocument,
  isFrenchStoryG11TreeConsistent,
} from "../../src/db/egyptFrenchStoryG11T1.js";
import {
  EGYPT_GERMAN_G11_T1_BOOK,
  EGYPT_GERMAN_G11_T1_UNITS,
  germanG11LessonDocument,
  isGermanG11TreeConsistent,
} from "../../src/db/egyptGermanG11T1.js";
import {
  EGYPT_ITALIAN_G11_T1_BOOK,
  EGYPT_ITALIAN_G11_T1_UNITS,
  italianG11LessonDocument,
  isItalianG11TreeConsistent,
} from "../../src/db/egyptItalianG11T1.js";
import {
  EGYPT_SPANISH_G11_T1_BOOK,
  EGYPT_SPANISH_G11_T1_UNITS,
  spanishG11LessonDocument,
  isSpanishG11TreeConsistent,
} from "../../src/db/egyptSpanishG11T1.js";

/**
 * PHASE 185 — the first G11 slice must be a real curriculum, not empty shells.
 * These checks run before the heavy seed test and prove every book has a whole
 * tree, a printed source, and a substantive original guide per lesson.
 */
const books = [
  {
    name: "Arabic",
    units: EGYPT_ARABIC_G11_T1_UNITS,
    check: isArabicG11TreeConsistent,
    document: arabicG11LessonDocument,
    source: EGYPT_ARABIC_G11_T1_BOOK.sourceUrl,
    lessons: 9,
  },
  {
    name: "English",
    units: EGYPT_ENGLISH_G11_T1_UNITS,
    check: isEnglishG11TreeConsistent,
    document: englishG11LessonDocument,
    source: EGYPT_ENGLISH_G11_T1_BOOK.sourceUrl,
    lessons: 18,
  },
  {
    name: "Chemistry",
    units: EGYPT_CHEMISTRY_G11_T1_UNITS,
    check: isChemistryG11TreeConsistent,
    document: chemistryG11LessonDocument,
    source: EGYPT_CHEMISTRY_G11_T1_BOOK.sourceUrl,
    lessons: 17,
  },
  {
    name: "History",
    units: EGYPT_HISTORY_G11_T1_UNITS,
    check: isHistoryG11TreeConsistent,
    document: historyG11LessonDocument,
    source: EGYPT_HISTORY_G11_T1_BOOK.sourceUrl,
    lessons: 16,
  },
  {
    name: "Physics",
    units: EGYPT_PHYSICS_G11_T1_UNITS,
    check: isPhysicsG11TreeConsistent,
    document: physicsG11LessonDocument,
    source: EGYPT_PHYSICS_G11_T1_BOOK.sourceUrl,
    lessons: 6,
  },
  {
    name: "Pure Mathematics",
    units: EGYPT_PURE_MATH_G11_T1_UNITS,
    check: isPureMathG11TreeConsistent,
    document: pureMathG11LessonDocument,
    source: EGYPT_PURE_MATH_G11_T1_BOOK.sourceUrl,
    lessons: 15,
  },
  {
    name: "General Mathematics",
    units: EGYPT_GENERAL_MATH_G11_T1_UNITS,
    check: isGeneralMathG11TreeConsistent,
    document: generalMathG11LessonDocument,
    source: EGYPT_GENERAL_MATH_G11_T1_BOOK.sourceUrl,
    lessons: 15,
  },
  {
    name: "Geography",
    units: EGYPT_GEOGRAPHY_G11_T1_UNITS,
    check: isGeographyG11TreeConsistent,
    document: geographyG11LessonDocument,
    source: EGYPT_GEOGRAPHY_G11_T1_BOOK.sourceUrl,
    lessons: 13,
  },
  {
    name: "Psychology and Sociology",
    units: EGYPT_PSYCHOLOGY_G11_T1_UNITS,
    check: isPsychologyG11TreeConsistent,
    document: psychologyG11LessonDocument,
    source: EGYPT_PSYCHOLOGY_G11_T1_BOOK.sourceUrl,
    lessons: 8,
  },
  {
    name: "Islamic Education",
    units: EGYPT_ISLAMIC_G11_T1_UNITS,
    check: isIslamicG11TreeConsistent,
    document: islamicG11LessonDocument,
    source: EGYPT_ISLAMIC_G11_T1_BOOK.sourceUrl,
    lessons: 9,
  },
  {
    name: "Christian Education",
    units: EGYPT_CHRISTIAN_G11_T1_UNITS,
    check: isChristianG11TreeConsistent,
    document: christianG11LessonDocument,
    source: EGYPT_CHRISTIAN_G11_T1_BOOK.sourceUrl,
    lessons: 9,
  },
  {
    name: "ICT",
    units: EGYPT_ICT_G11_T1_UNITS,
    check: isIctG11TreeConsistent,
    document: ictG11LessonDocument,
    source: EGYPT_ICT_G11_T1_BOOK.sourceUrl,
    lessons: 7,
  },
  {
    name: "Citizenship",
    units: EGYPT_CITIZENSHIP_G11_T1_UNITS,
    check: isCitizenshipG11TreeConsistent,
    document: citizenshipG11LessonDocument,
    source: EGYPT_CITIZENSHIP_G11_T1_BOOK.sourceUrl,
    lessons: 4,
  },
  {
    name: "Arabic Story",
    units: EGYPT_ARABIC_STORY_G11_T1_UNITS,
    check: isArabicStoryG11TreeConsistent,
    document: arabicStoryG11LessonDocument,
    source: EGYPT_ARABIC_STORY_G11_T1_BOOK.sourceUrl,
    lessons: 16,
  },
  {
    name: "Applied Mathematics",
    units: EGYPT_APPLIED_MATH_G11_T1_UNITS,
    check: isAppliedMathG11TreeConsistent,
    document: appliedMathG11LessonDocument,
    source: EGYPT_APPLIED_MATH_G11_T1_BOOK.sourceUrl,
    lessons: 11,
  },
  {
    name: "English as a Second Foreign Language",
    units: EGYPT_ENGLISH2_G11_T1_UNITS,
    check: isEnglish2G11TreeConsistent,
    document: english2G11LessonDocument,
    source: EGYPT_ENGLISH2_G11_T1_BOOK.sourceUrl,
    lessons: 12,
  },
  {
    name: "French First Language",
    units: EGYPT_FRENCH_G11_T1_UNITS,
    check: isFrenchG11TreeConsistent,
    document: frenchG11LessonDocument,
    source: EGYPT_FRENCH_G11_T1_BOOK.sourceUrl,
    lessons: 6,
  },
  {
    name: "French Second Language",
    units: EGYPT_FRENCH2_G11_T1_UNITS,
    check: isFrench2G11TreeConsistent,
    document: french2G11LessonDocument,
    source: EGYPT_FRENCH2_G11_T1_BOOK.sourceUrl,
    lessons: 5,
  },
  {
    name: "French Story",
    units: EGYPT_FRENCH_STORY_G11_T1_UNITS,
    check: isFrenchStoryG11TreeConsistent,
    document: frenchStoryG11LessonDocument,
    source: EGYPT_FRENCH_STORY_G11_T1_BOOK.sourceUrl,
    lessons: 6,
  },
  {
    name: "German",
    units: EGYPT_GERMAN_G11_T1_UNITS,
    check: isGermanG11TreeConsistent,
    document: germanG11LessonDocument,
    source: EGYPT_GERMAN_G11_T1_BOOK.sourceUrl,
    lessons: 5,
  },
  {
    name: "Italian",
    units: EGYPT_ITALIAN_G11_T1_UNITS,
    check: isItalianG11TreeConsistent,
    document: italianG11LessonDocument,
    source: EGYPT_ITALIAN_G11_T1_BOOK.sourceUrl,
    lessons: 6,
  },
  {
    name: "Spanish",
    units: EGYPT_SPANISH_G11_T1_UNITS,
    check: isSpanishG11TreeConsistent,
    document: spanishG11LessonDocument,
    source: EGYPT_SPANISH_G11_T1_BOOK.sourceUrl,
    lessons: 8,
  },
] as const;

describe("PHASE 185 — G11 Term 1 curriculum trees", () => {
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

  it("has the track-specific books on the right side of the split", () => {
    const tracks = (units: typeof EGYPT_ARABIC_G11_T1_UNITS) =>
      units.flatMap((unit) => unit.lessons.map((lesson) => lesson.key));
    expect(tracks(EGYPT_CHEMISTRY_G11_T1_UNITS)).toHaveLength(17);
    expect(tracks(EGYPT_HISTORY_G11_T1_UNITS)).toHaveLength(16);
    expect(tracks(EGYPT_PHYSICS_G11_T1_UNITS)).toHaveLength(6);
    expect(tracks(EGYPT_PURE_MATH_G11_T1_UNITS)).toHaveLength(15);
    expect(tracks(EGYPT_APPLIED_MATH_G11_T1_UNITS)).toHaveLength(11);
    expect(tracks(EGYPT_GENERAL_MATH_G11_T1_UNITS)).toHaveLength(15);
    expect(tracks(EGYPT_GEOGRAPHY_G11_T1_UNITS)).toHaveLength(13);
    expect(tracks(EGYPT_PSYCHOLOGY_G11_T1_UNITS)).toHaveLength(8);
  });
});
