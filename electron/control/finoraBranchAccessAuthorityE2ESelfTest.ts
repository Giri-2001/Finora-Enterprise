/* ===========================================================
   FINORA ENTERPRISE OS™

   BRANCH ACCESS AUTHORITY PRODUCTION BRIDGE E2E SELF TEST

   VERIFY:

   - Isolated Electron userData
   - Authoritative native installation binding
   - Trusted Control Store installation identity
   - ACTIVE Demo Branch Access fixture
   - Real compiled ordinary production preload
   - Real FINORA Control IPC handler
   - Production trusted-renderer origin predicate semantics
   - Exact owning BrowserWindow main-frame enforcement remains
     inside the production IPC handler
   - Renderer supplies Branch Access identity only
   - ACTIVE grant succeeds through
       window.finora.control.evaluateBranchAccess()
   - Legacy raw Branch Access bridge is absent
   - Persisted future clock high-water causes the same production
     preload / IPC path to fail closed
   - Rollback rejection preserves Control Store state
   - Rollback rejection preserves persisted high-water state

   IMPORTANT:

   - The core authorization assertions do NOT call
     evaluateFinoraAuthoritativeBranchAccess() directly.
   - Direct Branch Access Grant persistence below is fixture setup
     only. Production mutation remains signed-package controlled.
   - The trusted-renderer predicate below intentionally mirrors
     electron/main.ts isTrustedRenderer().
=========================================================== */

import {
  app,
  BrowserWindow,
} from "electron";

import {
  mkdtemp,
} from "node:fs/promises";

import {
  createServer,
} from "node:http";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlBranchAccessGrant,
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  readFinoraControlStore,
  saveFinoraBranchAccessGrant,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  registerFinoraControlHandlers,
} from "./finoraControlIpc.js";

// ============================================================
// TYPES
// ============================================================

interface SelfTestScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

interface BranchAccessAuthorityDecision {
  allowed:
    boolean;

  state:
    string;

  reason:
    string;

  observedAt:
    string;

  grant?:
    FinoraControlBranchAccessGrant;
}

interface BranchAccessAuthorityResult {
  success:
    boolean;

  data?:
    BranchAccessAuthorityDecision;

  error?:
    string;

  errorCode?:
    string;

  clockErrorCode?:
    string;
}

interface BridgeProbe {
  authorityType:
    string;

  rawType:
    string;
}

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
// PRODUCTION TRUSTED-RENDERER PREDICATE MIRROR
// ============================================================

function isTrustedRenderer(
  senderFrame:
    Electron.WebFrameMain | null,
): boolean {

  if (!senderFrame) {
    return false;
  }

  const frameUrl =
    senderFrame.url;

  if (!frameUrl) {
    return false;
  }

  if (!app.isPackaged) {
    try {
      const url =
        new URL(
          frameUrl,
        );

      return (
        url.protocol === "http:" &&
        url.hostname === "localhost" &&
        url.port === "5173"
      );
    } catch {
      return false;
    }
  }

  return frameUrl.startsWith(
    "file://",
  );
}

// ============================================================
// ACTIVE DEMO FIXTURE
// ============================================================

function createActiveDemoGrant(
  scope:
    SelfTestScope,

  userId:
    string,

  validFrom:
    string,

  validUntil:
    string,
): FinoraControlBranchAccessGrant {

  return {
    grantId:
      `FINORA-DEMO-GRANT-${userId}`,

    userId,

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,

    storageMode:
      "LOCAL",

    accessType:
      "DEMO",

    administrativeStatus:
      "ACTIVE",

    validity: {
      validFrom,
      validUntil,
    },

    demoId:
      `FINORA-DEMO-${userId}`,

    demoRemarks:
      "Phase 14 production Branch Access authority bridge E2E selftest",

    createdAt:
      validFrom,

    updatedAt:
      validFrom,

    schemaVersion:
      1,
  };
}

// ============================================================
// HTTP TRUSTED-ORIGIN HARNESS
// ============================================================

function createTrustedRendererServer() {
  return createServer(
    (
      _request,
      response,
    ) => {

      response.statusCode =
        200;

      response.setHeader(
        "Content-Type",
        "text/html; charset=utf-8",
      );

      response.end(
        [
          "<!doctype html>",
          "<html>",
          "<head>",
          '<meta charset="utf-8">',
          "<title>FINORA Branch Access Authority E2E</title>",
          "</head>",
          "<body>",
          "FINORA Branch Access Authority E2E",
          "</body>",
          "</html>",
        ].join(
          "",
        ),
      );
    },
  );
}

function listenTrustedRendererServer(
  server:
    ReturnType<
      typeof createTrustedRendererServer
    >,
): Promise<void> {

  return new Promise(
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
            error,
          );
        };

      server.once(
        "error",
        handleError,
      );

      server.listen(
        5173,
        "localhost",
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

function closeTrustedRendererServer(
  server:
    ReturnType<
      typeof createTrustedRendererServer
    >,
): Promise<void> {

  return new Promise(
    (
      resolve,
    ) => {

      if (!server.listening) {
        resolve();

        return;
      }

      server.close(
        () => {
          resolve();
        },
      );
    },
  );
}

// ============================================================
// PRELOAD BRIDGE INVOCATION
// ============================================================

async function evaluateThroughProductionBridge(
  window:
    BrowserWindow,

  scope:
    SelfTestScope,

  userId:
    string,
): Promise<
  BranchAccessAuthorityResult
> {

  const request =
    JSON.stringify({
      userId,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,
    });

  return window.webContents.executeJavaScript(
    `window.finora.control.evaluateBranchAccess(${request})`,
    true,
  ) as Promise<
    BranchAccessAuthorityResult
  >;
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-branch-access-authority-e2e-selftest-",
      ),
    );

  const trustedRendererServer =
    createTrustedRendererServer();

  let applicationWindow:
    BrowserWindow |
    undefined;

  let failure:
    unknown;

  try {

    // --------------------------------------------------------
    // ISOLATED ELECTRON STATE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // AUTHORITATIVE NATIVE INSTALLATION
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: authoritative native installation binding established",
    );

    // --------------------------------------------------------
    // CONTROL STORE INSTALLATION
    // --------------------------------------------------------

    const fixtureNow =
      new Date();

    const installationTimestamp =
      new Date(
        fixtureNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const scope:
      SelfTestScope = {
        ownerId:
          "OWNER-BRANCH-ACCESS-AUTHORITY-E2E",

        businessId:
          "BUSINESS-BRANCH-ACCESS-AUTHORITY-E2E",

        branchId:
          "BRANCH-BRANCH-ACCESS-AUTHORITY-E2E",
      };

    const installation:
      FinoraControlInstallationIdentity = {
        installationId:
          nativeBinding.installationId,

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          "BAE01",

        branchCode:
          "B01",

        createdAt:
          installationTimestamp,

        updatedAt:
          installationTimestamp,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    assert(
      installationResult.success &&
      installationResult.data,
      installationResult.error ??
        "Unable to persist trusted Control Store installation identity.",
    );

    console.log(
      "PASS: trusted Control Store installation identity persisted",
    );

    // --------------------------------------------------------
    // ACTIVE DEMO ACCESS FIXTURE
    // --------------------------------------------------------

    const activeDemoUserId =
      "USER-ACTIVE-DEMO-E2E";

    const activeFrom =
      new Date(
        fixtureNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const activeUntil =
      new Date(
        fixtureNow.getTime() +
          24 *
            60 *
            60 *
            1000,
      ).toISOString();

    const activeGrant =
      createActiveDemoGrant(
        scope,
        activeDemoUserId,
        activeFrom,
        activeUntil,
      );

    const grantResult =
      await saveFinoraBranchAccessGrant(
        activeGrant,
      );

    assert(
      grantResult.success &&
      grantResult.data,
      grantResult.error ??
        "Unable to persist ACTIVE Demo Branch Access fixture.",
    );

    console.log(
      "PASS: ACTIVE Demo Branch Access fixture persisted",
    );

    // --------------------------------------------------------
    // REAL CONTROL IPC HANDLERS
    // --------------------------------------------------------

    registerFinoraControlHandlers(
      isTrustedRenderer,
    );

    console.log(
      "PASS: production FINORA Control IPC handlers registered",
    );

    // --------------------------------------------------------
    // TRUSTED DEVELOPMENT ORIGIN
    //
    // This exact localhost:5173 origin matches main.ts
    // isTrustedRenderer() when Electron is not packaged.
    // --------------------------------------------------------

    await listenTrustedRendererServer(
      trustedRendererServer,
    );

    console.log(
      "PASS: trusted localhost:5173 renderer origin started",
    );

    // --------------------------------------------------------
    // REAL ORDINARY PRODUCTION PRELOAD
    // --------------------------------------------------------

    applicationWindow =
      new BrowserWindow({
        width:
          720,

        height:
          300,

        show:
          false,

        title:
          "FINORA Branch Access Authority E2E",

        webPreferences: {
          preload:
            join(
              process.cwd(),
              "dist-electron",
              "preload.js",
            ),

          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true,
        },
      });

    await applicationWindow.loadURL(
      "http://localhost:5173",
    );

    assert(
      isTrustedRenderer(
        applicationWindow.webContents.mainFrame,
      ),
      "The ordinary application main frame did not satisfy the production trusted-renderer predicate.",
    );

    console.log(
      "PASS: ordinary application main frame satisfies production trusted-renderer predicate",
    );

    // --------------------------------------------------------
    // PRELOAD SURFACE
    // --------------------------------------------------------

    const bridgeProbe =
      await applicationWindow.webContents.executeJavaScript(
        `({
          authorityType:
            typeof window.finora?.control?.evaluateBranchAccess,
          rawType:
            typeof window.finora?.control?.findBranchAccessGrant
        })`,
        true,
      ) as BridgeProbe;

    assert(
      bridgeProbe.authorityType ===
        "function",
      "Production preload did not expose authoritative Branch Access evaluation.",
    );

    assert(
      bridgeProbe.rawType ===
        "undefined",
      "Production preload still exposed legacy raw Branch Access read authority.",
    );

    console.log(
      "PASS: production preload exposes authority bridge and no legacy raw grant bridge",
    );

    // --------------------------------------------------------
    // ACTIVE AUTHORIZATION THROUGH REAL PRELOAD + IPC
    // --------------------------------------------------------

    const activeResult =
      await evaluateThroughProductionBridge(
        applicationWindow,
        scope,
        activeDemoUserId,
      );

    assert(
      activeResult.success &&
      activeResult.data !==
        undefined &&
      activeResult.data.allowed &&
      activeResult.data.state ===
        "ACTIVE" &&
      activeResult.data.grant?.grantId ===
        activeGrant.grantId,
      activeResult.error ??
        "ACTIVE Demo Branch Access did not authorize through the production preload / IPC authority chain.",
    );

    console.log(
      "PASS: production preload -> exact main-frame IPC -> Branch Access authority authorized ACTIVE Demo",
    );

    const observedHighWater =
      await loadFinoraClockHighWaterState();

    assert(
      observedHighWater !==
        undefined &&
      observedHighWater.installationId ===
        nativeBinding.installationId,
      "Production Branch Access authorization did not establish persisted clock high-water state.",
    );

    console.log(
      "PASS: production Branch Access authorization persisted clock high-water observation",
    );

    // --------------------------------------------------------
    // ROLLBACK SNAPSHOT
    // --------------------------------------------------------

    const controlBeforeRollback =
      await readFinoraControlStore();

    assert(
      controlBeforeRollback.success &&
      controlBeforeRollback.data,
      controlBeforeRollback.error ??
        "Unable to snapshot Control Store before production rollback proof.",
    );

    const controlSnapshotBeforeRollback =
      JSON.stringify(
        controlBeforeRollback.data,
      );

    const futureHighWaterAt =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000,
      ).toISOString();

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        nativeBinding.installationId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededHighWater =
      await loadFinoraClockHighWaterState();

    assert(
      seededHighWater !==
        undefined &&
      seededHighWater.installationId ===
        nativeBinding.installationId &&
      seededHighWater.highWaterAt ===
        futureHighWaterAt,
      "Future production Branch Access clock high-water fixture was not persisted.",
    );

    console.log(
      "PASS: future persisted clock high-water seeded",
    );

    // --------------------------------------------------------
    // SAME PRODUCTION PRELOAD / IPC PATH MUST FAIL CLOSED
    // --------------------------------------------------------

    const rollbackResult =
      await evaluateThroughProductionBridge(
        applicationWindow,
        scope,
        activeDemoUserId,
      );

    assert(
      !rollbackResult.success &&
      rollbackResult.errorCode ===
        "CLOCK_AUTHORITY_FAILED" &&
      rollbackResult.clockErrorCode ===
        "CLOCK_ROLLBACK_DETECTED",
      rollbackResult.error ??
        "Production preload / IPC Branch Access path did not fail closed on persisted clock rollback.",
    );

    console.log(
      "PASS: production preload / IPC Branch Access path rejected persisted clock rollback",
    );

    // --------------------------------------------------------
    // ZERO CONTROL STORE MUTATION
    // --------------------------------------------------------

    const controlAfterRollback =
      await readFinoraControlStore();

    assert(
      controlAfterRollback.success &&
      controlAfterRollback.data &&
      JSON.stringify(
        controlAfterRollback.data,
      ) ===
        controlSnapshotBeforeRollback,
      "Production clock rollback rejection mutated trusted Control Store state.",
    );

    console.log(
      "PASS: rollback rejection preserved trusted Control Store state",
    );

    // --------------------------------------------------------
    // ZERO HIGH-WATER MUTATION
    // --------------------------------------------------------

    const highWaterAfterRollback =
      await loadFinoraClockHighWaterState();

    assert(
      highWaterAfterRollback !==
        undefined &&
      highWaterAfterRollback.installationId ===
        nativeBinding.installationId &&
      highWaterAfterRollback.highWaterAt ===
        futureHighWaterAt,
      "Production clock rollback rejection mutated persisted high-water state.",
    );

    console.log(
      "PASS: rollback rejection preserved persisted clock high-water state",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA BRANCH ACCESS AUTHORITY PRODUCTION BRIDGE E2E SELFTEST",
    );

    console.log(
      "============================================================",
    );

  } catch (error) {
    failure =
      error;
  } finally {

    if (
      applicationWindow &&
      !applicationWindow.isDestroyed()
    ) {
      applicationWindow.destroy();
    }

    await closeTrustedRendererServer(
      trustedRendererServer,
    );

    /*
     * BrowserWindow / Chromium may retain profile files until the
     * Electron process exits. The outer PowerShell runtime harness
     * must delete temporaryUserData after process exit and prove
     * that no matching E2E directory remains.
     */
    console.log(
      `POST-EXIT CLEANUP REQUIRED: ${temporaryUserData}`,
    );
  }

  if (failure) {
    throw failure;
  }
}

// ============================================================
// ENTRY
// ============================================================

app.on(
  "window-all-closed",
  () => {
    // Selftest exits only through the explicit app.exit path.
  },
);

const selfTestKeepAlive =
  setInterval(
    () => {
      // Intentionally empty.
    },
    1000,
  );

function flushSelfTestConsoleStreams():
  Promise<void> {

  return new Promise(
    (
      resolve,
    ) => {

      process.stdout.write(
        "",
        () => {

          process.stderr.write(
            "",
            () => {
              resolve();
            },
          );
        },
      );
    },
  );
}

void runSelfTest()
  .then(
    async () => {

      clearInterval(
        selfTestKeepAlive,
      );

      await flushSelfTestConsoleStreams();

      app.exit(
        0,
      );
    },

    async (
      error,
    ) => {

      clearInterval(
        selfTestKeepAlive,
      );

      console.error(
        "FAIL: FINORA BRANCH ACCESS AUTHORITY PRODUCTION BRIDGE E2E SELFTEST",
        error,
      );

      await flushSelfTestConsoleStreams();

      app.exit(
        1,
      );
    },
  );

// ============================================================
// END
// ============================================================