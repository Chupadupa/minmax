// ── Numberblocks-Inspired Color Constants ────────────────────────────────────
//
// Shared color palette used across toys. Each digit 1–9 maps to the
// Numberblocks character color. Digit 7 gets a rainbow gradient.

export const NB_COLORS = {
  "1": "#E41E20", "2": "#FF8C1A", "3": "#FFD030", "4": "#4AAF4E",
  "5": "#3A8FDE", "6": "#9B59B6",
  "7": "linear-gradient(135deg, #E41E20, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE, #6E3FA0, #9B59B6)",
  "8": "#F472B6", "9": "#8E8E93",
};

export const NB_SOLID = {
  "1": "#E41E20", "2": "#FF8C1A", "3": "#FFD030", "4": "#4AAF4E",
  "5": "#3A8FDE", "6": "#9B59B6", "7": "#6E3FA0", "8": "#F472B6", "9": "#8E8E93",
};

// Rainbow gradient stops for Numberblocks 7 (used in SVG gradients and CSS)
export const NB7_STOPS = [
  "#E41E20", "#FF8C1A", "#FFD030", "#4AAF4E", "#3A8FDE", "#9B59B6", "#F472B6",
];

export const NB7_GRADIENT = `linear-gradient(180deg, ${NB7_STOPS.join(", ")})`;
