import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";

export function useAutoFitFontSize(containerRef, contentRef, charCount, { maxFont = 20, minFont = 3.8 } = {}) {
  const [fontSize, setFontSize] = useState(maxFont);
  const ceilingRef = useRef(maxFont);
  const prevCharCountRef = useRef(0);
  const stableHeightRef = useRef(0);

  const fit = useCallback((currentCharCount) => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // If char count decreased (or reset), allow font to grow again
    if (currentCharCount < prevCharCountRef.current) {
      ceilingRef.current = maxFont;
      stableHeightRef.current = 0;
    }
    prevCharCountRef.current = currentCharCount;

    const style = getComputedStyle(container);
    const padV = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const padH = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const availW = container.clientWidth - padH;
    const measuredH = container.clientHeight - padV;

    // Track the peak container height so that if the name label grows
    // (shrinking this container via flex), we keep using the original
    // larger height. Content that overflows gets clipped.
    if (measuredH > stableHeightRef.current) {
      stableHeightRef.current = measuredH;
    }
    const availH = stableHeightRef.current;

    // Binary search for the largest font size that fits, capped by ceiling
    let lo = minFont;
    let hi = Math.min(maxFont, ceilingRef.current);
    while (hi - lo > 0.25) {
      const mid = (lo + hi) / 2;
      content.style.fontSize = mid + "px";
      content.style.lineHeight = mid >= 14 ? "1.6" : "1.15";
      if (content.scrollWidth <= availW && content.scrollHeight <= availH) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    // Update ceiling so font only stays same or shrinks for increasing chars
    ceilingRef.current = lo;

    content.style.fontSize = lo + "px";
    content.style.lineHeight = lo >= 14 ? "1.6" : "1.15";
    setFontSize(lo);
  }, [containerRef, contentRef, maxFont, minFont]);

  useLayoutEffect(() => {
    fit(charCount);
  }, [charCount, fit]);

  // Also re-fit on resize (reset ceiling and stable height since container changed)
  useEffect(() => {
    const onResize = () => {
      ceilingRef.current = maxFont;
      stableHeightRef.current = 0;
      fit(prevCharCountRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit, maxFont]);

  return fontSize;
}
