// ── Scroll Lock Hook ────────────────────────────────────────────────────────
//
// Prevents background scrolling when a full-screen overlay or popup is active.
// Toggles the `overlay-open` class on <body> (see base.css).
//
// Usage:  useScrollLock(isOverlayVisible)

import { useEffect } from "react";

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("overlay-open");
    document.documentElement.classList.add("overlay-open");
    return () => {
      document.body.classList.remove("overlay-open");
      document.documentElement.classList.remove("overlay-open");
    };
  }, [active]);
}
