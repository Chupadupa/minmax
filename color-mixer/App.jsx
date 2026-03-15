import { useState, useMemo } from "react";
import {
  SettingsOverlay,
  SettingsToggle,
  SettingsDivider,
  SettingsSection,
  SettingsAboutText,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { rgbToHex, textColorForRgb } from "../shared/colorUtils.js";
import { PALETTE, BUTTON_BORDER_COLORS } from "./colorData.js";
import { mixSubtractive, mixAdditive, findClosestColorName } from "./colorMixing.js";

// ── Main Component ───────────────────────────────────────────────────────────

export default function ColorMixer() {
  const [added, setAdded] = useState([]);
  const [popBtn, setPopBtn] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHex, setShowHex] = useState(false);
  const [mixMode, setMixMode] = useState("subtractive"); // "subtractive" | "additive"

  const mixFn = mixMode === "subtractive" ? mixSubtractive : mixAdditive;
  const mixedRgb = useMemo(() => mixFn(added), [added, mixMode]);
  const colorName = useMemo(
    () => mixedRgb ? findClosestColorName(mixedRgb) : null,
    [mixedRgb]
  );

  const handleAdd = (color) => {
    setAdded(prev => [...prev, color]);
    setPopBtn(color.name);
    setTimeout(() => setPopBtn(null), 250);
  };

  const handleClear = () => {
    setAdded([]);
  };

  const handleUndo = () => {
    setAdded(prev => prev.slice(0, -1));
  };

  const hasColors = added.length > 0;
  const swatchBg = mixedRgb ? rgbToHex(mixedRgb) : "rgba(255,255,255,0.06)";
  const swatchText = mixedRgb ? textColorForRgb(mixedRgb) : "rgba(255,255,255,0.25)";

  const mixSummary = useMemo(() => {
    if (added.length === 0) return null;
    const counts = {};
    for (const c of added) {
      counts[c.name] = (counts[c.name] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => count > 1 ? `${name} x${count}` : name)
      .join(" + ");
  }, [added]);

  return (
    <div className="toy-container">
      <style>{`
        @keyframes splatIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes btnPop {
          0% { transform: scale(1); }
          50% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        @keyframes swatchPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        @keyframes drip {
          0% { transform: translateY(-20px); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .color-btn {
          border-radius: 18px; font-size: 15px;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          padding: 14px 8px;
        }
        .color-btn:active { transform: scale(0.88) !important; }
      `}</style>

      {/* Header */}
      <StickyHeader
        title="Color Combiner"
        subtitle="Tap colors to mix them together!"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Color swatch display */}
      <div style={{
        ...styles.swatchCard,
        background: swatchBg,
        animation: hasColors ? "swatchPulse 0.3s ease-out" : "none",
        border: hasColors
          ? `3px solid ${rgbToHex(mixedRgb.map(v => Math.max(0, v - 30)))}`
          : "3px dashed rgba(255,255,255,0.15)",
      }} key={`${added.length}-${mixMode}`}>
        {hasColors ? (
          <>
            <div style={{
              ...styles.colorName,
              color: swatchText,
            }}>
              {colorName}
            </div>
            {showHex && (
              <div style={{
                ...styles.hexCode,
                color: swatchText,
              }}>
                {rgbToHex(mixedRgb)}
              </div>
            )}
            <div style={{
              ...styles.mixRecipe,
              color: swatchText,
              opacity: 0.6,
            }}>
              {mixSummary}
            </div>
          </>
        ) : (
          <div style={styles.emptyPrompt}>
            Pick a color below!
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={styles.actionRow}>
        <button
          style={{
            ...styles.actionBtn,
            opacity: hasColors ? 1 : 0.3,
          }}
          disabled={!hasColors}
          onClick={handleUndo}
        >
          ↩ Undo
        </button>
        <button
          style={{
            ...styles.actionBtn,
            opacity: hasColors ? 1 : 0.3,
          }}
          disabled={!hasColors}
          onClick={handleClear}
        >
          ✕ Clear
        </button>
      </div>

      {/* Color buttons */}
      <div style={styles.colorGrid}>
        {PALETTE.map((color) => (
          <button
            key={color.name}
            className="toy-btn color-btn"
            style={{
              background: color.hex,
              boxShadow: `0 4px 12px ${color.hex}44, inset 0 2px 0 rgba(255,255,255,0.2)`,
              borderBottom: `3px solid ${BUTTON_BORDER_COLORS[color.name]}`,
              color: textColorForRgb(color.rgb),
              textShadow: textColorForRgb(color.rgb) === "rgba(0,0,0,0.7)"
                ? "0 1px 2px rgba(255,255,255,0.3)"
                : "0 1px 3px rgba(0,0,0,0.3)",
              animation: popBtn === color.name ? "btnPop 0.25s ease-out" : "none",
            }}
            onClick={() => handleAdd(color)}
          >
            {color.name}
          </button>
        ))}
      </div>

      {/* Settings overlay */}
      <SettingsOverlay
        show={showSettings}
        onClose={() => setShowSettings(false)}
        title="Color Combiner Settings"
      >
        <SettingsSection title="Display">
          <SettingsToggle
            checked={showHex}
            onChange={() => setShowHex(h => !h)}
            label="Show hex code"
            hint="Display the color's hex value (e.g. #FF0000)"
          />
        </SettingsSection>

        <SettingsDivider />

        <SettingsSection title="Mixing Mode">
          <SettingsToggle
            checked={mixMode === "subtractive"}
            onChange={() => setMixMode(m => m === "subtractive" ? "additive" : "subtractive")}
            label="Subtractive mixing (like paint)"
            hint="Red + Blue = Purple, Red + Yellow = Orange"
          />
          <div style={{ height: 10 }} />
          <SettingsToggle
            checked={mixMode === "additive"}
            onChange={() => setMixMode(m => m === "additive" ? "subtractive" : "additive")}
            label="Additive mixing (like light)"
            hint="Red + Green = Yellow, Red + Blue = Magenta"
          />
        </SettingsSection>

        <SettingsDivider />

        <SettingsAboutText>
          Tap colors to mix them and see the result. Subtractive mixing works
          like paint — the way colors mix in art class. Additive mixing works
          like light — the way screens and projectors blend colors.
        </SettingsAboutText>
      </SettingsOverlay>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  swatchCard: {
    width: "100%", maxWidth: 400, minHeight: 180,
    borderRadius: 24,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 6, position: "relative", zIndex: 1,
    padding: "20px 16px",
    transition: "background 0.3s ease",
    boxSizing: "border-box",
  },
  colorName: {
    fontSize: 36, fontWeight: 700,
    fontFamily: "var(--font-heading)",
    textAlign: "center", lineHeight: 1.2,
  },
  hexCode: {
    fontSize: 15, fontWeight: 500,
    fontFamily: "var(--font-body)",
    textAlign: "center",
    opacity: 0.5,
    letterSpacing: 1,
  },
  mixRecipe: {
    fontSize: 13,
    fontFamily: "var(--font-body)",
    textAlign: "center",
    maxWidth: "90%",
  },
  emptyPrompt: {
    fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.25)",
    fontFamily: "var(--font-heading)",
  },
  actionRow: {
    display: "flex", gap: 10,
    width: "100%", maxWidth: 400,
    marginTop: 12, position: "relative", zIndex: 1,
  },
  actionBtn: {
    flex: 1, padding: "10px 0",
    borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 15, fontWeight: 600,
    fontFamily: "var(--font-heading)",
    cursor: "pointer",
    transition: "transform 0.1s ease",
  },
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    width: "100%", maxWidth: 400,
    marginTop: 16, position: "relative", zIndex: 1,
  },
};
