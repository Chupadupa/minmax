# CLAUDE.md

## Project Overview

**Doodads** is a collection of interactive web toys built with React and Vite. Built as a personal project for a child who loves numbers. Current toys:

- **Big Number Namer** — Explore the names of large numbers up to a millinillinillinillinillion (3 trillion+ zeros)
- **Time Teller** — Interactive analog clock; drag the hands or type a time to learn to tell time
- **Calculator** — Colorful calculator with Numberblocks-inspired button colors
- **Color Mixer** — Tap colors to mix them together and see what you get
- **Fraction Combiner** — Combine fraction pie pieces to fill a circle; a pie chart game for learning fractions

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
│   ├── App.jsx                 # Interactive analog clock components
│   └── clockUtils.js           # Pure clock math (angles, time parsing, formatting)
├── calculator/                 # Calculator toy
│   ├── index.html
│   ├── main.jsx
│   ├── App.jsx                 # Calculator UI with Numberblocks-inspired colors
│   └── calcEngine.js           # Pure calculation logic (display formatting, compute)
├── color-mixer/                # Color Mixer toy
│   ├── index.html
│   ├── main.jsx
│   └── App.jsx                 # Color mixing UI (tap colors to blend)
├── fraction-combiner/          # Fraction Combiner toy
│   ├── index.html
│   ├── main.jsx
│   └── App.jsx                 # Fraction pie chart game
├── shared/
│   ├── base.css                # Shared stylesheet: tokens, resets, fonts, animations, utilities
│   ├── useAutoFitFontSize.js   # Generic auto-fit font hook (reusable across toys)
│   ├── numberblockColors.js    # Shared NB_COLORS, NB_SOLID, NB7_STOPS, NB7_GRADIENT constants
│   ├── BackgroundDots.jsx      # Floating background dots decoration component
│   └── SettingsOverlay.jsx     # Reusable settings modal shell with toggle/divider/section helpers
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
  2. **Components**: `FunFactToast`, `BigNumberSettings` (uses shared `SettingsOverlay`), `BigNumberNamer` (main)
  3. **Styles** — Inline style objects at bottom of file (`styles`); settings styles from shared module

### Time Teller (`clock/`)

Interactive analog clock where kids can drag clock hands or type a time to learn to tell time.

- **`clockUtils.js`** — Pure functions for clock math: angle↔time conversion, time formatting, drag-to-angle, wrap detection
- **`App.jsx`** — SVG clock face with draggable hour/minute/second hands, 12/24-hour toggle, Numberblocks-inspired hour labels

### Calculator (`calculator/`)

A colorful calculator with big Numberblocks-inspired buttons.

- **`calcEngine.js`** — Pure calculation logic: display formatting, parsing, operator computation, digit limits
- **`App.jsx`** — Calculator UI with color-coded digit buttons (each digit 1–9 has its own Numberblocks color), operators, and an auto-fit display

### Color Mixer (`color-mixer/`)

Tap colors from a palette to mix them together and see the resulting color name.

- **`App.jsx`** — Single-file toy; additive RGB mixing, named color matching, clear/undo

### Fraction Combiner (`fraction-combiner/`)

A pie chart game for learning fractions. Combine fraction pieces to fill a whole circle.

- **`App.jsx`** — Single-file toy; SVG pie chart, fraction selection (halves through tenths), Numberblocks-inspired colors, LCD-based fraction arithmetic (LCD = 2520 for 1–10)

### Shared Utilities (`shared/`)

- **`base.css`** — Shared stylesheet providing design tokens (CSS custom properties), global resets, font loading (Fredoka & Outfit via Google Fonts), dark gradient background, shared keyframe animations (`popIn`, `fadeIn`, `float`, `flash`, `btnPress`), utility CSS classes (`.gradient-text`, `.frosted-card`, `.back-btn`, `.gear-btn`, `.page-header`, `.safe-area-container`, `.toy-container`, `.bg-dots`), page header defaults (`.page-header h1`, `.page-header .subtitle`), and global user-select prevention. Toys import this to get the Doodads look for free, override CSS variables for tweaks, or skip the import entirely for a custom look.

- **`useAutoFitFontSize.js`** — Binary search algorithm for dynamic font scaling within a container, with oscillation prevention via ceiling tracking. Accepts `{ maxFont, minFont }` options. Available for use by any toy.

- **`numberblockColors.js`** — Shared Numberblocks-inspired color palette constants. Exports:
  - `NB_COLORS` — digit-to-color/gradient map (string keys `"1"`–`"9"`, with `"7"` as a rainbow linear-gradient)
  - `NB_SOLID` — digit-to-solid-hex map (for box-shadows where gradients can't be used)
  - `NB7_STOPS` — array of rainbow gradient stop colors for Numberblocks 7
  - `NB7_GRADIENT` — the rainbow CSS linear-gradient string for Numberblocks 7

- **`BackgroundDots.jsx`** — Renders random floating circle decorations using the `float` animation and `.bg-dots` class. Accepts a `count` prop (default 20). Used by big-number-namer, clock, and calculator.

- **`SettingsOverlay.jsx`** — Reusable settings modal shell with composition pattern. Exports:
  - `SettingsOverlay({ show, onClose, title?, children })` — backdrop, panel, close button, gradient heading
  - `SettingsToggle({ checked, onChange, label, hint? })` — checkbox toggle row
  - `SettingsDivider` — horizontal rule
  - `SettingsSection({ title, children })` — subheading + content block
  - `SettingsAboutText({ children })` — styled paragraph for about/credits text
  - `SettingsLink({ href, children })` — styled external link

## Coding Conventions

- **Shared base styles** live in `shared/base.css` — design tokens (CSS custom properties), global resets, font loading, background, shared animations, and utility classes. Import it in new toys to inherit the Doodads look. Override CSS variables for tweaks, or skip the import entirely for a custom look.
- **Toy-specific styling is inline** via JavaScript style objects for dynamic/component-specific styles
- **Use CSS variables** (`var(--font-heading)`, `var(--glass-bg)`, etc.) instead of hardcoding shared values
- **Use shared CSS classes** (`.gradient-text`, `.back-btn`, `.gear-btn`, `.page-header`, `.frosted-card`, `.toy-container`, `.bg-dots`) for common UI patterns instead of duplicating inline styles
- **Use `.toy-container`** class on the outermost div of every toy for consistent layout and safe-area padding. Add toy-specific overrides (e.g. `justifyContent`, `gap`) as inline styles.
- **Use `<BackgroundDots />`** component for floating dot decorations instead of defining the useMemo + render pattern inline
- **Use `.frosted-card`** class for frosted glass card displays instead of redefining `background`, `backdropFilter`, `border`, `borderRadius` inline
- **Use the shared `SettingsOverlay`** shell for settings modals; pass toy-specific toggles and about content as children
- **Import Numberblocks colors from `shared/numberblockColors.js`** instead of redefining the palette in each toy
- **Section delimiters**: `// ── Section Name ──` with box-drawing characters
- **Constants**: `UPPER_SNAKE_CASE` for arrays/objects
- **Functions/variables**: `camelCase`
- **React hooks**: Standard hooks (`useState`, `useRef`, `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`) used extensively
- **Component structure**: Functional components only, no class components
- **Fonts**: Fredoka (headings/buttons) and Outfit (body text), loaded via `shared/base.css`
- **Animations**: Shared animations (`popIn`, `fadeIn`, `float`, `flash`) live in `base.css`; toy-specific `@keyframes` are defined in a `<style>` tag within the component JSX
- **No external utility libraries** — vanilla JS throughout
- **Mobile-first**: Touch-friendly button sizes, viewport meta tags, responsive grid layouts with `maxWidth` constraints

### UI Conventions

- **Every toy must include a back button** in its header that links to the hub (`../`). This is critical for PWA navigation where there is no browser chrome. Use an `<a>` tag (not a button) with `href="../"` and the `.back-btn` CSS class from `base.css` (36×36 rounded pill in the top-left corner with the `⬅️` emoji).
- **Header layout**: Back button (top-left), settings gear if needed (top-right), centered title and subtitle.

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
6. **Include a back button** in the header linking to `../` (required for PWA navigation — see UI Conventions above). Use the `.back-btn` CSS class from `base.css`.
7. **Use shared resources**: `.toy-container` class for layout, `<BackgroundDots />` for decorations, `numberblockColors.js` for the Numberblocks palette, `<SettingsOverlay>` for settings modals, `.frosted-card` for glass card displays.
8. The toy will be built and deployed automatically
