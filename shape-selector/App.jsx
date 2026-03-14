import { useState } from "react";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";

// ── Shape Definitions ────────────────────────────────────────────────────────

const SHAPES = [
  { name: "Circle",    sides: 0,  color: "#DC2828" },
  { name: "Triangle",  sides: 3,  color: "#F08C14" },
  { name: "Square",    sides: 4,  color: "#FADC14" },
  { name: "Pentagon",  sides: 5,  color: "#28AA3C" },
  { name: "Hexagon",   sides: 6,  color: "#1E64D2" },
  { name: "Heptagon",  sides: 7,  color: "#8C32B4" },
  { name: "Octagon",   sides: 8,  color: "#F082AA" },
  { name: "Nonagon",   sides: 9,  color: "#14BEDC" },
  { name: "Decagon",   sides: 10, color: "#C06E0A" },
];

// ── SVG Helpers ──────────────────────────────────────────────────────────────

function polygonPoints(sides, cx, cy, r) {
  const pts = [];
  const offset = -Math.PI / 2; // start at top
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

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {shape.sides === 0 ? (
        <circle
          cx={cx} cy={cy} r={r}
          fill={shape.color}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={strokeW}
        />
      ) : (
        <polygon
          points={polygonPoints(shape.sides, cx, cy, r)}
          fill={shape.color}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ShapeSelector() {
  const [selected, setSelected] = useState(null);

  const handleSelect = (shape) => {
    setSelected(shape);
  };

  const handleClose = () => {
    setSelected(null);
  };

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
        @keyframes gridItemPop {
          0% { transform: scale(1); }
          50% { transform: scale(0.88); }
          100% { transform: scale(1); }
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
          gap: 24px;
          padding: 20px;
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
            onClick={() => handleSelect(shape)}
          >
            <ShapeSVG shape={shape} size={80} />
          </div>
        ))}
      </div>

      {/* Reveal overlay */}
      {selected && (
        <div className="overlay-backdrop" onClick={handleClose}>
          <div className="overlay-shape">
            <ShapeSVG shape={selected} size={220} />
          </div>
          <div className="overlay-name" style={{ color: selected.color }}>
            {selected.name}
          </div>
          <div className="overlay-detail">
            {selected.sides === 0
              ? "No straight sides — perfectly round!"
              : `${selected.sides} side${selected.sides === 1 ? "" : "s"}`}
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
