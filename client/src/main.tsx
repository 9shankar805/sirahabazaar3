import { createRoot } from "react-dom/client";
import TestApp from "./TestApp";
import "./index.css";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  root.render(<TestApp />);
} catch (error: any) {
  console.error("Failed to mount React app:", error);
  const errorMessage = error?.message || String(error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Error mounting React app: ${errorMessage}</div>`;
}
