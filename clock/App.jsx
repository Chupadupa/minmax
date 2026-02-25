import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  minuteAngle,
  hourAngle,
  angleToMinutes,
  angleToHours,
  pointerToAngle,
  formatTime12,
  formatTime24,
  detectWrap,
  padTwo,
} from "./clockUtils.js";

// ── Colors ───────────────────────────────────────────────────────────────────

const HOUR_COLORS = {
  1: "#E41E20", 2: "#FF8C1A", 3: "#FFD030", 4: "#4AAF4E",
  5: "#3A8FDE", 6: "#9B59B6", 7: "#6E3FA0", 8: "#F472B6",
  9: "#8E8E93", 10: "#E41E20", 11: "#FF8C1A", 12: "#FFD030",
};

const MINUTE_HAND_COLOR = "#3A8FDE";
const HOUR_HAND_COLOR = "#E41E20";
const CENTER_DOT_COLOR = "#FFD030";

// ── Settings Overlay ─────────────────────────────────────────────────────────

function SettingsOverlay({ show, onClose, use24Hour, setUse24Hour }) {
  if (!show) return null;

  return (
    <div style={settingsStyles.backdrop} onClick={onClose}>
      <div style={settingsStyles.panel} onClick={(e) => e.stopPropagation()}>
        <button style={settingsStyles.closeBtn} onClick={onClose}>✕</button>
        <h2 style={settingsStyles.heading}>Settings</h2>

        <label style={settingsStyles.toggle}>
          <div
            style={{
              ...settingsStyles.checkbox,
              background: use24Hour ? "#4AAF4E" : "rgba(255,255,255,0.15)",
              borderColor: use24Hour ? "#4AAF4E" : "rgba(255,255,255,0.25)",
            }}
            onClick={() => setUse24Hour((v) => !v)}
          >
            {use24Hour && <span style={settingsStyles.checkmark}>✓</span>}
          </div>
          <span style={settingsStyles.toggleLabel}>Use 24-hour time</span>
        </label>
        <p style={settingsStyles.toggleHint}>
          e.g. {use24Hour ? "14:30" : "2:30 PM"} → {!use24Hour ? "14:30" : "2:30 PM"}
        </p>

        <div style={settingsStyles.divider} />
        <h3 style={settingsStyles.subheading}>About</h3>
        <p style={settingsStyles.aboutText}>
          An interactive clock toy — drag the hands around or type a time
          to see how analog and digital clocks work together.
        </p>
      </div>
    </div>
  );
}

const settingsStyles = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, animation: "fadeIn 0.2s ease-out",
  },
  panel: {
    background: "linear-gradient(160deg, #1B1464 0%, #302B63 100%)",
    borderRadius: 24, padding: "28px 24px",
    width: "100%", maxWidth: 360,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    position: "relative", maxHeight: "85vh", overflowY: "auto",
    fontFamily: "var(--font-heading)", color: "#fff",
    animation: "popIn 0.3s ease-out",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    background: "rgba(255,255,255,0.1)", border: "none",
    color: "rgba(255,255,255,0.7)", fontSize: 16,
    width: 32, height: 32, borderRadius: 10,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-heading)",
  },
  heading: {
    fontSize: 22, fontWeight: 700, margin: "0 0 20px",
    background: "linear-gradient(135deg, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  toggle: {
    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 8,
    border: "2px solid", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.15s ease",
  },
  checkmark: { color: "#fff", fontSize: 16, fontWeight: 700 },
  toggleLabel: {
    fontSize: 15, color: "rgba(255,255,255,0.85)",
    fontFamily: "var(--font-body)",
  },
  toggleHint: {
    fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "6px 0 0 40px",
    fontFamily: "var(--font-body)",
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.08)", margin: "20px 0",
  },
  subheading: {
    fontSize: 16, fontWeight: 600, margin: "0 0 8px",
    color: "rgba(255,255,255,0.7)",
  },
  aboutText: {
    fontSize: 14, lineHeight: 1.6, margin: "0 0 10px",
    color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-body)",
  },
};

// ── Analog Clock ─────────────────────────────────────────────────────────────

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const CLOCK_R = 130;

function AnalogClock({ hours, minutes, dragging, onDragStart, onDragMove, onDragEnd }) {
  const svgRef = useRef(null);

  const hAngle = hourAngle(hours, minutes);
  const mAngle = minuteAngle(minutes);

  const getSvgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: CX, y: CY };
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_SIZE / rect.width;
    const scaleY = SVG_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((hand, e) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    const pt = getSvgPoint(e);
    onDragStart(hand, pointerToAngle(CX, CY, pt.x, pt.y));
  }, [getSvgPoint, onDragStart]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return;
    const pt = getSvgPoint(e);
    onDragMove(pointerToAngle(CX, CY, pt.x, pt.y));
  }, [dragging, getSvgPoint, onDragMove]);

  const handlePointerUp = useCallback(() => {
    if (dragging) onDragEnd();
  }, [dragging, onDragEnd]);

  // Hour markers and numbers
  const hourMarkers = useMemo(() => {
    const items = [];
    for (let h = 1; h <= 12; h++) {
      const angle = (h * 30 - 90) * (Math.PI / 180);
      const numR = CLOCK_R - 22;
      const dotR = CLOCK_R - 4;
      items.push(
        <circle
          key={`dot-${h}`}
          cx={CX + dotR * Math.cos(angle)}
          cy={CY + dotR * Math.sin(angle)}
          r={4}
          fill={HOUR_COLORS[h]}
          opacity={0.8}
        />,
        <text
          key={`num-${h}`}
          x={CX + numR * Math.cos(angle)}
          y={CY + numR * Math.sin(angle)}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.85)"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-heading)"
        >
          {h}
        </text>
      );
    }
    return items;
  }, []);

  // Minute tick marks
  const minuteTicks = useMemo(() => {
    const items = [];
    for (let m = 0; m < 60; m++) {
      if (m % 5 === 0) continue; // skip hour positions
      const angle = (m * 6 - 90) * (Math.PI / 180);
      const r1 = CLOCK_R - 2;
      const r2 = CLOCK_R + 2;
      items.push(
        <line
          key={`tick-${m}`}
          x1={CX + r1 * Math.cos(angle)}
          y1={CY + r1 * Math.sin(angle)}
          x2={CX + r2 * Math.cos(angle)}
          y2={CY + r2 * Math.sin(angle)}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          strokeLinecap="round"
        />
      );
    }
    return items;
  }, []);

  // Hand endpoints
  const minuteLen = CLOCK_R - 30;
  const hourLen = CLOCK_R - 55;
  const mRad = ((mAngle - 90) * Math.PI) / 180;
  const hRad = ((hAngle - 90) * Math.PI) / 180;
  const mEnd = { x: CX + minuteLen * Math.cos(mRad), y: CY + minuteLen * Math.sin(mRad) };
  const hEnd = { x: CX + hourLen * Math.cos(hRad), y: CY + hourLen * Math.sin(hRad) };
  // Hour hand hit area starts offset from center so near-center grabs favor minute hand
  const hHitStart = { x: CX + 22 * Math.cos(hRad), y: CY + 22 * Math.sin(hRad) };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={styles.clockSvg}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Clock face */}
      <circle cx={CX} cy={CY} r={CLOCK_R + 8} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={CLOCK_R + 6} fill="var(--glass-bg)" />

      {/* Ticks and markers */}
      {minuteTicks}
      {hourMarkers}

      {/* Hour hand (shorter, thicker) */}
      <line
        x1={CX} y1={CY} x2={hEnd.x} y2={hEnd.y}
        stroke={HOUR_HAND_COLOR}
        strokeWidth={7}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
      />

      {/* Minute hand (longer, thinner) */}
      <line
        x1={CX} y1={CY} x2={mEnd.x} y2={mEnd.y}
        stroke={MINUTE_HAND_COLOR}
        strokeWidth={4.5}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
      />

      {/* Hit areas — hour hand on top so it wins when overlapping,
           but offset from center so middle-area grabs favor minute */}
      <line
        x1={CX} y1={CY} x2={mEnd.x} y2={mEnd.y}
        stroke="transparent"
        strokeWidth={28}
        strokeLinecap="round"
        style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => handlePointerDown("minute", e)}
      />
      <line
        x1={hHitStart.x} y1={hHitStart.y}
        x2={hEnd.x} y2={hEnd.y}
        stroke="transparent"
        strokeWidth={30}
        strokeLinecap="round"
        style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => handlePointerDown("hour", e)}
      />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={7} fill={CENTER_DOT_COLOR} />
      <circle cx={CX} cy={CY} r={3.5} fill="rgba(0,0,0,0.3)" />
    </svg>
  );
}

// ── Digital Display ──────────────────────────────────────────────────────────

function DigitalDisplay({ hours, minutes, isAM, use24Hour, editMode, digitBuffer, onTap }) {
  if (editMode) {
    // Right-aligned: digits fill from 1s place (like a microwave)
    const buf = digitBuffer.padStart(4, "_");
    const displayStr = `${buf[0]}${buf[1]}:${buf[2]}${buf[3]}`;
    return (
      <div style={styles.digitalCard} onClick={onTap}>
        <span style={{ ...styles.digitalTime, color: "#48DBFB" }}>{displayStr}</span>
        <span style={styles.digitalHint}>type a time</span>
      </div>
    );
  }

  const formatted = use24Hour
    ? { display: formatTime24(hours, minutes, isAM), period: null }
    : formatTime12(hours, minutes, isAM);

  return (
    <div style={styles.digitalCard} onClick={onTap}>
      <span style={styles.digitalTime}>{formatted.display}</span>
      {formatted.period && <span style={styles.digitalPeriod}>{formatted.period}</span>}
      <span style={styles.digitalHint}>tap to type</span>
    </div>
  );
}

// ── Time Keypad ──────────────────────────────────────────────────────────────

function TimeKeypad({ digitBuffer, onDigit, onBackspace, onClear, disabled }) {
  return (
    <div style={styles.keypad}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <button
          key={d}
          className="clock-btn"
          disabled={disabled}
          style={{
            ...styles.keypadBtn,
            background: HOUR_COLORS[d],
            boxShadow: `0 4px 12px ${HOUR_COLORS[d]}44, inset 0 2px 0 rgba(255,255,255,0.25)`,
            opacity: disabled ? 0.35 : 1,
          }}
          onClick={() => onDigit(String(d))}
        >
          {d}
        </button>
      ))}
      <button
        className="clock-btn"
        disabled={digitBuffer.length === 0}
        style={{
          ...styles.keypadBtn,
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 15, letterSpacing: 1,
          color: digitBuffer.length > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
        onClick={onClear}
      >
        CLR
      </button>
      <button
        className="clock-btn"
        disabled={disabled}
        style={{
          ...styles.keypadBtn,
          background: "#FFFFFF",
          border: "3px solid #E41E20",
          boxShadow: "0 4px 12px rgba(228,30,32,0.25), inset 0 2px 0 rgba(255,255,255,0.5)",
          color: "#E41E20", textShadow: "none",
          opacity: disabled ? 0.35 : 1,
        }}
        onClick={() => onDigit("0")}
      >
        0
      </button>
      <button
        className="clock-btn"
        disabled={digitBuffer.length === 0}
        style={{
          ...styles.keypadBtn,
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 24,
          color: digitBuffer.length > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
        onClick={onBackspace}
      >
        ←
      </button>
    </div>
  );
}

// ── AM/PM Toggle ─────────────────────────────────────────────────────────────

function AmPmToggle({ isAM, onToggle, use24Hour }) {
  if (use24Hour) return null;
  return (
    <div style={styles.ampmCol}>
      <button
        className="clock-btn"
        style={{
          ...styles.ampmBtn,
          background: isAM
            ? "linear-gradient(135deg, #FFD030, #FF8C1A)"
            : "rgba(255,255,255,0.1)",
          color: isAM ? "#fff" : "rgba(255,255,255,0.4)",
        }}
        onClick={() => onToggle(true)}
      >
        AM
      </button>
      <button
        className="clock-btn"
        style={{
          ...styles.ampmBtn,
          background: !isAM
            ? "linear-gradient(135deg, #6E3FA0, #3A8FDE)"
            : "rgba(255,255,255,0.1)",
          color: !isAM ? "#fff" : "rgba(255,255,255,0.4)",
        }}
        onClick={() => onToggle(false)}
      >
        PM
      </button>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ClockToy() {
  const [hours, setHours] = useState(() => {   // 0–11
    const h = new Date().getHours();
    return h >= 12 ? h - 12 : h;
  });
  const [minutes, setMinutes] = useState(() => new Date().getMinutes());  // 0–59
  const [isAM, setIsAM] = useState(() => new Date().getHours() < 12);
  const [dragging, setDragging] = useState(null); // null | "hour" | "minute"
  const [editMode, setEditMode] = useState(false);
  const [digitBuffer, setDigitBuffer] = useState("");
  const [use24Hour, setUse24Hour] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shake, setShake] = useState(false);

  const prevAngleRef = useRef(null);

  // Stable background dots
  const bgDots = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      w: 8 + Math.random() * 16,
      h: 8 + Math.random() * 16,
      hue: Math.random() * 360,
      left: Math.random() * 100,
      top: Math.random() * 100,
      dur: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    })), []
  );

  // ── Drag Handlers ────────────────────────────────────────────────────────

  const handleDragStart = useCallback((hand, angle) => {
    setDragging(hand);
    prevAngleRef.current = angle;
    if (editMode) {
      setEditMode(false);
      setDigitBuffer("");
    }
  }, [editMode]);

  const handleDragMove = useCallback((angle) => {
    if (!dragging) return;
    const prevAngle = prevAngleRef.current;

    if (dragging === "minute") {
      const newMin = angleToMinutes(angle);
      setMinutes((prevMin) => {
        // Detect hour advance/retreat at the 59↔0 boundary
        const wrap = detectWrap(prevAngle, angle);
        if (wrap !== 0) {
          setHours((h) => ((h + wrap) + 12) % 12);
          // If crossing 12, toggle AM/PM
          const nextHour = ((prevMin >= 30 ? Math.ceil((prevAngle / 30)) : Math.floor(prevAngle / 30)) + wrap);
          if (wrap === 1 && prevMin >= 55) {
            setHours((h) => {
              if (h === 0) setIsAM((am) => !am); // crossing 12
              return h;
            });
          } else if (wrap === -1 && prevMin <= 4) {
            setHours((h) => {
              if (h === 11) setIsAM((am) => !am); // crossing 12 backward
              return h;
            });
          }
        }
        return newMin;
      });
    } else if (dragging === "hour") {
      const newHour = angleToHours(angle);
      setHours((prevHour) => {
        // Toggle AM/PM when crossing 12/0 boundary
        if (prevHour === 11 && newHour === 0) {
          setIsAM((am) => !am);
        } else if (prevHour === 0 && newHour === 11) {
          setIsAM((am) => !am);
        }
        return newHour;
      });
    }

    prevAngleRef.current = angle;
  }, [dragging]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    prevAngleRef.current = null;
  }, []);

  // ── Keypad Handlers ──────────────────────────────────────────────────────

  const handleDigitalTap = useCallback(() => {
    if (editMode) return;
    setEditMode(true);
    setDigitBuffer("");
  }, [editMode]);

  const applyDigitBuffer = useCallback((buf) => {
    // Right-align: "230" → "0230", "5" → "0005"
    const padded = buf.padStart(4, "0");
    let h = parseInt(padded.slice(0, 2), 10);
    let m = parseInt(padded.slice(2, 4), 10);

    // Clamp to valid ranges instead of rejecting
    m = Math.min(m, 59);

    if (use24Hour) {
      h = Math.min(h, 23);
      const newIsAM = h < 12;
      const newHour = h >= 12 ? h - 12 : h;
      setHours(newHour);
      setMinutes(m);
      setIsAM(newIsAM);
    } else {
      h = Math.max(1, Math.min(h, 12));
      setHours(h === 12 ? 0 : h);
      setMinutes(m);
    }

    setEditMode(false);
    setDigitBuffer("");
  }, [use24Hour]);

  const handleDigit = useCallback((d) => {
    setDigitBuffer((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + d;
      if (next.length === 4) {
        // Use setTimeout to avoid state update during render
        setTimeout(() => applyDigitBuffer(next), 0);
      }
      return next;
    });
  }, [applyDigitBuffer]);

  const handleBackspace = useCallback(() => {
    setDigitBuffer((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setDigitBuffer("");
  }, []);

  const handleExitEdit = useCallback(() => {
    if (digitBuffer.length > 0) {
      applyDigitBuffer(digitBuffer);
    } else {
      setEditMode(false);
      setDigitBuffer("");
    }
  }, [digitBuffer, applyDigitBuffer]);

  // Close edit mode when clicking outside
  useEffect(() => {
    if (!editMode) return;
    const handler = (e) => {
      // Let clicks inside keypad/digital display propagate normally
    };
    return () => {};
  }, [editMode]);

  const keypadFull = digitBuffer.length >= 4;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes clockShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        body, #root { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
        .clock-btn {
          border-radius: 14px; border: none;
          font-size: 22px; font-weight: 700; font-family: var(--font-heading);
          color: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; user-select: none; -webkit-user-select: none;
          transition: transform 0.1s ease, opacity 0.15s ease;
          text-shadow: 0 2px 4px rgba(0,0,0,0.25);
        }
        .clock-btn:active:not([disabled]) { transform: scale(0.9); }
        .clock-btn[disabled] { cursor: default; }
      `}</style>

      {/* Background decorations */}
      <div style={styles.bgDots}>
        {bgDots.map((dot, i) => (
          <div key={i} style={{
            position: "absolute",
            width: dot.w, height: dot.h,
            borderRadius: "50%",
            background: `hsla(${dot.hue}, 80%, 75%, 0.12)`,
            left: `${dot.left}%`, top: `${dot.top}%`,
            animation: `float ${dot.dur}s ease-in-out ${dot.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* Header */}
      <div className="page-header" style={styles.header}>
        <a href="../" className="back-btn" aria-label="Back to home">⬅️</a>
        <button className="gear-btn" onClick={() => setShowSettings(true)}>⚙</button>
        <h1 className="gradient-text" style={styles.title}>Time Teller</h1>
        <p style={styles.subtitle}>Set the time!</p>
      </div>

      {/* Settings overlay */}
      <SettingsOverlay
        show={showSettings}
        onClose={() => setShowSettings(false)}
        use24Hour={use24Hour}
        setUse24Hour={setUse24Hour}
      />

      {/* Analog Clock */}
      <div style={{ ...styles.clockContainer, animation: shake ? "clockShake 0.4s ease-out" : "none" }}>
        <AnalogClock
          hours={hours}
          minutes={minutes}
          dragging={dragging}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* Digital Display + AM/PM Toggle */}
      <div style={styles.digitalRow}>
        <DigitalDisplay
          hours={hours}
          minutes={minutes}
          isAM={isAM}
          use24Hour={use24Hour}
          editMode={editMode}
          digitBuffer={digitBuffer}
          onTap={handleDigitalTap}
        />
        <AmPmToggle isAM={isAM} onToggle={setIsAM} use24Hour={use24Hour} />
      </div>

      {/* Keypad (shown when edit mode active) */}
      {editMode && (
        <div style={styles.keypadArea}>
          <button
            className="clock-btn"
            style={styles.doneBtn}
            onClick={handleExitEdit}
          >
            Done
          </button>
          <TimeKeypad
            digitBuffer={digitBuffer}
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onClear={handleClear}
            disabled={keypadFull}
          />
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: "var(--app-height, 100dvh)",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "calc(24px + var(--safe-top)) calc(16px + var(--safe-right)) calc(40px + var(--safe-bottom)) calc(16px + var(--safe-left))",
    position: "relative", overflow: "hidden",
  },
  bgDots: {
    position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
  },
  header: {
    marginBottom: 12,
    width: "100%", maxWidth: 380,
  },
  title: {
    fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "4px 0 0",
    fontFamily: "var(--font-body)", fontWeight: 300,
  },
  clockContainer: {
    width: "100%", maxWidth: 320,
    display: "flex", justifyContent: "center",
    position: "relative", zIndex: 1,
  },
  clockSvg: {
    width: "100%", height: "auto",
    touchAction: "none",
  },
  digitalCard: {
    background: "var(--glass-bg)",
    backdropFilter: "blur(var(--glass-blur))",
    borderRadius: 20, padding: "16px 24px",
    flex: 1, minWidth: 0,
    border: "1px solid var(--glass-border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, cursor: "pointer", position: "relative",
    transition: "transform 0.15s ease",
  },
  digitalTime: {
    fontSize: 48, fontWeight: 700, color: "#FFD030",
    fontFamily: "var(--font-heading)", letterSpacing: 2,
    lineHeight: 1,
  },
  digitalPeriod: {
    fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.5)",
    fontFamily: "var(--font-heading)",
    alignSelf: "flex-end", paddingBottom: 4,
  },
  digitalHint: {
    position: "absolute", top: 4, right: 12,
    fontSize: 10, color: "rgba(255,255,255,0.25)",
    fontFamily: "var(--font-body)",
  },
  digitalRow: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", maxWidth: 340,
    marginTop: 12, zIndex: 1,
    justifyContent: "center",
  },
  ampmCol: {
    display: "flex", flexDirection: "column", gap: 6, flexShrink: 0,
    zIndex: 1,
  },
  ampmBtn: {
    padding: "8px 14px", borderRadius: 12,
    fontSize: 16, fontWeight: 700, border: "none",
    transition: "all 0.15s ease",
  },
  keypadArea: {
    marginTop: 12, width: "100%", maxWidth: 260,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    animation: "popIn 0.25s ease-out", zIndex: 1,
  },
  keypad: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
    width: "100%",
  },
  keypadBtn: {
    width: "100%", aspectRatio: "1.4", borderRadius: 14,
  },
  doneBtn: {
    width: "100%", padding: "10px 0", borderRadius: 14,
    background: "linear-gradient(135deg, #4AAF4E, #3A8FDE)",
    boxShadow: "0 4px 12px rgba(74,175,78,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
    fontSize: 18,
  },
};
