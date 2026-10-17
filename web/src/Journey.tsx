import { useEffect, useMemo, useState } from "react";
import {
  getMyAchievements,
  getPracticeQuestion,
  getSessionRecap,
  lessonBreadcrumb,
  listSessions,
  myMistakes,
  myProgress,
  submitPracticeAnswer,
  type AchievementsResult,
  type LearningSession,
  type MistakeItem,
  type PracticeQuestion,
  type PracticeResult,
  type ProgressDetail,
  type SessionRecap,
  type User,
} from "./api.js";
import { Button, Card, Chip } from "./components/ui/index.js";
import { growGarden, type GardenConceptInput } from "./journey/garden.js";
import { NileGarden } from "./journey/NileGarden.js";

interface Props {
  user: User;
  onBack: () => void;
}

/** PHASE 161 (W6) — how many past sessions the log shows. */
const SESSION_LIMIT = 6;

/** Arabic count of repetitions: مرة واحدة · مرتان · N مرات · N مرة. */
function timesLabel(n: number): string {
  if (n <= 0) return "";
  if (n === 1) return "مرة واحدة";
  if (n === 2) return "مرتان";
  return n <= 10 ? `${n} مرات` : `${n} مرة`;
}

function minutesLabel(a: LearningSession): string {
  if (!a.endedAt) return "جارية الآن";
  const mins = Math.max(1, Math.round((new Date(a.endedAt).getTime() - new Date(a.startedAt).getTime()) / 60_000));
  return `${mins} دقيقة`;
}

interface JourneyPractice {
  conceptId: string;
  conceptTitle: string | null;
  question: PracticeQuestion | null;
  loading: boolean;
  chosen: number | null;
  busy: boolean;
  result: PracticeResult | null;
  error: string | null;
  shownAt: number;
}

/**
 * PHASE 161 (W6) — «رحلتي»: the journey space rebuilt from the old
 * achievements screen. A deterministic Nile garden grown from real mastery,
 * the concept map, the same twelve badges (same contracts), the session log
 * with its safe recap, and «دفتر أخطائي» where a wrong pick opens a practice
 * scoped to its concept.
 */
export function JourneyScreen({ user, onBack }: Props) {
  const [progress, setProgress] = useState<ProgressDetail | null>(null);
  const [ach, setAch] = useState<AchievementsResult | null>(null);
  const [achError, setAchError] = useState(false);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [recap, setRecap] = useState<SessionRecap | null>(null);
  const [mistakes, setMistakes] = useState<MistakeItem[] | null>(null);
  const [practice, setPractice] = useState<JourneyPractice | null>(null);

  useEffect(() => {
    let alive = true;
    myProgress()
      .then((p) => alive && setProgress(p))
      .catch(() => undefined);
    getMyAchievements()
      .then((a) => alive && setAch(a))
      .catch(() => alive && setAchError(true));
    myMistakes()
      .then((m) => alive && setMistakes(m))
      .catch(() => alive && setMistakes([]));
    listSessions()
      .then(async (all) => {
        if (!alive) return;
        setSessions(all);
        const recent = all.slice(0, SESSION_LIMIT);
        const ids = [...new Set(recent.map((s) => s.lessonId))];
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const bc = await lessonBreadcrumb(id);
              return [id, bc.lesson.title] as const;
            } catch {
              return [id, ""] as const;
            }
          }),
        );
        if (alive) setTitles(Object.fromEntries(pairs.filter(([, t]) => t !== "")));
        const lastEnded = all.find((s) => s.status === "ended");
        if (!lastEnded) return;
        try {
          const r = await getSessionRecap(lastEnded.id);
          if (alive) setRecap(r);
        } catch {
          /* بلا ملخص — نخفي ولا نخترع */
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const garden = useMemo(() => {
    const concepts: GardenConceptInput[] = (progress?.mastery ?? []).map((m) => ({
      conceptId: m.conceptId,
      title: m.title,
      level: m.level,
      mastery: m.decayedMastery,
    }));
    return growGarden(concepts);
  }, [progress]);

  const masterySorted = useMemo(
    () => [...(progress?.mastery ?? [])].sort((a, b) => b.decayedMastery - a.decayedMastery),
    [progress],
  );

  const refreshAfterAnswer = () => {
    myProgress()
      .then(setProgress)
      .catch(() => undefined);
    myMistakes()
      .then(setMistakes)
      .catch(() => undefined);
  };

  const openPractice = (item: MistakeItem) => {
    if (!item.conceptId) return;
    setPractice({
      conceptId: item.conceptId,
      conceptTitle: item.conceptTitle,
      question: null,
      loading: true,
      chosen: null,
      busy: false,
      result: null,
      error: null,
      shownAt: Date.now(),
    });
    getPracticeQuestion(item.conceptId, "mcq")
      .then((q) =>
        setPractice((p) =>
          p && p.conceptId === item.conceptId
            ? { ...p, loading: false, question: q, error: q ? null : "لا يوجد سؤال جاهز لهذا المفهوم بعد." }
            : p,
        ),
      )
      .catch(() =>
        setPractice((p) =>
          p && p.conceptId === item.conceptId ? { ...p, loading: false, error: "تعذّر تحميل السؤال — حاول مرة أخرى." } : p,
        ),
      );
  };

  const submitPractice = () => {
    if (!practice || !practice.question || practice.chosen === null) return;
    const qid = practice.question.id;
    const seconds = Math.max(1, Math.round((Date.now() - practice.shownAt) / 1000));
    setPractice((p) => (p ? { ...p, busy: true } : p));
    submitPracticeAnswer(qid, practice.chosen, seconds)
      .then((result) => {
        setPractice((cur) => (cur && cur.question?.id === qid ? { ...cur, busy: false, result } : cur));
        refreshAfterAnswer();
      })
      .catch(() =>
        setPractice((cur) =>
          cur && cur.question?.id === qid ? { ...cur, busy: false, error: "تعذّر إرسال الإجابة — حاول مرة أخرى." } : cur,
        ),
      );
  };

  const name = user.student?.displayName ?? user.email;

  return (
    <div className="jn-layout">
      <main className="jn-main" data-testid="achievements-screen">
        <div className="jn-topbar">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="achievements-back">
            عودة للرئيسية
          </Button>
        </div>

        <header className="jn-hero">
          <h2 className="jn-hero__title" data-testid="journey-title">
            🌱 رحلتي
          </h2>
          <p className="jn-hero__sub">
            يا {name}، حديقتك تنمو كلما تقوّى إتقانك — وكل خطأ هنا فرصة لتقفز من جديد.
          </p>
          <div className="jn-hero__stats">
            <span className="jn-stat" data-testid="journey-stat-mastered">
              🌴 {garden.mastered} نخلة
            </span>
            <span className="jn-stat" data-testid="journey-stat-badges">
              🏆 {ach ? `${ach.earned} من ${ach.total}` : "—"} شارة
            </span>
            <span className="jn-stat" data-testid="journey-stat-mistakes">
              📝 {mistakes ? mistakes.length : "—"} في دفتر الأخطاء
            </span>
          </div>
        </header>

        <Card
          className="jn-card jn-card--garden"
          title="🌴 حديقتي على النيل"
          hint="كل مفهوم تتقنه يُنبت نخلة — والإتقان الأعمق يطول أمامك. نفس الإتقان = نفس الحديقة، دائمًا."
        >
          <NileGarden garden={garden} />
          <ul className="jn-legend" data-testid="garden-legend">
            <li>
              <i className="jn-dot jn-dot--palm" aria-hidden="true" /> نخلة = متقن
            </li>
            <li>
              <i className="jn-dot jn-dot--papyrus" aria-hidden="true" /> بردي = متقدم
            </li>
            <li>
              <i className="jn-dot jn-dot--lotus" aria-hidden="true" /> لوتس = نامٍ
            </li>
            <li>
              <i className="jn-dot jn-dot--sprout" aria-hidden="true" /> شتلة = يحتاج مراجعة
            </li>
          </ul>
          {garden.plants.length === 0 && (
            <p className="jn-empty" data-testid="journey-garden-empty">
              الحديقة بانتظارك — ابدأ جلسة أو تمرينًا وسيظهر أول برعم هنا.
            </p>
          )}
        </Card>

        <Card className="jn-card" title="📈 إتقاني" hint="خريطة مفاهيمك بالألوان الهادئة — من هنا تعرف أين تقف بالضبط."
          data-testid="journey-mastery">
          {masterySorted.length > 0 ? (
            <ul className="jn-mastery">
              {masterySorted.map((m) => (
                <li key={m.conceptId} className="jn-mastery__item" data-testid="journey-mastery-item" data-level={m.level}>
                  <span className="jn-mastery__title">{m.title}</span>
                  <span className="jn-mastery__meta">
                    <Chip tone="outline">{m.labelAr}</Chip>
                    <span className="jn-mastery__pct">{Math.round(m.decayedMastery * 100)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="jn-empty" data-testid="journey-mastery-empty">
              لا مفاهيم متتبَّعة بعد — أول تمرين سيرسم أول نقطة على خريطتك.
            </p>
          )}

          {progress && (progress.progress.strengths.length > 0 || progress.progress.weaknesses.length > 0) && (
            <div className="jn-traits">
              {progress.progress.strengths.length > 0 && (
                <div className="jn-traits__group">
                  <span className="jn-traits__label">نقاط قوتك</span>
                  <div className="jn-traits__chips">
                    {progress.progress.strengths.map((s) => (
                      <span key={s.conceptId} data-testid="journey-strength">
                        <Chip tone="gold" icon="💪">
                          {s.title}
                        </Chip>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {progress.progress.weaknesses.length > 0 && (
                <div className="jn-traits__group">
                  <span className="jn-traits__label">يحتاج نظرة</span>
                  <div className="jn-traits__chips">
                    {progress.progress.weaknesses.map((w) => (
                      <span key={w.conceptId} data-testid="journey-weakness">
                        <Chip tone="outline" icon="🔎">
                          {w.title}
                        </Chip>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card
          className="jn-card"
          title="🏆 إنجازاتي"
          hint="الشارات تُفتح من ممارستك الحقيقية — كل شارة تحكي خطوة خطوتها."
          data-testid="journey-achievements"
        >
          {ach && (
            <p className="jn-earned">
              حصلت على <b data-testid="achievements-earned">{ach.earned}</b> من <b>{ach.total}</b> شارة — تابع واجمعها كلها!
            </p>
          )}
          {achError && <p className="jn-empty">تعذّر تحميل الإنجازات — حاول مرة أخرى.</p>}
          {ach && (
            <ul className="achievement-list" data-testid="achievement-list">
              {ach.achievements.map((a) => {
                const earned = a.awardedAt !== null;
                return (
                  <li
                    key={a.code}
                    className={`achievement-row ${earned ? "" : "locked"}`}
                    data-testid="achievement-row"
                    data-code={a.code}
                    data-earned={earned}
                  >
                    <span className="achievement-icon" aria-hidden="true">
                      {earned ? "🏆" : "🔒"}
                    </span>
                    <div className="achievement-body">
                      <b className="achievement-title" data-testid="achievement-title">
                        {a.title}
                      </b>
                      <span className="jn-muted">{a.description}</span>
                    </div>
                    <time className="jn-muted">
                      {earned ? new Date(a.awardedAt!).toLocaleDateString("ar-EG") : "غير مكتملة"}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="jn-card" title="🗓️ سجل جلساتي" hint="آخر جلساتك مع ملخص آمن — أرقام ومواضيع، بلا نصوص محادثات."
          data-testid="journey-sessions">
          {sessions.length > 0 ? (
            <ul className="jn-sessions">
              {sessions.slice(0, SESSION_LIMIT).map((s) => (
                <li key={s.id} className="jn-session" data-testid="journey-session" data-status={s.status}>
                  <span className="jn-session__title">{titles[s.lessonId] ?? "جلسة درس"}</span>
                  <span className="jn-session__meta">
                    <span>{new Date(s.startedAt).toLocaleDateString("ar-EG")}</span>
                    <span aria-hidden="true">·</span>
                    <span>{minutesLabel(s)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="jn-empty" data-testid="journey-sessions-empty">
              لا جلسات بعد — حين تبدأ جلستك الأولى سيظهر سجلها هنا.
            </p>
          )}

          {recap && (
            <div className="jn-recap" data-testid="journey-recap">
              <b className="jn-recap__head">{recap.headline}</b>
              <p className="jn-recap__focus">{recap.focus}</p>
              <div className="jn-recap__stats">
                <Chip tone="outline">{recap.durationMinutes} دقيقة</Chip>
                <Chip tone="outline">{recap.userMessages + recap.tutorMessages} رسالة</Chip>
                <Chip tone="outline">{recap.attachmentCount} مرفق</Chip>
              </div>
              {recap.concepts.length > 0 && (
                <ul className="jn-recap__concepts">
                  {recap.concepts.slice(0, 4).map((c) => (
                    <li key={c.title}>
                      {c.title} — {c.correct}/{c.attempts}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        <Card className="jn-card" title="📝 دفتر أخطائي" hint="آخر اختياراتك الخاطئة — من هنا تراجعها بنقرة تمرين على نفس المفهوم."
          data-testid="journey-mistakes">
          {mistakes && mistakes.length > 0 ? (
            <ul className="jn-mistakes">
              {mistakes.map((m) => (
                <li key={m.questionId} className="jn-mistake" data-testid="journey-mistake" data-concept={m.conceptId ?? ""}>
                  <p className="jn-mistake__q">{m.question}</p>
                  <p className="jn-mistake__pick">
                    اخترت: <b>{m.chosen}</b> · <span>{timesLabel(m.count)}</span>
                  </p>
                  <div className="jn-mistake__foot">
                    <span className="jn-mistake__where">
                      {m.conceptTitle ?? "بدون مفهوم"}
                      {m.lessonTitle ? ` — ${m.lessonTitle}` : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPractice(m)}
                      disabled={!m.conceptId}
                      data-testid="journey-mistake-review"
                    >
                      راجع هذه ↩
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="jn-empty" data-testid="journey-mistakes-empty">
              دفترك نظيف — لا أخطاء مسجَّلة بعد. وإن وقع خطأ فسنحفظه هنا للمراجعة.
            </p>
          )}

          {practice && (
            <div className="jn-practice" data-testid="journey-practice" data-concept={practice.conceptId}>
              <div className="jn-practice__head">
                <span className="jn-practice__title">تمرين مراجعة — {practice.conceptTitle ?? "المفهوم"}</span>
                <Button variant="quiet" size="sm" onClick={() => setPractice(null)} data-testid="journey-practice-close">
                  إغلاق ✕
                </Button>
              </div>

              {practice.loading && <p className="jn-empty">…نجهّز سؤالًا</p>}
              {practice.error && <p className="jn-empty" data-testid="journey-practice-error">{practice.error}</p>}

              {practice.question && !practice.result && (
                <>
                  <p className="jn-practice__question" data-testid="journey-practice-question">
                    {practice.question.content}
                  </p>
                  <ul className="jn-practice__options">
                    {(practice.question.options ?? []).map((opt, i) => (
                      <li key={`${practice.question!.id}-${i}`}>
                        <button
                          type="button"
                          className={`jn-option ${practice.chosen === i ? "jn-option--picked" : ""}`}
                          onClick={() => setPractice((p) => (p ? { ...p, chosen: i } : p))}
                          disabled={practice.busy}
                          data-testid="journey-practice-option"
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={submitPractice}
                    disabled={practice.chosen === null || practice.busy}
                    data-testid="journey-practice-submit"
                  >
                    {practice.busy ? "…" : "تحقّق ✓"}
                  </Button>
                </>
              )}

              {practice.result && (
                <div
                  className={`jn-feedback ${practice.result.correct ? "jn-feedback--good" : "jn-feedback--weak"}`}
                  data-testid="journey-practice-feedback"
                  data-correct={practice.result.correct}
                >
                  <b>{practice.result.correct ? "أحسنت! إجابة صحيحة." : "إجابة غير صحيحة — راجع الشرح ثم تابع."}</b>
                  {practice.result.explanation && <p className="jn-feedback__why">{practice.result.explanation}</p>}
                  {practice.result.mastery && (
                    <span data-testid="journey-practice-mastery">
                      <Chip tone="outline">
                        {practice.result.mastery.labelAr} · {Math.round(practice.result.mastery.decayedScore * 100)}%
                      </Chip>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
