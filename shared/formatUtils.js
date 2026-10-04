// ── Format Utilities ─────────────────────────────────────────────────────────
//
// Friendly numbers for the space toys: commas on request, durations in the
// nicest unit, and ordinals. Pure logic, no React.

export function trimTo(n, decimals) {
  return Number(n.toFixed(decimals));
}

export function formatNumber(n, useCommas = true) {
  return useCommas ? n.toLocaleString("en-US") : String(n);
}

export function ordinal(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function plural(n, unit) {
  return `${n} ${unit}${n === "1" ? "" : "s"}`;
}

// Durations in the friendliest unit: hours, days or years.
export function formatDays(days, useCommas = true) {
  if (days < 1) return plural(formatNumber(trimTo(days * 24, 1), useCommas), "hour");
  if (days < 730) return plural(formatNumber(trimTo(days, days < 10 ? 1 : 0), useCommas), "day");
  const years = days / 365.25;
  return plural(formatNumber(trimTo(years, years < 10 ? 1 : 0), useCommas), "year");
}

export function formatHours(hours, useCommas = true) {
  if (hours < 48) return plural(formatNumber(trimTo(hours, 1), useCommas), "hour");
  return formatDays(hours / 24, useCommas);
}
