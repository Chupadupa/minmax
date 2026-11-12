import { useState, useRef } from "react";
import { getNumberName, formatZerosWithCommas } from "./numberNaming.js";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { Toast } from "../shared/Toast.jsx";
import { Numpad } from "../shared/Numpad.jsx";
import { useNumberInput } from "../shared/useNumberInput.js";

const MAX_ZEROS = 3000000000003;

function getFunFact(zeros) {
  if (zeros === 100) return "✨ This is a googol! ✨";
  if (zeros === 303) return "🎉 One centillion! That's a LOT of zeros!";
  if (zeros === 3003) return "🚀 Millinillion! A thousand illions!";
  if (zeros === 6003) return "🌟 Billinillion! Two thousand illions!";
  if (zeros === 3000003) return "🔥 Millinillinillion! A million illions!";
  if (zeros === 3000000000003) return "🏆 Millinillinillinillinillion! The biggest named number here!";
  return null;
}

// ── Settings Content ─────────────────────────────────────────────────────────

function BigNumberSettings({ show, onClose, useDashes, setUseDashes, useCommas, setUseCommas }) {
  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={useDashes}
        onChange={() => setUseDashes(d => !d)}
        label="Show dashes between Latin prefixes"
        hint={`e.g. ${useDashes ? "un-vigint-illion" : "unvigintillion"} → ${!useDashes ? "un-vigint-illion" : "unvigintillion"}`}
      />

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={useCommas}
          onChange={() => setUseCommas(c => !c)}
          label="Show commas in number display"
          hint={`e.g. ${useCommas ? "1,000,000" : "1000000"} → ${!useCommas ? "1,000,000" : "1000000"}`}
        />
      </div>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          This was made for my son, who absolutely loves numbers.
          He wanted to know the names of really, really big numbers — so we built
          this toy together so he could explore them all the way up to a millinillinillinillinillion.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Inspired by{" "}
          <SettingsLink href="https://stevemorse.org/misc/illion.html">
            Naming Very Large Numbers in One Step
          </SettingsLink>
          {" "}by Stephen P. Morse.
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

export default function BigNumberNamer() {
  // No zeros is just "one", so there's no 0 to type: zero means nothing typed.
  const pad = useNumberInput({ max: MAX_ZEROS, zeroIsEmpty: true });
  const [showSettings, setShowSettings] = useState(false);
  const [useDashes, setUseDashes] = useState(true);
  const [useCommas, setUseCommas] = useState(true);
  const zerosOuterRef = useRef(null);
  const zerosInnerRef = useRef(null);

  const zeros = Number(pad.n ?? 0n);
  const name = getNumberName(zeros, useDashes);
  const funFact = getFunFact(zeros);

  const displayZeroCount = Math.min(zeros, 3003);
  const zerosString = useCommas ? formatZerosWithCommas(displayZeroCount) : "0".repeat(displayZeroCount);
  const displayCharCount = 1 + displayZeroCount + (useCommas ? Math.floor(displayZeroCount / 3) : 0);
  const zerosFontSize = useAutoFitFontSize(zerosOuterRef, zerosInnerRef, displayCharCount);

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
      `}</style>

      <BackgroundDots count={20} />

      {/* Header */}
      <StickyHeader
        title="Big Number Namer"
        subtitle="How many zeros?"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <BigNumberSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        useDashes={useDashes}
        setUseDashes={setUseDashes}
        useCommas={useCommas}
        setUseCommas={setUseCommas}
      />

      {/* Display Area */}
      <div className="frosted-card" style={styles.displayCard}>
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
          animation: pad.flash ? "flash 0.3s ease-out" : "none",
        }}>
          <span style={styles.nameText}>{name}</span>
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

      <Numpad pad={pad} />
    </div>
  );
}

const styles = {
  displayCard: {
    padding: "14px 16px",
    width: "100%", maxWidth: 380, height: 260,
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
    color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)",
  },
  notationDot: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  sciNotation: {
    fontSize: 12, color: "rgba(255,255,255,0.35)",
    fontFamily: "var(--font-body)",
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
};
