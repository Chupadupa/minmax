import { useMemo } from "react";
import { BodyPicture } from "./BodyPicture.jsx";
import { planetNumber } from "./bodies.js";
import { HIT_RADIUS } from "./layout.js";
import { NB_COLORS, NB_SOLID } from "../shared/numberblockColors.js";

// ── Solar Map ────────────────────────────────────────────────────────────────
//
// The journey down the page: the Sun's edge at the top, then every planet and
// dwarf planet in order along a dotted path, with the asteroid and Kuiper belts
// drawn where they lie. Positions come ready-made from layout.js; this file
// only draws them and reports taps.

// A gentle S-curve through the bodies, vertical as it leaves and arrives.
function pathThrough(points) {
  return points
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = points[i - 1];
      const my = (py + y) / 2;
      return `C ${px} ${my} ${x} ${my} ${x} ${y}`;
    })
    .join(" ");
}

function dotsFor(seed, width, y0, y1) {
  let a = seed;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const count = Math.min(220, Math.max(40, Math.round(((y1 - y0) * width) / 400)));
  return Array.from({ length: count }, () => ({
    x: rnd() * width,
    y: y0 + rnd() * (y1 - y0),
    r: 0.8 + rnd() * 1.6,
    o: 0.25 + rnd() * 0.5,
  }));
}

function Belt({ belt, width }) {
  const dots = useMemo(() => dotsFor(belt.id.length * 977, width, belt.y0, belt.y1), [belt.id, belt.y0, belt.y1, width]);
  return (
    <g>
      <rect x={0} y={belt.y0} width={width} height={belt.y1 - belt.y0} fill="rgba(255,255,255,0.03)" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#d9d0c0" fillOpacity={d.o} />
      ))}
      <text x={12} y={belt.y0 + 16} className="map-belt-label">{belt.label}</text>
    </g>
  );
}

function numberStyle(n) {
  if (n === 7) return { background: NB_COLORS["7"] };
  return { background: NB_SOLID[String(n)] };
}

function MapBody({ item, label, number, onPick }) {
  const { body, x, y, r } = item;
  const R = Math.max(r, HIT_RADIUS);
  const badgeOffset = Math.max(r, 20) * 0.72; // clear of the tiniest dots
  return (
    <button
      className="map-body"
      style={{ left: x, top: y - R }}
      onClick={() => onPick(body.id)}
      aria-label={body.name}
    >
      <span className="map-pic" style={{ width: 2 * R, height: 2 * R }}>
        {body.kind === "dwarf" && (
          <span className="map-dwarf-ring" style={{ width: 2 * r + 14, height: 2 * r + 14 }} />
        )}
        <BodyPicture id={body.id} size={2 * r} />
        {number && (
          <span
            className="map-number"
            style={{ ...numberStyle(number), left: R + badgeOffset - 9, top: R - badgeOffset - 9 }}
          >
            {number}
          </span>
        )}
      </span>
      <span className={`map-label${label === "?" ? " map-label-hidden" : ""}`}>{label}</span>
    </button>
  );
}

export function SolarMap({ layout, width, showNames, numberPlanets, onPick }) {
  const { height, sun, items, belts, ticks, gap } = layout;
  const path = pathThrough([[sun.x, sun.y + sun.r], ...items.map((it) => [it.x, it.y])]);
  const labelFor = (body) => (showNames ? body.name : "?");

  return (
    <div className="solar-map" style={{ width, height }}>
      <svg width={width} height={height} className="map-backdrop" aria-hidden="true">
        {belts.map((belt) => <Belt key={belt.id} belt={belt} width={width} />)}
        <path d={path} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeDasharray="1 9" strokeLinecap="round" />
        {ticks.map((t) => (
          <g key={t.au}>
            <line x1={0} x2={width} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 6" />
            <text x={width - 10} y={t.y - 5} textAnchor="end" className="map-tick-label">{t.au} AU</text>
          </g>
        ))}
        {gap && (
          <g>
            {[-18, 0, 18].map((dy) => (
              <circle key={dy} cx={width / 2} cy={gap.y + dy} r={3} fill="rgba(255,255,255,0.5)" />
            ))}
            <text x={width / 2} y={gap.y + 48} textAnchor="middle" className="map-gap-label">{gap.label}</text>
          </g>
        )}
      </svg>

      <MapBody item={sun} label={labelFor(sun.body)} onPick={onPick} />
      {items.map((item) => (
        <MapBody
          key={item.body.id}
          item={item}
          label={labelFor(item.body)}
          number={numberPlanets ? planetNumber(item.body) : null}
          onPick={onPick}
        />
      ))}
    </div>
  );
}
