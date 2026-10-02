import { useState, useRef, useEffect, useCallback } from "react";
import {
  toChineseParts, toChineseText, formatDigits, readDigitByDigit, bigUnitIndex, bigUnitChars,
  DIGITS, PLACES, BIG_UNITS, MAX_DIGITS, MAX_NUMBER,
} from "./chineseNumbers.js";
import { useAutoFitFontSize } from "../shared/useAutoFitFontSize.js";
import { NB_SOLID, NB_DIGIT_TEXT, getNumberBlockStyle } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { Toast } from "../shared/Toast.jsx";

const THIS_YEAR = String(new Date().getFullYear());

// Fonts loaded in index.html: LXGW WenKai TC is Kai style (楷体), the style
// Chinese school books use; Andika is made for early readers and has every
// pinyin tone mark (the shared fonts are missing ǎ, ǐ, ǒ, ǔ and ǚ).
const HANZI_FONT = "'LXGW WenKai TC', 'Kaiti SC', STKaiti, KaiTi, serif";
const PINYIN_FONT = "'Andika', var(--font-body), sans-serif";

// Digits wear their Numberblocks color — the same in the Arabic number and the
// characters, so 3 and 三 match. Zero and the place words are white, and the
// big words sit in a gold pill.
const PLAIN_COLOR = "rgba(255,255,255,0.92)";
const UNIT_PILL_BG = "rgba(255,208,48,0.14)";
const UNIT_PILL_BORDER = "rgba(255,208,48,0.4)";

function syllableColor(s, colorize) {
  if (!colorize) return PLAIN_COLOR;
  return s.kind === "digit" ? NB_DIGIT_TEXT[s.digit] : "#FFFFFF";
}

function getFunFact(digits, traditional, useLiang) {
  const wan = traditional ? "萬" : "万";
  const yi = traditional ? "億" : "亿";
  switch (digits) {
    case "": return null;
    case "0": return "⭕ Zero can also be written 〇!";
    case "8": return "🍀 八 (bā) is a lucky number in China!";
    case "10": return "🔟 Ten is just 十 — no 一 in front!";
    case "88": return "👋 88 (bā bā) sounds like “bye-bye”!";
    case "100": return "💯 百 (bǎi) means one hundred!";
    case "101": return "✨ 零 (líng) fills the gap: 一百零一!";
    case "520": return "💕 520 sounds like “I love you”!";
    case "666": return "👍 666 means “awesome!” online!";
    case "1000": return "🌟 千 (qiān) means one thousand!";
    case "2000": return useLiang ? `✌️ Before 千, two is ${traditional ? "兩" : "两"} (liǎng)!` : null;
    case "10000": return `✨ ${wan} (wàn) — ten thousand in one word!`;
    case "100000": return `🔟 Ten ${wan} make 十${wan}!`;
    case "1000000": return `🌟 A million is 一百${wan} — a hundred ${wan}!`;
    case "100000000": return `🚀 ${yi} (yì) is ten thousand ${wan}!`;
    case MAX_NUMBER: return "🏆 The biggest number here!";
  }
  if (digits === THIS_YEAR) return `📅 Years go digit by digit: ${readDigitByDigit(digits)}年!`;
  const k = bigUnitIndex(digits);
  if (k >= 3) {
    const unit = BIG_UNITS[k - 1];
    const chars = bigUnitChars(k, traditional);
    if (unit.meaning) return `🤯 ${chars} means “${unit.meaning}”!`;
    return `✨ ${chars} (${unit.pinyin.join(" ")}) — 1 and ${4 * k} zeros!`;
  }
  return null;
}

// ── Speech ───────────────────────────────────────────────────────────────────
//
// Reads the characters aloud with the device's Mandarin voice, if it has one.

function pickChineseVoice(voices) {
  const lang = (v) => v.lang.replace("_", "-").toLowerCase();
  const mandarin = voices.filter((v) => /^(zh|cmn)/.test(lang(v)) && !/hk|yue/.test(lang(v)));
  return mandarin.find((v) => /cn|hans/.test(lang(v))) || mandarin[0] || null;
}

// Long readings are split into a few utterances, since some browsers cut off
// a single long one partway through.
function speechChunks(parts) {
  const chunks = [];
  for (const part of parts) {
    const text = part.syllables.map((s) => s.char).join("");
    if (chunks.length && chunks[chunks.length - 1].length + text.length <= 24) {
      chunks[chunks.length - 1] += text;
    } else {
      chunks.push(text);
    }
  }
  return chunks;
}

function useChineseSpeech() {
  const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const runRef = useRef(0);

  useEffect(() => {
    if (!synth) return;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => {
      synth.removeEventListener?.("voiceschanged", load);
      synth.cancel();
    };
  }, [synth]);

  const voice = pickChineseVoice(voices);

  const stop = useCallback(() => {
    runRef.current++;
    synth?.cancel();
    setSpeaking(false);
  }, [synth]);

  const speak = useCallback((chunks) => {
    if (!synth || !chunks.length) return;
    synth.cancel();
    const run = ++runRef.current;
    const finish = () => { if (runRef.current === run) setSpeaking(false); };
    chunks.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice?.lang ?? "zh-CN";
      if (voice) u.voice = voice;
      u.rate = 0.8;
      if (i === chunks.length - 1) u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
    });
    setSpeaking(true);
  }, [synth, voice]);

  // Some browsers list their voices late (or never); until any show up, let
  // the browser pick one for the zh-CN language tag.
  const available = !!synth && (!!voice || voices.length === 0);
  return { available, speaking, speak, stop };
}

// ── Number Display Pieces ────────────────────────────────────────────────────

// What a part is worth, for its chip. From 京 (10¹⁶) up the full number gets
// too long for a chip, so it's said the kid way: "9,999 and 64 zeros".
function partValueLabel(part, groupSize) {
  if (part.unit < 4) return formatDigits(part.value, groupSize);
  const zeros = 4 * part.unit;
  return `${formatDigits(part.value.slice(0, -zeros), groupSize)} and ${zeros} zeros`;
}

function ArabicDigits({ text, colorize }) {
  return [...text].map((ch, i) => (
    <span key={i} style={ch === "," ? styles.comma : { color: colorize ? NB_DIGIT_TEXT[ch] : "#FFD030" }}>
      {ch}
    </span>
  ));
}

// One character with its pinyin on top, like the pinyin printed over
// characters in Chinese picture books.
function Syllable({ s, colorize, showPinyin }) {
  const color = syllableColor(s, colorize);
  return (
    <span style={styles.syllable}>
      {showPinyin && <span style={{ ...styles.pinyin, color }}>{s.pinyin}</span>}
      <span style={{ ...styles.hanzi, color }}>{s.char}</span>
    </span>
  );
}

// Groups a part's syllables into words that stay together when the reading
// wraps: a digit with its place word (三百), a lone digit or 零, a big word.
function toWords(syllables) {
  const words = [];
  for (let i = 0; i < syllables.length; i++) {
    const s = syllables[i];
    if (s.kind === "unit") {
      words.push({ unit: true, syllables: syllables.slice(i) });
      break;
    }
    if (s.kind === "digit" && syllables[i + 1]?.kind === "place") {
      words.push({ syllables: [s, syllables[i + 1]] });
      i++;
    } else {
      words.push({ syllables: [s] });
    }
  }
  return words;
}

function Reading({ parts, colorize, showPinyin }) {
  return parts.flatMap((part, p) => toWords(part.syllables).map((word, w) => (
    <span key={`${p}-${w}`} style={word.unit ? styles.unitWord : styles.word}>
      {word.syllables.map((s, i) => (
        <Syllable key={i} s={s} colorize={colorize} showPinyin={showPinyin} />
      ))}
    </span>
  )));
}

// Characters in running text (settings).
function Hz({ children }) {
  return <span style={styles.inlineHanzi}>{children}</span>;
}

// The characters for a reading, in a line of text (parts row, settings).
function InlineHanzi({ syllables, colorize }) {
  return (
    <span style={styles.inlineHanzi}>
      {syllables.map((s, i) => (
        <span key={i} style={{ color: syllableColor(s, colorize) }}>{s.char}</span>
      ))}
    </span>
  );
}

// The digits and a few place words, shown before a number is typed.
function CharacterKey({ colorize, showPinyin, traditional, groupSize }) {
  const digitItems = DIGITS.map((d, i) => ({ ...d, kind: "digit", digit: i, label: String(i) }));
  const wordItems = [
    ...PLACES.slice(1).map((p) => ({ ...p, kind: "place", label: formatDigits(p.value, groupSize) })),
    ...[1, 2].map((k) => ({
      char: bigUnitChars(k, traditional), pinyin: BIG_UNITS[k - 1].pinyin[0], kind: "unit",
      label: formatDigits("1" + "0".repeat(4 * k), groupSize),
    })),
  ];
  const renderItem = (item) => {
    const color = syllableColor(item, colorize);
    return (
      <div key={item.char} style={styles.keyItem}>
        {showPinyin && <span style={{ ...styles.keyPinyin, color }}>{item.pinyin}</span>}
        <span style={{
          ...styles.keyHanzi, color,
          ...(item.kind === "unit" && styles.keyUnitPill),
        }}>{item.char}</span>
        <span style={styles.keyValue}>{item.label}</span>
      </div>
    );
  };
  return (
    <div style={styles.key}>
      <div style={{ ...styles.keyRow, gridTemplateColumns: "repeat(10, 1fr)" }}>{digitItems.map(renderItem)}</div>
      <div style={{ ...styles.keyRow, gridTemplateColumns: "repeat(5, 1fr)" }}>{wordItems.map(renderItem)}</div>
    </div>
  );
}

// ── Settings Content ─────────────────────────────────────────────────────────

function ChineseSettings({
  show, onClose, colorize, setColorize, showPinyin, setShowPinyin,
  traditional, setTraditional, useLiang, setUseLiang, groupFours, setGroupFours,
}) {
  const options = { traditional, useLiang };
  const hz = (digits) => (
    <InlineHanzi syllables={toChineseParts(digits, options).flatMap((p) => p.syllables)} colorize={colorize} />
  );
  const wan = <Hz>{bigUnitChars(1, traditional)}</Hz>;
  const liang = traditional ? "兩" : "两";

  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={colorize}
        onChange={() => setColorize(c => !c)}
        label="Color the digits"
        hint={<>Each digit gets its Numberblocks color, so 3 and{" "}
          <InlineHanzi syllables={[{ char: "三", kind: "digit", digit: 3 }]} colorize /> match</>}
      />

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={showPinyin}
          onChange={() => setShowPinyin(p => !p)}
          label="Show pinyin"
          hint="The letters over each character that show how to say it"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={traditional}
          onChange={() => setTraditional(t => !t)}
          label="Traditional characters"
          hint={<>As in Taiwan and Hong Kong:{" "}
            <Hz>{traditional ? "萬 → 万, 億 → 亿" : "万 → 萬, 亿 → 億"}</Hz></>}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={useLiang}
          onChange={() => setUseLiang(l => !l)}
          label={<>Say <Hz>{liang}</Hz> (liǎng) for a leading two</>}
          hint={<>The way two is said when counting:{" "}
            <Hz>{useLiang ? `${liang}千 → 二千` : `二千 → ${liang}千`}</Hz></>}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={groupFours}
          onChange={() => setGroupFours(g => !g)}
          label="Group digits in fours"
          hint={`The way Chinese counts: ${groupFours ? "1,0000,0000 → 100,000,000" : "100,000,000 → 1,0000,0000"}`}
        />
      </div>

      <SettingsDivider />
      <SettingsSection title="How It Works">
        <SettingsAboutText>
          Put a digit in front of a place word:{" "}
          <Hz>十</Hz> = 10, <Hz>百</Hz> = 100, <Hz>千</Hz> = 1,000.
          So {hz("3456")} = 3 <Hz>千</Hz> + 4 <Hz>百</Hz> + 5 <Hz>十</Hz> + 6 = 3,456.
        </SettingsAboutText>
        <SettingsAboutText>
          After <Hz>千</Hz> comes {wan} (10,000). Chinese counts in groups of four digits, and every
          big word is {wan} times bigger than the one before: {hz("120000")} = 12 {wan} = 120,000.
        </SettingsAboutText>
        <SettingsAboutText>
          Zeros in the middle are said once, as <Hz>零</Hz> (líng): {hz("1001")} = 1,001.
          Zeros at the end are silent.
        </SettingsAboutText>
        <SettingsAboutText>
          A number that starts with ten drops the <Hz>一</Hz>: {hz("15")} = 15.
          And <Hz>一</Hz> (yī) changes its tone before the word it counts: yì bǎi, yì qiān, yí wàn.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="The Big Words">
        <div style={styles.bigWords}>
          {BIG_UNITS.map((unit, i) => (
            <div key={unit.simplified} style={styles.bigWordRow}>
              <span style={styles.bigWordHanzi}>{bigUnitChars(i + 1, traditional)}</span>
              <span style={styles.bigWordPinyin}>{unit.pinyin.join(" ")}</span>
              <span style={styles.bigWordZeros}>1 and {4 * (i + 1)} zeros</span>
            </div>
          ))}
        </div>
        <SettingsAboutText>
          Today in mainland China, <Hz>兆</Hz> often means a million (as in <Hz>兆字节</Hz>, a
          megabyte), and a trillion is usually said <Hz>{traditional ? "萬億" : "万亿"}</Hz>. This toy uses the traditional
          system, where each big word is {wan} times the one before.
        </SettingsAboutText>
        <SettingsAboutText>
          The words after <Hz>{traditional ? "極" : "极"}</Hz> come from old Buddhist books, which don’t
          all agree on how big they are. These are the sizes most lists use today.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who absolutely loves numbers — so he can see how to write and say
          any number in Chinese, all the way up to <Hz>{traditional ? "不可思議" : "不可思议"}</Hz>, which
          means “unthinkable”!
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Characters are set in{" "}
          <SettingsLink href="https://fonts.google.com/specimen/LXGW+WenKai+TC">LXGW WenKai</SettingsLink>
          , a Kai-style typeface like the lettering in Chinese school books. Pinyin is set in{" "}
          <SettingsLink href="https://fonts.google.com/specimen/Andika">Andika</SettingsLink>
          , a typeface made for children learning to read.
        </SettingsAboutText>
        <SettingsAboutText>
          Learn more about{" "}
          <SettingsLink href="https://en.wikipedia.org/wiki/Chinese_numerals">Chinese numerals</SettingsLink>
          {" "}on Wikipedia.
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

export default function ChineseNumbers() {
  const [input, setInput] = useState("");
  const [bounce, setBounce] = useState(null);
  const [readingFlash, setReadingFlash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [colorize, setColorize] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [traditional, setTraditional] = useState(false);
  const [useLiang, setUseLiang] = useState(true);
  const [groupFours, setGroupFours] = useState(false);
  const [fontTick, setFontTick] = useState(0);
  const arabicOuterRef = useRef(null);
  const arabicInnerRef = useRef(null);
  const readingOuterRef = useRef(null);
  const readingInnerRef = useRef(null);
  const partsOuterRef = useRef(null);
  const partsInnerRef = useRef(null);
  const speech = useChineseSpeech();

  const isEmpty = input === "";
  const isZero = input === "0";
  const hasValue = !isEmpty && !isZero;
  const atMax = input === MAX_NUMBER;
  const isFull = input.length >= MAX_DIGITS;
  const canAddWan = hasValue && input.length + 4 <= MAX_DIGITS;
  const groupSize = groupFours ? 4 : 3;
  const parts = toChineseParts(input, { traditional, useLiang });
  const syllables = parts.flatMap((p) => p.syllables);
  const funFact = getFunFact(input, traditional, useLiang);

  // The characters arrive in slices as they're first needed, so refit the
  // display whenever a font finishes loading.
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts?.addEventListener) return;
    const bump = () => setFontTick((t) => t + 1);
    fonts.addEventListener("loadingdone", bump);
    return () => fonts.removeEventListener("loadingdone", bump);
  }, []);

  const arabicText = isEmpty ? "?" : formatDigits(input, groupSize);
  const arabicFontSize = useAutoFitFontSize(arabicOuterRef, arabicInnerRef, arabicText.length, {
    maxFont: 40, minFont: 10, fitKey: fontTick,
  });
  // Pinyin is extra content, so count it: turning it off lets the characters grow.
  const readingFontSize = useAutoFitFontSize(
    readingOuterRef, readingInnerRef, syllables.length * (showPinyin ? 2 : 1),
    { maxFont: 64, minFont: 20, fitKey: `${input}|${traditional}|${useLiang}|${fontTick}` },
  );
  const partsCharCount = parts.reduce(
    (sum, p) => sum + p.syllables.length + partValueLabel(p, groupSize).length, 0
  );
  const partsFontSize = useAutoFitFontSize(partsOuterRef, partsInnerRef, partsCharCount, {
    maxFont: 16, minFont: 12, fitKey: `${input}|${traditional}|${useLiang}|${groupFours}|${fontTick}`,
  });

  // Huge numbers can overflow even at the smallest readable size, so these
  // boxes scroll — start each new number back at the top.
  useEffect(() => {
    if (readingOuterRef.current) readingOuterRef.current.scrollTop = 0;
    if (partsOuterRef.current) partsOuterRef.current.scrollTop = 0;
  }, [input]);

  // A changed number makes the old reading stale, so stop saying it.
  const { stop } = speech;
  useEffect(() => { stop(); }, [input, traditional, useLiang, stop]);

  const triggerFlash = () => {
    setReadingFlash(true);
    setTimeout(() => setReadingFlash(false), 300);
  };

  const pressed = (key) => {
    setBounce(key);
    triggerFlash();
    setTimeout(() => setBounce(null), 200);
  };

  const handleDigit = (d) => {
    if (isFull) return;
    setInput((isZero ? "" : input) + d);
    pressed(d);
  };

  const handleWan = () => {
    if (!canAddWan) return;
    setInput(input + "0000");
    pressed("wan");
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
    setInput(String(BigInt(input || "0") + 1n));
    triggerFlash();
  };

  const handleMinusOne = () => {
    if (!hasValue) return;
    // Counting down from 一 lands on 零.
    setInput(String(BigInt(input) - 1n));
    triggerFlash();
  };

  const handleSpeak = () => {
    if (speech.speaking) speech.stop();
    else speech.speak(speechChunks(parts));
  };

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
        @keyframes speakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
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
        title="Chinese Numbers"
        subtitle="Write and say any number in Chinese"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <ChineseSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        colorize={colorize} setColorize={setColorize}
        showPinyin={showPinyin} setShowPinyin={setShowPinyin}
        traditional={traditional} setTraditional={setTraditional}
        useLiang={useLiang} setUseLiang={setUseLiang}
        groupFours={groupFours} setGroupFours={setGroupFours}
      />

      {/* Display Area */}
      <div className="frosted-card" style={styles.displayCard}>
        <div ref={arabicOuterRef} style={styles.arabicOuter}>
          <div ref={arabicInnerRef} style={{
            ...styles.arabicInner,
            fontSize: arabicFontSize,
            color: isEmpty ? "rgba(255,255,255,0.3)" : undefined,
          }}>
            {isEmpty ? arabicText : <ArabicDigits text={arabicText} colorize={colorize} />}
          </div>
        </div>
        <div style={styles.secondaryRow}>
          {isEmpty && <span style={styles.secondaryLabel}>Chinese digits and place words</span>}
          {isZero && <span style={styles.secondaryLabel}>zero</span>}
          {hasValue && (
            <>
              <span style={styles.secondaryLabel}>{plural(input.length, "digit")}</span>
              <span style={styles.notationDot}>·</span>
              <span style={styles.secondaryLabel}>{plural(syllables.length, "character")}</span>
            </>
          )}
        </div>

        <div ref={readingOuterRef} style={styles.readingOuter}>
          {isEmpty ? (
            <CharacterKey colorize={colorize} showPinyin={showPinyin} traditional={traditional} groupSize={groupSize} />
          ) : (
            <div ref={readingInnerRef} style={{
              ...styles.readingInner,
              fontSize: readingFontSize,
              animation: readingFlash ? "flash 0.3s ease-out" : "none",
            }}>
              <Reading parts={parts} colorize={colorize} showPinyin={showPinyin} />
            </div>
          )}
        </div>

        <div ref={partsOuterRef} style={styles.partsOuter}>
          {isEmpty && <span style={styles.partsHint}>Tap a number below to start!</span>}
          {isZero && <span style={styles.partsHint}>零 (líng) means zero</span>}
          {hasValue && (
            <div ref={partsInnerRef} style={{ ...styles.partsInner, fontSize: partsFontSize }}>
              {parts.map((part, i) => (
                <span key={i} style={styles.partGroup}>
                  {i > 0 && <span style={styles.plus}>+</span>}
                  <span style={styles.chip}>
                    <span style={styles.chipHanzi}>
                      <InlineHanzi syllables={part.syllables} colorize={colorize} />
                    </span>
                    <span style={styles.chipValue}>{partValueLabel(part, groupSize)}</span>
                  </span>
                </span>
              ))}
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

      {/* Plus / Say it / Minus row */}
      <div style={styles.pmRow}>
        <button className="toy-btn pm-btn" disabled={!hasValue} style={{
          background: "linear-gradient(135deg, #E41E20, #FF8C1A)",
          boxShadow: "0 4px 12px rgba(228,30,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          flex: 1, opacity: hasValue ? 1 : 0.35,
        }} onClick={handleMinusOne}>
          − 1
        </button>
        {speech.available && (
          <button className="toy-btn pm-btn" disabled={isEmpty} aria-label="Say it" style={{
            background: "linear-gradient(135deg, #FFD030, #FF8C1A)",
            boxShadow: "0 4px 12px rgba(255,140,26,0.3), inset 0 2px 0 rgba(255,255,255,0.3)",
            width: 72, flexShrink: 0, fontSize: 24,
            opacity: isEmpty ? 0.35 : 1,
            animation: speech.speaking ? "speakPulse 0.8s ease-in-out infinite" : "none",
          }} onClick={handleSpeak}>
            {speech.speaking ? "⏹" : "🔊"}
          </button>
        )}
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
        <button className="toy-btn nb-btn" disabled={isFull} style={{
          background: "#FFFFFF",
          border: "3px solid #E41E20",
          boxShadow: "0 5px 14px rgba(228,30,32,0.25), inset 0 2px 0 rgba(255,255,255,0.5)",
          color: "#E41E20", textShadow: "none",
          animation: bounce === "0" && !isFull ? "btnPress 0.2s ease-out" : "none",
          opacity: isFull ? 0.35 : 1,
          gridColumn: 2,
        }} onClick={() => handleDigit("0")}>
          0
        </button>
        {/* Adds four zeros — one big word bigger */}
        <button className="toy-btn nb-btn" disabled={!canAddWan} aria-label="Times ten thousand" style={{
          ...styles.wanBtn,
          animation: bounce === "wan" && canAddWan ? "btnPress 0.2s ease-out" : "none",
          opacity: canAddWan ? 1 : 0.35,
        }} onClick={handleWan}>
          <span style={styles.wanChar}>×{bigUnitChars(1, traditional)}</span>
          <span style={styles.wanZeros}>0000</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  displayCard: {
    padding: "12px 14px",
    width: "100%", maxWidth: 380, height: 380,
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
  },
  arabicOuter: {
    height: 52, flexShrink: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  arabicInner: {
    fontWeight: 700, textAlign: "center",
    wordBreak: "break-all", maxWidth: "100%",
  },
  comma: { color: "rgba(255,255,255,0.35)" },
  secondaryRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, height: 18, marginBottom: 8, flexShrink: 0,
  },
  secondaryLabel: {
    fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)",
  },
  notationDot: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
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
    rowGap: "0.14em",
  },
  word: { display: "flex", alignItems: "flex-end" },
  unitWord: {
    display: "flex", alignItems: "flex-end",
    background: UNIT_PILL_BG, boxShadow: `inset 0 0 0 1px ${UNIT_PILL_BORDER}`,
    borderRadius: "0.16em", padding: "0 0.06em", margin: "0 0.12em",
  },
  syllable: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0 0.03em",
  },
  pinyin: {
    fontFamily: PINYIN_FONT, fontWeight: 700,
    fontSize: "max(11px, 0.34em)", lineHeight: 1.25,
    whiteSpace: "nowrap", opacity: 0.9,
  },
  hanzi: {
    fontFamily: HANZI_FONT, fontWeight: 700, lineHeight: 1.15,
  },
  key: {
    margin: "auto 0", width: "100%",
    display: "flex", flexDirection: "column", gap: 14,
  },
  keyRow: { display: "grid", gap: 2 },
  keyItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
  },
  keyPinyin: {
    fontFamily: PINYIN_FONT, fontWeight: 700, fontSize: 11, lineHeight: 1,
  },
  keyHanzi: {
    fontFamily: HANZI_FONT, fontWeight: 700, fontSize: 26, lineHeight: 1.1,
  },
  keyUnitPill: {
    background: UNIT_PILL_BG, boxShadow: `inset 0 0 0 1px ${UNIT_PILL_BORDER}`,
    borderRadius: 6, padding: "0 3px",
  },
  keyValue: {
    fontSize: 11, color: "rgba(255,255,255,0.55)",
    fontFamily: "var(--font-body)", fontWeight: 500, whiteSpace: "nowrap",
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
  partGroup: { display: "flex", alignItems: "center" },
  plus: {
    color: "rgba(255,255,255,0.35)", fontWeight: 600,
    fontSize: "1.1em", lineHeight: 1, margin: "0 0.25em",
  },
  chip: {
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "rgba(255,255,255,0.06)", borderRadius: "0.5em",
    padding: "0.2em 0.35em",
  },
  chipHanzi: { fontSize: "1.2em", lineHeight: 1.1, whiteSpace: "nowrap" },
  chipValue: {
    fontFamily: "var(--font-body)", fontWeight: 500,
    fontSize: "0.8em", lineHeight: 1.2, marginTop: "0.15em",
    color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap",
  },
  inlineHanzi: { fontFamily: HANZI_FONT, fontWeight: 700, whiteSpace: "nowrap" },
  bigWords: {
    display: "grid", gridTemplateColumns: "auto 1fr auto",
    columnGap: 12, rowGap: 4, margin: "4px 0 12px",
  },
  bigWordRow: { display: "contents" },
  bigWordHanzi: { fontFamily: HANZI_FONT, fontWeight: 700, fontSize: 18, color: "#FFD030" },
  bigWordPinyin: {
    fontFamily: PINYIN_FONT, fontWeight: 700, fontSize: 13,
    color: "rgba(255,255,255,0.75)", alignSelf: "center",
  },
  bigWordZeros: {
    fontFamily: "var(--font-body)", fontSize: 13,
    color: "rgba(255,255,255,0.55)", alignSelf: "center", textAlign: "right",
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
  // Chinese red and gold
  wanBtn: {
    background: "linear-gradient(135deg, #B71C1C, #8E1414)",
    border: "3px solid #FFD030",
    boxShadow: "0 5px 14px rgba(183,28,28,0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
    color: "#FFD030", flexDirection: "column", gap: 2,
  },
  wanChar: { fontFamily: HANZI_FONT, fontWeight: 700, fontSize: 26, lineHeight: 1 },
  wanZeros: { fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11, lineHeight: 1, opacity: 0.85 },
};
