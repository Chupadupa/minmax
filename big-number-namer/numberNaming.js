// ── Naming Logic ──────────────────────────────────────────────────────────────

const STANDARD_ILLIONS = [
  "", "million", "billion", "trillion", "quadrillion", "quintillion",
  "sextillion", "septillion", "octillion", "nonillion", "decillion"
];
const ONES_PREFIX = ["", "un", "duo", "tre", "quattuor", "quin", "sex", "septen", "octo", "novem"];
const TENS_PREFIX = ["", "deci", "viginti", "triginta", "quadraginta", "quinquaginta", "sexaginta", "septuaginta", "octoginta", "nonaginta"];
const HUNDREDS_PREFIX = ["", "centi", "ducenti", "trecenti", "quadringenti", "quingenti", "sescenti", "septingenti", "octingenti", "nongenti"];
const ILLION_ROOTS = ["", "m", "b", "tr", "quadr", "quint", "sext", "sept", "oct", "non", "dec"];

function getGroupPrefix(n, useDashes) {
  if (n <= 0) return "";
  if (n <= 10) return ILLION_ROOTS[n];
  const ones = n % 10, tens = Math.floor(n / 10) % 10, hundreds = Math.floor(n / 100);
  const parts = [];
  if (ones > 0) parts.push(ONES_PREFIX[ones]);
  if (tens > 0) parts.push(TENS_PREFIX[tens]);
  if (hundreds > 0) parts.push(HUNDREDS_PREFIX[hundreds]);
  if (parts.length > 0) {
    let last = parts[parts.length - 1];
    if (last.endsWith("i") || last.endsWith("a")) last = last.slice(0, -1);
    parts[parts.length - 1] = last;
  }
  return parts.join(useDashes ? "-" : "");
}

function getIllionPrefix(n, useDashes) {
  if (n <= 0) return "";
  if (n <= 999) return getGroupPrefix(n, useDashes);
  const sep = useDashes ? "-" : "";
  const q = Math.floor(n / 1000), r = n % 1000;
  let result = getIllionPrefix(q, useDashes) + sep + "illin";
  if (r > 0) result += sep + getGroupPrefix(r, useDashes);
  return result;
}

function getIllionName(n, useDashes = false) {
  if (n <= 0) return "";
  if (n <= 10) return STANDARD_ILLIONS[n];
  const sep = useDashes ? "-" : "";
  return getIllionPrefix(n, useDashes) + sep + "illion";
}

export function getNumberName(zeros, useDashes = false) {
  if (zeros === 0) return "one";
  if (zeros === 1) return "ten";
  if (zeros === 2) return "one hundred";
  if (zeros === 3) return "one thousand";
  if (zeros === 4) return "ten thousand";
  if (zeros === 5) return "one hundred thousand";
  const illionIndex = Math.floor(zeros / 3) - 1;
  const remainder = zeros % 3;
  const illionName = getIllionName(illionIndex, useDashes);
  let prefix = "one ";
  if (remainder === 1) prefix = "ten ";
  if (remainder === 2) prefix = "one hundred ";
  return prefix + illionName;
}

export function formatZerosWithCommas(zerosCount) {
  if (zerosCount === 0) return "";
  const totalDigits = 1 + zerosCount;
  const firstGroupLen = ((totalDigits - 1) % 3) + 1;
  const zerosInFirstGroup = firstGroupLen - 1;
  const fullGroups = Math.floor((zerosCount - zerosInFirstGroup) / 3);
  const parts = [];
  if (zerosInFirstGroup > 0) parts.push("0".repeat(zerosInFirstGroup));
  for (let i = 0; i < fullGroups; i++) parts.push("000");
  if (zerosInFirstGroup > 0) return parts.join(",");
  return parts.length > 0 ? "," + parts.join(",") : "";
}
