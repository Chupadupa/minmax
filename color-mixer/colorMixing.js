// ── Color Mixing Logic ───────────────────────────────────────────────────────
//
// Pure functions for mixing colors and finding closest named colors.
//

import { rybToRgb, NAMED_COLORS } from "./colorData.js";

const ACHROMATIC_NAMES = new Set(["White", "Grey", "Black"]);

/**
 * Subtractive mixing (like paint). Chromatic colors mix in RYB space;
 * achromatic colors (White/Grey/Black) blend via RGB averaging.
 */
export function mixSubtractive(colorList) {
  if (colorList.length === 0) return null;
  if (colorList.length === 1) return colorList[0].rgb;

  const chromatic = colorList.filter(c => !ACHROMATIC_NAMES.has(c.name));
  const achromatic = colorList.filter(c => ACHROMATIC_NAMES.has(c.name));

  // All achromatic — average in RGB (Black + White = Grey)
  if (chromatic.length === 0) {
    const avg = [0, 0, 0];
    for (const c of achromatic) {
      avg[0] += c.rgb[0]; avg[1] += c.rgb[1]; avg[2] += c.rgb[2];
    }
    const n = achromatic.length;
    return avg.map(v => Math.round(Math.max(0, Math.min(255, v / n))));
  }

  // Mix chromatic colors in RYB space
  let r = 0, y = 0, b = 0;
  for (const color of chromatic) {
    r += color.ryb[0]; y += color.ryb[1]; b += color.ryb[2];
  }
  const cn = chromatic.length;
  const rybResult = rybToRgb(r / cn, y / cn, b / cn);

  // No achromatic — return RYB result directly
  if (achromatic.length === 0) return rybResult;

  // Blend chromatic RYB result with achromatic colors via RGB averaging
  const total = colorList.length;
  const achromaticAvg = [0, 0, 0];
  for (const c of achromatic) {
    achromaticAvg[0] += c.rgb[0]; achromaticAvg[1] += c.rgb[1]; achromaticAvg[2] += c.rgb[2];
  }
  const an = achromatic.length;
  achromaticAvg[0] /= an; achromaticAvg[1] /= an; achromaticAvg[2] /= an;

  const cw = chromatic.length / total;
  const aw = achromatic.length / total;
  return rybResult.map((v, i) =>
    Math.round(Math.max(0, Math.min(255, v * cw + achromaticAvg[i] * aw)))
  );
}

/**
 * Additive mixing (like light). Uses screen blend mode.
 */
export function mixAdditive(colorList) {
  if (colorList.length === 0) return null;
  if (colorList.length === 1) return colorList[0].rgb;

  // Screen blend: 1 - product(1 - c/255) for each channel
  const result = [0, 0, 0];
  for (let ch = 0; ch < 3; ch++) {
    let product = 1;
    for (const color of colorList) {
      product *= 1 - color.rgb[ch] / 255;
    }
    result[ch] = Math.round((1 - product) * 255);
  }
  return result;
}

/**
 * Find the closest named color for an [r, g, b] value.
 */
export function findClosestColorName(rgb) {
  let bestName = "Unknown";
  let bestDist = Infinity;

  for (const named of NAMED_COLORS) {
    const dr = rgb[0] - named.rgb[0];
    const dg = rgb[1] - named.rgb[1];
    const db = rgb[2] - named.rgb[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestName = named.name;
    }
  }

  return bestName;
}
