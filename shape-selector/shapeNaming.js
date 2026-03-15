// ── Polygon Naming ──────────────────────────────────────────────────────────
//
// Latin-based polygon naming system for shapes with 3–10,000 sides.
// Produces names like "Pentagon", "Icosikaihenagon", "Hectogon", etc.
//

const ONES_SUFFIX = {
  1: "hena", 2: "di", 3: "tri", 4: "tetra",
  5: "penta", 6: "hexa", 7: "hepta", 8: "octa", 9: "ennea",
};
const TENS_PREFIX = {
  10: "deca", 20: "icosi", 30: "triaconta", 40: "tetraconta",
  50: "pentaconta", 60: "hexaconta", 70: "heptaconta",
  80: "octaconta", 90: "enneaconta",
};
const HUNDREDS_PREFIX = {
  100: "hecta", 200: "dihecta", 300: "trihecta", 400: "tetrahecta",
  500: "pentahecta", 600: "hexahecta", 700: "heptahecta",
  800: "octahecta", 900: "enneahecta",
};
const THOUSANDS_PREFIX = {
  1000: "chilia", 2000: "dischilia", 3000: "trischilia", 4000: "tetrakischilia",
  5000: "pentakischilia", 6000: "hexakischilia", 7000: "heptakischilia",
  8000: "octakischilia", 9000: "enneakischilia",
};

/**
 * Return the Latin-based polygon name for a given side count (3–10,000).
 */
export function polygonNameForSides(sides) {
  if (sides === 10000) return "Myriagon";
  if (sides === 1000) return "Chiliagon";
  if (sides === 100) return "Hectogon";
  const th = Math.floor(sides / 1000) * 1000;
  const h = Math.floor((sides % 1000) / 100) * 100;
  const t = Math.floor((sides % 100) / 10) * 10;
  const o = sides % 10;

  let name = "";
  if (th > 0) name += THOUSANDS_PREFIX[th];
  if (h > 0) name += HUNDREDS_PREFIX[h];
  if (t > 0) name += TENS_PREFIX[t];
  // "kai" connects ones to the rest (e.g., icosikaipentagon, hectakaihenagon)
  if (o > 0) name += (name.length > 0 ? "kai" : "") + ONES_SUFFIX[o];
  name += "gon";

  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Break a polygon name into segments for coloring/hyphenation.
 * Each segment has { text, digit } where digit is the number the prefix represents
 * (or null for connectors like "kai" and "gon").
 */
export function polygonNameSegments(sides) {
  if (sides === 10000) return [{ text: "Myria", digit: null }, { text: "gon", digit: null }];
  if (sides === 1000) return [{ text: "Chilia", digit: null }, { text: "gon", digit: null }];
  if (sides === 100) return [{ text: "Hecto", digit: null }, { text: "gon", digit: null }];
  const th = Math.floor(sides / 1000) * 1000;
  const h = Math.floor((sides % 1000) / 100) * 100;
  const t = Math.floor((sides % 100) / 10) * 10;
  const o = sides % 10;

  const segments = [];
  if (th > 0) segments.push({ text: THOUSANDS_PREFIX[th], digit: Math.floor(sides / 1000) });
  if (h > 0) segments.push({ text: HUNDREDS_PREFIX[h], digit: Math.floor((sides % 1000) / 100) });
  if (t > 0) segments.push({ text: TENS_PREFIX[t], digit: Math.floor((sides % 100) / 10) });
  if (o > 0) {
    if (segments.length > 0) segments.push({ text: "kai", digit: null });
    segments.push({ text: ONES_SUFFIX[o], digit: o });
  }
  segments.push({ text: "gon", digit: null });

  // Capitalize first segment
  segments[0] = { ...segments[0], text: segments[0].text.charAt(0).toUpperCase() + segments[0].text.slice(1) };
  return segments;
}

/**
 * Convert a number (0–10,000) to its English word form.
 */
export function numberToWord(n) {
  const ONES = [
    "", "one", "two", "three", "four", "five",
    "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n === 0) return "zero";
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return rem === 0 ? `${ONES[h]} hundred` : `${ONES[h]} hundred ${numberToWord(rem)}`;
  }
  const th = Math.floor(n / 1000);
  const rem = n % 1000;
  const thWord = th < 20 ? ONES[th] : numberToWord(th);
  return rem === 0 ? `${thWord} thousand` : `${thWord} thousand ${numberToWord(rem)}`;
}
