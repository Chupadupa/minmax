import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from "fs";
import { SHELVES, TOYS } from "./shared/toys.js";

// Auto-discover toy directories that contain an index.html
function discoverPages(rootDir) {
  const pages = { main: resolve(rootDir, "index.html") };
  const entries = readdirSync(rootDir);
  for (const entry of entries) {
    const entryPath = resolve(rootDir, entry);
    if (
      statSync(entryPath).isDirectory() &&
      !entry.startsWith(".") &&
      entry !== "node_modules" &&
      entry !== "dist" &&
      entry !== "shared" &&
      entry !== "public" &&
      existsSync(resolve(entryPath, "index.html"))
    ) {
      pages[entry] = resolve(entryPath, "index.html");
    }
  }
  checkToyList(Object.keys(pages).filter((name) => name !== "main"));
  return pages;
}

// Every toy folder needs an entry in shared/toys.js (or it would have no tile
// on the home page), and every entry needs a folder (or its tile goes nowhere).
function checkToyList(folders) {
  const listed = TOYS.map((toy) => toy.id);
  const unlisted = folders.filter((name) => !listed.includes(name));
  const missing = listed.filter((id) => !folders.includes(id));
  const unshelved = TOYS.filter((toy) => !SHELVES.some((shelf) => shelf.id === toy.shelf)).map((toy) => toy.id);
  const problems = [
    unlisted.length && `no entry in shared/toys.js for: ${unlisted.join(", ")}`,
    missing.length && `no folder with an index.html for: ${missing.join(", ")}`,
    unshelved.length && `no such shelf for: ${unshelved.join(", ")}`,
  ].filter(Boolean);
  if (problems.length) throw new Error(`Toy list out of step — ${problems.join("; ")}`);
}

// ── Home Page ──
// Fills the root index.html's <!-- toys --> marker with a shelf per entry in
// SHELVES and a picture tile per toy, so the home page stays plain HTML.
const HUB_MARKER = "<!-- toys -->";

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderTile(toy) {
  const pictureClass = toy.textPicture ? "pic text-pic" : "pic";
  return `
        <a class="tile" href="./${toy.id}/" style="--a: ${toy.colors[0]}; --b: ${toy.colors[1]}">
          <span class="${pictureClass}" aria-hidden="true">${escapeHtml(toy.picture)}</span>
          <span class="name">${escapeHtml(toy.name)}</span>
        </a>`;
}

function renderShelf(shelf) {
  const tiles = TOYS.filter((toy) => toy.shelf === shelf.id).map(renderTile).join("");
  return `
    <section class="shelf" style="--shelf: ${shelf.color}">
      <h2>${escapeHtml(shelf.name)}</h2>
      <div class="tiles">${tiles}
      </div>
    </section>`;
}

function hubPlugin() {
  return {
    name: "hub-tiles",
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html.includes(HUB_MARKER) ? html.replace(HUB_MARKER, SHELVES.map(renderShelf).join("")) : html,
    },
  };
}

// Stamps public/sw.js with a build timestamp so browsers detect a new
// service worker on every deploy and purge the old cache automatically.
function swCacheBustPlugin() {
  return {
    name: "sw-cache-bust",
    writeBundle(options) {
      const swPath = resolve(options.dir, "sw.js");
      if (existsSync(swPath)) {
        const content = readFileSync(swPath, "utf-8");
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
        writeFileSync(swPath, content.replaceAll("__BUILD_ID__", stamp));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), hubPlugin(), swCacheBustPlugin()],
  // ⚠️ Change this to match your GitHub repo name
  base: "/",
  build: {
    rollupOptions: {
      input: discoverPages(__dirname),
    },
  },
});
