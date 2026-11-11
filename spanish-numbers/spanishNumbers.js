// ── Spanish Number Logic ──────────────────────────────────────────────────────
//
// Pure functions (no React dependency) that write whole numbers out in Spanish
// words, with a how-to-say-it guide for English readers over each word
// ("KWAH-troh"). Spanish uses the long scale: a new big word every six zeros —
// millón (10⁶), billón (10¹²), trillón (10¹⁸) … all the way up to decillón
// (10⁶⁰). In between, mil does the work: mil millones is 10⁹.
//
// Numbers travel as digit strings so they can go far past what a JavaScript
// number holds exactly.

// The biggest big word is 10⁶⁰, so the biggest number is 999,999 of them and
// change: 66 nines.
export const MAX_DIGITS = 66;
export const MAX_NUMBER = "9".repeat(MAX_DIGITS);

// ── Words ────────────────────────────────────────────────────────────────────
//
// Each word carries how to say it twice: as in Latin America, and as in Spain,
// where c (before e, i) and z sound like the "th" in "thin". The syllable said
// loudest is in capitals.

const sayBoth = (latam, spain = latam) => ({ latam, spain });

// The digits 1–9 on their own, as the last part of a word (veinti-trés), and
// the shortened forms of uno used before mil and the big words.
const ONES = [
  { text: "cero", say: sayBoth("SEH-roh", "THEH-roh") },
  { text: "uno", say: sayBoth("OO-noh") },
  { text: "dos", say: sayBoth("DOHS") },
  { text: "tres", say: sayBoth("TRESS") },
  { text: "cuatro", say: sayBoth("KWAH-troh") },
  { text: "cinco", say: sayBoth("SEEN-koh", "THEEN-koh") },
  { text: "seis", say: sayBoth("SAYS") },
  { text: "siete", say: sayBoth("SYEH-teh") },
  { text: "ocho", say: sayBoth("OH-choh") },
  { text: "nueve", say: sayBoth("NWEH-beh") },
];
const UN = { text: "un", say: sayBoth("OON") };

// Squished onto dieci- and veinti-, a few digits take an accent mark so the
// stress stays at the end: veintidós, veintitrés, dieciséis.
const ONES_AT_END = { 2: "dós", 3: "trés", 6: "séis" };
const UN_AT_END = "ún";

// 11–15 each have their own word: the start comes from the digit, and the
// -ce ending is what's left of diez.
const TEENS = {
  11: { pieces: [["on", 1], ["ce", 1]], say: sayBoth("OHN-seh", "OHN-theh") },
  12: { pieces: [["do", 2], ["ce", 1]], say: sayBoth("DOH-seh", "DOH-theh") },
  13: { pieces: [["tre", 3], ["ce", 1]], say: sayBoth("TREH-seh", "TREH-theh") },
  14: { pieces: [["cator", 4], ["ce", 1]], say: sayBoth("kah-TOR-seh", "kah-TOR-theh") },
  15: { pieces: [["quin", 5], ["ce", 1]], say: sayBoth("KEEN-seh", "KEEN-theh") },
};
const DIEZ = { text: "diez", say: sayBoth("DYESS", "DYETH") };
const DIECI = { text: "dieci", say: sayBoth("dyeh-see-", "dyeh-thee-") };
const VEINTE = { text: "veinte", say: sayBoth("BAYN-teh") };
const VEINTI = { text: "veinti", say: sayBoth("bayn-tee-") };

// The tens, 30–90 (index = tens digit).
const TENS = [
  null, null, null,
  { text: "treinta", say: sayBoth("TRAYN-tah") },
  { text: "cuarenta", say: sayBoth("kwah-REN-tah") },
  { text: "cincuenta", say: sayBoth("seen-KWEN-tah", "theen-KWEN-tah") },
  { text: "sesenta", say: sayBoth("seh-SEN-tah") },
  { text: "setenta", say: sayBoth("seh-TEN-tah") },
  { text: "ochenta", say: sayBoth("oh-CHEN-tah") },
  { text: "noventa", say: sayBoth("noh-BEN-tah") },
];

// The hundreds (index = hundreds digit). One hundred on its own is cien, and
// ciento when more follows. Five, seven and nine change shape.
const CIEN = { text: "cien", say: sayBoth("SYEN", "THYEN") };
const HUNDREDS = [
  null,
  { text: "ciento", say: sayBoth("SYEN-toh", "THYEN-toh") },
  { text: "doscientos", say: sayBoth("dohs-SYEN-tohs", "dohs-THYEN-tohs") },
  { text: "trescientos", say: sayBoth("tress-SYEN-tohs", "tress-THYEN-tohs") },
  { text: "cuatrocientos", say: sayBoth("kwah-troh-SYEN-tohs", "kwah-troh-THYEN-tohs") },
  { text: "quinientos", say: sayBoth("kee-NYEN-tohs") },
  { text: "seiscientos", say: sayBoth("says-SYEN-tohs", "says-THYEN-tohs") },
  { text: "setecientos", say: sayBoth("seh-teh-SYEN-tohs", "seh-teh-THYEN-tohs") },
  { text: "ochocientos", say: sayBoth("oh-choh-SYEN-tohs", "oh-choh-THYEN-tohs") },
  { text: "novecientos", say: sayBoth("noh-beh-SYEN-tohs", "noh-beh-THYEN-tohs") },
];

const Y = { text: "y", say: sayBoth("ee") };
export const MIL = { text: "mil", say: sayBoth("MEEL") };

// The big words, each a millón times the one before: BIG_UNITS[k - 1] is
// 10^(6k). `english` is the same number's name in English, which counts in
// thousands instead (so un billón is a trillion).
export const BIG_UNITS = [
  { one: "millón", many: "millones", say: sayBoth("mee-YOHN"), english: "million" },
  { one: "billón", many: "billones", say: sayBoth("bee-YOHN"), english: "trillion" },
  { one: "trillón", many: "trillones", say: sayBoth("tree-YOHN"), english: "quintillion" },
  { one: "cuatrillón", many: "cuatrillones", say: sayBoth("kwah-tree-YOHN"), english: "septillion" },
  { one: "quintillón", many: "quintillones", say: sayBoth("keen-tee-YOHN"), english: "nonillion" },
  { one: "sextillón", many: "sextillones", say: sayBoth("seks-tee-YOHN"), english: "undecillion" },
  { one: "septillón", many: "septillones", say: sayBoth("sep-tee-YOHN"), english: "tredecillion" },
  { one: "octillón", many: "octillones", say: sayBoth("ohk-tee-YOHN"), english: "quindecillion" },
  { one: "nonillón", many: "nonillones", say: sayBoth("noh-nee-YOHN"), english: "septendecillion" },
  { one: "decillón", many: "decillones", say: sayBoth("deh-see-YOHN", "deh-thee-YOHN"), english: "novemdecillion" },
];

// -YOHN → -YOH-ness for the plural (millones).
const pluralSay = (s) => s.replace(/YOHN$/, "YOH-ness");

// ── Reading ──────────────────────────────────────────────────────────────────
//
// A word is { text, say, pieces, kind }. `say` is { latam, spain }. `pieces`
// splits the spelling by the digit each bit comes from, for coloring:
// veintitrés → [veinti, 2] [trés, 3]; a null digit means no digit at all.
// kind is "number" (made from digits), "and" (y), "mil" or "unit" (a big word).

function numberWord(pieces, say) {
  return { text: pieces.map(([t]) => t).join(""), say, pieces, kind: "number" };
}

function plainWord(base, kind, digit = null) {
  return { text: base.text, say: base.say, pieces: [[base.text, digit]], kind };
}

// A digit tacked onto the end of dieci- or veinti-.
function onesAtEnd(o, short) {
  if (o === 1 && short) return { text: UN_AT_END, say: UN.say };
  return { text: ONES_AT_END[o] ?? ONES[o].text, say: ONES[o].say };
}

function joinedWord(prefix, tensDigit, o, short) {
  const end = onesAtEnd(o, short);
  return numberWord(
    [[prefix.text, tensDigit], [end.text, o]],
    sayBoth(prefix.say.latam + end.say.latam, prefix.say.spain + end.say.spain),
  );
}

// 1–99 as words. `short` gives un / veintiún, for before mil and the big words.
function tensAndOnes(n, short) {
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (n === 0) return [];
  if (n < 10) return [plainWord(o === 1 && short ? UN : ONES[o], "number", o)];
  if (n === 10) return [plainWord(DIEZ, "number", 1)];
  if (n < 16) return [numberWord(TEENS[n].pieces, TEENS[n].say)];
  if (n < 20) return [joinedWord(DIECI, 1, o, short)];
  if (n === 20) return [plainWord(VEINTE, "number", 2)];
  if (n < 30) return [joinedWord(VEINTI, 2, o, short)];
  const tens = plainWord(TENS[t], "number", t);
  if (o === 0) return [tens];
  return [tens, plainWord(Y, "and"), plainWord(o === 1 && short ? UN : ONES[o], "number", o)];
}

// 1–999 as words.
function upTo999(n, short) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const words = [];
  if (h === 1) words.push(plainWord(rest === 0 ? CIEN : HUNDREDS[1], "number", 1));
  else if (h > 1) words.push(plainWord(HUNDREDS[h], "number", h));
  return words.concat(tensAndOnes(rest, short));
}

// 1–999,999 as words: mil (never "un mil") for the thousands, then the rest.
function upTo999999(n, short) {
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const words = [];
  if (thousands === 1) words.push(plainWord(MIL, "mil"));
  else if (thousands > 1) words.push(...upTo999(thousands, true), plainWord(MIL, "mil"));
  return words.concat(upTo999(rest, short));
}

function bigUnitWord(k, plural) {
  const unit = BIG_UNITS[k - 1];
  const text = plural ? unit.many : unit.one;
  const say = plural
    ? sayBoth(pluralSay(unit.say.latam), pluralSay(unit.say.spain))
    : unit.say;
  return { text, say, pieces: [[text, null]], kind: "unit" };
}

// Reads a digit string (no leading zeros) into its parts, biggest first. Each
// part is { words, value, zeros }: its words, the amount it stands for as a
// digit string, and how many of those digits are trailing zeros from its place.
//   • Each group of six digits is counted, then named: dos millones.
//   • The bottom six split in two at mil: 234,567 → doscientos treinta y
//     cuatro mil + quinientos sesenta y siete.
//   • Exactly one of a big word is un millón (singular); more are millones.
//   • Before mil and the big words, uno shortens to un: veintiún mil.
export function toSpanishParts(digits) {
  if (!digits) return [];
  if (/^0+$/.test(digits)) {
    return [{ words: [plainWord(ONES[0], "number", 0)], value: "0", zeros: 0 }];
  }

  const padded = digits.padStart(Math.ceil(digits.length / 6) * 6, "0");
  const groupCount = padded.length / 6;
  const parts = [];

  for (let g = 0; g < groupCount; g++) {
    const k = groupCount - 1 - g;
    const group = Number(padded.slice(g * 6, g * 6 + 6));
    if (group === 0) continue;

    if (k > 0) {
      const words = group === 1
        ? [plainWord(UN, "number", 1)]
        : upTo999999(group, true);
      words.push(bigUnitWord(k, group !== 1));
      parts.push({ words, value: String(group) + "0".repeat(6 * k), zeros: 6 * k });
      continue;
    }

    const thousands = Math.floor(group / 1000);
    const rest = group % 1000;
    if (thousands > 0) {
      const words = thousands === 1 ? [] : upTo999(thousands, true);
      words.push(plainWord(MIL, "mil"));
      parts.push({ words, value: String(thousands) + "000", zeros: 3 });
    }
    if (rest > 0) parts.push({ words: upTo999(rest, false), value: String(rest), zeros: 0 });
  }

  return parts;
}

// The whole reading as one string, e.g. for text-to-speech.
export function toSpanishText(parts) {
  return parts.flatMap((p) => p.words.map((w) => w.text)).join(" ");
}

// The single words for the digits 0–9 and a few place words, for the key
// shown before a number is typed.
export function digitWord(d) {
  return plainWord(ONES[d], "number", d);
}
export function keyWords() {
  return [
    { word: plainWord(DIEZ, "number", 1), value: "10" },
    { word: plainWord(VEINTE, "number", 2), value: "20" },
    { word: plainWord(CIEN, "number", 1), value: "100" },
    { word: plainWord(MIL, "mil"), value: "1000" },
    { word: bigUnitWord(1, false), value: "1000000" },
  ];
}

// If `digits` is exactly a big word (1 followed by 6k zeros), returns k.
export function bigUnitIndex(digits) {
  if (!/^10+$/.test(digits) || (digits.length - 1) % 6 !== 0) return 0;
  const k = (digits.length - 1) / 6;
  return k <= BIG_UNITS.length ? k : 0;
}

// Adds a separator every three digits from the right: 1,000,000, or 1.000.000
// the way Spain writes it.
export function formatDigits(digits, separator = ",") {
  if (!separator) return digits;
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += separator;
    out += digits[i];
  }
  return out;
}
