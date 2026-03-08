import { useMemo } from "react";

// ── Background Dots ──────────────────────────────────────────────────────────
//
// Renders random floating circle decorations. Uses the `float` animation
// from base.css and the `.bg-dots` utility class for positioning.

export function BackgroundDots({ count = 20 }) {
  const dots = useMemo(() =>
    Array.from({ length: count }, () => ({
      w: 8 + Math.random() * 16,
      h: 8 + Math.random() * 16,
      hue: Math.random() * 360,
      left: Math.random() * 100,
      top: Math.random() * 100,
      dur: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    })), [count]
  );

  return (
    <div className="bg-dots">
      {dots.map((dot, i) => (
        <div key={i} style={{
          position: "absolute",
          width: dot.w, height: dot.h,
          borderRadius: "50%",
          background: `hsla(${dot.hue}, 80%, 75%, 0.12)`,
          left: `${dot.left}%`, top: `${dot.top}%`,
          animation: `float ${dot.dur}s ease-in-out ${dot.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}
