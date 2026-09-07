// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED WINDOW AUTHORITY
//
// RESPONSIBILITY:
//
// - Own the dedicated privileged Control Center BrowserWindow
// - Keep Control Center renderer trust separate from the
//   operational FINORA Enterprise renderer
// - Trust only this window's exact main WebFrame
// - Deny popup windows and unexpected navigation
// - Preserve Chromium isolation / sandboxing
//
// IMPORTANT:
//
// - This module does NOT register privileged IPC handlers.
// - This module does NOT expose signing keys.
// - This module is not yet wired into Electron startup.
// ============================================================

import {
  app,
  BrowserWindow,
  type WebFrameMain,
} from "electron";

import path from "node:path";

import {
  pathToFileURL,
} from "node:url";

// ============================================================
// WINDOW STATE
// ============================================================

let controlCenterWindow:
  BrowserWindow | null =
    null;

// ============================================================
// EXPECTED RENDERER URL
// ============================================================

function getExpectedControlCenterUrl():
  string {

  if (!app.isPackaged) {
    return "http://localhost:5173/control-center.html";
  }

  return pathToFileURL(
    path.join(
      __dirname,
      "../dist/control-center.html",
    ),
  ).href;
}

function isAllowedControlCenterUrl(
  candidate:
    string,
): boolean {

  try {

    const candidateUrl =
      new URL(
        candidate,
      );

    const expectedUrl =
      new URL(
        getExpectedControlCenterUrl(),
      );

    candidateUrl.hash =
      "";

    candidateUrl.search =
      "";

    expectedUrl.hash =
      "";

    expectedUrl.search =
      "";

    return (
      candidateUrl.href ===
        expectedUrl.href
    );

  } catch {
    return false;
  }
}

// ============================================================
// PRIVILEGED RENDERER TRUST
// ============================================================

export function isTrustedFinoraControlCenterRenderer(
  senderFrame:
    WebFrameMain | null,
): boolean {

  if (
    !senderFrame ||
    !controlCenterWindow ||
    controlCenterWindow.isDestroyed()
  ) {
    return false;
  }

  /*
   * Privileged Control Center trust is NOT URL-only.
   *
   * The exact main frame belonging to the dedicated
   * BrowserWindow must be the IPC sender.
   *
   * Child frames, the operational FINORA renderer and any
   * unrelated file:// or localhost frame remain untrusted.
   */
  return (
    senderFrame ===
      controlCenterWindow.webContents.mainFrame
  );
}

// ============================================================
// STATE VIEW
// ============================================================

export function isFinoraControlCenterWindowOpen():
  boolean {

  return (
    controlCenterWindow !==
      null &&
    !controlCenterWindow.isDestroyed()
  );
}

// ============================================================
// CREATE / FOCUS
// ============================================================

export async function openFinoraControlCenterWindow():
  Promise<void> {

  if (
    controlCenterWindow &&
    !controlCenterWindow.isDestroyed()
  ) {

    if (
      controlCenterWindow.isMinimized()
    ) {
      controlCenterWindow.restore();
    }

    controlCenterWindow.show();
    controlCenterWindow.focus();

    return;
  }

  const createdWindow =
    new BrowserWindow({

      width:
        1280,

      height:
        820,

      minWidth:
        1100,

      minHeight:
        680,

      title:
        "FINORA Control Center",

      backgroundColor:
        "#0f172a",

      autoHideMenuBar:
        true,

      show:
        false,

      webPreferences: {

        preload:
          path.join(
            __dirname,
            "finoraControlCenterPreload.js",
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

  controlCenterWindow =
    createdWindow;

  // ----------------------------------------------------------
  // POPUPS
  // ----------------------------------------------------------

  createdWindow.webContents.setWindowOpenHandler(
    () => ({
      action:
        "deny",
    }),
  );

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  createdWindow.webContents.on(
    "will-navigate",
    (
      event,
      navigationUrl,
    ) => {

      if (
        !isAllowedControlCenterUrl(
          navigationUrl,
        )
      ) {
        event.preventDefault();
      }
    },
  );

  // ----------------------------------------------------------
  // DISPLAY
  // ----------------------------------------------------------

  createdWindow.once(
    "ready-to-show",
    () => {

      if (
        !createdWindow.isDestroyed()
      ) {
        createdWindow.show();
      }
    },
  );

  // ----------------------------------------------------------
  // LOAD DEDICATED RENDERER
  // ----------------------------------------------------------

  if (!app.isPackaged) {

    await createdWindow.loadURL(
      getExpectedControlCenterUrl(),
    );

  } else {

    await createdWindow.loadFile(
      path.join(
        __dirname,
        "../dist/control-center.html",
      ),
    );
  }

  // ----------------------------------------------------------
  // CLOSED
  // ----------------------------------------------------------

  createdWindow.on(
    "closed",
    () => {

      if (
        controlCenterWindow ===
          createdWindow
      ) {
        controlCenterWindow =
          null;
      }
    },
  );
}

// ============================================================
// END
// ============================================================