import type { Garden } from "./garden.js";

/**
 * PHASE 161 (W6) — «حديقتي على النيل» drawn inline: a quiet Nile bank whose
 * plants are the garden model itself (no services, no images). Every glyph is
 * a plain SVG shape coloured from the design tokens, so both themes work.
 *
 * The plant group carries data-kind + data-concept, and its <title> is the
 * concept name — the drawing is readable (and testable) without colour.
 */

const W = 720;
const BANK = 204;
const PAD = 44;

/** Fixed bird positions — left of the sun, high over the water. */
const BIRD_SPOTS = [
  { x: 506, y: 64 },
  { x: 556, y: 92 },
  { x: 470, y: 100 },
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
      viewBox={`0 0 ${W} 260`}
      role="img"
      aria-label={`حديقتك على النيل — ${garden.plants.length} نباتًا و${garden.mastered} نخلة`}
      data-testid="journey-garden"
      data-plants={garden.plants.length}
      data-mastered={garden.mastered}
      data-river={garden.river}
    >
      <circle className="jn-sun" cx="642" cy="54" r="26" />
      {BIRD_SPOTS.slice(0, garden.birds).map((b) => (
        <path key={`${b.x}-${b.y}`} className="jn-bird" d={`M${b.x} ${b.y} q 9 -8 18 0 q 9 -8 18 0`} />
      ))}

      <path className="jn-bank" d="M0 200 Q 180 188 360 200 T 720 200 L 720 260 L 0 260 Z" />
      <path
        className="jn-water"
        data-level={garden.river}
        d="M0 212 Q 180 202 360 212 T 720 212 L 720 260 L 0 260 Z"
      />
      <path className="jn-wave" d="M60 222 q 20 -7 40 0 t 40 0 t 40 0" />
      <path className="jn-wave" d="M430 232 q 20 -7 40 0 t 40 0 t 40 0" />

      {garden.plants.map((p) => (
        <g
          key={p.conceptId}
          className="jn-plant"
          transform={`translate(${(PAD + p.x * (W - PAD * 2)).toFixed(2)} ${BANK}) scale(${p.scale.toFixed(3)})`}
          data-kind={p.kind}
          data-concept={p.conceptId}
          data-testid="garden-plant"
        >
          <title>{p.title}</title>
          {GLYPH[p.kind]}
        </g>
      ))}
    </svg>
  );
}
