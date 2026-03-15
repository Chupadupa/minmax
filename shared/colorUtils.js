// ── Color Utilities ──────────────────────────────────────────────────────────
//
// Shared color helper functions used across multiple toys.
//

/**
 * Compute relative luminance of a hex color string (e.g. "#FF8800").
 * Uses the sRGB formula from WCAG 2.0.
 */
export function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Return a readable text color (dark or light) for a given hex background.
 * Special-cases some known values like "rainbow" and pure white.
 */
export function contrastTextColor(color) {
  if (color === "rainbow") return "#fff";
  if (color === "#FFFFFF") return "#333";
  return luminance(color) > 0.5 ? "#222" : "#fff";
}

/**
 * Convert an [r, g, b] array to a hex color string.
 */
export function rgbToHex(rgb) {
  return "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Return a readable text color for an [r, g, b] background.
 * Uses the ITU-R BT.601 luma formula.
 */
export function textColorForRgb(rgb) {
  const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return lum > 150 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
}
