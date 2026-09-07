import type {
  FinoraControlCenterBridge,
} from "../electron/control-center/finoraControlCenterPreload";

/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   RENDERER GLOBAL BRIDGE DECLARATION

   RESPONSIBILITY:

   - Type the dedicated Control Center preload bridge
   - Keep the operational FINORA renderer bridge separate
   - Preserve a type-only dependency on the preload contract

   IMPORTANT:

   - This file adds no runtime import.
   - This file exposes no signing key material.
   - The bridge remains optional because normal browser/Vite
     rendering does not provide the Electron preload.
============================================================ */

declare global {
  interface Window {
    finoraControlCenter?:
      FinoraControlCenterBridge;
  }
}

export {};