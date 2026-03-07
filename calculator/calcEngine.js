// ── Constants ────────────────────────────────────────────────────────────────

export const MAX_DISPLAY_DIGITS = 15;

// ── Display Formatting ───────────────────────────────────────────────────────

export function formatDisplay(value) {
  if (!isFinite(value)) return "Error";

  // Strip floating-point noise
  const cleaned = parseFloat(value.toPrecision(MAX_DISPLAY_DIGITS));

  const str = String(cleaned);

  // If it already fits, use it directly
  if (str.replace("-", "").replace(".", "").length <= MAX_DISPLAY_DIGITS) {
    return str;
  }

  // Try trimming decimal places to fit
  if (str.includes(".")) {
    const [intPart, decPart] = str.split(".");
    const availDec = MAX_DISPLAY_DIGITS - intPart.length;
    if (availDec > 0) {
      const trimmed = cleaned.toFixed(availDec);
      // Remove trailing zeros after decimal
      return trimmed.replace(/\.?0+$/, "");
    }
  }

  // Fall back to exponential notation that fits
  for (let precision = Math.min(MAX_DISPLAY_DIGITS - 2, 12); precision >= 1; precision--) {
    const exp = cleaned.toExponential(precision);
    if (exp.replace("-", "").replace(".", "").replace(/e[+-]?\d+/, "").length <= MAX_DISPLAY_DIGITS) return exp;
  }
  return cleaned.toExponential(0);
}

// ── Parsing ──────────────────────────────────────────────────────────────────

export function parseDisplay(displayStr) {
  if (displayStr === "Error" || displayStr === "") return 0;
  const num = parseFloat(displayStr);
  return isNaN(num) ? 0 : num;
}

// ── Computation ──────────────────────────────────────────────────────────────

export function compute(left, operator, right) {
  switch (operator) {
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/": return right === 0 ? Infinity : left / right;
    default: return right;
  }
}
