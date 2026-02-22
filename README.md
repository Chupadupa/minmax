# Doodads

A collection of little toys and experiments. Built with React + Vite, auto-deployed to GitHub Pages.

## Toys

- **[Big Number Namer](./big-number-namer/)** — Explore the names of ridiculously large numbers, up to a millinillion.

## Setup

```bash
npm install
npm run dev      # local dev server at http://localhost:5173
npm run build    # production build to ./dist
```

## Adding a new toy

1. Create a folder with your toy's name:
   ```
   my-new-toy/
     index.html
     main.jsx
     App.jsx
   ```

2. `index.html` — minimal shell:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <title>My New Toy</title>
   </head>
   <body style="margin:0">
     <div id="root"></div>
     <script type="module" src="./main.jsx"></script>
   </body>
   </html>
   ```

3. `main.jsx` — mount point:
   ```jsx
   import React from "react";
   import ReactDOM from "react-dom/client";
   import App from "./App";
   ReactDOM.createRoot(document.getElementById("root")).render(<App />);
   ```

4. `App.jsx` — your component.

5. Add a card to the root `index.html` to link to it.

6. Push to `main` — GitHub Actions builds and deploys automatically.

The Vite config auto-discovers any folder with an `index.html`, so no config changes needed.

## Deployment

Deploys automatically to GitHub Pages on push to `main` via GitHub Actions.

**One-time setup:**
1. Go to repo Settings → Pages
2. Set source to **GitHub Actions**

**Important:** Update the `base` value in `vite.config.js` to match your repo name:
```js
base: "/your-repo-name/",
```
