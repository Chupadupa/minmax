// ── Clock Utility Functions ───────────────────────────────────────────────────
// Pure functions for angle↔time conversion, formatting, etc.
// No React dependency — reusable anywhere.

/**
 * Zero-pad a number to 2 digits.
 */
export function padTwo(n) {
  return String(n).padStart(2, "0");
}

/**
 * Minute value (0–59) → degrees (0–354).
 * 0 min = 0° (12 o'clock), each minute = 6°.
 */
export function minuteAngle(minutes) {
  return (minutes * 6) % 360;
}

/**
 * Hour (0–11) + minutes (0–59) → degrees (0–359.5).
 * Each hour = 30°, each minute adds 0.5° to the hour hand.
 */
export function hourAngle(hours, minutes) {
  return ((hours % 12) * 30 + minutes * 0.5) % 360;
}

/**
 * Degrees (0–360, 0° = 12 o'clock) → nearest minute (0–59).
 */
export function angleToMinutes(degrees) {
  const normalized = ((degrees % 360) + 360) % 360;
  return Math.round(normalized / 6) % 60;
}

/**
 * Degrees (0–360, 0° = 12 o'clock) → nearest hour (0–11).
 * Returns the closest hour position (ignoring minute offset).
 */
export function angleToHours(degrees) {
  const normalized = ((degrees % 360) + 360) % 360;
  return Math.round(normalized / 30) % 12;
}

/**
 * Given a clock center (cx, cy) and a pointer position (px, py),
 * return the angle in degrees where 0° = 12 o'clock, increasing clockwise.
 */
export function pointerToAngle(cx, cy, px, py) {
  const dx = px - cx;
  const dy = -(py - cy); // flip y (screen coords are top-down)
  const radians = Math.atan2(dx, dy); // 0 = up, positive = clockwise
  return ((radians * 180) / Math.PI + 360) % 360;
}

/**
 * Format hours (0–11) + minutes + isAM → 12-hour display string and period.
 * Returns { display: "12:05", period: "AM" }.
 */
export function formatTime12(hours, minutes, isAM) {
  const displayHour = hours === 0 ? 12 : hours;
  return {
    display: `${displayHour}:${padTwo(minutes)}`,
    period: isAM ? "AM" : "PM",
  };
}

/**
 * Format hours (0–11) + minutes + isAM → 24-hour display string.
 * Returns "00:00" through "23:59".
 */
export function formatTime24(hours, minutes, isAM) {
  let h24 = hours;
  if (!isAM) h24 = hours === 0 ? 12 : hours + 12;
  if (isAM && hours === 0) h24 = 0;
  return `${padTwo(h24)}:${padTwo(minutes)}`;
}

/**
 * Detect wrap direction when a hand crosses the 12 o'clock boundary.
 * Returns +1 (clockwise wrap), -1 (counter-clockwise wrap), or 0 (no wrap).
 */
export function detectWrap(prevAngle, newAngle) {
  const delta = newAngle - prevAngle;
  if (delta > 180) return -1;  // counter-clockwise wrap
  if (delta < -180) return 1;  // clockwise wrap
  return 0;
}
