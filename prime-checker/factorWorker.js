// ── Factoring Worker ──────────────────────────────────────────────────────────
//
// Splits up numbers whose prime factors are all big (two 12-digit primes can
// take a second or more) off the main thread, so the keypad never freezes.
// The app starts a fresh worker per number and terminates it if the number
// changes first.

import { factorize } from "./primes.js";

self.onmessage = (e) => {
  self.postMessage(factorize(e.data));
};
