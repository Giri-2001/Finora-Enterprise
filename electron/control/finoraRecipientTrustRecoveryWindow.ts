/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY WINDOW

   MODULE  : Electron Control Plane
   LAYER   : Dedicated Break-Glass Privileged Window
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Own the dedicated Recipient Trust Recovery BrowserWindow
   - Bind break-glass Recovery IPC to this exact main frame
   - Load only the dedicated Recovery renderer entry
   - Keep emergency recipient-trust recovery isolated from:
     * ordinary FINORA application renderer
     * FINORA Control Center issuer renderer
     * ordinary Recipient Trust Maintenance renderer

   SECURITY:

   - contextIsolation enabled
   - nodeIntegration disabled
   - sandbox enabled
   - popup creation denied
   - renderer navigation denied
   - dedicated Recovery preload only
   - exact BrowserWindow main-frame identity required
   - no ordinary renderer bridge
   - no Control Center bridge
   - no Maintenance bridge reuse
   - no recipient trust-store access
   - no recovery-root store access
   - no signed Recovery application
   - no private recovery signing key
   - no filesystem path supplied by renderer

   IMPORTANT:

   This module defines only the privileged Recovery window
   boundary.

   IPC registration, preload bridge, HTML entry, renderer UI and
   main-process launch wiring are separate Phase 14 boundaries.

   A command-line launch selector is not authentication.
   Recovery authority remains the signed independently rooted
   RECIPIENT_TRUST_RECOVERY package plus exact native target,
   authoritative clock, replay and current-ACTIVE validation.
=========================================================== */

import {
  app,
  BrowserWindow,
} from "electron";

import path from "node:path";

// ============================================================
// WINDOW STATE
// ============================================================

let recipientTrustRecoveryWindow:
  BrowserWindow |
  null =
    null;

// ============================================================
// TRUSTED RECOVERY RENDERER PREDICATE
// ============================================================

export function isTrustedFinoraRecipientTrustRecoveryRenderer(
  senderFrame:
    Electron.WebFrameMain |
    null,
): boolean {
  if (
    !senderFrame ||
    !recipientTrustRecoveryWindow ||
    recipientTrustRecoveryWindow.isDestroyed()
  ) {
    return false;
  }

  return (
    senderFrame ===
      recipientTrustRecoveryWindow.webContents.mainFrame
  );
}

// ============================================================
// OPEN RECOVERY WINDOW
// ============================================================

export async function openFinoraRecipientTrustRecoveryWindow():
  Promise<void> {
  if (
    recipientTrustRecoveryWindow &&
    !recipientTrustRecoveryWindow.isDestroyed()
  ) {
    if (
      recipientTrustRecoveryWindow.isMinimized()
    ) {
      recipientTrustRecoveryWindow.restore();
    }

    recipientTrustRecoveryWindow.show();
    recipientTrustRecoveryWindow.focus();

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
        "FINORA Recipient Trust Emergency Recovery",

      backgroundColor:
        "#0f172a",

      autoHideMenuBar:
        true,

      webPreferences: {
        preload:
          path.join(
            __dirname,
            "finoraRecipientTrustRecoveryPreload.js",
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

  recipientTrustRecoveryWindow =
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
        recipientTrustRecoveryWindow ===
          createdWindow
      ) {
        recipientTrustRecoveryWindow =
          null;
      }
    },
  );

  // ----------------------------------------------------------
  // DEVELOPMENT ENTRY
  // ----------------------------------------------------------

  if (!app.isPackaged) {
    await createdWindow.loadURL(
      "http://localhost:5173/recipient-trust-recovery.html",
    );
  }

  // ----------------------------------------------------------
  // PACKAGED ENTRY
  // ----------------------------------------------------------

  else {
    await createdWindow.loadFile(
      path.join(
        __dirname,
        "../../dist/recipient-trust-recovery.html",
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