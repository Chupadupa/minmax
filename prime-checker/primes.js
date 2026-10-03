// ── Prime Numbers ────────────────────────────────────────────────────────────
//
// Pure prime logic (no React dependency). Numbers are BigInts so every number
// up to MAX_NUMBER is exact.
//
// - isPrime: Miller–Rabin with the first 13 primes as bases, which is exact
//   (not just "probably prime") for every number below 3.3 × 10²⁴.
// - factorize: trial division by small primes, then Pollard's rho (Brent's
//   variant) for whatever is left. Two big prime factors (say, 12 digits
//   each) can take a second or more, so it accepts a step budget and gives up
//   (returns null) when it runs out — the app then hands it to a worker.

export const MAX_DIGITS = 24;
export const MAX_NUMBER = 10n ** BigInt(MAX_DIGITS) - 1n;

// ── Small Primes ─────────────────────────────────────────────────────────────

function sievePrimes(limit) {
  const composite = new Uint8Array(limit + 1);
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (composite[i]) continue;
    primes.push(i);
    for (let j = i * i; j <= limit; j += i) composite[j] = 1;
  }
  return primes;
}

const TRIAL_LIMIT = 10_000;
const TRIAL_PRIMES = sievePrimes(TRIAL_LIMIT).map(BigInt);
const TRIAL_LIMIT_SQ = BigInt(TRIAL_LIMIT) ** 2n;

// The 25 primes under 100.
export const PRIMES_UNDER_100 = sievePrimes(100);

// ── Primality ────────────────────────────────────────────────────────────────

function modPow(base, exp, mod) {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

// Exact for every n < 3,317,044,064,679,887,385,961,981 (> MAX_NUMBER).
const MR_BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n];

// Weeds out most composites cheaply before Miller–Rabin.
const QUICK_PRIMES = TRIAL_PRIMES.slice(0, 60);
const QUICK_LIMIT_SQ = QUICK_PRIMES[QUICK_PRIMES.length - 1] ** 2n;

export function isPrime(n) {
  if (n < 2n) return false;
  for (const p of QUICK_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  if (n < QUICK_LIMIT_SQ) return true;

  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  outer: for (const a of MR_BASES) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let i = 1; i < s; i++) {
      x = (x * x) % n;
      if (x === n - 1n) continue outer;
    }
    return false;
  }
  return true;
}

// Smallest prime above n, or null if there's none up to MAX_NUMBER.
export function nextPrime(n) {
  if (n < 2n) return 2n;
  for (let k = n % 2n === 0n ? n + 1n : n + 2n; k <= MAX_NUMBER; k += 2n) {
    if (isPrime(k)) return k;
  }
  return null;
}

// Biggest prime below n, or null if n is 2 or less.
export function prevPrime(n) {
  if (n <= 2n) return null;
  if (n === 3n) return 2n;
  for (let k = n % 2n === 0n ? n - 1n : n - 2n; ; k -= 2n) {
    if (isPrime(k)) return k;
  }
}

// ── Factoring ────────────────────────────────────────────────────────────────

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

// Finds a factor of an odd composite n (Pollard's rho, Brent's variant), or
// null if budget.steps runs out first.
function pollardBrent(n, budget) {
  const BATCH = 128;
  for (let c = 1n; ; c++) {
    const f = (v) => (v * v + c) % n;
    let y = 2n, x = 2n, ys = 2n, q = 1n, g = 1n;
    for (let r = 1; g === 1n; r *= 2) {
      budget.steps -= 2 * r;
      if (budget.steps < 0) return null;
      x = y;
      for (let i = 0; i < r; i++) y = f(y);
      for (let k = 0; k < r && g === 1n; k += BATCH) {
        ys = y;
        for (let i = Math.min(BATCH, r - k); i > 0; i--) {
          y = f(y);
          q = (q * (x > y ? x - y : y - x)) % n;
        }
        g = gcd(q, n);
      }
    }
    // The batch overshot: step back through it one at a time.
    if (g === n) {
      do {
        ys = f(ys);
        g = gcd(x > ys ? x - ys : ys - x, n);
      } while (g === 1n);
    }
    if (g !== n) return g;
  }
}

// Prime factors of n (n ≥ 2), smallest first: [[prime, power], …]. Returns
// null if it takes more than maxSteps steps of Pollard's rho.
export function factorize(n, maxSteps = Infinity) {
  const budget = { steps: maxSteps };
  const powers = new Map();
  const add = (p) => powers.set(p, (powers.get(p) ?? 0) + 1);

  let m = n;
  for (const p of TRIAL_PRIMES) {
    if (p * p > m) break;
    while (m % p === 0n) {
      m /= p;
      add(p);
    }
  }

  const rest = m > 1n ? [m] : [];
  while (rest.length) {
    const k = rest.pop();
    if (k < TRIAL_LIMIT_SQ || isPrime(k)) {
      add(k);
    } else {
      const d = pollardBrent(k, budget);
      if (d === null) return null;
      rest.push(d, k / d);
    }
  }
  return [...powers].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

// How many numbers divide n exactly, from its prime factors.
export function factorCount(factors) {
  return factors.reduce((count, [, power]) => count * (power + 1), 1);
}

// The smaller side of every rectangle n blocks can make (a rows of n / a),
// most square first: 12 → 3, 2, 1.
export function rectangleSides(n, factors) {
  let divisors = [1n];
  for (const [p, power] of factors) {
    const next = [];
    for (const d of divisors) {
      let pk = d;
      for (let i = 0; i <= power; i++) {
        next.push(pk);
        pk *= p;
      }
    }
    divisors = next;
  }
  return divisors
    .filter((d) => d * d <= n)
    .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
}

// ── Prime Index ──────────────────────────────────────────────────────────────
//
// Which prime it is (2 is the 1st, 3 the 2nd, …), for primes below
// INDEX_LIMIT. The sieve grows in steps as bigger primes come up, so small
// numbers never pay for a big one.

const INDEX_LIMIT = 1 << 24; // 16,777,216 — past the millionth prime
let indexSieveLimit = 0;
let indexPrimes = null;

function growIndexSieve(n) {
  let limit = 1 << 16;
  while (limit <= n) limit <<= 2;
  limit = Math.min(limit, INDEX_LIMIT);

  // Odd numbers only: slot i stands for 2i + 1.
  const composite = new Uint8Array(limit >> 1);
  for (let i = 3; i * i < limit; i += 2) {
    if (composite[i >> 1]) continue;
    for (let j = i * i; j < limit; j += 2 * i) composite[j >> 1] = 1;
  }
  let count = 1;
  for (let i = 1; i < composite.length; i++) if (!composite[i]) count++;
  const primes = new Uint32Array(count);
  primes[0] = 2;
  for (let i = 1, k = 1; i < composite.length; i++) if (!composite[i]) primes[k++] = 2 * i + 1;

  indexPrimes = primes;
  indexSieveLimit = limit;
}

// 1-based position of prime p among the primes, or null if p is too big.
export function primeIndex(p) {
  if (p >= BigInt(INDEX_LIMIT)) return null;
  const n = Number(p);
  if (n >= indexSieveLimit) growIndexSieve(n);
  let lo = 0;
  let hi = indexPrimes.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (indexPrimes[mid] === n) return mid + 1;
    if (indexPrimes[mid] < n) lo = mid + 1;
    else hi = mid - 1;
  }
  return null;
}
