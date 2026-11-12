import { useState, useEffect } from "react";
import {
  toChineseParts, toChineseText, formatDigits, readDigitByDigit, bigUnitIndex, bigUnitChars,
  DIGITS, PLACES, BIG_UNITS, MAX_DIGITS, MAX_NUMBER,
} from "./chineseNumbers.js";
import { NB_DIGIT_TEXT } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink, NumberblocksWord,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { FunFact } from "../shared/Toast.jsx";
import { useSpeech, chunkSpeech } from "../shared/useSpeech.js";
import { plural } from "../shared/formatUtils.js";
import { ReadingCard, PLAIN_COLOR, UNIT_PILL } from "../shared/ReadingCard.jsx";
import { Numpad, NumpadKey, NumpadSpeakKey } from "../shared/Numpad.jsx";
import { useNumberInput } from "../shared/useNumberInput.js";

const THIS_YEAR = String(new Date().getFullYear());

// Fonts loaded in index.html: LXGW WenKai TC is Kai style (楷体), the style
// Chinese school books use; Andika is made for early readers and has every
// pinyin tone mark (the shared fonts are missing ǎ, ǐ, ǒ, ǔ and ǚ).
const HANZI_FONT = "'LXGW WenKai TC', 'Kaiti SC', STKaiti, KaiTi, serif";
const PINYIN_FONT = "'Andika', var(--font-body), sans-serif";

// Digits wear their Numberblocks color — the same in the Arabic number and the
// characters, so 3 and 三 match. Zero and the place words are white, and the
// big words sit in a gold pill.

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
// Reads the characters aloud with the device's Mandarin voice, if it has one:
// any zh-… or cmn-… voice that isn't Cantonese (zh-HK, yue), mainland first.
const MANDARIN_VOICES = /^(zh|cmn)(?!.*(hk|yue))/;
const MAINLAND_VOICES = [/cn|hans/];

// Long readings are split into a few utterances, since some browsers cut off
// a single long one partway through.
const speechChunks = (parts) =>
  chunkSpeech(parts.map((part) => part.syllables.map((s) => s.char).join("")), { joiner: "", maxLength: 24 });

// ── Number Display Pieces ────────────────────────────────────────────────────

// What a part is worth, for its chip. From 京 (10¹⁶) up the full number gets
// too long for a chip, so it's said the kid way: "9,999 and 64 zeros".
function partValueLabel(part, groupSize) {
  if (part.unit < 4) return formatDigits(part.value, groupSize);
  const zeros = 4 * part.unit;
  return `${formatDigits(part.value.slice(0, -zeros), groupSize)} and ${zeros} zeros`;
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
          <NumberblocksWord />
          {" "}characters.
        </SettingsAboutText>
      </SettingsSection>
    </SettingsOverlay>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChineseNumbers() {
  const pad = useNumberInput({ max: MAX_NUMBER });
  const [showSettings, setShowSettings] = useState(false);
  const [colorize, setColorize] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [traditional, setTraditional] = useState(false);
  const [useLiang, setUseLiang] = useState(true);
  const [groupFours, setGroupFours] = useState(false);
  const speech = useSpeech({ lang: "zh-CN", rate: 0.8, match: MANDARIN_VOICES, prefer: MAINLAND_VOICES });

  const { input, isEmpty } = pad;
  const hasValue = !isEmpty && input !== "0";
  const canAddWan = hasValue && input.length + 4 <= MAX_DIGITS;
  const groupSize = groupFours ? 4 : 3;
  const parts = toChineseParts(input, { traditional, useLiang });
  const syllables = parts.flatMap((p) => p.syllables);
  const funFact = getFunFact(input, traditional, useLiang);

  const partsCharCount = parts.reduce(
    (sum, p) => sum + p.syllables.length + partValueLabel(p, groupSize).length, 0
  );

  // A changed number makes the old reading stale, so stop saying it.
  const { stop } = speech;
  useEffect(() => { stop(); }, [input, traditional, useLiang, stop]);

  return (
    <div className="toy-container">
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

      <ReadingCard
        pad={pad} number={formatDigits(input, groupSize)} colorize={colorize}
        emptyLabel="Chinese digits and place words"
        countLabel={plural(syllables.length, "character")}
        zeroHint="零 (líng) means zero"
        wordKey={<CharacterKey colorize={colorize} showPinyin={showPinyin} traditional={traditional} groupSize={groupSize} />}
        reading={<Reading parts={parts} colorize={colorize} showPinyin={showPinyin} />}
        // Pinyin is extra content, so count it: turning it off lets the characters grow.
        readingFit={{
          count: syllables.length * (showPinyin ? 2 : 1), maxFont: 64, minFont: 20,
          fitKey: `${input}|${traditional}|${useLiang}`,
        }}
        readingStyle={styles.readingGaps}
        parts={parts.map((part) => ({
          words: <InlineHanzi syllables={part.syllables} colorize={colorize} />,
          value: partValueLabel(part, groupSize),
        }))}
        partsFit={{ count: partsCharCount, fitKey: `${input}|${traditional}|${useLiang}|${groupFours}` }}
        chipWordsStyle={styles.chipHanzi}
      />

      <FunFact text={funFact} />

      <Numpad
        pad={pad}
        middleKey={speech.hasVoice && (
          <NumpadSpeakKey speech={speech} disabled={isEmpty} getText={() => speechChunks(parts)} />
        )}
        rightKey={
          // Adds four zeros — one big word bigger
          <NumpadKey
            pad={pad} id="wan" disabled={!canAddWan} label="Times ten thousand" style={styles.wanBtn}
            onClick={() => pad.set(input + "0000", "wan")}
          >
            <span style={styles.wanChar}>×{bigUnitChars(1, traditional)}</span>
            <span style={styles.wanZeros}>0000</span>
          </NumpadKey>
        }
      />
    </div>
  );
}

const styles = {
  word: { display: "flex", alignItems: "flex-end" },
  unitWord: {
    display: "flex", alignItems: "flex-end",
    ...UNIT_PILL,
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
    ...UNIT_PILL,
    borderRadius: 6, padding: "0 3px",
  },
  keyValue: {
    fontSize: 11, color: "rgba(255,255,255,0.55)",
    fontFamily: "var(--font-body)", fontWeight: 500, whiteSpace: "nowrap",
  },
  readingGaps: { rowGap: "0.14em" },
  chipHanzi: { fontSize: "1.2em", lineHeight: 1.1, whiteSpace: "nowrap" },
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
