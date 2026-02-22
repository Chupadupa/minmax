import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";

// ── Naming Logic ──────────────────────────────────────────────────────────────

const STANDARD_ILLIONS = [
  "", "million", "billion", "trillion", "quadrillion", "quintillion",
  "sextillion", "septillion", "octillion", "nonillion", "decillion"
];
const ONES_PREFIX = ["", "un", "duo", "tre", "quattuor", "quin", "sex", "septen", "octo", "novem"];
const TENS_PREFIX = ["", "deci", "viginti", "triginta", "quadraginta", "quinquaginta", "sexaginta", "septuaginta", "octoginta", "nonaginta"];
const HUNDREDS_PREFIX = ["", "centi", "ducenti", "trecenti", "quadringenti", "quingenti", "sescenti", "septingenti", "octingenti", "nongenti"];
const ILLION_ROOTS = ["", "m", "b", "tr", "quadr", "quint", "sext", "sept", "oct", "non", "dec"];

function getGroupPrefix(n, useDashes) {
  if (n <= 0) return "";
  if (n <= 10) return ILLION_ROOTS[n];
  const ones = n % 10, tens = Math.floor(n / 10) % 10, hundreds = Math.floor(n / 100);
  const parts = [];
  if (ones > 0) parts.push(ONES_PREFIX[ones]);
  if (tens > 0) parts.push(TENS_PREFIX[tens]);
  if (hundreds > 0) parts.push(HUNDREDS_PREFIX[hundreds]);
  if (parts.length > 0) {
    let last = parts[parts.length - 1];
    if (last.endsWith("i") || last.endsWith("a")) last = last.slice(0, -1);
    parts[parts.length - 1] = last;
  }
  return parts.join(useDashes ? "-" : "");
}

function getIllionPrefix(n, useDashes) {
  if (n <= 0) return "";
  if (n <= 999) return getGroupPrefix(n, useDashes);
  const sep = useDashes ? "-" : "";
  const q = Math.floor(n / 1000), r = n % 1000;
  let result = getIllionPrefix(q, useDashes) + sep + "illin";
  if (r > 0) result += sep + getGroupPrefix(r, useDashes);
  return result;
}

function getIllionName(n, useDashes = false) {
  if (n <= 0) return "";
  if (n <= 10) return STANDARD_ILLIONS[n];
  const sep = useDashes ? "-" : "";
  return getIllionPrefix(n, useDashes) + sep + "illion";
}

function getNumberName(zeros, useDashes = false) {
  if (zeros === 0) return "one";
  if (zeros === 1) return "ten";
  if (zeros === 2) return "one hundred";
  if (zeros === 3) return "one thousand";
  if (zeros === 4) return "ten thousand";
  if (zeros === 5) return "one hundred thousand";
  const illionIndex = Math.floor(zeros / 3) - 1;
  const remainder = zeros % 3;
  const illionName = getIllionName(illionIndex, useDashes);
  let prefix = "one ";
  if (remainder === 1) prefix = "ten ";
  if (remainder === 2) prefix = "one hundred ";
  return prefix + illionName;
}

function formatZerosWithCommas(zerosCount) {
  if (zerosCount === 0) return "";
  const totalDigits = 1 + zerosCount;
  const firstGroupLen = ((totalDigits - 1) % 3) + 1;
  const zerosInFirstGroup = firstGroupLen - 1;
  const fullGroups = Math.floor((zerosCount - zerosInFirstGroup) / 3);
  const parts = [];
  if (zerosInFirstGroup > 0) parts.push("0".repeat(zerosInFirstGroup));
  for (let i = 0; i < fullGroups; i++) parts.push("000");
  if (zerosInFirstGroup > 0) return parts.join(",");
  return parts.length > 0 ? "," + parts.join(",") : "";
}

// ── Colors ────────────────────────────────────────────────────────────────────

const NB_COLORS = {
  "1": "#E41E20", "2": "#FF8C1A", "3": "#FFD030", "4": "#4AAF4E",
  "5": "#3A8FDE", "6": "#9B59B6",
  "7": "linear-gradient(135deg, #E41E20, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE, #6E3FA0, #9B59B6)",
  "8": "#F472B6", "9": "#8E8E93",
};
const NB_SOLID = {
  "1": "#E41E20", "2": "#FF8C1A", "3": "#FFD030", "4": "#4AAF4E",
  "5": "#3A8FDE", "6": "#9B59B6", "7": "#6E3FA0", "8": "#F472B6", "9": "#8E8E93",
};

const MAX_ZEROS = 3000000000003;

const MAX_ZEROS_FONT = 20;
const MIN_ZEROS_FONT = 3.8;

function useAutoFitFontSize(containerRef, contentRef, charCount) {
  const [fontSize, setFontSize] = useState(MAX_ZEROS_FONT);
  const ceilingRef = useRef(MAX_ZEROS_FONT);
  const prevCharCountRef = useRef(0);
  const stableHeightRef = useRef(0);

  const fit = useCallback((currentCharCount) => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // If char count decreased (or reset), allow font to grow again
    if (currentCharCount < prevCharCountRef.current) {
      ceilingRef.current = MAX_ZEROS_FONT;
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
    let lo = MIN_ZEROS_FONT;
    let hi = Math.min(MAX_ZEROS_FONT, ceilingRef.current);
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
  }, [containerRef, contentRef]);

  useLayoutEffect(() => {
    fit(charCount);
  }, [charCount, fit]);

  // Also re-fit on resize (reset ceiling and stable height since container changed)
  useEffect(() => {
    const onResize = () => {
      ceilingRef.current = MAX_ZEROS_FONT;
      stableHeightRef.current = 0;
      fit(prevCharCountRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit]);

  return fontSize;
}

function getFunFact(zeros) {
  if (zeros === 100) return "✨ This is a googol! ✨";
  if (zeros === 303) return "🎉 One centillion! That's a LOT of zeros!";
  if (zeros === 3003) return "🚀 Millinillion! A thousand illions!";
  if (zeros === 6003) return "🌟 Billinillion! Two thousand illions!";
  if (zeros === 3000003) return "🔥 Millinillinillion! A million illions!";
  if (zeros === 3000000000003) return "🏆 Millinillinillinillinillion! The biggest named number here!";
  return null;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function FunFactToast({ text }) {
  const [display, setDisplay] = useState({ text: null, phase: "idle" });
  const prevText = useRef(null);

  useEffect(() => {
    if (text && !prevText.current) {
      setDisplay({ text, phase: "enter" });
    } else if (text && text !== prevText.current) {
      setDisplay({ text, phase: "enter" });
    } else if (!text && prevText.current) {
      setDisplay(d => ({ ...d, phase: "exit" }));
      const t = setTimeout(() => setDisplay({ text: null, phase: "idle" }), 350);
      prevText.current = text;
      return () => clearTimeout(t);
    }
    prevText.current = text;
  }, [text]);

  if (!display.text) return null;

  return (
    <div style={{
      position: "absolute",
      left: "50%", top: -8,
      padding: "8px 18px", borderRadius: 14,
      background: "rgba(30, 20, 60, 0.94)",
      border: "1px solid rgba(255, 208, 48, 0.5)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(255,208,48,0.15)",
      fontSize: 14, textAlign: "center", color: "#FFD030",
      fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
      whiteSpace: "nowrap", zIndex: 5,
      animation: display.phase === "enter"
        ? "factPop 0.35s ease-out forwards"
        : "factOut 0.35s ease-in forwards",
    }}>
      {display.text}
    </div>
  );
}

// ── Settings Overlay ──────────────────────────────────────────────────────────

function SettingsOverlay({ show, onClose, useDashes, setUseDashes, useCommas, setUseCommas }) {
  if (!show) return null;

  return (
    <div style={settingsStyles.backdrop} onClick={onClose}>
      <div style={settingsStyles.panel} onClick={e => e.stopPropagation()}>
        <button style={settingsStyles.closeBtn} onClick={onClose}>✕</button>

        <h2 style={settingsStyles.heading}>Settings</h2>

        {/* Dashes toggle */}
        <label style={settingsStyles.toggle}>
          <div style={{
            ...settingsStyles.checkbox,
            background: useDashes ? "#4AAF4E" : "rgba(255,255,255,0.15)",
            borderColor: useDashes ? "#4AAF4E" : "rgba(255,255,255,0.25)",
          }} onClick={() => setUseDashes(d => !d)}>
            {useDashes && <span style={settingsStyles.checkmark}>✓</span>}
          </div>
          <span style={settingsStyles.toggleLabel}>Show dashes between Latin prefixes</span>
        </label>
        <p style={settingsStyles.toggleHint}>
          e.g. {useDashes ? "un-vigint-illion" : "unvigintillion"} → {!useDashes ? "un-vigint-illion" : "unvigintillion"}
        </p>

        {/* Commas toggle */}
        <label style={{ ...settingsStyles.toggle, marginTop: 16 }}>
          <div style={{
            ...settingsStyles.checkbox,
            background: useCommas ? "#4AAF4E" : "rgba(255,255,255,0.15)",
            borderColor: useCommas ? "#4AAF4E" : "rgba(255,255,255,0.25)",
          }} onClick={() => setUseCommas(c => !c)}>
            {useCommas && <span style={settingsStyles.checkmark}>✓</span>}
          </div>
          <span style={settingsStyles.toggleLabel}>Show commas in number display</span>
        </label>
        <p style={settingsStyles.toggleHint}>
          e.g. {useCommas ? "1,000,000" : "1000000"} → {!useCommas ? "1,000,000" : "1000000"}
        </p>

        {/* Divider */}
        <div style={settingsStyles.divider} />

        {/* About section */}
        <h3 style={settingsStyles.subheading}>About</h3>
        <p style={settingsStyles.aboutText}>
          This was made for my son, who absolutely loves numbers.
          He wanted to know the names of really, really big numbers — so we built
          this toy together so he could explore them all the way up to a millinillinillinillinillion.
        </p>

        {/* Divider */}
        <div style={settingsStyles.divider} />

        {/* Credits */}
        <h3 style={settingsStyles.subheading}>Credits</h3>
        <p style={settingsStyles.aboutText}>
          Inspired by{" "}
          <a
            href="https://stevemorse.org/misc/illion.html"
            target="_blank"
            rel="noopener noreferrer"
            style={settingsStyles.link}
          >
            Naming Very Large Numbers in One Step
          </a>
          {" "}by Stephen P. Morse.
        </p>
        <p style={settingsStyles.aboutText}>
          Number button colors based on the{" "}
          <span style={{ color: "#E41E20" }}>N</span>
          <span style={{ color: "#FF8C1A" }}>u</span>
          <span style={{ color: "#FFD030" }}>m</span>
          <span style={{ color: "#4AAF4E" }}>b</span>
          <span style={{ color: "#3A8FDE" }}>e</span>
          <span style={{ color: "#9B59B6" }}>r</span>
          <span style={{ color: "#F472B6" }}>b</span>
          <span style={{ color: "#8E8E93" }}>l</span>
          <span style={{ color: "#E41E20" }}>o</span>
          <span style={{ color: "#FF8C1A" }}>c</span>
          <span style={{ color: "#FFD030" }}>k</span>
          <span style={{ color: "#4AAF4E" }}>s</span>
          {" "}characters.
        </p>
      </div>
    </div>
  );
}

const settingsStyles = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
    animation: "fadeIn 0.2s ease-out",
  },
  panel: {
    background: "linear-gradient(160deg, #1B1464 0%, #302B63 100%)",
    borderRadius: 24, padding: "28px 24px",
    width: "100%", maxWidth: 360,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    position: "relative",
    maxHeight: "85vh", overflowY: "auto",
    fontFamily: "'Fredoka', sans-serif", color: "#fff",
    animation: "popIn 0.3s ease-out",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    background: "rgba(255,255,255,0.1)", border: "none",
    color: "rgba(255,255,255,0.7)", fontSize: 16,
    width: 32, height: 32, borderRadius: 10,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Fredoka', sans-serif",
  },
  heading: {
    fontSize: 22, fontWeight: 700, margin: "0 0 20px",
    background: "linear-gradient(135deg, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  toggle: {
    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 8,
    border: "2px solid", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.15s ease",
  },
  checkmark: {
    color: "#fff", fontSize: 16, fontWeight: 700,
  },
  toggleLabel: {
    fontSize: 15, color: "rgba(255,255,255,0.85)",
    fontFamily: "'Outfit', sans-serif",
  },
  toggleHint: {
    fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "6px 0 0 40px",
    fontFamily: "'Outfit', sans-serif",
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.08)",
    margin: "20px 0",
  },
  subheading: {
    fontSize: 16, fontWeight: 600, margin: "0 0 8px",
    color: "rgba(255,255,255,0.7)",
  },
  aboutText: {
    fontSize: 14, lineHeight: 1.6, margin: "0 0 10px",
    color: "rgba(255,255,255,0.55)",
    fontFamily: "'Outfit', sans-serif",
  },
  link: {
    color: "#48DBFB", textDecoration: "none",
    borderBottom: "1px solid rgba(72,219,251,0.3)",
  },
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BigNumberNamer() {
  const [input, setInput] = useState("");
  const [bounce, setBounce] = useState(null);
  const [nameFlash, setNameFlash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useDashes, setUseDashes] = useState(true);
  const [useCommas, setUseCommas] = useState(true);
  const zerosOuterRef = useRef(null);
  const zerosInnerRef = useRef(null);

  // Stable background dots - generated once
  const bgDots = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      w: 8 + Math.random() * 16,
      h: 8 + Math.random() * 16,
      hue: Math.random() * 360,
      left: Math.random() * 100,
      top: Math.random() * 100,
      dur: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    })), []
  );

  const zeros = input === "" ? 0 : Math.min(parseInt(input, 10), MAX_ZEROS);
  const name = getNumberName(zeros, useDashes);
  const funFact = getFunFact(zeros);
  const atMax = zeros >= MAX_ZEROS;
  const atMin = zeros <= 0;
  const hasContent = zeros > 0;

  const triggerFlash = () => {
    setNameFlash(true);
    setTimeout(() => setNameFlash(false), 300);
  };

  // Normalize input: if typed value exceeds MAX, clamp the stored input
  const setInputClamped = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      setInput("");
    } else if (num > MAX_ZEROS) {
      setInput(String(MAX_ZEROS));
    } else {
      setInput(String(num));
    }
  };

  const handleDigit = (d) => {
    if (atMax) return;
    const next = input + d;
    const val = parseInt(next, 10);
    if (next.length > 13) return;
    if (val > MAX_ZEROS) {
      setInput(String(MAX_ZEROS));
    } else {
      setInput(String(val));
    }
    setBounce(d);
    triggerFlash();
    setTimeout(() => setBounce(null), 200);
  };

  const handleBackspace = () => {
    if (!hasContent) return;
    const newInput = input.slice(0, -1);
    setInput(newInput);
    triggerFlash();
  };

  const handleClear = () => {
    if (!hasContent) return;
    setInput("");
    triggerFlash();
  };

  const handlePlusOne = () => {
    if (atMax) return;
    const current = input === "" ? 0 : parseInt(input, 10);
    const next = Math.min(current + 1, MAX_ZEROS);
    setInput(String(next));
    triggerFlash();
  };

  const handleMinusOne = () => {
    if (atMin) return;
    // Use the clamped zeros value, not raw input
    const next = zeros - 1;
    if (next <= 0) {
      setInput("");
    } else {
      setInput(String(next));
    }
    triggerFlash();
  };

  const displayZeroCount = Math.min(zeros, 3003);
  const zerosString = useCommas ? formatZerosWithCommas(displayZeroCount) : "0".repeat(displayZeroCount);
  const displayCharCount = 1 + displayZeroCount + (useCommas ? Math.floor(displayZeroCount / 3) : 0);
  const zerosFontSize = useAutoFitFontSize(zerosOuterRef, zerosInnerRef, displayCharCount);

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Outfit:wght@300;400;500&display=swap');
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes flash {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        @keyframes btnPress {
          0% { transform: scale(1); }
          50% { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        @keyframes factPop {
          0% { transform: translateX(-50%) scale(0.7); opacity: 0; }
          60% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes factOut {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(0.7); opacity: 0; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body, #root { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
        .nb-btn {
          width: 100%; aspect-ratio: 1.4; border-radius: 18px; border: none;
          font-size: 30px; font-weight: 700; font-family: 'Fredoka', sans-serif;
          color: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; user-select: none; -webkit-user-select: none;
          transition: transform 0.1s ease, opacity 0.15s ease;
          text-shadow: 0 2px 4px rgba(0,0,0,0.25);
        }
        .nb-btn:active:not([disabled]) { transform: scale(0.9); }
        .nb-btn[disabled] { cursor: default; }
        .pm-btn {
          border-radius: 16px; border: none; font-size: 26px; font-weight: 700;
          font-family: 'Fredoka', sans-serif; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          user-select: none; -webkit-user-select: none; transition: transform 0.1s ease;
          padding: 12px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.25);
        }
        .pm-btn:active:not([disabled]) { transform: scale(0.9); }
        .pm-btn[disabled] { cursor: default; }
      `}</style>

      {/* Background decorations - stable, no re-render flicker */}
      <div style={styles.bgDots}>
        {bgDots.map((dot, i) => (
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

      {/* Header */}
      <div style={styles.header}>
        <a href="../" style={styles.backBtn} aria-label="Back to home">‹</a>
        <button style={styles.gearBtn} onClick={() => setShowSettings(true)}>⚙</button>
        <h1 style={styles.title}>Big Number Namer</h1>
        <p style={styles.subtitle}>How many zeros?</p>
      </div>

      {/* Settings overlay */}
      <SettingsOverlay
        show={showSettings}
        onClose={() => setShowSettings(false)}
        useDashes={useDashes}
        setUseDashes={setUseDashes}
        useCommas={useCommas}
        setUseCommas={setUseCommas}
      />

      {/* Display Area */}
      <div style={styles.displayCard}>
        <div style={{
          ...styles.bigNumber,
          fontSize: zeros.toLocaleString().length <= 5 ? 42 : zeros.toLocaleString().length <= 9 ? 32 : zeros.toLocaleString().length <= 13 ? 24 : 18,
        }}>{zeros.toLocaleString()}</div>
        <div style={styles.secondaryRow}>
          <span style={styles.zerosLabel}>zeros</span>
          <span style={styles.notationDot}>·</span>
          <span style={styles.sciNotation}>10<sup>{zeros.toLocaleString()}</sup></span>
        </div>

        <div ref={zerosOuterRef} style={styles.numberDisplayOuter}>
          <div ref={zerosInnerRef} style={{
            ...styles.numberDisplayInner,
            fontSize: zerosFontSize,
            lineHeight: zerosFontSize >= 14 ? 1.6 : 1.15,
          }}>
            <span style={{
              fontWeight: 700, color: "#E41E20",
              fontSize: Math.max(zerosFontSize + 4, 14),
            }}>1</span>{zeros > 0 && (
              <span style={{
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Outfit', monospace",
              }}>{zerosString}</span>
            )}
          </div>
        </div>

        <div style={{
          ...styles.nameDisplay,
          animation: nameFlash ? "flash 0.3s ease-out" : "none",
        }}>
          <span style={styles.nameText}>{name}</span>
        </div>
      </div>

      {/* Fun fact overlay */}
      <div style={styles.funFactAnchor}>
        <FunFactToast text={funFact} />
      </div>

      {/* Numpad */}
      <div style={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button key={d} className="nb-btn" disabled={atMax} style={{
            background: NB_COLORS[String(d)],
            boxShadow: `0 5px 14px ${NB_SOLID[String(d)]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
            animation: bounce === String(d) && !atMax ? "btnPress 0.2s ease-out" : "none",
            opacity: atMax ? 0.35 : 1,
          }} onClick={() => handleDigit(String(d))}>
            {d}
          </button>
        ))}
        <button className="nb-btn" disabled={!hasContent} style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 16, letterSpacing: 1,
          color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
        }} onClick={handleClear}>
          CLR
        </button>
        <button className="nb-btn" disabled={atMax} style={{
          background: "#FFFFFF",
          border: "3px solid #E41E20",
          boxShadow: "0 5px 14px rgba(228,30,32,0.25), inset 0 2px 0 rgba(255,255,255,0.5)",
          color: "#E41E20", textShadow: "none",
          animation: bounce === "0" && !atMax ? "btnPress 0.2s ease-out" : "none",
          opacity: atMax ? 0.35 : 1,
        }} onClick={() => handleDigit("0")}>
          0
        </button>
        <button className="nb-btn" disabled={!hasContent} style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 26,
          color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
        }} onClick={handleBackspace}>
          ←
        </button>
      </div>

      <div style={styles.pmRow}>
        <button className="pm-btn" disabled={atMin} style={{
          background: "linear-gradient(135deg, #E41E20, #FF8C1A)",
          boxShadow: "0 4px 12px rgba(228,30,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: atMin ? 0.35 : 1,
        }} onClick={handleMinusOne}>
          − 1
        </button>
        <button className="pm-btn" disabled={atMax} style={{
          background: "linear-gradient(135deg, #3A8FDE, #9B59B6)",
          boxShadow: "0 4px 12px rgba(58,143,222,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: atMax ? 0.35 : 1,
        }} onClick={handlePlusOne}>
          + 1
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(150deg, #0F0C29 0%, #1B1464 30%, #302B63 50%, #24243E 70%, #000000 100%)",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "24px 16px 40px", fontFamily: "'Fredoka', sans-serif",
    position: "relative", overflow: "hidden", color: "#fff",
  },
  bgDots: { position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" },
  header: {
    textAlign: "center", marginBottom: 16, animation: "popIn 0.5s ease-out",
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: 380,
  },
  backBtn: {
    position: "absolute", top: 2, left: 0,
    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.6)", fontSize: 22,
    width: 36, height: 36, borderRadius: 12,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s ease",
    textDecoration: "none", lineHeight: 1,
  },
  gearBtn: {
    position: "absolute", top: 2, right: 0,
    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.6)", fontSize: 18,
    width: 36, height: 36, borderRadius: 12,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s ease",
  },
  title: {
    fontSize: 28, fontWeight: 700, margin: 0,
    background: "linear-gradient(135deg, #E41E20, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE, #9B59B6, #F472B6)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "4px 0 0",
    fontFamily: "'Outfit', sans-serif", fontWeight: 300,
  },
  displayCard: {
    background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)",
    borderRadius: 20, padding: "14px 16px",
    width: "100%", maxWidth: 380, height: 260,
    border: "1px solid rgba(255,255,255,0.1)",
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  bigNumber: {
    fontSize: 42, fontWeight: 700, color: "#FFD030",
    textAlign: "center", lineHeight: 1, marginBottom: 2,
  },
  secondaryRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, marginBottom: 8, flexShrink: 0,
  },
  zerosLabel: {
    fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)", fontFamily: "'Outfit', sans-serif",
  },
  notationDot: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  sciNotation: {
    fontSize: 12, color: "rgba(255,255,255,0.35)",
    fontFamily: "'Outfit', sans-serif",
  },
  numberDisplayOuter: {
    flex: 1, minHeight: 0,
    background: "rgba(0,0,0,0.15)", borderRadius: 10,
    marginBottom: 8, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "4px 6px",
  },
  numberDisplayInner: {
    wordBreak: "break-all", textAlign: "center",
    maxHeight: "100%", overflow: "hidden",
  },
  nameDisplay: {
    background: "rgba(255,255,255,0.05)", borderRadius: 10,
    padding: "8px 14px", minHeight: 40, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  nameText: {
    fontSize: 20, fontWeight: 600, textAlign: "center", lineHeight: 1.3,
    background: "linear-gradient(135deg, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", wordBreak: "break-word",
  },
  funFactAnchor: {
    width: "100%", maxWidth: 380, height: 20,
    position: "relative", zIndex: 2,
  },
  numpad: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
    width: "100%", maxWidth: 300, position: "relative", zIndex: 1,
  },
  pmRow: {
    display: "flex", gap: 10, width: "100%", maxWidth: 300,
    marginTop: 10, position: "relative", zIndex: 1,
  },
};
