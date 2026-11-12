import { useState, useEffect } from "react";
import {
  toSpanishParts, toSpanishText, formatDigits, bigUnitIndex, digitWord, keyWords,
  BIG_UNITS, MAX_DIGITS, MAX_NUMBER,
} from "./spanishNumbers.js";
import { useSpeech, chunkSpeech } from "../shared/useSpeech.js";
import { plural } from "../shared/formatUtils.js";
import { ReadingCard, PLAIN_COLOR, UNIT_PILL } from "../shared/ReadingCard.jsx";
import { NB_DIGIT_TEXT } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink, NumberblocksWord,
} from "../shared/SettingsOverlay.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import { FunFact } from "../shared/Toast.jsx";
import { Numpad, NumpadKey, NumpadSpeakKey } from "../shared/Numpad.jsx";
import { useNumberInput } from "../shared/useNumberInput.js";

const THIS_YEAR = String(new Date().getFullYear());

// Andika (loaded in index.html) is made for early readers and has every
// Spanish accent mark: á é í ó ú ñ.
const WORD_FONT = "'Andika', var(--font-body), sans-serif";

// Each bit of a word wears the Numberblocks color of the digit it comes from —
// the same as in the number, so 3 and tres (and treinta, and trescientos)
// match. Mil and y are white, and the big words sit in a gold pill.
const AND_COLOR = "rgba(255,255,255,0.6)";
const SAY_COLOR = "rgba(255,255,255,0.7)";

function pieceColor(digit, kind, colorize) {
  if (kind === "and") return AND_COLOR;
  if (!colorize || digit == null) return PLAIN_COLOR;
  return NB_DIGIT_TEXT[digit];
}

const sayOf = (word, spain) => (spain ? word.say.spain : word.say.latam);

function getFunFact(digits, spain) {
  switch (digits) {
    case "": return null;
    case "1": return "☝️ Before millón, uno shrinks to un: un millón!";
    case "11": return "😮 Once looks like the English word, but it means 11!";
    case "12": return "🥚 Twelve eggs make una docena — a dozen!";
    case "15": return "🎉 A quinceañera is a party for turning quince!";
    case "16": return "🧩 Dieciséis is diez y seis squished together!";
    case "21": return "🧩 Veintiuno is veinte y uno squished together!";
    case "31": return "➕ From 31 on, y (ee) means “and”: treinta y uno!";
    case "100": return "💯 Cien means one hundred!";
    case "101": return "✨ Past 100, cien turns into ciento: ciento uno!";
    case "500": return "🖐️ 500 is quinientos — not cincocientos!";
    case "700": return "7️⃣ 700 is setecientos — siete loses its i!";
    case "900": return "9️⃣ 900 is novecientos — nueve turns into nove!";
    case "1000": return "🌟 Mil means one thousand — no un in front!";
    case "21000": return "✂️ Before mil, veintiuno shrinks to veintiún!";
    case "1000000": return "🌟 Un millón — a million!";
    case "2000000": return "📈 More than one millón makes millones!";
    case "1000000000": return "🤯 An English billion is mil millones — a thousand millions!";
    case "1000000000000": return "🚀 Un billón is a million millions — a trillion in English!";
    case MAX_NUMBER: return "🏆 The biggest number here!";
  }
  if (digits === THIS_YEAR) {
    return `📅 Spanish says years as one big number: ${toSpanishText(toSpanishParts(digits))}!`;
  }
  const k = bigUnitIndex(digits);
  if (k >= 3) {
    const unit = BIG_UNITS[k - 1];
    return `✨ Un ${unit.one} (${spain ? unit.say.spain : unit.say.latam}) — 1 and ${6 * k} zeros!`;
  }
  return null;
}

// ── Speech ───────────────────────────────────────────────────────────────────
//
// Long readings are split into a few utterances, a part or two each, since
// some browsers cut off a single long one partway through.
const speechChunks = (parts) =>
  chunkSpeech(parts.map((part) => part.words.map((w) => w.text).join(" ")), { maxLength: 60 });

const LATAM_VOICES = ["es-mx", "es-us", "es-419"];
const SPAIN_VOICES = ["es-es"];

// ── Number Display Pieces ────────────────────────────────────────────────────

// What a part is worth, for its chip. From trillón (10¹⁸) up the full number
// gets too long for a chip, so it's said the kid way: "999,999 and 60 zeros".
function partValueLabel(part, separator) {
  if (part.zeros < 18) return formatDigits(part.value, separator);
  return `${formatDigits(part.value.slice(0, -part.zeros), separator)} and ${part.zeros} zeros`;
}

// A word's spelling, each bit in its digit's color.
function Spelling({ word, colorize }) {
  return word.pieces.map(([text, digit], i) => (
    <span key={i} style={{ color: pieceColor(digit, word.kind, colorize) }}>{text}</span>
  ));
}

// One word with how to say it on top.
function Word({ word, colorize, showSay, spain }) {
  return (
    <span style={word.kind === "unit" ? styles.unitWord : styles.word}>
      {showSay && <span style={styles.say}>{sayOf(word, spain)}</span>}
      <span style={styles.wordText}><Spelling word={word} colorize={colorize} /></span>
    </span>
  );
}

function Reading({ parts, colorize, showSay, spain }) {
  return parts.flatMap((part, p) => part.words.map((word, w) => (
    <Word key={`${p}-${w}`} word={word} colorize={colorize} showSay={showSay} spain={spain} />
  )));
}

// Spanish words in a line of text (parts row, settings).
function InlineWords({ words, colorize }) {
  return (
    <span style={styles.inlineWords}>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && " "}
          <Spelling word={word} colorize={colorize} />
        </span>
      ))}
    </span>
  );
}

// Spanish in running text (settings).
function Es({ children }) {
  return <span style={styles.inlineWords}>{children}</span>;
}

// The digit words and a few place words, shown before a number is typed.
function WordKey({ colorize, showSay, spain, separator }) {
  const items = [
    ...Array.from({ length: 10 }, (_, d) => ({ word: digitWord(d), value: String(d) })),
    ...keyWords(),
  ];
  return (
    <div style={styles.key}>
      {items.map(({ word, value }) => (
        <div key={word.text} style={styles.keyItem}>
          {showSay && <span style={styles.keySay}>{sayOf(word, spain)}</span>}
          <span style={{ ...styles.keyWord, ...(word.kind === "unit" && styles.keyUnitPill) }}>
            <Spelling word={word} colorize={colorize} />
          </span>
          <span style={styles.keyValue}>{formatDigits(value, separator)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Settings Content ─────────────────────────────────────────────────────────

function SpanishSettings({
  show, onClose, colorize, setColorize, showSay, setShowSay,
  spain, setSpain, useDots, setUseDots,
}) {
  const es = (digits) => (
    <InlineWords words={toSpanishParts(digits).flatMap((p) => p.words)} colorize={colorize} />
  );

  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <SettingsToggle
        checked={colorize}
        onChange={() => setColorize(c => !c)}
        label="Color the digits"
        hint={<>Each word gets the Numberblocks color of its digit, so 3, {es("3")},{" "}
          {es("30")} and {es("300")} match</>}
      />

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={showSay}
          onChange={() => setShowSay(s => !s)}
          label="Show how to say it"
          hint="Letters over each word that sound it out, with the loudest part in capitals"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={spain}
          onChange={() => setSpain(s => !s)}
          label="Say it like in Spain"
          hint={<>In Spain, <Es>c</Es> and <Es>z</Es> sound like “th”:{" "}
            <Es>cinco</Es> is{" "}
            <span style={{ whiteSpace: "nowrap" }}>THEEN-koh</span>, not{" "}
            <span style={{ whiteSpace: "nowrap" }}>SEEN-koh</span></>}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <SettingsToggle
          checked={useDots}
          onChange={() => setUseDots(d => !d)}
          label="Dots between thousands"
          hint={`The way Spain and much of South America write it: ${useDots ? "1.000.000 → 1,000,000" : "1,000,000 → 1.000.000"}`}
        />
      </div>

      <SettingsDivider />
      <SettingsSection title="How It Works">
        <SettingsAboutText>
          Zero to fifteen each have their own word. After that, words get squished
          together: {es("16")} is <Es>diez y seis</Es> (ten and six), and {es("23")} is{" "}
          <Es>veinte y tres</Es>.
        </SettingsAboutText>
        <SettingsAboutText>
          From thirty on, the tens and ones are joined by <Es>y</Es> (ee), which means “and”:{" "}
          {es("35")} = 35.
        </SettingsAboutText>
        <SettingsAboutText>
          One hundred is <Es>cien</Es>, but with more after it, it’s <Es>ciento</Es>:{" "}
          {es("101")} = 101. Most hundreds are easy to guess, like {es("200")} — but
          watch out for {es("500")}, {es("700")} and {es("900")}!
        </SettingsAboutText>
        <SettingsAboutText>
          A thousand is just <Es>mil</Es>, with no <Es>un</Es> in front. And before <Es>mil</Es>{" "}
          or a big word, <Es>uno</Es> shrinks to <Es>un</Es>: {es("21000")} = 21,000.
        </SettingsAboutText>
        <SettingsAboutText>
          For girl words like <Es>casa</Es> (house), <Es>uno</Es> turns into <Es>una</Es>{" "}
          (<Es>una casa</Es>) and the hundreds end in <Es>-as</Es> (<Es>doscientas casas</Es>).
          This toy counts the plain way.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="The Big Words">
        <SettingsAboutText>
          Spanish makes a new big word every six zeros, and each is a <Es>millón</Es> times the
          one before. In between, <Es>mil</Es> does the work: {es("1000000000")} is a thousand
          millions. So an English billion is <Es>mil millones</Es>, and <Es>un billón</Es> is
          much bigger — an English trillion!
        </SettingsAboutText>
        <div style={styles.bigWords}>
          <span style={styles.bigWordHead}>Spanish</span>
          <span style={styles.bigWordHead}>zeros</span>
          <span style={styles.bigWordHead}>English</span>
          {BIG_UNITS.map((unit, i) => (
            <div key={unit.one} style={styles.bigWordRow}>
              <span style={styles.bigWordSpanish}>{unit.one}</span>
              <span style={styles.bigWordZeros}>{6 * (i + 1)}</span>
              <span style={styles.bigWordEnglish}>{unit.english}</span>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who absolutely loves numbers — so he can see how to write and say
          any number in Spanish, all the way up to the <Es>decillones</Es>!
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Words are set in{" "}
          <SettingsLink href="https://fonts.google.com/specimen/Andika">Andika</SettingsLink>
          , a typeface made for children learning to read.
        </SettingsAboutText>
        <SettingsAboutText>
          Learn more about{" "}
          <SettingsLink href="https://en.wikipedia.org/wiki/Long_and_short_scales">long and short scales</SettingsLink>
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

export default function SpanishNumbers() {
  const pad = useNumberInput({ max: MAX_NUMBER });
  const [showSettings, setShowSettings] = useState(false);
  const [colorize, setColorize] = useState(true);
  const [showSay, setShowSay] = useState(true);
  const [spain, setSpain] = useState(false);
  const [useDots, setUseDots] = useState(false);
  const speech = useSpeech({ lang: "es", rate: 0.8, prefer: spain ? SPAIN_VOICES : LATAM_VOICES });

  const { input, isEmpty } = pad;
  const hasValue = !isEmpty && input !== "0";
  const canAddMil = hasValue && input.length + 3 <= MAX_DIGITS;
  const separator = useDots ? "." : ",";
  const parts = toSpanishParts(input);
  const words = parts.flatMap((p) => p.words);
  const funFact = getFunFact(input, spain);

  // The say-it guide is extra content, so count it: turning it off lets the words grow.
  const readingCharCount = words.reduce(
    (sum, w) => sum + w.text.length + 1 + (showSay ? sayOf(w, spain).length * 0.5 : 0), 0
  );
  const partsCharCount = parts.reduce(
    (sum, p) => sum + toSpanishText([p]).length + partValueLabel(p, separator).length, 0
  );

  // A changed number makes the old reading stale, so stop saying it.
  const { stop } = speech;
  useEffect(() => { stop(); }, [input, spain, stop]);

  return (
    <div className="toy-container">
      <BackgroundDots count={20} />

      {/* Header */}
      <StickyHeader
        title="Spanish Numbers"
        subtitle="Write and say any number in Spanish"
        onGearClick={() => setShowSettings(true)}
      />

      {/* Settings overlay */}
      <SpanishSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        colorize={colorize} setColorize={setColorize}
        showSay={showSay} setShowSay={setShowSay}
        spain={spain} setSpain={setSpain}
        useDots={useDots} setUseDots={setUseDots}
      />

      <ReadingCard
        pad={pad} number={formatDigits(input, separator)} colorize={colorize}
        emptyLabel="Spanish number words"
        countLabel={plural(words.length, "word")}
        zeroHint="cero means zero"
        wordKey={<WordKey colorize={colorize} showSay={showSay} spain={spain} separator={separator} />}
        reading={<Reading parts={parts} colorize={colorize} showSay={showSay} spain={spain} />}
        readingFit={{ count: readingCharCount, maxFont: 44, minFont: 15, fitKey: `${input}|${showSay}|${spain}` }}
        readingStyle={styles.readingGaps}
        parts={parts.map((part) => ({
          words: <InlineWords words={part.words} colorize={colorize} />,
          value: partValueLabel(part, separator),
        }))}
        partsFit={{ count: partsCharCount, fitKey: `${input}|${useDots}` }}
        chipStyle={styles.chip} chipWordsStyle={styles.chipWords}
      />

      <FunFact text={funFact} />

      <Numpad
        pad={pad}
        middleKey={speech.hasVoice && (
          <NumpadSpeakKey speech={speech} disabled={isEmpty} getText={() => speechChunks(parts)} />
        )}
        rightKey={
          // Adds three zeros — one mil bigger
          <NumpadKey
            pad={pad} id="mil" disabled={!canAddMil} label="Times a thousand" style={styles.milBtn}
            onClick={() => pad.set(input + "000", "mil")}
          >
            <span style={styles.milWord}>×mil</span>
            <span style={styles.milZeros}>000</span>
          </NumpadKey>
        }
      />
    </div>
  );
}

const styles = {
  word: {
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  unitWord: {
    display: "flex", flexDirection: "column", alignItems: "center",
    ...UNIT_PILL,
    borderRadius: "0.25em", padding: "0 0.18em",
  },
  say: {
    fontFamily: "var(--font-body)", fontWeight: 600,
    fontSize: "max(10px, 0.32em)", lineHeight: 1.3, letterSpacing: "0.02em",
    whiteSpace: "nowrap", color: SAY_COLOR,
  },
  wordText: {
    fontFamily: WORD_FONT, fontWeight: 700, lineHeight: 1.15, whiteSpace: "nowrap",
  },
  key: {
    margin: "auto 0", width: "100%",
    display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
    columnGap: 2, rowGap: 12,
  },
  keyItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  keySay: {
    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 9, lineHeight: 1,
    color: SAY_COLOR, whiteSpace: "nowrap",
  },
  keyWord: {
    fontFamily: WORD_FONT, fontWeight: 700, fontSize: 17, lineHeight: 1.15,
    whiteSpace: "nowrap",
  },
  keyUnitPill: {
    ...UNIT_PILL,
    borderRadius: 6, padding: "0 3px",
  },
  keyValue: {
    fontSize: 11, color: "rgba(255,255,255,0.55)",
    fontFamily: "var(--font-body)", fontWeight: 500, whiteSpace: "nowrap",
  },
  readingGaps: { columnGap: "0.3em", rowGap: "0.12em" },
  chip: { padding: "0.2em 0.45em" },
  // Long parts (doscientos treinta y cuatro mil) wrap inside their chip.
  chipWords: { fontSize: "1.05em", lineHeight: 1.2, textAlign: "center" },
  inlineWords: { fontFamily: WORD_FONT, fontWeight: 700 },
  bigWords: {
    display: "grid", gridTemplateColumns: "auto auto 1fr",
    columnGap: 14, rowGap: 4, margin: "4px 0 12px",
  },
  bigWordHead: {
    fontFamily: "var(--font-body)", fontSize: 11, textTransform: "uppercase",
    letterSpacing: 1, color: "rgba(255,255,255,0.4)",
  },
  bigWordRow: { display: "contents" },
  bigWordSpanish: { fontFamily: WORD_FONT, fontWeight: 700, fontSize: 16, color: "#FFD030" },
  bigWordZeros: {
    fontFamily: "var(--font-body)", fontSize: 13, textAlign: "right",
    color: "rgba(255,255,255,0.75)", alignSelf: "center",
  },
  bigWordEnglish: {
    fontFamily: "var(--font-body)", fontSize: 13,
    color: "rgba(255,255,255,0.55)", alignSelf: "center",
  },
  // Warm fiesta colors
  milBtn: {
    background: "linear-gradient(135deg, #C2185B, #E64A19)",
    border: "3px solid #FFD030",
    boxShadow: "0 5px 14px rgba(194,24,91,0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
    color: "#FFD030", flexDirection: "column", gap: 2,
  },
  milWord: { fontFamily: WORD_FONT, fontWeight: 700, fontSize: 24, lineHeight: 1 },
  milZeros: { fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11, lineHeight: 1, opacity: 0.85 },
};
