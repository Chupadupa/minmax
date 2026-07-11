// ── Pi Computation Worker ─────────────────────────────────────────────────────
//
// Computes π to a requested number of digits off the main thread so the UI
// stays responsive even for very large requests (a million digits takes a few
// seconds). Each message carries a `reqId` so the main thread can ignore the
// results of stale requests.

import { computePiString } from "./piDigits.js";

self.onmessage = (e) => {
  const { reqId, digits } = e.data;
  const value = computePiString(digits);
  self.postMessage({ reqId, digits, value });
};
