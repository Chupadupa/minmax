# CLAUDE.md

## Project Overview

**Doodads** is a collection of interactive web toys built with React and Vite, made for a young child who loves numbers. Simplicity comes first: big touch targets, pictures over words, nothing to read before you can play.

The toys, as named on screen (two folders keep older names):

- **Big Number Namer** (`big-number-namer/`) — the names of huge numbers, by how many zeros, up to a millinillinillinillinillion
- **Calculator** (`calculator/`) — a colorful calculator with Numberblocks-colored keys
- **Odd or Even** (`odd-or-even/`) — is a number odd or even? Blocks lined up in pairs, up to 30 digits
- **Prime Checker** (`prime-checker/`) — is a number prime? Rows of blocks and prime factors, up to 24 digits
- **Pi Digits** (`pi-digits/`) — as many digits of π as you ask for, up to a million
- **Roman Numerals** (`roman-numerals/`) — any number in Roman numerals, up to 3,999,999,999,999 using stacked bars
- **Chinese Numbers** (`chinese-numbers/`) — any number in Chinese characters with pinyin, spoken aloud, up to 68 digits
- **Spanish Numbers** (`spanish-numbers/`) — any number in Spanish words with a say-it guide, spoken aloud, up to 66 digits
- **Shape Selector** (`shape-selector/`) — tap a shape to see it big and learn its name, up to 10,000 sides
- **Color Combiner** (`color-mixer/`) — tap colors to mix them and see what you get
- **Fraction Fitter** (`fraction-combiner/`) — fit fraction pie pieces together to fill a circle
- **Time Teller** (`clock/`) — drag a clock's hands or type a time
- **Solar System** (`solar-system/`) — the Sun, planets, dwarf planets, asteroids and moons, each with a close-up
- **Exoplanets** (`exoplanets/`) — 22 other star systems and their planets, each with an imagined close-up

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

There are no test, lint, or format commands. To check a change, build it and look at it in a browser at phone (390 px) and tablet (820 px) widths.

## Project Structure

```
/
├── index.html          # Home page: its styles, plus a <!-- toys --> marker filled in from shared/toys.js
├── <toy>/              # One folder per toy (see "A Toy's Files")
├── shared/             # Everything used by more than one toy (see "Shared Code")
├── public/             # PWA: icons, manifest.json, pwa-init.js, sw.js
├── vite.config.js      # Finds the toy folders, builds the home page, stamps the service worker
└── .github/workflows/deploy.yml
```

## Architecture

### A Toy's Files

Every toy folder has the same shape:

- **`index.html`** — the page: title, description, `<script src="/pwa-init.js">`, any extra fonts, and `main.jsx`
- **`main.jsx`** — four lines: `mountApp(App)` from `shared/mountApp.jsx`, which also pulls in `base.css`
- **`App.jsx`** — the React components, state, and inline `styles` object at the bottom
- **sibling `.js` files** — pure logic and data with no React in them (`primes.js`, `spanishNumbers.js`, `bodies.js`…), and Web Workers for slow sums (`piWorker.js`, `factorWorker.js`)

Each file opens with a comment saying what it holds and what it exports. Read that rather than expecting the details here; this file only records what the code can't tell you.

### Multi-Page Auto-Discovery

`vite.config.js` treats any top-level folder containing an `index.html` as a page. There is no router and no page list to edit in the config.

### Home Page and the Toy List

`shared/toys.js` is the one list of toys. `SHELVES` are the home page's four color-coded groups (Numbers, Number Words, Shapes & Colors, Space); `TOYS` gives each toy's `id` (its folder), `name`, `picture` (an emoji, or with `textPicture` a plain character like π), `shelf` and tile `colors` (a gradient — each shelf runs through its own family of colors).

The home page is plain HTML with no JavaScript: `hubPlugin` in `vite.config.js` fills the `<!-- toys -->` marker in the root `index.html` with a shelf per entry in `SHELVES` and a picture tile per toy, in list order (dev server and build alike). The tile styles live in the root `index.html`. The config also checks the list against the toy folders and stops with "Toy list out of step" if a folder has no entry or an entry has no folder.

The home page is built for a child who can't read yet: big picture tiles (three across on a phone, five on a tablet, so every shelf is one row and the whole page fits one iPad screen), no descriptions, and no tabs, search, menus or "recently played" row. Tiles should never move — a toy is found by remembering where its picture was — so add new toys at the end of their shelf.

### Number Toys

Seven toys (Big Number Namer, Pi Digits, Roman Numerals, Chinese Numbers, Spanish Numbers, Prime Checker, Odd or Even) share one layout: a display card, a fun-fact strip, then the numpad. The typed number lives in `useNumberInput` as a **digit string**, because most of these toys go far past what a JS number can hold — do arithmetic on `pad.n` (a BigInt), never `parseInt`.

Chinese Numbers and Spanish Numbers are the same toy in two languages. Their display is the shared `ReadingCard`, which does the sizing and scrolling; each toy supplies only its language: the pure reading logic, how a word is drawn, the key shown before a number is typed, and its settings. A third language should be built the same way.

### Space Toys

Solar System and Exoplanets share the renderer that draws a world from a "look" (`shared/bodyArt.js`, `shared/BodyPicture.jsx`), the close-up that opens when a world is tapped (`shared/WorldPanel.jsx`), and the tracking of what has been visited (`shared/useVisits.js`). Each keeps its own data, looks, map and fact chips. They link to each other: the Solar System's signpost leads to Exoplanets, and the Sun's row there leads back.

### Things the Code Can't Tell You

- **Counts go out of date.** `MOONS_AS_OF` and the `moonCount`s in `solar-system/bodies.js`, and `KNOWN_EXOPLANETS` / `PLANETS_AS_OF` in `exoplanets/exoplanets.js`, are snapshots — bump them when new moons or planets are announced.
- **Three toys load their own fonts** in `index.html`, because the shared ones lack the glyphs: Cinzel (Roman Numerals), LXGW WenKai TC and Andika (Chinese Numbers — pinyin tone marks), Andika (Spanish Numbers — accents).
- **Speech depends on the device.** The 🔊 buttons use the Web Speech API. They hide when the browser has no speech at all, and in Chinese and Spanish Numbers also when the device has no voice for that language.
- **Spanish uses the long scale**: un billón is 10¹², not 10⁹.
- **Prime checking is exact, not probabilistic**, but only up to the 24-digit limit the Miller–Rabin bases were chosen for. Don't raise `MAX_DIGITS` in `primes.js` without revisiting them.

## Shared Code (`shared/`)

Look here before writing anything a second toy might want.

**Page furniture**

- **`base.css`** — design tokens (CSS variables), resets, fonts, the background, shared keyframes (`popIn`, `fadeIn`, `float`, `flash`, `btnPress`, `shake`, `toastEnter`, `toastExit`, `speakPulse`) and utility classes (`.toy-container`, `.toy-btn`, `.nb-btn`, `.pm-btn`, `.frosted-card`, `.gradient-text`, `.sticky-header`, `.page-header`, `.back-btn`, `.gear-btn`, `.bg-dots`, `.overlay-open`)
- **`mountApp.jsx`** — `mountApp(App)`: creates the React root and imports `base.css`
- **`StickyHeader.jsx`** — `StickyHeader({ title, subtitle?, titleStyle?, onGearClick? })`: back button, title, optional gear
- **`BackgroundDots.jsx`** — `BackgroundDots({ count? })`: the floating dots
- **`SettingsOverlay.jsx`** — the settings modal: `SettingsOverlay({ show, onClose, title? })` with `SettingsToggle`, `SettingsDivider`, `SettingsSection`, `SettingsAboutText`, `SettingsLink`, and `NumberblocksWord` (the rainbow word for the credit line)
- **`Toast.jsx`** — `Toast({ text, visible?, variant?, position?, enterAnimation?, exitAnimation?, exitDuration? })`, `"info"` (gold on dark) or `"warning"` (white on red), positioned against its nearest positioned parent. Two ready-placed versions: `FunFact({ text })`, in the strip between a number toy's display and its numpad, and `FloatingToast({ text })`, pinned near the top of the screen over everything
- **`toys.js`** — the toy list (see above)

**Numbers**

- **`Numpad.jsx`** and **`useNumberInput.js`** — the number pad and the hook that drives it.
  - `useNumberInput({ max, zeroIsEmpty? })` returns a `pad`: `input` (digit string), `n` (BigInt, or null when empty), `isEmpty`, `canType`, `canStep(k)`, the actions `type(d)`, `backspace()`, `clear()`, `step(k, key?)`, `set(value, key?)`, and `flash` / `bounce` for the display's flash and a key's press animation. `max` caps the value — typing past it lands on it — and sets how many digits fit. `zeroIsEmpty` is for toys where 0 isn't a number of its own.
  - `Numpad({ pad, middleKey?, leftKey?, rightKey? })` renders − 1 / + 1, CLR / ← and the digit grid. `middleKey` goes between − 1 and + 1 (the 🔊 button); `leftKey` / `rightKey` go either side of 0.
  - `NumpadKey({ pad, id, disabled?, label?, style?, onClick, children })` is one extra key for the digit grid: it dims when disabled and bounces when `pad.bounce === id`.
  - `NumpadSpeakKey({ speech, disabled?, getText })` is the 🔊 key for `middleKey`: it says `getText()` and turns into ⏹ while talking.
- **`ReadingCard.jsx`** — the display of a toy that writes a number out in a language: `ReadingCard({ pad, number, colorize, emptyLabel, countLabel, zeroHint, wordKey, reading, readingFit, readingStyle?, parts, partsFit, chipStyle?, chipWordsStyle? })`. It fits the number, the reading and the parts chips to their boxes (refitting when a web font arrives) and scrolls what won't fit. Also exports `PLAIN_COLOR` and `UNIT_PILL` (the gold pill round a big word).
- **`NumberTile.jsx`** — `NumberTile({ value, label, style?, onClick? })`: a number in a rounded tile, colored like its Numberblock up to 100 and gold beyond; `NUMBER_TILE_SHAPE` is the tile without its colors
- **`numberblockColors.js`** — the Numberblocks palette: `NB_COLORS` (fills, `"1"`–`"100"`), `NB_SOLID` (solid colors for shadows), `NB_OUTLINE` (borders for the tens), `NB_DIGIT_TEXT` (text colors for digits 0–9), `NB7_STOPS` / `NB7_GRADIENT` (Seven's rainbow), `getNumberBlockStyle(n)` → `{ background, border }`
- **`formatUtils.js`** — `formatNumber(n, useCommas)` (numbers and BigInts), `formatDays`, `formatHours`, `formatTemp`, `ordinal`, `plural(n, unit)`, `trimTo`
- **`mathUtils.js`** — `gcd(a, b)`, `simplify(num, den)`
- **`colorUtils.js`** — `luminance(hex)`, `contrastTextColor(hex)`, `rgbToHex(rgb)`, `textColorForRgb(rgb)`

**Hooks**

- **`useAutoFitFontSize.js`** — `useAutoFitFontSize(outerRef, innerRef, charCount, { maxFont, minFont, fitKey })`: the biggest font size at which the inner element fits the outer one. `fitKey` forces a refit when the content changes but its length doesn't.
- **`useElementWidth.js`** — `useElementWidth(ref, fallback)`: an element's width, kept current on resize
- **`useScrollLock.js`** — `useScrollLock(active)`: stops the page scrolling behind an overlay
- **`useSpeech.js`** — `useSpeech({ lang, rate, match?, prefer? })` → `{ available, hasVoice, speaking, speak(text), stop }`. `prefer` lists voices to try first; `match` is a pattern for which voices count at all, for when a language-tag prefix isn't enough (Mandarin). Also `chunkSpeech(pieces, { joiner?, maxLength })`, which splits long text into utterances browsers won't cut off.
- **`useVisits.js`** — `useVisits(milestones)` → `{ selectedId, pick(id), close(), toast }`: which thing is open, and a toast the first time every id in a milestone has been opened

**Drawing worlds**

- **`bodyArt.js`** — the "look" format (documented at the top of the file), `finishLook(id, partial)`, `accentColor(look)`, and the seeded-random helpers
- **`BodyPicture.jsx`** — `BodyPicture({ look, size, style? })`: draws a finished look as an SVG
- **`WorldPanel.jsx`** — `WorldPanel({ world, lookFor, siblings, back, homeLabel, kind, chips, related?, ribbon?, badge?, extra?, speech, onPick, onClose, picSize?, nameSize? })`: the close-up of one world, with ◀ ▶ to its neighbors, its name and 🔊, fact chips, a fun fact and a row of the worlds that go round it

## Coding Conventions

- **Reuse before writing.** If `shared/` has it, use it; if a second toy needs what one toy has, move it to `shared/` rather than copying it.
- **Extract pure logic into separate files** — keep `App.jsx` for React components and state; data, algorithms and naming systems go in sibling `.js` files with no React in them.
- **Open each file with a comment** saying what it holds and what it exports. That comment is the documentation.
- **Toy-specific styling is inline**, as JavaScript style objects in a `styles` constant at the bottom of the file. Toy-specific `@keyframes` go in a `<style>` tag in the component.
- **Shared styling comes from `base.css`**: use its CSS variables (`var(--font-heading)`, `var(--glass-bg)`…) and classes instead of repeating values.
- **`.toy-container`** on the outermost div of every toy; **`.toy-btn`** on every interactive button, plus a modifier class for size and shape only (`.calc-btn`, `.clock-btn`, `.frac-btn`, `.color-btn`; the numpad's `.nb-btn` and `.pm-btn` live in `base.css`).
- **`<Numpad />` with `useNumberInput`** wherever a number is typed; toy-specific keys are `<NumpadKey />`s.
- **`<Toast />`** (or `<FunFact />`) for every pop-up message; **`<SettingsOverlay>`** for settings; **`useScrollLock`** under any full-screen overlay.
- **Section delimiters**: `// ── Section Name ──` with box-drawing characters
- **Naming**: `UPPER_SNAKE_CASE` for constants, `camelCase` for functions and variables
- **Functional components and hooks only**; no class components
- **Fonts**: Fredoka (headings, buttons) and Outfit (body text), loaded by `base.css`
- **No external utility libraries** — vanilla JS throughout
- **Mobile-first**: touch-friendly sizes, layouts with a `maxWidth`, checked at phone and tablet widths

### UI Conventions

- **Every toy uses `<StickyHeader />`**: back button top-left (it links to `../`, which is how you get home in the installed app), settings gear top-right when `onGearClick` is passed, title and subtitle centered.
- **The reader may not be able to read.** Prefer a picture, a color or a position to a label, and never make a toy depend on text to be usable.

## PWA Support

The app is installable as a Progressive Web App:

- `public/manifest.json` — the manifest and icons
- `public/sw.js` — the service worker: network first, falling back to cache, so a toy works offline once it has been opened
- `public/pwa-init.js` — included by every page's `<head>`; fixes the iOS standalone viewport height (`--app-height`) and registers the service worker, reloading when a new one takes over

The cache name is stamped at build time: `swCacheBustPlugin` in `vite.config.js` replaces `__BUILD_ID__` in `sw.js` with a UTC timestamp, so every deploy installs a new service worker and clears the old cache. There are no version numbers to bump. In local dev the placeholder stays as it is, harmlessly.

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`: `npm ci && npm run build`, then deploys `dist/` to GitHub Pages.

## Adding a New Toy

1. Create a folder at the project root (e.g. `my-new-toy/`) with an `index.html` — copy one from another toy and change the title and description. Keep `<script src="/pwa-init.js"></script>` in the `<head>`.
2. Add `main.jsx` (`mountApp(App)`) and `App.jsx`.
3. Add an entry to `TOYS` in `shared/toys.js`, at the end of its shelf. The home page tile is built from it, and the build stops if it's missing.
4. Use `<StickyHeader />`, `.toy-container` and `.toy-btn`, and whatever else in `shared/` fits.
5. Put the logic in its own `.js` file, with a comment at the top.
6. Add the toy's line to the list at the top of this file.

It is built and deployed automatically on the next push to `main`.

## Future Improvements

Low-priority items to consider as the project grows:

- [ ] **Add minimal ESLint config** — `eslint` + `eslint-plugin-react-hooks` for correctness checks only (no style rules, no Prettier).
- [ ] **A few tests for the pure logic** — `primes.js`, `spanishNumbers.js`, `chineseNumbers.js` and `romanNumerals.js` are plain functions with exact right answers; `node --test` would cover them with no new dependencies.
- [ ] **Extract Fraction Fitter's SVG math** — move `polarToXY`, `arcPath` and the color constants out of `fraction-combiner/App.jsx` into a `fractionUtils.js`.
- [ ] **Generate each toy's `index.html`** — the 14 files differ only in title, description and extra fonts, which could move into `shared/toys.js`.
- [ ] **Remember settings between visits** — every toggle resets when the page reloads.
- [ ] **Offline from the first visit** — the service worker only caches a toy once it has been opened.
