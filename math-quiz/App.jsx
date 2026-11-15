// ── Math Quiz ──
// A quiz of little sums. It opens on a choice of five big buttons — + − × ÷ and
// 🎲 for a mix — then asks questions one at a time, each with four answers to
// tap. A gold star for every one got right first go; ten questions make a round.
// The 💡 shows the question as blocks to count, and comes out by itself after a
// wrong answer.
//
// The questions, answers and blocks are worked out in quiz.js; this file draws
// them. Exports the toy's App component.

import { useState, useEffect, useRef } from "react";
import {
  LEVELS, DEFAULT_LEVEL, MAX_TOTAL, RANDOM, OP_INFO,
  makeQuestion, makeChoices, blocksFor, sayQuestion,
} from "./quiz.js";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { useSpeech } from "../shared/useSpeech.js";
import { NumberTile } from "../shared/NumberTile.jsx";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsDivider, SettingsSection, SettingsAboutText, NumberblocksWord,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";

const ROUND_LENGTH = 10;

// How long a right answer stays up before the next question.
const NEXT_QUESTION_MS = 1300;

// Each kind of question has its own color, on its button and on its sign in the
// question. `text` is a lighter shade that reads on the dark card.
const MODES = [
  { id: "add", picture: "+", name: OP_INFO.add.name, colors: ["#3DAA4A", "#29B6A8"], text: "#6FDB7C" },
  { id: "sub", picture: "−", name: OP_INFO.sub.name, colors: ["#FF8C1A", "#E41E20"], text: "#FF9F45" },
  { id: "mul", picture: "×", name: OP_INFO.mul.name, colors: ["#3A8FDE", "#3F51B5"], text: "#6CB4F0" },
  { id: "div", picture: "÷", name: OP_INFO.div.name, colors: ["#9B59B6", "#D6268E"], text: "#D58CF0" },
  {
    id: RANDOM, picture: "🎲", name: "Random", subtitle: "A bit of everything!",
    colors: ["#E41E20", "#FF8C1A", "#FFD030", "#4AAF4E", "#3A8FDE", "#9B59B6"],
  },
];
const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m]));

const modeBackground = (m) => ({
  background: `linear-gradient(135deg, ${m.colors.join(", ")})`,
  boxShadow: `0 5px 14px ${m.colors[0]}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
});

// ── Mode Menu ────────────────────────────────────────────────────────────────

// The first screen: what kind of questions?
function ModeMenu({ onPick }) {
  return (
    <div style={styles.menu}>
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`toy-btn quiz-pick${m.id === RANDOM ? " quiz-pick-wide" : ""}`}
          style={modeBackground(m)}
          onClick={() => onPick(m.id)}
        >
          <span aria-hidden="true">{m.picture}</span>
          <span style={styles.pickName}>{m.name}</span>
        </button>
      ))}
    </div>
  );
}

// The same five buttons, small, above the question — the one being played is
// lit, and tapping another swaps to it.
function ModeStrip({ mode, onPick }) {
  return (
    <div style={styles.strip}>
      {MODES.map((m) => {
        const on = m.id === mode;
        return (
          <button
            key={m.id}
            className="toy-btn quiz-tab"
            aria-label={m.name}
            aria-pressed={on}
            style={{ ...modeBackground(m), ...(on ? styles.tabOn : styles.tabOff) }}
            onClick={() => onPick(m.id)}
          >
            {m.picture}
          </button>
        );
      })}
    </div>
  );
}

// ── Stars ────────────────────────────────────────────────────────────────────

// One star per question of the round: gold for right first go, pale for right
// in the end, an outline for the ones still to come.
function Stars({ results }) {
  return (
    <div style={styles.stars} aria-label={`${results.filter(Boolean).length} gold stars`}>
      {Array.from({ length: ROUND_LENGTH }, (_, i) => {
        const done = i < results.length;
        const look = !done ? styles.starWaiting : results[i] ? styles.starGold : styles.starPale;
        return (
          <span key={`${i}|${done}`} style={{ ...look, animation: done ? "popIn 0.35s ease-out" : "none" }}>
            ★
          </span>
        );
      })}
    </div>
  );
}

// ── Question ─────────────────────────────────────────────────────────────────

// "7 + 5 = ?" as big as fits, with the answer dropping into the ? once it's
// been found.
function Equation({ question, solved }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const { op, a, b, answer } = question;
  const text = `${a}${b}${answer}`;
  const fontSize = useAutoFitFontSize(outerRef, innerRef, text.length, {
    maxFont: 56, minFont: 24, fitKey: text,
  });
  // Sized for the answer from the start, so nothing moves when it lands.
  const slotWidth = `${String(answer).length * 0.62 + 0.7}em`;

  return (
    <div ref={outerRef} style={styles.equationOuter}>
      <div
        ref={innerRef}
        style={{ ...styles.equation, fontSize }}
        aria-label={`${sayQuestion(question)} equals ${solved ? answer : "what?"}`}
      >
        <span>{a}</span>
        <span style={{ color: MODE_BY_ID[op].text }}>{OP_INFO[op].symbol}</span>
        <span>{b}</span>
        <span style={styles.equals}>=</span>
        <span style={{ ...styles.slot, width: slotWidth }}>
          {solved ? (
            <NumberTile value={BigInt(answer)} label={answer} style={styles.slotTile} />
          ) : (
            <span style={styles.slotEmpty}>?</span>
          )}
        </span>
      </div>
    </div>
  );
}

// ── Blocks ───────────────────────────────────────────────────────────────────
//
// The question as blocks to count (see blocksFor in quiz.js): two colors for
// telling groups apart, and a crossed-out space for a block taken away.

const BLOCK = 10; // viewBox units
const BLOCK_GAP = 2.5;
const HALF_GAP = 4; // extra, halfway along a row of ten
const MAX_BLOCK_PX = 26;
const BLOCK_COLORS = ["#3A8FDE", "#FFB627"];

function BlocksPicture({ blocks }) {
  const { cols, half, cells } = blocks;
  // Nothing to count: one empty space says so.
  if (!cells.length) {
    return (
      <svg viewBox="0 0 10 10" width={MAX_BLOCK_PX} height={MAX_BLOCK_PX}>
        <rect
          x={0.5} y={0.5} width={9} height={9} rx={2} fill="none"
          stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} strokeDasharray="2 1.5"
        />
      </svg>
    );
  }

  const step = BLOCK + BLOCK_GAP;
  const usedCols = Math.min(cols, cells.length);
  const split = half && usedCols > cols / 2 ? cols / 2 : Infinity;
  const w = usedCols * step - BLOCK_GAP + (split < Infinity ? HALF_GAP : 0);
  const h = Math.ceil(cells.length / cols) * step - BLOCK_GAP;
  const scale = MAX_BLOCK_PX / BLOCK;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{
      maxWidth: w * scale, maxHeight: h * scale,
    }}>
      {cells.map((cell, i) => {
        const col = i % cols;
        const x = col * step + (col >= split ? HALF_GAP : 0);
        const y = Math.floor(i / cols) * step;
        if (cell !== "gone") {
          return <rect key={i} x={x} y={y} width={BLOCK} height={BLOCK} rx={2} fill={BLOCK_COLORS[cell]} />;
        }
        return (
          <g key={i} stroke="rgba(255,120,120,0.75)" strokeWidth={0.9} strokeLinecap="round">
            <rect
              x={x + 0.5} y={y + 0.5} width={BLOCK - 1} height={BLOCK - 1} rx={2}
              fill="rgba(255,255,255,0.06)" strokeDasharray="2 1.5"
            />
            <path d={`M${x + 3} ${y + 3} l4 4 M${x + 7} ${y + 3} l-4 4`} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Round Over ───────────────────────────────────────────────────────────────

function partyPicture(stars) {
  if (stars === ROUND_LENGTH) return "🏆";
  return stars >= ROUND_LENGTH / 2 ? "🎉" : "👍";
}

function RoundOver({ stars }) {
  return (
    <div style={styles.party}>
      <span style={styles.partyPicture} aria-hidden="true">{partyPicture(stars)}</span>
      <span style={styles.partyScore} aria-label={`${stars} gold stars out of ${ROUND_LENGTH}`}>
        {stars} <span style={styles.partyStar}>★</span>
      </span>
    </div>
  );
}

// ── Settings Content ─────────────────────────────────────────────────────────

function QuizSettings({ show, onClose, level, onLevel }) {
  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsSection title="Biggest number">
        <div style={styles.levelRow}>
          {LEVELS.map((l) => (
            <NumberTile
              key={l} value={BigInt(l)} label={l}
              style={{ ...styles.levelTile, ...(l === level ? styles.levelOn : styles.levelOff) }}
              onClick={() => onLevel(l)}
            />
          ))}
        </div>
        <SettingsAboutText>
          Nothing in a question goes past this — not the numbers, not the answer, and not
          the answers to choose from.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="How It Works">
        <SettingsAboutText>
          Pick what to play — + − × ÷, or 🎲 for a bit of everything — then tap the right
          answer out of four. The little buttons along the top swap to another kind at any time.
        </SettingsAboutText>
        <SettingsAboutText>
          Get it right first go and you win a gold star. Ten questions make a round.
        </SettingsAboutText>
        <SettingsAboutText>
          Stuck? Tap the 💡 to see the question as blocks you can count. A wrong answer
          brings the blocks out too.
        </SettingsAboutText>
        <SettingsAboutText>
          Times and divide questions come from the times tables up to 10 × 10, so dividing
          always comes out exactly.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who absolutely loves numbers — so he can try sums of his own,
          with nothing bigger than {MAX_TOTAL}.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Answer button colors based on the{" "}
          <NumberblocksWord />
          {" "}characters.
        </SettingsAboutText>
      </SettingsSection>
    </SettingsOverlay>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MathQuiz() {
  const [mode, setMode] = useState(null); // null until one is picked from the menu
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [question, setQuestion] = useState(null);
  const [wrong, setWrong] = useState([]); // the wrong answers tapped so far
  const [solved, setSolved] = useState(false);
  const [results, setResults] = useState([]); // this round: was each one right first go?
  const [showBlocks, setShowBlocks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const speech = useSpeech({ lang: "en" });

  const roundDone = results.length >= ROUND_LENGTH;
  // The last right answer gets its moment before the round's score comes up.
  const finished = roundDone && !solved;
  const stars = results.filter(Boolean).length;

  // A fresh question — and a fresh round, if the last one is full.
  const ask = (nextMode, max = level) => {
    const next = makeQuestion(nextMode, max, question);
    setQuestion({ ...next, choices: makeChoices(next, max), id: (question?.id ?? 0) + 1 });
    setWrong([]);
    setSolved(false);
    if (roundDone) setResults([]);
    speech.stop();
  };

  const pickMode = (nextMode) => {
    setMode(nextMode);
    ask(nextMode);
  };

  const changeLevel = (nextLevel) => {
    setLevel(nextLevel);
    if (mode) ask(mode, nextLevel);
  };

  const choose = (n) => {
    if (solved || wrong.includes(n)) return;
    if (n === question.answer) {
      setSolved(true);
      setResults((r) => [...r, wrong.length === 0]);
    } else {
      setWrong((w) => [...w, n]);
    }
  };

  // After a right answer: on to the next question, or to the round's score.
  useEffect(() => {
    if (!solved) return;
    const timer = setTimeout(() => (roundDone ? setSolved(false) : ask(mode)), NEXT_QUESTION_MS);
    return () => clearTimeout(timer);
  }, [solved]);

  const current = mode ? MODE_BY_ID[mode] : null;
  const blocksOut = showBlocks || wrong.length > 0;

  return (
    <div className="toy-container">
      <style>{`
        .quiz-pick {
          width: 100%; aspect-ratio: 1; border-radius: 28px;
          flex-direction: column; gap: 8px;
          font-size: 130px; line-height: 1;
        }
        /* The signs are small for their font size and sit low in it, so their
           box is cut down to fit them and nudged up. */
        .quiz-pick > span:first-child {
          height: 84px; display: flex; align-items: center; transform: translateY(-9px);
        }
        .quiz-pick-wide {
          grid-column: span 2; aspect-ratio: auto; height: 104px;
          flex-direction: row; gap: 16px; font-size: 60px;
        }
        .quiz-pick-wide > span:first-child { height: auto; transform: none; }
        .quiz-tab {
          flex: 1; min-width: 0; height: 46px; border-radius: 14px;
          font-size: 28px; line-height: 1;
        }
        .quiz-round { width: 40px; height: 40px; border-radius: 50%; font-size: 20px; flex-shrink: 0; }
        .quiz-hint { width: 100%; height: 132px; border-radius: 12px; padding: 10px; }
        .quiz-again { width: 100%; height: 120px; border-radius: 28px; }
        @keyframes quizRight {
          0% { transform: scale(1); }
          45% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      <BackgroundDots count={20} />

      {/* Header */}
      <StickyHeader
        title="Math Quiz"
        subtitle={current ? current.subtitle ?? current.name : "What shall we play?"}
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <QuizSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        level={level}
        onLevel={changeLevel}
      />

      {!mode && <ModeMenu onPick={pickMode} />}

      {mode && (
        <>
          <ModeStrip mode={mode} onPick={pickMode} />

          {/* The question */}
          <div className="frosted-card" style={styles.card}>
            <div style={styles.topRow}>
              {speech.available ? (
                <button
                  className="toy-btn quiz-round"
                  aria-label="Say it"
                  disabled={finished}
                  style={{
                    ...styles.speakBtn,
                    opacity: finished ? 0.35 : 1,
                    animation: speech.speaking ? "speakPulse 0.8s ease-in-out infinite" : "none",
                  }}
                  onClick={() => (speech.speaking ? speech.stop() : speech.speak(sayQuestion(question, solved)))}
                >
                  {speech.speaking ? "⏹" : "🔊"}
                </button>
              ) : <span style={styles.topSpacer} />}
              <Stars results={results} />
              <span style={styles.topSpacer} />
            </div>

            {finished ? <RoundOver stars={stars} /> : (
              <>
                <Equation key={question.id} question={question} solved={solved} />
                <button
                  className="toy-btn quiz-hint"
                  aria-label={blocksOut ? "Hide the blocks" : "Show the blocks"}
                  style={styles.hint}
                  onClick={() => setShowBlocks(!blocksOut)}
                  // Blocks brought out by a wrong answer stay out for that question.
                  disabled={wrong.length > 0}
                >
                  {blocksOut
                    ? <BlocksPicture key={question.id} blocks={blocksFor(question)} />
                    : <span style={styles.hintBulb} aria-hidden="true">💡</span>}
                </button>
              </>
            )}
          </div>

          {/* The answers */}
          <div style={styles.answers}>
            {finished ? (
              <button
                className="toy-btn quiz-again" aria-label="Play again"
                style={styles.againBtn} onClick={() => ask(mode)}
              >
                <svg viewBox="0 0 24 24" width={64} height={64} aria-hidden="true">
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" fill="#fff" />
                </svg>
              </button>
            ) : (
              <div key={question.id} style={styles.choices}>
                {question.choices.map((n) => {
                  const isWrong = wrong.includes(n);
                  const isRight = solved && n === question.answer;
                  return (
                    <NumberTile
                      key={n} value={BigInt(n)} label={n}
                      disabled={solved || isWrong}
                      style={{
                        ...styles.choice,
                        ...(isWrong && styles.choiceWrong),
                        ...(isRight && styles.choiceRight),
                        ...(solved && !isRight && styles.choiceFaded),
                      }}
                      onClick={() => choose(n)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  menu: {
    display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12,
    width: "100%", maxWidth: 380, marginTop: 4,
    position: "relative", zIndex: 1,
    animation: "popIn 0.4s ease-out",
  },
  pickName: {
    fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500,
    letterSpacing: 0.3, opacity: 0.95,
  },
  strip: {
    display: "flex", gap: 8,
    width: "100%", maxWidth: 380, marginBottom: 12,
    position: "relative", zIndex: 1,
  },
  tabOn: { outline: "3px solid #fff", outlineOffset: -3 },
  tabOff: { opacity: 0.4, boxShadow: "none" },
  card: {
    width: "100%", maxWidth: 380, padding: "10px 12px 12px",
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column", gap: 6,
  },
  topRow: { display: "flex", alignItems: "center", gap: 6, height: 40 },
  topSpacer: { width: 40, flexShrink: 0 },
  speakBtn: {
    background: "linear-gradient(135deg, #FFD030, #FF8C1A)",
    boxShadow: "0 3px 8px rgba(255,140,26,0.3), inset 0 2px 0 rgba(255,255,255,0.3)",
  },
  stars: {
    flex: 1, minWidth: 0,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
    fontSize: "min(21px, 5vw)", lineHeight: 1, // ten stars have to fit a small phone
  },
  starGold: { color: "#FFD030", textShadow: "0 0 8px rgba(255,208,48,0.7)" },
  starPale: { color: "rgba(255,255,255,0.4)" },
  starWaiting: { color: "rgba(255,255,255,0.13)" },
  equationOuter: {
    height: 92, flexShrink: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  equation: {
    display: "inline-flex", alignItems: "center", gap: "0.28em",
    fontWeight: 700, whiteSpace: "nowrap", color: "#fff",
  },
  equals: { color: "rgba(255,255,255,0.55)" },
  slot: {
    height: "1.3em", flexShrink: 0,
    display: "inline-flex", alignItems: "stretch", justifyContent: "center",
  },
  slotEmpty: {
    flex: 1, borderRadius: "0.28em",
    border: "0.06em dashed rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
  },
  slotTile: {
    flex: 1, padding: 0, borderRadius: "0.28em",
    animation: "popIn 0.35s ease-out",
  },
  hint: {
    background: "rgba(0,0,0,0.15)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
    textShadow: "none",
  },
  hintBulb: { fontSize: 40, lineHeight: 1, opacity: 0.8 },
  party: {
    height: 230, flexShrink: 0,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
    animation: "popIn 0.4s ease-out",
  },
  partyPicture: { fontSize: 96, lineHeight: 1, animation: "float 2.4s ease-in-out infinite" },
  partyScore: { fontSize: 44, fontWeight: 700, lineHeight: 1 },
  partyStar: { color: "#FFD030", textShadow: "0 0 12px rgba(255,208,48,0.7)" },
  answers: {
    width: "100%", maxWidth: 380, height: 188, marginTop: 14,
    position: "relative", zIndex: 1,
    display: "flex", alignItems: "center",
  },
  choices: {
    display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12,
    width: "100%",
  },
  choice: {
    display: "flex", width: "100%", height: 88, padding: 0,
    borderRadius: 22, fontSize: 44,
  },
  choiceWrong: { animation: "shake 0.4s ease-out", opacity: 0.25 },
  choiceRight: {
    animation: "quizRight 0.4s ease-out",
    outline: "5px solid #7CE38B", outlineOffset: 3,
  },
  choiceFaded: { opacity: 0.25 },
  againBtn: {
    background: "linear-gradient(135deg, #3DAA4A, #29B6A8)",
    boxShadow: "0 5px 14px rgba(61,170,74,0.45), inset 0 2px 0 rgba(255,255,255,0.25)",
  },
  levelRow: { display: "flex", gap: 10, margin: "4px 0 12px" },
  levelTile: { flex: 1, minWidth: 0, fontSize: 22, padding: "12px 0", borderRadius: 14 },
  levelOn: { outline: "3px solid #fff", outlineOffset: 2 },
  levelOff: { opacity: 0.45 },
};
