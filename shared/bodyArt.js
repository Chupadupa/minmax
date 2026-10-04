// ── Body Art ─────────────────────────────────────────────────────────────────
//
// The machinery behind the "look" format that BodyPicture.jsx draws: a seeded
// crater scatter, lumpy outlines for small moons, and the finishing step that
// fills in defaults and works out how far rings or a glow reach past the body.
// Each toy keeps its own dictionary of looks (see solar-system/bodyLooks.js);
// this file is the shared part. Pure logic, no React.
//
// A look, in units of the body's radius (the body is the unit circle, y down):
//   colors     [light, mid, dark] — a lit sphere, brightest at the top-left
//   shape      "circle" (default), { ellipse: ry, rotate } or { potato: 0–2, rotate }
//   bands      [{ y0, y1, color, opacity }] horizontal stripes (gas giants)
//   spots      [{ x, y, rx, ry, color, opacity, rotate }] soft ellipses
//   shapes     [{ d, color, opacity }] filled paths (continents, Pluto's heart)
//   lines      [{ d, color, width, opacity }] stroked paths (cracks, stripes)
//   caps       { north, south, color } polar caps, sized as a fraction of the radius
//   craters    [{ x, y, r }], or just a number to scatter that many
//   bright     craters drawn as bright splashes instead of dark bowls
//   half       { color, rotate } one dark hemisphere (Iapetus)
//   rings      { bands: [{ r0, r1, color, opacity }], tilt, rotate }
//   glow       { color, extent } a halo around the body (stars)
//   rays       { color, length, width, angle } two opposite beams (a pulsar)
//   companion  { x, y, r, colors, glow } a second, smaller sphere (a double star)
//   shade      0–1, how deep the shadow on the far side is (default 0.7)
//   accent     a color for the body's name, when the palette is too dark to read

import { luminance } from "./colorUtils.js";

export function hashString(str) {
  let h = 2166136261;
  for (const c of str) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 — a tiny seeded random, so scattered craters land in the same
// places every time
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function craterField(seed, count, { minR = 0.05, maxR = 0.16 } = {}) {
  const rnd = seededRandom(seed);
  const craters = [];
  let tries = 0;
  while (craters.length < count && tries++ < count * 30) {
    const r = minR + rnd() * (maxR - minR);
    const angle = rnd() * Math.PI * 2;
    const dist = Math.sqrt(rnd()) * (0.95 - r);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    if (craters.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + r + 0.02)) continue;
    craters.push({ x, y, r });
  }
  return craters;
}

// Three lumpy outlines for the small worlds that gravity never rounded off.
export const POTATOES = [
  "M -1 -0.15 C -0.95 -0.7 -0.45 -1 0.1 -0.92 C 0.65 -0.85 1.02 -0.45 0.95 0.1 C 0.9 0.6 0.5 0.98 -0.05 0.95 C -0.6 0.92 -1.05 0.45 -1 -0.15 Z",
  "M -0.9 -0.4 C -0.6 -0.95 0.2 -1.05 0.7 -0.7 C 1.05 -0.45 1 0.2 0.8 0.6 C 0.55 1 -0.2 1.02 -0.6 0.75 C -1.05 0.45 -1.1 -0.05 -0.9 -0.4 Z",
  "M -0.95 0.05 C -1.05 -0.5 -0.5 -0.9 0 -0.85 C 0.4 -0.82 0.75 -1 0.95 -0.6 C 1.1 -0.2 0.85 0.3 0.7 0.65 C 0.5 1 0 1.05 -0.4 0.85 C -0.8 0.65 -0.9 0.5 -0.95 0.05 Z",
];

export const GREY = ["#e6e6e6", "#a6a6a6", "#474747"];

// A color from the look that reads on a dark background, for the body's name.
// Dark worlds can set `accent` themselves (a lava world's glowing orange).
export function accentColor(look) {
  if (look.accent) return look.accent;
  for (const c of [look.colors[1], look.colors[0]]) {
    if (luminance(c) > 0.1) return c;
  }
  return "#ffffff";
}

// Fills in defaults, scatters a crater count into positions, and works out the
// `extent`: how far the picture reaches past the body, in radii.
export function finishLook(id, partial) {
  const look = { colors: GREY, shade: 0.7, ...partial };
  if (typeof look.craters === "number") {
    const potato = look.shape?.potato !== undefined;
    look.craters = craterField(hashString(id), look.craters, potato ? { minR: 0.06, maxR: 0.2 } : {});
  }
  const reaches = [
    1.05,
    look.rings ? Math.max(...look.rings.bands.map((b) => b.r1)) : 1,
    look.glow?.extent ?? 1,
    look.rays?.length ?? 1,
    look.companion ? Math.hypot(look.companion.x, look.companion.y) + look.companion.r * (look.companion.glow?.extent ?? 1) : 1,
  ];
  look.extent = Math.max(...reaches);
  return look;
}
