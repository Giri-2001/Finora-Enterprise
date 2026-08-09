// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 RENDERER ENTRY
//
// RESPONSIBILITY:
//
// - Initialize FINORA V2 storage before React UI starts
// - Mount the V2 application
// - Keep application startup deterministic
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import React from "react";

import ReactDOM from "react-dom/client";

import App from "./v2/app/App";

import "./index.css";

import { NotificationProvider } from "./context/NotificationContext";

import {
  initializeV2Storage,
} from "./v2/storage/storageBootstrap";


// ============================================================
// APPLICATION STARTUP
// ============================================================

async function startApplication(): Promise<void> {

  // ----------------------------------------------------------
  // STORAGE INITIALIZATION
  // ----------------------------------------------------------

  await initializeV2Storage();


  // ----------------------------------------------------------
  // REACT MOUNT
  // ----------------------------------------------------------

  ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement,
  ).render(

    <React.StrictMode>

      <NotificationProvider>

        <App />

      </NotificationProvider>

    </React.StrictMode>,

  );
}


// ============================================================
// START APPLICATION
// ============================================================

void startApplication();
