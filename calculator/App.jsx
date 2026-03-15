import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { formatDisplay, parseDisplay, compute, MAX_DISPLAY_DIGITS } from "./calcEngine.js";
import { NB_COLORS as DIGIT_COLORS, NB_SOLID as DIGIT_SOLID, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";

const OP_COLOR = "linear-gradient(135deg, #FF8C1A, #E41E20)";
const OP_SOLID = "#E41E20";

const FUNC_COLOR = "linear-gradient(135deg, #3A8FDE, #9B59B6)";
const FUNC_SOLID = "#3A8FDE";

const EQUALS_COLOR = "linear-gradient(135deg, #E41E20, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE, #9B59B6)";

const OP_SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

// ── Button Layout ─────────────────────────────────────────────────────────────

const BUTTONS = [
  { label: "AC", type: "function", action: "clear" },
  { label: "+/−", type: "function", action: "negate" },
  { label: "%",  type: "function", action: "percent" },
  { label: "÷",  type: "operator", action: "/" },

  { label: "7", type: "digit", action: "7" },
  { label: "8", type: "digit", action: "8" },
  { label: "9", type: "digit", action: "9" },
  { label: "×", type: "operator", action: "*" },

  { label: "4", type: "digit", action: "4" },
  { label: "5", type: "digit", action: "5" },
  { label: "6", type: "digit", action: "6" },
  { label: "−", type: "operator", action: "-" },

  { label: "1", type: "digit", action: "1" },
  { label: "2", type: "digit", action: "2" },
  { label: "3", type: "digit", action: "3" },
  { label: "+", type: "operator", action: "+" },

  { label: "0", type: "digit", action: "0" },
  { label: ".", type: "dot",   action: "." },
  { label: "=", type: "equals", action: "=", span: 2 },
];

// ── Calculator ────────────────────────────────────────────────────────────────

export default function Calculator() {
  const [displayValue, setDisplayValue] = useState("0");
  const [pendingOp, setPendingOp] = useState(null);
  const [accumulator, setAccumulator] = useState(0);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeOp, setActiveOp] = useState(null);
  const [bounceBtn, setBounceBtn] = useState(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [lastOp, setLastOp] = useState(null);
  const [lastOperand, setLastOperand] = useState(null);
  const [historyEquation, setHistoryEquation] = useState("");

  // ── Equation Display ──

  const activeEquation = useMemo(() => {
    if (justEvaluated) return null;
    if (pendingOp && !waitingForOperand) {
      return formatDisplay(accumulator) + OP_SYMBOLS[pendingOp] + displayValue;
    }
    if (pendingOp && waitingForOperand) {
      return formatDisplay(accumulator) + OP_SYMBOLS[pendingOp];
    }
    return null;
  }, [pendingOp, waitingForOperand, accumulator, displayValue, justEvaluated]);

  const mainDisplayText = activeEquation || displayValue;

  const displayOuterRef = useRef(null);
  const displayInnerRef = useRef(null);
  const displayFontSize = useAutoFitFontSize(
    displayOuterRef, displayInnerRef, mainDisplayText.length,
    { maxFont: 72, minFont: 14 },
  );

  const triggerBounce = useCallback((key) => {
    setBounceBtn(key);
    setTimeout(() => setBounceBtn(null), 200);
  }, []);

  // ── Handlers ──

  const handleDigit = useCallback((d) => {
    triggerBounce(d);
    if (displayValue === "Error") {
      setDisplayValue(d);
      setPendingOp(null);
      setAccumulator(0);
      setJustEvaluated(false);
      return;
    }
    if (waitingForOperand) {
      setDisplayValue(d);
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated) {
      setDisplayValue(d);
      setPendingOp(null);
      setAccumulator(0);
      setJustEvaluated(false);
      setActiveOp(null);
      setHistoryEquation("");
      return;
    }
    // Don't exceed max digits (ignoring decimal point and minus sign)
    const digitCount = displayValue.replace("-", "").replace(".", "").length;
    if (digitCount >= MAX_DISPLAY_DIGITS) return;
    if (displayValue === "0" && d !== "0") {
      setDisplayValue(d);
    } else if (displayValue === "0" && d === "0") {
      // Do nothing
    } else {
      setDisplayValue(displayValue + d);
    }
  }, [displayValue, waitingForOperand, justEvaluated, triggerBounce]);

  const handleDot = useCallback(() => {
    triggerBounce(".");
    if (displayValue === "Error") {
      setDisplayValue("0.");
      setPendingOp(null);
      setAccumulator(0);
      setJustEvaluated(false);
      return;
    }
    if (waitingForOperand) {
      setDisplayValue("0.");
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated) {
      setDisplayValue("0.");
      setPendingOp(null);
      setAccumulator(0);
      setJustEvaluated(false);
      setActiveOp(null);
      setHistoryEquation("");
      return;
    }
    if (displayValue.includes(".")) return;
    setDisplayValue(displayValue + ".");
  }, [displayValue, waitingForOperand, justEvaluated, triggerBounce]);

  const handleOperator = useCallback((op) => {
    triggerBounce(op);
    if (displayValue === "Error") {
      setActiveOp(op);
      setPendingOp(op);
      setWaitingForOperand(true);
      return;
    }
    const current = parseDisplay(displayValue);
    if (pendingOp && !waitingForOperand && !justEvaluated) {
      const result = compute(accumulator, pendingOp, current);
      const display = formatDisplay(result);
      setDisplayValue(display);
      setAccumulator(display === "Error" ? 0 : result);
    } else {
      setAccumulator(current);
    }
    setPendingOp(op);
    setWaitingForOperand(true);
    setActiveOp(op);
    setJustEvaluated(false);
    setLastOp(null);
    setLastOperand(null);
    setHistoryEquation("");
  }, [displayValue, pendingOp, waitingForOperand, justEvaluated, accumulator, triggerBounce]);

  const handleEquals = useCallback(() => {
    triggerBounce("=");
    if (displayValue === "Error") return;
    const current = parseDisplay(displayValue);
    if (pendingOp) {
      const result = compute(accumulator, pendingOp, current);
      const display = formatDisplay(result);
      setDisplayValue(display);
      setHistoryEquation(formatDisplay(accumulator) + OP_SYMBOLS[pendingOp] + formatDisplay(current));
      setLastOp(pendingOp);
      setLastOperand(current);
      setAccumulator(display === "Error" ? 0 : result);
      setPendingOp(null);
    } else if (lastOp !== null && lastOperand !== null) {
      const result = compute(current, lastOp, lastOperand);
      const display = formatDisplay(result);
      setDisplayValue(display);
      setHistoryEquation(formatDisplay(current) + OP_SYMBOLS[lastOp] + formatDisplay(lastOperand));
      setAccumulator(display === "Error" ? 0 : result);
    }
    setActiveOp(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  }, [displayValue, pendingOp, accumulator, lastOp, lastOperand, triggerBounce]);

  const handleClear = useCallback(() => {
    triggerBounce("clear");
    if (displayValue !== "0") {
      // C — clear entry
      setDisplayValue("0");
      setJustEvaluated(false);
      setHistoryEquation("");
    } else {
      // AC — all clear
      setPendingOp(null);
      setAccumulator(0);
      setWaitingForOperand(false);
      setActiveOp(null);
      setJustEvaluated(false);
      setLastOp(null);
      setLastOperand(null);
      setHistoryEquation("");
    }
  }, [displayValue, triggerBounce]);

  const handleNegate = useCallback(() => {
    triggerBounce("negate");
    if (displayValue === "0" || displayValue === "Error") return;
    if (displayValue.startsWith("-")) {
      setDisplayValue(displayValue.slice(1));
    } else {
      setDisplayValue("-" + displayValue);
    }
  }, [displayValue, triggerBounce]);

  const handlePercent = useCallback(() => {
    triggerBounce("percent");
    if (displayValue === "Error") return;
    const current = parseDisplay(displayValue);
    const result = current / 100;
    setDisplayValue(formatDisplay(result));
  }, [displayValue, triggerBounce]);

  const handleButton = useCallback((btn) => {
    switch (btn.type) {
      case "digit": return handleDigit(btn.action);
      case "dot": return handleDot();
      case "operator": return handleOperator(btn.action);
      case "equals": return handleEquals();
      case "function":
        if (btn.action === "clear") return handleClear();
        if (btn.action === "negate") return handleNegate();
        if (btn.action === "percent") return handlePercent();
        break;
    }
  }, [handleDigit, handleDot, handleOperator, handleEquals, handleClear, handleNegate, handlePercent]);

  // ── Keyboard Support ──

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      else if (e.key === ".") handleDot();
      else if (e.key === "+") handleOperator("+");
      else if (e.key === "-") handleOperator("-");
      else if (e.key === "*") handleOperator("*");
      else if (e.key === "/") { e.preventDefault(); handleOperator("/"); }
      else if (e.key === "Enter" || e.key === "=") handleEquals();
      else if (e.key === "Escape") handleClear();
      else if (e.key === "%") handlePercent();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleDot, handleOperator, handleEquals, handleClear, handlePercent]);

  // ── Derived State ──

  const clearLabel = (displayValue === "0" && !pendingOp) ? "AC" : "C";

  // ── Button Styling ──

  const getButtonStyle = (btn) => {
    const isActive = btn.type === "operator" && activeOp === btn.action;
    const isBouncing = bounceBtn === btn.action;
    const base = {
      gridColumn: btn.span === 2 ? "span 2" : undefined,
      animation: isBouncing ? "btnPress 0.2s ease-out" : "none",
    };

    if (btn.type === "digit") {
      const d = Number(btn.action);
      const style = d >= 1 ? getNumberBlockStyle(d) : { background: "#FFFFFF", border: "#E41E20" };
      const hasBorder = !!style.border;
      return {
        ...base,
        background: style.background,
        border: hasBorder ? `3px solid ${style.border}` : undefined,
        boxShadow: hasBorder
          ? `0 5px 14px ${style.border}40, inset 0 2px 0 rgba(255,255,255,0.5)`
          : `0 5px 14px ${DIGIT_SOLID[btn.action]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
        color: hasBorder ? style.border : undefined,
        textShadow: hasBorder ? "none" : undefined,
      };
    }

    if (btn.type === "dot") {
      return {
        ...base,
        background: "rgba(255,255,255,0.18)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.85)",
      };
    }

    if (btn.type === "operator") {
      return {
        ...base,
        background: isActive ? "#fff" : OP_COLOR,
        color: isActive ? "#E41E20" : "#fff",
        textShadow: isActive ? "none" : undefined,
        boxShadow: `0 5px 14px ${OP_SOLID}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
        transition: "background 0.15s, color 0.15s",
      };
    }

    if (btn.type === "function") {
      return {
        ...base,
        background: FUNC_COLOR,
        boxShadow: `0 5px 14px ${FUNC_SOLID}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
      };
    }

    if (btn.type === "equals") {
      return {
        ...base,
        background: EQUALS_COLOR,
        boxShadow: "0 5px 14px rgba(74,175,78,0.4), inset 0 2px 0 rgba(255,255,255,0.25)",
      };
    }

    return base;
  };

  // ── Render ──

  return (
    <div className="toy-container" style={{ gap: 12 }}>
      <style>{`
        .calc-btn {
          width: 100%; aspect-ratio: 1; border-radius: 50%; border: none;
          font-size: 28px; font-weight: 700; font-family: var(--font-heading);
          color: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; user-select: none; -webkit-user-select: none;
          transition: transform 0.1s ease;
          text-shadow: 0 2px 4px rgba(0,0,0,0.25);
        }
        .calc-btn:active { transform: scale(0.9); }
        .calc-btn[data-span="2"] {
          aspect-ratio: auto;
          border-radius: 999px;
        }
      `}</style>

      <BackgroundDots count={20} />

      {/* Header */}
      <StickyHeader title="Calculator" subtitle="Tap away!" />

      {/* Display */}
      <div className="frosted-card" style={{ ...styles.displayCard, marginTop: "auto" }}>
        {historyEquation && (
          <div style={styles.historyText}>{historyEquation}</div>
        )}
        <div ref={displayOuterRef} style={styles.displayOuter}>
          <div ref={displayInnerRef} style={{
            ...styles.displayText,
            fontSize: displayFontSize,
          }}>
            {mainDisplayText}
          </div>
        </div>
      </div>

      {/* Button Grid */}
      <div style={styles.buttonGrid}>
        {BUTTONS.map((btn, i) => (
          <button
            key={i}
            className="calc-btn"
            data-span={btn.span || 1}
            style={getButtonStyle(btn)}
            onClick={() => handleButton(btn)}
          >
            {btn.action === "clear" ? clearLabel : btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  displayCard: {
    padding: "20px 24px",
    width: "100%", maxWidth: 340,
    minHeight: 140,
    display: "flex", flexDirection: "column", justifyContent: "flex-end",
  },
  historyText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.45)",
    textAlign: "right",
    width: "100%",
    fontFamily: "var(--font-body)",
    fontWeight: 300,
    marginBottom: 4,
    lineHeight: 1.2,
  },
  displayOuter: {
    width: "100%", height: "100%",
    display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
    overflow: "hidden",
  },
  displayText: {
    fontWeight: 300,
    color: "#fff",
    textAlign: "right",
    width: "100%",
    fontFamily: "var(--font-body)",
    lineHeight: 1.1,
    wordBreak: "break-all",
  },
  buttonGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    width: "100%", maxWidth: 340,
    position: "relative", zIndex: 1,
  },
};
