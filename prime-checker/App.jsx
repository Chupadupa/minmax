import { useState, useRef, useEffect, useMemo } from "react";
import {
  isPrime, nextPrime, prevPrime, factorize, factorCount, rectangleSides, primeIndex,
  PRIMES_UNDER_100, MAX_DIGITS, MAX_NUMBER,
} from "./primes.js";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { NB_SOLID, NB_DIGIT_TEXT, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { contrastTextColor } from "../shared/colorUtils.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { Toast } from "../shared/Toast.jsx";

const THIS_YEAR = String(new Date().getFullYear());
const GOLD = "#FFD030";

// Numbers up to this are drawn as blocks; bigger ones as one solid rectangle.
const BLOCK_LIMIT = 100n;

// How much factoring to try on the main thread (about 10 ms on a laptop)
// before handing the number to the worker.
const QUICK_FACTOR_STEPS = 30_000;

// Rows of blocks wear the Numberblocks colors: row 1 red, row 2 orange, …,
// and row 10 is Ten's white.
const ROW_COLORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => NB_DIGIT_TEXT[d]);
// The rainbow of row colors filling a big rectangle (white would wash it out).
const BAND_COLORS = ROW_COLORS.slice(0, 9);

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const superscript = (n) => [...String(n)].map((d) => SUPERSCRIPTS[d]).join("");

// Mersenne primes (2ⁿ − 1) up to MAX_NUMBER, with their n.
const MERSENNE = {
  "3": 2, "7": 3, "31": 5, "127": 7, "8191": 13, "131071": 17, "524287": 19,
  "2147483647": 31, "2305843009213693951": 61,
};
const MILESTONE_PRIMES = {
  "7919": "1,000th", "104729": "10,000th", "1299709": "100,000th", "15485863": "millionth",
};

function formatNumber(n, useCommas) {
  return useCommas ? n.toLocaleString("en-US") : String(n);
}

function ordinalSuffix(k) {
  const tens = k % 100;
  if (tens >= 11 && tens <= 13) return "th";
  return ["th", "st", "nd", "rd"][k % 10] ?? "th";
}

const isPalindrome = (s) => s.length > 1 && s === [...s].reverse().join("");

function analyze(input) {
  if (input === "") return null;
  const n = BigInt(input);
  const prime = isPrime(n);
  return {
    n,
    prime,
    next: nextPrime(n),
    prev: prevPrime(n),
    index: prime ? primeIndex(n) : null,
    // null when the number needs the worker
    factors: n < 2n ? [] : prime ? [[n, 1]] : factorize(n, QUICK_FACTOR_STEPS),
  };
}

function getFunFact(input, info) {
  switch (input) {
    case "": return null;
    case "0": return "🤔 Zero is not prime!";
    case "1": return "☝️ People once counted 1 as prime!";
    case "2": return "✌️ 2 is the only even prime!";
    case "4": return "🧱 4 is the smallest composite number!";
    case "5": return "👯 5 has two twins: 3 and 7!";
    case "97": return "💯 The biggest prime under 100!";
    case "100": return "💯 There are 25 primes up to 100!";
    case "101": return "🎉 The first prime after 100!";
    case "997": return "🏆 The biggest prime under 1,000!";
    case "1000": return "🔢 There are 168 primes up to 1,000!";
    case "999983": return "🏆 The biggest prime under a million!";
    case "1000000": return "🔢 78,498 primes up to a million!";
  }
  const { n, prime, next } = info;
  if (input === THIS_YEAR) return prime ? "📅 This year is prime!" : `📅 The next prime year is ${next}!`;
  if (MILESTONE_PRIMES[input]) return `🏆 The ${MILESTONE_PRIMES[input]} prime!`;
  if (n === MAX_NUMBER) return "🏁 The biggest number here!";
  if (!prime) return null;
  if (next === null) return "🏆 The biggest prime here!";
  if (MERSENNE[input]) return `✨ 2${superscript(MERSENNE[input])} − 1 — a Mersenne prime!`;
  if (isPalindrome(input)) return "🪞 A palindrome prime — same both ways!";
  const twin = isPrime(n + 2n) ? n + 2n : isPrime(n - 2n) ? n - 2n : null;
  if (twin === null) return null;
  if (n >= 1_000_000n) return "👯 A twin prime — its twin is 2 away!";
  const [a, b] = twin > n ? [n, twin] : [twin, n];
  return `👯 Twin primes: ${a.toLocaleString("en-US")} and ${b.toLocaleString("en-US")}!`;
}

// ── Worker Factoring ─────────────────────────────────────────────────────────
//
// A number whose prime factors are all big can take a second or more to split
// up, so it goes to a worker. A new number terminates the old worker.

function useWorkerFactors(input, needed) {
  const [result, setResult] = useState({ input: null, factors: null });

  useEffect(() => {
    if (!needed) return;
    const worker = new Worker(new URL("./factorWorker.js", import.meta.url), { type: "module" });
    worker.onmessage = (e) => setResult({ input, factors: e.data });
    // No worker (very old browser): do it here instead.
    worker.onerror = () => setResult({ input, factors: factorize(BigInt(input)) });
    worker.postMessage(BigInt(input));
    return () => worker.terminate();
  }, [input, needed]);

  return result.input === input ? result.factors : null;
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

// The 25 primes under 100, shown before a number is typed.
function PrimeKey({ onPick }) {
  return (
    <div style={styles.key}>
      {PRIMES_UNDER_100.map((p) => (
        <NumberTile
          key={p} value={BigInt(p)} label={p}
          style={styles.keyTile}
          onClick={() => onPick(String(p))}
        />
      ))}
    </div>
  );
}

// ── Pictures ─────────────────────────────────────────────────────────────────
//
// The number as blocks lined up in equal rows. Any number can make one long
// line, but only a composite number can make a rectangle.

const BLOCK = 10; // viewBox units
const BLOCK_GAP = 2;
const MAX_BLOCK_PX = 30;

function BlockRectangle({ rows, cols, prime }) {
  const step = BLOCK + BLOCK_GAP;
  const w = cols * step - BLOCK_GAP;
  const h = rows * step - BLOCK_GAP;
  const blocks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      blocks.push(
        <rect
          key={`${r}-${c}`}
          x={c * step} y={r * step} width={BLOCK} height={BLOCK} rx={2}
          fill={prime ? GOLD : ROW_COLORS[r % ROW_COLORS.length]}
        />
      );
    }
  }
  const scale = MAX_BLOCK_PX / BLOCK;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{
      maxWidth: w * scale, maxHeight: h * scale, overflow: "visible",
      filter: prime ? "drop-shadow(0 0 5px rgba(255,208,48,0.6))" : "none",
    }}>
      {blocks}
    </svg>
  );
}

// Too many blocks to draw, so a solid rectangle: not to scale, just squat
// enough to fit — and a prime's single row stays a thin line.
function BigRectangle({ rows, cols, prime }) {
  const ratio = prime ? 24 : Math.min(Number(cols) / Number(rows), 6);
  const w = 100 * ratio;
  const h = 100;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{
      maxWidth: 3 * w, maxHeight: 3 * h, overflow: "visible",
      filter: prime ? "drop-shadow(0 0 5px rgba(255,208,48,0.6))" : "none",
    }}>
      <defs>
        <linearGradient id="rowColors" x1="0" y1="0" x2="0" y2="1">
          {BAND_COLORS.map((c, i) => <stop key={i} offset={i / (BAND_COLORS.length - 1)} stopColor={c} />)}
        </linearGradient>
      </defs>
      <rect width={w} height={h} rx={prime ? 50 : 8} fill={prime ? GOLD : "url(#rowColors)"} />
    </svg>
  );
}

function pictureCaption(n, rows, cols, prime, fmt) {
  if (n === 1n) return "Just 1 block";
  let text = `${fmt(rows)} ${rows === 1n ? "row" : "rows"} of ${fmt(cols)}`;
  if (prime) text += " — just a line!";
  else if (rows === cols) text += " — a square!";
  return text;
}

// ── Settings Content ─────────────────────────────────────────────────────────

function PrimeSettings({ show, onClose, usePowers, setUsePowers, useCommas, setUseCommas }) {
  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={usePowers}
        onChange={() => setUsePowers(p => !p)}
        label="Group repeated primes as powers"
        hint={`e.g. ${usePowers ? "2³ × 3 → 2 × 2 × 2 × 3" : "2 × 2 × 2 × 3 → 2³ × 3"}`}
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
          A prime number can only be made by multiplying 1 × itself. Line up 6 blocks and you
          can make 2 rows of 3 — but 7 blocks only ever make one long line. So 7 is prime, and
          6 isn’t.
        </SettingsAboutText>
        <SettingsAboutText>
          Numbers bigger than 1 that aren’t prime are called composite. Every composite number
          is made by multiplying primes together: 12 = 2 × 2 × 3. That’s why primes are called
          the building blocks of numbers!
        </SettingsAboutText>
        <SettingsAboutText>
          1 isn’t prime: a prime has exactly two factors, 1 and itself, and 1 only has one.
          And 2 is the only even prime — every other even number can be split into 2 rows.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who absolutely loves numbers — so he can check whether any number
          is prime, all the way up to nearly a septillion.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Big numbers are checked with the{" "}
          <SettingsLink href="https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test">
            Miller–Rabin test
          </SettingsLink>
          {" "}and split into primes with{" "}
          <SettingsLink href="https://en.wikipedia.org/wiki/Pollard%27s_rho_algorithm">
            Pollard’s rho
          </SettingsLink>
          .
        </SettingsAboutText>
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

export default function PrimeChecker() {
  const [input, setInput] = useState("");
  const [bounce, setBounce] = useState(null);
  const [numberFlash, setNumberFlash] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [pick, setPick] = useState({ input: "", index: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [usePowers, setUsePowers] = useState(false);
  const [useCommas, setUseCommas] = useState(true);
  const numberOuterRef = useRef(null);
  const numberInnerRef = useRef(null);
  const partsOuterRef = useRef(null);
  const partsInnerRef = useRef(null);

  const info = useMemo(() => analyze(input), [input]);
  const workerFactors = useWorkerFactors(input, info !== null && info.factors === null);
  const factors = info?.factors ?? workerFactors;

  const isEmpty = info === null;
  const n = info?.n ?? null;
  const prime = info?.prime ?? false;
  const isComposite = n !== null && n > 1n && !prime;
  const next = info ? info.next : 2n;
  const prev = info ? info.prev : null;
  const atMax = n === MAX_NUMBER;
  const isFull = input.length >= MAX_DIGITS;
  const funFact = useMemo(() => getFunFact(input, info), [input, info]);

  // Every rectangle the blocks can make, most square first; a tap on the
  // picture steps to the next one.
  const sides = useMemo(
    () => (n !== null && n >= 1n && factors ? rectangleSides(n, factors) : []),
    [n, factors],
  );
  const sideIndex = pick.input === input && pick.index < sides.length ? pick.index : 0;
  const rows = sides[sideIndex] ?? null;
  const cols = rows !== null ? n / rows : null;

  const fmt = (v) => formatNumber(v, useCommas);
  const numberText = isEmpty ? "?" : fmt(n);
  const numberFontSize = useAutoFitFontSize(numberOuterRef, numberInnerRef, numberText.length, {
    maxFont: 42, minFont: 14,
  });

  // Prime factors as tiles: 2 × 2 × 3, or 2² × 3 with powers on.
  const tiles = isComposite && factors
    ? factors.flatMap(([p, power]) => (usePowers
      ? [{ value: p, label: fmt(p) + (power > 1 ? superscript(power) : "") }]
      : Array.from({ length: power }, () => ({ value: p, label: fmt(p) }))))
    : [];
  const partsCharCount = tiles.reduce((sum, t) => sum + t.label.length + 3, 0);
  const partsFontSize = useAutoFitFontSize(partsOuterRef, partsInnerRef, partsCharCount, {
    maxFont: 18, minFont: 12, fitKey: `${input}|${usePowers}|${useCommas}|${!!factors}`,
  });

  // Long factor lists scroll — start each new number back at the top.
  useEffect(() => {
    if (partsOuterRef.current) partsOuterRef.current.scrollTop = 0;
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

  const handlePlusOne = () => {
    if (atMax) return;
    setInput(String((n ?? 0n) + 1n));
    triggerFlash();
  };

  const handleMinusOne = () => {
    if (isEmpty || n === 0n) return;
    setInput(String(n - 1n));
    triggerFlash();
  };

  const handlePrevPrime = () => {
    if (prev === null) return;
    setInput(String(prev));
    pressed("prev");
  };

  const handleNextPrime = () => {
    if (next === null) return;
    setInput(String(next));
    pressed("next");
  };

  // Try the next rectangle — a prime (or 1) only wiggles, since there isn't one.
  const handlePictureTap = () => {
    if (sides.length > 1) {
      setPick({ input, index: (sideIndex + 1) % sides.length });
    } else if (rows !== null) {
      setNudge(true);
      setTimeout(() => setNudge(false), 400);
    }
  };

  const plural = (k, word) => `${fmt(k)} ${word}${k === 1 ? "" : "s"}`;
  let secondaryText = "the primes under 100";
  if (n === 0n) secondaryText = "every number is a factor";
  else if (n !== null && factors) {
    const count = plural(factorCount(factors), "factor");
    secondaryText = info.index ? `${fmt(info.index)}${ordinalSuffix(info.index)} prime · ${count}` : count;
  } else if (n !== null) secondaryText = "finding factors…";

  let pictureHint = null;
  if (sides.length > 1) pictureHint = `Tap for another way · ${fmt(sideIndex + 1)} of ${fmt(sides.length)}`;
  else if (prime) pictureHint = "A prime can’t make a rectangle!";

  const shortPrime = n !== null && n < 10_000_000n;

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
        @keyframes primeGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(255,208,48,0.35), inset 0 2px 0 rgba(255,255,255,0.35); }
          50% { box-shadow: 0 0 22px rgba(255,208,48,0.7), inset 0 2px 0 rgba(255,255,255,0.35); }
        }
        @keyframes thinking {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.9; }
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
        title="Prime Checker"
        subtitle="Is your number prime?"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <PrimeSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        usePowers={usePowers}
        setUsePowers={setUsePowers}
        useCommas={useCommas}
        setUseCommas={setUseCommas}
      />

      {/* Display Area */}
      <div className="frosted-card" style={styles.displayCard}>
        <div ref={numberOuterRef} style={styles.numberOuter}>
          <div ref={numberInnerRef} style={{
            ...styles.numberInner,
            fontSize: numberFontSize,
            color: isEmpty ? "rgba(255,255,255,0.3)" : GOLD,
            animation: numberFlash ? "flash 0.3s ease-out" : "none",
          }}>
            {numberText}
          </div>
        </div>

        <div style={styles.verdictRow}>
          {isEmpty ? (
            <span style={styles.verdictAsk}>Is it prime?</span>
          ) : (
            <span key={input} style={{
              ...styles.verdict,
              ...(prime ? styles.verdictPrime : styles.verdictNot),
            }}>
              {prime ? "✨ PRIME! ✨" : "NOT PRIME"}
            </span>
          )}
        </div>
        <div style={styles.secondaryRow}>
          <span style={styles.secondaryLabel}>{secondaryText}</span>
        </div>

        <div
          style={{ ...styles.pictureOuter, cursor: rows !== null ? "pointer" : "default" }}
          onClick={handlePictureTap}
          role={rows !== null ? "button" : undefined}
          aria-label={rows !== null ? "Line the blocks up another way" : undefined}
        >
          {isEmpty && <PrimeKey onPick={(p) => { setInput(p); triggerFlash(); }} />}
          {n === 0n && <span style={styles.pictureNote}>No blocks at all!</span>}
          {n !== null && n > 0n && rows === null && (
            <span style={{ ...styles.pictureNote, animation: "thinking 1.2s ease-in-out infinite" }}>
              Splitting it up…
            </span>
          )}
          {rows !== null && (
            <>
              <div style={{ ...styles.pictureShake, animation: nudge ? "shake 0.4s ease-out" : "none" }}>
                <div key={`${input}|${sideIndex}`} style={styles.picture}>
                  {n <= BLOCK_LIMIT
                    ? <BlockRectangle rows={Number(rows)} cols={Number(cols)} prime={prime} />
                    : <BigRectangle rows={rows} cols={cols} prime={prime} />}
                </div>
              </div>
              <div style={styles.caption}>{pictureCaption(n, rows, cols, prime, fmt)}</div>
              {pictureHint && <div style={styles.pictureHint}>{pictureHint}</div>}
            </>
          )}
        </div>

        <div ref={partsOuterRef} style={styles.partsOuter}>
          {isEmpty && <span style={styles.partsHint}>Tap a prime, or type any number below!</span>}
          {n === 0n && <span style={styles.partsHint}>Zero isn’t prime — zero times anything is zero!</span>}
          {n === 1n && <span style={styles.partsHint}>1 isn’t prime — a prime has exactly 2 factors</span>}
          {prime && (
            <span style={styles.partsHint}>
              Only 1 × {shortPrime ? fmt(n) : "itself"} makes {shortPrime ? fmt(n) : "it"} — it can’t be split up!
            </span>
          )}
          {isComposite && !factors && <span style={styles.partsHint}>Splitting it into primes…</span>}
          {tiles.length > 0 && (
            <div ref={partsInnerRef} style={{ ...styles.partsInner, fontSize: partsFontSize }}>
              <div style={styles.partsLabel}>made from primes</div>
              <div style={styles.tileRow}>
                {tiles.map((t, i) => (
                  <span key={i} style={styles.tileGroup}>
                    {i > 0 && <span style={styles.times}>×</span>}
                    <NumberTile value={t.value} label={t.label} />
                  </span>
                ))}
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
        <button className="toy-btn pm-btn" disabled={isEmpty || n === 0n} style={{
          background: "linear-gradient(135deg, #E41E20, #FF8C1A)",
          boxShadow: "0 4px 12px rgba(228,30,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: isEmpty || n === 0n ? 0.35 : 1,
        }} onClick={handleMinusOne}>
          − 1
        </button>
        <button className="toy-btn pm-btn" disabled={atMax} style={{
          background: "linear-gradient(135deg, #3A8FDE, #9B59B6)",
          boxShadow: "0 4px 12px rgba(58,143,222,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: atMax ? 0.35 : 1,
        }} onClick={handlePlusOne}>
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
        <button className="toy-btn nb-btn" disabled={prev === null} aria-label="Previous prime" style={{
          ...styles.jumpBtn,
          animation: bounce === "prev" ? "btnPress 0.2s ease-out" : "none",
          opacity: prev === null ? 0.35 : 1,
        }} onClick={handlePrevPrime}>
          <svg width="18" height="18" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M7.5 1 L2 5 L7.5 9 Z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" />
          </svg>
          <span style={styles.jumpLabel}>prime</span>
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
        <button className="toy-btn nb-btn" disabled={next === null} aria-label="Next prime" style={{
          ...styles.jumpBtn,
          animation: bounce === "next" ? "btnPress 0.2s ease-out" : "none",
          opacity: next === null ? 0.35 : 1,
        }} onClick={handleNextPrime}>
          <svg width="18" height="18" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2.5 1 L8 5 L2.5 9 Z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" />
          </svg>
          <span style={styles.jumpLabel}>prime</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  displayCard: {
    padding: "12px 14px",
    width: "100%", maxWidth: 380, height: 392,
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  numberOuter: {
    height: 46, flexShrink: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  numberInner: {
    fontWeight: 700, textAlign: "center",
    wordBreak: "break-all", maxWidth: "100%",
  },
  verdictRow: {
    height: 42, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  verdictAsk: {
    fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.3)",
  },
  verdict: {
    fontSize: 20, fontWeight: 700, letterSpacing: 1,
    padding: "6px 18px", borderRadius: 999, lineHeight: 1.2,
    whiteSpace: "nowrap",
  },
  verdictPrime: {
    background: "linear-gradient(135deg, #FFD030, #FF8C1A)",
    color: "#3A2200", textShadow: "0 1px 0 rgba(255,255,255,0.35)",
    animation: "popIn 0.35s ease-out, primeGlow 1.6s ease-in-out 0.35s infinite",
  },
  verdictNot: {
    background: "rgba(255,255,255,0.12)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.85)",
    animation: "popIn 0.35s ease-out",
  },
  secondaryRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: 18, marginBottom: 8, flexShrink: 0,
  },
  secondaryLabel: {
    fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-body)",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  pictureOuter: {
    flex: 1, minHeight: 0,
    background: "rgba(0,0,0,0.15)", borderRadius: 10,
    marginBottom: 8, overflow: "hidden",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "10px 10px 6px",
  },
  pictureShake: {
    flex: 1, minHeight: 0, width: "100%", display: "flex",
  },
  picture: {
    flex: 1, minWidth: 0, minHeight: 0,
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
    display: "flex", flexWrap: "wrap", justifyContent: "center",
    gap: 6, maxWidth: 320,
  },
  keyTile: { minWidth: 36, fontSize: 16, padding: "5px 0" },
  tile: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap",
    borderRadius: "0.45em", padding: "0.3em 0.45em",
  },
  partsOuter: {
    height: 80, flexShrink: 0,
    background: "rgba(255,255,255,0.05)", borderRadius: 10,
    overflowX: "hidden", overflowY: "auto", padding: "6px 8px",
    display: "flex", flexDirection: "column",
  },
  partsHint: {
    margin: "auto 0", fontSize: 14, color: "rgba(255,255,255,0.5)",
    fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  partsInner: {
    // Auto margins center the tiles, but unlike align-items they fall back to
    // the top when the tiles overflow, so the scroll can reach the first row.
    margin: "auto 0", width: "100%",
  },
  partsLabel: {
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
  times: {
    color: "rgba(255,255,255,0.45)", fontWeight: 600,
    margin: "0 0.3em", lineHeight: 1,
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
  // Gold on deep purple, like a gem
  jumpBtn: {
    background: "linear-gradient(135deg, #6E3FA0, #3F51B5)",
    border: `3px solid ${GOLD}`,
    boxShadow: "0 5px 14px rgba(110,63,160,0.45), inset 0 2px 0 rgba(255,255,255,0.2)",
    color: GOLD, flexDirection: "column", gap: 4,
  },
  jumpLabel: {
    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12,
    letterSpacing: 1, textTransform: "uppercase", lineHeight: 1,
  },
};
