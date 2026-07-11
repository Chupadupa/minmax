// ── Pi Digit Computation ──────────────────────────────────────────────────────
//
// Pure logic (no React dependency) for generating the decimal digits of π.
// Uses Jeremy Gibbons' unbounded spigot algorithm with BigInt, and caches the
// longest run computed so far so repeated or growing requests stay cheap.

export const MAX_DIGITS = 1000;

// Cached digits of π (including the leading 3). Grows as larger counts are asked
// for; a request for fewer digits than are cached is answered by slicing.
let cache = [3];

function extendCacheTo(count) {
  if (cache.length >= count) return;

  const out = [];
  let q = 1n, r = 0n, t = 1n, k = 1n, n = 3n, l = 3n;
  while (out.length < count) {
    if (4n * q + r - t < n * t) {
      out.push(Number(n));
      const nextR = 10n * (r - n * t);
      n = (10n * (3n * q + r)) / t - 10n * n;
      q = q * 10n;
      r = nextR;
    } else {
      const nextR = (2n * q + r) * l;
      const nextN = (q * (7n * k) + 2n + r * l) / (t * l);
      q = q * k;
      t = t * l;
      l = l + 2n;
      k = k + 1n;
      n = nextN;
      r = nextR;
    }
  }
  cache = out;
}

// Returns an array of the first `count` decimal digits of π, including the
// leading 3. `count` is clamped to [0, MAX_DIGITS]; 0 returns an empty array.
export function getPiDigits(count) {
  const n = Math.max(0, Math.min(Math.floor(count) || 0, MAX_DIGITS));
  if (n === 0) return [];
  extendCacheTo(n);
  return cache.slice(0, n);
}
