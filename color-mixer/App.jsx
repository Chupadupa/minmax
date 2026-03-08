import { useState, useMemo } from "react";

// ── Color Palette ────────────────────────────────────────────────────────────

const PALETTE = [
  { name: "Red",     rgb: [220, 40, 40],   hex: "#DC2828" },
  { name: "Orange",  rgb: [240, 140, 20],  hex: "#F08C14" },
  { name: "Yellow",  rgb: [250, 220, 20],  hex: "#FADC14" },
  { name: "Green",   rgb: [40, 170, 60],   hex: "#28AA3C" },
  { name: "Blue",    rgb: [30, 100, 210],  hex: "#1E64D2" },
  { name: "Indigo",  rgb: [60, 40, 140],   hex: "#3C288C" },
  { name: "Violet",  rgb: [140, 50, 180],  hex: "#8C32B4" },
  { name: "Pink",    rgb: [240, 130, 170], hex: "#F082AA" },
  { name: "Brown",   rgb: [140, 80, 30],   hex: "#8C501E" },
  { name: "Magenta", rgb: [220, 30, 160],  hex: "#DC1EA0" },
  { name: "Cyan",    rgb: [20, 190, 220],  hex: "#14BEDC" },
  { name: "White",   rgb: [245, 245, 245], hex: "#F5F5F5" },
  { name: "Grey",    rgb: [140, 140, 140], hex: "#8C8C8C" },
  { name: "Black",   rgb: [30, 30, 30],    hex: "#1E1E1E" },
];

// ── Named Colors for Matching ────────────────────────────────────────────────

const NAMED_COLORS = [
  { name: "Red",            rgb: [220, 40, 40] },
  { name: "Orange",         rgb: [240, 140, 20] },
  { name: "Yellow",         rgb: [250, 220, 20] },
  { name: "Green",          rgb: [40, 170, 60] },
  { name: "Blue",           rgb: [30, 100, 210] },
  { name: "Indigo",         rgb: [60, 40, 140] },
  { name: "Violet",         rgb: [140, 50, 180] },
  { name: "Pink",           rgb: [240, 130, 170] },
  { name: "Brown",          rgb: [140, 80, 30] },
  { name: "Magenta",        rgb: [220, 30, 160] },
  { name: "Cyan",           rgb: [20, 190, 220] },
  { name: "White",          rgb: [245, 245, 245] },
  { name: "Grey",           rgb: [140, 140, 140] },
  { name: "Black",          rgb: [30, 30, 30] },
  // Common mixes
  { name: "Dark Red",       rgb: [150, 30, 30] },
  { name: "Dark Green",     rgb: [20, 100, 30] },
  { name: "Dark Blue",      rgb: [20, 50, 130] },
  { name: "Navy",           rgb: [20, 30, 100] },
  { name: "Teal",           rgb: [30, 140, 140] },
  { name: "Olive",          rgb: [120, 140, 30] },
  { name: "Lime",           rgb: [140, 200, 40] },
  { name: "Sky Blue",       rgb: [100, 170, 220] },
  { name: "Light Blue",     rgb: [140, 190, 230] },
  { name: "Light Green",    rgb: [130, 210, 130] },
  { name: "Light Pink",     rgb: [240, 180, 200] },
  { name: "Lavender",       rgb: [180, 150, 210] },
  { name: "Coral",          rgb: [230, 120, 100] },
  { name: "Salmon",         rgb: [230, 140, 120] },
  { name: "Peach",          rgb: [240, 180, 130] },
  { name: "Gold",           rgb: [230, 180, 30] },
  { name: "Tan",            rgb: [200, 170, 120] },
  { name: "Beige",          rgb: [220, 210, 180] },
  { name: "Cream",          rgb: [240, 235, 210] },
  { name: "Maroon",         rgb: [110, 30, 30] },
  { name: "Burgundy",       rgb: [130, 20, 50] },
  { name: "Plum",           rgb: [140, 60, 120] },
  { name: "Mauve",          rgb: [180, 120, 160] },
  { name: "Rose",           rgb: [220, 100, 130] },
  { name: "Rust",           rgb: [180, 80, 30] },
  { name: "Charcoal",       rgb: [60, 60, 60] },
  { name: "Silver",         rgb: [190, 190, 190] },
  { name: "Dark Grey",      rgb: [80, 80, 80] },
  { name: "Light Grey",     rgb: [200, 200, 200] },
  { name: "Turquoise",      rgb: [50, 190, 180] },
  { name: "Aqua",           rgb: [80, 210, 210] },
  { name: "Mint",           rgb: [140, 220, 190] },
  { name: "Forest Green",   rgb: [40, 110, 50] },
  { name: "Sea Green",      rgb: [50, 150, 100] },
  { name: "Purple",         rgb: [120, 40, 160] },
  { name: "Dark Purple",    rgb: [70, 30, 100] },
  { name: "Lilac",          rgb: [190, 150, 220] },
  { name: "Orchid",         rgb: [200, 110, 190] },
  { name: "Hot Pink",       rgb: [230, 60, 150] },
  { name: "Brick Red",      rgb: [180, 50, 40] },
  { name: "Mud",            rgb: [100, 80, 50] },
  { name: "Dark Brown",     rgb: [80, 50, 20] },
  { name: "Khaki",          rgb: [190, 180, 120] },
  { name: "Steel Blue",     rgb: [70, 110, 160] },
  { name: "Slate",          rgb: [100, 110, 130] },
  { name: "Midnight Blue",  rgb: [30, 25, 80] },
  { name: "Almost Black",   rgb: [20, 20, 20] },
];

// ── Color Mixing (Subtractive) ───────────────────────────────────────────────

function mixColors(colorList) {
  if (colorList.length === 0) return null;
  if (colorList.length === 1) return colorList[0].rgb;

  // Subtractive mixing: convert to CMY-like, average, convert back
  // This gives more paint-like results (red + blue = purple, not grey)
  let c = 0, m = 0, y = 0;
  for (const color of colorList) {
    c += (255 - color.rgb[0]) / 255;
    m += (255 - color.rgb[1]) / 255;
    y += (255 - color.rgb[2]) / 255;
  }
  const n = colorList.length;
  c /= n;
  m /= n;
  y /= n;

  return [
    Math.round((1 - c) * 255),
    Math.round((1 - m) * 255),
    Math.round((1 - y) * 255),
  ];
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
  return "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("");
}

function textColorFor(rgb) {
  // Luminance-based contrast
  const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return lum > 150 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
}

// ── Button Colors (for visual variety in layout) ─────────────────────────────

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

  const mixedRgb = useMemo(() => mixColors(added), [added]);
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

  // Summary of what's been mixed
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
      }} key={added.length}>
        {hasColors ? (
          <>
            <div style={{
              ...styles.colorName,
              color: swatchText,
            }}>
              {colorName}
            </div>
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
    width: "100%", maxWidth: 400, height: 180,
    borderRadius: 24,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 8, position: "relative", zIndex: 1,
    transition: "background 0.3s ease",
  },
  colorName: {
    fontSize: 36, fontWeight: 700,
    fontFamily: "var(--font-heading)",
    textAlign: "center", lineHeight: 1.2,
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
