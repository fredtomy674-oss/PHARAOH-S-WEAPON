import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { LearningGoal } from "./goals.js";
import { challengeMission, challengeSteps, type ChallengeStep } from "./challenge.js";
import type { LearningStrength } from "./strength.js";

interface Props {
  strength: LearningStrength;
  goals: LearningGoal[];
  onPractice: (conceptId: string, conceptTitle: string | null, source: "goal") => void;
}

/** The five checkpoints, drawn from bottom-right (start) to top-left (summit). */
const POINTS = [
  { x: 88, y: 83 },
  { x: 68, y: 67 },
  { x: 50, y: 53 },
  { x: 30, y: 35 },
  { x: 12, y: 17 },
] as const;

/** One smooth trail through the checkpoints; the gold fill follows the score. */
const TRAIL =
  "M 88 83 C 81 78 74 71 68 67 S 58 58 50 53 S 39 42 30 35 S 20 24 12 17";

const CONTOURS = [
  "M -8 70 C 18 58 36 72 58 60 S 92 45 110 52",
  "M -8 84 C 15 75 30 88 54 77 S 87 63 110 70",
  "M 6 104 C 22 87 36 91 49 79 S 63 69 78 72",
  "M 39 8 C 49 20 60 17 68 29 S 80 42 94 40",
] as const;

const DUST = [
  [15, 48],
  [24, 57],
  [42, 29],
  [57, 38],
  [74, 50],
  [82, 32],
  [93, 26],
  [63, 80],
] as const;

function stateLabel(state: ChallengeStep["state"]): string {
  if (state === "done") return "محطة أنجزتها";
  if (state === "current") return "أنت هنا";
  if (state === "next") return "المحطة التالية";
  return "محطة أبعد";
}

function detailText(step: ChallengeStep, strength: LearningStrength): string {
  if (step.state === "done") {
    return `تجاوزت هذه المحطة — قوّتك الآن ${strength.score} من 100.`;
  }
  if (step.state === "current") {
    if (strength.nextLevelAt !== null) {
      const left = Math.max(0, strength.nextLevelAt - strength.score);
      return `أنت هنا الآن. جمعت ${strength.score} نقطة، وبقي ${left} نقطة للوصول إلى المستوى ${strength.level + 1}.`;
    }
    return "أنت على القمة. حافظ على إتقانك وارفع قوّتك كل يوم.";
  }
  if (step.state === "next") {
    return `المحطة التالية تفتح عند ${step.min} نقطة — بقي ${Math.max(0, step.min - strength.score)} نقطة.`;
  }
  return `محطة أبعد على الطريق — تفتح عند ${step.min} نقطة.`;
}

/**
 * PHASE 183 — the interactive replacement for «واحة النيل».
 *
 * This is a progress map, not decoration: every checkpoint is a real strength
 * band, the gold trail and the marker grow from the student's actual score, a
 * checkpoint can be selected to read what it means, and the one action is a
 * real concept mission from `nextGoals`. Same mastery always paints the same
 * map (the pure model is pinned by `challenge.test.ts`).
 */
export function JourneyChallenge({ strength, goals, onPractice }: Props) {
  const steps = useMemo(() => challengeSteps(strength), [strength]);
  const mission = useMemo(() => challengeMission(goals), [goals]);
  const [selected, setSelected] = useState<number>(strength.level);

  // A real level-up should move the marker to the new camp; a click inside the
  // same level must not be stolen by a parent re-render.
  useEffect(() => {
    setSelected(strength.level);
  }, [strength.level]);

  const step = steps[selected - 1] ?? steps[0]!;
  const score = Math.max(0, Math.min(100, strength.score));
  const onTheWay = Math.max(0, strength.practiced - strength.mastered);

  return (
    <div
      className="jn-quest"
      data-testid="journey-challenge"
      data-level={strength.level}
      data-score={strength.score}
      data-mastered={strength.mastered}
    >
      <div className="jn-quest__head">
        <div>
          <span className="jn-quest__eyebrow">مسارك الحالي</span>
          <strong className="jn-quest__level">
            المستوى {strength.level} · {strength.levelNameAr}
          </strong>
        </div>
        <div className="jn-quest__points" aria-label={`${strength.score} من 100 نقطة`}>
          <b>{strength.score}</b>
          <span>/100</span>
        </div>
      </div>

      <div className="jn-quest__map">
        <svg className="jn-quest__scene" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {CONTOURS.map((d) => (
            <path key={d} className="jn-quest__contour" d={d} />
          ))}
          {DUST.map(([x, y]) => (
            <circle key={`${x}-${y}`} className="jn-quest__dust" cx={x} cy={y} r="0.8" />
          ))}
          <path className="jn-quest__trail" d={TRAIL} />
          <path
            className="jn-quest__trail-fill"
            d={TRAIL}
            pathLength={100}
            strokeDasharray={`${Math.max(1, score)} 100`}
          />
        </svg>
        <span className="jn-quest__edge jn-quest__edge--start">البداية</span>
        <span className="jn-quest__edge jn-quest__edge--summit">القمة</span>

        {steps.map((item, index) => {
          const point = POINTS[index]!;
          const style = { left: `${point.x}%`, top: `${point.y}%` } as CSSProperties;
          return (
            <button
              key={item.level}
              type="button"
              className="jn-quest__node"
              style={style}
              data-testid="challenge-node"
              data-level={item.level}
              data-state={item.state}
              aria-current={item.state === "current" ? "step" : undefined}
              aria-pressed={selected === item.level}
              aria-label={`المستوى ${item.level} — ${item.name} (${stateLabel(item.state)})`}
              onClick={() => setSelected(item.level)}
            >
              <span className="jn-quest__node-ball">
                {item.state === "done" ? "✓" : item.level}
              </span>
              {item.state === "current" && <span className="jn-quest__here">أنت</span>}
            </button>
          );
        })}
      </div>

      <div
        className="jn-quest__detail"
        data-testid="challenge-detail"
        data-level={step.level}
        data-state={step.state}
        aria-live="polite"
      >
        <div className="jn-quest__detail-copy">
          <span className="jn-quest__eyebrow">{stateLabel(step.state)}</span>
          <b>
            {step.level} · {step.name}
          </b>
          <p>{detailText(step, strength)}</p>
        </div>
        <span className="jn-quest__band">
          {step.min}–{step.max} نقطة
        </span>
      </div>

      {mission ? (
        <div className="jn-quest__mission" data-testid="challenge-mission">
          <div className="jn-quest__mission-copy">
            <span className="jn-quest__eyebrow">تحدّي اليوم</span>
            <b>{mission.title}</b>
            <p>{mission.detail}</p>
            <div className="jn-quest__mission-bar" aria-hidden="true">
              <span style={{ width: `${Math.round(mission.progress * 100)}%` }} />
            </div>
          </div>
          <button
            type="button"
            className="jn-quest__cta"
            data-testid="challenge-practice"
            onClick={() => onPractice(mission.conceptId!, mission.conceptTitle ?? null, "goal")}
          >
            ابدأ التحدي ⚡
          </button>
        </div>
      ) : (
        <div className="jn-quest__mission jn-quest__mission--empty" data-testid="challenge-mission-empty">
          <div className="jn-quest__mission-copy">
            <span className="jn-quest__eyebrow">تحدّي اليوم</span>
            <b>{strength.practiced > 0 ? "لا تحدٍّ جديد الآن" : "أول تحدٍّ بانتظارك"}</b>
            <p>
              {strength.practiced > 0
                ? "راجع دفتر أخطائك أو افتح درسًا جديدًا — كل خطوة ترفع نقاطك."
                : "ابدأ درسًا أو تمرينًا واحدًا، وسيظهر هنا أول تحدٍّ حقيقي."}
            </p>
          </div>
        </div>
      )}

      <div className="jn-quest__foot">
        <span>
          <b>{strength.mastered}</b> متقن
        </span>
        <span>
          <b>{onTheWay}</b> على الطريق
        </span>
        <span>
          <b>{strength.practiced}</b> مفهومًا جرّبته
        </span>
      </div>
    </div>
  );
}
