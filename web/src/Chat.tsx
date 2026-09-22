import { useEffect, useRef, useState } from "react";
import { endSession, getSession, lessonBreadcrumb, sendMessage, ApiError, type Breadcrumb, type LearningSession, type Message, type User } from "./api.js";

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

export function ChatScreen({ session, onEnded }: Props) {
  const [bc, setBc] = useState<Breadcrumb["breadcrumb"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [tripwire, setTripwire] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  const send = async (content: string) => {
    const text = content.trim();
    if (!text || pending) return;
    setPending(true);
    setError(null);
    try {
      const turn = await sendMessage(session.id, text);
      setMessages((m) => [...m, turn.userMessage, turn.tutorMessage]);
      setRemaining(turn.remainingBudget);
      if (turn.safetyTripwire) setTripwire(true);
      setInput("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر إرسال الرسالة");
    } finally {
      setPending(false);
    }
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
              {b.country.nameAr} • {b.grade.nameAr} • {b.subject.nameAr} — {b.unit.title}
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
                <p>{m.content}</p>
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
          <button data-testid="btn-understood" className="btn small ok" disabled={pending} onClick={() => send("فهمت ✅")}>
            فهمت
          </button>
          <button data-testid="btn-confused" className="btn small warn" disabled={pending} onClick={() => send("مش فاهم، اشرح بطريقة أسهل من فضلك")}>
            مش فاهم
          </button>
        </div>
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            data-testid="chat-input"
            aria-label="رسالتك"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا…"
            maxLength={4000}
            autoFocus
          />
          <button data-testid="send-message" className="btn primary" disabled={pending || !input.trim()}>
            إرسال
          </button>
        </form>
      </footer>
    </div>
  );
}