import { useState, useMemo, useCallback } from "react";
import { NB_SOLID, NB7_STOPS, NB7_GRADIENT } from "../shared/numberblockColors.js";

// ── Colors (Numberblocks-inspired) ───────────────────────────────────────────

// Extend the shared solid palette with Numberblocks 10 (white)
const NB_COLORS = { ...NB_SOLID, "10": "#FFFFFF" };

// LCD of 1..10 = 2520
const LCD = 2520;
const UNITS = {
  1: 2520, 2: 1260, 3: 840, 4: 630, 5: 504,
  6: 420,  7: 360,  8: 315, 9: 280, 10: 252,
};

// ── SVG Helpers ──────────────────────────────────────────────────────────────

const CX = 150;
const CY = 150;
const R = 130;

function polarToXY(angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
}

function arcPath(startAngle, endAngle) {
  if (endAngle - startAngle >= 360) {
    // Full circle — use two arcs
    const [mx, my] = polarToXY(startAngle);
    const [hx, hy] = polarToXY(startAngle + 180);
    return `M ${CX} ${CY} L ${mx} ${my} A ${R} ${R} 0 1 1 ${hx} ${hy} A ${R} ${R} 0 1 1 ${mx} ${my} Z`;
  }
  const [x1, y1] = polarToXY(startAngle);
  const [x2, y2] = polarToXY(endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

// ── Simplify fraction ────────────────────────────────────────────────────────

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplify(num, den) {
  const g = gcd(num, den);
  return [num / g, den / g];
}

// ── Warning Toast ────────────────────────────────────────────────────────────

function WarningToast({ text, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "absolute",
      left: "50%", bottom: -48,
      transform: "translateX(-50%)",
      padding: "8px 18px", borderRadius: 14,
      background: "rgba(228, 30, 32, 0.92)",
      border: "1px solid rgba(255, 140, 26, 0.5)",
      boxShadow: "0 4px 20px rgba(228,30,32,0.4)",
      fontSize: 14, textAlign: "center", color: "#fff",
      fontFamily: "var(--font-heading)", fontWeight: 600,
      whiteSpace: "nowrap", zIndex: 5,
      animation: "warningPop 0.4s ease-out forwards",
    }}>
      {text}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function FractionCombiner() {
  // Each segment: { denom, units, id }
  const [segments, setSegments] = useState([]);
  const [warning, setWarning] = useState(null);
  const [warningKey, setWarningKey] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const filledUnits = useMemo(
    () => segments.reduce((sum, s) => sum + s.units, 0),
    [segments]
  );
  const remainingUnits = LCD - filledUnits;
  const isFull = remainingUnits === 0;

  // Check which pieces can still fit
  const canFit = useCallback(
    (denom) => UNITS[denom] <= remainingUnits,
    [remainingUnits]
  );

  // Find the simplest fraction for the remaining space
  const remainingFraction = useMemo(() => {
    if (remainingUnits <= 0) return null;
    const [n, d] = simplify(remainingUnits, LCD);
    return { num: n, den: d };
  }, [remainingUnits]);

  // Can any available piece fill the remaining space?
  const anyPieceFits = useMemo(
    () => Object.keys(UNITS).some((d) => UNITS[d] <= remainingUnits),
    [remainingUnits]
  );

  // Check if the remaining space exactly matches an available piece
  const exactMatchDenom = useMemo(() => {
    if (remainingUnits <= 0) return null;
    for (let d = 1; d <= 10; d++) {
      if (UNITS[d] === remainingUnits) return d;
    }
    return null;
  }, [remainingUnits]);

  const showNeeded = remainingUnits > 0 && !anyPieceFits;

  const handleAdd = (denom) => {
    if (isFull) return;
    const units = UNITS[denom];
    if (units > remainingUnits) {
      setWarning(`1/${denom} is too big!`);
      setWarningKey((k) => k + 1);
      setTimeout(() => setWarning(null), 1200);
      return;
    }
    const newSegments = [...segments, { denom, units, id: Date.now() + Math.random() }];
    setSegments(newSegments);

    // Check if circle is now full
    const newFilled = newSegments.reduce((sum, s) => sum + s.units, 0);
    if (newFilled === LCD) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);
    }
  };

  const handleUndo = () => {
    if (segments.length === 0) return;
    setSegments(segments.slice(0, -1));
    setCelebrate(false);
  };

  const handleClear = () => {
    setSegments([]);
    setCelebrate(false);
  };

  // Build pie slices
  const slices = useMemo(() => {
    const result = [];
    let angle = 0;
    for (const seg of segments) {
      const sweep = (seg.units / LCD) * 360;
      result.push({
        ...seg,
        startAngle: angle,
        endAngle: angle + sweep,
      });
      angle += sweep;
    }
    return result;
  }, [segments]);

  // Remaining arc (empty or "needed" highlight)
  const filledAngle = slices.length > 0 ? slices[slices.length - 1].endAngle : 0;

  return (
    <div className="toy-container">
      <style>{`
        @keyframes warningPop {
          0% { transform: translateX(-50%) scale(0.7); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.08); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes warningShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes celebratePop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes pulseCyan {
          0%, 100% { stroke-opacity: 0.4; }
          50% { stroke-opacity: 0.9; }
        }
        .frac-btn {
          border-radius: 16px; border: none;
          font-size: 17px; font-weight: 700;
          font-family: var(--font-heading); color: #fff;
          cursor: pointer; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          user-select: none; -webkit-user-select: none;
          transition: transform 0.1s ease, opacity 0.15s ease;
          text-shadow: 0 2px 4px rgba(0,0,0,0.25);
          padding: 10px 4px;
          gap: 2px;
        }
        .frac-btn:active:not([disabled]) { transform: scale(0.9); }
        .frac-btn[disabled] { cursor: default; opacity: 0.3; }
      `}</style>

      {/* Header */}
      <div className="page-header" style={styles.header}>
        <a href="../" className="back-btn" aria-label="Back to home">⬅️</a>
        <h1 className="gradient-text" style={{ fontSize: 26 }}>Fraction Combiner</h1>
        <p className="subtitle">Fill the circle with fraction pieces!</p>
      </div>

      {/* Pie Chart */}
      <div style={{
        ...styles.pieContainer,
        animation: celebrate ? "celebratePop 0.5s ease-out" : "none",
      }}>
        <svg viewBox="0 0 300 300" style={styles.svg}>
          <defs>
            {/* Rainbow gradient for Numberblocks 7 slices */}
            <linearGradient id="nb7Rainbow" x1="0%" y1="0%" x2="0%" y2="100%">
              {NB7_STOPS.map((color, i) => (
                <stop
                  key={i}
                  offset={`${(i / (NB7_STOPS.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />

          {/* "Needed" highlight — cyan, not an error */}
          {showNeeded && filledAngle < 360 && (
            <path
              d={arcPath(filledAngle, 360)}
              fill="rgba(72,219,251,0.18)"
              stroke="#48DBFB"
              strokeWidth="2"
              strokeDasharray="6 4"
              style={{ animation: "pulseCyan 1.5s ease-in-out infinite" }}
            />
          )}

          {/* Filled slices */}
          {slices.map((slice) => (
            <path
              key={slice.id}
              d={arcPath(slice.startAngle, slice.endAngle)}
              fill={slice.denom === 7 ? "url(#nb7Rainbow)" : NB_COLORS[slice.denom]}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1.5"
              style={{ animation: "popIn 0.3s ease-out" }}
            />
          ))}

          {/* Segment labels */}
          {slices.map((slice) => {
            const midAngle = (slice.startAngle + slice.endAngle) / 2;
            const labelR = R * 0.6;
            const rad = ((midAngle - 90) * Math.PI) / 180;
            const lx = CX + labelR * Math.cos(rad);
            const ly = CY + labelR * Math.sin(rad);
            const sweep = slice.endAngle - slice.startAngle;
            if (sweep < 15) return null; // Too small for label
            return (
              <text
                key={`label-${slice.id}`}
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fill={slice.denom === 10 ? "#E41E20" : "#fff"}
                fontFamily="var(--font-heading)"
                fontWeight="700"
                fontSize={sweep < 30 ? 14 : 18}
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)", pointerEvents: "none" }}
              >
                1/{slice.denom}
              </text>
            );
          })}

          {/* Celebrate sparkles */}
          {celebrate && (
            <>
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const sparkR = R + 20;
                const rad = ((angle - 90) * Math.PI) / 180;
                const sx = CX + sparkR * Math.cos(rad);
                const sy = CY + sparkR * Math.sin(rad);
                return (
                  <text
                    key={`sparkle-${i}`}
                    x={sx} y={sy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="20"
                    style={{ animation: `sparkle 0.8s ease-out ${i * 0.1}s` }}
                  >
                    ✨
                  </text>
                );
              })}
            </>
          )}
        </svg>

        {/* Warning toast */}
        <WarningToast key={warningKey} text={warning} visible={!!warning} />
      </div>

      {/* Fun fact banner — always reserves space to prevent layout shift */}
      <div style={styles.funFactRow}>
        <div style={{
          ...styles.funFactBadge,
          visibility: showNeeded && remainingFraction ? "visible" : "hidden",
        }}>
          <span>✨ </span>
          <span>Need </span>
          <span style={styles.funFactFraction}>
            {remainingFraction?.num}/{remainingFraction?.den}
          </span>
          <span> more to finish!</span>
        </div>
      </div>

      {/* Progress indicator */}
      <div style={styles.progressRow}>
        <div style={styles.progressBarOuter}>
          <div style={{
            ...styles.progressBarInner,
            width: `${(filledUnits / LCD) * 100}%`,
            background: isFull
              ? "linear-gradient(90deg, #4AAF4E, #48DBFB)"
              : "linear-gradient(90deg, #FF8C1A, #FFD030)",
          }} />
        </div>
        <span style={styles.progressText}>
          {isFull ? "Full!" : (() => {
            const [n, d] = simplify(filledUnits, LCD);
            return filledUnits === 0 ? "Empty" : `${n}/${d}`;
          })()}
        </span>
      </div>

      {/* Action buttons */}
      <div style={styles.actionRow}>
        <button className="frac-btn" disabled={segments.length === 0} style={{
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: segments.length > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          padding: "10px 20px", fontSize: 15,
        }} onClick={handleUndo}>
          ↩ Undo
        </button>
        <button className="frac-btn" disabled={segments.length === 0} style={{
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: segments.length > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          padding: "10px 20px", fontSize: 15,
        }} onClick={handleClear}>
          Clear
        </button>
      </div>

      {/* Fraction piece buttons */}
      <div style={styles.piecesGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((denom) => {
          const fits = canFit(denom);
          const isExactMatch = exactMatchDenom === denom;
          const is7 = denom === 7;
          const is10 = denom === 10;
          return (
            <button
              key={denom}
              className="frac-btn"
              disabled={isFull}
              style={{
                background: is7 ? NB7_GRADIENT : NB_COLORS[denom],
                color: is10 ? "#E41E20" : undefined,
                textShadow: is10 ? "none" : undefined,
                boxShadow: isExactMatch && !isFull
                  ? `0 0 0 3px #fff, 0 5px 14px ${NB_COLORS[denom]}88`
                  : `0 5px 14px ${NB_COLORS[denom]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
                opacity: isFull ? 0.3 : fits ? 1 : 0.5,
                animation: warning && !fits ? "warningShake 0.4s ease-out" : "none",
              }}
              onClick={() => handleAdd(denom)}
            >
              <span style={{ fontSize: 13, opacity: 0.85 }}>1</span>
              <span style={{
                width: "60%", height: 2,
                background: is10 ? "rgba(228,30,32,0.7)" : "rgba(255,255,255,0.7)",
                borderRadius: 1,
              }} />
              <span style={{ fontSize: 13, opacity: 0.85 }}>{denom}</span>
            </button>
          );
        })}
      </div>

      {/* Segment legend */}
      {segments.length > 0 && (
        <div style={styles.legend}>
          {segments.map((seg, i) => (
            <span key={seg.id} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 14, fontFamily: "var(--font-heading)", fontWeight: 600,
              color: "#fff",
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: 3,
                background: seg.denom === 7 ? NB7_GRADIENT : NB_COLORS[seg.denom],
                border: seg.denom === 10 ? "1px solid rgba(255,255,255,0.3)" : "none",
                display: "inline-block", flexShrink: 0,
              }} />
              1/{seg.denom}
              {i < segments.length - 1 && (
                <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 2px" }}>+</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  header: {
    marginBottom: 12,
    width: "100%", maxWidth: 380,
  },
  pieContainer: {
    position: "relative",
    width: "100%", maxWidth: 280,
    marginBottom: 4,
  },
  svg: {
    width: "100%", height: "auto",
    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.3))",
  },
  funFactRow: {
    height: 38,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 6,
    width: "100%", maxWidth: 340,
  },
  funFactBadge: {
    display: "flex", alignItems: "center", flexWrap: "nowrap",
    padding: "6px 14px", borderRadius: 20,
    background: "rgba(72,219,251,0.1)",
    border: "1px solid rgba(72,219,251,0.25)",
    fontSize: 14, fontFamily: "var(--font-heading)", fontWeight: 700,
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "nowrap",
  },
  funFactFraction: {
    color: "#48DBFB",
    margin: "0 1px",
  },
  progressRow: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", maxWidth: 280,
    marginBottom: 10,
  },
  progressBarOuter: {
    flex: 1, height: 8, borderRadius: 4,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%", borderRadius: 4,
    transition: "width 0.3s ease-out",
  },
  progressText: {
    fontSize: 14, fontWeight: 600,
    fontFamily: "var(--font-heading)",
    color: "rgba(255,255,255,0.7)",
    minWidth: 50, textAlign: "right",
  },
  actionRow: {
    display: "flex", gap: 10, justifyContent: "center",
    width: "100%", maxWidth: 280,
    marginBottom: 12,
  },
  piecesGrid: {
    display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8,
    width: "100%", maxWidth: 320,
    position: "relative", zIndex: 1,
  },
  legend: {
    display: "flex", flexWrap: "wrap", gap: 6,
    justifyContent: "center",
    marginTop: 12,
    width: "100%", maxWidth: 340,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
  },
};
