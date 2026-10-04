// ── Odd or Even ──────────────────────────────────────────────────────────────
//
// Pure logic for the Odd or Even toy (no React dependency). Numbers come in as
// digit strings, so they can be up to MAX_DIGITS long; BigInt does the math.

export const MAX_DIGITS = 30;
export const MAX_NUMBER = 10n ** BigInt(MAX_DIGITS) - 1n;

export const EVEN_DIGITS = ["0", "2", "4", "6", "8"];
export const ODD_DIGITS = ["1", "3", "5", "7", "9"];

// Only the last digit matters: every ten is 5 pairs, so the tens, hundreds, …
// always pair up, and anything left over comes from the ones.
export function isEven(digits) {
  return EVEN_DIGITS.includes(digits[digits.length - 1]);
}

// Lined up in pairs: 15 → { pairs: 7n, leftover: 1n }. That's also the number
// split into two equal teams (7 + 7) with one left over.
export function pairUp(n) {
  return { pairs: n / 2n, leftover: n % 2n };
}

// "odd" if every digit is odd (13579), "even" if every digit is even (2468),
// otherwise null. Only for numbers with two or more digits.
export function everyDigit(digits) {
  if (digits.length < 2) return null;
  if ([...digits].every((d) => ODD_DIGITS.includes(d))) return "odd";
  if ([...digits].every((d) => EVEN_DIGITS.includes(d))) return "even";
  return null;
}
