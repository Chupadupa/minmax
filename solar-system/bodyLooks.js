// ── Body Looks ───────────────────────────────────────────────────────────────
//
// What each body looks like, described as data that the shared BodyPicture
// draws (the format is documented in shared/bodyArt.js). Coordinates are in
// units of the body's radius, so one look works at every size from a map dot
// to the big close-up. Pure data, no React.

import { bodyById } from "./bodies.js";
import { hashString, finishLook, GREY } from "../shared/bodyArt.js";

const DARK_GREY = ["#a0a0a0", "#606060", "#222222"];
const ICE = ["#ffffff", "#e2ecf4", "#8fa6ba"];
const RUST_GREY = ["#d8ccc0", "#9a8878", "#4a3c32"];

const potato = (i, rotate = 0) => ({ potato: i, rotate });

// Shared squiggles for cracks and stripes
const CRACKS = [
  "M -0.95 -0.2 C -0.4 0.1 0.2 -0.35 0.95 0.05",
  "M -0.8 0.45 C -0.2 0.15 0.3 0.6 0.85 0.3",
  "M -0.3 -0.95 C -0.1 -0.3 0.15 0.3 -0.2 0.95",
  "M 0.2 -0.9 C 0.5 -0.4 0.3 0.2 0.7 0.7",
];

// ── The Looks ────────────────────────────────────────────────────────────────

const LOOKS = {
  sun: {
    colors: ["#fff6c2", "#ffb300", "#e65100"],
    spots: [
      { x: -0.35, y: 0.2, rx: 0.07, ry: 0.05, color: "#a33a00", opacity: 0.6 },
      { x: 0.3, y: -0.3, rx: 0.05, ry: 0.04, color: "#a33a00", opacity: 0.5 },
      { x: 0.45, y: 0.35, rx: 0.09, ry: 0.06, color: "#b84a00", opacity: 0.45 },
    ],
    glow: { color: "#ffb300", extent: 1.5 },
    shade: 0.15,
  },

  // ── Planets ──
  mercury: { colors: ["#cfcac2", "#8f8a84", "#3b3835"], craters: 14 },
  venus: {
    colors: ["#fff4d6", "#e9c472", "#8d6a2a"],
    bands: [
      { y0: -0.75, y1: -0.55, color: "#fff9e8", opacity: 0.35 },
      { y0: -0.3, y1: -0.05, color: "#d9ad55", opacity: 0.3 },
      { y0: 0.15, y1: 0.4, color: "#fff9e8", opacity: 0.3 },
      { y0: 0.55, y1: 0.8, color: "#d4a64e", opacity: 0.3 },
    ],
  },
  earth: {
    colors: ["#9ddcff", "#1e88e5", "#0c3b7c"],
    shapes: [
      // the Americas
      { d: "M -0.55 -0.55 C -0.3 -0.72 -0.08 -0.55 -0.15 -0.35 C -0.2 -0.2 -0.38 -0.15 -0.3 0 C -0.24 0.2 -0.08 0.3 -0.15 0.5 C -0.2 0.72 -0.42 0.78 -0.47 0.55 C -0.52 0.35 -0.62 0.2 -0.67 -0.05 C -0.72 -0.3 -0.72 -0.45 -0.55 -0.55 Z", color: "#4caf50", opacity: 0.95 },
      // Europe and Africa
      { d: "M 0.1 -0.52 C 0.35 -0.62 0.62 -0.5 0.62 -0.3 C 0.62 -0.1 0.45 -0.05 0.5 0.15 C 0.55 0.37 0.4 0.57 0.25 0.52 C 0.1 0.47 0.1 0.25 0.15 0.05 C 0.2 -0.15 0 -0.3 0.1 -0.52 Z", color: "#43a047", opacity: 0.95 },
      { d: "M 0.55 -0.25 C 0.7 -0.35 0.9 -0.2 0.88 0 C 0.85 0.15 0.7 0.12 0.62 0.02 C 0.58 -0.08 0.52 -0.15 0.55 -0.25 Z", color: "#4caf50", opacity: 0.9 },
    ],
    spots: [
      { x: -0.2, y: -0.15, rx: 0.3, ry: 0.07, color: "#ffffff", opacity: 0.5, rotate: -20 },
      { x: 0.35, y: 0.35, rx: 0.28, ry: 0.06, color: "#ffffff", opacity: 0.45, rotate: 15 },
      { x: -0.4, y: 0.5, rx: 0.2, ry: 0.05, color: "#ffffff", opacity: 0.4, rotate: 10 },
    ],
    caps: { north: 0.2, south: 0.28, color: "#ffffff" },
  },
  mars: {
    colors: ["#ffb98a", "#d2691e", "#6a2a0f"],
    spots: [
      { x: -0.35, y: -0.1, rx: 0.3, ry: 0.14, color: "#8b3a1a", opacity: 0.5, rotate: -15 },
      { x: 0.3, y: 0.3, rx: 0.25, ry: 0.1, color: "#8b3a1a", opacity: 0.45, rotate: 20 },
      { x: 0.15, y: -0.45, rx: 0.12, ry: 0.08, color: "#9a4a2a", opacity: 0.4 },
    ],
    craters: [{ x: 0.45, y: -0.15, r: 0.08 }, { x: -0.1, y: 0.55, r: 0.06 }],
    caps: { north: 0.18, south: 0.14, color: "#ffffff" },
  },
  jupiter: {
    colors: ["#fcecd4", "#dcb48d", "#7b4c2b"],
    bands: [
      { y0: -1.1, y1: -0.72, color: "#d9b38c", opacity: 0.55 },
      { y0: -0.72, y1: -0.5, color: "#f7e9d3", opacity: 0.6 },
      { y0: -0.5, y1: -0.32, color: "#b8805a", opacity: 0.7 },
      { y0: -0.32, y1: -0.12, color: "#f5e4ca", opacity: 0.6 },
      { y0: -0.12, y1: 0.05, color: "#c9916a", opacity: 0.75 },
      { y0: 0.05, y1: 0.28, color: "#f8ecd8", opacity: 0.6 },
      { y0: 0.28, y1: 0.45, color: "#b07a52", opacity: 0.7 },
      { y0: 0.45, y1: 0.68, color: "#f0ddc1", opacity: 0.55 },
      { y0: 0.68, y1: 1.1, color: "#c9a37c", opacity: 0.5 },
    ],
    spots: [{ x: 0.3, y: 0.36, rx: 0.2, ry: 0.11, color: "#c8553d", opacity: 0.9 }],
  },
  saturn: {
    colors: ["#fff7d8", "#ead08c", "#9c7a3c"],
    bands: [
      { y0: -1.1, y1: -0.7, color: "#e3c98a", opacity: 0.3 },
      { y0: -0.7, y1: -0.45, color: "#fff5d4", opacity: 0.4 },
      { y0: -0.45, y1: -0.2, color: "#e8cf93", opacity: 0.35 },
      { y0: -0.2, y1: 0.1, color: "#fff7dc", opacity: 0.4 },
      { y0: 0.1, y1: 0.4, color: "#e6cc90", opacity: 0.35 },
      { y0: 0.4, y1: 0.7, color: "#fff5d4", opacity: 0.35 },
      { y0: 0.7, y1: 1.1, color: "#dcbf7e", opacity: 0.3 },
    ],
    rings: {
      bands: [
        { r0: 1.22, r1: 1.5, color: "#d8c8a0", opacity: 0.5 },
        { r0: 1.55, r1: 1.95, color: "#f1e2bb", opacity: 0.85 },
        { r0: 2.0, r1: 2.27, color: "#e4d2a4", opacity: 0.7 },
      ],
      tilt: 0.3,
      rotate: -14,
    },
  },
  uranus: {
    colors: ["#e8fcff", "#86dbe8", "#2a8a9c"],
    rings: { bands: [{ r0: 1.9, r1: 1.96, color: "#d5eff3", opacity: 0.5 }], tilt: 0.22, rotate: 82 },
  },
  neptune: {
    colors: ["#86bfff", "#2962ff", "#0c2a8a"],
    spots: [
      { x: -0.25, y: -0.2, rx: 0.2, ry: 0.11, color: "#15308f", opacity: 0.75, rotate: -10 },
      { x: 0.1, y: 0.35, rx: 0.35, ry: 0.04, color: "#ffffff", opacity: 0.45, rotate: 5 },
      { x: 0.3, y: -0.5, rx: 0.2, ry: 0.03, color: "#ffffff", opacity: 0.35 },
    ],
  },

  // ── Dwarf planets ──
  ceres: {
    colors: ["#c4c1bb", "#7f7c77", "#3a3836"],
    craters: 10,
    spots: [
      { x: 0.15, y: -0.1, rx: 0.05, ry: 0.04, color: "#ffffff", opacity: 0.95 },
      { x: 0.24, y: -0.05, rx: 0.025, ry: 0.02, color: "#ffffff", opacity: 0.85 },
    ],
  },
  orcus: { colors: ["#d6d6d6", "#8c8c8c", "#383838"], craters: 6 },
  pluto: {
    colors: ["#f7e6cc", "#c99b6a", "#5a3a22"],
    spots: [{ x: -0.5, y: -0.1, rx: 0.3, ry: 0.4, color: "#4a2a14", opacity: 0.5, rotate: 10 }],
    shapes: [
      // Tombaugh Regio, the heart
      { d: "M 0.12 0.5 C -0.28 0.22 -0.32 -0.08 -0.1 -0.18 C 0.02 -0.23 0.1 -0.14 0.12 -0.06 C 0.14 -0.14 0.24 -0.23 0.36 -0.18 C 0.56 -0.08 0.52 0.22 0.12 0.5 Z", color: "#fff6e8", opacity: 0.92 },
    ],
  },
  haumea: {
    colors: ["#ffffff", "#e4e4e8", "#8a8a92"],
    shape: { ellipse: 0.55, rotate: -22 },
    spots: [{ x: 0.3, y: 0.05, rx: 0.14, ry: 0.1, color: "#b0463a", opacity: 0.6 }],
    rings: { bands: [{ r0: 2.15, r1: 2.21, color: "#ffffff", opacity: 0.35 }], tilt: 0.3, rotate: -22 },
  },
  quaoar: {
    colors: ["#dcaa88", "#9a5c3c", "#4a2a18"],
    craters: 5,
    rings: { bands: [{ r0: 2.1, r1: 2.15, color: "#ffffff", opacity: 0.3 }], tilt: 0.28, rotate: 10 },
  },
  makemake: { colors: ["#ebb48c", "#b86a40", "#5a2e18"], craters: 4 },
  gonggong: { colors: ["#f4a384", "#b84a30", "#5a1e10"], craters: 4 },
  eris: { colors: ["#ffffff", "#e8e8ec", "#9a9aa8"], craters: 3 },
  sedna: { colors: ["#ff9f86", "#c0392b", "#5a1a10"] },

  // ── Asteroids ──
  vesta: {
    colors: ["#d8d0c4", "#8e8478", "#3c3630"],
    craters: [{ x: 0.1, y: 0.62, r: 0.34 }, { x: -0.45, y: -0.3, r: 0.1 }, { x: 0.4, y: -0.4, r: 0.08 }],
    shape: { ellipse: 0.9, rotate: 10 },
  },
  juno: { colors: ["#c8c0b4", "#7e766c", "#34302a"], shape: potato(2, 35), craters: 4 },
  pallas: { colors: ["#c4c4c8", "#7a7a80", "#303034"], shape: { ellipse: 0.88, rotate: -15 }, craters: 6 },
  ida: { colors: ["#b8aa98", "#78685a", "#2e2620"], shape: potato(1, 80), craters: 5 },
  psyche: {
    colors: ["#f4f4f8", "#a8aab4", "#44464e"],
    shape: potato(0, -20),
    spots: [{ x: -0.3, y: -0.3, rx: 0.25, ry: 0.12, color: "#ffffff", opacity: 0.5, rotate: -25 }],
    craters: 3,
  },
  hygiea: { colors: ["#9a9a9a", "#5a5a5a", "#1e1e1e"], craters: 5 },

  // ── Moons ──
  moon: {
    colors: ["#ececec", "#aaaaaa", "#4a4a4a"],
    spots: [
      { x: -0.3, y: -0.3, rx: 0.3, ry: 0.22, color: "#6a6a6a", opacity: 0.55, rotate: -20 },
      { x: 0.25, y: -0.05, rx: 0.22, ry: 0.18, color: "#6a6a6a", opacity: 0.5 },
      { x: -0.1, y: 0.35, rx: 0.18, ry: 0.12, color: "#6a6a6a", opacity: 0.45 },
    ],
    craters: [{ x: -0.1, y: 0.68, r: 0.1 }, { x: 0.55, y: 0.4, r: 0.07 }, { x: -0.6, y: 0.2, r: 0.06 }, { x: 0.3, y: -0.6, r: 0.05 }],
  },
  phobos: { colors: ["#a89888", "#6e5e4e", "#2a2218"], shape: potato(0, 10), craters: [{ x: -0.45, y: -0.2, r: 0.3 }, { x: 0.3, y: 0.35, r: 0.1 }, { x: 0.5, y: -0.3, r: 0.08 }] },
  deimos: { colors: ["#b0a494", "#786a5a", "#30281e"], shape: potato(1, -30), craters: 3 },
  amalthea: { colors: ["#c8644c", "#8a3a28", "#3a1810"], shape: potato(2, 20), craters: 3 },
  io: {
    colors: ["#fff59d", "#f4c430", "#a0522d"],
    spots: [
      { x: -0.35, y: -0.25, rx: 0.14, ry: 0.11, color: "#d2691e", opacity: 0.8 },
      { x: 0.3, y: 0.2, rx: 0.1, ry: 0.09, color: "#2a2a2a", opacity: 0.8 },
      { x: 0.5, y: -0.4, rx: 0.08, ry: 0.06, color: "#2a2a2a", opacity: 0.7 },
      { x: -0.1, y: 0.55, rx: 0.17, ry: 0.1, color: "#e07020", opacity: 0.7 },
      { x: 0.05, y: -0.1, rx: 0.07, ry: 0.07, color: "#8b0000", opacity: 0.7 },
      { x: -0.55, y: 0.3, rx: 0.09, ry: 0.06, color: "#2a2a2a", opacity: 0.6 },
    ],
  },
  europa: { colors: ["#fff9ee", "#e6d6ba", "#9a7b5a"], lines: CRACKS.map((d) => ({ d, color: "#b5651d", width: 0.035, opacity: 0.7 })) },
  ganymede: {
    colors: ["#dccbb2", "#9c876a", "#4a3c2c"],
    spots: [
      { x: -0.3, y: -0.2, rx: 0.35, ry: 0.3, color: "#5a4a3a", opacity: 0.45, rotate: 20 },
      { x: 0.4, y: 0.35, rx: 0.25, ry: 0.2, color: "#5a4a3a", opacity: 0.4 },
    ],
    craters: 6,
  },
  callisto: { colors: ["#8e7e6c", "#5c4c3c", "#241c14"], craters: 16, bright: true },
  himalia: { colors: DARK_GREY, shape: potato(1, 40), craters: 3 },
  mimas: { colors: ["#ececec", "#b4b4b4", "#525252"], craters: [{ x: 0.32, y: -0.08, r: 0.32 }, { x: -0.5, y: 0.4, r: 0.08 }, { x: -0.3, y: -0.5, r: 0.06 }] },
  enceladus: {
    colors: ["#ffffff", "#e4f1ff", "#8ab0d0"],
    lines: [
      { d: "M -0.6 0.55 Q 0 0.4 0.6 0.55", color: "#5ab0ff", width: 0.04, opacity: 0.8 },
      { d: "M -0.5 0.7 Q 0 0.56 0.5 0.7", color: "#5ab0ff", width: 0.04, opacity: 0.8 },
      { d: "M -0.35 0.85 Q 0 0.72 0.35 0.85", color: "#5ab0ff", width: 0.04, opacity: 0.8 },
    ],
  },
  tethys: { colors: ICE, craters: 7, lines: [{ d: "M -0.9 -0.3 C -0.4 -0.1 0.3 -0.1 0.92 0.2", color: "#6a7e90", width: 0.05, opacity: 0.6 }] },
  dione: {
    colors: ["#fafafa", "#d6dde4", "#7f8c98"],
    craters: 5,
    lines: [
      { d: "M 0.3 -0.9 C 0.4 -0.3 0.6 0.2 0.5 0.85", color: "#ffffff", width: 0.03, opacity: 0.9 },
      { d: "M 0.55 -0.8 C 0.75 -0.2 0.7 0.3 0.75 0.6", color: "#ffffff", width: 0.025, opacity: 0.8 },
    ],
  },
  rhea: { colors: ICE, craters: 10 },
  titan: { colors: ["#ffd98c", "#e99b2d", "#8a4a10"], shade: 0.6 },
  hyperion: { colors: ["#c9b091", "#8a6a48", "#3a2a18"], shape: potato(2, -40), craters: 12 },
  iapetus: { colors: ["#f4f4f4", "#c4c4c4", "#626262"], craters: 5, half: { color: "#3a2a1a", rotate: 15 } },
  phoebe: { colors: DARK_GREY, shape: potato(0, 60), craters: 5 },
  puck: { colors: DARK_GREY, shape: potato(1, 15), craters: 3 },
  miranda: {
    colors: GREY,
    craters: 4,
    shapes: [{ d: "M -0.42 0.18 L 0 -0.32 L 0.42 0.18 L 0.26 0.18 L 0 -0.1 L -0.26 0.18 Z", color: "#ffffff", opacity: 0.6 }],
  },
  ariel: { colors: ["#f2f2f2", "#c0c0c0", "#585858"], lines: CRACKS.slice(0, 3).map((d) => ({ d, color: "#6a6a6a", width: 0.03, opacity: 0.6 })), craters: 4 },
  umbriel: { colors: ["#9e9e9e", "#5e5e5e", "#1f1f1f"], craters: 6, spots: [{ x: 0.2, y: -0.72, rx: 0.14, ry: 0.07, color: "#ffffff", opacity: 0.7 }] },
  titania: { colors: RUST_GREY, craters: 8 },
  oberon: { colors: ["#d4c4b4", "#8e7a6a", "#40322a"], craters: 9 },
  proteus: { colors: DARK_GREY, shape: potato(2, 30), craters: 5 },
  triton: { colors: ["#fff4f2", "#ead0c8", "#a08080"], caps: { south: 0.5, color: "#f2c7a6" }, spots: [{ x: -0.3, y: -0.2, rx: 0.1, ry: 0.08, color: "#d2a89a", opacity: 0.5 }] },
  nereid: { colors: GREY, shape: potato(0, -20), craters: 3 },
  charon: { colors: ["#dedede", "#9e9e9e", "#454545"], caps: { north: 0.3, color: "#7a3a2a" }, craters: 5 },
  styx: { colors: GREY, shape: potato(1, 70), craters: 2 },
  nix: { colors: ["#f0e0d8", "#b8a098", "#504038"], shape: potato(2, 0), craters: 3 },
  kerberos: { colors: DARK_GREY, shape: potato(0, 120), craters: 2 },
  hydra: { colors: GREY, shape: potato(1, -60), craters: 3 },
  vanth: { colors: ["#b0a8a0", "#6e6660", "#282420"], craters: 5 },
  namaka: { colors: GREY, shape: potato(2, 50), craters: 2 },
  hiiaka: { colors: ["#ffffff", "#dcdcdc", "#808080"], craters: 4 },
  weywot: { colors: ["#c8a890", "#806050", "#382820"], shape: potato(0, -45), craters: 3 },
  mk2: { colors: ["#787878", "#444444", "#161616"], shape: potato(1, 100), craters: 2 },
  xiangliu: { colors: ["#a89080", "#6e5648", "#2a1e18"], shape: potato(2, -100), craters: 2 },
  dysnomia: { colors: ["#a8a8b0", "#626268", "#222228"], craters: 5 },
};

// ── Lookup ───────────────────────────────────────────────────────────────────

function defaultLook(body) {
  if (body && body.radiusKm < 120) return { shape: potato(hashString(body.id) % 3), craters: 3 };
  return { craters: 8 };
}

const cache = new Map();

// The finished look for a body: defaults filled in, craters scattered, and the
// `extent` (how far rings or a glow reach past the body, in radii) worked out.
export function lookFor(id) {
  if (!cache.has(id)) cache.set(id, finishLook(id, LOOKS[id] ?? defaultLook(bodyById(id))));
  return cache.get(id);
}
