import { useState } from "react";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import { NB_SOLID, NB7_STOPS } from "../shared/numberblockColors.js";

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
  return luminance(color) > 0.35 ? "#222" : "#fff";
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
  { name: "Decagon",              sides: 10, color: "#FFFFFF",      render: "polygon" },
  { name: "Hendecagon",           sides: 11, color: NB_SOLID["1"], render: "polygon" },
  { name: "Dodecagon",            sides: 12, color: NB_SOLID["2"], render: "polygon" },
  { name: "Tridecagon",           sides: 13, color: NB_SOLID["3"], render: "polygon" },
  { name: "Tetradecagon",         sides: 14, color: NB_SOLID["4"], render: "polygon" },
  { name: "Pentadecagon",         sides: 15, color: NB_SOLID["5"], render: "polygon" },
  { name: "Hexadecagon",          sides: 16, color: NB_SOLID["6"], render: "polygon" },
  { name: "Heptadecagon",         sides: 17, color: "rainbow",     render: "polygon" },
  { name: "Octadecagon",          sides: 18, color: NB_SOLID["8"], render: "polygon" },
  { name: "Enneadecagon",         sides: 19, color: NB_SOLID["9"], render: "polygon" },
  { name: "Icosagon",             sides: 20, color: "#FFFFFF",      render: "polygon" },
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
  const stroke = isWhite ? "rgba(228,30,32,0.5)" : "rgba(255,255,255,0.3)";
  const num = shape.displayNum ?? shape.sides;
  const textColor = contrastTextColor(shape.color);
  const fontSize = size * 0.32;

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
          fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
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
  if (shape.render === "circle") return "No straight sides — perfectly round!";
  if (shape.render === "oval") return "No straight sides — a stretched circle!";
  if (shape.render === "football") return "2 curved sides that meet at points!";
  return `${shape.sides} side${shape.sides === 1 ? "" : "s"}`;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ShapeSelector() {
  const [selected, setSelected] = useState(null);

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
        }
        .overlay-shape {
          animation: shapeReveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          filter: drop-shadow(0 8px 30px rgba(0,0,0,0.4));
        }
        .overlay-number {
          font-family: var(--font-heading);
          font-size: 96px;
          font-weight: 800;
          line-height: 1;
          animation: numberPop 0.4s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .overlay-name {
          font-family: var(--font-heading);
          font-size: 40px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          animation: nameSlide 0.4s 0.15s ease-out both;
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
      <div className="page-header" style={styles.header}>
        <a href="../" className="back-btn" aria-label="Back to home">⬅️</a>
        <h1 className="gradient-text">Shape Selector</h1>
        <p className="subtitle">Tap a shape to see it up close!</p>
      </div>

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
      </div>

      {/* Reveal overlay */}
      {selected && (
        <div className="overlay-backdrop" onClick={() => setSelected(null)}>
          <div className="overlay-shape">
            <ShapeSVG shape={selected} size={220} showNumber />
          </div>
          {(selected.displayNum ?? selected.sides) > 0 && (
            <div
              className="overlay-number"
              style={{ color: selected.color === "rainbow" ? NB_SOLID["7"] : selected.color === "#FFFFFF" ? "#E41E20" : selected.color }}
            >
              {selected.displayNum ?? selected.sides}
            </div>
          )}
          <div
            className="overlay-name"
            style={{ color: selected.color === "rainbow" ? NB_SOLID["7"] : selected.color === "#FFFFFF" ? "#E41E20" : selected.color }}
          >
            {selected.name}
          </div>
          <div className="overlay-detail">
            {sideDescription(selected)}
          </div>
          <div className="overlay-hint">Tap anywhere to close</div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  header: {
    marginBottom: 8,
    width: "100%",
    maxWidth: 400,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    width: "100%",
    maxWidth: 400,
    position: "relative",
    zIndex: 1,
  },
};
