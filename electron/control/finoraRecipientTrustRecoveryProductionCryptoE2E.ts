// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY PRODUCTION CRYPTOGRAPHIC BRIDGE E2E
//
// VERIFY:
//
// OFFLINE PREPARATION:
// - Independent Recovery Authority private root is generated.
// - Recipient receives only fingerprint-pinned public root.
// - Operational recipient trust begins with ACTIVE key A.
// - Genuine Recovery packages sequence 1 and 2 are issued.
// - Offline private-authority persistence is deleted before
//   production Recipient Recovery surface execution.
//
// PRODUCTION BRIDGE:
// - Real dedicated Recovery BrowserWindow.
// - Real dedicated Recovery preload.
// - Real exact-mainFrame IPC authorization.
// - Real import coordinator.
// - Native picker boundary returns controlled .finora fixtures.
//
// COMPOSITE RECOVERY FLOW:
// 1. Valid A -> B, sequence 1 succeeds.
// 2. Exact package replay rejects with zero trust mutation.
// 3. New package with stale sequence 1 rejects.
// 4. Cryptographically valid wrong-target sequence 2 rejects.
// 5. Tampered signature for valid sequence 2 rejects.
// 6. Original valid B -> C sequence 2 then succeeds.
//
// CLOCK:
// Coordinator authoritative clock observation occurs before apply.
// Rejected replay/stale/target/signature packages may therefore
// advance clock high-water while leaving recipient trust intact.
//
// SECURITY:
// - Recipient Recovery root remains immutable.
// - Failed packages do not advance recipient Recovery replay cursor.
// - Final successful seq2 proves rejected seq2 attempts consumed
//   no recipient Recovery replay state.
// ============================================================

import {
  app,
  BrowserWindow,
  dialog,
  safeStorage,
} from "electron";

import {
  existsSync,
} from "node:fs";

import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import type {
  FinoraControlCenterSigningMaterial,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  createFinoraInstallationBindingFingerprint,
  generateFinoraWindowsInstallationBindingMaterial,
} from "./finoraInstallationBindingCrypto.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  bootstrapFinoraRecipientTrust,
} from "./finoraRecipientTrustBootstrapService.js";

import {
  bootstrapFinoraRecipientTrustRecoveryAuthority,
} from "./finoraRecipientTrustRecoveryAuthorityBootstrapService.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityStore,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import {
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  validateFinoraRecipientTrustRecoverySignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoverySignedEnvelope,
  FinoraRecipientTrustRecoveryUnsignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustTransitionTarget,
} from "./finoraRecipientTrustTransitionContract.js";

import {
  registerFinoraRecipientTrustRecoveryHandlers,
} from "./finoraRecipientTrustRecoveryIpc.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  isTrustedFinoraRecipientTrustRecoveryRenderer,
  openFinoraRecipientTrustRecoveryWindow,
} from "./finoraRecipientTrustRecoveryWindow.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  loadFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault,
} from "../recovery/finoraRecipientTrustRecoveryAuthorityVault.js";

import {
  issueFinoraRecipientTrustRecovery,
} from "../recovery/finoraRecipientTrustRecoveryIssuer.js";

import type {
  FinoraRecipientTrustRecoveryIssueRequest,
} from "../recovery/finoraRecipientTrustRecoveryIssuer.js";

// ============================================================
// TEST RUNTIME HARDENING
//
// This E2E validates privileged renderer / preload / IPC /
// cryptographic authority behavior. It has no GPU dependency.
// Disabling hardware acceleration prevents an unrelated GPU
// process failure from terminating the renderer mid-composite.
// ============================================================

app.disableHardwareAcceleration();

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
// SMALL DELAY
//
// Ensures wall-clock observations are measurably later between
// production bridge attempts.
// ============================================================

async function waitForNextClockTick():
  Promise<void> {
  await new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        20,
      );
    },
  );
}

// ============================================================
// OPERATIONAL TRUST KEY
// ============================================================

function createActiveTrustedKey(
  operationalIssuerId:
    string,

  material:
    FinoraControlCenterSigningMaterial,

  validFrom:
    string,
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId:
      operationalIssuerId,

    signingKeyId:
      material.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      material.publicKeySpkiDerBase64,

    status:
      "ACTIVE",

    validFrom,
  };
}

// ============================================================
// SIGN MODIFIED RECOVERY ENVELOPE
// ============================================================

function signRecoveryUnsignedEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustRecoveryUnsignedEnvelope,

  privateKeyPkcs8DerBase64:
    string,
): FinoraRecipientTrustRecoverySignedEnvelope {
  const canonical =
    canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
      unsignedEnvelope,
    );

  const signatureValue =
    signFinoraControlCenterCanonicalValue(
      canonical,
      privateKeyPkcs8DerBase64,
    );

  const signed:
    FinoraRecipientTrustRecoverySignedEnvelope = {
      ...unsignedEnvelope,

      signature: {
        algorithm:
          "ECDSA_P256_SHA256",

        encoding:
          "IEEE_P1363",

        canonicalization:
          "FINORA_CANONICAL_JSON_V1",

        signingKeyId:
          unsignedEnvelope.issuer.signingKeyId,

        value:
          signatureValue,
      },
    };

  validateFinoraRecipientTrustRecoverySignedEnvelope(
    signed,
  );

  return signed;
}

// ============================================================
// UNSIGNED VIEW
// ============================================================

function toUnsignedRecovery(
  signed:
    FinoraRecipientTrustRecoverySignedEnvelope,
): FinoraRecipientTrustRecoveryUnsignedEnvelope {
  const {
    signature:
      _signature,

    ...unsigned
  } =
    signed;

  return unsigned;
}

// ============================================================
// SNAPSHOTS
// ============================================================

async function snapshotRecipientTrust():
  Promise<string> {
  const state =
    await loadFinoraRecipientTrustStore();

  assert(
    state !==
      undefined,
    "Recipient Trust Store unexpectedly missing.",
  );

  return JSON.stringify(
    state,
  );
}

async function snapshotRecoveryRoot():
  Promise<string> {
  const state =
    await loadFinoraRecipientTrustRecoveryAuthorityStore();

  assert(
    state !==
      undefined,
    "Recipient Recovery Authority public store unexpectedly missing.",
  );

  return JSON.stringify(
    state,
  );
}

async function getClockHighWaterMs():
  Promise<number> {
  const state =
    await loadFinoraClockHighWaterState();

  assert(
    state !==
      undefined,
    "Recipient clock high-water unexpectedly missing.",
  );

  const milliseconds =
    Date.parse(
      state.highWaterAt,
    );

  assert(
    Number.isFinite(
      milliseconds,
    ),
    "Recipient clock high-water timestamp is invalid.",
  );

  return milliseconds;
}

// ============================================================
// WRITE FIXTURE
// ============================================================

async function writeRecoveryFixture(
  filePath:
    string,

  recovery:
    FinoraRecipientTrustRecoverySignedEnvelope,
): Promise<void> {
  validateFinoraRecipientTrustRecoverySignedEnvelope(
    recovery,
  );

  await writeFile(
    filePath,
    JSON.stringify(
      recovery,
      null,
      2,
    ),
    {
      encoding:
        "utf8",
    },
  );
}

// ============================================================
// PRODUCTION BRIDGE CALL
// ============================================================

async function invokeProductionRecoveryBridge(
  recoveryWindow:
    BrowserWindow,
): Promise<
  {
    success:
      boolean;

    cancelled?:
      boolean;

    error?:
      string;

    fileName?:
      string;

    bytesRead?:
      number;

    applySummary?:
      {
        packageId:
          string;

        action:
          string;

        sequence:
          number;

        installationId:
          string;

        appliedAt:
          string;

        revokedSigningKeyId:
          string;

        activeSigningKeyId:
          string;
      };
  }
> {
  return (
    await recoveryWindow.webContents.executeJavaScript(
      "window.finoraRecipientTrustRecovery.importSignedRecovery()",
    )
  ) as {
    success:
      boolean;

    cancelled?:
      boolean;

    error?:
      string;

    fileName?:
      string;

    bytesRead?:
      number;

    applySummary?:
      {
        packageId:
          string;

        action:
          string;

        sequence:
          number;

        installationId:
          string;

        appliedAt:
          string;

        revokedSigningKeyId:
          string;

        activeSigningKeyId:
          string;
      };
  };
}

// ============================================================
// E2E
// ============================================================

async function runE2E():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recovery-production-crypto-e2e-",
      ),
    );

  let recoveryWindow:
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

  /*
   * A window-all-closed listener alone cannot block another
   * listener from calling app.quit().
   *
   * Keep this isolated E2E alive until its own Promise completes.
   * If production/app lifecycle requests quit early, before-quit
   * is prevented and the pending test can surface the exact
   * renderer/window failure instead of ending silently.
   */
  let e2eCompleted =
    false;

  let e2eFinalizing =
    false;

  /*
   * An unresolved Promise alone is not sufficient proof that the
   * Electron main event loop will remain observable. Keep an
   * explicit watchdog alive during this composite E2E. If an
   * awaited stage never settles, emit the exact stage and fail.
   */
  const e2eWatchdog =
    setTimeout(
      () => {
        console.error(
          "FAIL: RECOVERY CRYPTO E2E WATCHDOG TIMEOUT",
        );

        app.exit(
          91,
        );
      },
      30_000,
    );

  let unexpectedWindowAllClosed =
    false;

  let unexpectedQuitAttempt =
    false;

  const observeUnexpectedWindowAllClosed =
    (): void => {
      if (
        !e2eCompleted &&
        !e2eFinalizing
      ) {
        unexpectedWindowAllClosed =
          true;

        console.error(
          "E2E DIAGNOSTIC: window-all-closed fired before composite Recovery E2E completion.",
        );
      }
    };

  const preventUnexpectedE2EQuit =
    (
      event:
        Electron.Event,
    ): void => {
      if (
        e2eCompleted
      ) {
        return;
      }

      event.preventDefault();

      if (
        e2eFinalizing
      ) {
        return;
      }

      unexpectedQuitAttempt =
        true;

      console.error(
        "E2E DIAGNOSTIC: prevented app.quit() before composite Recovery E2E completion.",
      );
    };

  app.on(
    "window-all-closed",
    observeUnexpectedWindowAllClosed,
  );

  app.on(
    "before-quit",
    preventUnexpectedE2EQuit,
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

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage is unavailable for production Recovery crypto E2E.",
    );

    console.log(
      "PASS: isolated Electron userData + safeStorage ready",
    );

    /*
     * The Electron process must not recursively delete its own
     * active userData profile while Chromium still owns handles
     * inside that tree.
     *
     * The parent runtime harness consumes this exact generated
     * path and removes it only after Electron has fully exited.
     */
    console.log(
      `E2E TEMP USERDATA PATH: ${temporaryUserData}`,
    );

    // --------------------------------------------------------
    // AUTHORITATIVE NATIVE INSTALLATION
    //
    // Recipient Recovery-root provisioning is installation-bound.
    // Ensure the production native binding exists before any
    // recipient Recovery Authority bootstrap attempt.
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    console.log(
      "PASS: authoritative native installation binding prepared before Recovery-root bootstrap",
    );

    // --------------------------------------------------------
    // OFFLINE RECOVERY PRIVATE ROOT
    // --------------------------------------------------------

    const offlineRecoveryAuthority =
      await loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault();

    console.log(
      "PASS: independent offline Recovery Authority private root prepared",
    );

    // --------------------------------------------------------
    // RECIPIENT PUBLIC RECOVERY ROOT BOOTSTRAP
    // --------------------------------------------------------

    const recoveryBootstrap =
      await bootstrapFinoraRecipientTrustRecoveryAuthority({
        recoveryAuthorityId:
          offlineRecoveryAuthority.recoveryAuthorityId,

        signingKeyId:
          offlineRecoveryAuthority.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          offlineRecoveryAuthority.publicKeySpkiDerBase64,

        expectedPublicKeyFingerprint:
          offlineRecoveryAuthority.publicKeyFingerprint,
      });

    assert(
      recoveryBootstrap.success,
      recoveryBootstrap.success
        ? "Recipient Recovery Authority bootstrap returned invalid success."
        : recoveryBootstrap.error,
    );

    const recoveryPublicStore =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();

    assert(
      recoveryPublicStore !==
        undefined &&
      recoveryPublicStore.authority.recoveryAuthorityId ===
        offlineRecoveryAuthority.recoveryAuthorityId &&
      recoveryPublicStore.authority.signingKeyId ===
        offlineRecoveryAuthority.signingKeyId &&
      recoveryPublicStore.installation.installationId ===
        nativeBinding.installationId &&
      recoveryPublicStore.installation.bindingKeyId ===
        nativeBinding.bindingKeyId &&
      recoveryPublicStore.installation.fingerprintAlgorithm ===
        nativeBinding.fingerprintAlgorithm &&
      recoveryPublicStore.installation.publicKeyFingerprint ===
        nativeBinding.publicKeyFingerprint,
      "Recipient public Recovery root does not match offline Recovery Authority and exact native installation binding.",
    );

    const target:
      FinoraRecipientTrustTransitionTarget = {
        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    console.log(
      "PASS: independently fingerprint-pinned Recipient Recovery public root provisioned",
    );

    // --------------------------------------------------------
    // OPERATIONAL TRUST A
    // --------------------------------------------------------

    const operationalIssuerId =
      "FINORA-CONTROL-CENTER-PRODUCTION-RECOVERY-E2E";

    const materialA =
      generateFinoraControlCenterSigningMaterial();

    const materialB =
      generateFinoraControlCenterSigningMaterial();

    const materialC =
      generateFinoraControlCenterSigningMaterial();

    const activeA =
      createActiveTrustedKey(
        operationalIssuerId,
        materialA,
        "2026-01-01T00:00:00.000Z",
      );

    const trustBootstrap =
      await bootstrapFinoraRecipientTrust({
        trustedKey:
          activeA,

        expectedPublicKeyFingerprint:
          createFinoraInstallationBindingFingerprint(
            materialA.publicKeySpkiDerBase64,
          ),
      });

    assert(
      trustBootstrap.success,
      trustBootstrap.success
        ? "Operational recipient trust bootstrap returned invalid success."
        : trustBootstrap.error,
    );

    console.log(
      "PASS: operational recipient trust bootstrapped with ACTIVE key A",
    );

    // --------------------------------------------------------
    // OFFLINE ISSUE TIMES
    // --------------------------------------------------------

    const recipientProvisionedAtMs =
      Date.parse(
        recoveryPublicStore.provisionedAt,
      );

    assert(
      Number.isFinite(
        recipientProvisionedAtMs,
      ),
      "Recipient Recovery Authority provisionedAt is invalid.",
    );

    const sequence1IssueDate =
      new Date(
        Math.max(
          Date.now(),
          recipientProvisionedAtMs,
        ),
      );

    const sequence1IssuedAt =
      sequence1IssueDate.toISOString();

    const sequence2IssueDate =
      new Date(
        sequence1IssueDate.getTime() +
          1,
      );

    const sequence2IssuedAt =
      sequence2IssueDate.toISOString();

    // --------------------------------------------------------
    // GENUINE SEQUENCE 1: A -> B
    // --------------------------------------------------------

    const sequence1Request:
      FinoraRecipientTrustRecoveryIssueRequest = {
        target,

        operationalIssuerId,

        expectedActiveSigningKeyId:
          materialA.signingKeyId,

        replacementTrustedKey:
          createActiveTrustedKey(
            operationalIssuerId,
            materialB,
            sequence1IssuedAt,
          ),
      };

    const sequence1IssueResult =
      await issueFinoraRecipientTrustRecovery(
        sequence1Request,
        sequence1IssueDate,
      );

    assert(
      sequence1IssueResult.success,
      sequence1IssueResult.success
        ? "Recovery sequence 1 issuer returned invalid success."
        : sequence1IssueResult.error,
    );

    assert(
      sequence1IssueResult.data.sequence ===
        1,
      "First offline Recovery package was not sequence 1.",
    );

    const validSequence1 =
      sequence1IssueResult.data.signedRecovery;

    // --------------------------------------------------------
    // GENUINE SEQUENCE 2: B -> C
    // --------------------------------------------------------

    const sequence2Request:
      FinoraRecipientTrustRecoveryIssueRequest = {
        target,

        operationalIssuerId,

        expectedActiveSigningKeyId:
          materialB.signingKeyId,

        replacementTrustedKey:
          createActiveTrustedKey(
            operationalIssuerId,
            materialC,
            sequence2IssuedAt,
          ),
      };

    const sequence2IssueResult =
      await issueFinoraRecipientTrustRecovery(
        sequence2Request,
        sequence2IssueDate,
      );

    assert(
      sequence2IssueResult.success,
      sequence2IssueResult.success
        ? "Recovery sequence 2 issuer returned invalid success."
        : sequence2IssueResult.error,
    );

    assert(
      sequence2IssueResult.data.sequence ===
        2,
      "Second offline Recovery package was not sequence 2.",
    );

    const validSequence2 =
      sequence2IssueResult.data.signedRecovery;

    console.log(
      "PASS: independent offline issuer produced genuine Recovery sequences 1 and 2",
    );

    // --------------------------------------------------------
    // STALE PACKAGE
    //
    // New packageId, same valid B -> C payload, but sequence 1.
    // Re-sign with independent Recovery Authority.
    // --------------------------------------------------------

    const sequence2Unsigned =
      toUnsignedRecovery(
        validSequence2,
      );

    const staleUnsigned:
      FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      ...sequence2Unsigned,

      packageId:
        "FINORA-RECOVERY-PRODUCTION-E2E-STALE",

      sequence:
        1,
    };

    const staleRecovery =
      signRecoveryUnsignedEnvelope(
        staleUnsigned,
        offlineRecoveryAuthority.privateKeyPkcs8DerBase64,
      );

    // --------------------------------------------------------
    // WRONG TARGET PACKAGE
    //
    // Build a structurally valid independent installation target.
    // It is deliberately not the recipient's native installation.
    // --------------------------------------------------------

    const wrongInstallation =
      generateFinoraWindowsInstallationBindingMaterial(
        sequence2IssueDate,
        "FINORA-INSTALLATION-PRODUCTION-RECOVERY-E2E-WRONG",
      );

    const wrongTarget:
      FinoraRecipientTrustTransitionTarget = {
        installationId:
          wrongInstallation.installationId,

        bindingKeyId:
          wrongInstallation.bindingKeyId,

        fingerprintAlgorithm:
          wrongInstallation.fingerprintAlgorithm,

        publicKeyFingerprint:
          wrongInstallation.publicKeyFingerprint,
      };

    const wrongTargetUnsigned:
      FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      ...sequence2Unsigned,

      packageId:
        "FINORA-RECOVERY-PRODUCTION-E2E-WRONG-TARGET",

      target:
        wrongTarget,
    };

    const wrongTargetRecovery =
      signRecoveryUnsignedEnvelope(
        wrongTargetUnsigned,
        offlineRecoveryAuthority.privateKeyPkcs8DerBase64,
      );

    // --------------------------------------------------------
    // TAMPERED SIGNATURE
    //
    // Keep the original valid sequence-2 package identity and
    // signed content; corrupt exactly one signature byte.
    // --------------------------------------------------------

    const tamperedSignatureBytes =
      Buffer.from(
        validSequence2.signature.value,
        "base64",
      );

    assert(
      tamperedSignatureBytes.length ===
        64,
      "Valid Recovery sequence-2 signature is not 64-byte P1363.",
    );

    tamperedSignatureBytes[0] =
      tamperedSignatureBytes[0] ^
      0x01;

    const tamperedSequence2:
      FinoraRecipientTrustRecoverySignedEnvelope = {
      ...validSequence2,

      signature: {
        ...validSequence2.signature,

        value:
          tamperedSignatureBytes.toString(
            "base64",
          ),
      },
    };

    validateFinoraRecipientTrustRecoverySignedEnvelope(
      tamperedSequence2,
    );

    // --------------------------------------------------------
    // WRITE SIX NATIVE-PICKER FIXTURES
    // --------------------------------------------------------

    const valid1Path =
      join(
        temporaryUserData,
        "01-valid-sequence-1.finora",
      );

    const replayPath =
      join(
        temporaryUserData,
        "02-replay-sequence-1.finora",
      );

    const stalePath =
      join(
        temporaryUserData,
        "03-stale-sequence-1.finora",
      );

    const wrongTargetPath =
      join(
        temporaryUserData,
        "04-wrong-target-sequence-2.finora",
      );

    const tamperedPath =
      join(
        temporaryUserData,
        "05-tampered-sequence-2.finora",
      );

    const valid2Path =
      join(
        temporaryUserData,
        "06-valid-sequence-2.finora",
      );

    await writeRecoveryFixture(
      valid1Path,
      validSequence1,
    );

    await writeRecoveryFixture(
      replayPath,
      validSequence1,
    );

    await writeRecoveryFixture(
      stalePath,
      staleRecovery,
    );

    await writeRecoveryFixture(
      wrongTargetPath,
      wrongTargetRecovery,
    );

    await writeRecoveryFixture(
      tamperedPath,
      tamperedSequence2,
    );

    await writeRecoveryFixture(
      valid2Path,
      validSequence2,
    );

    console.log(
      "PASS: valid/replay/stale/wrong-target/tampered/final-valid .finora fixtures created",
    );

    // --------------------------------------------------------
    // REMOVE OFFLINE PRIVATE-AUTHORITY PERSISTENCE
    //
    // Recipient runtime below retains only its independently
    // bootstrapped public Recovery root.
    // --------------------------------------------------------

    const offlineRecoveryDirectory =
      join(
        temporaryUserData,
        "finora",
        "recovery",
      );

    assert(
      existsSync(
        offlineRecoveryDirectory,
      ),
      "Offline Recovery Authority persistence was not created before isolation cleanup.",
    );

    await rm(
      offlineRecoveryDirectory,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    assert(
      !existsSync(
        offlineRecoveryDirectory,
      ),
      "Offline Recovery Authority private persistence survived isolation cleanup.",
    );

    console.log(
      "PASS: offline Recovery private vault + issuer ledger removed before recipient production bridge execution",
    );

    // --------------------------------------------------------
    // RECIPIENT ROOT SNAPSHOT
    // --------------------------------------------------------

    const immutableRecoveryRoot =
      await snapshotRecoveryRoot();

    // --------------------------------------------------------
    // PRODUCTION RECOVERY IPC + WINDOW
    // --------------------------------------------------------

    registerFinoraRecipientTrustRecoveryHandlers();

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
      "Production Recipient Trust Recovery window was not resolved.",
    );

    const trustedRecoveryWindow =
      recoveryWindow;

    let recoverySurfaceFailure:
      string | undefined;

    const recordRecoverySurfaceFailure =
      (
        message:
          string,
      ): void => {
        if (
          e2eCompleted ||
          e2eFinalizing
        ) {
          return;
        }

        if (
          recoverySurfaceFailure ===
            undefined
        ) {
          recoverySurfaceFailure =
            message;
        }

        console.error(
          "E2E DIAGNOSTIC:",
          message,
        );
      };

    trustedRecoveryWindow.on(
      "closed",
      () => {
        recordRecoverySurfaceFailure(
          "Production Recovery BrowserWindow closed before composite E2E completion.",
        );
      },
    );

    trustedRecoveryWindow.on(
      "unresponsive",
      () => {
        recordRecoverySurfaceFailure(
          "Production Recovery BrowserWindow became unresponsive during composite E2E.",
        );
      },
    );

    trustedRecoveryWindow.webContents.on(
      "render-process-gone",
      (
        _event,
        details,
      ) => {
        recordRecoverySurfaceFailure(
          `Production Recovery render process exited: reason=${details.reason}; exitCode=${details.exitCode}.`,
        );
      },
    );

    const assertRecoverySurfaceAlive =
      (
        stage:
          string,
      ): void => {
        assert(
          !trustedRecoveryWindow.isDestroyed() &&
          recoverySurfaceFailure ===
            undefined,
          `Production Recovery privileged surface became unavailable ${stage}: ${
            recoverySurfaceFailure ??
            "BrowserWindow is destroyed."
          }`,
        );
      };

    const bridgeType =
      await trustedRecoveryWindow.webContents.executeJavaScript(
        "typeof window.finoraRecipientTrustRecovery",
      );

    assert(
      bridgeType ===
        "object",
      "Production Recovery preload bridge is unavailable.",
    );

    console.log(
      "PASS: production Recovery renderer/preload/IPC surface ready",
    );

    // --------------------------------------------------------
    // NATIVE PICKER SEAM
    //
    // Every production bridge invocation reaches this real
    // Electron dialog boundary. It returns the next fixture.
    // --------------------------------------------------------

    const fixturePaths = [
      valid1Path,
      replayPath,
      stalePath,
      wrongTargetPath,
      tamperedPath,
      valid2Path,
    ];

    let dialogInvocation =
      0;

    let everyDialogOwnerExact =
      true;

    let everyDialogHadFinoraFilter =
      true;

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
            const fixturePath =
              fixturePaths[
                dialogInvocation
              ];

            assert(
              fixturePath !==
                undefined,
              "Production Recovery E2E received an unexpected extra native picker invocation.",
            );

            dialogInvocation +=
              1;

            everyDialogOwnerExact =
              everyDialogOwnerExact &&
              ownerWindow ===
                trustedRecoveryWindow;

            everyDialogHadFinoraFilter =
              everyDialogHadFinoraFilter &&
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
                false,

              filePaths: [
                fixturePath,
              ],
            };
          },
      },
    );

    // ========================================================
    // TEST 1 — VALID A -> B, SEQUENCE 1
    // ========================================================

    await waitForNextClockTick();

    const valid1Result =
      await invokeProductionRecoveryBridge(
        trustedRecoveryWindow,
      );

    assert(
      valid1Result.success &&
      valid1Result.cancelled ===
        false &&
      valid1Result.applySummary !==
        undefined &&
      valid1Result.applySummary.packageId ===
        validSequence1.packageId &&
      valid1Result.applySummary.sequence ===
        1 &&
      valid1Result.applySummary.revokedSigningKeyId ===
        materialA.signingKeyId &&
      valid1Result.applySummary.activeSigningKeyId ===
        materialB.signingKeyId &&
      valid1Result.applySummary.installationId ===
        target.installationId,
      valid1Result.success
        ? "Production valid sequence-1 Recovery summary is incorrect."
        : `Production valid sequence-1 Recovery failed: ${valid1Result.error}`,
    );

    const trustAfterValid1 =
      await loadFinoraRecipientTrustStore();

    assert(
      trustAfterValid1 !==
        undefined,
      "Recipient trust missing after production valid sequence 1.",
    );

    const keyA =
      trustAfterValid1.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const keyB =
      trustAfterValid1.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    const activeAfterValid1 =
      trustAfterValid1.trustedKeys.filter(
        (key) =>
          key.issuerId ===
            operationalIssuerId &&
          key.status ===
            "ACTIVE",
      );

    assert(
      keyA?.status ===
        "REVOKED" &&
      keyA.validUntil ===
        validSequence1.issuedAt &&
      keyB?.status ===
        "ACTIVE" &&
      keyB.validFrom ===
        validSequence1.issuedAt &&
      activeAfterValid1.length ===
        1 &&
      activeAfterValid1[0].signingKeyId ===
        materialB.signingKeyId &&
      trustAfterValid1.appliedTrustRecoveries?.length ===
        1 &&
      trustAfterValid1.trustRecoverySequences?.length ===
        1 &&
      trustAfterValid1.trustRecoverySequences[0].lastSequence ===
        1,
      "Production valid sequence 1 did not persist A REVOKED / B sole ACTIVE / replay sequence 1.",
    );

    assert(
      await snapshotRecoveryRoot() ===
        immutableRecoveryRoot,
      "Production valid sequence 1 mutated Recipient Recovery public root.",
    );

    let previousClockMs =
      await getClockHighWaterMs();

    console.log(
      "PASS: production bridge valid A -> B sequence 1 persisted A REVOKED / B sole ACTIVE",
    );

    const immutableTrustAfterValid1 =
      await snapshotRecipientTrust();

    // ========================================================
    // TEST 2 — EXACT PACKAGE REPLAY
    // ========================================================

    await waitForNextClockTick();

    assertRecoverySurfaceAlive(
      "before replay test",
    );

    const replayResult =
      await invokeProductionRecoveryBridge(
        trustedRecoveryWindow,
      );

    assert(
      !replayResult.success &&
      /replay|already\s+(?:been\s+)?applied/i.test(
        replayResult.error ??
        "",
      ),
      replayResult.success
        ? "Production Recovery replay unexpectedly succeeded."
        : `Production Recovery replay returned wrong failure: ${replayResult.error}`,
    );

    const trustAfterReplay =
      await snapshotRecipientTrust();

    assert(
      trustAfterReplay ===
        immutableTrustAfterValid1,
      "Production Recovery replay mutated recipient trust.",
    );

    const rootAfterReplay =
      await snapshotRecoveryRoot();

    assert(
      rootAfterReplay ===
        immutableRecoveryRoot,
      "Production Recovery replay mutated Recovery root.",
    );

    const replayClockMs =
      await getClockHighWaterMs();

    assert(
      replayClockMs >
        previousClockMs,
      "Production Recovery replay did not observe authoritative clock before replay rejection.",
    );

    previousClockMs =
      replayClockMs;

    console.log(
      "PASS: production bridge replay rejected with zero trust/root mutation after clock observation",
    );

    // ========================================================
    // TEST 3 — STALE SEQUENCE 1, NEW PACKAGE ID
    // ========================================================

    await waitForNextClockTick();

    assertRecoverySurfaceAlive(
      "before stale-sequence test",
    );

    const staleResult =
      await invokeProductionRecoveryBridge(
        trustedRecoveryWindow,
      );

    assert(
      !staleResult.success &&
      /stale|sequence/i.test(
        staleResult.error ??
        "",
      ),
      staleResult.success
        ? "Production stale Recovery sequence unexpectedly succeeded."
        : `Production stale Recovery returned wrong failure: ${staleResult.error}`,
    );

    assert(
      await snapshotRecipientTrust() ===
        immutableTrustAfterValid1 &&
      await snapshotRecoveryRoot() ===
        immutableRecoveryRoot,
      "Production stale Recovery mutated recipient trust or Recovery root.",
    );

    const staleClockMs =
      await getClockHighWaterMs();

    assert(
      staleClockMs >
        previousClockMs,
      "Production stale Recovery did not observe authoritative clock before sequence rejection.",
    );

    previousClockMs =
      staleClockMs;

    console.log(
      "PASS: production bridge stale sequence rejected with zero trust/root mutation after clock observation",
    );

    // ========================================================
    // TEST 4 — CRYPTOGRAPHICALLY VALID WRONG TARGET
    // ========================================================

    await waitForNextClockTick();

    assertRecoverySurfaceAlive(
      "before wrong-target test",
    );

    const wrongTargetResult =
      await invokeProductionRecoveryBridge(
        trustedRecoveryWindow,
      );

    assert(
      !wrongTargetResult.success &&
      /TARGET_MISMATCH|target/i.test(
        wrongTargetResult.error ??
        "",
      ),
      wrongTargetResult.success
        ? "Production wrong-target Recovery unexpectedly succeeded."
        : `Production wrong-target Recovery returned wrong failure: ${wrongTargetResult.error}`,
    );

    assert(
      await snapshotRecipientTrust() ===
        immutableTrustAfterValid1 &&
      await snapshotRecoveryRoot() ===
        immutableRecoveryRoot,
      "Production wrong-target Recovery mutated recipient trust or Recovery root.",
    );

    const wrongTargetClockMs =
      await getClockHighWaterMs();

    assert(
      wrongTargetClockMs >
        previousClockMs,
      "Production wrong-target Recovery did not observe authoritative clock before target rejection.",
    );

    previousClockMs =
      wrongTargetClockMs;

    console.log(
      "PASS: production bridge wrong native target rejected with zero trust/root mutation after clock observation",
    );

    // ========================================================
    // TEST 5 — TAMPERED SIGNATURE, VALID SEQUENCE 2 CONTENT
    // ========================================================

    await waitForNextClockTick();

    assertRecoverySurfaceAlive(
      "before tampered-signature test",
    );

    const tamperedResult =
      await invokeProductionRecoveryBridge(
        trustedRecoveryWindow,
      );

    assert(
      !tamperedResult.success &&
      /INVALID_SIGNATURE|signature verification failed|signature/i.test(
        tamperedResult.error ??
        "",
      ),
      tamperedResult.success
        ? "Production tampered Recovery unexpectedly succeeded."
        : `Production tampered Recovery returned wrong failure: ${tamperedResult.error}`,
    );

    assert(
      await snapshotRecipientTrust() ===
        immutableTrustAfterValid1 &&
      await snapshotRecoveryRoot() ===
        immutableRecoveryRoot,
      "Production tampered Recovery mutated recipient trust or Recovery root.",
    );

    const tamperedClockMs =
      await getClockHighWaterMs();

    assert(
      tamperedClockMs >
        previousClockMs,
      "Production tampered Recovery did not advance authoritative clock before signature rejection.",
    );

    previousClockMs =
      tamperedClockMs;

    console.log(
      "PASS: production bridge tampered signature rejected with zero trust/root mutation after clock advance",
    );

    // ========================================================
    // TEST 6 — ORIGINAL VALID SEQUENCE 2: B -> C
    //
    // This proves failed stale/wrong-target/tampered sequence-2
    // attempts did not consume recipient replay state.
    // ========================================================

    await waitForNextClockTick();

    assertRecoverySurfaceAlive(
      "before final valid sequence-2 test",
    );

    const valid2Result =
      await invokeProductionRecoveryBridge(
        trustedRecoveryWindow,
      );

    assert(
      valid2Result.success &&
      valid2Result.cancelled ===
        false &&
      valid2Result.applySummary !==
        undefined &&
      valid2Result.applySummary.packageId ===
        validSequence2.packageId &&
      valid2Result.applySummary.sequence ===
        2 &&
      valid2Result.applySummary.revokedSigningKeyId ===
        materialB.signingKeyId &&
      valid2Result.applySummary.activeSigningKeyId ===
        materialC.signingKeyId,
      valid2Result.success
        ? "Production valid sequence-2 Recovery summary is incorrect."
        : `Production valid sequence-2 Recovery failed: ${valid2Result.error}`,
    );

    const finalTrust =
      await loadFinoraRecipientTrustStore();

    assert(
      finalTrust !==
        undefined,
      "Recipient trust missing after final production Recovery sequence 2.",
    );

    const finalA =
      finalTrust.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const finalB =
      finalTrust.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    const finalC =
      finalTrust.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialC.signingKeyId,
      );

    const finalActiveKeys =
      finalTrust.trustedKeys.filter(
        (key) =>
          key.issuerId ===
            operationalIssuerId &&
          key.status ===
            "ACTIVE",
      );

    assert(
      finalA?.status ===
        "REVOKED" &&
      finalB?.status ===
        "REVOKED" &&
      finalB.validUntil ===
        validSequence2.issuedAt &&
      finalC?.status ===
        "ACTIVE" &&
      finalC.validFrom ===
        validSequence2.issuedAt &&
      finalC.validUntil ===
        undefined &&
      finalActiveKeys.length ===
        1 &&
      finalActiveKeys[0].signingKeyId ===
        materialC.signingKeyId &&
      finalTrust.appliedTrustRecoveries?.length ===
        2 &&
      finalTrust.appliedTrustRecoveries[0].packageId ===
        validSequence1.packageId &&
      finalTrust.appliedTrustRecoveries[1].packageId ===
        validSequence2.packageId &&
      finalTrust.trustRecoverySequences?.length ===
        1 &&
      finalTrust.trustRecoverySequences[0].lastSequence ===
        2,
      "Final production Recovery state is not A REVOKED / B REVOKED / C sole ACTIVE / replay sequence 2.",
    );

    assert(
      await snapshotRecoveryRoot() ===
        immutableRecoveryRoot,
      "Final production Recovery sequence 2 mutated Recipient Recovery public root.",
    );

    const finalClockMs =
      await getClockHighWaterMs();

    assert(
      finalClockMs >
        previousClockMs,
      "Final production valid Recovery sequence 2 did not advance authoritative clock.",
    );

    console.log(
      "PASS: final valid B -> C sequence 2 succeeded after rejected seq2 attempts",
    );

    console.log(
      "PASS: final recipient state is A REVOKED / B REVOKED / C sole ACTIVE / recovery cursor 2",
    );

    // --------------------------------------------------------
    // EXACT NATIVE PICKER OWNERSHIP
    // --------------------------------------------------------

    assert(
      (dialogInvocation as number) ===
        fixturePaths.length &&
      everyDialogOwnerExact &&
      everyDialogHadFinoraFilter,
      "Production cryptographic Recovery E2E did not use exact Recovery window / .finora picker boundary for every attempt.",
    );

    console.log(
      "PASS: all six cryptographic attempts traversed exact production Recovery native-picker ownership",
    );

    // --------------------------------------------------------
    // OFFLINE PRIVATE PERSISTENCE REMAINS ABSENT
    // --------------------------------------------------------

    assert(
      !existsSync(
        offlineRecoveryDirectory,
      ),
      "Recipient production Recovery execution recreated offline private authority persistence.",
    );

    console.log(
      "PASS: recipient production Recovery path never recreated offline private authority persistence",
    );

    assert(
      !unexpectedWindowAllClosed &&
      !unexpectedQuitAttempt &&
      recoverySurfaceFailure ===
        undefined,
      `Unexpected Electron lifecycle event occurred during completed Recovery E2E: windowAllClosed=${unexpectedWindowAllClosed}; quitAttempt=${unexpectedQuitAttempt}; recoverySurfaceFailure=${recoverySurfaceFailure ?? "none"}`,
    );

    console.log(
      "PASS: composite Recovery E2E completed without unexpected BrowserWindow/render-process/app-quit lifecycle events",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST RECOVERY PRODUCTION CRYPTOGRAPHIC BRIDGE E2E",
    );

    console.log(
      "============================================================",
    );
  } finally {
    e2eFinalizing =
      true;

    clearTimeout(
      e2eWatchdog,
    );

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
      recoveryWindow &&
      !recoveryWindow.isDestroyed()
    ) {
      recoveryWindow.destroy();
    }

    /*
     * Allow Chromium child-process handles associated with the
     * destroyed privileged renderer to settle before deleting the
     * isolated Electron userData tree.
     */
    await new Promise<void>(
      (resolve) => {
        setTimeout(
          resolve,
          100,
        );
      },
    );

    console.log(
      "PASS: isolated production Recovery cryptographic E2E in-process cleanup completed",
    );

    e2eCompleted =
      true;

    app.removeListener(
      "before-quit",
      preventUnexpectedE2EQuit,
    );

    app.removeListener(
      "window-all-closed",
      observeUnexpectedWindowAllClosed,
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
        "FAIL: FINORA RECIPIENT TRUST RECOVERY PRODUCTION CRYPTOGRAPHIC BRIDGE E2E",
        error,
      );

      app.exit(
        1,
      );
    },
  );