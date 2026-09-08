// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY GENERATOR / EXPORT SELFTEST
//
// REAL ELECTRON VERIFY:
//
// - Destroyed parent window rejects before Recovery issuance
// - Destroyed-window rejection creates no vault / ledger
// - First real native Save dialog cancellation consumes sequence 1
// - Cancellation writes no .finora artifact
// - Second real native Save dialog exports sequence 2
// - Missing extension is normalized to .finora
// - bytesWritten equals exact physical UTF-8 file size
// - Exported JSON is an exact structurally valid signed envelope
// - Exported package metadata matches generator result
// - Sequence ledger persists exact final sequence 2
// - No temporary export artifacts remain
// - No operational Control Center persistence is created
//
// USER INTERACTION:
//
// Dialog 1: click Cancel.
// Dialog 2: click Save without changing the proposed path.
//
// The selftest overrides only native-dialog defaultPath so the
// physical artifact can be verified inside isolated test storage.
// The actual Electron Save dialog remains authoritative.
// ============================================================

import {
  app,
  BrowserWindow,
  dialog,
  safeStorage,
} from "electron";

import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  generateFinoraControlCenterSigningMaterial,
} from "../control-center/finoraControlCenterCrypto.js";

import type {
  FinoraControlCenterSigningMaterial,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  generateFinoraWindowsInstallationBindingMaterial,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  validateFinoraRecipientTrustRecoverySignedEnvelope,
} from "../control/finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoverySignedEnvelope,
} from "../control/finoraRecipientTrustRecoveryContract.js";

import {
  serializeFinoraRecipientTrustRecoveryArtifact,
} from "./finoraRecipientTrustRecoveryArtifactWriter.js";

import {
  generateAndExportFinoraRecipientTrustRecovery,
} from "./finoraRecipientTrustRecoveryGenerator.js";

import type {
  FinoraRecipientTrustRecoveryIssueRequest,
} from "./finoraRecipientTrustRecoveryIssuer.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityVault,
} from "./finoraRecipientTrustRecoveryAuthorityVault.js";

import {
  loadFinoraRecipientTrustRecoverySequenceLedger,
} from "./finoraRecipientTrustRecoverySequenceLedger.js";

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
// REPLACEMENT KEY
// ============================================================

function createReplacementTrustedKey(
  material:
    FinoraControlCenterSigningMaterial,

  operationalIssuerId:
    string,

  validFrom:
    string,
):
  FinoraRecipientTrustRecoveryIssueRequest[
    "replacementTrustedKey"
  ] {
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
// SELFTEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryRoot =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recovery-generator-selftest-",
      ),
    );

  const temporaryUserData =
    join(
      temporaryRoot,
      "userData",
    );

  const exportDirectory =
    join(
      temporaryRoot,
      "exports",
    );

  let liveWindow:
    BrowserWindow |
    undefined;

  const originalShowSaveDialog =
    dialog.showSaveDialog.bind(
      dialog,
    );

  try {
    await mkdir(
      temporaryUserData,
      {
        recursive:
          true,
      },
    );

    await mkdir(
      exportDirectory,
      {
        recursive:
          true,
      },
    );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable for Recovery generator E2E.",
    );

    console.log(
      "PASS: isolated real Electron runtime + safeStorage available",
    );

    // --------------------------------------------------------
    // TEST WINDOWS
    // --------------------------------------------------------

    liveWindow =
      new BrowserWindow({
        width:
          560,

        height:
          240,

        show:
          true,

        title:
          "FINORA Recovery Export Selftest",

        webPreferences: {
          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true,
        },
      });

    await liveWindow.loadURL(
      "data:text/html;charset=utf-8," +
      encodeURIComponent(
        "<html><body style='font-family:sans-serif;padding:24px'><h3>FINORA Recovery Export Selftest</h3><p>Follow the Save dialog instructions shown in the terminal.</p></body></html>",
      ),
    );

    const destroyedWindow =
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

    destroyedWindow.destroy();

    // --------------------------------------------------------
    // FIXTURE MATERIAL
    // --------------------------------------------------------

    const baseNow =
      new Date();

    const installation =
      generateFinoraWindowsInstallationBindingMaterial(
        baseNow,
        "FINORA-INSTALLATION-RECOVERY-GENERATOR-SELFTEST",
      );

    const target:
      FinoraRecipientTrustRecoveryIssueRequest[
        "target"
      ] = {
        installationId:
          installation.installationId,

        bindingKeyId:
          installation.bindingKeyId,

        fingerprintAlgorithm:
          installation.fingerprintAlgorithm,

        publicKeyFingerprint:
          installation.publicKeyFingerprint,
      };

    const operationalIssuerId =
      "FINORA-CONTROL-ISSUER-RECOVERY-GENERATOR-SELFTEST";

    const compromisedA =
      generateFinoraControlCenterSigningMaterial();

    const replacementB =
      generateFinoraControlCenterSigningMaterial();

    const replacementC =
      generateFinoraControlCenterSigningMaterial();

    // --------------------------------------------------------
    // DESTROYED WINDOW — MUST NOT ISSUE
    //
    // Use a structurally invalid replacement validFrom here
    // intentionally; window rejection must occur before issuer
    // preflight, vault creation, or sequence reservation.
    // --------------------------------------------------------

    const destroyedRequest:
      FinoraRecipientTrustRecoveryIssueRequest = {
        target,

        operationalIssuerId,

        expectedActiveSigningKeyId:
          compromisedA.signingKeyId,

        replacementTrustedKey:
          createReplacementTrustedKey(
            replacementB,
            operationalIssuerId,
            baseNow.toISOString(),
          ),
      };

    const destroyedResult =
      await generateAndExportFinoraRecipientTrustRecovery(
        destroyedWindow,
        destroyedRequest,
        baseNow,
      );

    assert(
      !destroyedResult.success &&
      destroyedResult.error.includes(
        "window is no longer available",
      ),
      "Destroyed Recovery export window was not rejected before issuance.",
    );

    const vaultAfterDestroyed =
      await loadFinoraRecipientTrustRecoveryAuthorityVault();

    const ledgerAfterDestroyed =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      vaultAfterDestroyed ===
        undefined &&
      ledgerAfterDestroyed ===
        undefined,
      "Destroyed-window rejection created Recovery authority persistence.",
    );

    console.log(
      "PASS: destroyed parent window rejected before vault creation or sequence reservation",
    );

    // --------------------------------------------------------
    // NATIVE DIALOG DEFAULT-PATH WRAPPER
    //
    // Dialog remains real Electron dialog. Only defaultPath is
    // replaced with deterministic isolated test destinations.
    // --------------------------------------------------------

    let dialogInvocation =
      0;

    const cancelDefaultPath =
      join(
        exportDirectory,
        "cancel-sequence-1",
      );

    const saveDefaultPath =
      join(
        exportDirectory,
        "recipient-trust-recovery-sequence-2",
      );

    dialog.showSaveDialog =
      (async (
        parentWindow:
          BrowserWindow,

        options:
          Electron.SaveDialogOptions,
      ) => {
        dialogInvocation +=
          1;

        const forcedDefaultPath =
          dialogInvocation ===
            1
            ? cancelDefaultPath
            : saveDefaultPath;

        return originalShowSaveDialog(
          parentWindow,
          {
            ...options,

            defaultPath:
              forcedDefaultPath,
          },
        );
      }) as typeof dialog.showSaveDialog;

    // --------------------------------------------------------
    // RECOVERY AUTHORITY CREATION
    //
    // We intentionally let the first real generation call create
    // the authority. Its exact createdAt is therefore unknown
    // until after cancellation, so the first supplied now must be
    // comfortably ahead of current wall clock.
    // --------------------------------------------------------

    const cancelIssueDate =
      new Date(
        Date.now() +
          5 *
          60_000,
      );

    const cancelIssuedAt =
      cancelIssueDate.toISOString();

    const cancelRequest:
      FinoraRecipientTrustRecoveryIssueRequest = {
        target,

        operationalIssuerId,

        expectedActiveSigningKeyId:
          compromisedA.signingKeyId,

        replacementTrustedKey:
          createReplacementTrustedKey(
            replacementB,
            operationalIssuerId,
            cancelIssuedAt,
          ),
      };

    console.log(
      "",
    );

    console.log(
      "ACTION REQUIRED: Native Save dialog 1/2 — CLICK CANCEL.",
    );

    const cancelResult =
      await generateAndExportFinoraRecipientTrustRecovery(
        liveWindow,
        cancelRequest,
        cancelIssueDate,
      );

    assert(
      cancelResult.success &&
      cancelResult.cancelled,
      "First Recovery native export was expected to be cancelled.",
    );

    assert(
      cancelResult.sequence ===
        1 &&
      cancelResult.issuedAt ===
        cancelIssuedAt,
      "Cancelled Recovery generation did not consume exact sequence 1.",
    );

    assert(
      dialogInvocation ===
        1,
      "Cancelled Recovery generation did not invoke exactly one native Save dialog.",
    );

    const afterCancelLedger =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      afterCancelLedger !==
        undefined &&
      afterCancelLedger.scopes.length ===
        1 &&
      afterCancelLedger.scopes[0]
        .lastReservedSequence ===
        1 &&
      afterCancelLedger.highWaterAt ===
        cancelIssuedAt,
      "Cancelled Recovery export did not persist exact sequence-1 ledger state.",
    );

    const filesAfterCancel =
      await readdir(
        exportDirectory,
      );

    assert(
      filesAfterCancel.length ===
        0,
      `Cancelled Recovery export unexpectedly wrote files: ${JSON.stringify(filesAfterCancel)}`,
    );

    console.log(
      "PASS: native Save cancellation consumed sequence 1 and wrote zero artifact bytes",
    );

    // --------------------------------------------------------
    // SECOND GENERATION — REAL NATIVE SAVE
    //
    // Sequence 1 package was cancelled and never applied.
    // Therefore expected ACTIVE remains compromised A. We issue
    // A -> replacement C as sequence 2.
    // --------------------------------------------------------

    const saveIssueDate =
      new Date(
        cancelIssueDate.getTime() +
          60_000,
      );

    const saveIssuedAt =
      saveIssueDate.toISOString();

    const saveRequest:
      FinoraRecipientTrustRecoveryIssueRequest = {
        target,

        operationalIssuerId,

        expectedActiveSigningKeyId:
          compromisedA.signingKeyId,

        replacementTrustedKey:
          createReplacementTrustedKey(
            replacementC,
            operationalIssuerId,
            saveIssuedAt,
          ),
      };

    console.log(
      "",
    );

    console.log(
      "ACTION REQUIRED: Native Save dialog 2/2 — CLICK SAVE WITHOUT CHANGING PATH OR FILE NAME.",
    );

    const saveResult =
      await generateAndExportFinoraRecipientTrustRecovery(
        liveWindow,
        saveRequest,
        saveIssueDate,
      );

    assert(
      saveResult.success &&
      !saveResult.cancelled,
      "Second Recovery native export was expected to save successfully.",
    );

    assert(
      saveResult.sequence ===
        2 &&
      saveResult.issuedAt ===
        saveIssuedAt,
      "Successful Recovery export did not progress to exact sequence 2.",
    );

    assert(
      (dialogInvocation as number) ===
        2,
      "Recovery generator did not invoke exactly two native Save dialogs.",
    );

    // --------------------------------------------------------
    // EXTENSION ENFORCEMENT
    // --------------------------------------------------------

    const expectedFileName =
      "recipient-trust-recovery-sequence-2.finora";

    const expectedFilePath =
      join(
        exportDirectory,
        expectedFileName,
      );

    assert(
      saveResult.fileName ===
        expectedFileName,
      "Recovery artifact writer did not enforce the expected .finora file name.",
    );

    const physicalStat =
      await stat(
        expectedFilePath,
      );

    assert(
      physicalStat.isFile(),
      "Recovery .finora export was not created as a physical file.",
    );

    console.log(
      "PASS: native export enforced .finora extension at deterministic isolated path",
    );

    // --------------------------------------------------------
    // EXACT FILE BYTES
    // --------------------------------------------------------

    const physicalBytes =
      await readFile(
        expectedFilePath,
      );

    assert(
      physicalBytes.byteLength ===
        saveResult.bytesWritten,
      "Recovery generator bytesWritten does not match physical file size.",
    );

    console.log(
      "PASS: Recovery export bytesWritten exactly matches physical UTF-8 file size",
    );

    // --------------------------------------------------------
    // PARSE + STRUCTURAL VALIDATION
    // --------------------------------------------------------

    const serializedText =
      physicalBytes.toString(
        "utf8",
      );

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          serializedText,
        );
    } catch {
      throw new Error(
        "Exported Recovery .finora file does not contain valid JSON.",
      );
    }

    validateFinoraRecipientTrustRecoverySignedEnvelope(
      parsed,
    );

    const exportedRecovery =
      parsed as
        FinoraRecipientTrustRecoverySignedEnvelope;

    assert(
      exportedRecovery.packageId ===
        saveResult.packageId &&
      exportedRecovery.sequence ===
        2 &&
      exportedRecovery.issuedAt ===
        saveIssuedAt &&
      exportedRecovery.payload.issuedAt ===
        saveIssuedAt &&
      exportedRecovery.payload.operationalIssuerId ===
        operationalIssuerId &&
      exportedRecovery.payload.expectedActiveSigningKeyId ===
        compromisedA.signingKeyId &&
      exportedRecovery.payload.replacementTrustedKey
        .signingKeyId ===
        replacementC.signingKeyId,
      "Exported Recovery .finora package metadata does not match generator result/request.",
    );

    const canonicalSerialization =
      serializeFinoraRecipientTrustRecoveryArtifact(
        exportedRecovery,
      );

    assert(
      canonicalSerialization.content ===
        serializedText &&
      canonicalSerialization.bytes ===
        saveResult.bytesWritten,
      "Exported Recovery artifact does not equal canonical writer serialization.",
    );

    console.log(
      "PASS: exported .finora readback is exact canonical signed Recovery envelope",
    );

    // --------------------------------------------------------
    // FINAL SEQUENCE STATE
    // --------------------------------------------------------

    const finalLedger =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      finalLedger !==
        undefined &&
      finalLedger.scopes.length ===
        1 &&
      finalLedger.scopes[0]
        .lastReservedSequence ===
        2 &&
      finalLedger.highWaterAt ===
        saveIssuedAt,
      "Recovery sequence ledger did not persist exact final sequence-2 state.",
    );

    console.log(
      "PASS: cancelled sequence 1 plus successful sequence 2 persisted exact replay progression",
    );

    // --------------------------------------------------------
    // RECOVERY AUTHORITY EXISTS
    // --------------------------------------------------------

    const finalAuthority =
      await loadFinoraRecipientTrustRecoveryAuthorityVault();

    assert(
      finalAuthority !==
        undefined &&
      finalAuthority.recoveryAuthorityId ===
        saveResult.recoveryAuthorityId &&
      finalAuthority.signingKeyId ===
        saveResult.signingKeyId,
      "Exported Recovery generator metadata does not match persisted independent Recovery root.",
    );

    console.log(
      "PASS: exported package authority metadata matches independent persisted Recovery root",
    );

    // --------------------------------------------------------
    // EXPORT DIRECTORY CLEANLINESS
    // --------------------------------------------------------

    const finalExportEntries =
      (
        await readdir(
          exportDirectory,
        )
      ).sort();

    assert(
      JSON.stringify(
        finalExportEntries,
      ) ===
        JSON.stringify([
          expectedFileName,
        ]),
      `Recovery export directory contains unexpected artifacts: ${JSON.stringify(finalExportEntries)}`,
    );

    assert(
      finalExportEntries.every(
        (entry) =>
          !entry.endsWith(
            ".tmp",
          ),
      ),
      "Recovery artifact writer left a temporary export file.",
    );

    console.log(
      "PASS: Recovery native export left exactly one final .finora artifact and zero temp files",
    );

    // --------------------------------------------------------
    // NO OPERATIONAL CONTROL CENTER PERSISTENCE
    // --------------------------------------------------------

    const finoraDirectory =
      join(
        temporaryUserData,
        "finora",
      );

    const finoraEntries =
      (
        await readdir(
          finoraDirectory,
        )
      ).sort();

    assert(
      JSON.stringify(
        finoraEntries,
      ) ===
        JSON.stringify([
          "recovery",
        ]),
      `Recovery generator created unexpected FINORA persistence: ${JSON.stringify(finoraEntries)}`,
    );

    const recoveryEntries =
      (
        await readdir(
          join(
            finoraDirectory,
            "recovery",
          ),
        )
      ).sort();

    assert(
      JSON.stringify(
        recoveryEntries,
      ) ===
        JSON.stringify([
          "finora-recipient-trust-recovery-authority-vault.bin",
          "finora-recipient-trust-recovery-sequence-ledger.bin",
        ]),
      `Recovery authority persistence set is unexpected: ${JSON.stringify(recoveryEntries)}`,
    );

    console.log(
      "PASS: Recovery generator created no operational Control Center persistence surface",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA OFFLINE RECIPIENT TRUST RECOVERY GENERATOR / NATIVE EXPORT E2E",
    );

    console.log(
      "============================================================",
    );
  } finally {
    dialog.showSaveDialog =
      originalShowSaveDialog as
        typeof dialog.showSaveDialog;

    if (
      liveWindow &&
      !liveWindow.isDestroyed()
    ) {
      liveWindow.destroy();
    }

    await rm(
      temporaryRoot,
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
      "PASS: isolated Recovery generator/export E2E storage deleted",
    );
  }
}

// ============================================================
// RUN
// ============================================================

void runSelfTest()
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
        "FAIL: FINORA OFFLINE RECIPIENT TRUST RECOVERY GENERATOR / NATIVE EXPORT E2E",
        error,
      );

      app.exit(
        1,
      );
    },
  );