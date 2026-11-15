// ── Math Quiz Logic ──
// The questions of the Math Quiz: making one up, the four answers to choose
// from, the blocks that show how to work it out, and how to say it aloud. No
// React in here.
//
// A question is { op, a, b, answer } — a (op) b = answer — where op is one of
// OPS. No number in a question, and no answer offered, is ever below 0 or above
// the level it was made for, and no level goes past MAX_TOTAL.
//
// Exports: MAX_TOTAL, LEVELS, DEFAULT_LEVEL, OPS, RANDOM, OP_INFO,
// makeQuestion(mode, max, previous?), makeChoices(question, max?), blocksFor(question),
// sayQuestion(question, withAnswer?)

export const MAX_TOTAL = 100;

// How big the numbers get: the biggest number a question may hold.
export const LEVELS = [10, 20, 50, MAX_TOTAL];
export const DEFAULT_LEVEL = 20;

export const OPS = ["add", "sub", "mul", "div"];

// The mode that picks one of OPS afresh for every question.
export const RANDOM = "random";

export const OP_INFO = {
  add: { symbol: "+", name: "Addition", say: "plus", answer: (a, b) => a + b },
  sub: { symbol: "−", name: "Subtraction", say: "minus", answer: (a, b) => a - b },
  mul: { symbol: "×", name: "Multiplication", say: "times", answer: (a, b) => a * b },
  div: { symbol: "÷", name: "Division", say: "divided by", answer: (a, b) => a / b },
};

// Times tables stop at 10 × 10, which is also what keeps them under MAX_TOTAL.
const TABLE_MAX = 10;

// A question about zero turns up about one time in this many.
const ZERO_ODDS = 12;

// ── Random Helpers ──

const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = (list) => list[randInt(0, list.length - 1)];
const coin = () => Math.random() < 0.5;
const oneIn = (n) => randInt(1, n) === 1;

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Making a Question ──

// Every a × b that stays within `max`, both from 1 to TABLE_MAX. The ones with
// a 1 in them are too easy to be most of the quiz, so the rest are listed three
// times over.
function tablePairs(max) {
  const pairs = [];
  for (let a = 1; a <= TABLE_MAX; a++) {
    for (let b = 1; b <= TABLE_MAX && a * b <= max; b++) {
      const copies = a === 1 || b === 1 ? 1 : 3;
      for (let i = 0; i < copies; i++) pairs.push([a, b]);
    }
  }
  return pairs;
}

// The two numbers of a question, [a, b], for each operation.
const OPERANDS = {
  // The total is chosen first, so sums of every size are equally likely.
  add(max) {
    if (oneIn(ZERO_ODDS)) {
      const n = randInt(0, max);
      return coin() ? [n, 0] : [0, n];
    }
    const total = randInt(2, max);
    const a = randInt(1, total - 1);
    return [a, total - a];
  },

  // Never takes away more than there is, so the answer is never below zero.
  sub(max) {
    const a = randInt(1, max);
    return [a, oneIn(ZERO_ODDS) ? 0 : randInt(1, a)];
  },

  mul(max) {
    if (oneIn(ZERO_ODDS)) {
      const n = randInt(0, TABLE_MAX);
      return coin() ? [n, 0] : [0, n];
    }
    return pick(tablePairs(max));
  },

  // A times table backwards, so it always divides exactly — and never by zero.
  div(max) {
    const [quotient, divisor] = pick(tablePairs(max));
    return [quotient * divisor, divisor];
  },
};

// A new question for `mode` (one of OPS, or RANDOM) with no number above `max`.
// Give it the `previous` question and it won't ask the same thing twice running.
export function makeQuestion(mode, max, previous = null) {
  const limit = Math.min(max, MAX_TOTAL);
  let question;
  for (let tries = 0; tries < 20; tries++) {
    const op = mode === RANDOM ? pick(OPS) : mode;
    const [a, b] = OPERANDS[op](limit);
    question = { op, a, b, answer: OP_INFO[op].answer(a, b) };
    const same = previous && previous.op === op && previous.a === a && previous.b === b;
    if (!same) break;
  }
  return question;
}

// ── Answers to Choose From ──

const CHOICE_COUNT = 4;

// The right answer and three wrong ones, smallest first, none above `max` (the
// level the question was made for). The wrong ones are near misses: one or two
// out, ten out, or the answer to a slightly different question (3 × 4 next to
// 3 × 5; a sum done as a take-away). How many of them are smaller than the
// right answer is left to chance, so it turns up in every place in the row.
export function makeChoices({ op, a, b, answer }, max = MAX_TOTAL) {
  const top = Math.min(max, MAX_TOTAL);
  const wrongCount = CHOICE_COUNT - 1;
  const slips = {
    add: [Math.abs(a - b)],
    sub: [a + b, b],
    mul: [a + b, a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b],
    div: [b, a - b, answer + b],
  }[op];
  const tens = answer >= 10 ? [answer - 10, answer + 10] : [];
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, ...tens, ...slips];
  const misses = [...new Set(shuffle(near))].filter((n) => n >= 0 && n <= top && n !== answer);

  // The wrong answers on one side of the right one (-1 below, 1 above): the
  // near misses first, then the closest numbers left, in case those run short.
  const side = (sign) => {
    const found = misses.filter((n) => sign * (n - answer) > 0);
    for (let n = answer + sign; found.length < wrongCount && n >= 0 && n <= top; n += sign) {
      if (!found.includes(n)) found.push(n);
    }
    return found;
  };
  const below = side(-1);
  const above = side(1);
  const smaller = Math.min(below.length, Math.max(randInt(0, wrongCount), wrongCount - above.length));
  const wrong = [...below.slice(0, smaller), ...above.slice(0, wrongCount - smaller)];
  return [answer, ...wrong].sort((x, y) => x - y);
}

// ── Blocks ──

// The question as blocks to count: { cols, half, cells }. `cells` is the blocks
// in reading order, `cols` to a row; `half` asks for a little gap halfway along
// each row, so a row of ten reads as five and five.
//
// A cell is 0 or 1 — two colors, for telling groups apart — or "gone" for a
// block that has been taken away.
//
//   3 + 4    three blocks of one color, then four of the other
//   9 − 4    nine blocks, the last four gone
//   3 × 4    three rows of four
//   12 ÷ 3   twelve blocks in rows of three — count the rows
export function blocksFor({ op, a, b, answer }) {
  const run = (count, cell) => Array(count).fill(cell);
  const rows = (count, length) => Array.from({ length: count }, (_, r) => run(length, r % 2)).flat();

  switch (op) {
    case "add": return { cols: 10, half: true, cells: [...run(a, 0), ...run(b, 1)] };
    case "sub": return { cols: 10, half: true, cells: [...run(answer, 0), ...run(b, "gone")] };
    case "mul": return { cols: Math.max(b, 1), half: false, cells: rows(a, b) };
    default: return { cols: b, half: false, cells: rows(answer, b) };
  }
}

// ── Saying It ──

// "7 plus 5", or with the answer, "7 plus 5 equals 12".
export function sayQuestion({ op, a, b, answer }, withAnswer = false) {
  return `${a} ${OP_INFO[op].say} ${b}${withAnswer ? ` equals ${answer}` : ""}`;
}
