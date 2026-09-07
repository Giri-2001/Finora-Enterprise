import React from "react";
import {
  createRoot,
} from "react-dom/client";

import FinoraControlCenterShell
  from "./FinoraControlCenterShell";

/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   DEDICATED RENDERER ENTRY

   RESPONSIBILITY:

   - Mount only the privileged Control Center renderer
   - Remain separate from the operational FINORA App tree
   - Remain isolated from the operational application shell
   - Provide the foundation for the Control Center UI shell

   IMPORTANT:

   - IPC authority remains in the dedicated preload.
   - Signing keys remain inside Electron main process.
   - This renderer does not own packageId / sequence / issuedAt.
=========================================================== */

const rootElement =
  document.getElementById(
    "root",
  );

if (!rootElement) {
  throw new Error(
    "FINORA Control Center: Root element #root was not found.",
  );
}

rootElement.setAttribute(
  "spellcheck",
  "false",
);

createRoot(
  rootElement,
).render(
  <React.StrictMode>
    <FinoraControlCenterShell />
  </React.StrictMode>,
);