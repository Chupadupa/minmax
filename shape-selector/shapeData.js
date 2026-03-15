import { NB_SOLID, NB7_GRADIENT, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { contrastTextColor } from "../shared/colorUtils.js";
import { polygonNameForSides } from "./shapeNaming.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

export function shapeTextColor(color) {
  if (color === NB_SOLID["3"]) return "#fff"; // White text on yellow shapes
  return contrastTextColor(color);
}

export function segmentColor(digit, fallbackColor) {
  if (digit === null) return null;
  if (digit === 7) return NB7_GRADIENT;
  return NB_SOLID[String(digit)] || fallbackColor;
}

// ── SVG Helpers ──────────────────────────────────────────────────────────────

export function polygonPoints(sides, cx, cy, r, rotationOffset = 0) {
  const pts = [];
  const offset = -Math.PI / 2 + rotationOffset;
  for (let i = 0; i < sides; i++) {
    const angle = offset + (2 * Math.PI * i) / sides;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

// ── Shape Definitions ────────────────────────────────────────────────────────

export const SHAPES = [
  { name: "Circle",               sides: 0,  displayNum: 1, color: NB_SOLID["1"], render: "circle" },
  { name: "Oval",                 sides: 0,  displayNum: 1, color: NB_SOLID["1"], render: "oval" },
  { name: "Football",             sides: 2,  displayNum: 2, color: NB_SOLID["2"], render: "football" },
  { name: "Equilateral Triangle", sides: 3,  color: NB_SOLID["3"], render: "polygon" },
  { name: "Right Triangle",       sides: 3,  color: NB_SOLID["3"], render: "rightTriangle" },
  { name: "Obtuse Triangle",      sides: 3,  color: NB_SOLID["3"], render: "obtuseTriangle" },
  { name: "Isosceles Triangle",   sides: 3,  color: NB_SOLID["3"], render: "isoscelesTriangle" },
  { name: "Square",               sides: 4,  color: NB_SOLID["4"], render: "square" },
  { name: "Diamond",              sides: 4,  color: NB_SOLID["4"], render: "diamond" },
  { name: "Trapezoid",            sides: 4,  color: NB_SOLID["4"], render: "trapezoid" },
  { name: "Parallelogram",        sides: 4,  color: NB_SOLID["4"], render: "parallelogram" },
  { name: "Pentagon",             sides: 5,  color: NB_SOLID["5"], render: "polygon" },
  { name: "Hexagon",              sides: 6,  color: NB_SOLID["6"], render: "polygon" },
  { name: "Heptagon",             sides: 7,  color: "rainbow",     render: "polygon" },
  { name: "Octagon",              sides: 8,  color: NB_SOLID["8"], render: "polygon" },
  { name: "Nonagon",              sides: 9,  color: NB_SOLID["9"], render: "polygon" },
  // 10–100: generated from polygon naming
  ...(() => {
    const shapes = [];
    for (let sides = 10; sides <= 100; sides++) {
      const style = getNumberBlockStyle(sides);
      shapes.push({
        name: polygonNameForSides(sides),
        sides,
        color: style.rainbow ? "rainbow" : style.background,
        borderColor: style.border,
        render: "polygon",
      });
    }
    return shapes;
  })(),
];
