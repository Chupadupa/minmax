// ── Roman Numeral Logic ───────────────────────────────────────────────────────
//
// Pure functions (no React dependency) that write whole numbers as Roman
// numerals. Plain letters cover 1–3,999. Beyond that, a bar drawn over a letter
// (a "vinculum") makes it 1,000 times bigger — and we keep stacking bars for
// even bigger numbers: two bars = × 1,000,000, three bars = × 1,000,000,000.

export const MAX_NUMBER = 3999999999999;

// The seven Roman letters, smallest to largest.
export const ROMAN_LETTERS = [
  { letter: "I", value: 1 },
  { letter: "V", value: 5 },
  { letter: "X", value: 10 },
  { letter: "L", value: 50 },
  { letter: "C", value: 100 },
  { letter: "D", value: 500 },
  { letter: "M", value: 1000 },
];

// How each digit 0–9 is spelled in each place, including the "take away"
// forms where a smaller letter goes before a bigger one (IV, IX, XL, CM…).
const ONES      = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const TENS      = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
const HUNDREDS  = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"];
const THOUSANDS = ["", "M", "MM", "MMM"];

const PLACES = [
  { size: 1000, spellings: THOUSANDS },
  { size: 100, spellings: HUNDREDS },
  { size: 10, spellings: TENS },
  { size: 1, spellings: ONES },
];

// Place-value parts of a number 0–3,999 written under `bars` bars.
function plainParts(n, bars) {
  const scale = 1000 ** bars;
  const parts = [];
  for (const { size, spellings } of PLACES) {
    const digit = Math.floor(n / size) % 10;
    if (digit > 0) parts.push({ letters: spellings[digit], bars, value: digit * size * scale });
  }
  return parts;
}

// Numbers of 4,000 and up write their thousands under one more bar.
function partsWithBars(n, bars) {
  if (n <= 0) return [];
  if (n < 4000) return plainParts(n, bars);
  return [
    ...partsWithBars(Math.floor(n / 1000), bars + 1),
    ...plainParts(n % 1000, bars),
  ];
}

// Splits a number into its Roman place-value parts, biggest first. Each part is
// { letters, bars, value } — e.g. 1,994 → M (1,000), CM (900), XC (90), IV (4),
// and 12,345 → X̄ (10,000), ĪĪ (2,000), CCC (300), XL (40), V (5).
export function toRomanParts(n) {
  return partsWithBars(n, 0);
}

// Flattens parts into single letters: [{ letter: "X", bars: 1 }, …]
export function toRomanLetters(parts) {
  return parts.flatMap(({ letters, bars }) => [...letters].map((letter) => ({ letter, bars })));
}
