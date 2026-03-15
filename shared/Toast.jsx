import { useState, useEffect, useRef } from "react";

// ── Toast ────────────────────────────────────────────────────────────────────
// Shared toast notification with enter/exit animation support.
// Variants: "info" (gold on dark) and "warning" (white on red).

const VARIANTS = {
  info: {
    background: "rgba(30, 20, 60, 0.94)",
    border: "1px solid rgba(255, 208, 48, 0.5)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(255,208,48,0.15)",
    color: "#FFD030",
  },
  warning: {
    background: "rgba(228, 30, 32, 0.92)",
    border: "1px solid rgba(255, 140, 26, 0.5)",
    boxShadow: "0 4px 20px rgba(228,30,32,0.4)",
    color: "#fff",
  },
};

export function Toast({
  text,
  visible,
  variant = "info",
  position = "top",
  enterAnimation = "toastEnter 0.35s ease-out forwards",
  exitAnimation = "toastExit 0.35s ease-in forwards",
  exitDuration = 350,
}) {
  const [display, setDisplay] = useState({ text: null, phase: "idle" });
  const prevText = useRef(null);

  useEffect(() => {
    const isVisible = visible !== undefined ? visible : !!text;
    const currentText = text;

    if (isVisible && currentText && !prevText.current) {
      setDisplay({ text: currentText, phase: "enter" });
    } else if (isVisible && currentText && currentText !== prevText.current) {
      setDisplay({ text: currentText, phase: "enter" });
    } else if (!isVisible && prevText.current) {
      setDisplay((d) => ({ ...d, phase: "exit" }));
      const t = setTimeout(() => setDisplay({ text: null, phase: "idle" }), exitDuration);
      prevText.current = isVisible ? currentText : null;
      return () => clearTimeout(t);
    }
    prevText.current = isVisible ? currentText : null;
  }, [text, visible, exitDuration]);

  if (!display.text) return null;

  const variantStyle = VARIANTS[variant] || VARIANTS.info;
  const positionStyle = position === "top"
    ? { top: -8, left: "50%" }
    : { bottom: -48, left: "50%", transform: "translateX(-50%)" };

  return (
    <div style={{
      position: "absolute",
      ...positionStyle,
      padding: "8px 18px",
      borderRadius: 14,
      ...variantStyle,
      fontSize: 14,
      textAlign: "center",
      fontFamily: "var(--font-heading)",
      fontWeight: 600,
      whiteSpace: "nowrap",
      zIndex: 5,
      animation: display.phase === "enter" ? enterAnimation : exitAnimation,
    }}>
      {display.text}
    </div>
  );
}
