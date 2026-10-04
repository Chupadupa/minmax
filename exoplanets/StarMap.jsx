import { BodyPicture } from "../shared/BodyPicture.jsx";
import { lookFor } from "./exoLooks.js";
import { formatLightYears, shortName } from "./exoplanets.js";
import { HIT_RADIUS, CHIP_W, CHIP_H, CHIP_PIC } from "./exoLayout.js";

// ── Star Map ─────────────────────────────────────────────────────────────────
//
// The star hop: one row per star, nearest first, with the star on the left
// (name and distance underneath) and its planets as small tappable chips
// beside it. Positions come ready-made from exoLayout.js; this file only draws
// them and reports taps.

function MapStar({ row, label, onPick }) {
  const { star, x, y, r } = row;
  const R = Math.max(r, HIT_RADIUS);
  return (
    <button className="map-star" style={{ left: x, top: y - R }} onClick={() => onPick(star.id)} aria-label={star.name}>
      <span className="map-pic" style={{ width: 2 * R, height: 2 * R }}>
        <BodyPicture look={lookFor(star.id)} size={2 * r} />
      </span>
      <span className={`map-label${label === "?" ? " map-label-hidden" : ""}`}>{label}</span>
      <span className="map-distance">{star.id === "sun" ? "right here" : formatLightYears(star.distanceLy)}</span>
    </button>
  );
}

function PlanetChip({ planet, r, label, water, onPick }) {
  return (
    <button className="planet-chip" style={{ width: CHIP_W, height: CHIP_H }} onClick={() => onPick(planet.id)} aria-label={planet.name}>
      <span className="chip-pic" style={{ height: CHIP_PIC }}>
        <BodyPicture look={lookFor(planet.id)} size={2 * r} />
        {water && <span className="chip-water" aria-hidden="true">💧</span>}
      </span>
      <span className={`chip-name${label === "?" ? " map-label-hidden" : ""}${label.length === 1 ? " chip-letter" : ""}`}>{label}</span>
    </button>
  );
}

export function StarMap({ layout, width, showNames, waterMarks, onPick }) {
  const { height, rows } = layout;
  const labelFor = (world) => (showNames ? world.name : "?");
  const hops = rows.map((row) => `${row.x} ${row.y}`).join(" L ");

  return (
    <div className="star-map" style={{ width, height }}>
      <svg width={width} height={height} className="map-backdrop" aria-hidden="true">
        <path d={`M ${hops}`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2} strokeDasharray="1 9" strokeLinecap="round" />
      </svg>

      {rows.map((row) => (
        <MapStar key={row.star.id} row={row} label={labelFor(row.star)} onPick={onPick} />
      ))}

      {rows.map((row) => (
        <div
          key={row.star.id}
          className="planet-row"
          style={{ left: row.chipsX, top: row.y, width: row.perRow * CHIP_W, maxWidth: row.chipsW }}
        >
          {row.star.link ? (
            <a className="planet-chip link-chip" href={row.star.link}>
              <span className="link-chip-icon">🪐</span>
              <span className="chip-name">Our 8 planets ➜</span>
            </a>
          ) : (
            row.planets.map((p) => (
              <PlanetChip
                key={p.body.id} planet={p.body} r={p.r} label={showNames ? shortName(p.body) : "?"}
                water={waterMarks && p.body.habitable} onPick={onPick}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
