import { useState, useRef, useEffect } from "react";
import { isEven, pairUp, everyDigit, EVEN_DIGITS, ODD_DIGITS, MAX_DIGITS, MAX_NUMBER } from "./oddEven.js";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { NB_SOLID, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { contrastTextColor } from "../shared/colorUtils.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { Toast } from "../shared/Toast.jsx";

const THIS_YEAR = String(new Date().getFullYear());
const GOLD = "#FFD030";

// Pairs are blue; the odd one out is orange.
const EVEN_COLOR = "#3A8FDE";
const EVEN_COLOR_LIGHT = "#6CB4F0";
const ODD_COLOR = "#FF8C1A";
const KIND_COLOR = { even: EVEN_COLOR, odd: ODD_COLOR };

// Numbers up to this are drawn block by block; bigger ones as a stack that
// keeps going.
const BLOCK_LIMIT = 100n;

function formatNumber(n, useCommas) {
  return useCommas ? n.toLocaleString("en-US") : String(n);
}

function getFunFact(input, n, even) {
  switch (input) {
    case "": return null;
    case "0": return "🤔 Zero is even — nothing is left over!";
    case "1": return "☝️ 1 is the very first odd number!";
    case "2": return "✌️ 2 is the first even number after 0!";
    case "5": return "🖐️ 5 fingers: 2 pairs and a thumb!";
    case "6": return "🐞 A ladybug has 6 legs — 3 pairs!";
    case "8": return "🐙 An octopus has 8 arms — 4 pairs!";
    case "10": return "🙌 10 fingers — 5 pairs!";
    case "12": return "🥚 A dozen eggs — 6 pairs!";
    case "100": return "💯 100 is 50 pairs!";
    case "1000": return "🎉 1,000 is 500 pairs!";
    case "1000000": return "🌟 A million is 500,000 pairs!";
    case "2468": return "📣 2, 4, 6, 8 — who do we appreciate?";
    case "13579": return "🌈 All five odd digits in a row!";
  }
  if (input === THIS_YEAR) return `📅 This year is ${even ? "even" : "odd"}!`;
  if (n === MAX_NUMBER) return "🏁 The biggest number here!";
  const every = input.length >= 3 ? everyDigit(input) : null;
  if (every) return `${every === "odd" ? "🟠" : "🔵"} Every digit is ${every}!`;
  return null;
}

// ── Number Tiles ─────────────────────────────────────────────────────────────

// Numbers up to 100 look like the Numberblocks; bigger ones are plain gold.
function tileStyle(value) {
  if (value > 100n) {
    return {
      background: "rgba(255,208,48,0.14)",
      boxShadow: "inset 0 0 0 1px rgba(255,208,48,0.5)",
      color: GOLD,
    };
  }
  const n = Number(value);
  const nb = getNumberBlockStyle(n);
  if (!nb.border) {
    return { background: nb.background, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.4)" };
  }
  const decade = String(n - (n % 10));
  const color = contrastTextColor(NB_SOLID[decade]);
  return {
    background: nb.background,
    boxShadow: `inset 0 0 0 2px ${nb.border}`,
    color,
    textShadow: color === "#fff" ? "0 1px 2px rgba(0,0,0,0.4)" : "none",
  };
}

function NumberTile({ value, label, style, onClick }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      className={onClick ? "toy-btn" : undefined}
      style={{ ...styles.tile, ...tileStyle(value), ...style }}
      onClick={onClick}
    >
      {label}
    </Tag>
  );
}

// 1–20 in two rows, odds over evens, shown before a number is typed.
function CountingKey({ onPick }) {
  return (
    <div style={styles.key}>
      {["odd", "even"].map((kind) => (
        <div key={kind} style={{ ...styles.keyRow, ...tintStyle(KIND_COLOR[kind]) }}>
          {Array.from({ length: 10 }, (_, i) => 2 * i + (kind === "odd" ? 1 : 2)).map((k) => (
            <NumberTile
              key={k} value={BigInt(k)} label={k}
              style={styles.keyTile}
              onClick={() => onPick(String(k))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const tintStyle = (color) => ({
  background: `${color}1F`,
  boxShadow: `inset 0 0 0 1px ${color}55`,
});

// ── Last Digit Strip ─────────────────────────────────────────────────────────
//
// Even numbers end in 0, 2, 4, 6 or 8; odd ones in 1, 3, 5, 7 or 9. The
// number's last digit lights up in its group.

function LastDigitStrip({ last }) {
  return (
    <div style={styles.strip}>
      {[["even", EVEN_DIGITS], ["odd", ODD_DIGITS]].map(([kind, digits]) => (
        <div key={kind} style={{ ...styles.stripGroup, ...tintStyle(KIND_COLOR[kind]) }}>
          <span style={{ ...styles.stripLabel, color: KIND_COLOR[kind] }}>{kind}</span>
          {digits.map((d) => {
            const lit = d === last;
            return (
              <span key={`${d}|${lit}`} style={{
                ...styles.stripDigit,
                ...(lit
                  ? { background: KIND_COLOR[kind], color: "#fff", animation: "popIn 0.3s ease-out" }
                  : { opacity: last === null ? 0.7 : 0.35 }),
              }}>
                {d}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Pairs Picture ────────────────────────────────────────────────────────────
//
// The number as blocks lined up two by two in towers, like the Numberblocks.
// An odd number has one block on top with no partner.

const BLOCK = 10; // viewBox units
const PAIR_GAP = 1.5; // between the two blocks of a pair
const ROW_GAP = 3.5; // between one pair and the next
const TOWER_GAP = 9;
const PAIRS_PER_TOWER = 10;
const MAX_BLOCK_PX = 30;

// Each tower is a list of rows, bottom first: "pair", "leftover" or "more"
// (a ⋮ for a stack too tall to draw).
function towersFor(n) {
  const { pairs, leftover } = pairUp(n);
  if (n > BLOCK_LIMIT) {
    return [["pair", "pair", "pair", "more", "pair", "pair", ...(leftover ? ["leftover"] : [])]];
  }
  const rows = [...Array(Number(pairs)).fill("pair"), ...(leftover ? ["leftover"] : [])];
  const towers = [];
  for (let i = 0; i < rows.length; i += PAIRS_PER_TOWER) {
    towers.push(rows.slice(i, i + PAIRS_PER_TOWER));
  }
  return towers;
}

function PairsPicture({ towers }) {
  const towerW = 2 * BLOCK + PAIR_GAP;
  const step = BLOCK + ROW_GAP;
  const w = towers.length * (towerW + TOWER_GAP) - TOWER_GAP;
  const h = Math.max(...towers.map((t) => t.length)) * step - ROW_GAP;
  const right = BLOCK + PAIR_GAP;

  let pairIndex = 0;
  const shapes = [];
  towers.forEach((rows, t) => {
    const x = t * (towerW + TOWER_GAP);
    rows.forEach((row, r) => {
      const y = h - BLOCK - r * step;
      const key = `${t}-${r}`;
      if (row === "pair") {
        const fill = pairIndex++ % 2 ? EVEN_COLOR_LIGHT : EVEN_COLOR;
        shapes.push(
          <g key={key}>
            <rect x={x} y={y} width={BLOCK} height={BLOCK} rx={2} fill={fill} />
            <rect x={x + right} y={y} width={BLOCK} height={BLOCK} rx={2} fill={fill} />
          </g>
        );
      } else if (row === "leftover") {
        // The odd one out bobs about, next to a dashed space for the partner
        // it doesn't have.
        shapes.push(
          <g key={key}>
            <rect
              x={x + right + 0.4} y={y + 0.4} width={BLOCK - 0.8} height={BLOCK - 0.8} rx={2}
              fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} strokeDasharray="2 1.5"
            />
            <rect
              x={x} y={y} width={BLOCK} height={BLOCK} rx={2} fill={ODD_COLOR}
              style={{
                animation: "bob 1.4s ease-in-out infinite",
                filter: "drop-shadow(0 0 2px rgba(255,140,26,0.8))",
              }}
            />
          </g>
        );
      } else {
        shapes.push(
          <g key={key} fill="rgba(255,255,255,0.6)">
            {[2, 5, 8].map((dy) => <circle key={dy} cx={x + towerW / 2} cy={y + dy} r={1.1} />)}
          </g>
        );
      }
    });
  });

  const scale = MAX_BLOCK_PX / BLOCK;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{
      maxWidth: w * scale, maxHeight: h * scale, overflow: "visible",
    }}>
      {shapes}
    </svg>
  );
}

function pictureCaption(pairs, leftover, fmt) {
  if (pairs === 0n) return "Just 1 block — no partner!";
  const text = `${fmt(pairs)} ${pairs === 1n ? "pair" : "pairs"}`;
  return leftover ? `${text} and 1 left over!` : `${text} — every block has a partner!`;
}

// ── Settings Content ─────────────────────────────────────────────────────────

function OddEvenSettings({ show, onClose, useCommas, setUseCommas, lightLast, setLightLast }) {
  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={lightLast}
        onChange={() => setLightLast(l => !l)}
        label="Light up the last digit"
        hint="The last digit is all you need to tell!"
      />

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={useCommas}
          onChange={() => setUseCommas(c => !c)}
          label="Show commas in numbers"
          hint={`e.g. ${useCommas ? "1,000,000" : "1000000"} → ${!useCommas ? "1,000,000" : "1000000"}`}
        />
      </div>

      <SettingsDivider />
      <SettingsSection title="How It Works">
        <SettingsAboutText>
          Line up an even number of blocks in pairs and every block has a partner. Try it with
          an odd number and there’s always one left over — the odd one out!
        </SettingsAboutText>
        <SettingsAboutText>
          That means an even number can be shared fairly between two: 14 is 7 + 7. Share out
          15 and there’s one left over: 7 + 7 + 1.
        </SettingsAboutText>
        <SettingsAboutText>
          For a big number, just look at the last digit. Every ten makes 5 pairs, so the tens,
          hundreds and thousands always pair up — only the ones can leave a block over. Ends in
          0, 2, 4, 6 or 8? Even! Ends in 1, 3, 5, 7 or 9? Odd!
        </SettingsAboutText>
        <SettingsAboutText>
          Adding 1 flips a number from odd to even and back again. Adding 2 adds a whole pair,
          so it stays the same.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who absolutely loves numbers — so he can see whether any number is
          odd or even, all the way up to {MAX_DIGITS} digits long.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Number button colors based on the{" "}
          <span style={{ color: "#E41E20" }}>N</span>
          <span style={{ color: "#FF8C1A" }}>u</span>
          <span style={{ color: "#FFD030" }}>m</span>
          <span style={{ color: "#4AAF4E" }}>b</span>
          <span style={{ color: "#3A8FDE" }}>e</span>
          <span style={{ color: "#9B59B6" }}>r</span>
          <span style={{ color: "#F472B6" }}>b</span>
          <span style={{ color: "#8E8E93" }}>l</span>
          <span style={{ color: "#E41E20" }}>o</span>
          <span style={{ color: "#FF8C1A" }}>c</span>
          <span style={{ color: "#FFD030" }}>k</span>
          <span style={{ color: "#4AAF4E" }}>s</span>
          {" "}characters.
        </SettingsAboutText>
      </SettingsSection>
    </SettingsOverlay>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OddOrEven() {
  const [input, setInput] = useState("");
  const [bounce, setBounce] = useState(null);
  const [numberFlash, setNumberFlash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useCommas, setUseCommas] = useState(true);
  const [lightLast, setLightLast] = useState(true);
  const numberOuterRef = useRef(null);
  const numberInnerRef = useRef(null);
  const splitOuterRef = useRef(null);
  const splitInnerRef = useRef(null);

  const isEmpty = input === "";
  const n = isEmpty ? null : BigInt(input);
  const even = !isEmpty && isEven(input);
  const kind = isEmpty ? null : even ? "even" : "odd";
  const { pairs, leftover } = n !== null ? pairUp(n) : { pairs: 0n, leftover: 0n };
  const isFull = input.length >= MAX_DIGITS;
  const funFact = getFunFact(input, n, even);

  const fmt = (v) => formatNumber(v, useCommas);
  const numberText = isEmpty ? "?" : fmt(n);
  const numberFontSize = useAutoFitFontSize(numberOuterRef, numberInnerRef, numberText.length, {
    maxFont: 46, minFont: 14, fitKey: lightLast,
  });

  const halfLabel = fmt(pairs);
  const splitCharCount = 2 * halfLabel.length + (leftover ? 4 : 0);
  const splitFontSize = useAutoFitFontSize(splitOuterRef, splitInnerRef, splitCharCount, {
    maxFont: 20, minFont: 12, fitKey: `${input}|${useCommas}`,
  });

  // Long halves scroll — start each new number back at the top.
  useEffect(() => {
    if (splitOuterRef.current) splitOuterRef.current.scrollTop = 0;
  }, [input]);

  const triggerFlash = () => {
    setNumberFlash(true);
    setTimeout(() => setNumberFlash(false), 300);
  };

  const pressed = (key) => {
    setBounce(key);
    triggerFlash();
    setTimeout(() => setBounce(null), 200);
  };

  const handleDigit = (d) => {
    if (isFull) return;
    setInput((input === "0" ? "" : input) + d);
    pressed(d);
  };

  const handleBackspace = () => {
    if (isEmpty) return;
    setInput(input.slice(0, -1));
    triggerFlash();
  };

  const handleClear = () => {
    if (isEmpty) return;
    setInput("");
    triggerFlash();
  };

  // ±1 flips odd and even; ±2 adds or takes away a pair, so it stays the same.
  const canAdd = (k) => (n ?? 0n) + k <= MAX_NUMBER;
  const canTake = (k) => n !== null && n >= k;

  const handleAdd = (k, key) => {
    if (!canAdd(k)) return;
    setInput(String((n ?? 0n) + k));
    key ? pressed(key) : triggerFlash();
  };

  const handleTake = (k, key) => {
    if (!canTake(k)) return;
    setInput(String(n - k));
    key ? pressed(key) : triggerFlash();
  };

  const head = numberText.slice(0, -1);
  const last = numberText.slice(-1);

  return (
    <div className="toy-container">
      <style>{`
        @keyframes factPop {
          0% { transform: translateX(-50%) scale(0.7); opacity: 0; }
          60% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes factOut {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(0.7); opacity: 0; }
        }
        @keyframes blocksIn {
          0% { transform: scale(0.92); opacity: 0.4; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .nb-btn {
          width: 100%; aspect-ratio: 1.4;
          border-radius: 18px; font-size: 30px;
        }
        .pm-btn {
          font-size: 26px; padding: 12px 0;
        }
      `}</style>

      <BackgroundDots count={20} />

      {/* Header */}
      <StickyHeader
        title="Odd or Even"
        subtitle="Do the blocks all pair up?"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <OddEvenSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        useCommas={useCommas}
        setUseCommas={setUseCommas}
        lightLast={lightLast}
        setLightLast={setLightLast}
      />

      {/* Display Area */}
      <div className="frosted-card" style={styles.displayCard}>
        <div ref={numberOuterRef} style={styles.numberOuter}>
          <div ref={numberInnerRef} style={{
            ...styles.numberInner,
            fontSize: numberFontSize,
            color: isEmpty ? "rgba(255,255,255,0.3)" : "#fff",
            animation: numberFlash ? "flash 0.3s ease-out" : "none",
          }}>
            {isEmpty || !lightLast ? numberText : (
              <>
                {head.slice(0, -1)}
                {/* Keeps the lit-up digit on the same line as the one before it */}
                <span style={{ whiteSpace: "nowrap" }}>
                  {head.slice(-1)}
                  <span key={input} style={{ ...styles.lastDigit, background: KIND_COLOR[kind] }}>
                    {last}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        <div style={styles.verdictRow}>
          {isEmpty ? (
            <span style={styles.verdictAsk}>Odd or even?</span>
          ) : (
            <span key={input} style={{ ...styles.verdict, ...(even ? styles.verdictEven : styles.verdictOdd) }}>
              {even ? "EVEN" : "ODD"}
            </span>
          )}
        </div>

        <LastDigitStrip last={isEmpty ? null : input.slice(-1)} />

        <div style={styles.pictureOuter}>
          {isEmpty && <CountingKey onPick={(k) => { setInput(k); triggerFlash(); }} />}
          {n === 0n && <span style={styles.pictureNote}>No blocks at all — so none left over!</span>}
          {n !== null && n > 0n && (
            <>
              <div key={input} style={styles.picture}>
                <PairsPicture towers={towersFor(n)} />
              </div>
              <div style={styles.caption}>{pictureCaption(pairs, leftover, fmt)}</div>
              {n > BLOCK_LIMIT && <div style={styles.pictureHint}>Too many blocks to draw them all!</div>}
            </>
          )}
        </div>

        <div ref={splitOuterRef} style={styles.splitOuter}>
          {isEmpty && <span style={styles.splitHint}>Tap a number, or type any number below!</span>}
          {n === 0n && <span style={styles.splitHint}>Zero splits into 0 and 0 — that’s even!</span>}
          {n === 1n && <span style={styles.splitHint}>1 can’t be shared between two — it’s left over!</span>}
          {n !== null && n > 1n && (
            <div ref={splitInnerRef} style={{ ...styles.splitInner, fontSize: splitFontSize }}>
              <div style={styles.splitLabel}>
                {leftover ? "shared between two, 1 left over" : "shared fairly between two"}
              </div>
              <div style={styles.tileRow}>
                <NumberTile value={pairs} label={halfLabel} />
                <span style={styles.tileGroup}>
                  <span style={styles.plus}>+</span>
                  <NumberTile value={pairs} label={halfLabel} />
                </span>
                {leftover > 0n && (
                  <span style={styles.tileGroup}>
                    <span style={styles.plus}>+</span>
                    <span style={{ ...styles.tile, ...styles.leftoverTile }}>1</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fun fact overlay */}
      <div style={styles.funFactAnchor}>
        <Toast
          text={funFact}
          variant="info"
          position="top"
          enterAnimation="factPop 0.35s ease-out forwards"
          exitAnimation="factOut 0.35s ease-in forwards"
        />
      </div>

      {/* Plus / Minus row */}
      <div style={styles.pmRow}>
        <button className="toy-btn pm-btn" disabled={!canTake(1n)} style={{
          background: "linear-gradient(135deg, #E41E20, #FF8C1A)",
          boxShadow: "0 4px 12px rgba(228,30,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: canTake(1n) ? 1 : 0.35,
        }} onClick={() => handleTake(1n)}>
          − 1
        </button>
        <button className="toy-btn pm-btn" disabled={!canAdd(1n)} style={{
          background: "linear-gradient(135deg, #3A8FDE, #9B59B6)",
          boxShadow: "0 4px 12px rgba(58,143,222,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: canAdd(1n) ? 1 : 0.35,
        }} onClick={() => handleAdd(1n)}>
          + 1
        </button>
      </div>

      {/* Clear / Delete row */}
      <div style={styles.actionRow}>
        <button className="toy-btn pm-btn" disabled={isEmpty} style={{
          ...styles.grayBtn, fontSize: 16, letterSpacing: 1,
          color: isEmpty ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
        }} onClick={handleClear}>
          CLR
        </button>
        <button className="toy-btn pm-btn" disabled={isEmpty} style={{
          ...styles.grayBtn, fontSize: 26,
          color: isEmpty ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
        }} onClick={handleBackspace}>
          ←
        </button>
      </div>

      {/* Numpad */}
      <div style={styles.numpad}>
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((d) => {
          const style = getNumberBlockStyle(d);
          const hasBorder = !!style.border;
          return (
            <button key={d} className="toy-btn nb-btn" disabled={isFull} style={{
              background: style.background,
              border: hasBorder ? `3px solid ${style.border}` : undefined,
              boxShadow: hasBorder
                ? `0 5px 14px ${style.border}40, inset 0 2px 0 rgba(255,255,255,0.5)`
                : `0 5px 14px ${NB_SOLID[String(d)]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
              color: hasBorder ? style.border : undefined,
              textShadow: hasBorder ? "none" : undefined,
              animation: bounce === String(d) && !isFull ? "btnPress 0.2s ease-out" : "none",
              opacity: isFull ? 0.35 : 1,
            }} onClick={() => handleDigit(String(d))}>
              {d}
            </button>
          );
        })}
        <button className="toy-btn nb-btn" disabled={!canTake(2n)} aria-label="Take away a pair" style={{
          ...styles.pairBtn,
          animation: bounce === "-2" ? "btnPress 0.2s ease-out" : "none",
          opacity: canTake(2n) ? 1 : 0.35,
        }} onClick={() => handleTake(2n, "-2")}>
          − 2
        </button>
        <button className="toy-btn nb-btn" disabled={isFull} style={{
          background: "#FFFFFF",
          border: "3px solid #E41E20",
          boxShadow: "0 5px 14px rgba(228,30,32,0.25), inset 0 2px 0 rgba(255,255,255,0.5)",
          color: "#E41E20", textShadow: "none",
          animation: bounce === "0" && !isFull ? "btnPress 0.2s ease-out" : "none",
          opacity: isFull ? 0.35 : 1,
        }} onClick={() => handleDigit("0")}>
          0
        </button>
        <button className="toy-btn nb-btn" disabled={!canAdd(2n)} aria-label="Add a pair" style={{
          ...styles.pairBtn,
          animation: bounce === "+2" ? "btnPress 0.2s ease-out" : "none",
          opacity: canAdd(2n) ? 1 : 0.35,
        }} onClick={() => handleAdd(2n, "+2")}>
          + 2
        </button>
      </div>
    </div>
  );
}

const styles = {
  displayCard: {
    padding: "12px 14px",
    width: "100%", maxWidth: 380, height: 404,
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  numberOuter: {
    height: 56, flexShrink: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  numberInner: {
    fontWeight: 700, textAlign: "center",
    wordBreak: "break-all", maxWidth: "100%",
  },
  lastDigit: {
    display: "inline-block", lineHeight: 1.15,
    padding: "0 0.14em", marginLeft: "0.05em", borderRadius: "0.2em",
    color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    animation: "popIn 0.3s ease-out",
  },
  verdictRow: {
    height: 46, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  verdictAsk: {
    fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.3)",
  },
  verdict: {
    fontSize: 22, fontWeight: 700, letterSpacing: 3,
    padding: "5px 26px", borderRadius: 999, lineHeight: 1.2,
    color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    animation: "popIn 0.35s ease-out",
  },
  verdictEven: {
    background: "linear-gradient(135deg, #29B6A8, #3A8FDE)",
    boxShadow: "0 0 16px rgba(58,143,222,0.45), inset 0 2px 0 rgba(255,255,255,0.3)",
  },
  verdictOdd: {
    background: "linear-gradient(135deg, #FF8C1A, #E8578A)",
    boxShadow: "0 0 16px rgba(255,140,26,0.45), inset 0 2px 0 rgba(255,255,255,0.3)",
  },
  strip: {
    display: "flex", gap: 8, justifyContent: "center",
    flexShrink: 0, marginBottom: 8,
  },
  stripGroup: {
    flex: 1, minWidth: 0, maxWidth: 170,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderRadius: 999, padding: "3px 4px 3px 10px",
  },
  stripLabel: {
    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 10,
    letterSpacing: 1, textTransform: "uppercase", marginRight: 2,
  },
  stripDigit: {
    width: 22, height: 22, borderRadius: 999,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#fff",
  },
  pictureOuter: {
    flex: 1, minHeight: 0,
    background: "rgba(0,0,0,0.15)", borderRadius: 10,
    marginBottom: 8, overflow: "hidden",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "10px 10px 6px",
  },
  picture: {
    flex: 1, minWidth: 0, minHeight: 0, width: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: "blocksIn 0.3s ease-out",
  },
  pictureNote: {
    fontSize: 15, color: "rgba(255,255,255,0.5)",
    fontFamily: "var(--font-body)", textAlign: "center",
  },
  caption: {
    flexShrink: 0, marginTop: 8,
    fontSize: 15, fontWeight: 600, textAlign: "center", lineHeight: 1.25,
    color: "rgba(255,255,255,0.9)", overflowWrap: "anywhere",
  },
  pictureHint: {
    flexShrink: 0, marginTop: 2,
    fontSize: 12, color: "rgba(255,255,255,0.45)",
    fontFamily: "var(--font-body)", textAlign: "center",
  },
  key: {
    display: "flex", flexDirection: "column", gap: 8,
    width: "100%", maxWidth: 340,
  },
  keyRow: {
    display: "flex", gap: 4, padding: 4, borderRadius: 12,
  },
  keyTile: { flex: 1, minWidth: 0, fontSize: 14, padding: "7px 0" },
  tile: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap",
    borderRadius: "0.45em", padding: "0.3em 0.45em",
  },
  leftoverTile: {
    background: ODD_COLOR, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.4)",
    boxShadow: "0 0 8px rgba(255,140,26,0.6)",
  },
  splitOuter: {
    height: 76, flexShrink: 0,
    background: "rgba(255,255,255,0.05)", borderRadius: 10,
    overflowX: "hidden", overflowY: "auto", padding: "6px 8px",
    display: "flex", flexDirection: "column",
  },
  splitHint: {
    margin: "auto 0", fontSize: 14, color: "rgba(255,255,255,0.5)",
    fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.35,
  },
  splitInner: {
    // Auto margins center the tiles, but unlike align-items they fall back to
    // the top when the tiles overflow, so the scroll can reach the first row.
    margin: "auto 0", width: "100%",
  },
  splitLabel: {
    fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)",
    textAlign: "center", marginBottom: 5,
  },
  tileRow: {
    display: "flex", flexWrap: "wrap",
    alignItems: "center", justifyContent: "center",
    rowGap: "0.35em",
  },
  tileGroup: { display: "flex", alignItems: "center" },
  plus: {
    color: "rgba(255,255,255,0.45)", fontWeight: 600,
    margin: "0 0.35em", lineHeight: 1,
  },
  funFactAnchor: {
    width: "100%", maxWidth: 380, height: 20,
    position: "relative", zIndex: 2,
  },
  numpad: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
    width: "100%", maxWidth: 300, marginTop: 10, position: "relative", zIndex: 1,
  },
  pmRow: {
    display: "flex", gap: 10, width: "100%", maxWidth: 300,
    position: "relative", zIndex: 1,
  },
  actionRow: {
    display: "flex", gap: 10, width: "100%", maxWidth: 300,
    marginTop: 10, position: "relative", zIndex: 1,
  },
  grayBtn: {
    background: "rgba(255,255,255,0.18)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.12)",
    flex: 1,
  },
  // Two blues, like a pair of blocks
  pairBtn: {
    background: `linear-gradient(135deg, ${EVEN_COLOR}, ${EVEN_COLOR_LIGHT})`,
    border: "3px solid rgba(255,255,255,0.35)",
    boxShadow: "0 5px 14px rgba(58,143,222,0.45), inset 0 2px 0 rgba(255,255,255,0.25)",
    fontSize: 26,
  },
};
