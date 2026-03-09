import { useState, useMemo } from "react";
import {
  SettingsOverlay,
  SettingsToggle,
  SettingsDivider,
  SettingsSection,
  SettingsAboutText,
} from "../shared/SettingsOverlay.jsx";

// ── RYB Cube Corners ────────────────────────────────────────────────────────
//
// Maps the RYB unit cube to RGB for trilinear interpolation.
// Tuned so that primary mixes match what kids expect:
//   Red + Blue → Purple,  Red + Yellow → Orange,  Blue + Yellow → Green
//

const RYB_CUBE = {
  white:  [255, 255, 255], // (0,0,0) — no pigment
  red:    [255,   0,   0], // (1,0,0)
  yellow: [255, 255,   0], // (0,1,0)
  blue:   [  0,   0, 255], // (0,0,1)
  orange: [255, 128,   0], // (1,1,0) — red + yellow
  purple: [128,   0, 128], // (1,0,1) — red + blue
  green:  [  0, 150,   0], // (0,1,1) — yellow + blue
  black:  [ 45,  25,   0], // (1,1,1) — all pigment (dark brown-black)
};

function rybToRgb(r, y, b) {
  const { white: w, red: rd, yellow: yl, blue: bl, orange: or, purple: pu, green: gr, black: bk } = RYB_CUBE;
  const result = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(
      w[i]  * (1-r) * (1-y) * (1-b) +
      rd[i] *   r   * (1-y) * (1-b) +
      yl[i] * (1-r) *   y   * (1-b) +
      bl[i] * (1-r) * (1-y) *   b   +
      or[i] *   r   *   y   * (1-b) +
      pu[i] *   r   * (1-y) *   b   +
      gr[i] * (1-r) *   y   *   b   +
      bk[i] *   r   *   y   *   b
    );
  }
  return result.map(v => Math.max(0, Math.min(255, v)));
}

// ── Color Palette ────────────────────────────────────────────────────────────
//
// Each color has an rgb (for display), hex, and ryb (for subtractive mixing).
//

const PALETTE = [
  { name: "Red",     rgb: [220, 40, 40],   hex: "#DC2828", ryb: [1.0, 0.0, 0.0] },
  { name: "Orange",  rgb: [240, 140, 20],  hex: "#F08C14", ryb: [0.5, 0.5, 0.0] },
  { name: "Yellow",  rgb: [250, 220, 20],  hex: "#FADC14", ryb: [0.0, 1.0, 0.0] },
  { name: "Green",   rgb: [40, 170, 60],   hex: "#28AA3C", ryb: [0.0, 0.5, 0.5] },
  { name: "Blue",    rgb: [30, 100, 210],  hex: "#1E64D2", ryb: [0.0, 0.0, 1.0] },
  { name: "Indigo",  rgb: [60, 40, 140],   hex: "#3C288C", ryb: [0.2, 0.0, 0.8] },
  { name: "Violet",  rgb: [140, 50, 180],  hex: "#8C32B4", ryb: [0.5, 0.0, 0.5] },
  { name: "Pink",    rgb: [240, 130, 170], hex: "#F082AA", ryb: [0.4, 0.0, 0.1] },
  { name: "Brown",   rgb: [140, 80, 30],   hex: "#8C501E", ryb: [0.6, 0.5, 0.2] },
  { name: "Magenta", rgb: [220, 30, 160],  hex: "#DC1EA0", ryb: [0.8, 0.0, 0.3] },
  { name: "Cyan",    rgb: [20, 190, 220],  hex: "#14BEDC", ryb: [0.0, 0.2, 0.7] },
  { name: "White",   rgb: [245, 245, 245], hex: "#F5F5F5", ryb: [0.0, 0.0, 0.0] },
  { name: "Grey",    rgb: [140, 140, 140], hex: "#8C8C8C", ryb: [0.4, 0.4, 0.4] },
  { name: "Black",   rgb: [30, 30, 30],    hex: "#1E1E1E", ryb: [1.0, 1.0, 1.0] },
];

// ── Named Colors for Matching ────────────────────────────────────────────────

const NAMED_COLORS = [
  // Primaries & palette colors
  { name: "Red",            rgb: [255, 0, 0] },
  { name: "Red",            rgb: [220, 40, 40] },
  { name: "Orange",         rgb: [240, 140, 20] },
  { name: "Orange",         rgb: [255, 128, 0] },
  { name: "Orange",         rgb: [255, 160, 64] },
  { name: "Yellow",         rgb: [250, 220, 20] },
  { name: "Yellow",         rgb: [255, 255, 0] },
  { name: "Green",          rgb: [40, 170, 60] },
  { name: "Green",          rgb: [0, 150, 0] },
  { name: "Green",          rgb: [0, 128, 0] },
  { name: "Green",          rgb: [128, 160, 128] },
  { name: "Blue",           rgb: [30, 100, 210] },
  { name: "Blue",           rgb: [0, 0, 255] },
  { name: "Indigo",         rgb: [60, 40, 140] },
  { name: "Violet",         rgb: [140, 50, 180] },
  { name: "Pink",           rgb: [240, 130, 170] },
  { name: "Brown",          rgb: [140, 80, 30] },
  { name: "Magenta",        rgb: [220, 30, 160] },
  { name: "Cyan",           rgb: [20, 190, 220] },
  { name: "White",          rgb: [245, 245, 245] },
  { name: "White",          rgb: [255, 255, 255] },
  { name: "Grey",           rgb: [140, 140, 140] },
  { name: "Black",          rgb: [30, 30, 30] },
  { name: "Black",          rgb: [0, 0, 0] },
  // Purple — the key mix kids expect from Red + Blue
  { name: "Purple",         rgb: [128, 0, 128] },
  { name: "Purple",         rgb: [100, 0, 120] },
  { name: "Purple",         rgb: [96, 32, 128] },
  { name: "Purple",         rgb: [160, 64, 160] },
  { name: "Purple",         rgb: [140, 40, 160] },
  { name: "Purple",         rgb: [115, 20, 140] },
  // Common mixes — subtractive RYB results
  { name: "Dark Red",       rgb: [150, 30, 30] },
  { name: "Dark Red",       rgb: [180, 20, 20] },
  { name: "Dark Green",     rgb: [20, 100, 30] },
  { name: "Dark Blue",      rgb: [20, 50, 130] },
  { name: "Navy",           rgb: [20, 30, 100] },
  { name: "Navy",           rgb: [0, 0, 130] },
  { name: "Teal",           rgb: [0, 128, 128] },
  { name: "Teal",           rgb: [30, 140, 140] },
  { name: "Olive",          rgb: [120, 140, 30] },
  { name: "Olive",          rgb: [128, 128, 0] },
  { name: "Lime",           rgb: [140, 200, 40] },
  { name: "Lime",           rgb: [128, 192, 0] },
  { name: "Sky Blue",       rgb: [100, 170, 220] },
  { name: "Sky Blue",       rgb: [128, 192, 255] },
  { name: "Light Blue",     rgb: [140, 190, 230] },
  { name: "Light Blue",     rgb: [128, 128, 255] },
  { name: "Light Green",    rgb: [130, 210, 130] },
  { name: "Light Green",    rgb: [128, 192, 128] },
  { name: "Light Pink",     rgb: [255, 182, 193] },
  { name: "Light Pink",     rgb: [240, 180, 200] },
  { name: "Lavender",       rgb: [180, 150, 210] },
  { name: "Lavender",       rgb: [192, 128, 255] },
  { name: "Coral",          rgb: [230, 120, 100] },
  { name: "Coral",          rgb: [255, 128, 80] },
  { name: "Salmon",         rgb: [230, 140, 120] },
  { name: "Salmon",         rgb: [250, 128, 114] },
  { name: "Peach",          rgb: [240, 180, 130] },
  { name: "Peach",          rgb: [255, 218, 185] },
  { name: "Gold",           rgb: [230, 180, 30] },
  { name: "Gold",           rgb: [255, 215, 0] },
  { name: "Tan",            rgb: [200, 170, 120] },
  { name: "Tan",            rgb: [210, 180, 140] },
  { name: "Beige",          rgb: [220, 210, 180] },
  { name: "Beige",          rgb: [245, 245, 220] },
  { name: "Cream",          rgb: [240, 235, 210] },
  { name: "Cream",          rgb: [255, 253, 208] },
  { name: "Maroon",         rgb: [110, 30, 30] },
  { name: "Maroon",         rgb: [128, 0, 0] },
  { name: "Burgundy",       rgb: [130, 20, 50] },
  { name: "Plum",           rgb: [140, 60, 120] },
  { name: "Plum",           rgb: [142, 69, 133] },
  { name: "Mauve",          rgb: [180, 120, 160] },
  { name: "Mauve",          rgb: [224, 176, 255] },
  { name: "Rose",           rgb: [220, 100, 130] },
  { name: "Rose",           rgb: [255, 0, 127] },
  { name: "Rust",           rgb: [180, 80, 30] },
  { name: "Rust",           rgb: [183, 65, 14] },
  { name: "Charcoal",       rgb: [60, 60, 60] },
  { name: "Silver",         rgb: [190, 190, 190] },
  { name: "Silver",         rgb: [192, 192, 192] },
  { name: "Dark Grey",      rgb: [80, 80, 80] },
  { name: "Light Grey",     rgb: [200, 200, 200] },
  { name: "Light Grey",     rgb: [211, 211, 211] },
  { name: "Turquoise",      rgb: [50, 190, 180] },
  { name: "Turquoise",      rgb: [64, 224, 208] },
  { name: "Aqua",           rgb: [80, 210, 210] },
  { name: "Aqua",           rgb: [0, 255, 255] },
  { name: "Mint",           rgb: [140, 220, 190] },
  { name: "Mint",           rgb: [152, 255, 152] },
  { name: "Forest Green",   rgb: [40, 110, 50] },
  { name: "Forest Green",   rgb: [34, 139, 34] },
  { name: "Sea Green",      rgb: [50, 150, 100] },
  { name: "Sea Green",      rgb: [46, 139, 87] },
  { name: "Dark Purple",    rgb: [70, 30, 100] },
  { name: "Dark Purple",    rgb: [48, 0, 48] },
  { name: "Lilac",          rgb: [190, 150, 220] },
  { name: "Lilac",          rgb: [200, 162, 200] },
  { name: "Orchid",         rgb: [200, 110, 190] },
  { name: "Orchid",         rgb: [218, 112, 214] },
  { name: "Hot Pink",       rgb: [230, 60, 150] },
  { name: "Hot Pink",       rgb: [255, 105, 180] },
  { name: "Brick Red",      rgb: [180, 50, 40] },
  { name: "Brick Red",      rgb: [203, 65, 84] },
  { name: "Mud",            rgb: [100, 80, 50] },
  { name: "Mud",            rgb: [115, 92, 43] },
  { name: "Dark Brown",     rgb: [80, 50, 20] },
  { name: "Dark Brown",     rgb: [101, 67, 33] },
  { name: "Khaki",          rgb: [190, 180, 120] },
  { name: "Khaki",          rgb: [195, 176, 145] },
  { name: "Steel Blue",     rgb: [70, 110, 160] },
  { name: "Steel Blue",     rgb: [70, 130, 180] },
  { name: "Slate",          rgb: [100, 110, 130] },
  { name: "Slate",          rgb: [112, 128, 144] },
  { name: "Midnight Blue",  rgb: [30, 25, 80] },
  { name: "Midnight Blue",  rgb: [25, 25, 112] },
  { name: "Almost Black",   rgb: [20, 20, 20] },
  { name: "Dark Orange",    rgb: [200, 80, 0] },
  { name: "Dark Orange",    rgb: [255, 140, 0] },
  { name: "Yellow-Green",   rgb: [154, 205, 50] },
  { name: "Yellow-Green",   rgb: [128, 192, 0] },
  { name: "Pale Yellow",    rgb: [255, 255, 150] },
  { name: "Pale Yellow",    rgb: [255, 240, 128] },
];

// ── Color Mixing ─────────────────────────────────────────────────────────────

function mixSubtractive(colorList) {
  if (colorList.length === 0) return null;
  if (colorList.length === 1) return colorList[0].rgb;

  // Average in RYB space, then convert to RGB
  let r = 0, y = 0, b = 0;
  for (const color of colorList) {
    r += color.ryb[0];
    y += color.ryb[1];
    b += color.ryb[2];
  }
  const n = colorList.length;
  r /= n;
  y /= n;
  b /= n;

  return rybToRgb(r, y, b);
}

function mixAdditive(colorList) {
  if (colorList.length === 0) return null;
  if (colorList.length === 1) return colorList[0].rgb;

  // Screen blend: 1 - product(1 - c/255) for each channel
  const result = [0, 0, 0];
  for (let ch = 0; ch < 3; ch++) {
    let product = 1;
    for (const color of colorList) {
      product *= 1 - color.rgb[ch] / 255;
    }
    result[ch] = Math.round((1 - product) * 255);
  }
  return result;
}

function findClosestColorName(rgb) {
  let bestName = "Unknown";
  let bestDist = Infinity;

  for (const named of NAMED_COLORS) {
    const dr = rgb[0] - named.rgb[0];
    const dg = rgb[1] - named.rgb[1];
    const db = rgb[2] - named.rgb[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestName = named.name;
    }
  }

  return bestName;
}

function rgbToHex(rgb) {
  return "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function textColorFor(rgb) {
  const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return lum > 150 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
}

// ── Button Colors ────────────────────────────────────────────────────────────

const BUTTON_BORDER_COLORS = {
  Red: "#B01E1E",
  Orange: "#C06E0A",
  Yellow: "#C8A800",
  Green: "#1E8830",
  Blue: "#1648A0",
  Indigo: "#2A1C70",
  Violet: "#6E2890",
  Pink: "#C06888",
  Brown: "#6E4014",
  Magenta: "#B01480",
  Cyan: "#0E96B0",
  White: "#CCCCCC",
  Grey: "#707070",
  Black: "#000000",
};

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
  const swatchText = mixedRgb ? textColorFor(mixedRgb) : "rgba(255,255,255,0.25)";

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
          border: none; cursor: pointer;
          border-radius: 18px; font-size: 15px; font-weight: 600;
          font-family: var(--font-heading); color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.1s ease;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          padding: 14px 8px;
        }
        .color-btn:active { transform: scale(0.88) !important; }
      `}</style>

      {/* Header */}
      <div className="page-header" style={styles.header}>
        <a href="../" className="back-btn" aria-label="Back to home">⬅️</a>
        <button
          className="gear-btn"
          aria-label="Settings"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>
        <h1 className="gradient-text">Color Mixer</h1>
        <p className="subtitle">Tap colors to mix them together!</p>
      </div>

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
            className="color-btn"
            style={{
              background: color.hex,
              boxShadow: `0 4px 12px ${color.hex}44, inset 0 2px 0 rgba(255,255,255,0.2)`,
              borderBottom: `3px solid ${BUTTON_BORDER_COLORS[color.name]}`,
              color: textColorFor(color.rgb),
              textShadow: textColorFor(color.rgb) === "rgba(0,0,0,0.7)"
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
        title="Color Mixer Settings"
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
  header: {
    marginBottom: 16,
    width: "100%", maxWidth: 400,
  },
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
