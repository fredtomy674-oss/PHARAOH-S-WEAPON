import { describe, expect, it } from "vitest";
import {
  classifyLiveUtterance,
  normalizeForMatch,
  novelTokenCount,
  numberValue,
  shouldYieldFloor,
  tokenizeForMatch,
  visibleLiveCaption,
} from "./echoGuard.js";

/**
 * PHASE 169 — the owner-reported loop, proved closed here: his tutor «سمع صوته
 * ونطق ردّه… كأني أنا الذي أتكلم» and answered itself. These are the rules
 * that decide whose words a transcript is; they are pure and browser-free on
 * purpose, because this is the part that must never be wrong.
 */
describe("PHASE 169 — echo exclusion", () => {
  const tutor = "الجمع بإعادة التجميع يعني أن نجمع العشرات أولا ثم الوحدات. هذه خطوة مهمة";

  it("normalises Arabic for matching only (tashkeel, hamza forms, punctuation)", () => {
    expect(normalizeForMatch("الجَمْعُ بإعَادَةِ التَّجْمِيع!")).toBe("الجمع باعاده التجميع");
    expect(tokenizeForMatch("  نجمع، العشرات.  ")).toEqual(["نجمع", "العشرات"]);
    expect(tokenizeForMatch("***")).toEqual([]);
  });

  it("counts the words the tutor never said", () => {
    expect(novelTokenCount("بإعادة التجميع والعشرات", tutor)).toBe(0);
    expect(novelTokenCount("اشرح بمثال", tutor)).toBe(2);
    // A shared four-letter stem counts as the same word …
    expect(novelTokenCount("العشرتين", tutor)).toBe(0);
    // … but never for short words (a 3-letter stem would match too much).
    expect(novelTokenCount("ثم", tutor)).toBe(0);
    expect(novelTokenCount("من", tutor)).toBe(1);
  });

  it("with the tutor silent, everything heard is the student", () => {
    expect(
      classifyLiveUtterance({
        text: "بإعادة التجميع",
        tutorText: tutor,
        tutorAudible: false,
        tutorRecent: false,
        userVoice: false,
      }),
    ).toBe("user");
  });

  it("the tutor's own sentence can never become a question", () => {
    // The exact reported loop: the speaker read the tutor's words back.
    expect(
      classifyLiveUtterance({
        text: "بإعادة التجميع يعني أن نجمع",
        tutorText: tutor,
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("echo");
    // Even when the microphone *believes* it heard a voice: echo-rated words
    // are never the student's.
    expect(
      classifyLiveUtterance({
        text: "بإعادة التجميع يعني أن نجمع",
        tutorText: tutor,
        tutorAudible: true,
        tutorRecent: true,
        userVoice: true,
      }),
    ).toBe("echo");
  });

  it("a real interruption over the tutor is the student's", () => {
    expect(
      classifyLiveUtterance({
        text: "لحظة أستاذ اشرح بمثال",
        tutorText: tutor,
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("user");
    // One word that is not the tutor's needs the microphone's voice evidence.
    expect(
      classifyLiveUtterance({
        text: "لحظة",
        tutorText: tutor,
        tutorAudible: true,
        tutorRecent: true,
        userVoice: true,
      }),
    ).toBe("user");
    expect(
      classifyLiveUtterance({
        text: "لحظة",
        tutorText: tutor,
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("echo");
  });

  it("yields the floor only on real words (or real voice over the tutor)", () => {
    expect(shouldYieldFloor({ text: "بإعادة التجميع", tutorText: tutor, userVoiceRecently: false })).toBe(false);
    expect(shouldYieldFloor({ text: "لحظة", tutorText: tutor, userVoiceRecently: false })).toBe(false);
    expect(shouldYieldFloor({ text: "لحظة", tutorText: tutor, userVoiceRecently: true })).toBe(true);
    expect(shouldYieldFloor({ text: "اشرح بمثال", tutorText: tutor, userVoiceRecently: false })).toBe(true);
  });

  it("the live caption shows the student's words, never the echo", () => {
    expect(visibleLiveCaption({ text: "بإعادة التجميع", tutorText: tutor, tutorAudible: true })).toBe(false);
    expect(visibleLiveCaption({ text: "لحظة", tutorText: tutor, tutorAudible: true })).toBe(true);
    expect(visibleLiveCaption({ text: "بإعادة التجميع", tutorText: tutor, tutorAudible: false })).toBe(true);
  });
});

/**
 * PHASE 176 — the real phone's loop, reproduced from the database and proved
 * closed here. The owner's live session on build 175 heard him and answered —
 * then answered ITSELF five more times in four minutes: every echoed sentence
 * carried 2–4 recognizer slips (digit-vs-number, verb prefix, suffix, article)
 * and/or arrived after the 1.5s audible tail, so the 169 rules let it through
 * as a question. The strings below are verbatim from his session.
 */
describe("PHASE 176 — the words decide, even when the clock is wrong", () => {
  // The tutor's 23:22:39 reply, verbatim from the owner's session.
  const reply =
    "بارك الله فيك يا بطل على هذا التركيز الرائع! لو فتحت كتابك على صفحة رقم 7، ستجد بداية الفصل الثاني بعنوان \"الأمهات والآباء\" ضمن محور \"من أكون؟\". نرى في هذه الصفحة طفلاً وطفلة جميلين يلعبان بسعادة مع قطة صغيرة وسط الطبيعة الخضراء والزهور الملونة، وهما يمثلان الأطفال الذين نتعرف عليهم وعلى عائلاتهم في هذا الدرس.";

  it("recognises the slips the phone's recognizer makes on its own speaker", () => {
    // Verbatim leak tokens from the session, one per rule.
    expect(novelTokenCount("فصل", "ونتعرف عليهم في فصلنا الثاني")).toBe(0); // 3-letter word vs suffixed form
    expect(novelTokenCount("تعرفوا", "الذين نتعرف عليهم")).toBe(0); // verb prefix swapped
    expect(novelTokenCount("وزهور", "والزهور الملونة")).toBe(0); // glued conjunction + article
    expect(novelTokenCount("الصفحه", "في هذه الصفحة")).toBe(0); // article against bare form
  });

  it("the echoed description is the tutor, though it arrived after the audio ended", () => {
    // 23:23:11 — the message that kept the loop alive: 25 words, ~all the
    // tutor's, reported after the tail (audible false) — the old rules called
    // it "user" outright, before weighing a single word.
    expect(
      classifyLiveUtterance({
        text: "الصفحه طفلا وطفله جميلين يلعبان بسعاده مع قطه صغيره وسط الطبيعه الخضراء وزهور الملونه وهما يمثلان الاطفال الذين نتعرف عليهم وعلى عائلاتهم في هذا الدرس",
        tutorText: reply,
        tutorAudible: false,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("echo");
  });

  it("the echoed sentence with slips is the tutor, mid-speech", () => {
    // 23:23:33 — the other shape: arrived while the audio still played, with
    // «سبعه» for «7» and «ما تعرفوا» for «نتعرف» — "two novel words" under the
    // old rules, a sixth of the sentence under the share.
    expect(
      classifyLiveUtterance({
        text: "احسنت الوصفه يا بطل ففي صفحه رقم سبعه من كتابك نرى فعلا طفلا وطفله سعيدين في الطبيعه مع قطه جميله وهما يعبران عن الاطفال الذين ما تعرفوا عليهم في فصل الثاني الامهات والاباء",
        tutorText:
          "أحسنت الوصف يا بطل، ففي صفحة رقم 7 من كتابك، نرى فعلاً طفلاً وطفلةً سعيدين في الطبيعة مع قطة جميلة، وهما يعبران عن الأطفال الذين نتعرف عليهم في فصلنا الثاني \"الأمهات والآباء\".",
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("echo");
  });

  it("every genuine question the owner actually said still goes through", () => {
    // Verbatim His messages from the same session — 100% new words each.
    for (const text of ["خلينا نذاكر هنا احسن", "ممتاز يلا بينا نكمل"]) {
      expect(
        classifyLiveUtterance({ text, tutorText: reply, tutorAudible: true, tutorRecent: true, userVoice: false }),
      ).toBe("user");
    }
  });

  it("a question that reuses the lesson's words is still the student's", () => {
    // The real question genre: ask about the very topic the tutor just named.
    // «بإعادة التجميع» and «الجمع» are the tutor's; «اشرح» and «لي» are his.
    expect(
      classifyLiveUtterance({
        text: "اشرح لي الجمع بإعادة التجميع",
        tutorText: "الجمع بإعادة التجميع يعني أن نجمع العشرات أولا ثم الوحدات. هذه خطوة مهمة",
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("user");
  });

  it("a short answer is still the student's once the words rule can see it", () => {
    // «نعم» the moment the tutor is still audible: one new word, no probe on
    // a phone — held back (the asymmetry), exactly as in PHASE 175.
    expect(
      classifyLiveUtterance({
        text: "نعم",
        tutorText: reply,
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("echo");
    // …but once the tutor's voice is out of the window, nothing weighs it.
    expect(
      classifyLiveUtterance({
        text: "نعم",
        tutorText: reply,
        tutorAudible: false,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("user");
  });

  it("the tutor's echo never cuts the tutor off (no self-interruption)", () => {
    // Mid-speech fragments of the echoed sentence: mostly the tutor's words —
    // the old rule silenced the voice on "two new words", over and over.
    expect(
      shouldYieldFloor({
        text: "الصفحه طفلا وطفله جميلين يلعبان بسعاده",
        tutorText: reply,
        userVoiceRecently: false,
      }),
    ).toBe(false);
    // A real interruption over the voice still yields.
    expect(
      shouldYieldFloor({ text: "لحظة يا استاذ ما فهمت", tutorText: reply, userVoiceRecently: false }),
    ).toBe(true);
  });

  it("the caption hides the echoed sentence, keeps the student's words", () => {
    expect(
      visibleLiveCaption({
        text: "احسنت الوصفه يا بطل ففي صفحه رقم سبعه من كتابك نرى فعلا طفلا وطفله سعيدين",
        tutorText:
          "أحسنت الوصف يا بطل، ففي صفحة رقم 7 من كتابك، نرى فعلاً طفلاً وطفلةً سعيدين في الطبيعة مع قطة جميلة، وهما يعبران عن الأطفال الذين نتعرف عليهم في فصلنا الثاني \"الأمهات والآباء\".",
        tutorAudible: true,
      }),
    ).toBe(false);
    expect(
      visibleLiveCaption({ text: "لحظة يا استاذ ما فهمت", tutorText: reply, tutorAudible: true }),
    ).toBe(true);
  });
});

/**
 * PHASE 177 — the owner's third round, verbatim from the database: the 176
 * rules were right about shares and wrong about two facts. «رقم اثنان ستجد
 * تمرينا يوتيوب» — his tutor's own reply read back with «اثنان» heard for the
 * written «٢» — scored EXACTLY 40% new words, the boundary the genuine twin
 * «اشرح لي الجمع بإعادة التجميع» also sits on; numbers now compare as values,
 * so the echo falls to 1/5 while the genuine question keeps its 40%. And «تجد
 * في اول السطر عباره من اكون» — 0% new words — was answered at 00:02 because
 * every clock in the room had failed; the verbatim rule no longer needs one.
 */
describe("PHASE 177 — the number heard, and the sentence that needs no clock", () => {
  // The tutor's 23:59:40 reply, verbatim from the owner's session.
  const reply =
    "في صفحة رقم ٢ من كتابك، ننتقل إلى أنشطة ممتعة تتحدث عن الفواكه والخضراوات التي تغذي أجسامنا وتجعلنا أقوياء. لو فتحت صفحة رقم ٢ ستجد تمرينًا يطلب منك أن ترسم وتلون ما تحب من الفاكهة والخضراوات المذكورة في أول السطر مثل: عِنَب، وموز، وطماطم، وجزر. تمامًا مثلما نأكل التفاح الطازج في طابور الصباح لنشحن طاقتنا للحراسة واللعب، تمنحنا هذه الأطعمة النشاط.";

  it("numbers compare as numbers, digits or words", () => {
    expect(numberValue("٢")).toBe(2);
    expect(numberValue("2")).toBe(2);
    expect(numberValue("اثنان")).toBe(2);
    expect(numberValue("ثمانيه")).toBe(8);
    expect(numberValue("سبعه")).toBe(7);
    expect(numberValue("رقم")).toBeNull();
    expect(novelTokenCount("رقم اثنان", "صفحة رقم ٢ ورقم 2")).toBe(0);
    expect(novelTokenCount("ثمانيه سبعه", "صفحة 8 وصفحة 7")).toBe(0);
    expect(novelTokenCount("خمسه", "صفحة 4")).toBe(1);
  });

  it("the echoed slice «رقم اثنان…» is the tutor, mid-speech", () => {
    // 23:59:59 — the leak that sat exactly on the 40% boundary.
    expect(
      classifyLiveUtterance({
        text: "رقم اثنان ستجد تمرينا يوتيوب",
        tutorText: reply,
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("echo");
  });

  it("the genuine twin on the same boundary stays the student's", () => {
    // The exact string from the 176 block: 2 novel in 5 — the reason the share
    // boundary itself must never move.
    expect(
      classifyLiveUtterance({
        text: "اشرح لي الجمع بإعادة التجميع",
        tutorText: "الجمع بإعادة التجميع يعني أن نجمع العشرات أولا ثم الوحدات. هذه خطوة مهمة",
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("user");
  });

  it("four words or more, all the tutor's, is the tutor even with no clock left", () => {
    // 00:02:00 — 0% new words, sent while the room believed nobody spoke.
    expect(
      classifyLiveUtterance({
        text: "تجد في اول السطر عباره من اكون",
        tutorText:
          "بالتأكيد يا بطل، فأنت تفهم الفكرة بجمال وروعة! في صفحة رقم ١ من كتابك، تجد في أول السطر عبارة «من أكون؟»، وتليها في وسط السطر عبارة «الفصل الأول»، وتستقر في آخر السطر عبارة «صورتي الشخصية». عندما نتأمل هذه الصفحة، نعرف أن كل منا له وجه مميز وجميل، وعينان تريان الدنيا، وفم نبتسم به لأصدقائنا في الفصل.",
        tutorAudible: false,
        tutorRecent: false,
        tutorContext: true,
        userVoice: false,
      }),
    ).toBe("echo");
  });

  it("the late echo with two slips is the tutor while the floor is honest", () => {
    // 00:01:44 — 2 slips in 24 words (8%): caught by the share, once the room
    // reports its true floor (`roomSpeaking` / the claim count in the room).
    expect(
      classifyLiveUtterance({
        text: "كانك تمسك بيدك ورقه بيضاء لترسم عليها وجهك الجميل بعينين وثمن جميلين تماما مثلما ترسم مشكلته على السبوره في الفصل ليعرف اصدقائك من انت",
        tutorText:
          "تدلّنا صفحة رقم ١ في كتابك على بداية المحور الأول بعبارة «من أكون؟»، وتحتها في آخر السطر عبارة «الفصل الأول صورتي الشخصية». فكّر في الأمر كأنك تمسك بيدك ورقة بيضاء لترسم عليها وجهك الجميل بعينين وفم جميلين، تمامًا مثلما ترسم شكلك على السبورة في الفصل ليعرف أصدقاؤك من أنت.",
        tutorAudible: true,
        tutorRecent: true,
        userVoice: false,
      }),
    ).toBe("echo");
  });

  it("his genuine questions from the same session still pass", () => {
    for (const text of ["مش فاهم", "ممكن تكلميني", "ماشي كمل الشرح"]) {
      expect(
        classifyLiveUtterance({ text, tutorText: reply, tutorAudible: true, tutorRecent: true, userVoice: false }),
      ).toBe("user");
    }
  });

  it("short lesson-vocabulary answers are not dragged in by the verbatim rule", () => {
    // Two words of the lesson's own answer are exactly what a child says back.
    expect(
      classifyLiveUtterance({
        text: "صورتي الشخصيه",
        tutorText: "وتستقر في آخر السطر عبارة «صورتي الشخصية». عندما نتأمل هذه الصفحة",
        tutorAudible: false,
        tutorRecent: false,
        tutorContext: true,
        userVoice: false,
      }),
    ).toBe("user");
  });
});
