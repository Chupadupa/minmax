// ── The Toy List ──
// The one list of toys. The home page is built from it at build time (see
// hubPlugin in vite.config.js): one shelf per entry in SHELVES, one picture tile
// per toy, in the order written here. The build also checks the list against the
// toy folders, so a new toy can't be left off the home page by accident.
//
// Tiles should never move — a small child finds a toy by remembering where its
// picture was — so add new toys at the end of their shelf.

export const SHELVES = [
  { id: "numbers", name: "Numbers", color: "#F98F2B" },
  { id: "words", name: "Number Words", color: "#4FC26B" },
  { id: "shapes", name: "Shapes & Colors", color: "#E862C8" },
  { id: "space", name: "Space", color: "#4F9BF5" },
];

// id: the toy's folder. picture: an emoji (or, with textPicture, a plain
// character drawn in the heading font). colors: the tile's gradient — each
// shelf runs through its own family of colors, left to right.
export const TOYS = [
  { id: "big-number-namer", name: "Big Number Namer", picture: "🔢", shelf: "numbers", colors: ["#B91C3C", "#E0314B"] },
  { id: "calculator", name: "Calculator", picture: "🧮", shelf: "numbers", colors: ["#E03A2F", "#F4623A"] },
  { id: "odd-or-even", name: "Odd or Even", picture: "🧦", shelf: "numbers", colors: ["#F26A1B", "#F98F2B"] },
  { id: "prime-checker", name: "Prime Checker", picture: "🔍", shelf: "numbers", colors: ["#F0920F", "#F7B32B"] },
  { id: "pi-digits", name: "Pi Digits", picture: "π", textPicture: true, shelf: "numbers", colors: ["#E3AE0B", "#F5CF3A"] },

  { id: "roman-numerals", name: "Roman Numerals", picture: "🏛️", shelf: "words", colors: ["#6BA81E", "#94CC3A"] },
  { id: "chinese-numbers", name: "Chinese Numbers", picture: "🀄", shelf: "words", colors: ["#2E9E4F", "#4FC26B"] },
  { id: "spanish-numbers", name: "Spanish Numbers", picture: "💃", shelf: "words", colors: ["#12917A", "#2DBFA3"] },

  { id: "shape-selector", name: "Shape Selector", picture: "🔷", shelf: "shapes", colors: ["#E0457B", "#F7719A"] },
  { id: "color-mixer", name: "Color Combiner", picture: "🎨", shelf: "shapes", colors: ["#C936A8", "#E862C8"] },
  { id: "fraction-combiner", name: "Fraction Fitter", picture: "🥧", shelf: "shapes", colors: ["#9B45D6", "#B974F0"] },
  { id: "clock", name: "Time Teller", picture: "🕰️", shelf: "shapes", colors: ["#6D4BD8", "#8E73F2"] },

  { id: "solar-system", name: "Solar System", picture: "🪐", shelf: "space", colors: ["#2F6FE0", "#4F9BF5"] },
  { id: "exoplanets", name: "Exoplanets", picture: "🌟", shelf: "space", colors: ["#2B3A9E", "#4B5FD0"] },
];
