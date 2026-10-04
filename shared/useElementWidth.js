import { useState, useLayoutEffect } from "react";

// ── Element Width Hook ───────────────────────────────────────────────────────
//
// The current width of an element, kept up to date on resize — for layouts
// worked out in pixels (the space maps).
//
// Usage:  const width = useElementWidth(ref);

export function useElementWidth(ref, fallback = 360) {
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const update = () => { if (ref.current) setWidth(ref.current.clientWidth); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);
  return width;
}
