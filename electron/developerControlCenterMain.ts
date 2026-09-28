// ============================================================
// FINORA ENTERPRISE OS™
//
// FINORA DEVELOPER CONTROL CENTER
// DEDICATED WINDOWS MAIN PROCESS ENTRY
//
// SECURITY / PRODUCT BOUNDARY:
//
// - This is NOT the Owner FINORA Enterprise startup path.
// - It never creates the Owner operational BrowserWindow.
// - It never registers the Owner operational IPC surface.
// - It never invokes ordinary installation/device binding.
// - It registers only the dedicated Control Center authority.
// - Developer Security Code/session enforcement remains inside
//   the privileged main-process Control Center authority.
// - Separate Electron product identity and userData are applied
//   before app readiness.
// ============================================================

import {
  app,
  BrowserWindow,
} from "electron";

import path from "node:path";

const FINORA_DEVELOPER_PRODUCT_NAME =
  "FINORA Developer Control Center";

const FINORA_DEVELOPER_USER_DATA_NAME =
  "FINORA Developer Control Center";

// ------------------------------------------------------------
// PRODUCT / STORAGE IDENTITY
//
// Explicit userData separation prevents Developer authority,
// Security Code state and signing authority from sharing the
// Owner FINORA Enterprise userData directory.
// ------------------------------------------------------------

app.setName(
  FINORA_DEVELOPER_PRODUCT_NAME,
);

app.setPath(
  "userData",
  path.join(
    app.getPath(
      "appData",
    ),
    FINORA_DEVELOPER_USER_DATA_NAME,
  ),
);

// ------------------------------------------------------------
// SINGLE INSTANCE
// ------------------------------------------------------------

const hasSingleInstanceLock =
  app.requestSingleInstanceLock();

async function openDeveloperControlCenter():
  Promise<void> {

  const {
    openFinoraControlCenterWindow,
  } =
    await import(
      "./control-center/finoraControlCenterWindow.js"
    );

  await openFinoraControlCenterWindow();
}

if (!hasSingleInstanceLock) {

  app.quit();

} else {

  app.on(
    "second-instance",
    () => {

      if (!app.isReady()) {
        return;
      }

      void openDeveloperControlCenter()
        .catch(
          (
            error:
              unknown,
          ) => {
            console.error(
              "FINORA Developer Control Center second-instance open failed:",
              error,
            );
          },
        );
    },
  );

  app.whenReady()
    .then(
      async () => {

        // ----------------------------------------------------
        // REGISTER PRIVILEGED CONTROL CENTER IPC FIRST
        //
        // The renderer must never appear before its dedicated
        // main-process authority boundary is installed.
        // ----------------------------------------------------

        const {
          registerFinoraControlCenterHandlers,
        } =
          await import(
            "./control-center/finoraControlCenterIpc.js"
          );

        registerFinoraControlCenterHandlers();

        await openDeveloperControlCenter();

        app.on(
          "activate",
          () => {

            if (
              BrowserWindow.getAllWindows().length !==
                0
            ) {
              return;
            }

            void openDeveloperControlCenter()
              .catch(
                (
                  error:
                    unknown,
                ) => {
                  console.error(
                    "FINORA Developer Control Center activate open failed:",
                    error,
                  );
                },
              );
          },
        );
      },
    )
    .catch(
      (
        error:
          unknown,
      ) => {

        console.error(
          "FINORA Developer Control Center startup failed:",
          error,
        );

        process.exitCode =
          1;

        app.quit();
      },
    );
}

// ------------------------------------------------------------
// WINDOWS / LINUX SHUTDOWN
// ------------------------------------------------------------

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !==
        "darwin"
    ) {
      app.quit();
    }
  },
);