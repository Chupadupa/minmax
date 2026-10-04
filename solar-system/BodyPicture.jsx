import { useId } from "react";
import { lookFor, POTATOES } from "./bodyLooks.js";

// ── Body Picture ─────────────────────────────────────────────────────────────
//
// Draws any body from its look (bodyLooks.js) as an SVG: a shaded sphere (or
// egg, or potato) with its stripes, spots, craters, caps and rings. `size` is
// the body's diameter in pixels; the SVG itself is bigger when rings or a glow
// reach past the body (look.extent), and is centred on the body either way.

const BAND_BLUR = 0.035;

function Shape({ look, ...props }) {
  const { shape } = look;
  if (shape?.potato !== undefined) {
    return <path d={POTATOES[shape.potato % POTATOES.length]} transform={`rotate(${shape.rotate ?? 0})`} {...props} />;
  }
  if (shape?.ellipse !== undefined) {
    return <ellipse rx={1} ry={shape.ellipse} transform={`rotate(${shape.rotate ?? 0})`} {...props} />;
  }
  return <circle r={1} {...props} />;
}

// A flat ring seen at a slant: the area between two squashed ellipses.
function ringPath(r0, r1, tilt) {
  const ellipse = (r) =>
    `M ${-r} 0 A ${r} ${r * tilt} 0 1 0 ${r} 0 A ${r} ${r * tilt} 0 1 0 ${-r} 0 Z`;
  return `${ellipse(r1)} ${ellipse(r0)}`;
}

function Rings({ rings }) {
  return rings.bands.map((band, i) => (
    <path
      key={i}
      d={ringPath(band.r0, band.r1, rings.tilt)}
      fill={band.color}
      fillOpacity={band.opacity}
      fillRule="evenodd"
    />
  ));
}

function Craters({ craters, bright }) {
  return craters.map((c, i) =>
    bright ? (
      <g key={i}>
        <circle cx={c.x} cy={c.y} r={c.r} fill="#ffffff" fillOpacity={0.55} />
        <circle cx={c.x} cy={c.y} r={c.r * 0.5} fill="#000000" fillOpacity={0.25} />
      </g>
    ) : (
      <g key={i}>
        <circle cx={c.x} cy={c.y} r={c.r} fill="#000000" fillOpacity={0.28} />
        <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={c.r * 0.18} />
      </g>
    )
  );
}

function Cap({ size, south, color }) {
  const cy = south ? 1 - size * 0.5 : -1 + size * 0.5;
  return <ellipse cx={0} cy={cy} rx={size * 2.4} ry={size * 0.75} fill={color} fillOpacity={0.9} />;
}

export function BodyPicture({ id, size, style }) {
  const look = lookFor(id);
  const ext = look.extent;
  const uid = useId().replace(/:/g, "");
  const ids = {
    base: `${uid}b`, shade: `${uid}s`, clip: `${uid}c`,
    front: `${uid}f`, glow: `${uid}g`, blur: `${uid}l`,
  };
  const box = size * ext;
  const [light, mid, dark] = look.colors;
  const { rings, glow } = look;

  return (
    <svg
      width={box}
      height={box}
      viewBox={`${-ext} ${-ext} ${2 * ext} ${2 * ext}`}
      style={{ display: "block", overflow: "visible", pointerEvents: "none", ...style }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={ids.base} cx="35%" cy="32%" r="78%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <radialGradient id={ids.shade} cx="35%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
          <stop offset="40%" stopColor="#000000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={look.shade} />
        </radialGradient>
        <clipPath id={ids.clip}>
          <Shape look={look} />
        </clipPath>
        {rings && (
          <clipPath id={ids.front}>
            <rect x={-ext} y={0} width={2 * ext} height={ext} />
          </clipPath>
        )}
        {glow && (
          <radialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={glow.color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={glow.color} stopOpacity={0} />
          </radialGradient>
        )}
        {look.bands && (
          <filter id={ids.blur} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={BAND_BLUR} />
          </filter>
        )}
      </defs>

      {glow && <circle r={glow.extent} fill={`url(#${ids.glow})`} />}

      {/* The far side of the rings, behind the body */}
      {rings && (
        <g transform={`rotate(${rings.rotate ?? 0})`}>
          <Rings rings={rings} />
        </g>
      )}

      <Shape look={look} fill={`url(#${ids.base})`} />

      <g clipPath={`url(#${ids.clip})`}>
        {look.bands && (
          <g filter={`url(#${ids.blur})`}>
            {look.bands.map((b, i) => (
              <rect key={i} x={-1.1} y={b.y0} width={2.2} height={b.y1 - b.y0} fill={b.color} fillOpacity={b.opacity} />
            ))}
          </g>
        )}
        {look.shapes?.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} fillOpacity={s.opacity ?? 1} />
        ))}
        {look.spots?.map((s, i) => (
          <ellipse
            key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry}
            fill={s.color} fillOpacity={s.opacity ?? 1}
            transform={s.rotate ? `rotate(${s.rotate} ${s.x} ${s.y})` : undefined}
          />
        ))}
        {look.lines?.map((l, i) => (
          <path
            key={i} d={l.d} fill="none" stroke={l.color} strokeOpacity={l.opacity ?? 1}
            strokeWidth={l.width} strokeLinecap="round"
          />
        ))}
        {look.caps?.north && <Cap size={look.caps.north} color={look.caps.color} />}
        {look.caps?.south && <Cap size={look.caps.south} color={look.caps.color} south />}
        {look.craters && <Craters craters={look.craters} bright={look.bright} />}
        {look.half && (
          <path
            d="M 0.1 -1.2 C -0.15 -0.5 -0.15 0.5 0.1 1.2 L -1.3 1.2 L -1.3 -1.2 Z"
            fill={look.half.color} fillOpacity={0.85}
            transform={`rotate(${look.half.rotate ?? 0})`}
          />
        )}
      </g>

      {/* Daylight and shadow */}
      <Shape look={look} fill={`url(#${ids.shade})`} />

      {/* The near side of the rings, in front of the body */}
      {rings && (
        <g transform={`rotate(${rings.rotate ?? 0})`}>
          <g clipPath={`url(#${ids.front})`}>
            <Rings rings={rings} />
          </g>
        </g>
      )}
    </svg>
  );
}
