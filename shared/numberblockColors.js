// ── Numberblocks-Inspired Color Constants ────────────────────────────────────
//
// Shared color palette used across toys. Each number maps to the
// Numberblocks character color. Digit 7 gets a rainbow gradient.

export const NB_COLORS = {
  "1": "#E41E20",   // Red
  "2": "#FF8C1A",   // Orange
  "3": "#FFD030",   // Yellow
  "4": "#4AAF4E",   // Green
  "5": "#29B6A8",   // Turquoise/Cyan
  "6": "#3F51B5",   // Indigo (Dark Blue)
  "7": "linear-gradient(135deg, #E41E20, #FF8C1A, #FFD030, #4AAF4E, #29B6A8, #3F51B5, #9B59B6)",  // Rainbow
  "8": "#D6268E",   // Magenta
  "9": "#B0B0B0",   // Light Grey
  "10": "#FFFFFF",  // White (Red outline — use NB_OUTLINE["10"] for border)
  "20": "#FFF8DC",  // Light Yellow/Cream
  "30": "#FFFACD",  // Pale Yellow
  "40": "#90EE90",  // Light Green
  "50": "#7FFFD4",  // Mint Green/Cyan
  "60": "#9B59B6",  // Purple/Violet
  "70": "#C39BD3",  // Light Purple
  "80": "#FA8072",  // Salmon/Light Red
  "90": "#8E8E93",  // Grey
  "100": "#FFFFFF", // White (Red/Pink outline — use NB_OUTLINE["100"] for border)
};

export const NB_SOLID = {
  "1": "#E41E20", "2": "#FF8C1A", "3": "#FFD030", "4": "#4AAF4E",
  "5": "#29B6A8", "6": "#3F51B5", "7": "#6E3FA0", "8": "#D6268E", "9": "#B0B0B0",
  "10": "#FFFFFF", "20": "#FFF8DC", "30": "#FFFACD", "40": "#90EE90",
  "50": "#7FFFD4", "60": "#9B59B6", "70": "#C39BD3", "80": "#FA8072",
  "90": "#8E8E93", "100": "#FFFFFF",
};

// Outline colors for white-based Numberblocks (10, 100)
export const NB_OUTLINE = {
  "10": "#E41E20",  // Red outline
  "100": "#E8578A", // Red/Pink outline
};

// Rainbow gradient stops for Numberblocks 7 (used in SVG gradients and CSS)
export const NB7_STOPS = [
  "#E41E20", "#FF8C1A", "#FFD030", "#4AAF4E", "#29B6A8", "#3F51B5", "#9B59B6",
];

export const NB7_GRADIENT = `linear-gradient(180deg, ${NB7_STOPS.join(", ")})`;
