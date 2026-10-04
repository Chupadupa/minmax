// ── Map Layout ───────────────────────────────────────────────────────────────
//
// Where everything goes on the map: a journey down the page from the Sun at
// the top to the farthest dwarf planet at the bottom. Planets and dwarf
// planets sit in one column with their moons in a row beside them; the
// notable asteroids sit inside the asteroid belt. Pure math, no React.
//
// Sizes are squashed by default (so a 6 km moon and a 70,000 km planet are
// both tappable) or real; rows are evenly spaced by default, or at real
// distances (1 AU = PX_PER_AU pixels — Neptune ends up 30 screens down).

import { AU_KM, moonsOf } from "./bodies.js";
import { lookFor } from "./bodyLooks.js";

// Jupiter is 50px across either way; in real sizes everything else shrinks.
const SQUASH_SCALE = 8.4;
const SQUASH_POWER = 0.42;
const REAL_SIZE_SCALE = 50 / 69_911;

export const MIN_DRAWN_RADIUS = 1.5;
export const MIN_MOON_RADIUS = 4; // squashed mode only: tiny moons stay visible dots
export const HIT_RADIUS = 26;
export const PX_PER_AU = 180;
export const MAX_AU = 80; // anything further is shown past a "⋮" break
export const MOON_CHIP_W = 46;
export const MOON_CHIP_H = 44;
export const BELT_CHIP_H = 40;
export const LINK_H = 64;
const COLUMN = 0.29; // planets sit this far across the width; moons fill the rest
const LABEL_H = 20;
const ROW_GAP = 24;
const BELT_H = 86;

export function mapRadius(radiusKm, realSizes, min = MIN_DRAWN_RADIUS) {
  const r = realSizes
    ? radiusKm * REAL_SIZE_SCALE
    : SQUASH_SCALE * Math.pow(radiusKm / 1000, SQUASH_POWER);
  return Math.max(r, min);
}

// How a world's moons wrap into rows beside it.
function moonBlock(count, availW) {
  const perRow = Math.max(1, Math.floor(availW / MOON_CHIP_W));
  const rows = count ? Math.ceil(count / perRow) : 0;
  return { perRow, rows, height: rows * MOON_CHIP_H };
}

// The asteroid belt sits between Mars and Jupiter, the Kuiper belt past
// Neptune. Each is drawn before the first body that lives in it.
const BELTS = [
  { id: "asteroid", label: "Asteroid belt", au0: 2.1, au1: 3.3, before: (b) => b.region === "asteroid" },
  { id: "kuiper", label: "Kuiper belt", au0: 30, au1: 50, before: (b) => b.region === "kuiper" },
];

export function layoutMap(orbiters, sun, asteroids, { width, realSizes, realDistances }) {
  const column = width * COLUMN;
  const sunR = mapRadius(sun.radiusKm, realSizes);
  // Just the Sun's lower edge shows at the top of the page.
  const sunBottom = realSizes ? 64 : 88;
  const sunLayout = { body: sun, x: width / 2, y: sunBottom - sunR, r: sunR };

  const items = [];
  const belts = [];
  const ticks = [];
  let gap = null;
  const top = sunBottom + 24;
  let cursor = top;
  let prevBottom = top;
  const beltsDrawn = new Set();

  const placeBelt = (belt) => {
    const y0 = realDistances ? top + belt.au0 * PX_PER_AU : cursor;
    const y1 = realDistances ? top + belt.au1 * PX_PER_AU : cursor + BELT_H;
    const members = belt.id === "asteroid" ? asteroids : [];
    const placed = members.map((body, i) => ({
      body,
      r: mapRadius(body.radiusKm, realSizes, realSizes ? MIN_DRAWN_RADIUS : MIN_MOON_RADIUS),
      x: (width * (i + 0.5)) / members.length,
      y: realDistances ? top + (body.orbitKm / AU_KM) * PX_PER_AU : y0 + 54,
    }));
    belts.push({ ...belt, y0, y1, members: placed });
    if (!realDistances) cursor = y1 + 14;
  };

  orbiters.forEach((body) => {
    const r = mapRadius(body.radiusKm, realSizes);
    const reach = r * (1 + (lookFor(body.id).extent - 1) * 0.85); // rings stick out (their faint tips may touch a chip)
    const au = body.orbitKm / AU_KM;

    const moons = moonsOf(body.id).map((m) => ({
      body: m,
      r: mapRadius(m.radiusKm, realSizes, realSizes ? MIN_DRAWN_RADIUS : MIN_MOON_RADIUS),
    }));
    const moonsX = column + reach + 8;
    const moonsW = width - moonsX - 6;
    const block = moonBlock(moons.length, moonsW);
    const rowH = Math.max(2 * Math.max(r, 14) + LABEL_H, block.height);

    for (const belt of BELTS) {
      if (!beltsDrawn.has(belt.id) && belt.before(body)) {
        beltsDrawn.add(belt.id);
        placeBelt(belt);
      }
    }

    let y;
    if (realDistances) {
      if (au <= MAX_AU) {
        y = top + au * PX_PER_AU;
      } else {
        // Off the chart: a break, then the far-away bodies in a row below it.
        const breakY = top + MAX_AU * PX_PER_AU + 90;
        if (!gap) gap = { y: breakY, label: "much, much further…" };
        y = breakY + 110;
      }
      // Real distances, except that near-twins (Pluto and Orcus) are nudged
      // apart so they never sit on top of each other.
      y = Math.max(y, prevBottom + rowH / 2 + 8);
    } else {
      y = cursor + rowH / 2;
    }
    prevBottom = y + rowH / 2;
    cursor = prevBottom + ROW_GAP;
    items.push({ body, x: column, y, r, rowH, moons, moonsX, moonsW, perRow: block.perRow });
  });

  if (realDistances) {
    const last = Math.min(MAX_AU, Math.max(...orbiters.map((b) => b.orbitKm / AU_KM)));
    for (let au = 1; au <= last; au += au < 5 ? 1 : 5) {
      ticks.push({ au, y: top + au * PX_PER_AU });
    }
  }

  const link = { y: prevBottom + 36 };
  const height = link.y + LINK_H + 24;
  return { width, height, sun: sunLayout, items, belts, ticks, gap, link };
}
