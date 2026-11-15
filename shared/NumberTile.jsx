import { NB_SOLID, getNumberBlockStyle } from "./numberblockColors.js";
import { contrastTextColor } from "./colorUtils.js";

// ── Number Tile ──────────────────────────────────────────────────────────────
// A number in a little rounded tile. Numbers up to 100 look like their
// Numberblock (27 is Twenty's fill with Seven's rainbow border); bigger ones
// are plain gold. Sizes are in em, so the tile scales with its font size (and a
// big tile gets a thicker border).
//
//   <NumberTile value={7n} label="7" />
//
// `value` is a BigInt and picks the colors; `label` is what's shown (the number
// with commas, or with a power). With `onClick` the tile is a button, which
// `disabled` switches off.

const GOLD = "#FFD030";

const border = (color) => `inset 0 0 0 max(2px, 0.09em) ${color}`;

// The tile's shape without its colors, for a tile of some other color.
export const NUMBER_TILE_SHAPE = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap",
  borderRadius: "0.45em", padding: "0.3em 0.45em",
};

function tileColors(value) {
  if (value > 100n) {
    return {
      background: "rgba(255,208,48,0.14)",
      boxShadow: "inset 0 0 0 1px rgba(255,208,48,0.5)",
      color: GOLD,
    };
  }
  // Zero has no Numberblocks color of its own, so it borrows Ten's white and
  // red, like the 0 key on the numpad.
  if (value === 0n) {
    return { background: "#FFFFFF", boxShadow: border("#E41E20"), color: "#E41E20", textShadow: "none" };
  }
  const n = Number(value);
  const nb = getNumberBlockStyle(n);
  if (!nb.border) {
    return { background: nb.background, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.4)" };
  }
  const decade = String(n - (n % 10));
  const color = contrastTextColor(NB_SOLID[decade]);
  return {
    background: nb.background,
    boxShadow: border(nb.border),
    color,
    textShadow: color === "#fff" ? "0 1px 2px rgba(0,0,0,0.4)" : "none",
  };
}

export function NumberTile({ value, label, style, onClick, disabled }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      className={onClick ? "toy-btn" : undefined}
      style={{ ...NUMBER_TILE_SHAPE, ...tileColors(value), ...style }}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
    >
      {label}
    </Tag>
  );
}
