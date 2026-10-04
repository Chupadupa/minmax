// ── Star Map Layout ──────────────────────────────────────────────────────────
//
// Where everything goes on the star map: one row per star, nearest first,
// with the star on the left and its planets in a row beside it. Sizes are
// squashed so a red dwarf and a hot Jupiter are both tappable, or real
// (the Sun is REAL_SUN_PX across and everything scales from there).
// Pure math, no React.

import { planetsOf, guessRadiusEarth, SUN_RADIUS_KM, EARTH_RADIUS_KM } from "./exoplanets.js";
import { lookFor } from "./exoLooks.js";

export const HIT_RADIUS = 26;
export const CHIP_W = 52;
export const CHIP_H = 50;
export const CHIP_PIC = 30;
const COLUMN = 0.2;
const LABEL_H = 36; // name + distance
const ROW_GAP = 28;
const REAL_SUN_PX = 30;

export function starRadius(star, realSizes) {
  if (realSizes) return Math.max(1.5, star.radiusSun * REAL_SUN_PX);
  return Math.max(5, 16 * Math.pow(star.radiusSun, 0.45));
}

export function planetRadius(planet, realSizes) {
  const re = guessRadiusEarth(planet);
  if (realSizes) return Math.max(1.5, (re * EARTH_RADIUS_KM / SUN_RADIUS_KM) * REAL_SUN_PX);
  return Math.max(3, 5.5 * Math.pow(re, 0.3));
}

export function layoutStars(stars, { width, realSizes }) {
  const column = width * COLUMN;
  let cursor = 20;
  const rows = stars.map((star) => {
    const r = starRadius(star, realSizes);
    const reach = r * lookFor(star.id).extent; // glow, beams, a companion
    const planets = planetsOf(star.id).map((p) => ({ body: p, r: planetRadius(p, realSizes) }));
    const chipsX = column + Math.max(reach, HIT_RADIUS) + 10;
    const chipsW = width - chipsX - 6;
    const perRow = Math.max(1, Math.floor(chipsW / CHIP_W));
    const count = star.link ? 1 : planets.length;
    const blockRows = Math.ceil(count / perRow);
    const rowH = Math.max(2 * Math.max(r, HIT_RADIUS) + LABEL_H, blockRows * CHIP_H);
    const y = cursor + rowH / 2;
    cursor = y + rowH / 2 + ROW_GAP;
    return { star, x: column, y, r, planets, chipsX, chipsW, perRow };
  });
  return { width, height: cursor + 12, rows };
}
