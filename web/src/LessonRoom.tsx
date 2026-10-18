// W2 — «غرفة الدرس» (the lesson room).
//
// The session used to be a chat: bubbles, a composer, a 🔊 button per reply.
// That is a *transport*, not a lesson. The room keeps every one of those
// behaviours (they are the product's contract with its tests and its users) but
// stages them like a classroom:
//
//   • the STAGE is the teacher's board (W2) — the student draws and writes on
//     it, and every mark travels with his next question. The textbook itself is
//     never shown (الأطلس §١٥ «المرجع لا النسخ»): the room names the page
//     («كتابك — صفحة ٦ من ٧») and the student opens his own copy;
//   • a ribbon shows where the student stands in the curriculum (unit, concept,
//     mastery) — progress in the book, not a chat counter;
//   • the AI tutor is a PRESENCE, not a human avatar: an honest, modern pulse
//     that is thinking / speaking / listening, because this collaboration is
//     exactly that — the student's own book plus an AI that teaches from it;
//   • the dialogue is a CAPTION STREAM, the way a spoken lesson is captioned,
//     so the student reads what it hears instead of scrolling a chat log.
//
// The chat screen's data-testids are preserved on purpose (the book stage's own
// testids went with the stage itself): the room is a presentation change, and
// nothing about behaviour or accessibility may regress with it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  attachmentUrl,
  endSession,
  fetchSpeechAudio,
  getPrerequisites,
  getSession,
  lessonContext,
  lessonStage,
  resetSpeechAvailability,
  sendMessage,
  streamMessage,
  streamSpeechAudio,
  ApiError,
  SpeechUnavailableError,
  type Breadcrumb,
  type LearningSession,
  type LessonStage,
  type Message,
  type PrerequisiteGraph,
  type TeachingAction,
  type TeachingActionType,
  type TutorLanguage,
  type User,
} from "./api.js";
import {
  canSpeakLanguage,
  localVoiceWedged,
  missingVoiceNotice,
  playAudioBlob,
  resetLocalVoice,
  speakText,
  speechRecognitionSupported,
  startTranscription,
  stopSpeaking,
  ttsSupported,
  type SttHandle,
} from "./voice.js";
import InkBoard from "./InkBoard.js";
import BoardChalk from "./BoardChalk.js";
import InkTools from "./InkTools.js";
import { composeInkBoard, type InkStroke, type InkTool } from "./ink.js";
import { createNarrator, type Narrator } from "./narrator.js";
import { createStreamedAudio, type AudioPiece, type StreamedAudio } from "./audioStream.js";
import NumberLine from "./NumberLine.js";
import FormattedText from "./FormattedText.js";
import { previewText, stripMarkdown } from "./format.js";
import { ThemeToggle } from "./components/ui/index.js";
import { LiveTeacher } from "./LiveTeacher.js";
import { useLiveTeacherPref } from "./liveTeacherPref.js";
import { useAutoReadPref, writeAutoReadPref } from "./autoReadPref.js";
import { createMouthReader } from "./avatar/mouthReader.js";
import { nextState, verdictEventFromReason, type AvatarEvent, type AvatarState } from "./avatar/avatarStates.js";

interface Props {
  user: User;
  session: LearningSession;
  onEnded: () => void;
}

const KIND_LABEL: Record<string, string> = {
  question: "سؤال",
  hint: "تلميح",
  example: "مثال",
  text: "",
};

/**
 * PHASE 93/95 — what the ENGINE decided the tutor should do this turn, shown to
 * the student as a small chip. The model performed it; the student can see the
 * teaching move, which turns a wall of prose into a legible lesson.
 */
const ACTION_LABEL: Record<TeachingActionType, string> = {
  explain: "يشرح الفكرة",
  diagnose: "يتحقق من فهمك",
  hint: "يمنحك تلميحًا",
  visual_explanation: "يشرح بطريقة بصرية",
  interactive_board: "يرسم على اللوح",
  textbook_reference: "يستند إلى الكتاب",
  practice: "يعرض تمرينًا",
  review_prerequisite: "يعيد بناء الأساس",
  celebrate_progress: "يحتفل بإجابتك",
  continue_learning: "ينتقل للفكرة التالية",
};

const ACTION_ICON: Record<TeachingActionType, string> = {
  explain: "💡",
  diagnose: "❓",
  hint: "🔎",
  visual_explanation: "🧩",
  interactive_board: "📐",
  textbook_reference: "📖",
  practice: "✏️",
  review_prerequisite: "↩️",
  celebrate_progress: "🎉",
  continue_learning: "➡️",
};

/** The extra fact an action carries (prerequisite / next idea / concept), or null. */
function actionDetail(action: TeachingAction): string | null {
  if (action.type === "review_prerequisite" && action.prerequisite) return `راجع معك: ${action.prerequisite}`;
  if (action.type === "continue_learning" && action.nextConcept) return `التالي: ${action.nextConcept}`;
  if (action.concept) return action.concept;
  return null;
}

// Mirrors the server cap (MAX_IMAGE_KB default 5000) for a friendlier UX error.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Mirrors the server cap (MAX_FILE_KB default 10000) for a friendlier UX error.
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

/** What the tutor is doing right now — the room's atmosphere, made explicit. */
type PresenceState = "idle" | "thinking" | "speaking" | "listening";

const PRESENCE_LABEL: Record<PresenceState, string> = {
  idle: "جاهز معك",
  thinking: "يقرأ الكتاب…",
  speaking: "يشرح لك",
  listening: "يستمع إليك…",
};

interface PendingDocument {
  name: string;
  size: number;
  dataUrl: string;
}

/**
 * PHASE 49 — the student's own message as it appears the instant he presses send.
 *
 * A placeholder id on purpose: it is replaced by the stored message the moment
 * the server reports it, and nothing is ever keyed off it. The alternative —
 * waiting for the server before showing his own words — moves a wait that has
 * nothing to do with the tutor onto the student.
 */
function optimisticMessage(
  sessionId: string,
  content: string,
  image: string | null | undefined,
  doc: PendingDocument | null,
  ink?: { strokes: number } | null,
): Message {
  const visual = doc || image || ink;
  const attachments: Message["attachments"] = visual
    ? [
        {
          id: "pending",
          messageId: "pending",
          mimeType: doc ? "application/octet-stream" : "image/jpeg",
          fileName: doc ? doc.name : image ? "صورة السؤال" : "رسم على السبورة",
          sizeBytes: doc ? doc.size : Math.round(((image ?? "").length || 200_000) * 0.75),
          ocr: false,
          ...(ink ? { inkStrokes: ink.strokes } : {}),
        },
      ]
    : undefined;
  return {
    id: "pending",
    sessionId,
    role: "user",
    kind: "text",
    content,
    createdAt: new Date().toISOString(),
    ...(attachments ? { attachments } : {}),
  };
}

/**
 * How a printed page is named to the student.
 *
 * The book's first page of a unit is an unnumbered opening page, so it carries no
 * printed number — calling it «صفحة 0» would send a student hunting for a "0" in
 * their book. Every other page is named by the number printed on it.
 */
function pageLabel(bookPage: number): string {
  return bookPage === 0 ? "صفحة الافتتاح" : `صفحة ${bookPage}`;
}

/**
 * PHASE 63 — the ribbon says which language the tutor will use. The label is a
 * function of the reply language the server resolved, so a French-medium lesson
 * announces French instead of the old English/Arabic pair.
 */
const TUTOR_LANGUAGE_LABEL: Record<TutorLanguage, string> = {
  ar: "🗿 الشرح بالعربية",
  en: "🗽 الشرح بالإنجليزية",
  fr: "🗼 الشرح بالفرنسية",
  de: "🏰 الشرح بالألمانية",
};

export function LessonRoom({ session, onEnded }: Props) {
  const [bc, setBc] = useState<Breadcrumb["breadcrumb"] | null>(null);
  const [tutorLanguage, setTutorLanguage] = useState<TutorLanguage>("ar");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<PendingDocument | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [tripwire, setTripwire] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // W2 — the lesson's place in the printed book: a REFERENCE, never a display.
  // The room names the page («كتابك — صفحة ٦ من ٧»); it never shows the book.
  const [stage, setStage] = useState<LessonStage | null>(null);
  // The page of his own copy the student follows on. The tutor's page
  // references move it; it travels with each question as the reading reference.
  const [refPage, setRefPage] = useState<number | null>(null);
  // The page chips («الصفحات») under the reference bar, open on demand.
  const [refPagesOpen, setRefPagesOpen] = useState(false);
  // PHASE 50 — «لوح الحبر»: the student's own marks on the board. They travel
  // with his next question (marks composited into one picture), and the board
  // is cleared once the tutor has them.
  const [inkStrokes, setInkStrokes] = useState<InkStroke[]>([]);
  const [inkReset, setInkReset] = useState(0);
  // PHASE 56 — the chosen tool lives in the room because the toolbar sits
  // beside the board it drives.
  const [inkTool, setInkTool] = useState<InkTool>("pen");
  // The board surface whose colour the exported picture keeps, so the picture
  // the tutor reads is the board the student drew on.
  const boardRef = useRef<HTMLDivElement | null>(null);
  // PHASE 49 — the turn in flight: the student's own words (shown the moment he
  // presses send) and the part of the tutor's answer written so far. Replaced by
  // the stored pair when the turn ends, so nothing shown here is ever the record.
  const [live, setLive] = useState<{ user: Message | null; text: string } | null>(null);
  const [mastery, setMastery] = useState<number | null>(null);
  /**
   * PHASE 95 — the lesson's prerequisite graph with the student's real mastery:
   * the ribbon chip and the «خريطة المفاهيم» panel both read from it.
   */
  const [conceptMap, setConceptMap] = useState<PrerequisiteGraph | null>(null);
  // PHASE 162 (W7) — «المعلّم الحيّ»: قرار الطالب (تفضيل محلي) + آلة الحالات
  // الثماني + قارئ الفم. الآلة نفسها محضة ومختبَرة — الغرفة تُطلق أحداثًا
  // حقيقية فقط، وما لا حدث له لا يُعرض (الصمت لا يُفسَّر).
  const liveTeacherOn = useLiveTeacherPref();
  // PHASE 166 — «القراءة التلقائية»: كل رد يُسمع فور وصوله — طلب المالك
  // الصريح («اريد ان يكون الرد تلقائى مستمع بدون الحاجه الى الضغط على زر
  // الاستماع») — وزر 🔊 في كل رسالة يبقى «الاستماع مرة أخرى». تفضيل محلي،
  // افتراضيًا مفتوح، وإطفاؤه قرار الطالب وحده.
  const autoRead = useAutoReadPref();
  const [teacherState, setTeacherState] = useState<AvatarState>("idle");
  const [mouth] = useState(createMouthReader);
  const fireTeacher = useCallback((event: AvatarEvent) => {
    setTeacherState((state) => nextState(state, event));
  }, []);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const captionsRef = useRef<HTMLDivElement | null>(null);
  // PHASE 56 — measured on a 390×844 phone: the room opened 651px down the
  // page. `scrollIntoView` on the transcript's last line moves every scrollable
  // ancestor, and on a phone the transcript is NOT a scroll container (the page
  // is), so the room opened with the book page scrolled off the top. The page
  // may only move once the room has finished opening.
  const roomOpening = useRef(true);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const docRef = useRef<HTMLInputElement | null>(null);
  const sttRef = useRef<SttHandle | null>(null);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  // PHASE 167 — the wedged-engine notice fires once per room, not once per
  // reply: it is a state of the page, not of any single answer.
  const wedgedNoticeShown = useRef(false);
  // Bumped on every press/stop: a fetch that comes back late must not start
  // playing a reply the student already moved on from.
  const speechToken = useRef(0);
  const voiceTurnRef = useRef(false);
  // PHASE 56 — the reply being heard while it is still arriving (see
  // `narrator.ts`): it speaks each sentence the moment it is complete, and
  // reports `broken` when this machine has no voice for Arabic so the room can
  // fall back to the server's narration of the whole reply.
  const narratorRef = useRef<Narrator | null>(null);
  // PHASE 57 — the reply being heard while it is still arriving, from the
  // SERVER's voice: the pieces of a turn (or of a 🔊 press) are played as each
  // sentence lands, so the first note no longer waits for the last one.
  const streamedRef = useRef<StreamedAudio | null>(null);
  // Aborts the in-flight 🔊 stream, so a reply the student stopped listening to
  // does not keep the server synthesizing sentences nobody will hear.
  const speechAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    resetSpeechAvailability();
    lessonContext(session.lessonId)
      .then(({ breadcrumb, replyLanguage }) => {
        setBc(breadcrumb);
        setTutorLanguage(replyLanguage);
      })
      .catch(() => undefined);
    // The lesson's page map is a REFERENCE (W2): the printed pages this lesson
    // occupies, so the room can say «كتابك — صفحة ٦ من ٧». No map → no bar; the
    // room still teaches from the book's content.
    lessonStage(session.lessonId)
      .then((s) => {
        setStage(s);
        setRefPage(s?.fromBookPage ?? null);
      })
      .catch(() => setStage(null));
    // The ribbon's mastery chip: the concept this lesson teaches, and how much
    // of it the student already owns. Both are best-effort decoration.
    // PHASE 95 — the same call also loads the lesson's prerequisite graph (the
    // concept order + real percentages) for the «خريطة المفاهيم» panel.
    getPrerequisites(session.lessonId)
      .then((graph) => {
        setConceptMap(graph);
        const first = graph.nodes[0];
        if (first && first.percent !== null) setMastery(first.percent);
      })
      .catch(() => undefined);
    getSession(session.id)
      .then((res) => {
        setMessages(res.messages);
        setTripwire(res.messages.some((m) => m.kind === "safety"));
      })
      .catch(() => undefined);
  }, [session.id, session.lessonId]);

  useEffect(() => {
    // The transcript is its own scroll container on a desktop: positioning it
    // here leaves the ribbon and the composer exactly where they are.
    const box = captionsRef.current;
    if (box) box.scrollTop = box.scrollHeight;
    // Only a reply that arrives while the room is in use may move the page
    // (a phone scrolls the document, so the newest line has to be brought into
    // view). While the room is still opening, the student must land on the
    // board — that is what the room is for.
    if (roomOpening.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, live]);

  // Stop any voice activity when leaving the room.
  useEffect(
    () => () => {
      stopSpeaking();
      sttRef.current?.stop();
    },
    [],
  );

  const presence: PresenceState = listening ? "listening" : speaking ? "speaking" : pending ? "thinking" : "idle";

  // PHASE 162 (W7.2) — ربط الحالات الثماني بأحداث المحرك الحقيقية.
  // كل حدث خارج حالته no-op، فإعادة التوفيق تصل إلى ثباتها في جولة أو جولتين
  // (تساوي الحالة يُوقف setState). الأولوية: الصوت، ثم التفكير، ثم الاستماع.
  useEffect(() => {
    if (speaking) fireTeacher("audio-start");
    else if (pending) fireTeacher("thinking-start");
    else {
      // انتهى الدور بلا صوت: «التفكير» ينتهي بحدثه الخاص، والصوت كذلك.
      fireTeacher("reply-done");
      fireTeacher("audio-end");
    }
    if (listening) fireTeacher("mic-open");
    else fireTeacher("mic-close");
  }, [speaking, pending, listening, teacherState, fireTeacher]);

  // إطفاء/تشغيل المفتاح — فورًا وفي نفس الجلسة (التفضيل يشترك مع الغرفة).
  useEffect(() => {
    fireTeacher(liveTeacherOn ? "toggle-on" : "toggle-off");
  }, [liveTeacherOn, fireTeacher]);

  // الحكم يصل كسبب على «الإجراء التعليمي» الأخير؛ ويُقرأ لكل رسالة معلّم
  // جديدة مرة واحدة. رسالة تحمل إجراءً تعليميًا بلا حكم (تلميح، شرح…) سببها
  // لا يطابق ولا حكم — فلا تُطلق شيئًا. دخول الغرفة ليس حدثًا جديدًا.
  const lastVerdict = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m?.role === "tutor") {
        return { key: `${m.id}:${m.teachingAction?.reason ?? ""}`, event: verdictEventFromReason(m.teachingAction?.reason) };
      }
    }
    return null;
  }, [messages]);
  const lastVerdictKey = useRef<string | null>(null);
  useEffect(() => {
    if (!lastVerdict) return;
    const previous = lastVerdictKey.current;
    lastVerdictKey.current = lastVerdict.key;
    if (previous === null || previous === lastVerdict.key) return;
    if (lastVerdict.event) fireTeacher(lastVerdict.event);
  }, [lastVerdict, fireTeacher]);

  // وضع الحكم يُعرض لحظته ثم تمضي الحصة (توقيت عرض حكم حقيقي — لا ابتداع).
  useEffect(() => {
    if (teacherState !== "correct" && teacherState !== "partial" && teacherState !== "incorrect") return;
    const timer = window.setTimeout(() => fireTeacher("verdict-settle"), 3200);
    return () => window.clearTimeout(timer);
  }, [teacherState, fireTeacher]);

  const pages = stage?.pages ?? [];
  /** Move the reference bar to one printed page (the tutor's refs, page chips). */
  const goToBookPage = useCallback((bookPage: number) => {
    setRefPage(bookPage);
    setRefPagesOpen(false);
  }, []);
  /** The concept the board is teaching right now — the engine's own move, or the
      lesson's first concept. The board's chip; never an invented fact. */
  const boardConcept = useMemo(() => {
    const lastAction = [...messages].reverse().find((m) => m.role === "tutor" && m.teachingAction)?.teachingAction;
    return lastAction?.concept ?? conceptMap?.nodes[0]?.title ?? null;
  }, [messages, conceptMap]);

  /**
   * PHASE 166 — what the teacher is writing on the board: the newest tutor
   * reply that brought a write-up. A new reply wipes and rewrites it, the way
   * a classroom board is used while the lesson moves on; every earlier draft
   * stays in the transcript. Keyed by its message, so arriving chalk replays
   * its `chalk-in` animation without ever touching an old line.
   */
  const activeBoard = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m?.role === "tutor" && m.board && (m.board.lines.length > 0 || m.board.title)) {
        return { key: m.id, board: m.board };
      }
    }
    return null;
  }, [messages]);

  /**
   * PHASE 167 — the honest end of a wedged engine. The old room answered the
   * wedge with silence: replies stopped being read, and the 🔊 button went dead
   * with no word of explanation. The engine is genuinely wedged for this page
   * load, so the room says so — once per room — with the one act that really
   * clears a wedge: a reload.
   */
  const showWedgedNotice = () => {
    if (wedgedNoticeShown.current) return;
    wedgedNoticeShown.current = true;
    setError("تعطّل صوت هذا الجهاز في المتصفح — أعد تحديث الصفحة (اسحب للأسفل) ليعود الصوت");
  };

  /**
   * PHASE 40 (D-044) — read a reply aloud with the *browser's* own voice: the
   * fallback for when the server has no voice. The missing-voice notice fires
   * only here, because only here does the machine's voice decide what is
   * actually heard.
   */
  const speakLocally = (text: string) => {
    if (!ttsSupported()) return;
    // PHASE 167 — a wedged engine used to answer with silence: the 🔊 button
    // looked identical on a dead machine and a muted one. Never pretend again.
    if (localVoiceWedged()) {
      showWedgedNotice();
      return;
    }
    // PHASE 78 — never hand the reply to the machine's default voice just because
    // it has no voice for this language: speechSynthesis then reads the text with
    // whatever it has (usually en-US), so an Arabic reply is *heard* in English —
    // the "listening switched to English" defect. The progressive narrator already
    // asks before speaking for this exact reason; the last-resort path must ask
    // too, or a server-voice outage turns every Arabic reply into English. Silent
    // plus the actionable notice is the honest outcome.
    if (!canSpeakLanguage(tutorLanguage)) {
      setError(missingVoiceNotice(tutorLanguage));
      return;
    }
    const { utterance, missingVoice } = speakText(text, tutorLanguage, () => {
      if (activeUtterance.current === utterance) setSpeaking(false);
      // PHASE 167 — the attempt may have just died of the wedge (the watchdog
      // set it while trying): the silence that remains gets its explanation.
      if (localVoiceWedged()) showWedgedNotice();
    });
    if (!utterance) return;
    activeUtterance.current = utterance;
    // PHASE 162 — وضع المتصفح التقريبي: حدود الكلمات نبضات حقيقية للفم.
    utterance.addEventListener("boundary", () => mouth.pulse());
    setSpeaking(true);
    if (missingVoice) setError(missingVoiceNotice(tutorLanguage));
  };

  /**
   * PHASE 56 — the narrator for one turn: the machine's own voice, speaking
   * whole sentences as they arrive.
   *
   * It reports `missingVoice` instead of raising the notice itself, because a
   * missing local voice is no longer the end of the road: the room falls back to
   * the server's narration of the whole reply (`speak`), and only *that* path
   * decides whether the machine ends up silent.
   */
  const createProgressiveNarrator = (): Narrator =>
    createNarrator({
      onSpeaking: setSpeaking,
      speak: (text, onDone) => {
        if (!ttsSupported()) return { started: false, missingVoice: false };
        // PHASE 166 — a wedged engine (the watchdog declared it): stop asking.
        // The room reads the reply from the server's voice instead.
        if (localVoiceWedged()) return { started: false, missingVoice: false };
        // PHASE 56 — ask BEFORE speaking: `speakText` reports a missing voice only
        // after handing the text over, so without this the very first sentence of
        // an Arabic reply would be read aloud in the machine's English voice.
        if (!canSpeakLanguage(tutorLanguage)) return { started: false, missingVoice: true };
        const { utterance, missingVoice } = speakText(text, tutorLanguage, () => {
          if (activeUtterance.current === utterance) {
            activeUtterance.current = null;
            setSpeaking(false);
          }
          // PHASE 167 — whichever attempt dies of the wedge (the narrator's own
          // sentences included), the silence gets its one honest explanation.
          if (localVoiceWedged()) showWedgedNotice();
          onDone();
        });
        if (utterance) {
          activeUtterance.current = utterance;
          utterance.addEventListener("boundary", () => mouth.pulse());
        }
        return { started: !!utterance, missingVoice };
      },
    });

  const stopReading = () => {
    // Invalidate any narration still in flight before silencing the current one.
    speechToken.current += 1;
    // PHASE 57 — stop the *streamed* voice too: it is a queue of scheduled audio
    // buffers, so it keeps talking after `speechSynthesis.cancel()` is called, and
    // it keeps the server synthesizing unless the request is aborted as well.
    speechAbort.current?.abort();
    speechAbort.current = null;
    streamedRef.current?.stop();
    streamedRef.current = null;
    narratorRef.current?.stop();
    narratorRef.current = null;
    // PHASE 162 — لا مظروف صوت بعد الآن: الفم يعود مغلقًا بتدرّج.
    mouth.setAnalyser(null);
    stopSpeaking();
    activeUtterance.current = null;
    setSpeaking(false);
  };

  /**
   * PHASE 57 — play a voice stream piece by piece, and fall back only if it must.
   *
   * `open` hands over each playable piece as it arrives and resolves `true` when
   * the server had a voice at all. `fallback` runs when progressive playback
   * cannot deliver one: no Web Audio at all, a server with no voice, or a piece
   * that would not decode. Resolves `true` when the pieces took the reply, so the
   * caller never falls back twice.
   *
   * It resolves as soon as the last piece has *arrived*, not when playback ends:
   * waiting would make a click handler wait for the whole answer.
   */
  const playStreamed = async (
    token: number,
    open: (emit: (piece: AudioPiece) => void) => Promise<boolean>,
    fallback: () => void,
  ): Promise<boolean> => {
    const abandon = (): void => {
      // A stop the student asked for is not a failure to recover from.
      if (token !== speechToken.current) return;
      streamedRef.current?.stop();
      streamedRef.current = null;
      // PHASE 162 — الصوت توقّف: لا مظروف يُقرأ بعد الآن.
      mouth.setAnalyser(null);
      setSpeaking(false);
      fallback();
    };
    const player = createStreamedAudio({
      onStart: () => {
        if (token === speechToken.current) {
          setSpeaking(true);
          // PHASE 162 (W7.2) — الفم يزامن الـWAV الخادمي نفسه: نُقرأ نفس
          // الرسم البياني الذي يُسمعه الطالب (مظروف حقيقي، لا إيقاع مُصنَّع).
          mouth.setAnalyser(player.analyser);
        }
      },
      onDone: () => {
        if (token === speechToken.current) {
          mouth.setAnalyser(null);
          setSpeaking(false);
        }
      },
      onError: abandon,
    });
    if (!player.usable) return false;
    streamedRef.current = player;
    let heard = 0;
    try {
      const served = await open((piece) => {
        heard += 1;
        player.push(piece);
      });
      // Nothing playable came back: the server has no voice, or it broke before
      // the first piece. Say it now rather than leaving the reply unheard.
      if (token !== speechToken.current) return true;
      if (!served || heard === 0) {
        player.stop();
        if (streamedRef.current === player) streamedRef.current = null;
        abandon();
        return false;
      }
      player.end();
      return true;
    } catch {
      abandon();
      return false;
    }
  };

  /**
   * PHASE 40 (D-044) — read a reply aloud.
   *
   * Three paths, fastest first: the server's voice **progressively** (its first
   * sentence plays as soon as it exists — ~3s measured, and it is the only path
   * that works with no voice installed on this machine), then the same server
   * audio in one piece (the route a download or an old browser wants), and last
   * the browser's own voice. So the button is never dead, never silent, and never
   * waits for the whole reply before it makes a sound.
   */
  const speak = async (message: Message) => {
    stopReading();
    const token = speechToken.current;
    // Spoken words, not syntax: the bubble may hold **bold** and lists.
    const withLocalVoice = () => speakLocally(stripMarkdown(message.content));
    /** The whole reply's audio in one piece, then the machine's own voice. */
    const buffered = async () => {
      try {
        const blob = await fetchSpeechAudio(session.id, message.id);
        if (token !== speechToken.current) return;
        const handle = playAudioBlob(blob, {
          onStart: () => {
            if (token === speechToken.current) setSpeaking(true);
          },
          onDone: () => {
            if (token === speechToken.current) setSpeaking(false);
          },
          onError: () => {
            if (token === speechToken.current) withLocalVoice();
          },
        });
        if (!handle) withLocalVoice();
      } catch (err) {
        if (token !== speechToken.current) return;
        if (!(err instanceof SpeechUnavailableError)) {
          setError(err instanceof ApiError ? err.message : "تعذّر تحضير الصوت");
          return;
        }
        withLocalVoice();
      }
    };
    const abort = new AbortController();
    speechAbort.current = abort;
    await playStreamed(
      token,
      async (emit) => {
        let served = false;
        await streamSpeechAudio(
          session.id,
          message.id,
          {
            onAudio: emit,
            onAudioEnd: (ok) => {
              served = ok;
            },
          },
          abort.signal,
        );
        return served;
      },
      () => void buffered(),
    );
  };

  const toggleTranscription = () => {
    if (listening) {
      sttRef.current?.stop();
      return;
    }
    if (!speechRecognitionSupported()) {
      setError("التعرف على الكلام غير مدعوم في هذا المتصفح — جرّب Chrome أو Edge");
      return;
    }
    setError(null);
    const handle = startTranscription({
      onTranscript: (transcript) => {
        voiceTurnRef.current = true;
        setInput((prev) => (prev ? `${prev.trimEnd()} ${transcript}` : transcript));
      },
      onEnd: () => setListening(false),
      onError: (message) => {
        setListening(false);
        if (message) setError(message);
      },
    }, tutorLanguage);
    if (!handle) {
      setError("تعذر بدء التعرف على الكلام — أعد المحاولة");
      return;
    }
    sttRef.current = handle;
    setListening(true);
  };

  const send = async (content: string, image?: string | null, doc: PendingDocument | null = null, widget: { value: number } | null = null) => {
    const text = content.trim();
    // PHASE 166 — who hears this reply: the auto-read preference (ON by
    // default — the owner asked for every reply to be heard without pressing
    // anything) or a question that arrived through the microphone. The 🔊
    // button on any message stays "listen again".
    const speakReply = autoRead || voiceTurnRef.current;
    voiceTurnRef.current = false;
    // PHASE 50 — marks on the board travel with the question automatically: the
    // student drew them *as* his question, so asking must never leave them
    // behind. A photo and marks are mutually exclusive (one visual per turn) —
    // the composer already enforces "last act wins", this is the backstop.
    const marks = !image && !doc ? inkStrokes : [];
    if ((!text && !image && !doc && !widget && marks.length === 0) || pending) return;
    // The room has finished opening: from now on a reply may bring itself into
    // view (PHASE 56 — measured, the opening itself must not move the page).
    roomOpening.current = false;
    setPending(true);
    setError(null);
    // The picture the tutor sees is the board *as marked*: composited here from
    // the same surface the student draws on — its colour included, so the two
    // views agree. Never a screenshot of the whole app.
    let ink: { dataUrl: string; strokes: number } | undefined;
    if (marks.length > 0) {
      try {
        const surface = boardRef.current ? getComputedStyle(boardRef.current).backgroundColor : "";
        const composed = await composeInkBoard(marks, surface || undefined);
        ink = { dataUrl: composed.dataUrl, strokes: marks.length };
      } catch {
        setPending(false);
        setError("تعذر إرفاق رسمك — تحقق من الاتصال وحاول مرة أخرى");
        return;
      }
    }
    // PHASE 48 — the page of his own book the student follows on travels with
    // the turn, so the tutor reads the same page before answering. It is a
    // reference the room named, never a page it showed (W2).
    const onPage = refPage ?? undefined;
    const page = onPage !== undefined ? { bookPage: onPage } : {};
    const pin = widget ? { widget: { value: widget.value } } : {};
    // PHASE 57/166 — whose voice reads this reply. When this machine has a voice
    // for the reply's language (the normal machine), it speaks each sentence as it
    // arrives — instant, and free. When it does not, the SERVER narrates the turn
    // as it is written and the pieces arrive on the same stream as the text. Only
    // one of the two is ever asked for: narration is paid per character. An
    // engine the watchdog has declared wedged is never asked again — the server
    // (or nothing, honestly) reads instead.
    const localVoice = speakReply && ttsSupported() && canSpeakLanguage(tutorLanguage) && !localVoiceWedged();
    // PHASE 57 — so the server narrates this turn only when this machine cannot
    // speak it, and only when someone is meant to hear it (PHASE 166: the
    // auto-read preference, or a voice-asked question). Every question shape
    // carries the flag, because whether the answer is read aloud has never
    // depended on the photo, document or ink that came with the question.
    const askServer = speakReply && !localVoice;
    const voice = askServer ? { speak: true } : {};
    const body = doc
      ? { content: text, document: { dataUrl: doc.dataUrl, fileName: doc.name }, ...page, ...pin, ...voice }
      : image
        ? { content: text, image: { dataUrl: image }, ...page, ...pin, ...voice }
        : ink
          ? { content: text, ink, ...page, ...pin, ...voice }
          : { content: text, ...page, ...pin, ...voice };
    try {
      // PHASE 49 — the reply is written as it is thought, so the room shows a
      // tutor thinking instead of a waiting cursor. The student's own words
      // appear immediately: they are already stored by the time the first word
      // of the answer exists, and waiting would move the wait onto him.
      setLive({ user: optimisticMessage(session.id, text, image, doc, ink ? { strokes: ink.strokes } : null), text: "" });
      // The live path is an improvement, never a new way for a turn to fail: if
      // the stream cannot even start (a buffering proxy, an old browser, a dead
      // socket) the question is simply asked the old way instead. The retry is
      // allowed only while NOTHING has arrived — once the server has spoken, the
      // turn is very likely stored, and asking again would make the student pay
      // for it twice.
      let arrived = false;
      // PHASE 56 — the voice starts with the first sentence instead of waiting
      // for the turn to be stored and its audio to be fetched.
      const narrator = localVoice ? createProgressiveNarrator() : null;
      narratorRef.current = narrator;
      // PHASE 57 — the server's voice for this turn, played as the sentences
      // arrive. Created before the request, because the first piece can arrive
      // with the first lines of text.
      let streamed: StreamedAudio | null = null;
      let serverHeard = 0;
      let serverSilent = false;
      let streamBroken = false;
      let retracted = false;
      if (askServer) {
        const player = createStreamedAudio({
          onStart: () => setSpeaking(true),
          onDone: () => setSpeaking(false),
          onError: () => {
            // The queue cannot play what it was given; the stored reply is read
            // by `speak` below instead, which walks the same paths in order.
            streamBroken = true;
          },
        });
        if (player.usable) {
          streamed = player;
          streamedRef.current = player;
        }
      }
      const turn = await streamMessage(session.id, body, {
        onUser: (message) => {
          arrived = true;
          setLive((l) => (l ? { ...l, user: message } : l));
        },
        onDelta: (chunk) => {
          arrived = true;
          setLive((l) => {
            const text = l ? l.text + chunk : chunk;
            // Only text the room is showing is ever spoken, so what is heard and
            // what is read cannot disagree.
            narrator?.feed(text);
            return l ? { ...l, text } : l;
          });
        },
        // PHASE 57 — the pieces of the reply's voice, in the order they were
        // spoken. The server releases them by sentence, so they arrive 0..n.
        onAudio: (piece) => {
          serverHeard += 1;
          streamed?.push(piece);
        },
        onAudioEnd: (ok) => {
          if (!ok) serverSilent = true;
        },
        onDiscard: () => {
          arrived = true;
          retracted = true;
          // Words the room took back must not stay in the air — and the corrected
          // answer must still be spoken, so the narrator forgets rather than stops.
          stopSpeaking();
          activeUtterance.current = null;
          // PHASE 57 — a server cannot unsend audio it has already released, so the
          // queue is silenced here and the corrected reply is read in full below.
          streamed?.stop();
          narrator?.retract();
          setLive((l) => (l ? { ...l, text: "" } : l));
        },
      }).catch((err) => {
        if (arrived) throw err;
        return sendMessage(
          session.id,
          text,
          image ? { dataUrl: image } : undefined,
          doc ? { dataUrl: doc.dataUrl, fileName: doc.name } : undefined,
          onPage,
          ink,
          widget ?? undefined,
        );
      });
      setLive(null);
      setMessages((m) => [...m, turn.userMessage, turn.tutorMessage]);
      // PHASE 48/W2 — the pages this answer was built from are a REFERENCE: the
      // bar moves to the first page the answer cites, and the other cited pages
      // stay visible on the bubble itself. The student opens his own copy — the
      // room never shows the book, and it never yanks a page out from under him.
      const cited = turn.tutorMessage.bookPages ?? [];
      if (cited.length > 0) setRefPage(cited[0]!);
      setRemaining(turn.remainingBudget);
      if (turn.safetyTripwire) setTripwire(true);
      // Only clear the composer when it still holds the text we just sent —
      // never clobber newer typing that arrived while the turn was in flight.
      setInput((prev) => (prev.trim() === text ? "" : prev));
      setPreview(null);
      setDocFile(null);
      // The marks reached the tutor with this question — clear the board so the
      // next question starts from a clean board.
      if (ink) setInkReset((n) => n + 1);
      // PHASE 56/57 — how this turn ends being heard, in the order that gives the
      // student a voice soonest: this machine's own sentence by sentence when it
      // has one, otherwise the server's, piece by piece. Whatever could not be
      // heard at all (no local voice, no server voice, a queue that broke) is read
      // by `speak`, which walks the same three paths for the stored reply — so a
      // voice problem never costs the student his answer.
      if (askServer) {
        if (streamed && !serverSilent && !streamBroken && !retracted && serverHeard > 0) {
          // Every piece has arrived: the last one plays without waiting.
          streamed.end();
        } else {
          // Nothing was heard from the server — it said so, or never spoke at all.
          // The stored reply is read instead, so the answer is never lost.
          streamed?.stop();
          void speak(turn.tutorMessage);
        }
      } else if (narrator && !narrator.broken) {
        // The machine read the reply as it arrived; only the tail is left.
        narrator.finish(turn.tutorMessage.content);
      } else if (speakReply) {
        // This machine's voice refused the sentence it was on — a language it
        // claimed but cannot really speak. The server can only be asked for a reply
        // by *id*, so it reads the whole reply from the top and the sentences this
        // machine managed are heard again: a repeat is a smaller harm than a gap in
        // the answer. What the machine *had* read still matters for the last resort
        // inside `speak`, where no ids are involved: that voice reads only the part
        // nobody heard, so the answer is never skipped.
        const gap = narrator?.unheard();
        const content = gap && !gap.heardNothing && gap.tail.trim() ? gap.tail : turn.tutorMessage.content;
        void speak({ ...turn.tutorMessage, content });
      }
      if (streamedRef.current === streamed) streamedRef.current = null;
      // PHASE 167 — a working narrator may still be reading the tail `finish`
      // queued after the turn ended. Clearing the ref here used to orphan it:
      // a later 🔊 could no longer silence it, and its next sentence raced the
      // new reading to the same engine — the loser was cancelled mid-wedge, so
      // a genuinely wedged engine could die without anyone saying why. The ref
      // is replaced by the next turn's narrator anyway.
      if (narratorRef.current === narrator && (!narrator || narrator.broken)) narratorRef.current = null;
    } catch (err) {
      setLive(null);
      // PHASE 57 — a turn that failed mid-stream may already have started talking
      // (this machine's own voice, or a piece from the server). Silence *this*
      // turn's voice: the student is about to be told the turn failed, and nothing
      // else the room is reading — an older reply on 🔊 — is theirs to lose.
      streamedRef.current?.stop();
      streamedRef.current = null;
      narratorRef.current?.stop();
      narratorRef.current = null;
      stopSpeaking();
      // A turn that failed mid-stream may still have been stored on the server,
      // so the room is re-read rather than left disagreeing with the database.
      await syncMessages();
      setError(err instanceof ApiError ? err.message : "تعذر إرسال الرسالة");
    } finally {
      setPending(false);
    }
  };

  /** Re-reads the transcript from the server (used after a half-finished turn). */
  const syncMessages = async () => {
    try {
      const res = await getSession(session.id);
      setMessages(res.messages);
    } catch {
      /* the error the student already sees is the important one */
    }
  };

  /**
   * PHASE 51 — the student placed the pin and asks for the verdict. The words
   * say what he did; the value travels as a fact the tutor verifies against
   * the line's own key.
   */
  const verifyPin = (value: number) => {
    const shown = String(Math.round(value * 1e6) / 1e6);
    void send(`وضعت الدبوس عند ${shown}`, null, null, { value });
  };

  const onInkChange = useCallback((list: InkStroke[]) => {
    setInkStrokes(list);
    if (list.length > 0) setPreview(null);
  }, []);

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      setError("صيغة الصورة غير مدعومة (PNG أو JPEG أو WebP فقط)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("الصورة كبيرة جدًا — الحد الأقصى 5 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(typeof reader.result === "string" ? reader.result : null);
      setDocFile(null);
      // One visual per turn: a picked photo replaces the board marks.
      setInkStrokes([]);
      setInkReset((n) => n + 1);
    };
    reader.onerror = () => setError("تعذر قراءة الصورة المرفقة");
    reader.readAsDataURL(file);
  };

  const onPickDocument = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_DOCUMENT_MIMES.includes(file.type)) {
      setError("صيغة الملف غير مدعومة (PDF أو DOCX أو TXT أو MD فقط)");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("الملف كبير جدًا — الحد الأقصى 10 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDocFile({ name: file.name, size: file.size, dataUrl: reader.result });
        setPreview(null);
      }
    };
    reader.onerror = () => setError("تعذر قراءة الملف المرفق");
    reader.readAsDataURL(file);
  };

  const formatSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  }, []);

  const end = async () => {
    if (!window.confirm("إنهاء الجلسة والانتقال للرئيسية؟")) return;
    try {
      await endSession(session.id);
    } catch {
      // still leave the room
    }
    onEnded();
  };

  const b = bc;

  return (
    <div className="room" data-testid="room">
      {/* ---- the ribbon: where the student stands in the book ---- */}
      <header className="room-ribbon" data-testid="room-ribbon">
        <div className="room-ribbon-where">
          <div>
            <strong data-testid="room-lesson-title">{b ? b.lesson.title : "الجلسة"}</strong>
            <div className="muted small" data-testid="lesson-context-line">
              {b ? `${b.grade.nameAr} • ${b.subject.nameAr} • ${b.unit.title}` : ""}
            </div>
          </div>
          {/* PHASE 38/D-042 — say out loud which language the tutor will use, so
              a student in a language curriculum is not surprised by the reply. */}
          {b && (
            <span className="lang-chip" data-testid="tutor-language">
              {TUTOR_LANGUAGE_LABEL[tutorLanguage]}
            </span>
          )}
        </div>
        <div className="room-ribbon-facts">
          {mastery !== null && (
            <span className="room-fact" data-testid="room-mastery">
              ✦ إتقانك {mastery}%
            </span>
          )}
          {remaining !== null && (
            <span data-testid="remaining-budget" className="room-fact">
              متبقي اليوم: {remaining}
            </span>
          )}
          <ThemeToggle testId="room-theme-toggle" />
          <button data-testid="end-session" className="btn small ghost" onClick={end}>
            إنهاء الحصة
          </button>
          <button className="btn small ghost" onClick={onEnded} data-testid="return-home-compact">
            الرئيسية
          </button>
        </div>
      </header>

      <div className="room-body">
        {/* ---- W2 — سبورة المعلّم: the stage is the board. The student draws
            and writes on it, and every mark travels with his next question.
            The book is a REFERENCE the bar names («كتابك — صفحة ٦ من ٧»),
            never a page the room shows (الأطلس §١٥ «المرجع لا النسخ»). ---- */}
        <section className="room-board" data-testid="board">
          <div className="room-board-head">
            <span className="room-board-label">سبورة المعلّم</span>
            {boardConcept && (
              <span className="room-board-chip" data-testid="board-concept">
                {boardConcept}
              </span>
            )}
          </div>
          <div className="room-board-surface" data-testid="board-surface" ref={boardRef}>
            {/* PHASE 166 — طباشير المعلّم: what the reply wrote on the board.
                It sits UNDER the ink canvas (which still covers the surface's
                exact box and stays its only interactive child): the student
                draws over the teacher's writing the way he would in class. */}
            {activeBoard && <BoardChalk key={activeBoard.key} board={activeBoard.board} />}
            {/* PHASE 50/56 — «لوح الحبر»: the student draws on the board itself,
                so his finger can write and point. The toolbar sits beside it. */}
            <InkBoard resetToken={inkReset} strokes={inkStrokes} tool={inkTool} onChange={onInkChange} />
          </div>
          <InkTools tool={inkTool} onTool={setInkTool} count={inkStrokes.length} onClear={() => onInkChange([])} />
          <p className="room-board-note muted small">
            المعلّم يكتب أهم ما في الدرس على السبورة، وارسم واكتب معه — كل علاماتك تصل إليه مع سؤالك.
          </p>
          {stage && refPage !== null && (
            <div className="room-book-ref" data-testid="book-ref">
              <svg
                className="room-book-ref-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2V5z" />
                <path d="M4 18a2 2 0 012-2h13" />
              </svg>
              <div className="room-book-ref-info">
                <strong data-testid="book-ref-page">
                  كتابك — {pageLabel(refPage)} من {stage.toBookPage}
                </strong>
                <span>افتح كتابك واتبع مع المعلّم خطوة بخطوة</span>
              </div>
              {pages.length > 1 && (
                <button
                  type="button"
                  className="room-book-ref-chip"
                  data-testid="book-ref-toggle"
                  aria-expanded={refPagesOpen}
                  onClick={() => setRefPagesOpen((v) => !v)}
                >
                  الصفحات
                </button>
              )}
            </div>
          )}
          {stage && refPagesOpen && pages.length > 1 && (
            <div className="room-book-ref-pages" data-testid="book-ref-pages">
              {pages.map((p) => (
                <button
                  key={p.bookPage}
                  type="button"
                  className={`room-ref${p.bookPage === refPage ? " current" : ""}`}
                  aria-current={p.bookPage === refPage}
                  onClick={() => goToBookPage(p.bookPage)}
                >
                  {pageLabel(p.bookPage)}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* PHASE 95 — «خريطة المفاهيم»: the lesson's concepts in printed order
            with the student's real mastery per idea. It answers "what comes
            before what, and how solid am I?" without inventing any relation: the
            order is the book's own order, the percentages are real progress. */}
        {conceptMap && conceptMap.nodes.length > 0 && (
          <section className="room-concept-map" data-testid="concept-map" aria-label="خريطة المفاهيم">
            <div className="room-concept-head">
              <strong>🗺️ خريطة المفاهيم</strong>
              <span className="muted small">ترتيب الدرس حسب الكتاب — وإتقانك لكل فكرة</span>
            </div>
            <ol className="room-concept-list">
              {conceptMap.nodes.map((n, i) => (
                <li
                  key={n.conceptId}
                  className="room-concept-node"
                  data-testid="concept-map-node"
                  data-level={n.level ?? "untracked"}
                >
                  <span className="room-concept-step" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="room-concept-title">{n.title}</span>
                  <span className="room-concept-progress">
                    {n.percent === null ? (
                      <span className="muted small">لم تُجرَّب بعد</span>
                    ) : (
                      <>
                        <span className="room-concept-bar" aria-hidden="true">
                          <i style={{ width: `${n.percent}%` }} />
                        </span>
                        <span className="room-concept-pct" data-testid="concept-percent">
                          {n.percent}%
                        </span>
                        {n.labelAr && <span className="room-concept-band">{n.labelAr}</span>}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* PHASE 162 (W7) — «المعلّم الحيّ»: لوحة قابلة للطيّ تسكن المقعد
            الفارغ أصلًا (الصف الثاني يسار على سطح المكتب). إطفاء المفتاح
            يُخفيها كاملة — ولا يُحمَّل منها بايت واحد (المسرح ثلاثي الأبعاد
            يأتي كسولًا عند فتح اللوحة فقط). */}
        {liveTeacherOn && (
          <LiveTeacher
            state={teacherState}
            mouth={mouth}
            reference={
              stage && refPage !== null ? { page: refPage, label: pageLabel(refPage), total: stage.toBookPage } : null
            }
            onOpenReference={goToBookPage}
          />
        )}

        {/* ---- the dialogue: a live caption stream, plus the tutor's presence ---- */}
        <section className="room-live">
          <div className="room-presence" data-testid="room-presence" data-state={presence}>
            <div className="room-orb" data-testid="presence-orb" data-state={presence} aria-hidden="true">
              <span className="room-orb-core" />
              <span className="room-orb-ring" />
            </div>
            <div className="room-presence-text">
              <strong>معلّمك الذكي</strong>
              <span className="muted small" data-testid="presence-state">
                {PRESENCE_LABEL[presence]}
              </span>
            </div>
            <p className="room-presence-why muted small">
              ذكي + كتابك + معلّمك البشري — نتعلّم معًا.
            </p>
          </div>

          {tripwire && (
            <div data-testid="notice-tripwire" className="notice">
              🛡️ محتوى مخالف أُوقف تلقائيًا — أبقِ أسئلتك ضمن درسنا.
            </div>
          )}
          {error && (
            <div data-testid="chat-error" className="notice error" role="alert">
              {error}
            </div>
          )}

          <div className="room-captions" data-testid="messages" ref={captionsRef}>
            {messages.length === 0 && !live && (
              <div className="center room-captions-empty">
                <p className="muted">
                  ابدأ الحصة: اسأل بصوتك أو اكتب سؤالك — المعلّم يعرف كتابك صفحة بصفحة، وهو معك الآن.
                </p>
                <div className="primary-action-block">
                  <button
                    className="btn primary big"
                    data-testid="lesson-start-action"
                    disabled={pending}
                    onClick={() => {
                      if (!input.trim() && !preview && !docFile) {
                        const starter = "ابدأ الشرح";
                        setInput(starter);
                        setTimeout(() => send(starter), 50);
                      } else {
                        send(input);
                      }
                    }}
                  >
                    {pending ? "جارٍ التحضير..." : "ابدأ التعلم الآن"}
                  </button>
                  <p className="small muted" style={{ marginTop: '0.5rem' }}>
                    {b ? `${b.subject.nameAr} — ${b.lesson.title}` : 'درس جاهز للبدء'}
                  </p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`room-caption ${m.role === "user" ? "mine" : "theirs"}`}
                data-testid={m.role === "user" ? "msg-user" : "msg-tutor"}
              >
                <div className="room-caption-body">
                  {m.kind !== "safety" && KIND_LABEL[m.kind] && <span className="kind-tag">{KIND_LABEL[m.kind]}</span>}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="bubble-attachments">
                      {m.attachments.map((a) =>
                        a.mimeType.startsWith("image/") ? (
                          <figure key={a.id} className="bubble-figure">
                            <img
                              data-testid="msg-attachment"
                              className="bubble-image"
                              src={attachmentUrl(m.sessionId, a.id)}
                              alt={a.inkStrokes !== undefined || a.inkPage !== undefined ? "السبورة بعد رسم الطالب عليها" : "صورة السؤال المرفق"}
                            />
                            {/* PHASE 50/W2 — a drawing is not a photo: the caption
                                names where he drew — his board, or (legacy) the
                                page of his own book. */}
                            {(a.inkStrokes !== undefined || a.inkPage !== undefined) && (
                              <figcaption data-testid="msg-ink-caption" className="bubble-ink-caption">
                                ✏️ {a.inkPage !== undefined ? `رسمك على ${pageLabel(a.inkPage)}` : "رسمك على السبورة"}
                              </figcaption>
                            )}
                          </figure>
                        ) : (
                          <span key={a.id} data-testid="msg-document" className="bubble-document" title={a.mimeType}>
                            📄 {a.fileName ?? "ملف مرفق"} <small>({formatSize(a.sizeBytes)})</small>
                            {a.ocr && (
                              <span className="ocr-badge" data-testid="msg-ocr-badge">
                                🖨️ نص ممسوح ضوئيًا — قُرئ تلقائيًا
                              </span>
                            )}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                  {/* PHASE 53 — the reply with its formatting (bold, lists,
                      steps) instead of a flat wall of text. Words travel as
                      text nodes, so a reply can never inject markup. */}
                  <FormattedText text={m.content} />
                  {/* PHASE 93/95 — the engine's teaching move, as a chip AFTER the
                      reply. It must not lead the bubble: the room guarantees the
                      student reads the answer as the leading text (the live
                      preview is a prefix of what is kept), and this chip is
                      metadata about the turn, not part of the answer. */}
                  {m.role === "tutor" && m.teachingAction && (
                    <span
                      className="action-chip"
                      data-testid="teaching-action"
                      data-action={m.teachingAction.type}
                      title={actionDetail(m.teachingAction) ?? undefined}
                    >
                      <span aria-hidden="true">{ACTION_ICON[m.teachingAction.type]}</span>{" "}
                      {ACTION_LABEL[m.teachingAction.type]}
                      {actionDetail(m.teachingAction) && (
                        <em className="action-chip-detail">{actionDetail(m.teachingAction)}</em>
                      )}
                    </span>
                  )}
                  {/* PHASE 51 — the lines this answer drew, each with the
                      student's own pin on it. The verdict travels as a normal
                      turn: pin value as a fact, words as the question. */}
                  {m.role === "tutor" &&
                    m.widgets?.map((w, i) => (
                      <NumberLine key={`${m.id}-w${i}`} line={w} verifying={pending} onVerify={verifyPin} />
                    ))}
                  {/* PHASE 48/W2 — where this answer came from: a REFERENCE to the
                      student's own copy, never the book itself. One tap moves
                      the bar to that exact page. */}
                  {m.role === "tutor" && m.bookPages && m.bookPages.length > 0 && stage && (
                    <div className="room-refs" data-testid="tutor-pages">
                      <span className="room-refs-label">يستند إلى المنهج · كتابك:</span>
                      {m.bookPages.slice(0, 4).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`room-ref${p === refPage ? " current" : ""}`}
                          aria-label={`كتابك — ${pageLabel(p)}`}
                          aria-current={p === refPage}
                          onClick={() => goToBookPage(p)}
                        >
                          {pageLabel(p)}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.role === "tutor" && (
                    <button
                      data-testid="speak-reply"
                      type="button"
                      className="btn small speak-btn"
                      aria-label="الاستماع إلى الرد"
                      // PHASE 167 — «استمع» is an explicit ask, and the one
                      // moment a wedged engine honestly deserves a fresh hand:
                      // it is re-armed, not pressed into a dead button.
                      onClick={() => {
                        resetLocalVoice();
                        void speak(m);
                      }}
                    >
                      🔊 استمع
                    </button>
                  )}
                </div>
              </div>
            ))}
            {/* PHASE 49 — the turn in flight. The student's words are already
                stored, and the tutor's answer is written into the bubble as it
                arrives; the pair is swapped for the stored messages when the
                turn ends, so what is displayed here is never the record. */}
            {live && (
              <>
                {live.user && (
                  <div className="room-caption mine" data-testid="msg-user-live" data-live="true">
                    <div className="room-caption-body">
                      <p dir="auto">{live.user.content}</p>
                    </div>
                  </div>
                )}
                <div className="room-caption theirs" data-testid="msg-tutor-live" data-live="true">
                  <div className="room-caption-body">
                    {/* The preview is plain text with unclosed markers held
                        back: every frame stays a prefix of the kept reply. */}
                    <p dir="auto">{previewText(live.text) || <span className="room-cursor" aria-hidden="true" />}</p>
                  </div>
                </div>
              </>
            )}
            {pending && !live && (
              <div className="room-caption theirs" data-testid="typing">
                <div className="room-caption-body typing">
                  <span className="room-typing-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  يقرأ الكتاب ويكتب…
                </div>
              </div>
            )}
            <div className="room-captions-end" ref={bottomRef} />
          </div>
        </section>
      </div>

      {/* ---- the composer: the only place the student acts ---- */}
      <footer className="room-footer">
        <div className="quick-row">
          <button data-testid="btn-understood" className="btn small ok" disabled={pending} onClick={() => send("فهمت ✅")}>
            فهمت
          </button>
          <button data-testid="btn-confused" className="btn small warn" disabled={pending} onClick={() => send("مش فاهم، اشرح بطريقة أسهل من فضلك")}>
            مش فاهم
          </button>
        </div>
        {preview && (
          <div className="attachment-preview" data-testid="image-preview">
            <img className="attachment-preview-img" src={preview} alt="معاينة الصورة المرفقة" />
            <button data-testid="remove-image" type="button" className="btn small ghost" disabled={pending} onClick={() => setPreview(null)}>
              إزالة
            </button>
          </div>
        )}
        {docFile && (
          <div className="attachment-preview" data-testid="document-preview">
            <span className="document-preview-name">
              📄 {docFile.name} <small>({formatSize(docFile.size)})</small>
            </span>
            <button data-testid="remove-document" type="button" className="btn small ghost" disabled={pending} onClick={() => setDocFile(null)}>
              إزالة
            </button>
          </div>
        )}
        {/* PHASE 53 — the marks ride with the next send, so the composer says
            so: invisible hitchhikers are exactly what made one drawing show up
            on every reply. One tap drops them without touching the board. */}
        {inkStrokes.length > 0 && !preview && (
          <div className="attachment-preview" data-testid="ink-pending">
            <span className="document-preview-name">
              ✏️ {inkStrokes.length === 1 ? "علامة على السبورة" : `${inkStrokes.length} علامات على السبورة`} ستُرسل مع سؤالك
            </span>
            <button
              data-testid="ink-drop"
              type="button"
              className="btn small ghost"
              disabled={pending}
              onClick={() => {
                setInkStrokes([]);
                setInkReset((n) => n + 1);
              }}
            >
              إسقاط العلامات
            </button>
          </div>
        )}
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input, preview, docFile);
          }}
        >
          <input
            data-testid="attach-input"
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="visually-hidden"
            onChange={(e) => {
              onPickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            data-testid="attach-document-input"
            ref={docRef}
            type="file"
            accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,.pdf,.docx,.txt,.md"
            className="visually-hidden"
            onChange={(e) => {
              onPickDocument(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="composer-tools">
            <button
              data-testid="voice-input"
              type="button"
              className={`btn small ghost voice-btn${listening ? " active" : ""}`}
              aria-label="التحدث بدل الكتابة"
              aria-pressed={listening}
              disabled={pending}
              onClick={toggleTranscription}
            >
              {listening ? "🔴" : "🎙️"} سؤال بصوت
            </button>
            <button
              data-testid="attach-image"
              type="button"
              className="btn small ghost"
              aria-label="صوّر صفحتك من كتابك"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              📷 صوّر صفحتك
            </button>
            <button
              data-testid="attach-document"
              type="button"
              className="btn small ghost"
              aria-label="إرفاق ملف سؤال"
              disabled={pending}
              onClick={() => docRef.current?.click()}
            >
              📄 ملف سؤال
            </button>
            {/* PHASE 166 — «القراءة التلقائية»: كل رد يُسمع فور وصوله (افتراضيًا
                مفتوح — طلب المالك)، والزر يطفيها متى شاء الطالب. */}
            <button
              data-testid="auto-read-toggle"
              type="button"
              className={`btn small ghost auto-read-btn${autoRead ? " active" : ""}`}
              aria-label="قراءة ردود المعلّم تلقائيًا"
              aria-pressed={autoRead}
              title={autoRead ? "كل رد يُقرأ تلقائيًا — اضغط لكتم القراءة" : "القراءة التلقائية متوقفة — اضغط لتشغيلها"}
              onClick={() => {
                const next = !autoRead;
                // PHASE 167 — switching the reading back on is an explicit ask
                // for the voice: give a wedged engine a fresh chance.
                if (next) resetLocalVoice();
                writeAutoReadPref(next);
              }}
            >
              {autoRead ? "🔊" : "🔇"} قراءة تلقائية
            </button>
          </div>
          <div className="composer-main">
            <input
              data-testid="chat-input"
              aria-label="رسالتك"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك… أو صوّر صفحتك من كتابك"
              maxLength={4000}
              // Keyboard focus without yanking the scroll: the student opens
              // the room on the board (the stage), not on the composer. A plain
              // autoFocus would scroll the page past the board on load.
              ref={(el) => el?.focus({ preventScroll: true })}
            />
            <button data-testid="send-message" className="btn primary" disabled={pending || (!input.trim() && !preview && !docFile && inkStrokes.length === 0)}>
              إرسال
            </button>
          </div>
        </form>
        {listening && (
          <div className="voice-status" data-testid="voice-listening">
            🎙️ جارٍ الاستماع… راجِع النص ثم عدّله واضغط إرسال.
            <button data-testid="voice-stop" type="button" className="btn small ghost" onClick={toggleTranscription}>
              إيقاف الاستماع
            </button>
          </div>
        )}
        {speaking && (
          <div className="voice-status speaking" data-testid="speak-status">
            🔊 جارٍ الاستماع إلى رد المدرس…
            <button data-testid="stop-tts" type="button" className="btn small ghost" onClick={stopReading}>
              ⏹ إيقاف
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
