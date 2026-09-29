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
  missingVoiceNotice,
  playAudioBlob,
  speakText,
  speechRecognitionSupported,
  startTranscription,
  stopSpeaking,
  ttsSupported,
  type SttHandle,
} from "./voice.js";

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
function PageSheet({ bookPage, active }: { bookPage: number; active: boolean }) {
  return (
    <div className={`room-sheet${active ? " active" : ""}`}>
      <img
        src={bookPageUrl(bookPage)}
        alt={`${pageLabel(bookPage)} من كتاب الوزارة`}
        loading="lazy"
        decoding="async"
        data-testid={active ? "stage-page" : "stage-thumb"}
      />
      <span className="room-sheet-label">{bookPage === 0 ? "افتتاح" : bookPage}</span>
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
  const [mastery, setMastery] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const docRef = useRef<HTMLInputElement | null>(null);
  const sttRef = useRef<SttHandle | null>(null);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  // Bumped on every press/stop: a fetch that comes back late must not start
  // playing a reply the student already moved on from.
  const speechToken = useRef(0);
  const voiceTurnRef = useRef(false);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

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

  const stopReading = () => {
    // Invalidate any narration still in flight before silencing the current one.
    speechToken.current += 1;
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
          if (token === speechToken.current) speakLocally(message.content);
        },
      });
      if (!handle) speakLocally(message.content);
    } catch (err) {
      if (token !== speechToken.current) return;
      if (!(err instanceof SpeechUnavailableError)) {
        setError(err instanceof ApiError ? err.message : "تعذّر تحضير الصوت");
        return;
      }
      speakLocally(message.content);
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

  const send = async (content: string, image?: string | null, doc: PendingDocument | null = null, speakReply = false) => {
    const text = content.trim();
    if ((!text && !image && !doc) || pending) return;
    setPending(true);
    setError(null);
    try {
      const turn = doc
        ? await sendMessage(session.id, text, undefined, { dataUrl: doc.dataUrl, fileName: doc.name })
        : image
          ? await sendMessage(session.id, text, { dataUrl: image })
          : await sendMessage(session.id, text);
      setMessages((m) => [...m, turn.userMessage, turn.tutorMessage]);
      setRemaining(turn.remainingBudget);
      if (turn.safetyTripwire) setTripwire(true);
      // Only clear the composer when it still holds the text we just sent —
      // never clobber newer typing that arrived while the turn was in flight.
      setInput((prev) => (prev.trim() === text ? "" : prev));
      setPreview(null);
      setDocFile(null);
      if (speakReply) void speak(turn.tutorMessage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر إرسال الرسالة");
    } finally {
      setPending(false);
    }
  };

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
                <img
                  src={bookPageUrl(currentPage.bookPage)}
                  alt={`${pageLabel(currentPage.bookPage)} من كتاب الوزارة`}
                  data-testid="stage-image"
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
                    <PageSheet bookPage={p.bookPage} active={p.bookPage === currentPage.bookPage} />
                  </button>
                ))}
              </div>
              <p className="room-stage-note muted small">
                الصفحة من <strong>كتاب الوزارة</strong> — كل ما يقوله المعلّم مبنيّ عليها.
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

          <div className="room-captions" data-testid="messages">
            {messages.length === 0 && (
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
                          <img
                            key={a.id}
                            data-testid="msg-attachment"
                            className="bubble-image"
                            src={attachmentUrl(m.sessionId, a.id)}
                            alt="صورة السؤال المرفق"
                          />
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
                  <p dir="auto">{m.content}</p>
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
            {pending && (
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
            <div ref={bottomRef} />
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
          <input
            data-testid="chat-input"
            aria-label="رسالتك"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسأل معلمك…"
            maxLength={4000}
            autoFocus
          />
          <button data-testid="send-message" className="btn primary" disabled={pending || (!input.trim() && !preview && !docFile)}>
            إرسال
          </button>
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
