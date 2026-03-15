// ── Math Utilities ───────────────────────────────────────────────────────────
//
// Shared math helper functions used across multiple toys.
//

/**
 * Greatest common divisor of two integers (Euclidean algorithm).
 */
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

/**
 * Simplify a fraction num/den to lowest terms.
 * Returns [numerator, denominator].
 */
export function simplify(num, den) {
  const g = gcd(num, den);
  return [num / g, den / g];
}
