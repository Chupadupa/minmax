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
│   └── App.jsx                 # All components and logic (~766 lines)
├── public/
│   ├── icon.svg                # App icon
│   ├── icon-maskable.svg       # PWA maskable icon
│   ├── manifest.json           # Web app manifest (PWA)
│   └── sw.js                   # Service worker for offline caching
├── vite.config.js              # Auto-discovers toy directories as entry points
├── package.json
└── .github/workflows/deploy.yml
```

## Architecture

### Multi-Page Auto-Discovery

`vite.config.js` auto-discovers any subdirectory containing an `index.html` as a separate page entry. To add a new toy, create a new directory with its own `index.html` — no config changes needed.

### Big Number Namer (`big-number-namer/App.jsx`)

Everything lives in a single file organized with section comment headers (`// ── Section Name ──`):

1. **Naming Logic** (top of file) — Pure functions that convert a zero count into a written number name using Latin prefix composition. Key functions:
   - `getGroupPrefix()` / `getIllionPrefix()` — Recursive Latin prefix construction
   - `getNumberName(zeros, useDashes)` — Main conversion function
   - `formatZerosWithCommas(zerosCount)` — Comma-formatted number display

2. **Constants** — `NB_COLORS`, `NB_SOLID` (Numberblocks-inspired button colors), `MAX_ZEROS` (3,000,000,000,003)

3. **Custom Hook** — `useAutoFitFontSize()` — Binary search algorithm for dynamic font scaling within a container, with oscillation prevention via ceiling tracking

4. **Components**:
   - `FunFactToast` — Animated toast for milestone numbers (googol, centillion, etc.)
   - `SettingsOverlay` — Modal with toggles for dashes and commas
   - `BigNumberNamer` — Main component with header (back button + settings gear), numpad, display, state management

5. **Styles** — Inline style objects at bottom of file (`styles`, `settingsStyles`)

## Coding Conventions

- **All styling is inline** via JavaScript style objects — no CSS files, no CSS modules
- **Section delimiters**: `// ── Section Name ──` with box-drawing characters
- **Constants**: `UPPER_SNAKE_CASE` for arrays/objects
- **Functions/variables**: `camelCase`
- **React hooks**: Standard hooks (`useState`, `useRef`, `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`) used extensively
- **Component structure**: Functional components only, no class components
- **Fonts**: Fredoka (headings/buttons) and Outfit (body text), loaded via Google Fonts
- **Animations**: CSS `@keyframes` defined in a `<style>` tag within the component JSX
- **No external utility libraries** — vanilla JS throughout
- **Mobile-first**: Touch-friendly button sizes, viewport meta tags, responsive grid layouts with `maxWidth` constraints

### UI Conventions

- **Every toy must include a back button** in its header that links to the hub (`../`). This is critical for PWA navigation where there is no browser chrome. Use an `<a>` tag (not a button) with `href="../"`, styled as a 36x36 rounded pill in the top-left corner with a `‹` character. See `big-number-namer/App.jsx` `styles.backBtn` for the reference implementation.
- **Header layout**: Back button (top-left), settings gear if needed (top-right), centered title and subtitle.

## PWA Support

The app is installable as a Progressive Web App:
- `public/manifest.json` — app manifest
- `public/sw.js` — service worker with network-first caching strategy
- Root `index.html` registers the service worker

## CI/CD

`.github/workflows/deploy.yml` deploys to GitHub Pages on every push to `main`:
1. Checks out code
2. Sets up Node 20 with npm caching
3. Runs `npm ci && npm run build`
4. Deploys `dist/` to GitHub Pages

## Adding a New Toy

1. Create a new directory at the project root (e.g., `my-new-toy/`)
2. Add an `index.html` inside it (Vite auto-discovers it)
3. Add a card link in the root `index.html` grid
4. **Include a back button** in the header linking to `../` (required for PWA navigation — see UI Conventions above)
5. The toy will be built and deployed automatically
