import { useState } from "react";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { SettingsOverlay, SettingsToggle } from "../shared/SettingsOverlay.jsx";
import { NB_SOLID, NB7_STOPS, NB7_GRADIENT, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { useScrollLock } from "../shared/useScrollLock.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastTextColor(color) {
  if (color === "rainbow") return "#fff";
  if (color === "#FFFFFF") return "#333";
  if (color === NB_SOLID["3"]) return "#fff"; // White text on yellow shapes
  return luminance(color) > 0.5 ? "#222" : "#fff";
}

// ── Polygon Naming (21–9999) ────────────────────────────────────────────────

const ONES_SUFFIX = {
  1: "hena", 2: "di", 3: "tri", 4: "tetra",
  5: "penta", 6: "hexa", 7: "hepta", 8: "octa", 9: "ennea",
};
const TENS_PREFIX = {
  10: "deca", 20: "icosi", 30: "triaconta", 40: "tetraconta",
  50: "pentaconta", 60: "hexaconta", 70: "heptaconta",
  80: "octaconta", 90: "enneaconta",
};
const HUNDREDS_PREFIX = {
  100: "hecta", 200: "dihecta", 300: "trihecta", 400: "tetrahecta",
  500: "pentahecta", 600: "hexahecta", 700: "heptahecta",
  800: "octahecta", 900: "enneahecta",
};
const THOUSANDS_PREFIX = {
  1000: "chilia", 2000: "dischilia", 3000: "trischilia", 4000: "tetrakischilia",
  5000: "pentakischilia", 6000: "hexakischilia", 7000: "heptakischilia",
  8000: "octakischilia", 9000: "enneakischilia",
};

function polygonNameForSides(sides) {
  if (sides === 10000) return "Myriagon";
  if (sides === 1000) return "Chiliagon";
  if (sides === 100) return "Hectogon";
  const th = Math.floor(sides / 1000) * 1000;
  const h = Math.floor((sides % 1000) / 100) * 100;
  const t = Math.floor((sides % 100) / 10) * 10;
  const o = sides % 10;

  let name = "";
  if (th > 0) name += THOUSANDS_PREFIX[th];
  if (h > 0) name += HUNDREDS_PREFIX[h];
  if (t > 0) name += TENS_PREFIX[t];
  // "kai" connects ones to the rest (e.g., icosikaipentagon, hectakaihenagon)
  if (o > 0) name += (name.length > 0 ? "kai" : "") + ONES_SUFFIX[o];
  name += "gon";

  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ── Polygon Name Segments (for coloring / hyphenation) ──────────────────────

function polygonNameSegments(sides) {
  if (sides === 10000) return [{ text: "Myria", digit: null }, { text: "gon", digit: null }];
  if (sides === 1000) return [{ text: "Chilia", digit: null }, { text: "gon", digit: null }];
  if (sides === 100) return [{ text: "Hecto", digit: null }, { text: "gon", digit: null }];
  const th = Math.floor(sides / 1000) * 1000;
  const h = Math.floor((sides % 1000) / 100) * 100;
  const t = Math.floor((sides % 100) / 10) * 10;
  const o = sides % 10;

  const segments = [];
  if (th > 0) segments.push({ text: THOUSANDS_PREFIX[th], digit: Math.floor(sides / 1000) });
  if (h > 0) segments.push({ text: HUNDREDS_PREFIX[h], digit: Math.floor((sides % 1000) / 100) });
  if (t > 0) segments.push({ text: TENS_PREFIX[t], digit: Math.floor((sides % 100) / 10) });
  if (o > 0) {
    if (segments.length > 0) segments.push({ text: "kai", digit: null });
    segments.push({ text: ONES_SUFFIX[o], digit: o });
  }
  segments.push({ text: "gon", digit: null });

  // Capitalize first segment
  segments[0] = { ...segments[0], text: segments[0].text.charAt(0).toUpperCase() + segments[0].text.slice(1) };
  return segments;
}

function segmentColor(digit, fallbackColor) {
  if (digit === null) return null;
  if (digit === 7) return NB7_GRADIENT;
  return NB_SOLID[String(digit)] || fallbackColor;
}

// ── Number to Word ──────────────────────────────────────────────────────────

function numberToWord(n) {
  const ONES = [
    "", "one", "two", "three", "four", "five",
    "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n === 0) return "zero";
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return rem === 0 ? `${ONES[h]} hundred` : `${ONES[h]} hundred ${numberToWord(rem)}`;
  }
  const th = Math.floor(n / 1000);
  const rem = n % 1000;
  const thWord = th < 20 ? ONES[th] : numberToWord(th);
  return rem === 0 ? `${thWord} thousand` : `${thWord} thousand ${numberToWord(rem)}`;
}

// ── Shape Definitions ────────────────────────────────────────────────────────

const SHAPES = [
  { name: "Circle",               sides: 0,  displayNum: 1, color: NB_SOLID["1"], render: "circle" },
  { name: "Oval",                 sides: 0,  displayNum: 1, color: NB_SOLID["1"], render: "oval" },
  { name: "Football",             sides: 2,  displayNum: 2, color: NB_SOLID["2"], render: "football" },
  { name: "Equilateral Triangle", sides: 3,  color: NB_SOLID["3"], render: "polygon" },
  { name: "Right Triangle",       sides: 3,  color: NB_SOLID["3"], render: "rightTriangle" },
  { name: "Obtuse Triangle",      sides: 3,  color: NB_SOLID["3"], render: "obtuseTriangle" },
  { name: "Isosceles Triangle",   sides: 3,  color: NB_SOLID["3"], render: "isoscelesTriangle" },
  { name: "Square",               sides: 4,  color: NB_SOLID["4"], render: "square" },
  { name: "Diamond",              sides: 4,  color: NB_SOLID["4"], render: "diamond" },
  { name: "Trapezoid",            sides: 4,  color: NB_SOLID["4"], render: "trapezoid" },
  { name: "Parallelogram",        sides: 4,  color: NB_SOLID["4"], render: "parallelogram" },
  { name: "Pentagon",             sides: 5,  color: NB_SOLID["5"], render: "polygon" },
  { name: "Hexagon",              sides: 6,  color: NB_SOLID["6"], render: "polygon" },
  { name: "Heptagon",             sides: 7,  color: "rainbow",     render: "polygon" },
  { name: "Octagon",              sides: 8,  color: NB_SOLID["8"], render: "polygon" },
  { name: "Nonagon",              sides: 9,  color: NB_SOLID["9"], render: "polygon" },
  ...(() => {
    const teens = [
      { name: "Decagon",       sides: 10 },
      { name: "Hendecagon",    sides: 11 },
      { name: "Dodecagon",     sides: 12 },
      { name: "Tridecagon",    sides: 13 },
      { name: "Tetradecagon",  sides: 14 },
      { name: "Pentadecagon",  sides: 15 },
      { name: "Hexadecagon",   sides: 16 },
      { name: "Heptadecagon",  sides: 17 },
      { name: "Octadecagon",   sides: 18 },
      { name: "Enneadecagon",  sides: 19 },
      { name: "Icosagon",      sides: 20 },
    ];
    return teens.map((s) => {
      const style = getNumberBlockStyle(s.sides);
      const ones = s.sides % 10;
      return {
        ...s,
        color: ones === 7 ? "rainbow" : style.background,
        borderColor: style.border,
        render: "polygon",
      };
    });
  })(),
  // 21–100: generated from polygon naming
  ...(() => {
    const shapes = [];
    for (let sides = 21; sides <= 100; sides++) {
      const style = getNumberBlockStyle(sides);
      const ones = sides % 10;
      shapes.push({
        name: polygonNameForSides(sides),
        sides,
        color: ones === 7 ? "rainbow" : style.background,
        borderColor: style.border,
        render: "polygon",
      });
    }
    return shapes;
  })(),
];

// ── SVG Helpers ──────────────────────────────────────────────────────────────

function polygonPoints(sides, cx, cy, r, rotationOffset = 0) {
  const pts = [];
  const offset = -Math.PI / 2 + rotationOffset;
  for (let i = 0; i < sides; i++) {
    const angle = offset + (2 * Math.PI * i) / sides;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

function ShapeSVG({ shape, size, showNumber = false }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const strokeW = size * 0.04;
  const isRainbow = shape.color === "rainbow";
  const gradId = `rainbow-${size}-${shape.name.replace(/\s/g, "")}`;
  const isWhite = shape.color === "#FFFFFF";
  const fill = isRainbow ? `url(#${gradId})` : shape.color;
  const stroke = shape.borderColor || (isWhite ? "rgba(228,30,32,0.5)" : "rgba(255,255,255,0.3)");
  const strokeOpacity = shape.borderColor ? 0.7 : undefined;
  const num = shape.displayNum ?? shape.sides;
  const textColor = contrastTextColor(shape.color);
  const numLen = String(num).length;
  const fontSize = numLen <= 3 ? size * 0.32 : size * 0.7 / numLen;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {isRainbow && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {NB7_STOPS.map((c, i) => (
              <stop key={i} offset={`${(i / (NB7_STOPS.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
      )}

      {shape.render === "circle" && (
        <circle
          cx={cx} cy={cy} r={r}
          fill={fill} stroke={stroke} strokeWidth={strokeW}
        />
      )}

      {shape.render === "oval" && (
        <ellipse
          cx={cx} cy={cy} rx={r * 0.55} ry={r}
          fill={fill} stroke={stroke} strokeWidth={strokeW}
        />
      )}

      {shape.render === "football" && (
        <path
          d={`M ${cx - r} ${cy} Q ${cx} ${cy - r * 1.4} ${cx + r} ${cy} Q ${cx} ${cy + r * 1.4} ${cx - r} ${cy} Z`}
          fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
        />
      )}

      {shape.render === "square" && (
        <polygon
          points={polygonPoints(4, cx, cy, r, Math.PI / 4)}
          fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
        />
      )}

      {shape.render === "diamond" && (
        <polygon
          points={polygonPoints(4, cx, cy, r)}
          fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
        />
      )}

      {shape.render === "trapezoid" && (() => {
        const topW = r * 0.6;
        const botW = r * 1.1;
        const h = r * 0.85;
        const pts = [
          `${cx - topW},${cy - h}`,
          `${cx + topW},${cy - h}`,
          `${cx + botW},${cy + h}`,
          `${cx - botW},${cy + h}`,
        ].join(" ");
        return (
          <polygon
            points={pts}
            fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
          />
        );
      })()}

      {shape.render === "parallelogram" && (() => {
        const w = r * 0.85;
        const h = r * 0.65;
        const skew = r * 0.25;
        const pts = [
          `${cx - w + skew},${cy - h}`,
          `${cx + w + skew},${cy - h}`,
          `${cx + w - skew},${cy + h}`,
          `${cx - w - skew},${cy + h}`,
        ].join(" ");
        return (
          <polygon
            points={pts}
            fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
          />
        );
      })()}

      {shape.render === "rightTriangle" && (() => {
        const verts = [
          [cx - r, cy + r * 0.85],
          [cx + r, cy + r * 0.85],
          [cx - r, cy - r * 0.85],
        ];
        return (
          <polygon
            points={verts.map((v) => v.join(",")).join(" ")}
            fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
          />
        );
      })()}

      {shape.render === "obtuseTriangle" && (() => {
        const verts = [
          [cx - r * 1.1, cy + r * 0.75],
          [cx + r * 1.1, cy + r * 0.75],
          [cx + r * 0.3, cy - r * 0.85],
        ];
        return (
          <polygon
            points={verts.map((v) => v.join(",")).join(" ")}
            fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
          />
        );
      })()}

      {shape.render === "isoscelesTriangle" && (() => {
        const verts = [
          [cx - r * 0.7, cy + r * 0.85],
          [cx + r * 0.7, cy + r * 0.85],
          [cx, cy - r * 0.95],
        ];
        return (
          <polygon
            points={verts.map((v) => v.join(",")).join(" ")}
            fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
          />
        );
      })()}

      {shape.render === "polygon" && (
        <polygon
          points={polygonPoints(shape.sides, cx, cy, r)}
          fill={fill} stroke={stroke} strokeWidth={shape.borderColor ? strokeW * 1.5 : strokeW} strokeOpacity={strokeOpacity} strokeLinejoin="round"
        />
      )}

      {showNumber && num > 0 && (() => {
        let tx = cx, ty = cy;
        if (shape.render === "rightTriangle") {
          tx = cx - r / 3;
          ty = cy + r * 0.85 / 3;
        } else if (shape.render === "obtuseTriangle") {
          tx = cx + r * 0.1;
          ty = cy + r * 0.217;
        } else if (shape.render === "isoscelesTriangle") {
          ty = cy + r * 0.25;
        }
        return (
          <text
            x={tx} y={ty}
            textAnchor="middle" dominantBaseline="central"
            fill={textColor}
            fontFamily="var(--font-heading)"
            fontWeight="800"
            fontSize={fontSize}
            style={{ pointerEvents: "none" }}
          >
            {num}
          </text>
        );
      })()}
    </svg>
  );
}

// ── Side Description ─────────────────────────────────────────────────────────

function sideDescription(shape) {
  if (shape.render === "circle" && shape.sides === 0) return "No straight sides — perfectly round!";
  if (shape.render === "oval") return "No straight sides — a stretched circle!";
  if (shape.render === "football") return "Two curved sides that meet at points!";
  if (shape.sides > 9999) {
    return `${shape.sides.toLocaleString()} sides — that's a lot of sides!`;
  }
  const word = numberToWord(shape.sides);
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
  return `${capitalized} side${shape.sides === 1 ? "" : "s"}`;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ShapeSelector() {
  const [selected, setSelected] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [useHyphens, setUseHyphens] = useState(true);
  const [colorNames, setColorNames] = useState(true);
  useScrollLock(!!selected || showCustomInput || showSettings);

  function handleCustomConfirm() {
    const sides = parseInt(customValue, 10);
    if (!sides || sides < 3) return;
    const style = getNumberBlockStyle(sides);
    const ones = sides % 10;
    const name = sides <= 9999 ? polygonNameForSides(sides) : `${sides}-gon`;
    const shape = {
      name,
      sides,
      displayNum: sides,
      color: ones === 7 ? "rainbow" : style.background,
      borderColor: style.border,
      render: "circle",
    };
    setShowCustomInput(false);
    setCustomValue("");
    setSelected(shape);
  }

  return (
    <div className="toy-container" style={{ gap: 16 }}>
      <style>{`
        @keyframes shapeReveal {
          0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.08) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes nameSlide {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes numberPop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .shape-grid-item {
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          padding: 16px;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .shape-grid-item:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.12);
        }
        .shape-grid-item:active {
          transform: scale(0.92) !important;
        }
        .overlay-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 100;
          cursor: pointer;
          animation: fadeIn 0.2s ease-out;
          gap: 16px;
          padding: 20px;
          touch-action: none;
          overscroll-behavior: none;
        }
        .overlay-shape {
          animation: shapeReveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          filter: drop-shadow(0 8px 30px rgba(0,0,0,0.4));
        }
        .overlay-name {
          font-family: var(--font-heading);
          font-size: 40px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          animation: nameSlide 0.4s 0.15s ease-out both;
          max-width: 100%;
          padding: 0 8px;
          overflow-wrap: break-word;
          box-sizing: border-box;
        }
        .overlay-detail {
          font-family: var(--font-body);
          font-size: 18px;
          color: rgba(255,255,255,0.6);
          text-align: center;
          animation: nameSlide 0.4s 0.25s ease-out both;
        }
        .overlay-hint {
          font-family: var(--font-body);
          font-size: 14px;
          color: rgba(255,255,255,0.3);
          animation: nameSlide 0.4s 0.35s ease-out both;
        }
      `}</style>

      <BackgroundDots />

      {/* Header */}
      <StickyHeader
        title="Shape Selector"
        subtitle="Tap a shape to see it up close!"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Shape grid */}
      <div style={styles.grid}>
        {SHAPES.map((shape) => (
          <div
            key={shape.name}
            className="shape-grid-item"
            onClick={() => setSelected(shape)}
          >
            <ShapeSVG shape={shape} size={80} showNumber />
          </div>
        ))}
        <div
          className="shape-grid-item"
          onClick={() => setShowCustomInput(true)}
          style={{ flexDirection: "column", gap: 4 }}
        >
          <span style={{ fontSize: 36, lineHeight: 1 }}>✏️</span>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Custom</span>
        </div>
      </div>

      {/* Custom sides input overlay */}
      {showCustomInput && (
        <div className="overlay-backdrop" onClick={() => { setShowCustomInput(false); setCustomValue(""); }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={styles.customPanel}
          >
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
              Custom Polygon
            </div>
            <label style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 8, display: "block" }}>
              How many sides?
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={customValue}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setCustomValue(v); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCustomConfirm(); }}
              placeholder="e.g. 250"
              style={styles.customInput}
            />
            <button
              onClick={handleCustomConfirm}
              disabled={!customValue || parseInt(customValue, 10) < 3}
              style={{
                ...styles.customOkBtn,
                opacity: (!customValue || parseInt(customValue, 10) < 3) ? 0.4 : 1,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Settings overlay */}
      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)}>
        <SettingsToggle
          checked={useHyphens}
          onChange={() => setUseHyphens((v) => !v)}
          label="Hyphenate shape names"
          hint="Add hyphens between name parts (e.g. Heptaconta-kai-hepta-gon)"
        />
        <div style={{ height: 16 }} />
        <SettingsToggle
          checked={colorNames}
          onChange={() => setColorNames((v) => !v)}
          label="Color name parts"
          hint="Color each part of the name by the digit it represents"
        />
      </SettingsOverlay>

      {/* Reveal overlay */}
      {selected && (() => {
        const fallbackColor = selected.color === "rainbow" ? NB_SOLID["7"] : selected.borderColor || (selected.color === "#FFFFFF" ? "#E41E20" : selected.color);
        const segments = selected.sides >= 21 && selected.sides <= 9999
          ? polygonNameSegments(selected.sides)
          : null;
        const nameLen = selected.name.length;
        const fontSize = nameLen > 16 ? Math.max(18, 40 - (nameLen - 16) * 0.8) : 40;

        return (
          <div className="overlay-backdrop" onClick={() => setSelected(null)}>
            <div className="overlay-shape">
              <ShapeSVG shape={selected} size={220} showNumber />
            </div>
            <div
              className="overlay-name"
              style={{
                color: fallbackColor,
                fontSize: `${fontSize}px`,
              }}
            >
              {segments ? (
                segments.map((seg, i) => {
                  const color = colorNames ? segmentColor(seg.digit, fallbackColor) : null;
                  const isGradient = color && color.startsWith("linear-gradient");
                  const showHyphen = useHyphens && i < segments.length - 1;
                  const colorStyle = color
                    ? isGradient
                      ? { background: color, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                      : { color }
                    : {};
                  return (
                    <span key={i} style={{ display: "inline-block" }}>
                      <span style={colorStyle}>{seg.text}</span>
                      {showHyphen && <span style={colorStyle}>-</span>}
                    </span>
                  );
                })
              ) : (
                selected.name
              )}
            </div>
            <div className="overlay-detail">
              {sideDescription(selected)}
            </div>
            <div className="overlay-hint">Tap anywhere to close</div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    width: "100%",
    maxWidth: 400,
    position: "relative",
    zIndex: 1,
  },
  customPanel: {
    background: "rgba(40,40,60,0.95)",
    borderRadius: 24,
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 260,
    animation: "shapeReveal 0.3s ease-out forwards",
  },
  customInput: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 22,
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    borderRadius: 14,
    border: "2px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    textAlign: "center",
    outline: "none",
    marginBottom: 12,
  },
  customOkBtn: {
    padding: "10px 40px",
    fontSize: 18,
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    color: "#fff",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
};
