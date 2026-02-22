// Shared PWA initialization for all Doodads pages.
// Include via <script src="/pwa-init.js"></script> in each index.html.

// Fix iOS PWA viewport height: 100dvh is wrong on initial load in standalone mode
(function () {
  function setHeight() {
    document.documentElement.style.setProperty(
      "--app-height",
      window.innerHeight + "px"
    );
  }
  setHeight();
  window.addEventListener("resize", setHeight);
})();

// Register service worker and auto-reload when a new version takes over
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
  // When a new service worker takes over, reload to pick up fresh assets.
  // The guard on .controller skips the reload on first-ever visit (no
  // stale assets to worry about). The refreshing flag prevents loops.
  if (navigator.serviceWorker.controller) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}
