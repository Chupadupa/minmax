import { useState, useRef, useEffect } from "react";
import { toRomanParts, toRomanLetters, ROMAN_LETTERS, MAX_NUMBER } from "./romanNumerals.js";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { NB_SOLID, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { Toast } from "../shared/Toast.jsx";

const MAX_INPUT_LEN = String(MAX_NUMBER).length;
const THIS_YEAR = new Date().getFullYear();

// One rainbow color per letter, smallest (I, red) to biggest (M, pink).
const LETTER_COLORS = {
  I: "#E41E20", V: "#FF8C1A", X: "#FFD030", L: "#4AAF4E",
  C: "#3A8FDE", D: "#9B59B6", M: "#F472B6",
};
const PLAIN_COLOR = "rgba(255,255,255,0.92)";
const BAR_COLOR = "#F1EEFA";

// Cinzel is based on classical Roman inscriptions (loaded in index.html).
const ROMAN_FONT = "'Cinzel', Georgia, 'Times New Roman', serif";

// Bar geometry, in em so the bars scale with the letters. In a line-height-1
// box, Cinzel's capitals start CAP_TOP below the top; the first bar sits
// BAR_GAP above that, poking BAR_RISE out of the box.
const CAP_TOP = 0.085;
const BAR_GAP = 0.06;    // space between a capital and its first bar
const BAR_THICK = 0.065; // thickness of one bar
const BAR_STEP = 0.14;   // distance between stacked bars
const BAR_INSET = 0.07;  // gap at the ends of a barred group
const BAR_RISE = BAR_GAP + BAR_THICK - CAP_TOP;

function formatNumber(n, useCommas) {
  return useCommas ? n.toLocaleString("en-US") : String(n);
}

function getFunFact(n, isZero) {
  if (isZero) return "🏛️ The Romans had no zero!";
  if (n === 4) return "🕰️ Clocks often write 4 as IIII!";
  if (n === 100) return "💯 C is for centum — Latin for 100!";
  if (n === 1000) return "🏛️ M is for mille — Latin for 1,000!";
  if (n === THIS_YEAR) return "📅 That's this year!";
  if (n === 3888) return "📏 Longest without bars — 15 letters!";
  if (n === 3999) return "🏆 The biggest number with no bars!";
  if (n === 4000) return "✨ A bar makes a letter 1,000× bigger!";
  if (n === 1000000) return "🌟 One million — M with a bar!";
  if (n === 4000000) return "✨ Two bars: a million times bigger!";
  if (n === 1000000000) return "🚀 One billion — M with two bars!";
  if (n === 4000000000) return "✨ Three bars: a billion times bigger!";
  if (n === 1000000000000) return "🌌 One trillion — M with three bars!";
  if (n === MAX_NUMBER) return "🏆 The biggest number here!";
  return null;
}

// ── Roman Letters ────────────────────────────────────────────────────────────
//
// Each letter reserves room for `maxBars` bars so a whole row lines up. A bar
// runs flush into its neighbor's bar at the same height, so a barred group
// reads as one long line — the way the Romans wrote it.

function RomanLetters({ letters, maxBars, colorize }) {
  return letters.map(({ letter, bars }, i) => {
    const prevBars = letters[i - 1]?.bars ?? 0;
    const nextBars = letters[i + 1]?.bars ?? 0;
    return (
      <span key={i} style={{
        ...styles.letter,
        paddingTop: maxBars > 0 ? `${(maxBars - 1) * BAR_STEP + BAR_RISE}em` : 0,
        color: colorize ? LETTER_COLORS[letter] : PLAIN_COLOR,
      }}>
        {Array.from({ length: bars }, (_, b) => {
          // Joined ends overlap a hair so neighboring bars never show a seam.
          const joinLeft = prevBars > b;
          const joinRight = nextBars > b;
          const radius = (joined) => (joined ? 0 : 2);
          return (
            <span key={b} style={{
              ...styles.bar,
              top: `${(maxBars - 1 - b) * BAR_STEP}em`,
              left: joinLeft ? -0.5 : `${BAR_INSET}em`,
              right: joinRight ? -0.5 : `${BAR_INSET}em`,
              borderRadius: `${radius(joinLeft)}px ${radius(joinRight)}px ${radius(joinRight)}px ${radius(joinLeft)}px`,
            }} />
          );
        })}
        {letter}
      </span>
    );
  });
}

// The seven letters and their values, shown before a number is typed.
function LetterKey({ colorize, useCommas }) {
  return (
    <div style={styles.key}>
      {ROMAN_LETTERS.map(({ letter, value }) => (
        <div key={letter} style={styles.keyItem}>
          <span style={{ ...styles.keyLetter, color: colorize ? LETTER_COLORS[letter] : PLAIN_COLOR }}>
            {letter}
          </span>
          <span style={styles.keyValue}>{formatNumber(value, useCommas)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Settings Content ─────────────────────────────────────────────────────────

function RomanSettings({ show, onClose, colorize, setColorize, useCommas, setUseCommas }) {
  const inline = (n, showColors = colorize) => {
    const parts = toRomanParts(n);
    return (
      <span style={{ fontFamily: ROMAN_FONT, fontWeight: 700 }}>
        <RomanLetters letters={toRomanLetters(parts)} maxBars={parts[0].bars} colorize={showColors} />
      </span>
    );
  };

  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={colorize}
        onChange={() => setColorize(c => !c)}
        label="Color the letters"
        hint={<>Each letter gets its own color:{" "}
          {ROMAN_LETTERS.map(({ letter, value }) => <span key={letter}>{inline(value, true)} </span>)}</>}
      />

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={useCommas}
          onChange={() => setUseCommas(c => !c)}
          label="Show commas in numbers"
          hint={`e.g. ${useCommas ? "1,000,000" : "1000000"} → ${!useCommas ? "1,000,000" : "1000000"}`}
        />
      </div>

      <SettingsDivider />
      <SettingsSection title="How It Works">
        <SettingsAboutText>
          Add the letters up: {inline(16)} = 10 + 5 + 1 = 16.
        </SettingsAboutText>
        <SettingsAboutText>
          A smaller letter before a bigger one takes away:{" "}
          {inline(4)} = 5 − 1 = 4.
        </SettingsAboutText>
        <SettingsAboutText>
          A bar on top makes a letter 1,000 times bigger:{" "}
          {inline(5000)} = 5,000. Two bars make it a
          million times bigger, and three bars a billion times bigger!
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who absolutely loves numbers — so he can see how the
          ancient Romans would write any number, all the way up to nearly four trillion.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Big numbers use the{" "}
          <SettingsLink href="https://en.wikipedia.org/wiki/Roman_numerals#Large_numbers">
            vinculum
          </SettingsLink>
          {" "}— the bar the Romans drew over a numeral to multiply it by 1,000.
        </SettingsAboutText>
        <SettingsAboutText>
          Letters are set in{" "}
          <SettingsLink href="https://fonts.google.com/specimen/Cinzel">Cinzel</SettingsLink>
          , a typeface based on classical Roman inscriptions.
        </SettingsAboutText>
        <SettingsAboutText>
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
        </SettingsAboutText>
      </SettingsSection>
    </SettingsOverlay>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RomanNumerals() {
  const [input, setInput] = useState("");
  const [bounce, setBounce] = useState(null);
  const [numeralFlash, setNumeralFlash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [colorize, setColorize] = useState(true);
  const [useCommas, setUseCommas] = useState(true);
  const numeralOuterRef = useRef(null);
  const numeralInnerRef = useRef(null);
  const partsOuterRef = useRef(null);
  const partsInnerRef = useRef(null);

  const value = input === "" ? 0 : Math.min(parseInt(input, 10), MAX_NUMBER);
  const isEmpty = input === "";
  const isZero = !isEmpty && value === 0;
  const parts = toRomanParts(value);
  const letters = toRomanLetters(parts);
  const maxBars = parts[0]?.bars ?? 0;
  const funFact = getFunFact(value, isZero);
  const atMax = value >= MAX_NUMBER;
  const atMin = value <= 0;
  const hasContent = !isEmpty;

  const numeralFontSize = useAutoFitFontSize(numeralOuterRef, numeralInnerRef, letters.length, {
    maxFont: 64, minFont: 8, fitKey: value,
  });
  const partsCharCount = parts.reduce(
    (sum, p) => sum + p.letters.length + formatNumber(p.value, useCommas).length, 0
  );
  const partsFontSize = useAutoFitFontSize(partsOuterRef, partsInnerRef, partsCharCount, {
    maxFont: 16, minFont: 12, fitKey: value,
  });

  // Big numbers can have more parts than fit at a readable size, so the parts
  // row scrolls — start each new number back at the top.
  useEffect(() => {
    if (partsOuterRef.current) partsOuterRef.current.scrollTop = 0;
  }, [value]);

  const triggerFlash = () => {
    setNumeralFlash(true);
    setTimeout(() => setNumeralFlash(false), 300);
  };

  const handleDigit = (d) => {
    if (atMax) return;
    const next = input + d;
    if (next.length > MAX_INPUT_LEN) return;
    setInput(String(Math.min(parseInt(next, 10), MAX_NUMBER)));
    setBounce(d);
    triggerFlash();
    setTimeout(() => setBounce(null), 200);
  };

  const handleBackspace = () => {
    if (!hasContent) return;
    setInput(input.slice(0, -1));
    triggerFlash();
  };

  const handleClear = () => {
    if (!hasContent) return;
    setInput("");
    triggerFlash();
  };

  const handlePlusOne = () => {
    if (atMax) return;
    setInput(String(Math.min(value + 1, MAX_NUMBER)));
    triggerFlash();
  };

  const handleMinusOne = () => {
    if (atMin) return;
    // Counting down from I lands on zero, so the Romans-had-no-zero fact shows.
    setInput(String(value - 1));
    triggerFlash();
  };

  const arabicText = isEmpty ? "?" : formatNumber(value, useCommas);
  const letterCountText = `${letters.length} ${letters.length === 1 ? "letter" : "letters"}`;

  return (
    <div className="toy-container">
      <style>{`
        @keyframes factPop {
          0% { transform: translateX(-50%) scale(0.7); opacity: 0; }
          60% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes factOut {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(0.7); opacity: 0; }
        }
        .nb-btn {
          width: 100%; aspect-ratio: 1.4;
          border-radius: 18px; font-size: 30px;
        }
        .pm-btn {
          font-size: 26px; padding: 12px 0;
        }
      `}</style>

      <BackgroundDots count={20} />

      {/* Header */}
      <StickyHeader
        title="Roman Numerals"
        subtitle="Write any number the Roman way"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <RomanSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        colorize={colorize}
        setColorize={setColorize}
        useCommas={useCommas}
        setUseCommas={setUseCommas}
      />

      {/* Display Area */}
      <div className="frosted-card" style={styles.displayCard}>
        <div style={{
          ...styles.arabicNumber,
          color: isEmpty ? "rgba(255,255,255,0.3)" : "#FFD030",
          fontSize: arabicText.length <= 7 ? 42 : arabicText.length <= 11 ? 36 : 30,
        }}>{arabicText}</div>
        <div style={styles.secondaryRow}>
          {isEmpty && <span style={styles.secondaryLabel}>the seven Roman letters</span>}
          {isZero && <span style={styles.secondaryLabel}>no Roman numeral</span>}
          {value > 0 && <span style={styles.secondaryLabel}>{letterCountText}</span>}
          {maxBars > 0 && (
            <>
              <span style={styles.notationDot}>·</span>
              <span style={styles.secondaryHint}>each bar = × 1,000</span>
            </>
          )}
        </div>

        <div ref={numeralOuterRef} style={styles.numeralOuter}>
          {isEmpty && <LetterKey colorize={colorize} useCommas={useCommas} />}
          {isZero && <span style={styles.nulla}>nulla</span>}
          {value > 0 && (
            <div ref={numeralInnerRef} style={{
              ...styles.numeralInner,
              fontSize: numeralFontSize,
              lineHeight: numeralFontSize >= 14 ? 1.6 : 1.15,
              animation: numeralFlash ? "flash 0.3s ease-out" : "none",
            }}>
              <RomanLetters letters={letters} maxBars={maxBars} colorize={colorize} />
            </div>
          )}
        </div>

        <div ref={partsOuterRef} style={styles.partsOuter}>
          {isEmpty && <span style={styles.partsHint}>Tap a number below to start!</span>}
          {isZero && <span style={styles.partsHint}>The Latin word <i>nulla</i> means “none”</span>}
          {value > 0 && (
            <div ref={partsInnerRef} style={{ ...styles.partsInner, fontSize: partsFontSize }}>
              {parts.map((part, i) => (
                <span key={i} style={styles.partGroup}>
                  {i > 0 && <span style={styles.plus}>+</span>}
                  <span style={styles.chip}>
                    <span style={styles.chipLetters}>
                      <RomanLetters letters={toRomanLetters([part])} maxBars={maxBars} colorize={colorize} />
                    </span>
                    <span style={styles.chipValue}>{formatNumber(part.value, useCommas)}</span>
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fun fact overlay */}
      <div style={styles.funFactAnchor}>
        <Toast
          text={funFact}
          variant="info"
          position="top"
          enterAnimation="factPop 0.35s ease-out forwards"
          exitAnimation="factOut 0.35s ease-in forwards"
        />
      </div>

      {/* Plus / Minus row */}
      <div style={styles.pmRow}>
        <button className="toy-btn pm-btn" disabled={atMin} style={{
          background: "linear-gradient(135deg, #E41E20, #FF8C1A)",
          boxShadow: "0 4px 12px rgba(228,30,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: atMin ? 0.35 : 1,
        }} onClick={handleMinusOne}>
          − 1
        </button>
        <button className="toy-btn pm-btn" disabled={atMax} style={{
          background: "linear-gradient(135deg, #3A8FDE, #9B59B6)",
          boxShadow: "0 4px 12px rgba(58,143,222,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: atMax ? 0.35 : 1,
        }} onClick={handlePlusOne}>
          + 1
        </button>
      </div>

      {/* Clear / Delete row */}
      <div style={styles.actionRow}>
        <button className="toy-btn pm-btn" disabled={!hasContent} style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 16, letterSpacing: 1,
          color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
          flex: 1,
        }} onClick={handleClear}>
          CLR
        </button>
        <button className="toy-btn pm-btn" disabled={!hasContent} style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 26,
          color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
          flex: 1,
        }} onClick={handleBackspace}>
          ←
        </button>
      </div>

      {/* Numpad */}
      <div style={styles.numpad}>
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((d) => {
          const style = getNumberBlockStyle(d);
          const hasBorder = !!style.border;
          return (
            <button key={d} className="toy-btn nb-btn" disabled={atMax} style={{
              background: style.background,
              border: hasBorder ? `3px solid ${style.border}` : undefined,
              boxShadow: hasBorder
                ? `0 5px 14px ${style.border}40, inset 0 2px 0 rgba(255,255,255,0.5)`
                : `0 5px 14px ${NB_SOLID[String(d)]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
              color: hasBorder ? style.border : undefined,
              textShadow: hasBorder ? "none" : undefined,
              animation: bounce === String(d) && !atMax ? "btnPress 0.2s ease-out" : "none",
              opacity: atMax ? 0.35 : 1,
            }} onClick={() => handleDigit(String(d))}>
              {d}
            </button>
          );
        })}
        <button className="toy-btn nb-btn" disabled={atMax} style={{
          background: "#FFFFFF",
          border: "3px solid #E41E20",
          boxShadow: "0 5px 14px rgba(228,30,32,0.25), inset 0 2px 0 rgba(255,255,255,0.5)",
          color: "#E41E20", textShadow: "none",
          animation: bounce === "0" && !atMax ? "btnPress 0.2s ease-out" : "none",
          opacity: atMax ? 0.35 : 1,
          gridColumn: 2,
        }} onClick={() => handleDigit("0")}>
          0
        </button>
      </div>
    </div>
  );
}

const styles = {
  displayCard: {
    padding: "14px 16px",
    width: "100%", maxWidth: 380, height: 320,
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  arabicNumber: {
    height: 44, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap",
  },
  secondaryRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, height: 18, marginBottom: 8, flexShrink: 0,
  },
  secondaryLabel: {
    fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)",
  },
  notationDot: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  secondaryHint: {
    fontSize: 12, color: "rgba(255,255,255,0.35)",
    fontFamily: "var(--font-body)",
  },
  numeralOuter: {
    flex: 1, minHeight: 0,
    background: "rgba(0,0,0,0.15)", borderRadius: 10,
    marginBottom: 8, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "4px 8px",
  },
  numeralInner: {
    textAlign: "center", maxHeight: "100%", overflow: "hidden",
    fontFamily: ROMAN_FONT, fontWeight: 700,
  },
  letter: {
    position: "relative", display: "inline-block",
    lineHeight: 1, padding: "0 0.03em",
  },
  bar: {
    position: "absolute", height: `${BAR_THICK}em`,
    background: BAR_COLOR,
  },
  nulla: {
    fontFamily: ROMAN_FONT, fontWeight: 700, fontSize: 44,
    fontStyle: "italic", color: "rgba(255,255,255,0.3)",
  },
  key: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
    width: "100%", gap: 2,
  },
  keyItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  },
  keyLetter: {
    fontFamily: ROMAN_FONT, fontWeight: 700, fontSize: 32, lineHeight: 1,
  },
  keyValue: {
    fontSize: 12, color: "rgba(255,255,255,0.55)",
    fontFamily: "var(--font-body)", fontWeight: 500,
  },
  partsOuter: {
    height: 84, flexShrink: 0,
    background: "rgba(255,255,255,0.05)", borderRadius: 10,
    overflowX: "hidden", overflowY: "auto", padding: "5px 6px",
    display: "flex", flexDirection: "column",
  },
  partsHint: {
    margin: "auto 0", fontSize: 14, color: "rgba(255,255,255,0.45)",
    fontFamily: "var(--font-body)", textAlign: "center",
  },
  partsInner: {
    // Auto margins center the parts, but unlike align-items they fall back to
    // the top when the parts overflow, so the scroll can reach the first row.
    margin: "auto 0", width: "100%",
    display: "flex", flexWrap: "wrap",
    alignItems: "center", justifyContent: "center",
    rowGap: "0.3em",
  },
  partGroup: {
    display: "flex", alignItems: "center",
  },
  plus: {
    color: "rgba(255,255,255,0.35)", fontWeight: 600,
    fontSize: "1.1em", lineHeight: 1, margin: "0 0.25em",
  },
  chip: {
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "rgba(255,255,255,0.06)", borderRadius: "0.5em",
    padding: "0.25em 0.4em",
  },
  chipLetters: {
    fontFamily: ROMAN_FONT, fontWeight: 700, fontSize: "1.4em",
    lineHeight: 1, whiteSpace: "nowrap",
  },
  chipValue: {
    fontFamily: "var(--font-body)", fontWeight: 500,
    fontSize: "0.85em", lineHeight: 1.2, marginTop: "0.2em",
    color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap",
  },
  funFactAnchor: {
    width: "100%", maxWidth: 380, height: 20,
    position: "relative", zIndex: 2,
  },
  numpad: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
    width: "100%", maxWidth: 300, marginTop: 10, position: "relative", zIndex: 1,
  },
  pmRow: {
    display: "flex", gap: 10, width: "100%", maxWidth: 300,
    position: "relative", zIndex: 1,
  },
  actionRow: {
    display: "flex", gap: 10, width: "100%", maxWidth: 300,
    marginTop: 10, position: "relative", zIndex: 1,
  },
};
