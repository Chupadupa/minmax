// ── Color Palette & Named Colors ─────────────────────────────────────────────
//
// Color definitions for the Color Mixer toy.
// Palette = colors available to mix; Named Colors = dictionary for matching.
//

// ── RYB Cube Corners ────────────────────────────────────────────────────────
//
// Maps the RYB unit cube to RGB for trilinear interpolation.
// Tuned so that primary mixes match what kids expect:
//   Red + Blue → Purple,  Red + Yellow → Orange,  Blue + Yellow → Green
//

const RYB_CUBE = {
  white:  [255, 255, 255], // (0,0,0) — no pigment
  red:    [255,   0,   0], // (1,0,0)
  yellow: [255, 255,   0], // (0,1,0)
  blue:   [  0,   0, 255], // (0,0,1)
  orange: [255, 128,   0], // (1,1,0) — red + yellow
  purple: [128,   0, 128], // (1,0,1) — red + blue
  green:  [  0, 150,   0], // (0,1,1) — yellow + blue
  black:  [ 45,  25,   0], // (1,1,1) — all pigment (dark brown-black)
};

export function rybToRgb(r, y, b) {
  const { white: w, red: rd, yellow: yl, blue: bl, orange: or, purple: pu, green: gr, black: bk } = RYB_CUBE;
  const result = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(
      w[i]  * (1-r) * (1-y) * (1-b) +
      rd[i] *   r   * (1-y) * (1-b) +
      yl[i] * (1-r) *   y   * (1-b) +
      bl[i] * (1-r) * (1-y) *   b   +
      or[i] *   r   *   y   * (1-b) +
      pu[i] *   r   * (1-y) *   b   +
      gr[i] * (1-r) *   y   *   b   +
      bk[i] *   r   *   y   *   b
    );
  }
  return result.map(v => Math.max(0, Math.min(255, v)));
}

// ── Color Palette ────────────────────────────────────────────────────────────
//
// Each color has an rgb (for display), hex, and ryb (for subtractive mixing).
//

export const PALETTE = [
  { name: "Red",     rgb: [220, 40, 40],   hex: "#DC2828", ryb: [1.0, 0.0, 0.0] },
  { name: "Orange",  rgb: [240, 140, 20],  hex: "#F08C14", ryb: [0.5, 0.5, 0.0] },
  { name: "Yellow",  rgb: [250, 220, 20],  hex: "#FADC14", ryb: [0.0, 1.0, 0.0] },
  { name: "Green",   rgb: [40, 170, 60],   hex: "#28AA3C", ryb: [0.0, 0.5, 0.5] },
  { name: "Blue",    rgb: [30, 100, 210],  hex: "#1E64D2", ryb: [0.0, 0.0, 1.0] },
  { name: "Indigo",  rgb: [60, 40, 140],   hex: "#3C288C", ryb: [0.2, 0.0, 0.8] },
  { name: "Violet",  rgb: [140, 50, 180],  hex: "#8C32B4", ryb: [0.5, 0.0, 0.5] },
  { name: "Pink",    rgb: [240, 130, 170], hex: "#F082AA", ryb: [0.4, 0.0, 0.1] },
  { name: "Brown",   rgb: [140, 80, 30],   hex: "#8C501E", ryb: [0.6, 0.5, 0.2] },
  { name: "Magenta", rgb: [220, 30, 160],  hex: "#DC1EA0", ryb: [0.8, 0.0, 0.3] },
  { name: "Cyan",    rgb: [20, 190, 220],  hex: "#14BEDC", ryb: [0.0, 0.2, 0.7] },
  { name: "White",   rgb: [245, 245, 245], hex: "#F5F5F5", ryb: [0.0, 0.0, 0.0] },
  { name: "Grey",    rgb: [140, 140, 140], hex: "#8C8C8C", ryb: [0.4, 0.4, 0.4] },
  { name: "Black",   rgb: [30, 30, 30],    hex: "#1E1E1E", ryb: [1.0, 1.0, 1.0] },
];

// ── Named Colors for Matching ────────────────────────────────────────────────
//
// Comprehensive dictionary sourced from CSS/X11 named colors, Crayola crayons,
// and common color names. Each entry has a unique name so that similar-looking
// but distinct colors get distinct labels.
//

export const NAMED_COLORS = [
  // ── Whites & Near-Whites ──
  { name: "White",            rgb: [245, 245, 245] },
  { name: "Snow",             rgb: [255, 250, 250] },
  { name: "Ivory",            rgb: [255, 255, 240] },
  { name: "Floral White",     rgb: [255, 250, 240] },
  { name: "Seashell",         rgb: [255, 245, 238] },
  { name: "Linen",            rgb: [250, 240, 230] },
  { name: "Old Lace",         rgb: [253, 245, 230] },
  { name: "Cornsilk",         rgb: [255, 248, 220] },
  { name: "Cream",            rgb: [255, 253, 208] },
  { name: "Lemon Chiffon",    rgb: [255, 250, 205] },
  { name: "Honeydew",         rgb: [240, 255, 240] },
  { name: "Mint Cream",       rgb: [245, 255, 250] },
  { name: "Alice Blue",       rgb: [240, 248, 255] },
  { name: "Ghost White",      rgb: [248, 248, 255] },
  { name: "Lavender Mist",    rgb: [230, 230, 250] },

  // ── Greys ──
  { name: "Light Grey",       rgb: [211, 211, 211] },
  { name: "Silver",           rgb: [192, 192, 192] },
  { name: "Grey",             rgb: [140, 140, 140] },
  { name: "Dark Grey",        rgb: [105, 105, 105] },
  { name: "Charcoal",         rgb: [54, 69, 79] },
  { name: "Dim Grey",         rgb: [80, 80, 80] },
  { name: "Ash Grey",         rgb: [178, 190, 181] },
  { name: "Slate Grey",       rgb: [112, 128, 144] },
  { name: "Steel Grey",       rgb: [130, 130, 130] },

  // ── Blacks ──
  { name: "Black",            rgb: [30, 30, 30] },
  { name: "Jet Black",        rgb: [52, 52, 52] },

  // ── Reds ──
  { name: "Red",              rgb: [220, 40, 40] },
  { name: "Scarlet",          rgb: [255, 36, 0] },
  { name: "Crimson",          rgb: [220, 20, 60] },
  { name: "Fire Engine Red",  rgb: [206, 32, 41] },
  { name: "Dark Red",         rgb: [139, 0, 0] },
  { name: "Maroon",           rgb: [128, 0, 0] },
  { name: "Brick Red",        rgb: [203, 65, 84] },
  { name: "Indian Red",       rgb: [205, 92, 92] },
  { name: "Tomato",           rgb: [255, 99, 71] },
  { name: "Fire Brick",       rgb: [178, 34, 34] },
  { name: "Venetian Red",     rgb: [200, 8, 21] },
  { name: "Ruby",             rgb: [224, 17, 95] },
  { name: "Candy Apple Red",  rgb: [255, 8, 0] },
  { name: "Burgundy",         rgb: [128, 0, 32] },
  { name: "Wine",             rgb: [114, 47, 55] },
  { name: "Oxblood",          rgb: [76, 0, 9] },

  // ── Pinks ──
  { name: "Pink",             rgb: [240, 130, 170] },
  { name: "Hot Pink",         rgb: [255, 105, 180] },
  { name: "Deep Pink",        rgb: [255, 20, 147] },
  { name: "Light Pink",       rgb: [255, 182, 193] },
  { name: "Carnation Pink",   rgb: [255, 166, 201] },
  { name: "Rose",             rgb: [255, 0, 127] },
  { name: "Blush",            rgb: [222, 93, 131] },
  { name: "Bubblegum",        rgb: [255, 115, 180] },
  { name: "Salmon",           rgb: [250, 128, 114] },
  { name: "Light Salmon",     rgb: [255, 160, 122] },
  { name: "Dark Salmon",      rgb: [233, 150, 122] },
  { name: "Coral",            rgb: [255, 127, 80] },
  { name: "Misty Rose",       rgb: [255, 228, 225] },

  // ── Oranges ──
  { name: "Orange",           rgb: [255, 160, 64] },
  { name: "Orange",           rgb: [240, 140, 20] },
  { name: "Dark Orange",      rgb: [255, 140, 0] },
  { name: "Red-Orange",       rgb: [255, 83, 73] },
  { name: "Tangerine",        rgb: [255, 159, 0] },
  { name: "Burnt Orange",     rgb: [204, 85, 0] },
  { name: "Rust",             rgb: [183, 65, 14] },
  { name: "Pumpkin",          rgb: [255, 117, 24] },
  { name: "Mango",            rgb: [255, 130, 67] },
  { name: "Apricot",          rgb: [251, 206, 177] },
  { name: "Peach",            rgb: [255, 218, 185] },
  { name: "Melon",            rgb: [254, 186, 173] },
  { name: "Papaya",           rgb: [255, 239, 213] },
  { name: "Copper",           rgb: [184, 115, 51] },

  // ── Browns ──
  { name: "Brown",            rgb: [140, 80, 30] },
  { name: "Chocolate",        rgb: [123, 63, 0] },
  { name: "Dark Brown",       rgb: [101, 67, 33] },
  { name: "Saddle Brown",     rgb: [139, 69, 19] },
  { name: "Sienna",           rgb: [160, 82, 45] },
  { name: "Raw Sienna",       rgb: [196, 142, 72] },
  { name: "Burnt Sienna",     rgb: [138, 54, 15] },
  { name: "Raw Umber",        rgb: [130, 102, 68] },
  { name: "Burnt Umber",      rgb: [138, 51, 36] },
  { name: "Tan",              rgb: [210, 180, 140] },
  { name: "Sandy Brown",      rgb: [244, 164, 96] },
  { name: "Wheat",            rgb: [245, 222, 179] },
  { name: "Khaki",            rgb: [195, 176, 145] },
  { name: "Dark Khaki",       rgb: [189, 183, 107] },
  { name: "Beige",            rgb: [245, 245, 220] },
  { name: "Bisque",           rgb: [255, 228, 196] },
  { name: "Buff",             rgb: [240, 220, 130] },
  { name: "Taupe",            rgb: [72, 60, 50] },
  { name: "Sepia",            rgb: [112, 66, 20] },
  { name: "Chestnut",         rgb: [149, 69, 53] },
  { name: "Mahogany",         rgb: [192, 64, 0] },
  { name: "Coffee",           rgb: [111, 78, 55] },

  // ── Yellows ──
  { name: "Yellow",           rgb: [250, 220, 20] },
  { name: "Gold",             rgb: [255, 215, 0] },
  { name: "Golden Yellow",    rgb: [255, 223, 0] },
  { name: "Goldenrod",        rgb: [218, 165, 32] },
  { name: "Dark Goldenrod",   rgb: [184, 134, 11] },
  { name: "Dandelion",        rgb: [253, 219, 109] },
  { name: "Lemon",            rgb: [255, 247, 0] },
  { name: "Canary",           rgb: [255, 239, 0] },
  { name: "Sunglow",          rgb: [255, 207, 72] },
  { name: "Pale Yellow",      rgb: [255, 255, 150] },
  { name: "Banana",           rgb: [255, 225, 53] },
  { name: "Mustard",          rgb: [255, 219, 88] },
  { name: "Amber",            rgb: [255, 191, 0] },
  { name: "Maize",            rgb: [251, 236, 93] },

  // ── Greens ──
  { name: "Green",            rgb: [128, 165, 128] },
  { name: "Green",            rgb: [40, 170, 60] },
  { name: "Lime",             rgb: [0, 255, 0] },
  { name: "Lime Green",       rgb: [50, 205, 50] },
  { name: "Lawn Green",       rgb: [124, 252, 0] },
  { name: "Chartreuse",       rgb: [127, 255, 0] },
  { name: "Yellow-Green",     rgb: [154, 205, 50] },
  { name: "Spring Green",     rgb: [0, 255, 127] },
  { name: "Mint",             rgb: [152, 255, 152] },
  { name: "Light Green",      rgb: [144, 238, 144] },
  { name: "Pale Green",       rgb: [152, 251, 152] },
  { name: "Sea Green",        rgb: [46, 139, 87] },
  { name: "Medium Sea Green", rgb: [60, 179, 113] },
  { name: "Forest Green",     rgb: [34, 139, 34] },
  { name: "Dark Green",       rgb: [0, 100, 0] },
  { name: "Jungle Green",     rgb: [41, 171, 135] },
  { name: "Shamrock",         rgb: [69, 206, 162] },
  { name: "Emerald",          rgb: [80, 200, 120] },
  { name: "Pine Green",       rgb: [1, 121, 111] },
  { name: "Olive",            rgb: [128, 128, 0] },
  { name: "Dark Olive",       rgb: [85, 107, 47] },
  { name: "Olive Drab",       rgb: [107, 142, 35] },
  { name: "Sage",             rgb: [188, 184, 138] },
  { name: "Fern",             rgb: [113, 188, 120] },
  { name: "Army Green",       rgb: [75, 83, 32] },
  { name: "Kelly Green",      rgb: [76, 187, 23] },
  { name: "Moss Green",       rgb: [138, 154, 91] },
  { name: "Celadon",          rgb: [172, 225, 175] },
  { name: "Sea Mist",         rgb: [190, 210, 190] },
  { name: "Hunter Green",     rgb: [80, 100, 80] },

  // ── Teals & Cyans ──
  { name: "Teal",             rgb: [0, 128, 128] },
  { name: "Cyan",             rgb: [20, 190, 220] },
  { name: "Dark Cyan",        rgb: [0, 139, 139] },
  { name: "Aqua",             rgb: [0, 255, 255] },
  { name: "Aquamarine",       rgb: [127, 255, 212] },
  { name: "Turquoise",        rgb: [64, 224, 208] },
  { name: "Dark Turquoise",   rgb: [0, 206, 209] },
  { name: "Light Cyan",       rgb: [224, 255, 255] },
  { name: "Robin Egg Blue",   rgb: [0, 204, 204] },
  { name: "Caribbean Green",  rgb: [28, 211, 162] },

  // ── Blues ──
  { name: "Blue",             rgb: [30, 100, 210] },
  { name: "Royal Blue",       rgb: [65, 105, 225] },
  { name: "Cobalt Blue",      rgb: [0, 71, 171] },
  { name: "Cornflower Blue",  rgb: [100, 149, 237] },
  { name: "Steel Blue",       rgb: [70, 130, 180] },
  { name: "Sky Blue",         rgb: [135, 206, 235] },
  { name: "Light Sky Blue",   rgb: [135, 206, 250] },
  { name: "Powder Blue",      rgb: [176, 224, 230] },
  { name: "Light Blue",       rgb: [173, 216, 230] },
  { name: "Cadet Blue",       rgb: [95, 158, 160] },
  { name: "Dodger Blue",      rgb: [30, 144, 255] },
  { name: "Medium Blue",      rgb: [0, 0, 205] },
  { name: "Dark Blue",        rgb: [0, 0, 139] },
  { name: "Navy",             rgb: [0, 0, 128] },
  { name: "Midnight Blue",    rgb: [25, 25, 112] },
  { name: "Cerulean",         rgb: [0, 123, 167] },
  { name: "Denim",            rgb: [21, 96, 189] },
  { name: "Pacific Blue",     rgb: [28, 169, 201] },
  { name: "Periwinkle",       rgb: [197, 208, 230] },

  // ── Purples & Violets ──
  { name: "Purple",           rgb: [150, 50, 150] },
  { name: "Dark Purple",      rgb: [48, 0, 48] },
  { name: "Violet",           rgb: [140, 50, 180] },
  { name: "Dark Violet",      rgb: [128, 0, 200] },
  { name: "Blue-Violet",      rgb: [138, 43, 226] },
  { name: "Indigo",           rgb: [75, 0, 130] },
  { name: "Orchid",           rgb: [218, 112, 214] },
  { name: "Medium Orchid",    rgb: [186, 85, 211] },
  { name: "Plum",             rgb: [142, 69, 133] },
  { name: "Lavender",         rgb: [181, 126, 220] },
  { name: "Lilac",            rgb: [200, 162, 200] },
  { name: "Thistle",          rgb: [216, 191, 216] },
  { name: "Wisteria",         rgb: [201, 160, 220] },
  { name: "Amethyst",         rgb: [153, 102, 204] },
  { name: "Grape",            rgb: [111, 45, 168] },
  { name: "Eggplant",         rgb: [97, 64, 81] },
  { name: "Mauve",            rgb: [224, 176, 255] },
  { name: "Royal Purple",     rgb: [120, 81, 169] },

  // ── Magentas & Fuchsias ──
  { name: "Magenta",          rgb: [220, 30, 160] },
  { name: "Fuchsia",          rgb: [255, 0, 128] },
  { name: "Dark Magenta",     rgb: [139, 0, 139] },
  { name: "Medium Violet Red",rgb: [199, 21, 133] },
  { name: "Cerise",           rgb: [222, 49, 99] },
  { name: "Raspberry",        rgb: [227, 11, 92] },
  { name: "Mulberry",         rgb: [197, 75, 140] },

  // ── Slate & Muted Tones ──
  { name: "Slate",            rgb: [112, 128, 144] },
  { name: "Dark Slate",       rgb: [47, 79, 79] },
  { name: "Light Slate",      rgb: [119, 136, 153] },
  { name: "Gunmetal",         rgb: [42, 52, 57] },
  { name: "Pewter",           rgb: [150, 168, 161] },
  { name: "Warm Grey",        rgb: [155, 140, 130] },
  { name: "Cool Grey",        rgb: [140, 146, 172] },
  { name: "Dusty Rose",       rgb: [194, 111, 130] },
  { name: "Mauve Taupe",      rgb: [145, 95, 109] },
  { name: "Old Rose",         rgb: [192, 128, 129] },
  { name: "Heather",          rgb: [140, 115, 155] },
  { name: "Twilight",         rgb: [100, 80, 120] },
];

// ── Button Border Colors ────────────────────────────────────────────────────

export const BUTTON_BORDER_COLORS = {
  Red: "#B01E1E",
  Orange: "#C06E0A",
  Yellow: "#C8A800",
  Green: "#1E8830",
  Blue: "#1648A0",
  Indigo: "#2A1C70",
  Violet: "#6E2890",
  Pink: "#C06888",
  Brown: "#6E4014",
  Magenta: "#B01480",
  Cyan: "#0E96B0",
  White: "#CCCCCC",
  Grey: "#707070",
  Black: "#000000",
};
