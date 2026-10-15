import { useEffect, useRef, useState } from "react";
import {
  AVATAR_CHARACTERS,
  AVATAR_STATE_AR,
  characterModelStatus,
  getCharacter,
  nextState,
  useMouthSync,
  VrmAvatar,
  LOW_FPS_THRESHOLD,
  type AvatarEvent,
  type AvatarState,
} from "./index.js";
import { fetchSpeechAudio } from "../api.js";
import { canSpeakLanguage, speakText, type VoiceLanguage } from "../voice.js";import type { AvatarLoadStatus } from "./VrmAvatar.js";

/**
 * Avatar Lab — the isolated proving ground for the human teacher (Phase 1).
 *
 * Deliberately NOT part of the lesson: it reuses only the REAL voice paths
 * (browser speechSynthesis via the app's own speakText, server narration via
 * the app's own fetchSpeechAudio) and never synthesizes anything on its own,
 * so every lip-sync observation here transfers to the lesson room unchanged.
 * No model file is bundled: bring a licensed .vrm via the file picker until
 * the commercial character is approved and recorded in the registry.
 */

const SAMPLE_LINES: Record<VoiceLanguage, string> = {
  ar: "أهلاً بك في مختبر الصورة الرمزية، هذا اختبار الصوت العربي",
  en: "Hello, this is the avatar voice test",
  fr: "Bonjour, ceci est le test de voix de l'avatar",
  de: "Hallo, das ist der Stimmtest des Avatars",
};
const ITALIAN_LINE = "Ciao, questa è una prova di voce";

const VOICE_LABEL_AR: Record<string, string> = {
  ar: "العربية (ar-EG)",
  en: "الإنجليزية (en-US)",
  fr: "الفرنسية (fr-FR)",
  de: "الألمانية (de-DE)",
  it: "الإيطالية (it-IT)",
};

interface VoiceResult {
  attempted: boolean;
  voiceFound: boolean | null;
  finished: string;
  note: string;
}

const NOT_TESTED: VoiceResult = { attempted: false, voiceFound: null, finished: "-", note: "لم يُختبر بعد" };

export function AvatarLab() {
  const [characterId, setCharacterId] = useState(AVATAR_CHARACTERS[0]!.id);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [loadStatus, setLoadStatus] = useState<AvatarLoadStatus>("empty");
  const [loadError, setLoadError] = useState("");
  const [fps, setFps] = useState(0);
  const [voiceResults, setVoiceResults] = useState<Record<string, VoiceResult>>({});
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [serverVoiceNote, setServerVoiceNote] = useState("");
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  const character = getCharacter(characterId) ?? AVATAR_CHARACTERS[0]!;
  const model: string | null = fileUrl ?? character.modelUrl;
  const sync = useMouthSync(avatarState === "speaking" || micOn);
  const labAudio = useRef<{ ctx: AudioContext | null; stream: MediaStream | null; analyser: AnalyserNode | null }>({
    ctx: null,
    stream: null,
    analyser: null,
  });

  const fire = (event: AvatarEvent) => setAvatarState((s) => nextState(s, event));

  // Local test file for the pending commercial model (never committed).
  const onPickFile = (file: File | undefined) => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (!file) {
      setFileUrl(null);
      return;
    }
    setLoadError("");
    setFileUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      stopLabAudio();
    };
  }, []);

  const stopLabAudio = () => {
    try {
      labAudio.current.stream?.getTracks().forEach((t) => t.stop());
    } catch {
      // Already stopped.
    }
    try {
      void labAudio.current.ctx?.close();
    } catch {
      // Already closed.
    }
    labAudio.current = { ctx: null, stream: null, analyser: null };
    sync.analyserRef.current = null;
    setMicOn(false);
  };

  const testBrowserVoice = (language: VoiceLanguage) => {
    setVoiceResults((r) => ({ ...r, [language]: { ...NOT_TESTED, attempted: true, note: "يُشغَّل…" } }));
    fire("audio-start");
    const { utterance, missingVoice } = speakText(SAMPLE_LINES[language], language, () => fire("audio-end"));
    if (utterance) {
      // Approximate mode (honest label below): speechSynthesis exposes no audio
      // signal, so word-boundary events pump the mouth instead of an envelope.
      utterance.addEventListener("boundary", () => sync.pulse());
      setVoiceResults((r) => ({
        ...r,
        [language]: { attempted: true, voiceFound: !missingVoice, finished: "ok", note: missingVoice ? "نُطق بصوت بديل" : "بصوت اللغة" },
      }));
    } else {
      fire("audio-end");
      setVoiceResults((r) => ({ ...r, [language]: { attempted: true, voiceFound: false, finished: "no-utterance", note: "لا TTS في المتصفح" } }));
    }
  };

  const testItalianVoice = () => {
    if (!("speechSynthesis" in window)) {
      setVoiceResults((r) => ({ ...r, it: { attempted: true, voiceFound: false, finished: "no-tts", note: "لا TTS في المتصفح" } }));
      return;
    }
    setVoiceResults((r) => ({ ...r, it: { ...NOT_TESTED, attempted: true, note: "يُشغَّل…" } }));
    fire("audio-start");
    let settled = false;
    const done = (finished: string, voiceFound: boolean | null) => {
      if (settled) return;
      settled = true;
      fire("audio-end");
      setVoiceResults((r) => ({ ...r, it: { attempted: true, voiceFound, finished, note: "يؤكد الإنسان الجودة" } }));
    };
    const utterance = new SpeechSynthesisUtterance(ITALIAN_LINE);
    utterance.lang = "it-IT";
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang?.toLowerCase().startsWith("it")) ?? null;
    if (voice) {
      try {
        utterance.voice = voice;
      } catch {
        // lang tag alone still selects Italian.
      }
    }
    utterance.onend = () => done("ok", voice ? true : null);
    utterance.onerror = () => done("error", voice ? true : null);
    utterance.addEventListener("boundary", () => sync.pulse());
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    window.setTimeout(() => done("timeout", voice ? true : null), 20000);
  };

  const testMic = async () => {
    if (micOn) {
      stopLabAudio();
      fire("mic-close");
      return;
    }
    setMicError("");
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error("no-audio-context");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new Ctor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      labAudio.current = { ctx, stream, analyser };
      sync.analyserRef.current = analyser;
      setMicOn(true);
      fire("mic-open");
    } catch {
      setMicError("تعذّر فتح الميكروفون (تحقق من إذن المتصفح)");
    }
  };

  const testServerVoice = async () => {
    if (!sessionId.trim() || !messageId.trim()) {
      setServerVoiceNote("أدخل sessionId و messageId لردّ موجود (زر متقدم اختياري)");
      return;
    }
    setServerVoiceNote("يُحمَّل… (قد يُخلَّق الصوت إن لم يكن مخبأ — بفعلك أنت، لا الأفاتار)");
    try {
      const blob = await fetchSpeechAudio(sessionId.trim(), messageId.trim());
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error("no-audio-context");
      stopLabAudio();
      const ctx = new Ctor();
      const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      labAudio.current = { ctx, stream: null, analyser };
      sync.analyserRef.current = analyser;
      fire("audio-start");
      source.onended = () => {
        fire("audio-end");
        setServerVoiceNote("انتهى التشغيل");
      };
      source.start();
      setServerVoiceNote("يُشغَّل صوت الخادم عبر المحلل — راقب الفم");
    } catch {
      fire("audio-end");
      setServerVoiceNote("تعذّر الجلب (تحقق من المعرفات والجلسة)");
    }
  };

  // Event simulator: every button is a real machine event (never a direct pose),
  // so the Lab demonstrates the transition contract, including that silence
  // alone reaches no verdict.
  const eventButtons: Array<{ event: AvatarEvent; label: string }> = [
    { event: "mic-open", label: "فتح الميك (استماع)" },
    { event: "mic-close", label: "إغلاق الميك" },
    { event: "thinking-start", label: "بدء التفكير" },
    { event: "audio-start", label: "بدء الصوت (كلام)" },
    { event: "audio-end", label: "انتهاء الصوت" },
    { event: "verdict-correct", label: "تقييم: صحيحة" },
    { event: "verdict-partial", label: "تقييم: جزئية" },
    { event: "verdict-incorrect", label: "تقييم: خاطئة" },
  ];

  return (
    <div dir="rtl" style={{ maxWidth: 960, margin: "0 auto", padding: 16, fontFamily: "inherit" }}>
      <h1>مختبر الصورة الرمزية (Avatar Lab)</h1>
      <p>
        صفحة اختبار معزولة خلف <code>VITE_AVATAR_LAB=1</code> — لا تمس الدرس ولا الصوت ولا المناهج. الإزالة = حذف
        المجلد <code>src/avatar</code> ومدخل البناء.
      </p>

      <section style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>الشخصية والنموذج</h2>
        <label>
          الشخصية{" "}
          <select value={characterId} onChange={(e) => setCharacterId(e.target.value)} data-testid="lab-character">
            {AVATAR_CHARACTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))}
          </select>
        </label>
        <p>
          حالة النموذج:{" "}
          {characterModelStatus(character) === "ready" ? "جاهز" : "بانتظار نموذج مرخص تجاريًا"} — ملف تجريبي
          محلي (لا يُحفظ في المستودع): <input type="file" accept=".vrm" onChange={(e) => onPickFile(e.target.files?.[0])} data-testid="lab-model-file" />
        </p>
        {loadStatus === "error" && <p role="alert">خطأ التحميل: {loadError}</p>}
        {loadStatus === "loading" && <p>جارِ تحميل النموذج…</p>}
      </section>

      <section style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>المسرح والحالات</h2>
        <div style={{ width: "100%", height: 360, background: "#111", position: "relative" }} data-testid="lab-stage">
          <VrmAvatar
            model={model}
            avatarState={avatarState}
            getMouthOpen={sync.getMouthOpen}
            reducedMotion={reducedMotion || avatarState === "off"}
            onStatus={(s, detail) => {
              setLoadStatus(s);
              setLoadError(detail ?? "");
            }}
            onFps={setFps}
          />
        </div>
        <p>
          الحالة: <strong data-testid="lab-state">{AVATAR_STATE_AR[avatarState]}</strong> · FPS:{" "}
          <strong data-testid="lab-fps">{fps}</strong>{" "}
          {fps > 0 && fps < LOW_FPS_THRESHOLD && <span role="alert">(منخفض — يُنصح بالوضع الأخف)</span>}{" "}
          {reducedMotion && <span>(تقليل الحركة مفعّل)</span>}
        </p>
        <div>
          <button type="button" onClick={() => (avatarState === "off" ? fire("toggle-on") : fire("toggle-off"))} data-testid="lab-toggle">
            {avatarState === "off" ? "تشغيل الأفاتار" : "إيقاف الأفاتار"}
          </button>{" "}
          {eventButtons.map(({ event, label }) => (
            <button type="button" key={event} onClick={() => fire(event)} data-testid={`lab-event-${event}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>اختبار الأصوات (الوضع التقريبي مُعلَّن)</h2>
        <p>أصوات المتصفح لا تكشف إشارتها الصوتية — الفم يتحرك على حدود الكلمات هنا، لا على المظروف الحقيقي.</p>
        {(["ar", "en", "fr", "de"] as const).map((language) => (
          <div key={language}>
            <button type="button" onClick={() => testBrowserVoice(language)} data-testid={`lab-voice-${language}`}>
              اختبار {VOICE_LABEL_AR[language]}
            </button>{" "}
            <span data-testid={`lab-voice-${language}-result`}>
              {(() => {
                const r = voiceResults[language] ?? NOT_TESTED;
                const supported = canSpeakLanguage(language);
                return `${r.note} (صوت مثبت: ${r.voiceFound === null ? "؟" : r.voiceFound ? "نعم" : "لا"} · مدعوم مبدئيًا: ${supported ? "نعم" : "لا"})`;
              })()}
            </span>
          </div>
        ))}
        <div>
          <button type="button" onClick={testItalianVoice} data-testid="lab-voice-it">
            اختبار {VOICE_LABEL_AR.it} (تجريبي — ليس مدعومًا في المنتج بعد)
          </button>{" "}
          <span data-testid="lab-voice-it-result">
            {(() => {
              const r = voiceResults.it ?? NOT_TESTED;
              return `${r.note} (صوت مثبت: ${r.voiceFound === null ? "؟" : r.voiceFound ? "نعم" : "لا"})`;
            })()}
          </span>
        </div>
      </section>

      <section style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>اختبار الميكروفون (خط الصوت الحقيقي)</h2>
        <p>يمرر صوتك أنت عبر المحلل إلى الفم — إثبات خط الحركة من إشارة حقيقية دون أي TTS.</p>
        <button type="button" onClick={testMic} data-testid="lab-mic">
          {micOn ? "إيقاف الميكروفون" : "تشغيل الميكروفون"}
        </button>
        {micError && <p role="alert">{micError}</p>}
      </section>

      <section style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>اختبار صوت الخادم (متقدم، اختياري)</h2>
        <p>يشغّل ردًا موجودًا عبر المحلل — قد يُخلَّق الصوت إن لم يكن مخبأ (بفعلك أنت هنا، لا يضيف الأفاتار أي استدعاء).</p>
        <label>
          sessionId <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} data-testid="lab-session" />
        </label>{" "}
        <label>
          messageId <input value={messageId} onChange={(e) => setMessageId(e.target.value)} data-testid="lab-message" />
        </label>{" "}
        <button type="button" onClick={testServerVoice} data-testid="lab-server-voice">
          تشغيل صوت الخادم
        </button>
        {serverVoiceNote && <p>{serverVoiceNote}</p>}
      </section>
    </div>
  );
}
