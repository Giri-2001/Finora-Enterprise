/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER ADMIN AUTHORITY RECOVERY E2E SELF-TEST

   REAL PRODUCTION PATH:

   dedicated Control Center BrowserWindow
     -> production Control Center preload
     -> contextBridge
     -> exact main-frame IPC authorization
     -> privileged Admin Recovery coordinator
     -> encrypted native file transport
     -> authoritative fresh-machine restore

   PROOFS:

   1. Production preload exposes exactly the intended recovery
      bridge while Node require remains unavailable.

   2. Exact module-owned Control Center mainFrame is trusted.

   3. An unrelated BrowserWindow using the SAME privileged
      preload is still rejected by IPC.

   4. Export travels through renderer -> preload -> IPC ->
      coordinator -> native Save transport.

   5. Wrong Admin Security Code fails closed on fresh machine.

   6. Correct code restores the exact original issuer/current
      signing key/retained signing-key history.

   7. Recovery IPC results expose neither Security Code nor
      plaintext private signing material.
============================================================ */

import {
  app,
  BrowserWindow,
  dialog,
} from "electron";

import {
  createServer,
  type Server,
} from "node:http";

import {
  mkdtemp,
  readFile,
  rm,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  registerFinoraControlCenterHandlers,
} from "./finoraControlCenterIpc.js";

import {
  isFinoraControlCenterWindowOpen,
  isTrustedFinoraControlCenterRenderer,
  openFinoraControlCenterWindow,
} from "./finoraControlCenterWindow.js";

import {
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition:
    unknown,

  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

// ============================================================
// LOCAL RENDERER SERVER
// ============================================================

function createControlCenterTestServer():
  Server {
  return createServer(
    (
      request,
      response,
    ) => {
      if (
        request.url ===
          "/control-center.html" ||
        request.url ===
          "/"
      ) {
        response.writeHead(
          200,
          {
            "Content-Type":
              "text/html; charset=utf-8",

            "Cache-Control":
              "no-store",
          },
        );

        response.end(
          [
            "<!doctype html>",
            "<html>",
            "<head>",
            "<meta charset='utf-8'>",
            "<title>FINORA Control Center E2E</title>",
            "</head>",
            "<body>",
            "<main>FINORA Control Center Admin Recovery E2E</main>",
            "</body>",
            "</html>",
          ].join(
            "",
          ),
        );

        return;
      }

      response.writeHead(
        404,
        {
          "Content-Type":
            "text/plain; charset=utf-8",
        },
      );

      response.end(
        "Not Found",
      );
    },
  );
}

async function listenOnControlCenterPort(
  server:
    Server,
): Promise<void> {
  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      const handleError =
        (
          error:
            Error,
        ) => {
          reject(
            new Error(
              `FINORA Control Center E2E could not bind localhost port 5173. Close any running Vite/dev server before this self-test. ${error.message}`,
            ),
          );
        };

      server.once(
        "error",
        handleError,
      );

      server.listen(
        5173,
        "127.0.0.1",
        () => {
          server.off(
            "error",
            handleError,
          );

          resolve();
        },
      );
    },
  );
}

async function closeServer(
  server:
    Server,
): Promise<void> {
  if (
    !server.listening
  ) {
    return;
  }

  await new Promise<void>(
    (
      resolve,
    ) => {
      server.close(
        () =>
          resolve(),
      );
    },
  );
}

// ============================================================
// WINDOW HELPERS
// ============================================================

function findTrustedControlCenterWindow():
  BrowserWindow | undefined {
  return BrowserWindow
    .getAllWindows()
    .find(
      (
        candidate,
      ) =>
        !candidate.isDestroyed() &&
        isTrustedFinoraControlCenterRenderer(
          candidate.webContents.mainFrame,
        ),
    );
}

async function destroyWindow(
  candidate:
    BrowserWindow | undefined,
): Promise<void> {
  if (
    candidate &&
    !candidate.isDestroyed()
  ) {
    candidate.destroy();
  }

  await new Promise<void>(
    (
      resolve,
    ) => {
      setImmediate(
        resolve,
      );
    },
  );
}

// ============================================================
// MAIN
// ============================================================

async function run():
  Promise<void> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-admin-authority-e2e-",
      ),
    );

  const sourceRoot =
    join(
      root,
      "source-machine",
    );

  const restoreRoot =
    join(
      root,
      "restore-machine",
    );

  const exportPath =
    join(
      root,
      "FINORA-Control-Center-Admin-Authority-Recovery.finora-admin-recovery",
    );

  const securityCode =
    "FINORA-E2E-Admin-Recovery-01";

  const wrongSecurityCode =
    "FINORA-E2E-Wrong-Recovery-01";

  const server =
    createControlCenterTestServer();

  let sourceWindow:
    BrowserWindow | undefined;

  let restoreWindow:
    BrowserWindow | undefined;

  let untrustedWindow:
    BrowserWindow | undefined;

  const runtimeDialog =
    dialog;

  const originalSaveDescriptor =
    Object.getOwnPropertyDescriptor(
      runtimeDialog,
      "showSaveDialog",
    );

  const originalOpenDescriptor =
    Object.getOwnPropertyDescriptor(
      runtimeDialog,
      "showOpenDialog",
    );

  let saveDialogCalls =
    0;

  let openDialogCalls =
    0;

  try {
    assert(
      originalSaveDescriptor !==
        undefined &&
      typeof originalSaveDescriptor.value ===
        "function",
      "Electron dialog.showSaveDialog descriptor is unavailable.",
    );

    assert(
      originalOpenDescriptor !==
        undefined &&
      typeof originalOpenDescriptor.value ===
        "function",
      "Electron dialog.showOpenDialog descriptor is unavailable.",
    );

    app.setPath(
      "userData",
      sourceRoot,
    );

    await app.whenReady();

    registerFinoraControlCenterHandlers();

    await listenOnControlCenterPort(
      server,
    );

    // --------------------------------------------------------
    // NATIVE SAVE DIALOG TEST SEAM
    // --------------------------------------------------------

    Object.defineProperty(
      runtimeDialog,
      "showSaveDialog",
      {
        ...originalSaveDescriptor,

        value:
          (
            async () => {
              saveDialogCalls +=
                1;

              return {
                canceled:
                  false,

                filePath:
                  exportPath,
              };
            }
          ) as typeof dialog.showSaveDialog,
      },
    );

    // --------------------------------------------------------
    // NATIVE OPEN DIALOG TEST SEAM
    // --------------------------------------------------------

    Object.defineProperty(
      runtimeDialog,
      "showOpenDialog",
      {
        ...originalOpenDescriptor,

        value:
          (
            async () => {
              openDialogCalls +=
                1;

              return {
                canceled:
                  false,

                filePaths: [
                  exportPath,
                ],
              };
            }
          ) as typeof dialog.showOpenDialog,
      },
    );

    // --------------------------------------------------------
    // SOURCE MACHINE — REAL PRODUCTION CONTROL CENTER WINDOW
    // --------------------------------------------------------

    await openFinoraControlCenterWindow();

    sourceWindow =
      findTrustedControlCenterWindow();

    assert(
      sourceWindow !==
        undefined,
      "Production Control Center window was not registered as trusted.",
    );

    assert(
      isFinoraControlCenterWindowOpen(),
      "Production Control Center window state did not report open.",
    );

    assert(
      isTrustedFinoraControlCenterRenderer(
        sourceWindow.webContents.mainFrame,
      ),
      "Production Control Center exact mainFrame was not trusted.",
    );

    const bridgeProbe =
      await sourceWindow.webContents.executeJavaScript(
        `({
          exportRecovery:
            typeof window.finoraControlCenter?.exportAdminAuthorityRecovery,
          importRecovery:
            typeof window.finoraControlCenter?.importAndRecoverAdminAuthority,
          rawRequire:
            typeof require
        })`,
        true,
      );

    assert(
      bridgeProbe.exportRecovery ===
        "function" &&
      bridgeProbe.importRecovery ===
        "function" &&
      bridgeProbe.rawRequire ===
        "undefined",
      "Production Control Center preload recovery bridge/isolation proof failed.",
    );

    console.log(
      "PASS: production Control Center preload exposes recovery bridge with Node integration unavailable",
    );

    // --------------------------------------------------------
    // UNRELATED WINDOW USING SAME PRELOAD MUST FAIL TRUST
    // --------------------------------------------------------

    untrustedWindow =
      new BrowserWindow({
        width:
          480,

        height:
          240,

        show:
          false,

        webPreferences: {
          preload:
            join(
              process.cwd(),
              "dist-electron",
              "control-center",
              "finoraControlCenterPreload.js",
            ),

          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true,
        },
      });

    await untrustedWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          "<!doctype html><html><body>FINORA Untrusted Control Center Probe</body></html>",
        ),
    );

    assert(
      !isTrustedFinoraControlCenterRenderer(
        untrustedWindow.webContents.mainFrame,
      ),
      "Unrelated BrowserWindow using the Control Center preload was unexpectedly trusted.",
    );

    const saveCallsBeforeUntrustedProbe =
      saveDialogCalls;

    const untrustedResult =
      await untrustedWindow.webContents.executeJavaScript(
        `window.finoraControlCenter.exportAdminAuthorityRecovery(${JSON.stringify(
          securityCode,
        )})`,
        true,
      );

    assert(
      untrustedResult &&
      untrustedResult.success ===
        false,
      "Unrelated Control Center preload window unexpectedly crossed privileged IPC guard.",
    );

    assert(
      saveDialogCalls ===
        saveCallsBeforeUntrustedProbe,
      "Rejected untrusted renderer reached native Save transport.",
    );

    console.log(
      "PASS: same preload in unrelated BrowserWindow fails exact Control Center main-frame authorization",
    );

    // --------------------------------------------------------
    // REAL EXPORT THROUGH PRELOAD -> IPC -> COORDINATOR
    // --------------------------------------------------------

    const exportResult =
      await sourceWindow.webContents.executeJavaScript(
        `window.finoraControlCenter.exportAdminAuthorityRecovery(${JSON.stringify(
          securityCode,
        )})`,
        true,
      );

    assert(
      exportResult &&
      exportResult.success ===
        true &&
      exportResult.data &&
      exportResult.data.success ===
        true &&
      exportResult.data.status ===
        "EXPORTED",
      "Real Control Center recovery export bridge failed.",
    );

    assert(
      saveDialogCalls ===
        1,
      "Admin Recovery export did not invoke native Save transport exactly once.",
    );

    const sourceVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      exportResult.data.issuerId ===
        sourceVault.issuerId &&
      exportResult.data.signingKeyId ===
        sourceVault.signingKeyId,
      "Recovery export result identity differs from source signing authority.",
    );

    const exportedBytes =
      await readFile(
        exportPath,
      );

    const exportedText =
      exportedBytes.toString(
        "utf8",
      );

    assert(
      !exportedText.includes(
        securityCode,
      ),
      "Exported Admin Recovery artifact exposed Admin Security Code.",
    );

    assert(
      !exportedText.includes(
        sourceVault.privateKeyPkcs8DerBase64,
      ),
      "Exported Admin Recovery artifact exposed plaintext private signing key.",
    );

    const exportResultText =
      JSON.stringify(
        exportResult,
      );

    assert(
      !exportResultText.includes(
        securityCode,
      ) &&
      !exportResultText.includes(
        sourceVault.privateKeyPkcs8DerBase64,
      ),
      "Recovery export IPC result exposed secret material.",
    );

    console.log(
      "PASS: trusted production mainFrame exported encrypted Admin Authority Recovery artifact through native transport",
    );

    // --------------------------------------------------------
    // CLOSE SOURCE MACHINE WINDOWS
    // --------------------------------------------------------

    /*
     * Keep the unrelated probe window alive while the
     * module-owned Control Center window is replaced.
     *
     * The keeper remains untrusted and carries no signing
     * authority. This prevents the E2E process from reaching
     * a zero-window lifecycle boundary between source and
     * fresh-machine Control Center windows.
     */

    await destroyWindow(
      sourceWindow,
    );

    sourceWindow =
      undefined;

    assert(
      !isFinoraControlCenterWindowOpen(),
      "Source Control Center window authority remained registered after destroy.",
    );

    console.log(
      "PASS: source Control Center authority closed while untrusted lifecycle keeper remained non-authoritative",
    );

    // --------------------------------------------------------
    // FRESH MACHINE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      restoreRoot,
    );

    await openFinoraControlCenterWindow();

    restoreWindow =
      findTrustedControlCenterWindow();

    assert(
      restoreWindow !==
        undefined,
      "Fresh-machine Control Center window was not registered as trusted.",
    );

    assert(
      isTrustedFinoraControlCenterRenderer(
        restoreWindow.webContents.mainFrame,
      ),
      "Fresh-machine Control Center exact mainFrame was not trusted.",
    );

    assert(
      untrustedWindow !==
        undefined &&
      !isTrustedFinoraControlCenterRenderer(
        untrustedWindow.webContents.mainFrame,
      ),
      "Lifecycle keeper unexpectedly became the trusted Control Center renderer.",
    );

    await destroyWindow(
      untrustedWindow,
    );

    untrustedWindow =
      undefined;

    console.log(
      "PASS: fresh-machine Control Center replaced source authority window without trusting lifecycle keeper",
    );

    // --------------------------------------------------------
    // WRONG SECURITY CODE — MUST FAIL CLOSED
    // --------------------------------------------------------

    const wrongCodeResult =
      await restoreWindow.webContents.executeJavaScript(
        `window.finoraControlCenter.importAndRecoverAdminAuthority(${JSON.stringify(
          wrongSecurityCode,
        )})`,
        true,
      );

    assert(
      wrongCodeResult &&
      wrongCodeResult.success ===
        true &&
      wrongCodeResult.data &&
      wrongCodeResult.data.success ===
        false &&
      wrongCodeResult.data.cancelled ===
        false &&
      wrongCodeResult.data.errorCode ===
        "RECOVERY_AUTHENTICATION_FAILED",
      "Wrong Admin Security Code did not fail closed through production preload/IPC recovery path.",
    );

    const wrongCodeOpenDialogCalls =
      openDialogCalls;

    assert(
      wrongCodeOpenDialogCalls ===
        1,
      "Wrong-code recovery attempt did not use native Open transport exactly once.",
    );

    console.log(
      "PASS: wrong Admin Security Code fails closed through real production preload/IPC path",
    );

    // --------------------------------------------------------
    // CORRECT SECURITY CODE — EXACT FRESH-MACHINE RESTORE
    // --------------------------------------------------------

    const restoreResult =
      await restoreWindow.webContents.executeJavaScript(
        `window.finoraControlCenter.importAndRecoverAdminAuthority(${JSON.stringify(
          securityCode,
        )})`,
        true,
      );

    assert(
      restoreResult &&
      restoreResult.success ===
        true &&
      restoreResult.data &&
      restoreResult.data.success ===
        true &&
      restoreResult.data.status ===
        "RESTORED",
      "Correct Admin Security Code did not restore authority through production preload/IPC.",
    );

    assert(
      openDialogCalls ===
        2,
      "Admin Recovery import did not invoke native Open transport for both attempts.",
    );

    assert(
      restoreResult.data.issuerId ===
        sourceVault.issuerId &&
      restoreResult.data.signingKeyId ===
        sourceVault.signingKeyId &&
      restoreResult.data.createdAt ===
        sourceVault.createdAt &&
      restoreResult.data.retainedSigningKeyCount ===
        (
          sourceVault.retainedSigningKeys?.length ??
          0
        ),
      "Fresh-machine IPC recovery changed Control Center authority identity/history.",
    );

    const restoredVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      JSON.stringify(
        restoredVault,
      ) ===
        JSON.stringify(
          sourceVault,
        ),
      "Fresh-machine restored Key Vault is not byte-equivalent at the record level to source authority.",
    );

    const restoreResultText =
      JSON.stringify(
        restoreResult,
      );

    assert(
      !restoreResultText.includes(
        securityCode,
      ) &&
      !restoreResultText.includes(
        sourceVault.privateKeyPkcs8DerBase64,
      ),
      "Recovery import IPC result exposed secret material.",
    );

    console.log(
      "PASS: correct Admin Security Code restored exact Control Center signing authority on fresh machine",
    );

    console.log(
      "PASS: Admin Recovery IPC results expose neither Security Code nor private signing material",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: D4E3D5C3 REAL CONTROL CENTER ADMIN AUTHORITY RECOVERY E2E",
    );

    console.log(
      "============================================================",
    );
  }
  finally {
    await destroyWindow(
      untrustedWindow,
    );

    await destroyWindow(
      sourceWindow,
    );

    await destroyWindow(
      restoreWindow,
    );

    if (
      originalSaveDescriptor
    ) {
      Object.defineProperty(
        runtimeDialog,
        "showSaveDialog",
        originalSaveDescriptor,
      );
    }

    if (
      originalOpenDescriptor
    ) {
      Object.defineProperty(
        runtimeDialog,
        "showOpenDialog",
        originalOpenDescriptor,
      );
    }

    await closeServer(
      server,
    );

    await rm(
      root,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

void run()
  .then(
    () =>
      app.exit(
        0,
      ),
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "FAIL: D4E3D5C3 REAL CONTROL CENTER ADMIN AUTHORITY RECOVERY E2E",
        error,
      );

      app.exit(
        1,
      );
    },
  );