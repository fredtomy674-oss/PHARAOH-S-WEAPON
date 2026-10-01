// PHASE 48 — «غرفة الدرس» (the lesson room).
//
// The session used to be a chat: bubbles, a composer, a 🔊 button per reply.
// That is a *transport*, not a lesson. The room keeps every one of those
// behaviours (they are the product's contract with its tests and its users) but
// stages them like a classroom:
//
//   • the official textbook page is the STAGE — the page the lesson occupies,
//     shown as the page the student can turn to, never a description of it;
//   • a ribbon shows where the student stands in the curriculum (unit, concept,
//     page position, mastery) — progress in the book, not a chat counter;
//   • the AI tutor is a PRESENCE, not a human avatar: an honest, modern pulse
//     that is thinking / speaking / listening, because this collaboration is
//     exactly that — the student's own book plus an AI that teaches from it;
//   • the dialogue is a CAPTION STREAM, the way a spoken lesson is captioned,
//     so the student reads what it hears instead of scrolling a chat log.
//
// Every data-testid from the previous chat screen is preserved on purpose: the
// room is a presentation change, and nothing about behaviour or accessibility
// may regress with it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  attachmentUrl,
  bookPageUrl,
  endSession,
  fetchSpeechAudio,
  getSession,
  lessonContext,
  lessonStage,
  listConcepts,
  myProgress,
  resetSpeechAvailability,
  sendMessage,
  streamMessage,
  ApiError,
  SpeechUnavailableError,
  type Breadcrumb,
  type LearningSession,
  type LessonStage,
  type Message,
  type TutorLanguage,
  type User,
} from "./api.js";
import {
  canSpeakLanguage,
  missingVoiceNotice,
  playAudioBlob,
  speakText,
  speechRecognitionSupported,
  startTranscription,
  stopSpeaking,
  ttsSupported,
  type SttHandle,
} from "./voice.js";
import InkBoard from "./InkBoard.js";
import InkTools from "./InkTools.js";
import { composeInkPage, type InkStroke, type InkTool } from "./ink.js";
import { createNarrator, type Narrator } from "./narrator.js";
import NumberLine from "./NumberLine.js";
import FormattedText from "./FormattedText.js";
import { previewText, stripMarkdown } from "./format.js";

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
  ink?: { page: number; strokes: number } | null,
): Message {
  const visual = doc || image || ink;
  const attachments: Message["attachments"] = visual
    ? [
        {
          id: "pending",
          messageId: "pending",
          mimeType: doc ? "application/octet-stream" : "image/jpeg",
          fileName: doc ? doc.name : image ? "صورة السؤال" : `صفحة ${ink!.page} مُعلَّمة`,
          sizeBytes: doc ? doc.size : Math.round(((image ?? "").length || 200_000) * 0.75),
          ocr: false,
          ...(ink ? { inkPage: ink.page, inkStrokes: ink.strokes } : {}),
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

/** One printed page of the book, as the room shows it. */
function PageSheet({ bookPage, active, cited = false }: { bookPage: number; active: boolean; cited?: boolean }) {
  return (
    <div className={`room-thumb-sheet${active ? " active" : ""}${cited ? " cited" : ""}`}>
      <img
        src={bookPageUrl(bookPage)}
        alt={`${pageLabel(bookPage)} من كتاب الوزارة`}
        loading="lazy"
        decoding="async"
        data-testid={active ? "stage-page" : "stage-thumb"}
      />
      <span className="room-thumb-label">{bookPage === 0 ? "افتتاح" : bookPage}</span>
      {cited && <span className="room-sheet-mark" aria-hidden="true" />}
    </div>
  );
}

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
  // PHASE 48 — the stage: the textbook pages this lesson occupies.
  const [stage, setStage] = useState<LessonStage | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  // PHASE 50 — «لوح الحبر»: the student's own marks on the open page. They
  // travel with his next question (page + marks composited into one picture),
  // and the board is cleared once the tutor has them.
  const [inkStrokes, setInkStrokes] = useState<InkStroke[]>([]);
  const [inkReset, setInkReset] = useState(0);
  // PHASE 56 — the chosen tool lives in the room because the toolbar now sits
  // outside the page sheet, next to the board it drives.
  const [inkTool, setInkTool] = useState<InkTool>("pen");
  // The board is only drawable once the page image has laid out: the sheet
  // shrink-wraps the image, so beforehand the canvas is zero-sized.
  const [pageReady, setPageReady] = useState(false);
  const stageImgRef = useRef<HTMLImageElement>(null);
  // A new page starts unready; a cached-complete image is ready immediately,
  // otherwise the <img> onLoad below flips it when the bytes arrive. The marks go
  // with it: PHASE 50's rule, now the room's to keep (PHASE 56 made the board
  // controlled), so a circle drawn on page 0 can never travel to page 1.
  useEffect(() => {
    const img = stageImgRef.current;
    setPageReady(!!img && img.complete && img.naturalWidth > 0);
    setInkStrokes([]);
    setInkReset((n) => n + 1);
  }, [pageIndex]);
  // PHASE 48 — pages the latest answer was grounded in; marked on the filmstrip.
  const [citedPages, setCitedPages] = useState<number[]>([]);
  // PHASE 49 — the turn in flight: the student's own words (shown the moment he
  // presses send) and the part of the tutor's answer written so far. Replaced by
  // the stored pair when the turn ends, so nothing shown here is ever the record.
  const [live, setLive] = useState<{ user: Message | null; text: string } | null>(null);
  const [mastery, setMastery] = useState<number | null>(null);
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
  // Bumped on every press/stop: a fetch that comes back late must not start
  // playing a reply the student already moved on from.
  const speechToken = useRef(0);
  const voiceTurnRef = useRef(false);
  // PHASE 56 — the reply being heard while it is still arriving (see
  // `narrator.ts`): it speaks each sentence the moment it is complete, and
  // reports `broken` when this machine has no voice for Arabic so the room can
  // fall back to the server's narration of the whole reply.
  const narratorRef = useRef<Narrator | null>(null);

  useEffect(() => {
    resetSpeechAvailability();
    lessonContext(session.lessonId)
      .then(({ breadcrumb, replyLanguage }) => {
        setBc(breadcrumb);
        setTutorLanguage(replyLanguage);
      })
      .catch(() => undefined);
    // The stage is optional by design: a lesson with no rasterized book must
    // still open, as a text-only room.
    lessonStage(session.lessonId)
      .then(setStage)
      .catch(() => setStage(null));
    // The ribbon's mastery chip: the concept this lesson teaches, and how much
    // of it the student already owns. Both are best-effort decoration.
    Promise.all([listConcepts(session.lessonId), myProgress()])
      .then(([concepts, progress]) => {
        const conceptId = concepts[0]?.id;
        if (!conceptId) return;
        const found = progress.mastery.find((m) => m.conceptId === conceptId);
        if (found) setMastery(Math.round(found.mastery));
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
    // view). While the room is still opening, the student must land on the book
    // page — that is what the room is for.
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

  const pages = stage?.pages ?? [];
  const currentPage = pages[pageIndex];
  // The lesson's pages as a filmstrip: a peek at the whole span, so the
  // student can see where they are inside the concept.
  const filmstrip = useMemo(() => {
    if (pages.length <= 6) return pages;
    const start = Math.min(Math.max(pageIndex - 2, 0), pages.length - 5);
    return pages.slice(start, start + 5);
  }, [pages, pageIndex]);

  const step = (delta: number) => {
    setPageIndex((prev) => {
      const next = prev + delta;
      if (next < 0 || next >= pages.length) return prev;
      return next;
    });
  };

  /** Jump the stage to one printed page (used by the tutor's page references). */
  const goToBookPage = useCallback(
    (bookPage: number) => {
      const index = pages.findIndex((p) => p.bookPage === bookPage);
      if (index >= 0) setPageIndex(index);
    },
    [pages],
  );

  /** The printed page the student is looking at right now (null without a book). */
  const openBookPage = stage?.hasImages ? (currentPage?.bookPage ?? null) : null;

  /**
   * PHASE 40 (D-044) — read a reply aloud with the *browser's* own voice: the
   * fallback for when the server has no voice. The missing-voice notice fires
   * only here, because only here does the machine's voice decide what is
   * actually heard.
   */
  const speakLocally = (text: string) => {
    if (!ttsSupported()) return;
    const { utterance, missingVoice } = speakText(text, tutorLanguage, () => {
      if (activeUtterance.current === utterance) setSpeaking(false);
    });
    if (!utterance) return;
    activeUtterance.current = utterance;
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
        // PHASE 56 — ask BEFORE speaking: `speakText` reports a missing voice only
        // after handing the text over, so without this the very first sentence of
        // an Arabic reply would be read aloud in the machine's English voice.
        if (!canSpeakLanguage(tutorLanguage)) return { started: false, missingVoice: true };
        const { utterance, missingVoice } = speakText(text, tutorLanguage, () => {
          if (activeUtterance.current === utterance) {
            activeUtterance.current = null;
            setSpeaking(false);
          }
          onDone();
        });
        if (utterance) activeUtterance.current = utterance;
        return { started: !!utterance, missingVoice };
      },
    });

  const stopReading = () => {
    // Invalidate any narration still in flight before silencing the current one.
    speechToken.current += 1;
    narratorRef.current?.stop();
    narratorRef.current = null;
    stopSpeaking();
    activeUtterance.current = null;
    setSpeaking(false);
  };

  /**
   * PHASE 40 (D-044) — read a reply aloud.
   *
   * The server is asked first because it is the only way an Arabic reply is
   * audible on a machine with no Arabic voice installed. If it has no voice
   * (or the audio will not play) we read it with the browser's own voice, so
   * the button is never dead and never silent.
   */
  const speak = async (message: Message) => {
    stopReading();
    const token = speechToken.current;
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
          // Never leave 🔊 dead: fall back to the browser's own voice.
          // Spoken words, not syntax: the bubble may hold **bold** and lists.
          if (token === speechToken.current) speakLocally(stripMarkdown(message.content));
        },
      });
      if (!handle) speakLocally(stripMarkdown(message.content));
    } catch (err) {
      if (token !== speechToken.current) return;
      if (!(err instanceof SpeechUnavailableError)) {
        setError(err instanceof ApiError ? err.message : "تعذّر تحضير الصوت");
        return;
      }
      // Same strip as above: the bubble may hold **bold** and lists.
      speakLocally(stripMarkdown(message.content));
    }
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

  const send = async (content: string, image?: string | null, doc: PendingDocument | null = null, speakReply = false, widget: { value: number } | null = null) => {
    const text = content.trim();
    // PHASE 50 — marks on the open page travel with the question automatically:
    // the student drew them *as* his question, so asking must never leave them
    // behind. A photo and marks are mutually exclusive (one visual per turn) —
    // the composer already enforces "last act wins", this is the backstop.
    const marks = !image && !doc && openBookPage !== null ? inkStrokes : [];
    if ((!text && !image && !doc && !widget && marks.length === 0) || pending) return;
    // The room has finished opening: from now on a reply may bring itself into
    // view (PHASE 56 — measured, the opening itself must not move the page).
    roomOpening.current = false;
    setPending(true);
    setError(null);
    // The picture the tutor sees is the page *as marked*: composited here, from
    // the same image the stage shows, so pointing cannot drift between screen
    // and model.
    let ink: { dataUrl: string; page: number; strokes: number } | undefined;
    if (marks.length > 0 && openBookPage !== null) {
      try {
        const composed = await composeInkPage(bookPageUrl(openBookPage), marks);
        ink = { dataUrl: composed.dataUrl, page: openBookPage, strokes: marks.length };
      } catch {
        setPending(false);
        setError("تعذر إرفاق الصفحة المرسومة — تحقق من الاتصال وحاول مرة أخرى");
        return;
      }
    }
    // PHASE 48 — the open page travels with the turn, so the tutor reads the
    // same page before answering instead of describing a page he never saw.
    const onPage = openBookPage ?? undefined;
    const page = onPage !== undefined ? { bookPage: onPage } : {};
    const pin = widget ? { widget: { value: widget.value } } : {};
    const body = doc
      ? { content: text, document: { dataUrl: doc.dataUrl, fileName: doc.name }, ...page, ...pin }
      : image
        ? { content: text, image: { dataUrl: image }, ...page, ...pin }
        : ink
          ? { content: text, ink, ...page, ...pin }
          : { content: text, ...page, ...pin };
    try {
      // PHASE 49 — the reply is written as it is thought, so the room shows a
      // tutor thinking instead of a waiting cursor. The student's own words
      // appear immediately: they are already stored by the time the first word
      // of the answer exists, and waiting would move the wait onto him.
      setLive({ user: optimisticMessage(session.id, text, image, doc, ink ? { page: ink.page, strokes: ink.strokes } : null), text: "" });
      // The live path is an improvement, never a new way for a turn to fail: if
      // the stream cannot even start (a buffering proxy, an old browser, a dead
      // socket) the question is simply asked the old way instead. The retry is
      // allowed only while NOTHING has arrived — once the server has spoken, the
      // turn is very likely stored, and asking again would make the student pay
      // for it twice.
      let arrived = false;
      // PHASE 56 — the voice starts with the first sentence instead of waiting
      // for the turn to be stored and its audio to be fetched.
      const narrator = speakReply ? createProgressiveNarrator() : null;
      narratorRef.current = narrator;
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
        onDiscard: () => {
          arrived = true;
          // Words the room took back must not stay in the air — and the corrected
          // answer must still be spoken, so the narrator forgets rather than stops.
          stopSpeaking();
          activeUtterance.current = null;
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
      // PHASE 48 — the pages this answer was built from. They are marked on the
      // filmstrip instead of turning the stage for him: the student owns the
      // page he is looking at, and the tutor's answer often *describes* the open
      // page while citing evidence from another one — yanking the stage would
      // contradict the very words he just read.
      setCitedPages(turn.tutorMessage.bookPages ?? []);
      setRemaining(turn.remainingBudget);
      if (turn.safetyTripwire) setTripwire(true);
      // Only clear the composer when it still holds the text we just sent —
      // never clobber newer typing that arrived while the turn was in flight.
      setInput((prev) => (prev.trim() === text ? "" : prev));
      setPreview(null);
      setDocFile(null);
      // The marks reached the tutor with this question — clear the board so the
      // next question starts from a clean page.
      if (ink) setInkReset((n) => n + 1);
      // PHASE 56 — if the machine could not speak as the words arrived (no
      // voice for Arabic, or the room retracted the text), fall back to the
      // server's narration of the stored reply: one voice, whole answer. When it
      // did speak, the remainder is simply the tail it has not reached yet.
      if (speakReply) {
        if (narrator && !narrator.broken) {
          // The machine read the reply as it arrived; only the tail is left.
          narrator.finish(turn.tutorMessage.content);
        } else {
          // The local voice gave up (measured: no Arabic voice installed). The
          // server narrates what the student has NOT heard — the whole reply when
          // nothing was read, otherwise only the remaining tail, so no sentence
          // is ever said twice.
          const gap = narrator?.unheard();
          const content = !gap ? turn.tutorMessage.content : gap.heardNothing ? turn.tutorMessage.content : gap.tail;
          if (content.trim()) void speak({ ...turn.tutorMessage, content });
        }
      }
      if (narratorRef.current === narrator) narratorRef.current = null;
    } catch (err) {
      setLive(null);
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
    void send(`وضعت الدبوس عند ${shown}`, null, null, false, { value });
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
      // One visual per turn: a picked photo replaces the page marks.
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
          <strong data-testid="room-lesson-title">{b ? b.lesson.title : "الجلسة"}</strong>
          <span className="muted small">
            {b ? `${b.grade.nameAr} • ${b.subject.nameAr} — ${b.unit.title}` : ""}
          </span>
          {/* PHASE 38/D-042 — say out loud which language the tutor will use, so
              a student in a language curriculum is not surprised by the reply. */}
          {b && (
            <span className="lang-chip" data-testid="tutor-language">
              {tutorLanguage === "en" ? "🗽 الشرح بالإنجليزية" : "🗿 الشرح بالعربية"}
            </span>
          )}
        </div>
        <div className="room-ribbon-facts">
          {stage && stage.hasImages && currentPage && (
            <span className="room-fact" data-testid="room-page-fact">
              📖 {pageLabel(currentPage.bookPage)} من {stage.toBookPage}
            </span>
          )}
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
          <button data-testid="end-session" className="btn small ghost" onClick={end}>
            إنهاء الحصة
          </button>
        </div>
      </header>

      <div className="room-body">
        {/* ---- the stage: the official page this lesson occupies ---- */}
        <section className="room-stage" data-testid="book-stage">
          {stage?.hasImages && currentPage ? (
            <>
              <div className="room-page">
                <div className="room-sheet">
                  <img
                    ref={stageImgRef}
                    src={bookPageUrl(currentPage.bookPage)}
                    alt={`${pageLabel(currentPage.bookPage)} من كتاب الوزارة`}
                    data-testid="stage-image"
                    onLoad={(e) => {
                      // Cached pages may already be complete before React
                      // attaches: trust dimensions, not the event alone.
                      const img = e.currentTarget;
                      if (img.naturalWidth > 0) setPageReady(true);
                    }}
                  />
                  {/* PHASE 50/56 — «لوح الحبر»: the student draws on the page
                      itself, so his finger can point at the exact line he asks
                      about. The canvas is the only thing inside the sheet (its
                      exact box), and the toolbar sits beside it — measured: a
                      toolbar inside the sheet pushed the drawing surface off
                      the page. */}
                  <InkBoard
                    pageKey={currentPage.bookPage}
                    resetToken={inkReset}
                    ready={pageReady}
                    strokes={inkStrokes}
                    tool={inkTool}
                    onChange={onInkChange}
                  />
                </div>
                <InkTools
                  tool={inkTool}
                  onTool={setInkTool}
                  count={inkStrokes.length}
                  ready={pageReady}
                  onClear={() => onInkChange([])}
                />
              </div>
              <div className="room-stage-nav">
                <button
                  data-testid="stage-prev"
                  className="btn small ghost"
                  aria-label="الصفحة السابقة"
                  disabled={pageIndex === 0}
                  onClick={() => step(-1)}
                >
                  ›
                </button>
                <span className="room-stage-count" data-testid="stage-position">
                  {pageLabel(currentPage.bookPage)} · إلى {stage.toBookPage}
                </span>
                <button
                  data-testid="stage-next"
                  className="btn small ghost"
                  aria-label="الصفحة التالية"
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => step(1)}
                >
                  ‹
                </button>
              </div>
              <div className="room-filmstrip" data-testid="stage-filmstrip">
                {filmstrip.map((p) => (
                  <button
                    key={p.bookPage}
                    type="button"
                    className="room-thumb"
                    aria-label={`اذهب إلى صفحة ${p.bookPage}`}
                    aria-current={p.bookPage === currentPage.bookPage}
                    onClick={() => setPageIndex(pages.findIndex((x) => x.bookPage === p.bookPage))}
                  >
                    <PageSheet
                      bookPage={p.bookPage}
                      active={p.bookPage === currentPage.bookPage}
                      cited={citedPages.includes(p.bookPage)}
                    />
                  </button>
                ))}
              </div>
              {citedPages.length > 0 && (
                <p className="room-cited-note muted small" data-testid="room-cited">
                  ✦ استند المعلّم إلى {citedPages.map(pageLabel).join("، ")} من الكتاب
                </p>
              )}
              <p className="room-stage-note muted small">
                الصفحة من <strong>كتاب الوزارة</strong> — وكل ما يقوله المعلّم مبنيّ عليها. المعلّم يقرأ معك الصفحة المفتوحة، ويشير لك إلى الصفحة التي يريدها.
              </p>
            </>
          ) : (
            <div className="room-no-book" data-testid="stage-absent">
              <div className="room-no-book-icon" aria-hidden="true">
                📘
              </div>
              <p>
                <strong>{b ? b.lesson.title : "الدرس"}</strong>
              </p>
              <p className="muted small">
                {stage
                  ? "صور الكتاب غير متاحة على هذا الجهاز — الشرح نصّي من محتوى الكتاب."
                  : "هذا الدرس لا يُعرض من كتاب مطبوع — الشرح نصّي."}
              </p>
            </div>
          )}
        </section>

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
              <p className="muted center room-captions-empty">
                {stage?.hasImages
                  ? "ابدأ الحصة: اسأل بصوتك أو اكتب سؤالك — كل إجابة مبنيّة على صفحة الكتاب المفتوحة."
                  : "ابدأ الحصة: اسألني عن أي شيء في درسنا."}
              </p>
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
                              alt={a.inkPage !== undefined ? "الصفحة بعد رسم الطالب عليها" : "صورة السؤال المرفق"}
                            />
                            {/* PHASE 50 — a marked page is not a photo: the caption
                                says which page he drew on, in his own book's terms. */}
                            {a.inkPage !== undefined && (
                              <figcaption data-testid="msg-ink-caption" className="bubble-ink-caption">
                                ✏️ رسمك على {pageLabel(a.inkPage)}
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
                  {/* PHASE 51 — the lines this answer drew, each with the
                      student's own pin on it. The verdict travels as a normal
                      turn: pin value as a fact, words as the question. */}
                  {m.role === "tutor" &&
                    m.widgets?.map((w, i) => (
                      <NumberLine key={`${m.id}-w${i}`} line={w} verifying={pending} onVerify={verifyPin} />
                    ))}
                  {/* PHASE 48 — where this answer came from, as a place, not a
                      footnote: one tap turns the stage to that exact page. */}
                  {m.role === "tutor" && m.bookPages && m.bookPages.length > 0 && stage?.hasImages && (
                    <div className="room-refs" data-testid="tutor-pages">
                      <span className="room-refs-label">الصفحات:</span>
                      {m.bookPages.slice(0, 4).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`room-ref${p === openBookPage ? " current" : ""}`}
                          aria-label={`اعرض ${pageLabel(p)}`}
                          aria-current={p === openBookPage}
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
                      onClick={() => void speak(m)}
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
          <button data-testid="btn-understood" className="btn small ok" disabled={pending} onClick={() => send("فهمت ✅", null, null, false)}>
            فهمت
          </button>
          <button data-testid="btn-confused" className="btn small warn" disabled={pending} onClick={() => send("مش فاهم، اشرح بطريقة أسهل من فضلك", null, null, false)}>
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
              ✏️ {inkStrokes.length === 1 ? "علامة على الصفحة" : `${inkStrokes.length} علامات على الصفحة`} ستُرسل مع سؤالك
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
            const speakReply = voiceTurnRef.current;
            voiceTurnRef.current = false;
            void send(input, preview, docFile, speakReply);
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
              aria-label="إرفاق صورة سؤال"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              📷 صورة سؤال
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
          </div>
          <div className="composer-main">
            <input
              data-testid="chat-input"
              aria-label="رسالتك"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل معلمك…"
              maxLength={4000}
              // Keyboard focus without yanking the scroll: the student opens
              // the room on the book (the stage), not on the composer. A plain
              // autoFocus would scroll the page past the book on load.
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
