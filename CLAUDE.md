# CLAUDE.md

## Project Overview

**Doodads** is a collection of interactive web toys built with React and Vite. Built as a personal project for a child who loves numbers. Current toys:

- **Big Number Namer** — Explore the names of large numbers up to a millinillinillinillinillion (3 trillion+ zeros)
- **Time Teller** — Interactive analog clock; drag the hands or type a time to learn to tell time
- **Calculator** — Colorful calculator with Numberblocks-inspired button colors
- **Color Mixer** — Tap colors to mix them together and see what you get
- **Fraction Combiner** — Combine fraction pie pieces to fill a circle; a pie chart game for learning fractions
- **Shape Selector** — Tap shapes to see them up close and learn their names, from circles to custom polygons with up to 10,000 sides
- **Pi Digits** — Enter how many digits of π you want to see; the specific digit is shown big and the full number scrolls below, all the way up to a million
- **Roman Numerals** — Type any number and see it written in Roman numerals, broken into place-value parts, up to 3,999,999,999,999 using stacked bars (vinculum)
- **Chinese Numbers** — Type any number and see it in Chinese characters with pinyin over each one, hear it spoken, and see how Chinese groups digits in fours, up to 不可思议 (10⁶⁴)
- **Prime Checker** — Type any number and find out if it's prime; see it lined up as rows of blocks, split it into prime factors, and hop from prime to prime, up to nearly a septillion (24 digits)
- **Odd or Even** — Type any number and find out if it's odd or even; see the blocks lined up in pairs (with the odd one out), shared between two, and the last digit lit up, up to 30 digits
- **Solar System** — Tap the Sun, the planets, the dwarf planets, the big asteroids and their best-known moons to see them up close and learn their names; the map scrolls outwards from the Sun with each world's moons beside it, with real sizes and real distances as options
- **Exoplanets** — Hop from star to star and tap the planets round them (lava worlds, two-sun skies, planets where it rains glass) to see an imagined close-up and the real numbers; 22 other star systems plus the Sun, linked both ways with the Solar System toy

## Tech Stack

- **Language**: JavaScript/JSX (React 18)
- **Build Tool**: Vite 6
- **Module System**: ESM (`"type": "module"`)
- **Package Manager**: npm
- **Deployment**: GitHub Pages via GitHub Actions (auto-deploys on push to `main`)
- **No test framework, linter, or formatter configured**

## Commands

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build to ./dist/
npm run preview    # Preview production build locally
```

There are no test, lint, or format commands.

## Project Structure

```
/
├── index.html                  # Hub/landing page linking to all toys
├── big-number-namer/           # Big Number Namer toy
│   ├── index.html              # Entry HTML
│   ├── main.jsx                # React mount point
│   ├── App.jsx                 # Components, UI, and state
│   └── numberNaming.js         # Pure naming logic (reusable, no React dependency)
├── clock/                      # Time Teller toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Clock orchestrator, keypad, digital display, settings
│   ├── AnalogClock.jsx         # SVG analog clock face with draggable hands
│   └── clockUtils.js           # Pure clock math (angles, time parsing, formatting)
├── calculator/                 # Calculator toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Calculator UI with Numberblocks-inspired colors
│   └── calcEngine.js           # Pure calculation logic (display formatting, compute)
├── color-mixer/                # Color Mixer toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Color mixing UI (tap colors to blend)
│   ├── colorData.js            # Color palette, named colors dictionary, RYB cube, button border colors
│   └── colorMixing.js          # Pure mixing logic (subtractive/additive) and closest-name matching
├── fraction-combiner/          # Fraction Combiner toy
│   ├── index.html
│   ├── main.jsx
│   └── App.jsx                 # Fraction pie chart game
├── shape-selector/             # Shape Selector toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Shape grid, SVG rendering, overlay
│   ├── shapeData.js            # Shape definitions, SVG helpers, color helpers (pure logic)
│   └── shapeNaming.js          # Latin-based polygon naming system (3–10,000 sides), number-to-word
├── pi-digits/                  # Pi Digits toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Scrollable virtualized full-number display, numpad, settings
│   ├── piDigits.js             # Pure Chudnovsky (binary splitting) BigInt π computation
│   └── piWorker.js             # Web Worker wrapper so large computations don't block the UI
├── roman-numerals/             # Roman Numerals toy
│   ├── index.html              # Also loads the Cinzel font (Roman-inscription lettering)
│   ├── main.jsx
│   ├── App.jsx                 # Numpad, auto-fit barred numeral display, place-value parts, settings
│   └── romanNumerals.js        # Pure Roman numeral conversion (place-value parts, vinculum bars)
├── chinese-numbers/            # Chinese Numbers toy
│   ├── index.html              # Also loads LXGW WenKai TC (characters) and Andika (pinyin) fonts
│   ├── main.jsx
│   ├── App.jsx                 # Numpad + ×万 key, auto-fit pinyin-over-character reading, group chips, speech, settings
│   └── chineseNumbers.js       # Pure Chinese number reading (myriad groups, 零 rules, 两, 一 tone changes)
├── prime-checker/              # Prime Checker toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Numpad + prime-jump keys, verdict, rows-of-blocks picture, prime-factor tiles, settings
│   ├── primes.js               # Pure prime logic (Miller–Rabin, Pollard's rho factoring, prime index sieve)
│   └── factorWorker.js         # Web Worker for numbers whose prime factors are all big
├── odd-or-even/               # Odd or Even toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Numpad + ±2 pair keys, verdict, last-digit strip, pairs picture, halves tiles, settings
│   └── oddEven.js              # Pure parity logic (last digit, pairs + leftover, every-digit check)
├── solar-system/              # Solar System toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Map page, close-up overlay (facts, moons row, ◀ ▶), settings, speech, milestone toasts
│   ├── SolarMap.jsx            # The scrollable journey: Sun's edge, path, bodies with moon chips beside them, belt asteroids, signpost
│   ├── bodies.js               # Pure data: 64 bodies (facts, hierarchy, how to say them) + lookups and descriptions
│   ├── bodyLooks.js            # Pure data: per-body artwork descriptors (colors, bands, spots, rings…)
│   └── layout.js               # Pure math: squashed/real sizes, evenly-spaced/real-distance rows, moon rows, belts, AU ticks
├── exoplanets/                # Exoplanets toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Star map page, close-up overlay (star or planet), settings, speech, milestone toasts
│   ├── StarMap.jsx             # The star hop: one row per star with its planets as chips beside it; the Sun row links back
│   ├── exoplanets.js           # Pure data: 23 stars + 55 planets (facts, discovery, habitability) + lookups and descriptions
│   ├── exoLooks.js             # Pure data: imagined looks by planet type and star type, plus the famous ones
│   └── exoLayout.js            # Pure math: star and planet sizes (squashed or real) and the rows
├── shared/
│   ├── base.css                # Shared stylesheet: tokens, resets, fonts, animations, utilities, .toy-btn
│   ├── colorUtils.js           # Shared color helpers: luminance, contrastTextColor, rgbToHex, textColorForRgb
│   ├── mathUtils.js            # Shared math helpers: gcd, simplify (fraction reduction)
│   ├── formatUtils.js          # Shared number formatting: formatNumber (commas), formatDays/formatHours, ordinal, trimTo
│   ├── bodyArt.js              # The "look" format for drawing worlds: seeded craters, potato outlines, finishLook, accentColor
│   ├── BodyPicture.jsx         # Draws any world from a look: shaded sphere/egg/potato, stripes, spots, craters, rings, glow
│   ├── useSpeech.js            # Web Speech hook: says a name with the device's voice for a language
│   ├── useElementWidth.js      # Hook: an element's current width, kept up to date on resize
│   ├── useAutoFitFontSize.js   # Generic auto-fit font hook (reusable across toys)
│   ├── useScrollLock.js        # Scroll lock hook for overlays (toggles overlay-open class)
│   ├── numberblockColors.js    # Shared NB_COLORS, NB_SOLID, NB_OUTLINE, NB7_STOPS, NB7_GRADIENT, getNumberBlockStyle
│   ├── BackgroundDots.jsx      # Floating background dots decoration component
│   ├── StickyHeader.jsx        # Consistent sticky header component for all toys
│   ├── SettingsOverlay.jsx     # Reusable settings modal shell with toggle/divider/section helpers
│   ├── Toast.jsx               # Shared toast notification with enter/exit animation, info/warning variants
│   └── mountApp.jsx            # Shared React mount utility (createRoot + base.css import)
├── public/
│   ├── icon.svg                # App icon (SVG source)
│   ├── icon-180.png            # Apple touch icon
│   ├── icon-192.png            # PWA icon (192×192)
│   ├── icon-512.png            # PWA icon (512×512)
│   ├── icon-maskable.svg       # PWA maskable icon (SVG source)
│   ├── icon-maskable-192.png   # PWA maskable icon (192×192)
│   ├── icon-maskable-512.png   # PWA maskable icon (512×512)
│   ├── manifest.json           # Web app manifest (PWA)
│   ├── pwa-init.js             # Shared PWA bootstrap (viewport fix + SW registration)
│   └── sw.js                   # Service worker for offline caching
├── vite.config.js              # Auto-discovers toy directories as entry points
├── package.json
└── .github/workflows/deploy.yml
```

## Architecture

### Multi-Page Auto-Discovery

`vite.config.js` auto-discovers any subdirectory containing an `index.html` as a separate page entry. To add a new toy, create a new directory with its own `index.html` — no config changes needed.

### Big Number Namer (`big-number-namer/`)

- **`numberNaming.js`** — Pure functions (no React dependency) that convert a zero count into a written number name using Latin prefix composition. Key exports:
  - `getNumberName(zeros, useDashes)` — Main conversion function
  - `formatZerosWithCommas(zerosCount)` — Comma-formatted number display

- **`App.jsx`** — All React components, state, and styles:
  1. **Constants** — `MAX_ZEROS` (3,000,000,000,003); colors imported from `shared/numberblockColors.js`
  2. **Components**: `BigNumberSettings` (uses shared `SettingsOverlay`), `BigNumberNamer` (main). Uses shared `Toast` for fun facts.
  3. **Styles** — Inline style objects at bottom of file (`styles`); settings styles from shared module

### Time Teller (`clock/`)

Interactive analog clock where kids can drag clock hands or type a time to learn to tell time.

- **`clockUtils.js`** — Pure functions for clock math: angle↔time conversion, time formatting, drag-to-angle, wrap detection
- **`AnalogClock.jsx`** — SVG analog clock face with draggable hour/minute/second hands, Numberblocks-inspired hour labels
- **`App.jsx`** — Clock orchestrator: state management, drag/keypad handlers, digital display, AM/PM toggle, settings

### Calculator (`calculator/`)

A colorful calculator with big Numberblocks-inspired buttons.

- **`calcEngine.js`** — Pure calculation logic: display formatting, parsing, operator computation, digit limits
- **`App.jsx`** — Calculator UI with color-coded digit buttons (each digit 1–9 has its own Numberblocks color), operators, and an auto-fit display

### Color Mixer (`color-mixer/`)

Tap colors from a palette to mix them together and see the resulting color name.

- **`colorData.js`** — Pure data module with no React dependency. Contains:
  - `RYB_CUBE` and `rybToRgb()` — RYB-to-RGB trilinear interpolation for subtractive mixing
  - `PALETTE` — the 14 mixable colors with RGB, hex, and RYB coordinates
  - `NAMED_COLORS` — comprehensive color name dictionary (~230 entries) for closest-match lookup
  - `BUTTON_BORDER_COLORS` — darker border colors for each palette button
- **`colorMixing.js`** — Pure mixing logic (no React dependency):
  - `mixSubtractive(colorList)` — paint-like mixing via RYB space
  - `mixAdditive(colorList)` — light-like mixing via screen blend
  - `findClosestColorName(rgb)` — nearest-neighbor color name matching
- **`App.jsx`** — UI component: color grid, swatch display, settings overlay, undo/clear

### Fraction Combiner (`fraction-combiner/`)

A pie chart game for learning fractions. Combine fraction pieces to fill a whole circle.

- **`App.jsx`** — SVG pie chart, fraction selection (halves through tenths), Numberblocks-inspired colors, LCD-based fraction arithmetic (LCD = 2520 for 1–10). Uses `simplify()` from `shared/mathUtils.js` for fraction reduction and shared `Toast` for warnings.

### Shape Selector (`shape-selector/`)

A shape exploration toy. Tap shapes from a grid to see them enlarged with their name and side count.

- **`shapeNaming.js`** — Pure naming logic (no React dependency):
  - `polygonNameForSides(sides)` — Latin-based name for 3–10,000 sides
  - `polygonNameSegments(sides)` — name broken into colored/hyphenatable segments
  - `numberToWord(n)` — English word form for a number (0–10,000)
- **`shapeData.js`** — Pure data/logic (no React dependency): `SHAPES` array (17 hand-defined + 91 generated polygons), `shapeTextColor()`, `segmentColor()`, `polygonPoints()` SVG helper
- **`App.jsx`** — SVG shape rendering (circles, ovals, footballs, triangles, quadrilaterals, regular polygons up to 100 sides), custom polygon input for any side count 3–10,000, Numberblocks-inspired colors with `getNumberBlockStyle`, color-coded name segments, hyphenation toggle.

### Pi Digits (`pi-digits/`)

Enter a digit count on the Numberblocks-inspired numpad. The full number is shown
up top in a scrollable display — color-coded per digit, grouped in tens, with a
place-number gutter and the leading "3." as its first line — all the way up to a
million digits.

- **`piDigits.js`** — Pure logic (no React dependency): `computePiString(total)` returns
  the first `total` digits of π (leading 3 + decimals) as a digit string using the
  Chudnovsky algorithm with binary splitting and a BigInt integer square root.
  A few guard digits are computed and discarded so the last digit is exact.
  Exports `MAX_DIGITS` (1,000,000).
- **`piWorker.js`** — A Web Worker that calls `computePiString` off the main thread, so
  large requests (a million digits takes a few seconds) never freeze the UI. Messages
  carry a `reqId` so stale results are ignored.
- **`App.jsx`** — A scrollable **virtualized full-number display** up top (only the rows
  in view are mounted, so a million colored digits scroll smoothly) plus a numpad with
  ±1/clear/backspace controls (shared with the Big Number Namer layout). Seeds a baseline
  of digits synchronously so small requests are instant, then extends the cache via the
  worker (debounced) for larger ones. Per-digit Numberblocks colors, settings toggles for
  coloring and grouping, and milestone fun facts via the shared `Toast`.

### Roman Numerals (`roman-numerals/`)

Type a number on the Numberblocks-inspired numpad (same layout as the Big Number Namer)
and see it written in Roman numerals, with each letter in its own rainbow color. Below the
numeral, the number is broken into place-value parts (e.g. M + CM + XC + IV). Numbers of
4,000 and up use the vinculum: each bar over a letter multiplies it by 1,000, and bars stack
(two bars = × 1,000,000, three = × 1,000,000,000).

- **`romanNumerals.js`** — Pure logic (no React dependency). Key exports:
  - `toRomanParts(n)` — place-value parts, biggest first, as `{ letters, bars, value }`
    (e.g. 12,345 → X̄, ĪĪ, CCC, XL, V). Plain letters cover 1–3,999; bigger numbers put their
    thousands under one more bar, recursively.
  - `toRomanLetters(parts)` — flattens parts into `{ letter, bars }` for rendering
  - `ROMAN_LETTERS` — the seven letters and their values; `MAX_NUMBER` (3,999,999,999,999)
- **`App.jsx`** — Numeral display auto-fit via `useAutoFitFontSize` (with `fitKey`, since
  letters vary in width), bars drawn as positioned spans that join into one line across a
  barred group, a place-value parts row (auto-fit down to a readable minimum, then scrolls),
  a letter key when empty, "nulla" for zero, settings toggles for letter colors and commas,
  and milestone fun facts via the shared `Toast`. Letters use the Cinzel font loaded in
  `index.html`.

### Chinese Numbers (`chinese-numbers/`)

Type a number on the Numberblocks-inspired numpad (same layout as the Big Number Namer, plus a
red-and-gold ×万 key that adds four zeros) and see it written in Chinese characters with pinyin
over each one. Digits share their Numberblocks color between the Arabic number and the
characters (3 ↔ 三); big words (万, 亿, …) sit in a gold pill. Below, the number is broken into
its four-digit groups (e.g. 一亿 + 二千三百四十五万 + 六千七百八十九). Numbers are digit strings
(BigInt for ±1), up to 68 digits.

- **`chineseNumbers.js`** — Pure logic (no React dependency). Key exports:
  - `toChineseParts(digits, { traditional, useLiang })` — the reading as parts, one per
    four-digit group, biggest first: `{ syllables, value, unit }`. Each syllable is
    `{ char, pinyin, kind }` with kind `"digit"` (plus `digit`), `"place"` (十百千, plus `place`)
    or `"unit"` (a big word; multi-character words give one syllable per character). Handles the
    zero rules (zeros at a group's end are silent, any other run reads as one 零), dropping 一 before
    a leading 十, 两 for a leading two, and 一's tone changes in the pinyin (yì bǎi, yí wàn).
  - `toChineseText(parts)`, `formatDigits(digits, groupSize)`, `readDigitByDigit(digits)`,
    `bigUnitIndex(digits)`, `bigUnitChars(k, traditional)`
  - `DIGITS`, `PLACES`, `BIG_UNITS` (万 10⁴ through 不可思议 10⁶⁴, simplified + traditional +
    pinyin), `MAX_DIGITS` (68), `MAX_NUMBER`
- **`App.jsx`** — Arabic number auto-fit via `useAutoFitFontSize`, the pinyin-over-character
  reading (auto-fit with `fitKey`, down to a readable minimum, then scrolls), a character key when
  empty, group chips (past 京 the value reads "9,999 and 64 zeros"), a 🔊 button using the Web
  Speech API with the device's Mandarin voice (hidden if it has none), settings toggles (digit
  colors, pinyin, traditional characters, 两, grouping digits in fours), a big-words reference
  table, and milestone fun facts via the shared `Toast`. The shared fonts lack pinyin tone marks
  (ǎ ǐ ǒ ǔ ǚ), hence Andika.

### Prime Checker (`prime-checker/`)

Type a number on the Numberblocks-inspired numpad (same layout as the Big Number Namer, with
◀/▶ prime keys flanking 0 that jump to the previous/next prime) and see a big PRIME! or NOT PRIME
verdict. The picture lines the number up as equal rows of blocks (rows wear the Numberblocks
colors; a prime only makes one gold line) — tap it to try another rectangle. Below, a composite
number is split into its prime factors as Numberblocks-style tiles. Numbers are digit strings
(BigInt), up to 24 digits.

- **`primes.js`** — Pure logic (no React dependency). Key exports:
  - `isPrime(n)` — Miller–Rabin with the first 13 primes as bases, exact (not probabilistic)
    for every n < 3.3 × 10²⁴
  - `factorize(n, maxSteps?)` — `[[prime, power], …]`, smallest first: trial division by primes
    under 10,000, then Pollard's rho (Brent). Returns `null` if rho runs past `maxSteps`
  - `nextPrime(n)`, `prevPrime(n)` (null past `MAX_NUMBER` / below 2), `factorCount(factors)`,
    `rectangleSides(n, factors)` (the shorter side of every rectangle, most square first)
  - `primeIndex(p)` — which prime it is (97 → 25), for primes under 2²⁴ (past the millionth
    prime); its sieve grows in steps as bigger primes come up
  - `PRIMES_UNDER_100`, `MAX_DIGITS` (24), `MAX_NUMBER`
- **`factorWorker.js`** — Web Worker that factors numbers whose prime factors are all big (two
  12-digit primes take a second or more). The app first tries `factorize` with a small step budget
  on the main thread, and only on `null` starts a worker, terminating it if the number changes.
- **`App.jsx`** — Auto-fit number display, verdict pill (glows gold for primes), "Nth prime · k
  factors" line, the picture (SVG blocks up to 100, a not-to-scale rectangle or thin line beyond),
  prime-factor tiles (auto-fit, then scrolls), the 25 primes under 100 as tappable tiles when empty,
  settings toggles (group repeated primes as powers, commas), and fun facts (twin, Mersenne and
  palindrome primes, milestones) via the shared `Toast`.

### Odd or Even (`odd-or-even/`)

Type a number on the Numberblocks-inspired numpad (same layout as the Big Number Namer, with blue
−2/+2 "pair" keys flanking 0) and see a big EVEN or ODD verdict. Pairs are blue and the odd one out
is orange throughout. The number's last digit is lit up, both in the number and in a strip showing
that even numbers end in 0 2 4 6 8 and odd ones in 1 3 5 7 9. Numbers are digit strings (BigInt),
up to 30 digits.

- **`oddEven.js`** — Pure logic (no React dependency). Key exports:
  - `isEven(digits)` — from the last digit alone
  - `pairUp(n)` — `{ pairs, leftover }` (15 → 7 pairs, 1 left over; also the two equal halves)
  - `everyDigit(digits)` — `"odd"` / `"even"` when every digit is (13579, 2468), else null
  - `EVEN_DIGITS`, `ODD_DIGITS`, `MAX_DIGITS` (30), `MAX_NUMBER`
- **`App.jsx`** — Auto-fit number display with the last digit in a parity-colored chip, verdict
  pill, last-digit strip, the pairs picture (SVG towers of up to 10 pairs, Numberblocks-style, with
  the leftover block bobbing on top next to a dashed space for its missing partner; past 100 a
  stack with a ⋮ break), "shared between two" tiles (auto-fit, then scrolls), the numbers 1–20 as
  tappable odd/even rows when empty, settings toggles (light up the last digit, commas), and fun
  facts via the shared `Toast`.

### Solar System (`solar-system/`)

Tap the Sun, a planet, a dwarf planet, an asteroid or a moon to see it up close and learn its
name. The map is a journey down the page: the Sun's glowing edge at the top, then every planet and
dwarf planet in order of distance down one column along a dotted path, each with its best-known
moons as small tappable chips in a row beside it (wrapping for Saturn's nine). The asteroid and
Kuiper belts are drawn where they lie, with the six notable asteroids (Vesta, Juno, Pallas, Ida,
Psyche, Hygiea) tappable inside the first. Planets wear a Numberblocks-colored badge for their
order (Earth is the 3rd), and dwarf planets a dashed ring. Tapping opens a close-up: the body big,
its name (with a 🔊 button), what it is ("The 5th planet from the Sun", "The biggest moon of
Jupiter", "An asteroid in the asteroid belt"), fact chips with the real numbers (width and "11×
wider than Earth", distance in km and AU, year, day, temperature, moon count), a fun fact, and its
moons as tappable chips. ◀ ▶ flip between neighbors (the Sun and its orbiters, the belt's
asteroids, or the moons of the same world), and "← Jupiter" climbs back up. Sizes are squashed by
default so a 1.4 km moon and the Sun are both tappable; "Real sizes" and "Real distances" (1 AU =
180 px, so Neptune is 30 screens down and Sedna sits past a ⋮ break) show how empty space really
is. A signpost card at the bottom ("Keep going… other stars have planets too!") links to the
Exoplanets toy.

The toy is split by concern so each file has one job (the renderer and its look format are shared
with the Exoplanets toy — see `shared/bodyArt.js` and `shared/BodyPicture.jsx`):

- **`bodies.js`** — Pure data: the Sun, 8 planets, 9 dwarf planets (5 official + 4 `candidate`,
  all shown by default), 6 asteroids and 40 moons as flat records with `id`, `kind`, `parent`,
  `radiusKm`, `orbitKm`, `orbitDays`, `dayHours`, `tempC`, `moonCount`, `region`, a `fact` and,
  where the name trips up text-to-speech, a `say` spelling ("How-may-ah"). The hierarchy is just
  `parent` ids (Dactyl's parent is the asteroid Ida). Helpers: `bodyById`, `moonsOf(id)` (nearest
  first), `SUN_ORBITERS` (planets and dwarfs mixed, by distance — the map's stops),
  `NOTABLE_ASTEROIDS`, `planetNumber`, `describe(body)`, `sizeVsEarth`, `formatAu`, and the shared
  formatters re-exported. Moon counts are as of `MOONS_AS_OF` (IAU Minor Planet Center) — bump the
  numbers here when new ones are announced.
- **`bodyLooks.js`** — Pure data: what each body looks like, keyed by id, in the shared look
  format: `colors` [light, mid, dark], `shape` (circle, `{ ellipse }` for Haumea and Vesta,
  `{ potato }` for lumpy moons and small asteroids), `bands`, `spots`, `shapes` (Earth's
  continents, Pluto's heart), `lines` (Europa's cracks, Enceladus's stripes), `caps`, `craters` (a
  list, or a count scattered by a seeded random), `half` (Iapetus), `rings`, `glow`, `shade`.
  `lookFor(id)` fills in defaults (grey cratered sphere, or a potato under 120 km) via the shared
  `finishLook`.
- **`layout.js`** — Pure math: `mapRadius(km, realSizes)` (radius^0.42 squash, or true scale with
  Jupiter fixed at 50 px) and `layoutMap(orbiters, sun, asteroids, { width, realSizes,
  realDistances })`, which returns pixel positions for the Sun, every body (with its moon chips'
  position and wrap width, clear of any rings), the belts and their asteroid members, AU tick
  marks, the off-the-chart break and the signpost. In real-distance mode near-twins (Pluto and
  Orcus) are nudged apart so rows never overlap.
- **`SolarMap.jsx`** — The map: an SVG backdrop (belts of seeded dots, the path, AU ticks, the ⋮
  break) under absolutely-positioned `<button>`s — one per body (at least `HIT_RADIUS` wide, with
  the name or "?" in guessing mode and the planet-number badge), small chips for moons and belt
  asteroids — plus the signpost link.
- **`App.jsx`** — State (`selectedId`, settings, visited set), the close-up `BodyOverlay`, fact
  chips (`factsFor`), settings (names, numbers, dwarf planets, dwarf planet candidates, real
  sizes, real distances, commas), the shared speech hook (saying `say ?? name`), and milestone
  toasts (the Galilean moons, all 8 planets, all five dwarf planets, every asteroid, everything)
  via the shared `Toast`.

### Exoplanets (`exoplanets/`)

Hop from star to star and tap the planets round them. The map is a list of star systems, nearest
first: the Sun at the top ("right here", with an "Our 8 planets ➜" chip that links to the Solar
System toy), then Proxima Centauri at 4.2 light-years out to Kepler-90 at 2,840, each star drawn in
its real color with its name and distance underneath and its planets as small tappable chips beside
it (💧 marks the ones in the just-right zone). Tapping a star opens a close-up with its numbers
(width vs the Sun, temperature, light-years and km, planet count), a fun fact and its planets as
chips; tapping a planet opens a close-up under a "Nobody has seen it — this is an artist's guess!"
ribbon, with its type ("A lava world, round Copernicus"), a "Could have liquid water" badge where it
applies, and chips for width (or weight when only that is known), year, temperature, distance and
discovery (year and how). ◀ ▶ hop between stars or between a star's planets, and "← TRAPPIST-1"
climbs back up. Settings: names on/off (a guessing game), 💧 marks, real sizes (stars enormous,
planets specks), commas. Milestone toasts for Dimidium (the first planet round a Sun-like star),
Lich's three (the first exoplanets ever), all seven TRAPPIST-1 planets, Kepler-90's eight, every
star, and everything.

- **`exoplanets.js`** — Pure data: 23 stars (`starType`, `distanceLy`, `radiusSun`, `tempK`,
  `planetCount`, the Sun's `link`) and 55 planets (`parent`, `radiusEarth` or `massEarth`,
  `orbitDays`, `tempC`, `type`, `habitable`, `found`, `foundBy`, `fact`), with `say` spellings
  for catalog names ("Trappist one e"). Helpers: `worldById`, `STARS_BY_DISTANCE`,
  `planetsOf(starId)` (nearest first), `shortName` (a long catalog name shows as its letter on the
  map), `describe`, `formatLightYears`, `lightTravel`, `sizeVsEarth`, `massVsEarth`, `sizeVsSun`,
  `guessRadiusEarth` (a drawing size when only the weight is known). `KNOWN_EXOPLANETS` /
  `PLANETS_AS_OF` hold the NASA Exoplanet Archive count — bump when it moves on.
- **`exoLooks.js`** — Pure data: imagined looks by planet `type` (lava worlds with glowing cracks,
  banded hot Jupiters with a glow, cloudy water worlds, hazy mini-Neptunes, cratered rocky worlds
  in a few palettes picked by hash) and by `starType` (red dwarf through blue-white, a pulsar with
  beams, a double star with a `companion`), plus the famous ones drawn the way astronomers picture
  them (HD 189733 b deep blue, WASP-12 b egg-shaped, TrES-2 b nearly black).
- **`exoLayout.js`** — Pure math: `starRadius` / `planetRadius` (squashed, or real with the Sun at
  30 px) and `layoutStars(stars, { width, realSizes })` — one row per star with the planet chips
  wrapping beside it, clear of the star's glow or beams.
- **`StarMap.jsx`** — The star hop: a dotted line down the star column, a button per star (name
  and light-years underneath), the planet chips (`shortName`, 💧), and the Sun row's link chip.
- **`App.jsx`** — State, the `WorldOverlay` close-up for stars and planets, fact chips, settings,
  speech, milestone toasts, and the footer ("…6,080 planets found so far").

### Shared Utilities (`shared/`)

- **`base.css`** — Shared stylesheet providing design tokens (CSS custom properties), global resets, font loading (Fredoka & Outfit via Google Fonts), dark gradient background, shared keyframe animations (`popIn`, `fadeIn`, `float`, `flash`, `btnPress`, `shake`), utility CSS classes (`.gradient-text`, `.frosted-card`, `.toy-btn`, `.back-btn`, `.gear-btn`, `.page-header`, `.safe-area-container`, `.toy-container`, `.bg-dots`), page header defaults (`.page-header h1`, `.page-header .subtitle`), `.overlay-open` scroll-lock class (used by `useScrollLock` hook), and global user-select prevention. Toys import this to get the Doodads look for free, override CSS variables for tweaks, or skip the import entirely for a custom look.

- **`colorUtils.js`** — Shared color helper functions used across multiple toys. Exports:
  - `luminance(hex)` — relative luminance of a hex color (WCAG 2.0 sRGB formula)
  - `contrastTextColor(color)` — readable text color (dark or light) for a hex background
  - `rgbToHex(rgb)` — convert `[r, g, b]` array to hex string
  - `textColorForRgb(rgb)` — readable text color for an RGB array (ITU-R BT.601 luma)

- **`mathUtils.js`** — Shared math helper functions. Exports:
  - `gcd(a, b)` — greatest common divisor (Euclidean algorithm)
  - `simplify(num, den)` — reduce a fraction to lowest terms, returns `[n, d]`

- **`formatUtils.js`** — Friendly numbers for the space toys. Exports:
  - `formatNumber(n, useCommas)` — commas on request
  - `formatDays(days, useCommas)` / `formatHours(hours, useCommas)` — a duration in the nicest unit
    (hours, days or years, with a decimal when small)
  - `ordinal(n)` — "3rd"; `trimTo(n, decimals)` — round to a number, not a string

- **`bodyArt.js`** — The "look" format for drawing worlds (documented at the top of the file):
  `colors`, `shape`, `bands`, `spots`, `shapes`, `lines`, `caps`, `craters`, `half`, `rings`,
  `glow`, `rays`, `companion`, `shade`, `accent`, all in units of the body's radius. Exports
  `craterField(seed, count)` (seeded scatter), `POTATOES` (lumpy outlines), `hashString`,
  `seededRandom`, `finishLook(id, partial)` (defaults, crater scatter, and the `extent` rings or a
  glow reach past the body) and `accentColor(look)` (a readable color for the name). Each toy keeps
  its own dictionary of looks and a `lookFor(id)`.

- **`BodyPicture.jsx`** — Renders one finished look as an SVG. Exports:
  - `BodyPicture({ look, size, style? })` — `size` is the body's diameter in px; the SVG is
    `look.extent` times bigger when rings, a glow, beams or a companion reach past the body, is
    centred on the body, and ignores pointer events so whatever wraps it takes the tap. Base and
    shadow radial gradients, a clip to the body shape, blurred stripe rects, rings drawn behind the
    body and again clipped to the near half in front; gradient ids from `useId`.

- **`useSpeech.js`** — Web Speech hook. `useSpeech({ lang, rate })` returns `{ available, speaking,
  speak(text), stop }`, picking the device's default voice for the language. Used by the Solar
  System and Exoplanets toys for names (Chinese Numbers has its own Mandarin-specific version).

- **`useElementWidth.js`** — `useElementWidth(ref, fallback)` — the element's current width, kept
  up to date on resize, for layouts worked out in pixels.

- **`useAutoFitFontSize.js`** — Binary search algorithm for dynamic font scaling within a container, with oscillation prevention via ceiling tracking. Accepts `{ maxFont, minFont, fitKey }` options; `fitKey` forces a refit when content changes without its character count changing (e.g. proportional letters). Available for use by any toy.

- **`useScrollLock.js`** — Hook to prevent background scrolling when overlays are active. Toggles the `overlay-open` class on `<html>` and `<body>` (styled in `base.css`). Usage: `useScrollLock(isOverlayVisible)`.

- **`numberblockColors.js`** — Shared Numberblocks-inspired color palette constants. Exports:
  - `NB_COLORS` — digit-to-color/gradient map (string keys `"1"`–`"100"` for ones and decade values, with `"7"` as a rainbow linear-gradient)
  - `NB_SOLID` — digit-to-solid-hex map (for box-shadows where gradients can't be used; covers `"1"`–`"100"`)
  - `NB_OUTLINE` — outline colors for exact multiples of 10 (`"10"`–`"100"`)
  - `NB_DIGIT_TEXT` — text colors for single digits 0–9 (solid purple for 7, white for 0); used by pi-digits, chinese-numbers, and prime-checker
  - `getNumberBlockStyle(n)` — returns `{ background, border }` for any number 1–100+, computing decade fill + ones-digit border colors
  - `NB7_STOPS` — array of rainbow gradient stop colors for Numberblocks 7
  - `NB7_GRADIENT` — the rainbow CSS linear-gradient string for Numberblocks 7

- **`BackgroundDots.jsx`** — Renders random floating circle decorations using the `float` animation and `.bg-dots` class. Accepts a `count` prop (default 20). Used by big-number-namer, clock, and calculator.

- **`StickyHeader.jsx`** — Consistent sticky header used by all toys. Stays pinned at the top when the page scrolls, with a frosted-glass background and drop shadow. Exports:
  - `StickyHeader({ title, subtitle?, titleStyle?, onGearClick? })` — renders back button, optional gear button, gradient title, and optional subtitle inside a `.sticky-header` wrapper. Uses `.sticky-header` CSS class from `base.css`.

- **`SettingsOverlay.jsx`** — Reusable settings modal shell with composition pattern. Exports:
  - `SettingsOverlay({ show, onClose, title?, children })` — backdrop, panel, close button, gradient heading
  - `SettingsToggle({ checked, onChange, label, hint? })` — checkbox toggle row
  - `SettingsDivider` — horizontal rule
  - `SettingsSection({ title, children })` — subheading + content block
  - `SettingsAboutText({ children })` — styled paragraph for about/credits text
  - `SettingsLink({ href, children })` — styled external link

- **`Toast.jsx`** — Shared toast notification component with enter/exit animation support. Exports:
  - `Toast({ text, visible, variant?, position?, enterAnimation?, exitAnimation?, exitDuration? })` — animated toast with two variants: `"info"` (gold on dark) and `"warning"` (white on red). Supports `"top"` or `"bottom"` positioning. Used by big-number-namer and fraction-combiner.

- **`mountApp.jsx`** — Shared React mount utility. Exports:
  - `mountApp(App)` — creates a React root, imports `base.css`, and renders the given App component. All toy `main.jsx` files use this instead of duplicating mount logic.

## Coding Conventions

- **Shared base styles** live in `shared/base.css` — design tokens (CSS custom properties), global resets, font loading, background, shared animations, and utility classes. Import it in new toys to inherit the Doodads look. Override CSS variables for tweaks, or skip the import entirely for a custom look.
- **Toy-specific styling is inline** via JavaScript style objects for dynamic/component-specific styles
- **Use CSS variables** (`var(--font-heading)`, `var(--glass-bg)`, etc.) instead of hardcoding shared values
- **Use shared CSS classes** (`.gradient-text`, `.toy-btn`, `.back-btn`, `.gear-btn`, `.page-header`, `.frosted-card`, `.toy-container`, `.bg-dots`) for common UI patterns instead of duplicating inline styles
- **Use `.toy-btn`** base class for all interactive buttons across toys. It provides border-radius, font, color, cursor, flex centering, user-select prevention, active-press scale, and disabled cursor. Each toy adds a modifier class (e.g. `.nb-btn`, `.calc-btn`, `.clock-btn`, `.frac-btn`, `.color-btn`) for size/shape overrides only.
- **Use `.toy-container`** class on the outermost div of every toy for consistent layout and safe-area padding. Add toy-specific overrides (e.g. `justifyContent`, `gap`) as inline styles.
- **Use `<StickyHeader />`** component for the toy header — provides a consistent sticky header with frosted-glass background, drop shadow, back button, optional gear button, gradient title, and subtitle. Stays pinned at the top when scrolling.
- **Use `<BackgroundDots />`** component for floating dot decorations instead of defining the useMemo + render pattern inline
- **Use `.frosted-card`** class for frosted glass card displays instead of redefining `background`, `backdropFilter`, `border`, `borderRadius` inline
- **Use the shared `SettingsOverlay`** shell for settings modals; pass toy-specific toggles and about content as children
- **Use the shared `Toast`** component for toast notifications instead of defining custom toast components per toy. Use `variant="info"` for informational toasts and `variant="warning"` for error/warning toasts.
- **Use `useScrollLock`** hook when showing full-screen overlays to prevent background scrolling
- **Import Numberblocks colors from `shared/numberblockColors.js`** instead of redefining the palette in each toy
- **Import color utilities from `shared/colorUtils.js`** for luminance, contrast text color, and hex conversion instead of redefining in each toy
- **Import math utilities from `shared/mathUtils.js`** for GCD and fraction simplification
- **Extract pure logic into separate files** — keep App.jsx focused on React components and state; move data dictionaries, algorithms, and naming systems into sibling `.js` files (e.g. `colorData.js`, `colorMixing.js`, `shapeNaming.js`)
- **Section delimiters**: `// ── Section Name ──` with box-drawing characters
- **Constants**: `UPPER_SNAKE_CASE` for arrays/objects
- **Functions/variables**: `camelCase`
- **React hooks**: Standard hooks (`useState`, `useRef`, `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`) used extensively
- **Component structure**: Functional components only, no class components
- **Fonts**: Fredoka (headings/buttons) and Outfit (body text), loaded via `shared/base.css`
- **Animations**: Shared animations (`popIn`, `fadeIn`, `float`, `flash`, `btnPress`, `shake`) live in `base.css`; toy-specific `@keyframes` are defined in a `<style>` tag within the component JSX
- **No external utility libraries** — vanilla JS throughout
- **Mobile-first**: Touch-friendly button sizes, viewport meta tags, responsive grid layouts with `maxWidth` constraints

### UI Conventions

- **Every toy must use `<StickyHeader />`** for its header. This provides the back button, optional gear button, gradient title, and subtitle in a consistent sticky container. The back button links to `../` for PWA navigation. Pass `onGearClick` to show a gear button for settings.
- **Header layout**: Back button (top-left), settings gear if needed (top-right), centered title and subtitle — all handled by `<StickyHeader />`.

## PWA Support

The app is installable as a Progressive Web App:
- `public/manifest.json` — app manifest with icons in multiple sizes (SVG + PNG at 180, 192, 512)
- `public/sw.js` — service worker with network-first caching strategy
- `public/pwa-init.js` — shared bootstrap script included via `<script src="/pwa-init.js"></script>` in every page's `<head>`. Handles the iOS standalone viewport height fix (`--app-height`) and service worker registration with auto-reload on update. Every toy's `index.html` should include this script.

### Service Worker Cache Versioning

The service worker cache version is **auto-generated at build time** — no manual version bumps needed. The `swCacheBustPlugin` in `vite.config.js` replaces the `__BUILD_ID__` placeholder in `sw.js` with a UTC timestamp (e.g. `doodads-20260222T153045`) during `npm run build`. This means every deploy produces a byte-different `sw.js`, which triggers browsers to install the new service worker and purge the old cache via the `activate` handler.

- **Production**: `__BUILD_ID__` → `20260222T153045` (automatic, no action needed)
- **Local dev**: `__BUILD_ID__` stays as-is (harmless — the service worker still functions)
- **No manual version bumps**: If you change any code and deploy, the cache updates automatically

## CI/CD

`.github/workflows/deploy.yml` deploys to GitHub Pages on every push to `main`:
1. Checks out code
2. Sets up Node 20 with npm caching
3. Runs `npm ci && npm run build`
4. Deploys `dist/` to GitHub Pages

## Adding a New Toy

1. Create a new directory at the project root (e.g., `my-new-toy/`)
2. Add an `index.html` inside it (Vite auto-discovers it)
3. **Include `<script src="/pwa-init.js"></script>`** in the `<head>` — this handles the iOS viewport fix and service worker registration automatically.
4. Add a card link in the root `index.html` grid
5. **Import `shared/base.css`** — either via `<link rel="stylesheet" href="shared/base.css" />` in HTML, or `import '../shared/base.css'` in a JS/JSX entry point. This gives you fonts, resets, background, animations, and utility classes. Skip this import if you want a fully custom look.
6. **Use `<StickyHeader />`** for the header (required for PWA navigation — see UI Conventions above). This provides the back button, title, subtitle, and optional gear button in a consistent sticky container.
7. **Use shared resources**: `.toy-container` class for layout, `.toy-btn` class for buttons, `<BackgroundDots />` for decorations, `numberblockColors.js` for the Numberblocks palette, `colorUtils.js` for color helpers, `mathUtils.js` for math helpers, `<SettingsOverlay>` for settings modals, `.frosted-card` for glass card displays, `useScrollLock` hook for overlays.
8. The toy will be built and deployed automatically

## Future Improvements

Low-priority items to consider as the project grows:

- [ ] **Add minimal ESLint config** — `eslint` + `eslint-plugin-react-hooks` for correctness checks only (no style rules, no Prettier). Catches bugs like unused effects and missing hook dependencies automatically.
- [ ] **Templatize HTML boilerplate** — The 6 toy `index.html` files share ~18 lines of identical boilerplate. A Vite HTML plugin could inject shared head content from a template. Not worth it until 10+ toys.
- [ ] **Extract Fraction Combiner SVG math** — Move `polarToXY`, `arcPath`, and color constants from `fraction-combiner/App.jsx` to a `fractionUtils.js` file. At 500 lines with one main component, the file isn't yet unwieldy, so this is optional.
