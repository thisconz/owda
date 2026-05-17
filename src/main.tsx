import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GlobalErrorBoundary } from "./components/ui/GlobalErrorBoundary.tsx";
import App from "./App.tsx";
import "./index.css";

/**
 * OWDA Entry Point
 * Initializing molecular engine interface...
 */
const container = document.getElementById("root");

if (!container) {
  // Fallback for critical DOM failure
  throw new Error(
    "CRITICAL_MOUNT_FAILURE: Target container 'root' not found in document. " +
      "Verify index.html integrity.",
  );
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <GlobalErrorBoundary version={process.env.APP_VERSION}>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
