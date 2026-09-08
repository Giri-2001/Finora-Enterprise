// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY PRODUCTION SURFACE E2E
//
// MODULE  : Recipient Trust Emergency Recovery
// LAYER   : Production Privileged-Surface Isolation E2E
// VERSION : 1.0
//
// VERIFY:
//
// - Production Recovery BrowserWindow is hardened.
// - Recovery bridge exists only in Recovery renderer.
// - Maintenance renderer does not receive Recovery bridge.
// - Ordinary preload does not expose Recovery bridge.
// - Control Center preload does not expose Recovery bridge.
// - Recovery authority predicate accepts only its own mainFrame.
// - Other BrowserWindow mainFrames are rejected.
// - Production Recovery renderer invokes the real dedicated
//   preload -> IPC -> coordinator chain.
// - Exact owning mainFrame IPC authorization succeeds.
// - Native picker cancellation returns without recipient
//   persistence mutation.
// - Recovery startup branch precedes Maintenance startup branch.
// - macOS activate Recovery branch precedes Maintenance branch.
// - Offline Recovery private-authority production modules are not
//   imported outside electron/recovery.
//
// IMPORTANT:
//
// Native dialog is intercepted only at Electron's showOpenDialog
// boundary and forced to return cancellation. Existing dedicated
// native-import E2E separately proves the real picker/file path.
// ============================================================

import {
  app,
  BrowserWindow,
  dialog,
} from "electron";

import {
  existsSync,
} from "node:fs";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  registerFinoraRecipientTrustRecoveryHandlers,
} from "./finoraRecipientTrustRecoveryIpc.js";

import {
  isTrustedFinoraRecipientTrustRecoveryRenderer,
  openFinoraRecipientTrustRecoveryWindow,
} from "./finoraRecipientTrustRecoveryWindow.js";

import {
  isTrustedFinoraRecipientTrustMaintenanceRenderer,
  openFinoraRecipientTrustMaintenanceWindow,
} from "./finoraRecipientTrustMaintenanceWindow.js";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition:
    unknown,

  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      message,
    );
  }
}

// ============================================================
// SOURCE HELPERS
// ============================================================

async function readSource(
  relativePath:
    string,
): Promise<
  string
> {
  return readFile(
    join(
      process.cwd(),
      relativePath,
    ),
    "utf8",
  );
}

async function collectTypeScriptFiles(
  root:
    string,
): Promise<
  string[]
> {
  const entries =
    await readdir(
      root,
      {
        withFileTypes:
          true,
      },
    );

  const files:
    string[] =
    [];

  for (
    const entry of entries
  ) {
    const absolutePath =
      join(
        root,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      if (
        entry.name ===
          "dist" ||
        entry.name ===
          "dist-electron" ||
        entry.name ===
          "node_modules" ||
        entry.name ===
          "release"
      ) {
        continue;
      }

      files.push(
        ...(
          await collectTypeScriptFiles(
            absolutePath,
          )
        ),
      );

      continue;
    }

    if (
      entry.isFile() &&
      (
        entry.name.endsWith(
          ".ts",
        ) ||
        entry.name.endsWith(
          ".tsx",
        )
      )
    ) {
      files.push(
        absolutePath,
      );
    }
  }

  return files;
}

// ============================================================
// SELFTEST
// ============================================================

async function runE2E():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recovery-production-e2e-",
      ),
    );

  let recoveryWindow:
    BrowserWindow |
    undefined;

  let maintenanceWindow:
    BrowserWindow |
    undefined;

  let unrelatedWindow:
    BrowserWindow |
    undefined;

  const runtimeDialog =
    dialog as
      typeof dialog;

  const originalDialogDescriptor =
    Object.getOwnPropertyDescriptor(
      runtimeDialog,
      "showOpenDialog",
    );

  assert(
    originalDialogDescriptor !==
      undefined,
    "Electron dialog.showOpenDialog descriptor is unavailable.",
  );

  const originalShowOpenDialog =
    runtimeDialog.showOpenDialog.bind(
      runtimeDialog,
    );

  try {
    // --------------------------------------------------------
    // ISOLATED ELECTRON
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated production Recovery E2E Electron runtime ready",
    );

    // --------------------------------------------------------
    // PRODUCTION IPC REGISTRATION
    // --------------------------------------------------------

    registerFinoraRecipientTrustRecoveryHandlers();

    console.log(
      "PASS: production Recipient Trust Recovery IPC handlers registered",
    );

    // --------------------------------------------------------
    // OPEN REAL PRODUCTION RECOVERY WINDOW
    // --------------------------------------------------------

    await openFinoraRecipientTrustRecoveryWindow();

    recoveryWindow =
      BrowserWindow
        .getAllWindows()
        .find(
          (candidate) =>
            isTrustedFinoraRecipientTrustRecoveryRenderer(
              candidate.webContents.mainFrame,
            ),
        );

    assert(
      recoveryWindow !==
        undefined &&
      !recoveryWindow.isDestroyed(),
      "Production Recipient Trust Recovery window was not resolved through its own trust predicate.",
    );

    console.log(
      "PASS: production Recovery BrowserWindow resolved by exact authority predicate",
    );

    // --------------------------------------------------------
    // RECOVERY WINDOW HARDENING
    // --------------------------------------------------------

    const recoveryPreferences =
      (
        recoveryWindow.webContents as unknown as {
          getLastWebPreferences:
            () => {
              contextIsolation?:
                boolean;

              nodeIntegration?:
                boolean;

              sandbox?:
                boolean;
            };
        }
      ).getLastWebPreferences();

    assert(
      recoveryPreferences.contextIsolation ===
        true &&
      recoveryPreferences.nodeIntegration ===
        false &&
      recoveryPreferences.sandbox ===
        true,
      "Production Recovery BrowserWindow security preferences are not hardened.",
    );

    console.log(
      "PASS: production Recovery BrowserWindow uses contextIsolation + no nodeIntegration + sandbox",
    );

    // --------------------------------------------------------
    // EXACT RECOVERY MAINFRAME AUTHORITY
    // --------------------------------------------------------

    assert(
      isTrustedFinoraRecipientTrustRecoveryRenderer(
        recoveryWindow.webContents.mainFrame,
      ),
      "Recovery authority predicate rejected its own BrowserWindow mainFrame.",
    );

    assert(
      !isTrustedFinoraRecipientTrustRecoveryRenderer(
        null,
      ),
      "Recovery authority predicate unexpectedly accepted null frame.",
    );

    unrelatedWindow =
      new BrowserWindow({
        show:
          false,

        webPreferences: {
          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true,
        },
      });

    await unrelatedWindow.loadURL(
      "data:text/html;charset=utf-8," +
      encodeURIComponent(
        "<html><body>Unrelated FINORA renderer</body></html>",
      ),
    );

    assert(
      !isTrustedFinoraRecipientTrustRecoveryRenderer(
        unrelatedWindow.webContents.mainFrame,
      ),
      "Recovery authority predicate accepted an unrelated BrowserWindow mainFrame.",
    );

    console.log(
      "PASS: Recovery authority predicate accepts only its exact owning mainFrame",
    );

    // --------------------------------------------------------
    // RECOVERY PRELOAD GLOBAL
    // --------------------------------------------------------

    const recoveryGlobals =
      (
        await recoveryWindow.webContents.executeJavaScript(
          `({
            recovery: typeof window.finoraRecipientTrustRecovery,
            maintenance: typeof window.finoraRecipientTrustMaintenance
          })`,
        )
      ) as {
        recovery:
          string;

        maintenance:
          string;
      };

    assert(
      recoveryGlobals.recovery ===
        "object",
      "Production Recovery preload did not expose finoraRecipientTrustRecovery.",
    );

    assert(
      recoveryGlobals.maintenance ===
        "undefined",
      "Production Recovery renderer unexpectedly received the Maintenance bridge.",
    );

    console.log(
      "PASS: production Recovery renderer exposes only the Recovery privileged bridge",
    );

    // --------------------------------------------------------
    // OPEN REAL PRODUCTION MAINTENANCE WINDOW
    // --------------------------------------------------------

    await openFinoraRecipientTrustMaintenanceWindow();

    maintenanceWindow =
      BrowserWindow
        .getAllWindows()
        .find(
          (candidate) =>
            isTrustedFinoraRecipientTrustMaintenanceRenderer(
              candidate.webContents.mainFrame,
            ),
        );

    assert(
      maintenanceWindow !==
        undefined &&
      !maintenanceWindow.isDestroyed(),
      "Production Recipient Trust Maintenance window was not resolved.",
    );

    assert(
      !isTrustedFinoraRecipientTrustRecoveryRenderer(
        maintenanceWindow.webContents.mainFrame,
      ),
      "Recipient Trust Maintenance mainFrame was accepted as Recovery authority.",
    );

    const maintenanceGlobals =
      (
        await maintenanceWindow.webContents.executeJavaScript(
          `({
            recovery: typeof window.finoraRecipientTrustRecovery,
            maintenance: typeof window.finoraRecipientTrustMaintenance
          })`,
        )
      ) as {
        recovery:
          string;

        maintenance:
          string;
      };

    assert(
      maintenanceGlobals.recovery ===
        "undefined" &&
      maintenanceGlobals.maintenance ===
        "object",
      "Maintenance renderer bridge isolation is incorrect.",
    );

    console.log(
      "PASS: Maintenance renderer has Maintenance bridge and zero Recovery bridge",
    );

    // --------------------------------------------------------
    // ORDINARY / CONTROL CENTER PRELOAD SOURCE ISOLATION
    // --------------------------------------------------------

    const ordinaryPreload =
      await readSource(
        "electron/preload.ts",
      );

    const controlCenterPreload =
      await readSource(
        "electron/control-center/finoraControlCenterPreload.ts",
      );

    const maintenancePreload =
      await readSource(
        "electron/control/finoraRecipientTrustMaintenancePreload.ts",
      );

    const recoveryPreload =
      await readSource(
        "electron/control/finoraRecipientTrustRecoveryPreload.ts",
      );

    const recoveryBridgePattern =
      /finoraRecipientTrustRecovery|importSignedRecovery/g;

    assert(
      (
        ordinaryPreload.match(
          recoveryBridgePattern,
        ) ??
        []
      ).length ===
        0,
      "Ordinary application preload exposes Recipient Trust Recovery authority.",
    );

    assert(
      (
        controlCenterPreload.match(
          recoveryBridgePattern,
        ) ??
        []
      ).length ===
        0,
      "Control Center preload exposes Recipient Trust Recovery authority.",
    );

    assert(
      (
        maintenancePreload.match(
          recoveryBridgePattern,
        ) ??
        []
      ).length ===
        0,
      "Maintenance preload exposes Recipient Trust Recovery authority.",
    );

    assert(
      (
        recoveryPreload.match(
          recoveryBridgePattern,
        ) ??
        []
      ).length >
        0,
      "Dedicated Recovery preload does not contain its own Recovery bridge.",
    );

    console.log(
      "PASS: ordinary app + Control Center + Maintenance preloads contain zero Recovery bridge authority",
    );

    // --------------------------------------------------------
    // NATIVE PICKER CANCEL SEAM
    //
    // The actual production renderer bridge is invoked below.
    // The only intercepted boundary is Electron showOpenDialog.
    // --------------------------------------------------------

    let dialogCalls =
      0;

    let dialogOwnerMatched =
      false;

    let finoraFilterPresent =
      false;

    Object.defineProperty(
      runtimeDialog,
      "showOpenDialog",
      {
        configurable:
          true,

        enumerable:
          originalDialogDescriptor.enumerable,

        writable:
          true,

        value:
          async (
            ownerWindow:
              BrowserWindow,

            options:
              Electron.OpenDialogOptions,
          ): Promise<
            Electron.OpenDialogReturnValue
          > => {
            dialogCalls +=
              1;

            dialogOwnerMatched =
              ownerWindow ===
                recoveryWindow;

            finoraFilterPresent =
              (
                options.filters ??
                []
              ).some(
                (filter) =>
                  filter.extensions.includes(
                    "finora",
                  ),
              );

            return {
              canceled:
                true,

              filePaths:
                [],
            };
          },
      },
    );

    // --------------------------------------------------------
    // REAL RENDERER -> PRELOAD -> IPC -> COORDINATOR
    // --------------------------------------------------------

    const importResult =
      (
        await recoveryWindow.webContents.executeJavaScript(
          `window.finoraRecipientTrustRecovery.importSignedRecovery()`,
        )
      ) as {
        success:
          boolean;

        cancelled?:
          boolean;

        error?:
          string;
      };

    assert(
      importResult.success &&
      importResult.cancelled ===
        true,
      "Production Recovery renderer/preload/IPC/coordinator cancellation chain failed.",
    );

    assert(
      dialogCalls ===
        1 &&
      dialogOwnerMatched &&
      finoraFilterPresent,
      "Production Recovery bridge did not reach the expected native .finora picker boundary.",
    );

    console.log(
      "PASS: production Recovery renderer -> preload -> exact-mainFrame IPC -> coordinator -> native picker chain reached",
    );

    console.log(
      "PASS: owning Recovery BrowserWindow was the exact native picker parent",
    );

    // --------------------------------------------------------
    // CANCEL MUST MUTATE NO RECIPIENT AUTHORITY STATE
    // --------------------------------------------------------

    const finoraStatePath =
      join(
        temporaryUserData,
        "finora",
      );

    assert(
      !existsSync(
        finoraStatePath,
      ),
      "Cancelled production Recovery import unexpectedly created FINORA recipient authority persistence.",
    );

    console.log(
      "PASS: native picker cancellation produced zero recipient trust/root/clock persistence mutation",
    );

    // --------------------------------------------------------
    // STARTUP PRIORITY SOURCE PROOF
    //
    // Recovery must win when both Recovery and Maintenance
    // selectors are present.
    // --------------------------------------------------------

    const mainSource =
      await readSource(
        "electron/main.ts",
      );

    assert(
      mainSource.includes(
        "--finora-recipient-trust-recovery",
      ) &&
      mainSource.includes(
        "--finora-recipient-trust-maintenance",
      ),
      "Recipient Trust startup selectors are missing from electron/main.ts.",
    );

    const recoveryStartupMatch =
      /\bif\s*\(\s*openRecipientTrustRecovery\s*\)/m.exec(
        mainSource,
      );

    const maintenanceStartupMatch =
      /\bif\s*\(\s*openRecipientTrustMaintenance\s*\)/m.exec(
        mainSource,
      );

    assert(
      recoveryStartupMatch !==
        null &&
      maintenanceStartupMatch !==
        null &&
      recoveryStartupMatch.index <
        maintenanceStartupMatch.index,
      "Recovery startup selector does not precede Maintenance startup selector.",
    );

    const startupRecoveryOpenIndex =
      mainSource.indexOf(
        "await openFinoraRecipientTrustRecoveryWindow();",
      );

    const startupMaintenanceOpenIndex =
      mainSource.indexOf(
        "await openFinoraRecipientTrustMaintenanceWindow();",
      );

    assert(
      startupRecoveryOpenIndex >=
        0 &&
      startupMaintenanceOpenIndex >
        startupRecoveryOpenIndex,
      "Recovery startup opening path does not precede Maintenance startup opening path.",
    );

    const activateRecoveryIndex =
      mainSource.lastIndexOf(
        "openFinoraRecipientTrustRecoveryWindow();",
      );

    const activateMaintenanceIndex =
      mainSource.lastIndexOf(
        "openFinoraRecipientTrustMaintenanceWindow();",
      );

    assert(
      activateRecoveryIndex >=
        0 &&
      activateMaintenanceIndex >
        activateRecoveryIndex,
      "macOS activate Recovery branch does not precede Maintenance branch.",
    );

    console.log(
      "PASS: Recovery startup and activate priority precede Recipient Trust Maintenance",
    );

    // --------------------------------------------------------
    // OFFLINE PRIVATE-AUTHORITY CROSS-BOUNDARY ISOLATION
    // --------------------------------------------------------

    const electronRoot =
      join(
        process.cwd(),
        "electron",
      );

    const sourceFiles =
      await collectTypeScriptFiles(
        electronRoot,
      );

    const forbiddenPrivateAuthorityPattern =
      /finoraRecipientTrustRecoveryAuthorityVault|finoraRecipientTrustRecoveryGenerator|finoraRecipientTrustRecoveryIssuer|finoraRecipientTrustRecoverySequenceLedger/;

    const violations:
      string[] =
      [];

    for (
      const sourceFile of sourceFiles
    ) {
      const normalized =
        sourceFile.replace(
          /\\/g,
          "/",
        );

      if (
        normalized.includes(
          "/electron/recovery/",
        ) ||
        /SelfTest|E2E/.test(
          sourceFile,
        )
      ) {
        continue;
      }

      const source =
        await readFile(
          sourceFile,
          "utf8",
        );

      if (
        forbiddenPrivateAuthorityPattern.test(
          source,
        )
      ) {
        violations.push(
          sourceFile,
        );
      }
    }

    assert(
      violations.length ===
        0,
      `Offline Recovery private authority crossed production boundary: ${JSON.stringify(violations)}`,
    );

    console.log(
      "PASS: offline Recovery private authority has zero production imports outside electron/recovery",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST RECOVERY PRODUCTION SURFACE E2E",
    );

    console.log(
      "============================================================",
    );
  } finally {
    Object.defineProperty(
      runtimeDialog,
      "showOpenDialog",
      {
        ...originalDialogDescriptor,

        value:
          originalShowOpenDialog,
      },
    );

    if (
      unrelatedWindow &&
      !unrelatedWindow.isDestroyed()
    ) {
      unrelatedWindow.destroy();
    }

    if (
      maintenanceWindow &&
      !maintenanceWindow.isDestroyed()
    ) {
      maintenanceWindow.destroy();
    }

    if (
      recoveryWindow &&
      !recoveryWindow.isDestroyed()
    ) {
      recoveryWindow.destroy();
    }

    await rm(
      temporaryUserData,
      {
        recursive:
          true,

        force:
          true,

        maxRetries:
          20,

        retryDelay:
          100,
      },
    );

    console.log(
      "PASS: isolated production Recovery E2E userData deleted",
    );
  }
}

// ============================================================
// RUN
// ============================================================

void runE2E()
  .then(
    () => {
      app.exit(
        0,
      );
    },
  )
  .catch(
    (error) => {
      console.error(
        "FAIL: FINORA RECIPIENT TRUST RECOVERY PRODUCTION SURFACE E2E",
        error,
      );

      app.exit(
        1,
      );
    },
  );