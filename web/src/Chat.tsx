import { useEffect, useRef, useState } from "react";
import {
  endSession,
  getSession,
  lessonBreadcrumb,
  sendMessage,
  attachmentUrl,
  ApiError,
  type Breadcrumb,
  type LearningSession,
  type Message,
  type User,
} from "./api.js";
import {
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

interface PendingDocument {
  name: string;
  size: number;
  dataUrl: string;
}

export function ChatScreen({ session, onEnded }: Props) {
  const [bc, setBc] = useState<Breadcrumb["breadcrumb"] | null>(null);
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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const docRef = useRef<HTMLInputElement | null>(null);
  const sttRef = useRef<SttHandle | null>(null);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceTurnRef = useRef(false);

  useEffect(() => {
    lessonBreadcrumb(session.lessonId).then((b) => setBc(b)).catch(() => undefined);
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

  // Stop any voice activity when leaving the chat room.
  useEffect(
    () => () => {
      stopSpeaking();
      sttRef.current?.stop();
    },
    [],
  );

  const speak = (text: string) => {
    if (!ttsSupported()) return;
    const utterance = speakText(text, () => {
      if (activeUtterance.current === utterance) setSpeaking(false);
    });
    if (!utterance) return;
    activeUtterance.current = utterance;
    setSpeaking(true);
  };

  const stopReading = () => {
    stopSpeaking();
    activeUtterance.current = null;
    setSpeaking(false);
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
    });
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
      if (speakReply) speak(turn.tutorMessage.content);
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

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

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
    <div className="chat-layout">
      <header className="chat-header">
        <div>
          <strong>{b ? b.lesson.title : "الجلسة"}</strong>
          {b && (
            <span className="muted small">
              {b.country.nameAr} • {b.system.nameAr} • {b.grade.nameAr} • {b.subject.nameAr} — {b.unit.title}
            </span>
          )}
        </div>
        <div className="row-gap">
          {remaining !== null && (
            <span data-testid="remaining-budget" className="muted small">
              متبقي اليوم: {remaining}
            </span>
          )}
          <button data-testid="end-session" className="btn small ghost" onClick={end}>
            إنهاء الجلسة
          </button>
        </div>
      </header>

      <main className="chat-body">
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

        <div className="messages" data-testid="messages">
          {messages.length === 0 && (
            <p className="muted center">
              مرحبًا بك! اسألني عن أي شيء في درسنا — مثلًا: «اشرح لي الجمع مع إعادة التجميع».
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.role === "user" ? "mine" : "theirs"}`}
              data-testid={m.role === "user" ? "msg-user" : "msg-tutor"}
            >
              <div className="bubble">
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
                <p>{m.content}</p>
                {m.role === "tutor" && (
                  <button
                    data-testid="speak-reply"
                    type="button"
                    className="btn small speak-btn"
                    aria-label="الاستماع إلى الرد"
                    onClick={() => speak(m.content)}
                  >
                    🔊 استمع
                  </button>
                )}
              </div>
            </div>
          ))}
          {pending && (
            <div className="msg theirs" data-testid="typing">
              <div className="bubble typing">يكتب…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="chat-footer">
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
            placeholder="اكتب سؤالك هنا…"
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