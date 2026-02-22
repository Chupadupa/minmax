# CLAUDE.md

## Project Overview

**Doodads** is a collection of interactive web toys built with React and Vite. The primary (and currently only) toy is the **Big Number Namer**, which lets users explore the names of large numbers up to a millinillinillinillinillion (3 trillion+ zeros). Built as a personal project for a child who loves numbers.

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
├── big-number-namer/           # Primary toy
│   ├── index.html              # Entry HTML
│   ├── main.jsx                # React mount point
│   ├── App.jsx                 # Components, UI, and state (~635 lines)
│   └── numberNaming.js         # Pure naming logic (reusable, no React dependency)
├── shared/
│   ├── base.css                # Shared stylesheet: tokens, resets, fonts, animations, utilities
│   └── useAutoFitFontSize.js   # Generic auto-fit font hook (reusable across toys)
├── public/
│   ├── icon.svg                # App icon
│   ├── icon-maskable.svg       # PWA maskable icon
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

### Big Number Namer

Split across a few files, with most UI kept together in `App.jsx`:

- **`numberNaming.js`** — Pure functions (no React dependency) that convert a zero count into a written number name using Latin prefix composition. Key exports:
  - `getNumberName(zeros, useDashes)` — Main conversion function
  - `formatZerosWithCommas(zerosCount)` — Comma-formatted number display

- **`App.jsx`** — All React components, state, and styles:
  1. **Constants** — `NB_COLORS`, `NB_SOLID` (Numberblocks-inspired button colors), `MAX_ZEROS` (3,000,000,000,003)
  2. **Components**: `FunFactToast`, `SettingsOverlay`, `BigNumberNamer` (main)
  3. **Styles** — Inline style objects at bottom of file (`styles`, `settingsStyles`)

### Shared Utilities (`shared/`)

- **`base.css`** — Shared stylesheet providing design tokens (CSS custom properties), global resets, font loading (Fredoka & Outfit via Google Fonts), dark gradient background, shared keyframe animations (`popIn`, `fadeIn`, `float`, `flash`), and utility CSS classes (`.gradient-text`, `.frosted-card`, `.back-btn`, `.gear-btn`, `.page-header`, `.safe-area-container`). Toys import this to get the Doodads look for free, override CSS variables for tweaks, or skip the import entirely for a custom look.

- **`useAutoFitFontSize.js`** — Binary search algorithm for dynamic font scaling within a container, with oscillation prevention via ceiling tracking. Accepts `{ maxFont, minFont }` options. Available for use by any toy.

## Coding Conventions

- **Shared base styles** live in `shared/base.css` — design tokens (CSS custom properties), global resets, font loading, background, shared animations, and utility classes. Import it in new toys to inherit the Doodads look. Override CSS variables for tweaks, or skip the import entirely for a custom look.
- **Toy-specific styling is inline** via JavaScript style objects for dynamic/component-specific styles
- **Use CSS variables** (`var(--font-heading)`, `var(--glass-bg)`, etc.) instead of hardcoding shared values
- **Use shared CSS classes** (`.gradient-text`, `.back-btn`, `.gear-btn`, `.page-header`, `.frosted-card`) for common UI patterns instead of duplicating inline styles
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

- **Every toy must include a back button** in its header that links to the hub (`../`). This is critical for PWA navigation where there is no browser chrome. Use an `<a>` tag (not a button) with `href="../"`, styled as a 36x36 rounded pill in the top-left corner with a `‹` character. See `big-number-namer/App.jsx` `styles.backBtn` for the reference implementation.
- **Header layout**: Back button (top-left), settings gear if needed (top-right), centered title and subtitle.

## PWA Support

The app is installable as a Progressive Web App:
- `public/manifest.json` — app manifest
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
7. The toy will be built and deployed automatically
