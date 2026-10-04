// ── Map Layout ───────────────────────────────────────────────────────────────
//
// Where everything goes on the map: a journey down the page from the Sun at
// the top to the farthest dwarf planet at the bottom. Pure math, no React.
//
// Sizes are squashed by default (so a 6 km moon and a 70,000 km planet are
// both tappable) or real; rows are evenly spaced by default, or at real
// distances (1 AU = PX_PER_AU pixels — Neptune ends up 30 screens down).

import { AU_KM } from "./bodies.js";

// Jupiter is 54px across either way; in real sizes everything else shrinks.
const SQUASH_SCALE = 9;
const SQUASH_POWER = 0.42;
const REAL_SIZE_SCALE = 54 / 69_911;

export const MIN_DRAWN_RADIUS = 1.5;
export const HIT_RADIUS = 26;
export const PX_PER_AU = 180;
export const MAX_AU = 80; // anything further is shown past a "⋮" break
const LABEL_H = 20;
const ROW_GAP = 30;
const BELT_H = 56;
const SIDES = [0.36, 0.64]; // the path zig-zags between these fractions of the width

export function mapRadius(radiusKm, realSizes) {
  const r = realSizes
    ? radiusKm * REAL_SIZE_SCALE
    : SQUASH_SCALE * Math.pow(radiusKm / 1000, SQUASH_POWER);
  return Math.max(r, MIN_DRAWN_RADIUS);
}

// The asteroid belt sits between Mars and Jupiter, the Kuiper belt past
// Neptune. Each is drawn before the first body that lives in it.
const BELTS = [
  { id: "asteroid", label: "Asteroid belt", au0: 2.1, au1: 3.3, before: (b) => b.region === "asteroid" },
  { id: "kuiper", label: "Kuiper belt", au0: 30, au1: 50, before: (b) => b.region === "kuiper" },
];

export function layoutMap(orbiters, sun, { width, realSizes, realDistances }) {
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
  const beltsDrawn = new Set();

  orbiters.forEach((body, i) => {
    const r = mapRadius(body.radiusKm, realSizes);
    const au = body.orbitKm / AU_KM;
    const x = width * SIDES[i % 2];

    for (const belt of BELTS) {
      if (beltsDrawn.has(belt.id) || !belt.before(body)) continue;
      beltsDrawn.add(belt.id);
      if (realDistances) {
        belts.push({ ...belt, y0: top + belt.au0 * PX_PER_AU, y1: top + belt.au1 * PX_PER_AU });
      } else {
        belts.push({ ...belt, y0: cursor, y1: cursor + BELT_H });
        cursor += BELT_H + 16;
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
        const beyond = items.filter((it) => it.body.orbitKm / AU_KM > MAX_AU).length;
        y = breakY + 110 + beyond * 90;
      }
    } else {
      const half = Math.max(r, 14);
      y = cursor + half;
      cursor = y + half + LABEL_H + ROW_GAP;
    }
    items.push({ body, x, y, r });
  });

  if (realDistances) {
    const last = Math.min(MAX_AU, Math.max(...orbiters.map((b) => b.orbitKm / AU_KM)));
    for (let au = 1; au <= last; au += au < 5 ? 1 : 5) {
      ticks.push({ au, y: top + au * PX_PER_AU });
    }
  }

  const lastY = Math.max(...items.map((it) => it.y + Math.max(it.r, 14)));
  const height = lastY + LABEL_H + 60;
  return { height, sun: sunLayout, items, belts, ticks, gap };
}
