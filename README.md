# Doodads

A collection of little toys and experiments. Built with React + Vite, auto-deployed to GitHub Pages.

## Toys

- **[Big Number Namer](./big-number-namer/)** — Explore the names of ridiculously large numbers, up to a millinillinillinillinillion.
- **[Time Teller](./clock/)** — Drag the clock hands or type a time — learn to tell time with an interactive clock.
- **[Calculator](./calculator/)** — A colorful calculator with big, friendly Numberblocks-inspired buttons.
- **[Color Mixer](./color-mixer/)** — Tap colors to mix them together and see what you get.
- **[Fraction Combiner](./fraction-combiner/)** — Combine fraction pie pieces to fill a circle and learn fractions.

## Setup

```bash
npm install
npm run dev      # local dev server at http://localhost:5173
npm run build    # production build to ./dist
```

## Adding a new toy

1. Create a folder with your toy's name and add an `index.html` — Vite auto-discovers it, no config changes needed.

2. Include `<script src="/pwa-init.js"></script>` in the `<head>` for the iOS viewport fix and service worker.

3. Import `shared/base.css` for fonts, resets, background, animations, and utility classes (`.back-btn`, `.frosted-card`, `.gradient-text`, etc.).

4. Include a back button (`<a href="../" class="back-btn">⬅️</a>`) in the header — required for PWA navigation.

5. Add a card to the root `index.html` grid to link to it.

6. Push to `main` — GitHub Actions builds and deploys automatically.

## Deployment

Deploys automatically to GitHub Pages on push to `main` via GitHub Actions.

**One-time setup:**
1. Go to repo Settings → Pages
2. Set source to **GitHub Actions**

**Important:** Update the `base` value in `vite.config.js` to match your repo name:
```js
base: "/your-repo-name/",
```
