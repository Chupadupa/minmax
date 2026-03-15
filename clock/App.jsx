import { useState, useRef, useCallback, useEffect } from "react";
import {
  angleToMinutes,
  angleToHours,
  formatTime12,
  formatTime24,
  detectWrap,
} from "./clockUtils.js";
import { AnalogClock } from "./AnalogClock.jsx";

import { getNumberBlockStyle } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";

// ── Colors ───────────────────────────────────────────────────────────────────

// Build hour→style map using getNumberBlockStyle for proper decade colors
const HOUR_STYLES = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [i + 1, getNumberBlockStyle(i + 1)])
);
// Flat color map for contexts needing a single color (keypad buttons, shadows)
const HOUR_COLORS = Object.fromEntries(
  Object.entries(HOUR_STYLES).map(([k, s]) => [Number(k), s.border || s.background])
);

// ── Settings Content ─────────────────────────────────────────────────────────

function ClockSettings({ show, onClose, use24Hour, setUse24Hour }) {
  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={use24Hour}
        onChange={() => setUse24Hour((v) => !v)}
        label="Use 24-hour time"
        hint={`e.g. ${use24Hour ? "14:30" : "2:30 PM"} → ${!use24Hour ? "14:30" : "2:30 PM"}`}
      />

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          An interactive clock toy — drag the hands around or type a time
          to see how analog and digital clocks work together.
        </SettingsAboutText>
      </SettingsSection>
    </SettingsOverlay>
  );
}

// ── Digital Display ──────────────────────────────────────────────────────────

function DigitalDisplay({ hours, minutes, isAM, use24Hour, editMode, digitBuffer, onTap }) {
  if (editMode) {
    // Right-aligned: digits fill from 1s place (like a microwave)
    const buf = digitBuffer.padStart(4, "_");
    const displayStr = `${buf[0]}${buf[1]}:${buf[2]}${buf[3]}`;
    return (
      <div className="frosted-card" style={styles.digitalCard} onClick={onTap}>
        <span style={{ ...styles.digitalTime, color: "#48DBFB" }}>{displayStr}</span>
        <span style={styles.digitalHint}>type a time</span>
      </div>
    );
  }

  const formatted = use24Hour
    ? { display: formatTime24(hours, minutes, isAM), period: null }
    : formatTime12(hours, minutes, isAM);

  return (
    <div className="frosted-card" style={styles.digitalCard} onClick={onTap}>
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
          className="toy-btn clock-btn"
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
        className="toy-btn clock-btn"
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
        className="toy-btn clock-btn"
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
        className="toy-btn clock-btn"
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
        className="toy-btn clock-btn"
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
        className="toy-btn clock-btn"
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
  const [seconds, setSeconds] = useState(() => new Date().getSeconds());
  const [shake, setShake] = useState(false);

  const prevAngleRef = useRef(null);

  // ── Second Hand Tick ──────────────────────────────────────────────────────

  const advanceMinute = useCallback(() => {
    setMinutes((prev) => {
      const next = (prev + 1) % 60;
      if (next === 0) {
        setHours((h) => {
          const nextH = (h + 1) % 12;
          if (nextH === 0) setIsAM((am) => !am);
          return nextH;
        });
      }
      return next;
    });
  }, []);

  const retreatMinute = useCallback(() => {
    setMinutes((prev) => {
      const next = (prev - 1 + 60) % 60;
      if (prev === 0) {
        setHours((h) => {
          const nextH = (h - 1 + 12) % 12;
          if (h === 0) setIsAM((am) => !am);
          return nextH;
        });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (dragging || editMode) return;
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= 59) {
          advanceMinute();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [dragging, editMode, advanceMinute]);

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
    } else if (dragging === "second") {
      const newSec = angleToMinutes(angle);
      const wrap = detectWrap(prevAngle, angle);
      if (wrap === 1) advanceMinute();
      else if (wrap === -1) retreatMinute();
      setSeconds(newSec);
    }

    prevAngleRef.current = angle;
  }, [dragging, advanceMinute, retreatMinute]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    prevAngleRef.current = null;
  }, []);

  const handleResetToNow = useCallback(() => {
    const now = new Date();
    const h = now.getHours();
    setHours(h >= 12 ? h - 12 : h);
    setMinutes(now.getMinutes());
    setSeconds(now.getSeconds());
    setIsAM(h < 12);
  }, []);

  // ── Keypad Handlers ──────────────────────────────────────────────────────

  const handleDigitalTap = useCallback(() => {
    if (editMode) return;
    setSeconds(0);
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

    setSeconds(0);
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

  const keypadFull = digitBuffer.length >= 4;

  return (
    <div className="toy-container">
      <style>{`
        /* clockShake — uses shared @keyframes shake from base.css */
        .clock-btn {
          font-size: 22px;
          border-radius: 14px;
        }
      `}</style>

      <BackgroundDots count={16} />

      {/* Header */}
      <StickyHeader
        title="Time Teller"
        subtitle="Set the time!"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <ClockSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        use24Hour={use24Hour}
        setUse24Hour={setUse24Hour}
      />

      {/* Analog Clock */}
      <div style={{ ...styles.clockContainer, animation: shake ? "shake 0.4s ease-out" : "none" }}>
        <AnalogClock
          hours={hours}
          minutes={minutes}
          seconds={seconds}
          dragging={dragging}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          style={styles.clockSvg}
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

      {/* Reset to current time */}
      {!editMode && (
        <button
          className="toy-btn clock-btn"
          style={styles.resetBtn}
          onClick={handleResetToNow}
        >
          Now
        </button>
      )}

      {/* Keypad (shown when edit mode active) */}
      {editMode && (
        <div style={styles.keypadArea}>
          <button
            className="toy-btn clock-btn"
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
    padding: "16px 24px",
    flex: 1, minWidth: 0,
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
  resetBtn: {
    padding: "6px 20px", borderRadius: 12,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 14, fontWeight: 600,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8, zIndex: 1,
    boxShadow: "none",
    textShadow: "none",
  },
};
