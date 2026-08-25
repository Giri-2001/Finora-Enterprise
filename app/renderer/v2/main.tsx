import React from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";

import {
  ThemeProvider,
} from "./themes/provider";


/* ===========================================================
   FINORA ENTERPRISE V2 ROOT
   -----------------------------------------------------------
   RESPONSIBILITY:
   - Mount the renderer application.
   - Provide the global FINORA Theme Engine.
   - Keep ThemeProvider above the complete application tree.
   =========================================================== */

const rootElement =
  document.getElementById("root");


if (!rootElement) {

  throw new Error(
    "FINORA Enterprise: Root element #root was not found.",
  );

}


createRoot(
  rootElement,
).render(

  <React.StrictMode>

    <ThemeProvider>

      <App />

    </ThemeProvider>

  </React.StrictMode>,

);