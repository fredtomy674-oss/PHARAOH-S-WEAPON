import type { CSSProperties } from "react";
import type { Garden } from "./garden.js";

/**
 * PHASE 161.1 — «واحة النيل» 2.0: نفس الحديقة الحتمية بهوية حديثة نابضة —
 * سماء ذهبية تتدرج إلى فيروزي، شمس متوهجة، كثبان، نيل بموجات حيّة، ونباتات
 * زمردية تنبت أمام الطالب. ليلًا تتحول الواحة إلى توهّج فيروزي بنجوم.
 *
 * ما زال كل شيء SVG خالصًا من الرموز (لا خدمات ولا صور)، والحزمة الواحدة
 * تحمل نفس عقود W6: data-kind + data-concept و<title> باسم المفهوم — الرسم
 * مقروء (وقابل للاختبار) بلا ألوان.
 *
 * الحركة زينة فقط: إنبات متتابع وتمايل خفيف — وكلها تسقط معها في
 * prefers-reduced-motion (journey.css).
 */

const W = 720;
const H = 260;
const BANK = 204;
const PAD = 44;

/** مواضع ثابتة للعصافير — يسار الشمس فوق الماء. */
const BIRD_SPOTS = [
  { x: 506, y: 64 },
  { x: 556, y: 92 },
  { x: 470, y: 100 },
];

/** نجوم ثابتة — سماء الليل نفسها في كل زيارة. */
const STAR_SPOTS = [
  { x: 60, y: 34, r: 1.6 },
  { x: 128, y: 66, r: 1.2 },
  { x: 204, y: 28, r: 1.5 },
  { x: 268, y: 84, r: 1.1 },
  { x: 330, y: 40, r: 1.7 },
  { x: 392, y: 96, r: 1.2 },
  { x: 452, y: 30, r: 1.4 },
  { x: 512, y: 148, r: 1.2 },
  { x: 590, y: 118, r: 1.3 },
  { x: 636, y: 140, r: 1.1 },
  { x: 172, y: 112, r: 1.3 },
  { x: 88, y: 88, r: 1.1 },
];

function Palm() {
  return (
    <g className="jn-g jn-g--palm">
      <path className="jn-g__trunk" d="M0 0 C -3 -30 4 -52 3 -74" />
      <path className="jn-g__frond" d="M3 -74 C -18 -84 -34 -78 -44 -68" />
      <path className="jn-g__frond" d="M3 -74 C -14 -92 -28 -94 -40 -90" />
      <path className="jn-g__frond" d="M3 -74 C 0 -96 10 -102 24 -98" />
      <path className="jn-g__frond" d="M3 -74 C 22 -92 38 -90 48 -80" />
      <path className="jn-g__frond" d="M3 -74 C 16 -80 30 -76 40 -66" />
      <circle className="jn-g__date" cx="-10" cy="-70" r="3" />
      <circle className="jn-g__date" cx="14" cy="-72" r="3" />
    </g>
  );
}

function Papyrus() {
  return (
    <g className="jn-g jn-g--papyrus">
      <path className="jn-g__stem" d="M0 0 C 0 -30 -1 -46 0 -58" />
      <path className="jn-g__umbel" d="M0 -58 L -13 -80" />
      <path className="jn-g__umbel" d="M0 -58 L -6 -87" />
      <path className="jn-g__umbel" d="M0 -58 L 0 -90" />
      <path className="jn-g__umbel" d="M0 -58 L 7 -86" />
      <path className="jn-g__umbel" d="M0 -58 L 13 -79" />
    </g>
  );
}

function Lotus() {
  return (
    <g className="jn-g jn-g--lotus">
      <path className="jn-g__stem" d="M0 0 C 0 -14 0 -20 0 -26" />
      <path className="jn-g__petal" d="M0 -26 C -12 -34 -10 -46 0 -52 C 10 -46 12 -34 0 -26 Z" />
      <path className="jn-g__petal" d="M0 -28 C -16 -32 -18 -42 -14 -46 C -6 -44 -2 -36 0 -28 Z" />
      <path className="jn-g__petal" d="M0 -28 C 16 -32 18 -42 14 -46 C 6 -44 2 -36 0 -28 Z" />
      <ellipse className="jn-g__leaf" cx="-11" cy="-5" rx="11" ry="4" />
    </g>
  );
}

function Sprout() {
  return (
    <g className="jn-g jn-g--sprout">
      <path className="jn-g__stem" d="M0 0 C 0 -8 0 -13 0 -18" />
      <path className="jn-g__frond" d="M0 -10 C -7 -14 -11 -22 -13 -28 C -6 -27 -1 -20 0 -10" />
      <path className="jn-g__frond" d="M0 -8 C 7 -11 12 -18 14 -24 C 7 -24 1 -17 0 -8" />
    </g>
  );
}

function Bud() {
  return (
    <g className="jn-g jn-g--bud">
      <path className="jn-g__stem" d="M0 0 L 0 -13" />
      <ellipse className="jn-g__bud" cx="0" cy="-18" rx="4" ry="7" />
    </g>
  );
}

const GLYPH = {
  palm: <Palm />,
  papyrus: <Papyrus />,
  lotus: <Lotus />,
  sprout: <Sprout />,
  bud: <Bud />,
} as const;

export function NileGarden({ garden }: { garden: Garden }) {
  return (
    <svg
      className="jn-garden"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`واحة إتقانك على النيل — ${garden.plants.length} نباتًا و${garden.mastered} نخلة`}
      data-testid="journey-garden"
      data-plants={garden.plants.length}
      data-mastered={garden.mastered}
      data-river={garden.river}
    >
      <defs>
        <linearGradient id="jn-sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-2)" }} />
        </linearGradient>
        <linearGradient id="jn-water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--water-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--water-2)" }} />
        </linearGradient>
        <linearGradient id="jn-sand-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sand)" }} />
          <stop offset="1" style={{ stopColor: "var(--sand-2)" }} />
        </linearGradient>
        <radialGradient id="jn-sun-grad">
          <stop offset="0" style={{ stopColor: "var(--sun-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--sun-2)" }} />
        </radialGradient>
      </defs>

      <rect className="jn-sky" x="0" y="0" width={W} height={BANK + 10} />

      <g className="jn-stars" aria-hidden="true">
        {STAR_SPOTS.map((s, i) => (
          <circle key={`${s.x}-${s.y}`} className="jn-star" cx={s.x} cy={s.y} r={s.r} style={{ "--i": i } as CSSProperties} />
        ))}
      </g>

      <circle className="jn-sun-glow" cx="642" cy="54" r="46" />
      <circle className="jn-sun-rays" cx="642" cy="54" r="35" />
      <circle className="jn-sun" cx="642" cy="54" r="26" />

      <g className="jn-birds" aria-hidden="true">
        {BIRD_SPOTS.slice(0, garden.birds).map((b, i) => (
          <path
            key={`${b.x}-${b.y}`}
            className="jn-bird"
            style={{ "--i": i } as CSSProperties}
            d={`M${b.x} ${b.y} q 9 -8 18 0 q 9 -8 18 0`}
          />
        ))}
      </g>

      <path className="jn-dune" d="M0 186 Q 150 164 320 184 T 720 180 L 720 206 L 0 206 Z" />
      <path className="jn-bank" d="M0 200 Q 180 188 360 200 T 720 200 L 720 260 L 0 260 Z" />
      <path
        className="jn-water"
        data-level={garden.river}
        d="M0 212 Q 180 202 360 212 T 720 212 L 720 260 L 0 260 Z"
      />
      <path className="jn-shine" d="M120 226 q 30 -6 60 0 M420 238 q 30 -6 60 0 M560 224 q 24 -5 48 0" />
      <path className="jn-wave" style={{ "--i": 0 } as CSSProperties} d="M60 222 q 20 -7 40 0 t 40 0 t 40 0" />
      <path className="jn-wave" style={{ "--i": 1 } as CSSProperties} d="M430 232 q 20 -7 40 0 t 40 0 t 40 0" />

      {garden.plants.map((p, i) => (
        <g
          key={p.conceptId}
          className="jn-plant"
          transform={`translate(${(PAD + p.x * (W - PAD * 2)).toFixed(2)} ${BANK}) scale(${p.scale.toFixed(3)})`}
          data-kind={p.kind}
          data-concept={p.conceptId}
          data-testid="garden-plant"
        >
          <title>{p.title}</title>
          <g className="jn-plant__grow" style={{ "--i": i } as CSSProperties}>
            <g className="jn-plant__sway">
              {p.kind === "palm" && <ellipse className="jn-halo" cx="2" cy="-40" rx="32" ry="36" />}
              {GLYPH[p.kind]}
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}
