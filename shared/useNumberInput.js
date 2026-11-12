import { useState } from "react";

// ── Number Input ──
// The number being typed on a <Numpad />. It's kept as a string of digits ("" when
// nothing is typed yet), so it can be far bigger than a JS number can hold.
//
//   const pad = useNumberInput({ max: MAX_NUMBER });
//   …
//   <Numpad pad={pad} />
//
// Options:
//   max          the biggest number allowed (a BigInt, a number or a digit string).
//                Typing past it lands on it, and it sets how many digits fit.
//   zeroIsEmpty  for toys where 0 isn't a number of its own: typing 0, or counting
//                down from 1, leaves nothing typed.
//
// Returns:
//   input        the digit string
//   n            the same number as a BigInt, or null when nothing is typed
//   isEmpty      nothing typed yet
//   canType      there's room for another digit
//   canStep(k)   whether adding k (a BigInt, negative to count down) stays in range
//   type(d), backspace(), clear(), step(k, key?), set(value, key?)
//   flash        true for a moment after every change, for the "flash" animation
//   bounce       the key that was just pressed, for its press animation. Digits
//                bounce themselves; step and set bounce the key they're given.

const FLASH_MS = 300;
const BOUNCE_MS = 200;

export function useNumberInput({ max, zeroIsEmpty = false }) {
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState(false);
  const [bounce, setBounce] = useState(null);

  const maxN = BigInt(max);
  const maxDigits = String(maxN).length;
  const isEmpty = input === "";
  const n = isEmpty ? null : BigInt(input);
  const canType = input.length < maxDigits && (n ?? 0n) < maxN;

  const change = (next, key) => {
    setInput(zeroIsEmpty && next === "0" ? "" : next);
    setFlash(true);
    setTimeout(() => setFlash(false), FLASH_MS);
    if (key != null) {
      setBounce(key);
      setTimeout(() => setBounce(null), BOUNCE_MS);
    }
  };

  const canStep = (k) => {
    // Counting down needs a number to count down from.
    if (k < 0n && n === null) return false;
    const next = (n ?? 0n) + k;
    return next >= 0n && next <= maxN;
  };

  return {
    input, n, isEmpty, canType, canStep, flash, bounce,

    type(d) {
      if (!canType) return;
      // A leading zero is replaced, not kept: 0 then 5 is 5.
      const next = (input === "0" ? "" : input) + d;
      change(BigInt(next) > maxN ? String(maxN) : next, d);
    },

    backspace() {
      if (!isEmpty) change(input.slice(0, -1));
    },

    clear() {
      if (!isEmpty) change("");
    },

    step(k, key) {
      if (canStep(k)) change(String((n ?? 0n) + k), key);
    },

    set(value, key) {
      change(String(value), key);
    },
  };
}
