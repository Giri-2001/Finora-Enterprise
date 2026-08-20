import React from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";

import {
  ThemeProvider,
} from "./themes/provider";


/* ===========================================================
   FINORA ENTERPRISE V2 ROOT
=========================================================== */

createRoot(
  document.getElementById("root")!,
).render(

  <React.StrictMode>

    <ThemeProvider>

      <App />

    </ThemeProvider>

  </React.StrictMode>,

);