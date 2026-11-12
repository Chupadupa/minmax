import { NB_COLORS, NB_SOLID } from "./numberblockColors.js";

// ── Numpad ──
// The keys every number toy shares: − 1 and + 1, CLR and ←, then the digits in
// their Numberblocks colors. It's driven by a `pad` from useNumberInput, and its
// sizes come from .nb-btn and .pm-btn in base.css.
//
//   <Numpad pad={pad} />
//
// Optional extras:
//   middleKey          goes between − 1 and + 1 (a 🔊 button, say) — give it the
//                      classes "toy-btn pm-btn"
//   leftKey, rightKey  go either side of 0 — make them with <NumpadKey />
//
// <NumpadSpeakKey /> is the ready-made 🔊 button for middleKey.

const PRESS_ANIMATION = "btnPress 0.2s ease-out";
const DISABLED_OPACITY = 0.35;
const DIGIT_ROWS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

// One key in the digit grid. It dims when disabled, and bounces when the pad
// says it was the key just pressed (`id` is the key name given to pad.step or
// pad.set). `label` is for screen readers when the key shows a symbol.
export function NumpadKey({ pad, id, disabled = false, label, style, onClick, children }) {
  return (
    <button
      className="toy-btn nb-btn"
      disabled={disabled}
      aria-label={label}
      style={{
        ...style,
        animation: pad.bounce === id && !disabled ? PRESS_ANIMATION : "none",
        opacity: disabled ? DISABLED_OPACITY : 1,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// A 🔊 key for between − 1 and + 1: says `getText()` (a string, or a list of
// strings) with a `speech` from useSpeech, and turns into ⏹ while it's talking.
export function NumpadSpeakKey({ speech, disabled = false, getText }) {
  return (
    <button
      className="toy-btn pm-btn"
      disabled={disabled}
      aria-label="Say it"
      style={{
        ...styles.speakKey,
        opacity: disabled ? DISABLED_OPACITY : 1,
        animation: speech.speaking ? "speakPulse 0.8s ease-in-out infinite" : "none",
      }}
      onClick={() => (speech.speaking ? speech.stop() : speech.speak(getText()))}
    >
      {speech.speaking ? "⏹" : "🔊"}
    </button>
  );
}

function DigitKey({ pad, digit, style }) {
  return (
    <NumpadKey pad={pad} id={digit} disabled={!pad.canType} style={style} onClick={() => pad.type(digit)}>
      {digit}
    </NumpadKey>
  );
}

function StepKey({ pad, step, style, children }) {
  const enabled = pad.canStep(step);
  return (
    <button
      className="toy-btn pm-btn"
      disabled={!enabled}
      style={{ ...style, opacity: enabled ? 1 : DISABLED_OPACITY }}
      onClick={() => pad.step(step)}
    >
      {children}
    </button>
  );
}

function GrayKey({ pad, style, onClick, children }) {
  return (
    <button
      className="toy-btn pm-btn"
      disabled={pad.isEmpty}
      style={{
        ...styles.grayKey, ...style,
        color: pad.isEmpty ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Numpad({ pad, middleKey, leftKey, rightKey }) {
  return (
    <>
      <div style={styles.row}>
        <StepKey pad={pad} step={-1n} style={styles.minusKey}>− 1</StepKey>
        {middleKey}
        <StepKey pad={pad} step={1n} style={styles.plusKey}>+ 1</StepKey>
      </div>

      <div style={{ ...styles.row, marginTop: 10 }}>
        <GrayKey pad={pad} style={styles.clearKey} onClick={pad.clear}>CLR</GrayKey>
        <GrayKey pad={pad} style={styles.backspaceKey} onClick={pad.backspace}>←</GrayKey>
      </div>

      <div style={styles.grid}>
        {DIGIT_ROWS.map((digit) => (
          <DigitKey key={digit} pad={pad} digit={digit} style={{
            background: NB_COLORS[digit],
            boxShadow: `0 5px 14px ${NB_SOLID[digit]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
          }} />
        ))}
        {leftKey}
        <DigitKey pad={pad} digit="0" style={styles.zeroKey} />
        {rightKey}
      </div>
    </>
  );
}

const styles = {
  row: {
    display: "flex", gap: 10,
    width: "100%", maxWidth: 300,
    position: "relative", zIndex: 1,
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10, width: "100%", maxWidth: 300, marginTop: 10,
    position: "relative", zIndex: 1,
  },
  minusKey: {
    background: "linear-gradient(135deg, #E41E20, #FF8C1A)",
    boxShadow: "0 4px 12px rgba(228,30,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
    flex: 1,
  },
  plusKey: {
    background: "linear-gradient(135deg, #3A8FDE, #9B59B6)",
    boxShadow: "0 4px 12px rgba(58,143,222,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
    flex: 1,
  },
  grayKey: {
    background: "rgba(255,255,255,0.18)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.12)",
    flex: 1,
  },
  speakKey: {
    background: "linear-gradient(135deg, #FFD030, #FF8C1A)",
    boxShadow: "0 4px 12px rgba(255,140,26,0.3), inset 0 2px 0 rgba(255,255,255,0.3)",
    width: 72, flexShrink: 0, fontSize: 24,
  },
  clearKey: { fontSize: 16, letterSpacing: 1 },
  backspaceKey: { fontSize: 26 },
  // Zero has no Numberblocks color of its own, so it borrows Ten's white and red.
  // It always sits in the middle column, with or without keys beside it.
  zeroKey: {
    background: "#FFFFFF",
    border: "3px solid #E41E20",
    boxShadow: "0 5px 14px rgba(228,30,32,0.25), inset 0 2px 0 rgba(255,255,255,0.5)",
    color: "#E41E20", textShadow: "none",
    gridColumn: 2,
  },
};
