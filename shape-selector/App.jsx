import { useState } from "react";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import { NB_SOLID, NB7_STOPS } from "../shared/numberblockColors.js";

// ── Shape Definitions ────────────────────────────────────────────────────────

const SHAPES = [
  { name: "Circle",        sides: 0,  color: NB_SOLID["1"], render: "circle" },
  { name: "Oval",          sides: 0,  color: NB_SOLID["2"], render: "oval" },
  { name: "Triangle",      sides: 3,  color: NB_SOLID["3"], render: "polygon" },
  { name: "Square",        sides: 4,  color: NB_SOLID["4"], render: "square" },
  { name: "Diamond",       sides: 4,  color: NB_SOLID["4"], render: "diamond" },
  { name: "Trapezoid",     sides: 4,  color: NB_SOLID["4"], render: "trapezoid" },
  { name: "Parallelogram", sides: 4,  color: NB_SOLID["4"], render: "parallelogram" },
  { name: "Pentagon",      sides: 5,  color: NB_SOLID["5"], render: "polygon" },
  { name: "Hexagon",       sides: 6,  color: NB_SOLID["6"], render: "polygon" },
  { name: "Heptagon",      sides: 7,  color: "rainbow",     render: "polygon" },
  { name: "Octagon",       sides: 8,  color: NB_SOLID["8"], render: "polygon" },
  { name: "Nonagon",       sides: 9,  color: NB_SOLID["9"], render: "polygon" },
  { name: "Decagon",       sides: 10, color: NB_SOLID["1"], render: "polygon" },
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

function ShapeSVG({ shape, size }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const strokeW = size * 0.04;
  const isRainbow = shape.color === "rainbow";
  const gradId = `rainbow-${size}`;
  const fill = isRainbow ? `url(#${gradId})` : shape.color;
  const stroke = "rgba(255,255,255,0.3)";

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
          style={{ transform: `rotate(0deg)`, transformOrigin: `${cx}px ${cy}px` }}
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
        const w = r * 1.0;
        const h = r * 0.7;
        const skew = r * 0.35;
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

      {shape.render === "polygon" && (
        <polygon
          points={polygonPoints(shape.sides, cx, cy, r)}
          fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// ── Side Description ─────────────────────────────────────────────────────────

function sideDescription(shape) {
  if (shape.render === "circle") return "No straight sides — perfectly round!";
  if (shape.render === "oval") return "No straight sides — an oval with pointed ends!";
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
            <ShapeSVG shape={shape} size={80} />
          </div>
        ))}
      </div>

      {/* Reveal overlay */}
      {selected && (
        <div className="overlay-backdrop" onClick={() => setSelected(null)}>
          <div className="overlay-shape">
            <ShapeSVG shape={selected} size={220} />
          </div>
          {selected.sides > 0 && (
            <div
              className="overlay-number"
              style={{ color: selected.color === "rainbow" ? NB_SOLID["7"] : selected.color }}
            >
              {selected.sides}
            </div>
          )}
          <div
            className="overlay-name"
            style={{ color: selected.color === "rainbow" ? NB_SOLID["7"] : selected.color }}
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
