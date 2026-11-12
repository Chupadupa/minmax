import { useState, useRef, useEffect } from "react";
import { useAutoFitFontSize } from "./useAutoFitFontSize.js";
import { NB_DIGIT_TEXT } from "./numberblockColors.js";
import { plural } from "./formatUtils.js";

// ── Reading Card ─────────────────────────────────────────────────────────────
// The display of a toy that writes a number out in a language: the number on
// top, a count line, the reading in a big box (sized to fit, then scrolling),
// and the number's parts as chips along the bottom (2 thousands + 3 hundreds…).
// The card does the fitting and scrolling; the toy supplies its language.
//
//   <ReadingCard
//     pad={pad} number="1,234" colorize
//     emptyLabel="Spanish number words" countLabel="4 words" zeroHint="cero means zero"
//     wordKey={<WordKey />}
//     reading={<Reading />} readingFit={{ count, maxFont: 44, minFont: 15, fitKey }}
//     parts={[{ words: <InlineWords />, value: "1,000" }]} partsFit={{ count, fitKey }}
//   />
//
// pad          from useNumberInput
// number       the number as it should be shown (with its separators)
// colorize     digits in their Numberblocks colors, or all gold
// emptyLabel   the line under "?" before anything is typed
// countLabel   how long the reading is ("4 words"), beside the digit count
// zeroHint     what the parts row says for zero
// wordKey      shown in the reading box before anything is typed
// reading      the reading itself. Its size is em-based: the card sets the font
//              size. `readingFit` says how much there is to fit (`count`, in
//              rough characters), the biggest and smallest font, and a `fitKey`
//              that changes whenever the reading does. `readingStyle` adds
//              spacing between its words.
// parts        [{ words, value }] — a part's reading and what it's worth.
//              `partsFit` is `{ count, fitKey }`; `chipStyle` and
//              `chipWordsStyle` adjust the chips.

// Shared by the toys' own word displays, so the gold pill round a big word
// (万, millón) and the uncolored text look the same everywhere.
export const PLAIN_COLOR = "rgba(255,255,255,0.92)";
export const UNIT_PILL = {
  background: "rgba(255,208,48,0.14)",
  boxShadow: "inset 0 0 0 1px rgba(255,208,48,0.4)",
};

// Web fonts can arrive after the first render (and Chinese ones in slices, as
// characters are first needed), which changes how wide everything is. This
// ticks up each time one finishes loading, so the fit can be redone.
function useFontTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts?.addEventListener) return;
    const bump = () => setTick((t) => t + 1);
    fonts.addEventListener("loadingdone", bump);
    return () => fonts.removeEventListener("loadingdone", bump);
  }, []);
  return tick;
}

// The number, digit by digit; separators are dimmed.
function Digits({ text, colorize }) {
  return [...text].map((ch, i) => (
    <span key={i} style={/[0-9]/.test(ch) ? { color: colorize ? NB_DIGIT_TEXT[ch] : "#FFD030" } : styles.separator}>
      {ch}
    </span>
  ));
}

export function ReadingCard({
  pad, number, colorize,
  emptyLabel, countLabel, zeroHint,
  wordKey, reading, readingFit, readingStyle,
  parts, partsFit, chipStyle, chipWordsStyle,
}) {
  const numberOuterRef = useRef(null);
  const numberInnerRef = useRef(null);
  const readingOuterRef = useRef(null);
  const readingInnerRef = useRef(null);
  const partsOuterRef = useRef(null);
  const partsInnerRef = useRef(null);
  const fontTick = useFontTick();

  const { input, isEmpty } = pad;
  const isZero = input === "0";
  const hasValue = !isEmpty && !isZero;
  const numberText = isEmpty ? "?" : number;

  const numberFontSize = useAutoFitFontSize(numberOuterRef, numberInnerRef, numberText.length, {
    maxFont: 40, minFont: 10, fitKey: fontTick,
  });
  const readingFontSize = useAutoFitFontSize(readingOuterRef, readingInnerRef, readingFit.count, {
    maxFont: readingFit.maxFont, minFont: readingFit.minFont, fitKey: `${readingFit.fitKey}|${fontTick}`,
  });
  const partsFontSize = useAutoFitFontSize(partsOuterRef, partsInnerRef, partsFit.count, {
    maxFont: 16, minFont: 12, fitKey: `${partsFit.fitKey}|${fontTick}`,
  });

  // Huge numbers can overflow even at the smallest readable size, so these
  // boxes scroll — start each new number back at the top.
  useEffect(() => {
    if (readingOuterRef.current) readingOuterRef.current.scrollTop = 0;
    if (partsOuterRef.current) partsOuterRef.current.scrollTop = 0;
  }, [input]);

  return (
    <div className="frosted-card" style={styles.card}>
      <div ref={numberOuterRef} style={styles.numberOuter}>
        <div ref={numberInnerRef} style={{
          ...styles.numberInner,
          fontSize: numberFontSize,
          color: isEmpty ? "rgba(255,255,255,0.3)" : undefined,
        }}>
          {isEmpty ? numberText : <Digits text={numberText} colorize={colorize} />}
        </div>
      </div>
      <div style={styles.countRow}>
        {isEmpty && <span style={styles.countLabel}>{emptyLabel}</span>}
        {isZero && <span style={styles.countLabel}>zero</span>}
        {hasValue && (
          <>
            <span style={styles.countLabel}>{plural(input.length, "digit")}</span>
            <span style={styles.countDot}>·</span>
            <span style={styles.countLabel}>{countLabel}</span>
          </>
        )}
      </div>

      <div ref={readingOuterRef} style={styles.readingOuter}>
        {isEmpty ? wordKey : (
          <div ref={readingInnerRef} style={{
            ...styles.readingInner, ...readingStyle,
            fontSize: readingFontSize,
            animation: pad.flash ? "flash 0.3s ease-out" : "none",
          }}>
            {reading}
          </div>
        )}
      </div>

      <div ref={partsOuterRef} style={styles.partsOuter}>
        {isEmpty && <span style={styles.partsHint}>Tap a number below to start!</span>}
        {isZero && <span style={styles.partsHint}>{zeroHint}</span>}
        {hasValue && (
          <div ref={partsInnerRef} style={{ ...styles.partsInner, fontSize: partsFontSize }}>
            {parts.map((part, i) => (
              <span key={i} style={styles.partGroup}>
                {i > 0 && <span style={styles.plus}>+</span>}
                <span style={{ ...styles.chip, ...chipStyle }}>
                  <span style={chipWordsStyle}>{part.words}</span>
                  <span style={styles.chipValue}>{part.value}</span>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  card: {
    padding: "12px 14px",
    width: "100%", maxWidth: 380, height: 380,
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  numberOuter: {
    height: 52, flexShrink: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  numberInner: {
    fontWeight: 700, textAlign: "center",
    wordBreak: "break-all", maxWidth: "100%",
  },
  separator: { color: "rgba(255,255,255,0.35)" },
  countRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, height: 18, marginBottom: 8, flexShrink: 0,
  },
  countLabel: {
    fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)",
  },
  countDot: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  readingOuter: {
    flex: 1, minHeight: 0,
    background: "rgba(0,0,0,0.15)", borderRadius: 10,
    marginBottom: 8, overflowX: "hidden", overflowY: "auto",
    display: "flex", flexDirection: "column",
    padding: "6px 8px",
  },
  readingInner: {
    // Auto margins center the reading, but unlike align-items they fall back
    // to the top when it overflows, so the scroll can reach the first line.
    margin: "auto 0", width: "100%",
    display: "flex", flexWrap: "wrap",
    alignItems: "flex-end", justifyContent: "center",
  },
  partsOuter: {
    height: 92, flexShrink: 0,
    background: "rgba(255,255,255,0.05)", borderRadius: 10,
    overflowX: "hidden", overflowY: "auto", padding: "5px 6px",
    display: "flex", flexDirection: "column",
  },
  partsHint: {
    margin: "auto 0", fontSize: 14, color: "rgba(255,255,255,0.45)",
    fontFamily: "var(--font-body)", textAlign: "center",
  },
  partsInner: {
    margin: "auto 0", width: "100%",
    display: "flex", flexWrap: "wrap",
    alignItems: "center", justifyContent: "center",
    rowGap: "0.3em",
  },
  partGroup: { display: "flex", alignItems: "center", maxWidth: "100%" },
  plus: {
    color: "rgba(255,255,255,0.35)", fontWeight: 600,
    fontSize: "1.1em", lineHeight: 1, margin: "0 0.25em",
  },
  chip: {
    display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0,
    background: "rgba(255,255,255,0.06)", borderRadius: "0.5em",
    padding: "0.2em 0.35em",
  },
  chipValue: {
    fontFamily: "var(--font-body)", fontWeight: 500,
    fontSize: "0.8em", lineHeight: 1.2, marginTop: "0.15em",
    color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap",
  },
};
