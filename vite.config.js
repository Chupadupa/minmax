import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { readdirSync, statSync, existsSync } from "fs";

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

export default defineConfig({
  plugins: [react()],
  // ⚠️ Change this to match your GitHub repo name
  base: "/",
  build: {
    rollupOptions: {
      input: discoverPages(__dirname),
    },
  },
});
