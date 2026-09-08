/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST MAINTENANCE WINDOW

   MODULE  : Electron Control Plane
   LAYER   : Dedicated Privileged Window
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Own the dedicated Recipient Trust Maintenance BrowserWindow
   - Bind privileged recipient-trust IPC to this exact main frame
   - Load only the dedicated maintenance renderer entry
   - Keep recipient trust mutation authority isolated from:
     * ordinary FINORA application renderer
     * FINORA Control Center issuer renderer

   SECURITY:

   - contextIsolation enabled
   - nodeIntegration disabled
   - sandbox enabled
   - popup creation denied
   - renderer navigation denied
   - dedicated preload only
   - exact BrowserWindow main-frame identity required
   - no ordinary renderer bridge
   - no Control Center bridge
   - no trust-store access
   - no signed transition application
   - no private signing keys
   - no filesystem path supplied by renderer

   IMPORTANT:

   This module defines only the privileged window boundary.

   IPC registration, preload bridge, HTML entry, renderer UI and
   main-process launch wiring are separate Phase 14 boundaries.

   The window must not be opened in production until those
   companion boundaries are installed and verified.
=========================================================== */

import {
  app,
  BrowserWindow,
} from "electron";

import path from "node:path";

// ============================================================
// WINDOW STATE
// ============================================================

let recipientTrustMaintenanceWindow:
  BrowserWindow |
  null =
    null;

// ============================================================
// TRUSTED RENDERER PREDICATE
// ============================================================

export function isTrustedFinoraRecipientTrustMaintenanceRenderer(
  senderFrame:
    Electron.WebFrameMain |
    null,
): boolean {
  if (
    !senderFrame ||
    !recipientTrustMaintenanceWindow ||
    recipientTrustMaintenanceWindow.isDestroyed()
  ) {
    return false;
  }

  return (
    senderFrame ===
      recipientTrustMaintenanceWindow.webContents.mainFrame
  );
}

// ============================================================
// OPEN WINDOW
// ============================================================

export async function openFinoraRecipientTrustMaintenanceWindow():
  Promise<void> {
  if (
    recipientTrustMaintenanceWindow &&
    !recipientTrustMaintenanceWindow.isDestroyed()
  ) {
    if (
      recipientTrustMaintenanceWindow.isMinimized()
    ) {
      recipientTrustMaintenanceWindow.restore();
    }

    recipientTrustMaintenanceWindow.show();
    recipientTrustMaintenanceWindow.focus();

    return;
  }

  const createdWindow =
    new BrowserWindow({
      width:
        760,

      height:
        560,

      minWidth:
        680,

      minHeight:
        500,

      show:
        false,

      title:
        "FINORA Recipient Trust Maintenance",

      backgroundColor:
        "#0f172a",

      autoHideMenuBar:
        true,

      webPreferences: {
        preload:
          path.join(
            __dirname,
            "finoraRecipientTrustMaintenancePreload.js",
          ),

        contextIsolation:
          true,

        nodeIntegration:
          false,

        sandbox:
          true,

        devTools:
          !app.isPackaged,
      },
    });

  recipientTrustMaintenanceWindow =
    createdWindow;

  // ----------------------------------------------------------
  // NO CHILD WINDOWS / POPUPS
  // ----------------------------------------------------------

  createdWindow.webContents.setWindowOpenHandler(
    () => ({
      action:
        "deny",
    }),
  );

  // ----------------------------------------------------------
  // NO RENDERER-INITIATED NAVIGATION
  // ----------------------------------------------------------

  createdWindow.webContents.on(
    "will-navigate",
    (
      event,
    ) => {
      event.preventDefault();
    },
  );

  // ----------------------------------------------------------
  // WINDOW LIFECYCLE
  // ----------------------------------------------------------

  createdWindow.on(
    "closed",
    () => {
      if (
        recipientTrustMaintenanceWindow ===
          createdWindow
      ) {
        recipientTrustMaintenanceWindow =
          null;
      }
    },
  );

  // ----------------------------------------------------------
  // DEVELOPMENT ENTRY
  // ----------------------------------------------------------

  if (!app.isPackaged) {
    await createdWindow.loadURL(
      "http://localhost:5173/recipient-trust-maintenance.html",
    );
  }

  // ----------------------------------------------------------
  // PACKAGED ENTRY
  // ----------------------------------------------------------

  else {
    await createdWindow.loadFile(
      path.join(
        __dirname,
        "../../dist/recipient-trust-maintenance.html",
      ),
    );
  }

  if (
    createdWindow.isDestroyed()
  ) {
    return;
  }

  createdWindow.show();
  createdWindow.focus();
}

// ============================================================
// END
// ============================================================