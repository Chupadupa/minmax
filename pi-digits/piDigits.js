// ── Pi Digit Computation ──────────────────────────────────────────────────────
//
// Pure logic (no React dependency) for generating the decimal digits of π.
// Uses the Chudnovsky algorithm with binary splitting and a BigInt integer
// square root — fast enough to reach a million digits. The heavy lifting runs
// in a Web Worker (see piWorker.js) so the UI never blocks.

export const MAX_DIGITS = 1000000;

const C = 640320n;
const C3_OVER_24 = (C * C * C) / 24n;

// Binary splitting of the Chudnovsky series over the interval [a, b).
// Returns [P, Q, T]. Iterative work is expressed recursively; the depth is
// O(log N) so the call stack stays shallow even for a million digits.
function binarySplit(a, b) {
  if (b - a === 1n) {
    let Pab, Qab;
    if (a === 0n) {
      Pab = 1n;
      Qab = 1n;
    } else {
      Pab = (6n * a - 5n) * (2n * a - 1n) * (6n * a - 1n);
      Qab = a * a * a * C3_OVER_24;
    }
    let Tab = Pab * (13591409n + 545140134n * a);
    if (a & 1n) Tab = -Tab;
    return [Pab, Qab, Tab];
  }
  const m = (a + b) / 2n;
  const [Pam, Qam, Tam] = binarySplit(a, m);
  const [Pmb, Qmb, Tmb] = binarySplit(m, b);
  return [Pam * Pmb, Qam * Qmb, Qmb * Tam + Pam * Tmb];
}

// Integer square root of a non-negative BigInt (floor(sqrt(n))) via Newton's
// method.
function isqrt(n) {
  if (n < 0n) throw new Error("isqrt of negative");
  if (n < 2n) return n;
  // Initial guess: 2^(ceil(bits/2)) is always ≥ sqrt(n).
  const bits = n.toString(2).length;
  let x = 1n << BigInt((bits >> 1) + 1);
  while (true) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

// Returns the first `total` decimal digits of π (the leading 3 plus
// `total - 1` fractional digits) as a plain digit string with no decimal
// point, e.g. computePiString(5) === "31415". `total` is clamped to
// [1, MAX_DIGITS]. A few guard digits are computed and discarded so the last
// returned digit is not spoiled by rounding.
export function computePiString(total) {
  const t = Math.max(1, Math.min(Math.floor(total) || 1, MAX_DIGITS));
  if (t === 1) return "3";

  const guard = 10;
  const places = t - 1 + guard; // fractional digits to compute

  // Number of series terms: each adds ~14.18 digits of precision.
  let terms = BigInt(Math.floor(places / 14.181647462725476) + 1);
  if (terms < 2n) terms = 2n;

  const [, Q, T] = binarySplit(0n, terms);
  const one = 10n ** BigInt(places);
  const sqrtC = isqrt(10005n * one * one); // ≈ sqrt(10005) · 10^places
  const pi = (Q * 426880n * sqrtC) / T; // ≈ π · 10^places

  return pi.toString().slice(0, t);
}
