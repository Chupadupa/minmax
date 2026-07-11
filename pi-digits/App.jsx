import { useState, useRef, Fragment } from "react";
import { getPiDigits, MAX_DIGITS } from "./piDigits.js";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { NB_SOLID, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { Toast } from "../shared/Toast.jsx";

const MAX_INPUT_LEN = String(MAX_DIGITS).length;

// Numberblocks-inspired color for each single digit 0–9. Zero has no
// Numberblocks color of its own, so it gets a clean white.
const DIGIT_COLORS = {
  0: "#FFFFFF",
  1: "#E41E20", 2: "#FF8C1A", 3: "#FFD030", 4: "#4AAF4E",
  5: "#29B6A8", 6: "#5C6BC0", 7: "#9B59B6", 8: "#D6268E", 9: "#B0B0B0",
};

function getFunFact(n) {
  if (n === 1) return "🥧 Just 3 — the whole-number part of π!";
  if (n === 3) return "🎉 3.14 — that's Pi Day, March 14th!";
  if (n === 5) return "✨ 3.1415 — five digits!";
  if (n === 10) return "🔟 Ten digits of π!";
  if (n === 50) return "🌟 Fifty digits!";
  if (n === 100) return "💯 One hundred digits of π!";
  if (n === 314) return "🥧 Digit 314 — very pi!";
  if (n === 500) return "🚀 Five hundred digits!";
  if (n === MAX_DIGITS) return "🏆 One thousand digits — the most here!";
  return null;
}

// ── Pi Value Rendering ─────────────────────────────────────────────────────────

function PiValue({ digits, colorize, group }) {
  if (digits.length === 0) {
    return <span style={{ color: "rgba(255,255,255,0.18)" }}>3.14159265…</span>;
  }

  const intDigit = digits[0];
  const decimals = digits.slice(1);

  return (
    <>
      <span style={{
        fontWeight: 700,
        color: colorize ? DIGIT_COLORS[intDigit] : "rgba(255,255,255,0.9)",
      }}>{intDigit}</span>
      {decimals.length > 0 && (
        <span style={{ color: "rgba(255,255,255,0.4)" }}>.</span>
      )}
      {decimals.map((d, i) => {
        const needsGap = group && i > 0 && i % 5 === 0;
        return (
          <Fragment key={i}>
            {needsGap && <span style={{ display: "inline-block", width: "0.35em" }} />}
            <span style={{ color: colorize ? DIGIT_COLORS[d] : "rgba(255,255,255,0.55)" }}>{d}</span>
          </Fragment>
        );
      })}
    </>
  );
}

// ── Settings Content ─────────────────────────────────────────────────────────

function PiSettings({ show, onClose, colorize, setColorize, group, setGroup }) {
  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={colorize}
        onChange={() => setColorize(c => !c)}
        label="Color the digits"
        hint="Each digit 0–9 gets its Numberblocks color"
      />

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={group}
          onChange={() => setGroup(g => !g)}
          label="Group digits in fives"
          hint={group ? "e.g. 3.14159 26535 89793" : "e.g. 3.141592653589793"}
        />
      </div>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          π (pi) is the number you get when you divide the distance around a
          circle by the distance across it. Its digits go on forever and never
          settle into a repeating pattern — so there's always another one to find.
        </SettingsAboutText>
        <SettingsAboutText>
          Made for my son, who loves numbers and wanted to see just how many
          digits of π we could show. Type a number and watch them appear!
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          The digits are computed live using{" "}
          <SettingsLink href="https://www.cs.ox.ac.uk/jeremy.gibbons/publications/spigot.pdf">
            Jeremy Gibbons' unbounded spigot algorithm
          </SettingsLink>
          {" "}for π.
        </SettingsAboutText>
        <SettingsAboutText>
          Digit colors based on the{" "}
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

export default function PiDigits() {
  const [input, setInput] = useState("");
  const [bounce, setBounce] = useState(null);
  const [valueFlash, setValueFlash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [colorize, setColorize] = useState(true);
  const [group, setGroup] = useState(false);
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  const count = input === "" ? 0 : Math.min(parseInt(input, 10), MAX_DIGITS);
  const digits = getPiDigits(count);
  const funFact = getFunFact(count);
  const atMax = count >= MAX_DIGITS;
  const atMin = count <= 0;
  const hasContent = count > 0;

  const triggerFlash = () => {
    setValueFlash(true);
    setTimeout(() => setValueFlash(false), 300);
  };

  const handleDigit = (d) => {
    if (atMax) return;
    const next = input + d;
    if (next.length > MAX_INPUT_LEN) return;
    const val = parseInt(next, 10);
    if (val > MAX_DIGITS) {
      setInput(String(MAX_DIGITS));
    } else {
      setInput(String(val));
    }
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
    const next = Math.min(count + 1, MAX_DIGITS);
    setInput(String(next));
    triggerFlash();
  };

  const handleMinusOne = () => {
    if (atMin) return;
    const next = count - 1;
    setInput(next <= 0 ? "" : String(next));
    triggerFlash();
  };

  // Character count for the auto-fit: digits + decimal point + grouping gaps
  const gapCount = group && count > 1 ? Math.floor((count - 1) / 5) : 0;
  const displayCharCount = count === 0 ? 11 : count + 1 + gapCount;
  const valueFontSize = useAutoFitFontSize(outerRef, innerRef, displayCharCount);

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
        title="Pi Digits"
        subtitle="How many digits of π?"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <PiSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        colorize={colorize}
        setColorize={setColorize}
        group={group}
        setGroup={setGroup}
      />

      {/* Display Area */}
      <div className="frosted-card" style={styles.displayCard}>
        <div style={styles.bigSymbol}>π</div>
        <div style={styles.secondaryRow}>
          <span style={styles.countLabel}>
            {count.toLocaleString()} {count === 1 ? "digit" : "digits"}
          </span>
          {count > 1 && (
            <>
              <span style={styles.notationDot}>·</span>
              <span style={styles.placesLabel}>
                {(count - 1).toLocaleString()} decimal {count - 1 === 1 ? "place" : "places"}
              </span>
            </>
          )}
        </div>

        <div ref={outerRef} style={styles.valueOuter}>
          <div ref={innerRef} style={{
            ...styles.valueInner,
            fontSize: valueFontSize,
            lineHeight: valueFontSize >= 14 ? 1.6 : 1.15,
            animation: valueFlash ? "flash 0.3s ease-out" : "none",
          }}>
            <PiValue digits={digits} colorize={colorize} group={group} />
          </div>
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
    width: "100%", maxWidth: 380, height: 280,
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  bigSymbol: {
    fontSize: 40, fontWeight: 700, textAlign: "center", lineHeight: 1,
    marginBottom: 2,
    background: "linear-gradient(135deg, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  secondaryRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, marginBottom: 8, flexShrink: 0,
  },
  countLabel: {
    fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5,
    color: "#FFD030", fontFamily: "var(--font-body)", fontWeight: 600,
  },
  notationDot: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  placesLabel: {
    fontSize: 12, color: "rgba(255,255,255,0.35)",
    fontFamily: "var(--font-body)",
  },
  valueOuter: {
    flex: 1, minHeight: 0,
    background: "rgba(0,0,0,0.15)", borderRadius: 10,
    overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "6px 8px",
  },
  valueInner: {
    wordBreak: "break-all", textAlign: "center",
    maxHeight: "100%", overflow: "hidden",
    fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
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
