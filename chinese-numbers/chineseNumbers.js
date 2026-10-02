// ── Chinese Number Logic ──────────────────────────────────────────────────────
//
// Pure functions (no React dependency) that write whole numbers in Chinese
// characters, with pinyin for how to say each one. Chinese counts in groups of
// four digits: 十 (10), 百 (100) and 千 (1,000) inside a group, then a new
// "big word" every four more zeros — 万 (10⁴), 亿 (10⁸), 兆 (10¹²) … all the
// way up to 不可思议 (10⁶⁴).
//
// Numbers travel as digit strings so they can go far past what a JavaScript
// number holds exactly.

// The biggest big word is 10⁶⁴, so the biggest number is 9,999 of them and
// change: 68 nines.
export const MAX_DIGITS = 68;
export const MAX_NUMBER = "9".repeat(MAX_DIGITS);

// The ten digits, 0–9. Two has a second form, 两 (liǎng), used when counting.
export const DIGITS = [
  { char: "零", pinyin: "líng" },
  { char: "一", pinyin: "yī" },
  { char: "二", pinyin: "èr" },
  { char: "三", pinyin: "sān" },
  { char: "四", pinyin: "sì" },
  { char: "五", pinyin: "wǔ" },
  { char: "六", pinyin: "liù" },
  { char: "七", pinyin: "qī" },
  { char: "八", pinyin: "bā" },
  { char: "九", pinyin: "jiǔ" },
];
const LIANG = { simplified: "两", traditional: "兩", pinyin: "liǎng" };

// Place words inside a group of four, by place (1 = tens … 3 = thousands).
export const PLACES = [
  null,
  { char: "十", pinyin: "shí", value: "10" },
  { char: "百", pinyin: "bǎi", value: "100" },
  { char: "千", pinyin: "qiān", value: "1000" },
];

// The big words, each 万 times the one before: BIG_UNITS[k - 1] is 10^(4k).
// Past 极, the words come from old Buddhist texts; old books disagree on their
// sizes, so these follow the common modern list where each step is still 万.
export const BIG_UNITS = [
  { simplified: "万", traditional: "萬", pinyin: ["wàn"] },
  { simplified: "亿", traditional: "億", pinyin: ["yì"] },
  { simplified: "兆", traditional: "兆", pinyin: ["zhào"] },
  { simplified: "京", traditional: "京", pinyin: ["jīng"] },
  { simplified: "垓", traditional: "垓", pinyin: ["gāi"] },
  { simplified: "秭", traditional: "秭", pinyin: ["zǐ"] },
  { simplified: "穰", traditional: "穰", pinyin: ["ráng"] },
  { simplified: "沟", traditional: "溝", pinyin: ["gōu"] },
  { simplified: "涧", traditional: "澗", pinyin: ["jiàn"] },
  { simplified: "正", traditional: "正", pinyin: ["zhèng"] },
  { simplified: "载", traditional: "載", pinyin: ["zài"] },
  { simplified: "极", traditional: "極", pinyin: ["jí"] },
  { simplified: "恒河沙", traditional: "恆河沙", pinyin: ["héng", "hé", "shā"], meaning: "sands of the Ganges River" },
  { simplified: "阿僧祇", traditional: "阿僧祇", pinyin: ["ā", "sēng", "qí"], meaning: "countless" },
  { simplified: "那由他", traditional: "那由他", pinyin: ["nà", "yóu", "tā"] },
  { simplified: "不可思议", traditional: "不可思議", pinyin: ["bù", "kě", "sī", "yì"], meaning: "unthinkable" },
];

// Characters of big word k (1 = 万) in the chosen script.
export function bigUnitChars(k, traditional) {
  const unit = BIG_UNITS[k - 1];
  return traditional ? unit.traditional : unit.simplified;
}

// ── Reading ──────────────────────────────────────────────────────────────────
//
// A reading is a list of parts, one per group of four digits, biggest first.
// Each part is { syllables, value, unit }: its syllables (one character each,
// with pinyin), the amount it stands for as a digit string, and its big word
// (0 for the ones group). A syllable is { char, pinyin, kind } where kind is
// "digit" (with `digit` 0–9), "place" (十 百 千, with `place` 1–3) or "unit"
// (a big word — multi-character words give one syllable per character).

const FOURTH_TONE = /[àèìòùǜ]/;

function digitSyllable(d) {
  return { ...DIGITS[d], kind: "digit", digit: d };
}

// 一 (yī) changes its tone before the word it counts: yì before 百 and 千 and
// most big words, yí before a fourth-tone word like 万 (yí wàn). As the ones
// digit of a bigger group it keeps yī (十一万 shí yī wàn), and so does 一十
// in the middle of a number (一百一十). Works on one part's syllables.
function applyYiTones(syllables) {
  syllables.forEach((s, i) => {
    if (s.kind !== "digit" || s.digit !== 1) return;
    const next = syllables[i + 1];
    const beforePlace = next?.kind === "place" && next.place > 1;
    const aloneBeforeUnit = next?.kind === "unit"
      && syllables.slice(0, i).every((p) => p.kind === "digit" && p.digit === 0);
    if (beforePlace || aloneBeforeUnit) s.pinyin = FOURTH_TONE.test(next.pinyin) ? "yí" : "yì";
  });
}

// Reads a digit string (no leading zeros) into its parts. Rules:
//   • Zeros at the end of a group are silent: 一千一百万一千 (11,001,000).
//   • Any other run of zeros — in the middle of a group, at the front of one,
//     or whole empty groups — is read as a single 零: 一亿零一千 (100,001,000).
//   • A number that starts with 十 drops the 一: 十五 (15), 十万 (100,000).
//   • With `useLiang`, a leading 2 before 百, 千 or a big word is 两: 两千.
export function toChineseParts(digits, { traditional = false, useLiang = true } = {}) {
  if (!digits) return [];
  if (/^0+$/.test(digits)) return [{ syllables: [digitSyllable(0)], value: "0", unit: 0 }];

  const padded = digits.padStart(Math.ceil(digits.length / 4) * 4, "0");
  const groupCount = padded.length / 4;
  const parts = [];
  let started = false;
  let pendingZero = false;

  for (let g = 0; g < groupCount; g++) {
    const unit = groupCount - 1 - g;
    const group = padded.slice(g * 4, g * 4 + 4);
    if (group === "0000") {
      if (started) pendingZero = true;
      continue;
    }

    const syllables = [];
    let zeroGap = pendingZero;
    let seenDigit = false;
    for (let i = 0; i < 4; i++) {
      const d = Number(group[i]);
      const place = 3 - i;
      if (d === 0) {
        if (started || seenDigit) zeroGap = true;
        continue;
      }
      if (zeroGap) syllables.push(digitSyllable(0));
      zeroGap = false;

      const leading = !started && !seenDigit;
      if (leading && d === 2 && useLiang && (place >= 2 || (place === 0 && unit > 0))) {
        syllables.push({
          char: traditional ? LIANG.traditional : LIANG.simplified,
          pinyin: LIANG.pinyin, kind: "digit", digit: 2,
        });
      } else if (!(leading && d === 1 && place === 1)) {
        syllables.push(digitSyllable(d));
      }
      if (place > 0) syllables.push({ ...PLACES[place], kind: "place", place });
      seenDigit = true;
    }

    if (unit > 0) {
      const chars = [...bigUnitChars(unit, traditional)];
      chars.forEach((char, i) => {
        syllables.push({ char, pinyin: BIG_UNITS[unit - 1].pinyin[i], kind: "unit" });
      });
    }
    applyYiTones(syllables);
    parts.push({ syllables, value: group.replace(/^0+/, "") + "0".repeat(4 * unit), unit });
    started = true;
    pendingZero = false;
  }

  return parts;
}

// The whole reading as one string of characters, e.g. for text-to-speech.
export function toChineseText(parts) {
  return parts.map((p) => p.syllables.map((s) => s.char).join("")).join("");
}

// Years are read digit by digit, with 〇 for zero: 2026 → 二〇二六.
export function readDigitByDigit(digits) {
  return [...digits].map((d) => (d === "0" ? "〇" : DIGITS[d].char)).join("");
}

// If `digits` is exactly a big word (1 followed by 4k zeros), returns k.
export function bigUnitIndex(digits) {
  if (!/^10+$/.test(digits) || (digits.length - 1) % 4 !== 0) return 0;
  const k = (digits.length - 1) / 4;
  return k <= BIG_UNITS.length ? k : 0;
}

// Adds commas to a digit string every `groupSize` digits from the right —
// 3 for the usual 1,000,000 or 4 for the Chinese-style 100,0000.
export function formatDigits(digits, groupSize = 3) {
  if (!groupSize) return digits;
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % groupSize === 0) out += ",";
    out += digits[i];
  }
  return out;
}
