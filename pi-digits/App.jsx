import { useState, useRef, useEffect } from "react";
import { computePiString, MAX_DIGITS } from "./piDigits.js";
import { NB_SOLID, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { Toast } from "../shared/Toast.jsx";

const MAX_INPUT_LEN = String(MAX_DIGITS).length;

// Digits computed synchronously up front so small, common requests are instant
// (no worker round-trip, no "computing…" flash). ~2 ms.
const BASELINE = 2000;

// Numberblocks-inspired color for each single digit 0–9. Zero has no
// Numberblocks color of its own, so it gets a clean white.
const DIGIT_COLORS = {
  0: "#FFFFFF",
  1: "#E41E20", 2: "#FF8C1A", 3: "#FFD030", 4: "#4AAF4E",
  5: "#29B6A8", 6: "#5C6BC0", 7: "#9B59B6", 8: "#D6268E", 9: "#B0B0B0",
};

function getFunFact(n) {
  if (n === 1) return "🥧 Just 3 — the whole-number part of π!";
  if (n === 3) return "🎉 3.14 — that's Pi Day, March 14th!";
  if (n === 5) return "✨ Five digits of π!";
  if (n === 10) return "🔟 Ten digits of π!";
  if (n === 100) return "💯 One hundred digits!";
  if (n === 314) return "🥧 Digit 314 — very pi!";
  if (n === 1000) return "🌟 One thousand digits!";
  if (n === 10000) return "🚀 Ten thousand digits!";
  if (n === 100000) return "🌌 A hundred thousand digits!";
  if (n === MAX_DIGITS) return "🏆 One MILLION digits of π!";
  return null;
}

// ── Full-Number Grid (virtualized) ─────────────────────────────────────────────
//
// Renders the decimal digits in fixed rows with a place-number gutter. Only the
// rows in view are mounted, so even a million colored digits scroll smoothly.

const FONT = 18;
const ROW_H = 30;
const GUTTER = 58;
const GROUP = 10;
const GAP = 10;

function renderRow(chunk, colorize, group) {
  if (!group) {
    return [...chunk].map((ch, j) => (
      <span key={j} style={{ color: colorize ? DIGIT_COLORS[+ch] : "rgba(255,255,255,0.72)" }}>{ch}</span>
    ));
  }
  const groups = [];
  for (let i = 0; i < chunk.length; i += GROUP) {
    const grp = chunk.slice(i, i + GROUP);
    groups.push(
      <span key={i} style={{ marginRight: GAP }}>
        {[...grp].map((ch, j) => (
          <span key={j} style={{ color: colorize ? DIGIT_COLORS[+ch] : "rgba(255,255,255,0.72)" }}>{ch}</span>
        ))}
      </span>
    );
  }
  return groups;
}

function PiGrid({ value, count, colorize, group }) {
  const scrollRef = useRef(null);
  const [perRow, setPerRow] = useState(30);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(300);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const charW = FONT * 0.62;
      const avail = el.clientWidth - GUTTER - 12;
      const perGroupW = GROUP * charW + (group ? GAP : 0);
      const groups = Math.max(1, Math.floor((avail + (group ? GAP : 0)) / perGroupW));
      setPerRow(groups * GROUP);
      setViewH(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [group]);

  // Reset scroll to top whenever the number changes so the user sees the start.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [count]);

  const decimals = count > 1 ? value.slice(1, count) : "";
  const total = decimals.length;
  const rows = Math.ceil(total / perRow);
  // Row 0 is the leading "3." so the number reads top-to-bottom as one string;
  // the decimal rows sit beneath it (shifted down by one row).
  const totalH = (rows + 1) * ROW_H;

  const overscan = 4;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_H) - 1 - overscan);
  const endRow = Math.min(rows, Math.ceil((scrollTop + viewH) / ROW_H) + overscan);

  const visible = [];
  for (let r = startRow; r < endRow; r++) {
    const from = r * perRow;
    visible.push(
      <div key={r} style={{ ...grid.row, top: (r + 1) * ROW_H }}>
        <span style={grid.idx}>{(from + 1).toLocaleString()}</span>
        <span style={grid.digits}>{renderRow(decimals.slice(from, from + perRow), colorize, group)}</span>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={grid.scroller}
    >
      <div style={{ height: totalH, position: "relative" }}>
        {/* Leading integer part, aligned above the decimals so it reads "3.1415…" */}
        <div style={{ ...grid.row, top: 0 }}>
          <span style={grid.idx} />
          <span style={{ ...grid.digits, color: "#FFD030", fontWeight: 700 }}>3.</span>
        </div>
        {visible}
      </div>
    </div>
  );
}

// ── Full-Number Display ────────────────────────────────────────────────────────

function FullNumberDisplay({ count, value, ready, colorize, group }) {
  return (
    <div className="frosted-card" style={styles.displayCard}>
      <div style={styles.fullHeader}>
        <span style={styles.headLabel}>π to</span>
        <span style={styles.headCount}>{count.toLocaleString()}</span>
        <span style={styles.headLabel}>{count === 1 ? "digit" : "digits"}</span>
      </div>
      {count === 0 && (
        <div style={styles.fullEmpty}>
          <span style={styles.lead3}>3.14159…</span>
          <span style={styles.emptyHint}>Type how many digits below</span>
        </div>
      )}
      {count === 1 && (
        <div style={styles.fullEmpty}>
          <span style={styles.lead3}>3</span>
          <span style={styles.emptyHint}>Just the 3 so far — add more digits!</span>
        </div>
      )}
      {count > 1 && !ready && (
        <div style={styles.fullEmpty}>
          <span style={{ ...styles.emptyHint, animation: "softPulse 1.4s ease-in-out infinite" }}>
            Computing {(count - 1).toLocaleString()} decimal places…
          </span>
        </div>
      )}
      {count > 1 && ready && (
        <PiGrid value={value} count={count} colorize={colorize} group={group} />
      )}
    </div>
  );
}

// ── Settings Content ─────────────────────────────────────────────────────────

function PiSettings({ show, onClose, colorize, setColorize, group, setGroup }) {
  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={colorize}
        onChange={() => setColorize(c => !c)}
        label="Color the digits"
        hint="Each digit 0–9 gets its Numberblocks color"
      />

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={group}
          onChange={() => setGroup(g => !g)}
          label="Space digits into groups of ten"
          hint={group ? "1415926535 8979323846 …" : "14159265358979323846 …"}
        />
      </div>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          π (pi) is the number you get when you divide the distance around a
          circle by the distance across it. Its digits go on forever and never
          settle into a repeating pattern — so there's always another one to find.
        </SettingsAboutText>
        <SettingsAboutText>
          Made for my son, who loves numbers and wanted to see just how many
          digits of π we could show — all the way up to a million.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          The digits are computed live with the{" "}
          <SettingsLink href="https://en.wikipedia.org/wiki/Chudnovsky_algorithm">
            Chudnovsky algorithm
          </SettingsLink>
          {" "}(binary splitting), inspired by the{" "}
          <SettingsLink href="https://www.exeter.ac.uk/research-centres/quantum-systems-and-nanomaterials/pi/">
            million digits of π
          </SettingsLink>
          {" "}from the University of Exeter.
        </SettingsAboutText>
        <SettingsAboutText>
          Digit colors based on the{" "}
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

export default function PiDigits() {
  const [input, setInput] = useState("");
  const [bounce, setBounce] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [colorize, setColorize] = useState(true);
  const [group, setGroup] = useState(true);

  // Longest run of π computed so far. Seeded synchronously so small requests
  // are instant; grows via the worker for large ones.
  const [piCache, setPiCache] = useState(() => ({
    count: BASELINE,
    value: computePiString(BASELINE),
  }));

  const workerRef = useRef(null);
  const reqIdRef = useRef(0);
  const debounceRef = useRef(null);

  const count = input === "" ? 0 : Math.min(parseInt(input, 10), MAX_DIGITS);
  const funFact = getFunFact(count);
  const atMax = count >= MAX_DIGITS;
  const atMin = count <= 0;
  const hasContent = count > 0;
  const ready = count <= piCache.count;

  // Spin up the compute worker once.
  useEffect(() => {
    const worker = new Worker(new URL("./piWorker.js", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      const { reqId, digits, value } = e.data;
      if (reqId !== reqIdRef.current) return; // ignore stale results
      setPiCache({ count: digits, value });
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  // Ask the worker to extend the cache when the request outgrows it (debounced
  // so typing toward a big number doesn't fire a compute for every keystroke).
  useEffect(() => {
    if (count <= piCache.count) return;
    clearTimeout(debounceRef.current);
    const id = ++reqIdRef.current;
    const target = count;
    debounceRef.current = setTimeout(() => {
      workerRef.current?.postMessage({ reqId: id, digits: target });
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [count, piCache.count]);

  const handleDigit = (d) => {
    if (atMax) return;
    const next = input + d;
    if (next.length > MAX_INPUT_LEN) return;
    const val = parseInt(next, 10);
    setInput(val > MAX_DIGITS ? String(MAX_DIGITS) : String(val));
    setBounce(d);
    setTimeout(() => setBounce(null), 200);
  };

  const handleBackspace = () => {
    if (!hasContent) return;
    setInput(input.slice(0, -1));
  };

  const handleClear = () => {
    if (!hasContent) return;
    setInput("");
  };

  const handlePlusOne = () => {
    if (atMax) return;
    setInput(String(Math.min(count + 1, MAX_DIGITS)));
  };

  const handleMinusOne = () => {
    if (atMin) return;
    const next = count - 1;
    setInput(next <= 0 ? "" : String(next));
  };

  return (
    <div className="toy-container" style={{ justifyContent: "flex-start" }}>
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
        @keyframes softPulse { 0%,100% { opacity: 0.45; } 50% { opacity: 1; } }
        .nb-btn {
          width: 100%; aspect-ratio: 1.4;
          border-radius: 18px; font-size: 30px;
        }
        .pm-btn { font-size: 26px; padding: 12px 0; }
      `}</style>

      <BackgroundDots count={20} />

      <StickyHeader
        title="Pi Digits"
        subtitle="How many digits of π?"
        onGearClick={() => setShowSettings(true)}
      />

      <PiSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        colorize={colorize}
        setColorize={setColorize}
        group={group}
        setGroup={setGroup}
      />

      {/* The full number, scrollable, up top */}
      <FullNumberDisplay count={count} value={piCache.value} ready={ready} colorize={colorize} group={group} />

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
        <button className="toy-btn pm-btn" disabled={atMin} style={{
          background: "linear-gradient(135deg, #E41E20, #FF8C1A)",
          boxShadow: "0 4px 12px rgba(228,30,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: atMin ? 0.35 : 1,
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
        <button className="toy-btn pm-btn" disabled={!hasContent} style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 16, letterSpacing: 1,
          color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
          flex: 1,
        }} onClick={handleClear}>
          CLR
        </button>
        <button className="toy-btn pm-btn" disabled={!hasContent} style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          fontSize: 26,
          color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
          flex: 1,
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
            <button key={d} className="toy-btn nb-btn" disabled={atMax} style={{
              background: style.background,
              border: hasBorder ? `3px solid ${style.border}` : undefined,
              boxShadow: hasBorder
                ? `0 5px 14px ${style.border}40, inset 0 2px 0 rgba(255,255,255,0.5)`
                : `0 5px 14px ${NB_SOLID[String(d)]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
              color: hasBorder ? style.border : undefined,
              textShadow: hasBorder ? "none" : undefined,
              animation: bounce === String(d) && !atMax ? "btnPress 0.2s ease-out" : "none",
              opacity: atMax ? 0.35 : 1,
            }} onClick={() => handleDigit(String(d))}>
              {d}
            </button>
          );
        })}
        <button className="toy-btn nb-btn" disabled={atMax} style={{
          background: "#FFFFFF",
          border: "3px solid #E41E20",
          boxShadow: "0 5px 14px rgba(228,30,32,0.25), inset 0 2px 0 rgba(255,255,255,0.5)",
          color: "#E41E20", textShadow: "none",
          animation: bounce === "0" && !atMax ? "btnPress 0.2s ease-out" : "none",
          opacity: atMax ? 0.35 : 1,
          gridColumn: 2,
        }} onClick={() => handleDigit("0")}>
          0
        </button>
      </div>
    </div>
  );
}

const styles = {
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
  displayCard: {
    width: "100%", maxWidth: 460,
    padding: "12px 14px", position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  fullHeader: {
    display: "flex", alignItems: "baseline", justifyContent: "center",
    marginBottom: 10, gap: 10,
  },
  headLabel: {
    fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-body)", fontWeight: 600,
  },
  headCount: {
    fontSize: 34, fontWeight: 700, lineHeight: 1,
    fontFamily: "'Fredoka', sans-serif",
    background: "linear-gradient(135deg, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  fullEmpty: {
    height: 300, borderRadius: 10, background: "rgba(0,0,0,0.18)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 14,
  },
  lead3: {
    fontSize: 64, fontWeight: 700, color: "#FFD030",
    fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
  },
  emptyHint: {
    fontSize: 15, color: "rgba(255,255,255,0.4)",
    fontFamily: "var(--font-body)", textAlign: "center", padding: "0 16px",
  },
};

const grid = {
  scroller: {
    width: "100%", height: 300,
    overflowY: "auto", overflowX: "hidden",
    background: "rgba(0,0,0,0.18)", borderRadius: 10,
    padding: "4px 0",
  },
  row: {
    position: "absolute", left: 0, right: 0, height: ROW_H,
    display: "flex", alignItems: "center", gap: 8,
    padding: "0 10px",
  },
  idx: {
    width: GUTTER - 18, flexShrink: 0, textAlign: "right",
    fontSize: 11, color: "rgba(255,255,255,0.28)",
    fontFamily: "monospace",
  },
  digits: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: FONT, fontWeight: 500, letterSpacing: 0.5,
    whiteSpace: "nowrap", overflow: "hidden",
  },
};
