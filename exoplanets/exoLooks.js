// ── Exoplanet Looks ──────────────────────────────────────────────────────────
//
// What each star and planet looks like, as data for the shared BodyPicture
// (format in shared/bodyArt.js). Nobody has seen any of these planets, so
// each gets an imagined look for its type — lava world, hot Jupiter, water
// world — with a few famous ones drawn the way astronomers picture them.
// Pure data, no React.

import { worldById } from "./exoplanets.js";
import { hashString, finishLook } from "../shared/bodyArt.js";

const LAVA_ACCENT = "#ff8a2a";

const pick = (id, list) => list[hashString(id) % list.length];

// ── Stars ──
const RED_DWARF = ["#ffd9c4", "#ff6a3d", "#8a1a05"];
const STAR_LOOKS = {
  "red dwarf": { colors: RED_DWARF, glow: { color: "#ff5a2a", extent: 1.6 }, shade: 0.2 },
  "orange star": { colors: ["#fff2cc", "#ffa040", "#a84000"], glow: { color: "#ff9a30", extent: 1.55 }, shade: 0.15 },
  "yellow star": { colors: ["#fff6c2", "#ffb300", "#e65100"], glow: { color: "#ffb300", extent: 1.5 }, shade: 0.15 },
  "white star": { colors: ["#ffffff", "#f2f5ff", "#9ab0ff"], glow: { color: "#dde6ff", extent: 1.6 }, shade: 0.1 },
  "blue-white star": { colors: ["#ffffff", "#c4d8ff", "#3a6aff"], glow: { color: "#9ac0ff", extent: 1.7 }, shade: 0.1 },
  pulsar: {
    colors: ["#ffffff", "#d0f4ff", "#60c0ff"],
    glow: { color: "#80d0ff", extent: 2.2 },
    rays: { color: "#d0f4ff", length: 2.3, width: 0.22, angle: -35 },
    shade: 0,
  },
  "double star": {
    colors: ["#fff2cc", "#ffa040", "#a84000"],
    glow: { color: "#ff9a30", extent: 1.5 },
    companion: { x: 1.5, y: -1.0, r: 0.45, colors: RED_DWARF, glow: { color: "#ff5a2a", extent: 1.8 } },
    shade: 0.15,
  },
};

// ── Planets, by type ──
const ROCKY_PALETTES = [
  ["#e0c8b0", "#a87a58", "#4a3020"], // tan
  ["#d8d8d8", "#8c8c8c", "#3a3a3a"], // grey
  ["#ffb98a", "#c9612a", "#5a2410"], // rust
  ["#c8d8e8", "#7a8fa8", "#2e3d50"], // slate
];
const GIANT_BANDS = [
  // Saturn-ish
  [
    { y0: -1.1, y1: -0.6, color: "#e3c98a", opacity: 0.35 }, { y0: -0.6, y1: -0.3, color: "#fff5d4", opacity: 0.4 },
    { y0: -0.3, y1: 0.1, color: "#d8b870", opacity: 0.4 }, { y0: 0.1, y1: 0.45, color: "#fff6da", opacity: 0.4 },
    { y0: 0.45, y1: 1.1, color: "#dcbf7e", opacity: 0.35 },
  ],
  // Neptune-ish
  [
    { y0: -1.1, y1: -0.5, color: "#5a8fd8", opacity: 0.4 }, { y0: -0.5, y1: -0.15, color: "#b8d8ff", opacity: 0.35 },
    { y0: -0.15, y1: 0.3, color: "#3a6ac0", opacity: 0.45 }, { y0: 0.3, y1: 1.1, color: "#9ac0f0", opacity: 0.3 },
  ],
];
const HOT_BANDS = [
  { y0: -1.1, y1: -0.65, color: "#ffb347", opacity: 0.5 }, { y0: -0.65, y1: -0.35, color: "#ff5e1a", opacity: 0.55 },
  { y0: -0.35, y1: 0, color: "#ffd27a", opacity: 0.5 }, { y0: 0, y1: 0.35, color: "#e8401a", opacity: 0.55 },
  { y0: 0.35, y1: 0.7, color: "#ffb347", opacity: 0.45 }, { y0: 0.7, y1: 1.1, color: "#c82a0a", opacity: 0.5 },
];
const LAVA_CRACKS = [
  "M -0.9 -0.3 C -0.5 -0.1 -0.2 -0.5 0.2 -0.2 C 0.5 0 0.7 -0.4 0.95 -0.1",
  "M -0.6 0.5 C -0.2 0.3 0.1 0.7 0.5 0.45 C 0.7 0.3 0.8 0.6 0.9 0.5",
  "M -0.3 -0.95 C -0.2 -0.6 -0.5 -0.3 -0.3 0.1 C -0.1 0.4 -0.4 0.7 -0.2 0.95",
  "M 0.3 -0.9 C 0.2 -0.5 0.5 -0.2 0.3 0.2",
];
const CLOUDS = [
  { x: -0.3, y: -0.25, rx: 0.35, ry: 0.08, color: "#ffffff", opacity: 0.55, rotate: -15 },
  { x: 0.35, y: 0.3, rx: 0.3, ry: 0.07, color: "#ffffff", opacity: 0.5, rotate: 10 },
  { x: -0.2, y: 0.6, rx: 0.22, ry: 0.06, color: "#ffffff", opacity: 0.4 },
];

function typeLook(planet) {
  const id = planet.id;
  switch (planet.type) {
    case "rocky":
      return { colors: pick(id, ROCKY_PALETTES), craters: 4 };
    case "tiny":
      return { colors: pick(id, ROCKY_PALETTES), craters: 3 };
    case "super-Earth":
      return {
        colors: pick(id, [["#d6e4dc", "#6f9a8a", "#243e36"], ["#e8d8c0", "#a08060", "#403020"], ["#d0d8f0", "#6a78b0", "#20284a"]]),
        spots: [{ x: -0.3, y: 0.1, rx: 0.3, ry: 0.2, color: "#000000", opacity: 0.18, rotate: 20 }, { x: 0.35, y: -0.3, rx: 0.2, ry: 0.15, color: "#000000", opacity: 0.15 }],
        craters: 2,
      };
    case "mini-Neptune":
      return {
        colors: ["#d6f2ff", "#64b8d8", "#1b5876"],
        bands: [{ y0: -0.5, y1: -0.3, color: "#ffffff", opacity: 0.25 }, { y0: 0.1, y1: 0.35, color: "#ffffff", opacity: 0.2 }, { y0: 0.6, y1: 0.8, color: "#ffffff", opacity: 0.15 }],
      };
    case "water world":
      return { colors: ["#b0e4ff", "#2f8fe0", "#0b3d80"], spots: CLOUDS };
    case "lava world":
      return {
        colors: ["#5a2a24", "#2a1210", "#050000"],
        lines: LAVA_CRACKS.map((d) => ({ d, color: "#ff6a00", width: 0.05, opacity: 0.95 })),
        spots: [{ x: 0.1, y: 0.2, rx: 0.14, ry: 0.1, color: "#ff9a1a", opacity: 0.8 }],
        glow: { color: "#ff5a00", extent: 1.25 },
        shade: 0.45,
        accent: LAVA_ACCENT,
      };
    case "gas giant":
      return { colors: pick(id, [["#f3ecd8", "#c9b890", "#6a5a3a"], ["#9ec8ff", "#4a7ad8", "#102a6a"]]), bands: pick(id, GIANT_BANDS) };
    case "hot Jupiter":
      return { colors: ["#ffd68a", "#ec6a1e", "#5a1408"], bands: HOT_BANDS, glow: { color: "#ff6a00", extent: 1.2 }, shade: 0.5 };
    default:
      return { craters: 4 };
  }
}

// The famous ones, drawn the way astronomers picture them.
const PLANET_LOOKS = {
  "hd189733-b": {
    colors: ["#a8d4ff", "#2158d0", "#0a1c66"],
    bands: [{ y0: -0.6, y1: -0.45, color: "#ffffff", opacity: 0.2 }, { y0: 0.2, y1: 0.3, color: "#ffffff", opacity: 0.18 }],
    spots: [{ x: 0.3, y: -0.1, rx: 0.3, ry: 0.05, color: "#ffffff", opacity: 0.3, rotate: 5 }],
  },
  "wasp12-b": { shape: { ellipse: 0.78, rotate: 25 } },
  "tres2-b": { colors: ["#3a2626", "#140c0c", "#000000"], bands: undefined, glow: { color: "#a01010", extent: 1.15 }, shade: 0.3, accent: "#d0453a" },
  "kelt9-b": { colors: ["#ffffff", "#ffe29a", "#ff9000"], bands: undefined, glow: { color: "#ffd060", extent: 1.3 }, shade: 0.3 },
  "kepler16-b": { colors: ["#f3ecd8", "#c9b890", "#6a5a3a"], bands: GIANT_BANDS[0] },
  "kepler186-f": {
    colors: ["#e0c8a8", "#9a7a50", "#3a2a18"],
    shapes: [
      { d: "M -0.6 -0.5 C -0.3 -0.7 0 -0.5 -0.1 -0.2 C -0.2 0 -0.5 0.1 -0.6 -0.1 C -0.75 -0.3 -0.8 -0.4 -0.6 -0.5 Z", color: "#4a1414", opacity: 0.85 },
      { d: "M 0.2 0.1 C 0.5 -0.1 0.75 0.1 0.7 0.35 C 0.65 0.6 0.3 0.65 0.15 0.45 C 0 0.3 0 0.2 0.2 0.1 Z", color: "#4a1414", opacity: 0.85 },
    ],
    caps: { north: 0.2, south: 0.2, color: "#ffffff" },
  },
  "kepler452-b": {
    colors: ["#9ddcff", "#2a9ad8", "#0d3b7c"],
    shapes: [{ d: "M -0.5 -0.4 C -0.2 -0.6 0.1 -0.4 0 -0.1 C -0.1 0.2 -0.4 0.3 -0.55 0.1 C -0.7 -0.1 -0.7 -0.3 -0.5 -0.4 Z", color: "#3a9a4a", opacity: 0.9 }, { d: "M 0.3 0.2 C 0.55 0.05 0.7 0.3 0.6 0.5 C 0.5 0.7 0.2 0.65 0.15 0.45 C 0.1 0.3 0.15 0.25 0.3 0.2 Z", color: "#3a9a4a", opacity: 0.9 }],
    spots: CLOUDS.slice(0, 2),
    caps: { north: 0.18, color: "#ffffff" },
  },
  "gj1214-b": { colors: ["#ffffff", "#cfe4f0", "#6f8aa0"], spots: undefined, shade: 0.5 },
  "k218-b": { colors: ["#c0e8ff", "#3a8ad0", "#102a60"], spots: CLOUDS, caps: { north: 0.15, color: "#ffffff" } },
  "trappist1-b": { colors: ["#8a7a70", "#4a3e36", "#1a1410"], craters: 6 },
  "trappist1-e": { colors: ["#b0e4ff", "#2f8fe0", "#0b3d80"], spots: CLOUDS, craters: undefined },
  "trappist1-f": { colors: ["#ffffff", "#dce8f0", "#8aa0b4"], craters: 3 },
  "trappist1-g": { colors: ["#f0f6ff", "#b8d0e8", "#4a6a8a"], craters: 3 },
  "trappist1-h": { colors: ["#ffffff", "#e4ecf4", "#90a4b8"], craters: 2 },
  "toi700-d": { colors: ["#c8d8e8", "#5a8fb0", "#1a3a56"], spots: CLOUDS.slice(0, 2), caps: { north: 0.2, south: 0.2, color: "#ffffff" }, craters: undefined },
  "toi700-e": { colors: ["#e8e0c8", "#a89060", "#4a3c20"], caps: { north: 0.15, south: 0.15, color: "#ffffff" }, craters: 3 },
  "proxima-b": { colors: ["#ffb98a", "#c9612a", "#5a2410"], craters: 3, half: { color: "#1a0a10", rotate: 110 } },
  "kepler22-b": { colors: ["#a0d8ff", "#2a7ad0", "#0a2a66"], spots: CLOUDS },
  draugr: { colors: ["#c8d0ff", "#5a6a9a", "#141830"], craters: 2 },
  poltergeist: { colors: ["#c8d0ff", "#6a78a8", "#181c38"], craters: 4, spots: undefined },
  phobetor: { colors: ["#d8c8ff", "#7a6aa8", "#201838"], craters: 3, spots: undefined },
};

const SUN_LOOK = {
  spots: [
    { x: -0.35, y: 0.2, rx: 0.07, ry: 0.05, color: "#a33a00", opacity: 0.6 },
    { x: 0.3, y: -0.3, rx: 0.05, ry: 0.04, color: "#a33a00", opacity: 0.5 },
  ],
};

const cache = new Map();

export function lookFor(id) {
  if (cache.has(id)) return cache.get(id);
  const world = worldById(id);
  let partial;
  if (world.kind === "star") {
    partial = { ...STAR_LOOKS[world.starType], ...(id === "sun" ? SUN_LOOK : {}) };
  } else {
    partial = { ...typeLook(world), ...(PLANET_LOOKS[id] ?? {}) };
  }
  const look = finishLook(id, partial);
  cache.set(id, look);
  return look;
}
