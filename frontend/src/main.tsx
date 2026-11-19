import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./styles.css";
import "./academy.css";

/**
 * Mounts the React application in strict mode to expose unsafe lifecycle patterns.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
