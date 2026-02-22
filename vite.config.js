import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from "fs";

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
  return pages;
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
  plugins: [react(), swCacheBustPlugin()],
  // ⚠️ Change this to match your GitHub repo name
  base: "/",
  build: {
    rollupOptions: {
      input: discoverPages(__dirname),
    },
  },
});
