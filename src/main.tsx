import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA service worker — only register on real production hosts.
// Skip inside iframes and on Lovable preview hosts to avoid stale caches.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname === "localhost";

if (isPreviewHost || isInIframe) {
  // Clean up any previously registered service workers in preview/iframe contexts
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        registerSW({ immediate: true });
      })
      .catch(() => {
        // virtual module unavailable in dev — safe to ignore
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
