/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST RECOVERY IMPORT COORDINATOR SELF TEST

   VERIFY:

   - Isolated real Electron userData
   - Real native installation binding
   - Real fingerprint-pinned recovery authority bootstrap
   - Operational recipient trust ACTIVE key A
   - Real generated signed RECIPIENT_TRUST_RECOVERY .finora
   - Real Electron native dialog path
   - Native transport reads exact generated .finora bytes
   - Authoritative clock high-water advances before apply
   - Valid import persists A REVOKED / B sole ACTIVE
   - Recovery replay ledger + scoped cursor persist
   - Cancel occurs before clock/apply with zero mutation
   - Persisted clock rollback rejects before trust apply
   - Rollback preserves future high-water exactly
   - Tampered recovery advances accepted clock observation
     but leaves recipient trust unchanged
   - Recovery authority remains read-only throughout

   IMPORTANT:

   Native dialog defaultPath is injected only by this isolated
   runtime selftest. The production transport still owns file
   selection and returns only parsed signedRecovery content.

   No renderer supplies:
   - filepath
   - package bytes
   - trusted keys
   - recovery authority
   - installation target
=========================================================== */

import {
  app,
  BrowserWindow,
  dialog,
  safeStorage,
} from "electron";

import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
} from "electron";

import {
  generateKeyPairSync,
  sign as nodeSign,
} from "node:crypto";

import type {
  KeyObject,
} from "node:crypto";

import {
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
  resolve,
} from "node:path";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  createFinoraInstallationBindingFingerprint,
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
  importFinoraRecipientTrustRecoveryFromNativeDialog,
} from "./finoraRecipientTrustRecoveryImportCoordinator.js";

import {
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  createFinoraRecipientTrustRecoveryPayloadDigest,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoveryPayload,
  FinoraRecipientTrustRecoverySignedEnvelope,
  FinoraRecipientTrustRecoveryUnsignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustTransitionTarget,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

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
// SIGNING MATERIAL
// ============================================================

interface TestSigningMaterial {
  privateKey:
    KeyObject;

  publicKey:
    string;

  fingerprint:
    string;

  signingKeyId:
    string;
}

function createSigningMaterial():
  TestSigningMaterial {
  const pair =
    generateKeyPairSync(
      "ec",
      {
        namedCurve:
          "prime256v1",
      },
    );

  const publicKey =
    pair.publicKey
      .export({
        type:
          "spki",

        format:
          "der",
      })
      .toString(
        "base64",
      );

  const fingerprint =
    createFinoraInstallationBindingFingerprint(
      publicKey,
    );

  return {
    privateKey:
      pair.privateKey,

    publicKey,

    fingerprint,

    signingKeyId:
      createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
        fingerprint,
      ),
  };
}

// ============================================================
// TRUSTED KEY
// ============================================================

function createActiveTrustedKey(
  issuerId:
    string,
  material:
    TestSigningMaterial,
  validFrom:
    string,
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId,

    signingKeyId:
      material.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      material.publicKey,

    status:
      "ACTIVE",

    validFrom,
  };
}

// ============================================================
// RECOVERY ENVELOPE
// ============================================================

function createRecoveryUnsignedEnvelope(
  input: {
    packageId:
      string;

    recoveryAuthorityId:
      string;

    recoverySigningKeyId:
      string;

    operationalIssuerId:
      string;

    expectedActiveSigningKeyId:
      string;

    replacementTrustedKey:
      FinoraBranchTrustedControlPublicKey;

    target:
      FinoraRecipientTrustTransitionTarget;

    issuedAt:
      string;

    sequence:
      number;
  },
): FinoraRecipientTrustRecoveryUnsignedEnvelope {
  const payload:
    FinoraRecipientTrustRecoveryPayload = {
      recoveryFormat:
        "FINORA_RECIPIENT_TRUST_RECOVERY_V1",

      action:
        "REPLACE_ACTIVE",

      operationalIssuerId:
        input.operationalIssuerId,

      expectedActiveSigningKeyId:
        input.expectedActiveSigningKeyId,

      replacementTrustedKey:
        input.replacementTrustedKey,

      issuedAt:
        input.issuedAt,

      schemaVersion:
        1,
    };

  return {
    packageId:
      input.packageId,

    purpose:
      "RECIPIENT_TRUST_RECOVERY",

    target:
      input.target,

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload,

    schemaVersion:
      1,

    issuer: {
      type:
        "FINORA_RECOVERY_AUTHORITY",

      recoveryAuthorityId:
        input.recoveryAuthorityId,

      signingKeyId:
        input.recoverySigningKeyId,
    },

    payloadDigest:
      createFinoraRecipientTrustRecoveryPayloadDigest(
        payload,
      ),
  };
}

function signRecoveryEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustRecoveryUnsignedEnvelope,
  privateKey:
    KeyObject,
): FinoraRecipientTrustRecoverySignedEnvelope {
  const canonicalEnvelope =
    canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
      unsignedEnvelope,
    );

  const signature =
    nodeSign(
      "sha256",
      Buffer.from(
        canonicalEnvelope,
        "utf8",
      ),
      {
        key:
          privateKey,

        dsaEncoding:
          "ieee-p1363",
      },
    );

  assert(
    signature.byteLength ===
      64,
    "Recovery import E2E signature was not 64-byte IEEE-P1363.",
  );

  return {
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
        signature.toString(
          "base64",
        ),
    },
  };
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

async function snapshotRecoveryAuthority():
  Promise<string> {
  const state =
    await loadFinoraRecipientTrustRecoveryAuthorityStore();

  assert(
    state !==
      undefined,
    "Recovery Authority Store unexpectedly missing.",
  );

  return JSON.stringify(
    state,
  );
}

async function snapshotClock():
  Promise<string> {
  const state =
    await loadFinoraClockHighWaterState();

  assert(
    state !==
      undefined,
    "Clock high-water state unexpectedly missing.",
  );

  return JSON.stringify(
    state,
  );
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
        "finora-recipient-recovery-import-e2e-",
      ),
    );

  let parentWindow:
    BrowserWindow |
    undefined;

  let originalDialogDescriptor:
    PropertyDescriptor |
    undefined;

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
      "Electron safeStorage is unavailable.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // NATIVE INSTALLATION
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

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
      "PASS: authoritative native installation binding created",
    );

    // --------------------------------------------------------
    // AUTHORITIES
    // --------------------------------------------------------

    const recoveryMaterial =
      createSigningMaterial();

    const materialA =
      createSigningMaterial();

    const materialB =
      createSigningMaterial();

    const materialC =
      createSigningMaterial();

    const recoveryAuthorityId =
      "FINORA-RECOVERY-AUTHORITY-NATIVE-IMPORT-E2E";

    const operationalIssuerId =
      "FINORA-CONTROL-CENTER-NATIVE-RECOVERY-E2E";

    // --------------------------------------------------------
    // RECOVERY ROOT BOOTSTRAP
    // --------------------------------------------------------

    const recoveryBootstrap =
      await bootstrapFinoraRecipientTrustRecoveryAuthority({
        recoveryAuthorityId,

        signingKeyId:
          recoveryMaterial.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          recoveryMaterial.publicKey,

        expectedPublicKeyFingerprint:
          recoveryMaterial.fingerprint,
      });

    assert(
      recoveryBootstrap.success,
      recoveryBootstrap.success
        ? "Recovery bootstrap returned invalid success."
        : recoveryBootstrap.error,
    );

    const recoveryAuthority =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();

    assert(
      recoveryAuthority !==
        undefined &&
      recoveryAuthority.installation.installationId ===
        nativeBinding.installationId &&
      recoveryAuthority.authority.recoveryAuthorityId ===
        recoveryAuthorityId,
      "Recovery root did not bind to exact native installation.",
    );

    console.log(
      "PASS: independent fingerprint-pinned recovery authority provisioned",
    );

    // --------------------------------------------------------
    // OPERATIONAL TRUST A
    // --------------------------------------------------------

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
          materialA.fingerprint,
      });

    assert(
      trustBootstrap.success,
      trustBootstrap.success
        ? "Operational trust bootstrap returned invalid success."
        : trustBootstrap.error,
    );

    console.log(
      "PASS: operational recipient trust bootstrapped with ACTIVE key A",
    );

    // --------------------------------------------------------
    // TIMES
    // --------------------------------------------------------

    const provisionedAtMs =
      Date.parse(
        recoveryAuthority.provisionedAt,
      );

    assert(
      Number.isFinite(
        provisionedAtMs,
      ),
      "Recovery Authority provisionedAt is invalid.",
    );

    const recoveryIssuedAt =
      new Date(
        provisionedAtMs +
        1_000,
      ).toISOString();

    const validAcceptedAt =
      new Date(
        provisionedAtMs +
        2_000,
      );

    // --------------------------------------------------------
    // VALID SIGNED RECOVERY FILE
    // --------------------------------------------------------

    const replacementB =
      createActiveTrustedKey(
        operationalIssuerId,
        materialB,
        recoveryIssuedAt,
      );

    const validRecovery =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECOVERY-NATIVE-IMPORT-E2E-0001",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialA.signingKeyId,

          replacementTrustedKey:
            replacementB,

          target,

          issuedAt:
            recoveryIssuedAt,

          sequence:
            1,
        }),
        recoveryMaterial.privateKey,
      );

    const validRaw =
      JSON.stringify(
        validRecovery,
        null,
        2,
      );

    const validFilePath =
      join(
        temporaryUserData,
        "FINORA-RECOVERY-NATIVE-IMPORT-E2E.finora",
      );

    await writeFile(
      validFilePath,
      validRaw,
      {
        encoding:
          "utf8",
      },
    );

    const validBytes =
      Buffer.byteLength(
        validRaw,
        "utf8",
      );

    console.log(
      "PASS: valid signed recovery .finora fixture created",
    );

    // --------------------------------------------------------
    // BROWSER WINDOW
    // --------------------------------------------------------

    parentWindow =
      new BrowserWindow({
        width:
          760,

        height:
          320,

        show:
          true,

        webPreferences: {
          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true,
        },
      });

    await parentWindow.loadURL(
      "data:text/html;charset=utf-8," +
      encodeURIComponent(
        "<html><body style='font-family:sans-serif;padding:24px'><h2>FINORA Recovery Import E2E</h2><p>Follow the PowerShell console instructions for each native file dialog.</p></body></html>",
      ),
    );

    // --------------------------------------------------------
    // NATIVE DIALOG DEFAULTPATH TEST WRAPPER
    //
    // Production showOpenDialog remains the actual picker.
    // This wrapper injects only the generated selftest defaultPath.
    // --------------------------------------------------------

    const runtimeDialog =
      dialog;

    originalDialogDescriptor =
      Object.getOwnPropertyDescriptor(
        runtimeDialog,
        "showOpenDialog",
      );

    assert(
      originalDialogDescriptor !==
        undefined,
      "Electron dialog.showOpenDialog descriptor is unavailable for recovery import E2E.",
    );

    const originalShowOpenDialog =
      runtimeDialog.showOpenDialog.bind(
        runtimeDialog,
      );

    let dialogDefaultPath:
      string | undefined;

    let dialogInstruction =
      "";

    let lastDialogResult:
      OpenDialogReturnValue | undefined;

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
              OpenDialogOptions,
          ): Promise<
            OpenDialogReturnValue
          > => {
            assert(
              dialogDefaultPath !==
                undefined,
              "Recovery import E2E dialog defaultPath is missing.",
            );

            console.log(
              "",
            );

            console.log(
              "------------------------------------------------------------",
            );

            console.log(
              dialogInstruction,
            );

            console.log(
              "Default file:",
              dialogDefaultPath,
            );

            console.log(
              "------------------------------------------------------------",
            );

            const result =
              await originalShowOpenDialog(
                ownerWindow,
                {
                  ...options,

                  defaultPath:
                    dialogDefaultPath,
                },
              );

            lastDialogResult =
              result;

            return result;
          },
      },
    );

    // --------------------------------------------------------
    // TEST 1 — CANCEL BEFORE CLOCK / APPLY
    // --------------------------------------------------------

    dialogDefaultPath =
      validFilePath;

    dialogInstruction =
      "DIALOG TEST 1/4: CLICK CANCEL. Do not import the file.";

    lastDialogResult =
      undefined;

    const trustBeforeCancel =
      await snapshotRecipientTrust();

    const rootBeforeCancel =
      await snapshotRecoveryAuthority();

    const clockBeforeCancel =
      await snapshotClock();

    const cancelResult =
      await importFinoraRecipientTrustRecoveryFromNativeDialog(
        parentWindow,
        validAcceptedAt,
      );

    assert(
      cancelResult.success &&
      cancelResult.cancelled,
      "Native Recovery import cancel did not return the cancelled result.",
    );

    assert(
      (lastDialogResult as OpenDialogReturnValue | undefined)?.canceled ===
        true,
      "Native dialog was not actually cancelled.",
    );

    assert(
      await snapshotRecipientTrust() ===
        trustBeforeCancel &&
      await snapshotRecoveryAuthority() ===
        rootBeforeCancel &&
      await snapshotClock() ===
        clockBeforeCancel,
      "Cancelled Recovery import mutated trust, recovery root or clock high-water.",
    );

    console.log(
      "PASS: native dialog cancel returned before clock/apply with zero mutation",
    );

    // --------------------------------------------------------
    // TEST 2 — VALID NATIVE IMPORT
    // --------------------------------------------------------

    dialogDefaultPath =
      validFilePath;

    dialogInstruction =
      "DIALOG TEST 2/4: IMPORT the preselected valid FINORA recovery .finora file.";

    lastDialogResult =
      undefined;

    const rootBeforeValidImport =
      await snapshotRecoveryAuthority();

    const validImportResult =
      await importFinoraRecipientTrustRecoveryFromNativeDialog(
        parentWindow,
        validAcceptedAt,
      );

    assert(
      validImportResult.success &&
      !validImportResult.cancelled,
      validImportResult.success
        ? "Valid native Recovery import unexpectedly cancelled."
        : validImportResult.error,
    );

    assert(
      lastDialogResult !==
        undefined &&
      !(lastDialogResult as OpenDialogReturnValue).canceled &&
      (lastDialogResult as OpenDialogReturnValue).filePaths.length ===
        1 &&
      resolve(
        (lastDialogResult as OpenDialogReturnValue).filePaths[0],
      ).toLowerCase() ===
        resolve(
          validFilePath,
        ).toLowerCase(),
      "Native dialog did not select the exact generated recovery .finora path.",
    );

    assert(
      validImportResult.fileName ===
        "FINORA-RECOVERY-NATIVE-IMPORT-E2E.finora" &&
      validImportResult.bytesRead ===
        validBytes &&
      validImportResult.applySummary.packageId ===
        validRecovery.packageId &&
      validImportResult.applySummary.action ===
        "REPLACE_ACTIVE" &&
      validImportResult.applySummary.revokedSigningKeyId ===
        materialA.signingKeyId &&
      validImportResult.applySummary.activeSigningKeyId ===
        materialB.signingKeyId &&
      validImportResult.applySummary.sequence ===
        1 &&
      validImportResult.applySummary.installationId ===
        nativeBinding.installationId &&
      validImportResult.applySummary.appliedAt ===
        validAcceptedAt.toISOString(),
      "Native Recovery coordinator returned incorrect file/apply summary.",
    );

    const afterValidImport =
      await loadFinoraRecipientTrustStore();

    assert(
      afterValidImport !==
        undefined,
      "Recipient trust missing after valid native Recovery import.",
    );

    const keyA =
      afterValidImport.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const keyB =
      afterValidImport.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    const activeKeys =
      afterValidImport.trustedKeys.filter(
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
        recoveryIssuedAt &&
      keyB?.status ===
        "ACTIVE" &&
      keyB.validFrom ===
        recoveryIssuedAt &&
      keyB.validUntil ===
        undefined &&
      activeKeys.length ===
        1 &&
      activeKeys[0].signingKeyId ===
        materialB.signingKeyId &&
      afterValidImport.appliedTrustRecoveries?.length ===
        1 &&
      afterValidImport.appliedTrustRecoveries[0].packageId ===
        validRecovery.packageId &&
      afterValidImport.trustRecoverySequences?.length ===
        1 &&
      afterValidImport.trustRecoverySequences[0].lastSequence ===
        1,
      "Valid native Recovery import did not persist A REVOKED / B ACTIVE / recovery replay state.",
    );

    const clockAfterValid =
      await loadFinoraClockHighWaterState();

    assert(
      clockAfterValid !==
        undefined &&
      clockAfterValid.installationId ===
        nativeBinding.installationId &&
      clockAfterValid.highWaterAt ===
        validAcceptedAt.toISOString(),
      "Valid native Recovery import did not advance authoritative high-water to accepted observation.",
    );

    assert(
      await snapshotRecoveryAuthority() ===
        rootBeforeValidImport,
      "Valid native Recovery import mutated independently provisioned recovery authority.",
    );

    console.log(
      "PASS: native .finora -> authoritative clock -> REPLACE_ACTIVE chain persisted A REVOKED / B sole ACTIVE",
    );

    console.log(
      "PASS: native transport returned exact generated recovery filename and UTF-8 byte count",
    );

    console.log(
      "PASS: authoritative clock high-water advanced before successful recovery apply",
    );

    // --------------------------------------------------------
    // TEST 3 — CLOCK ROLLBACK BEFORE APPLY
    //
    // Use same valid file. If clock were not first, this would
    // reach replay rejection. Persisted rollback must stop earlier.
    // --------------------------------------------------------

    const trustBeforeRollback =
      await snapshotRecipientTrust();

    const rootBeforeRollback =
      await snapshotRecoveryAuthority();

    const futureHighWaterAt =
      new Date(
        validAcceptedAt.getTime() +
        10_000,
      ).toISOString();

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        nativeBinding.installationId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededFutureClock =
      await loadFinoraClockHighWaterState();

    assert(
      seededFutureClock !==
        undefined &&
      seededFutureClock.highWaterAt ===
        futureHighWaterAt,
      "Future clock high-water rollback fixture was not persisted.",
    );

    dialogDefaultPath =
      validFilePath;

    dialogInstruction =
      "DIALOG TEST 3/4: IMPORT the same valid recovery file. Expected result is CLOCK ROLLBACK rejection before apply.";

    lastDialogResult =
      undefined;

    const rollbackObservedAt =
      new Date(
        validAcceptedAt.getTime() +
        5_000,
      );

    const rollbackResult =
      await importFinoraRecipientTrustRecoveryFromNativeDialog(
        parentWindow,
        rollbackObservedAt,
      );

    assert(
      !rollbackResult.success &&
      /clock rollback/i.test(
        rollbackResult.error,
      ),
      rollbackResult.success
        ? "Recovery import unexpectedly succeeded during clock rollback."
        : `Recovery import returned wrong rollback error: ${rollbackResult.error}`,
    );

    assert(
      lastDialogResult !==
        undefined &&
      !(lastDialogResult as OpenDialogReturnValue).canceled,
      "Clock rollback E2E did not pass through the native file picker.",
    );

    assert(
      await snapshotRecipientTrust() ===
        trustBeforeRollback &&
      await snapshotRecoveryAuthority() ===
        rootBeforeRollback,
      "Clock rollback rejection mutated recipient trust or recovery authority.",
    );

    const clockAfterRollback =
      await loadFinoraClockHighWaterState();

    assert(
      clockAfterRollback !==
        undefined &&
      clockAfterRollback.highWaterAt ===
        futureHighWaterAt,
      "Clock rollback rejection mutated persisted future high-water state.",
    );

    console.log(
      "PASS: native Recovery import rejected persisted clock rollback before trust apply",
    );

    console.log(
      "PASS: rollback rejection preserved recipient trust, recovery root and future high-water exactly",
    );

    // --------------------------------------------------------
    // TAMPERED B -> C RECOVERY FIXTURE
    //
    // Clock observation should be accepted/advanced first.
    // Signature failure must then preserve recipient trust.
    // --------------------------------------------------------

    const tamperedIssuedAt =
      new Date(
        validAcceptedAt.getTime() +
        1_000,
      ).toISOString();

    const replacementC =
      createActiveTrustedKey(
        operationalIssuerId,
        materialC,
        tamperedIssuedAt,
      );

    const signedBtoC =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECOVERY-NATIVE-IMPORT-E2E-TAMPER",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialB.signingKeyId,

          replacementTrustedKey:
            replacementC,

          target,

          issuedAt:
            tamperedIssuedAt,

          sequence:
            2,
        }),
        recoveryMaterial.privateKey,
      );

    const tamperedSignatureBytes =
      Buffer.from(
        signedBtoC.signature.value,
        "base64",
      );

    tamperedSignatureBytes[0] =
      tamperedSignatureBytes[0] ^
      0x01;

    const tamperedRecovery:
      FinoraRecipientTrustRecoverySignedEnvelope = {
        ...signedBtoC,

        signature: {
          ...signedBtoC.signature,

          value:
            tamperedSignatureBytes.toString(
              "base64",
            ),
        },
      };

    const tamperedRaw =
      JSON.stringify(
        tamperedRecovery,
        null,
        2,
      );

    const tamperedFilePath =
      join(
        temporaryUserData,
        "FINORA-RECOVERY-NATIVE-IMPORT-E2E-TAMPER.finora",
      );

    await writeFile(
      tamperedFilePath,
      tamperedRaw,
      {
        encoding:
          "utf8",
      },
    );

    // --------------------------------------------------------
    // TEST 4 — TAMPERED RECOVERY AFTER ACCEPTED CLOCK ADVANCE
    // --------------------------------------------------------

    const trustBeforeTamper =
      await snapshotRecipientTrust();

    const rootBeforeTamper =
      await snapshotRecoveryAuthority();

    const tamperedAcceptedAt =
      new Date(
        Date.parse(
          futureHighWaterAt,
        ) +
        1_000,
      );

    dialogDefaultPath =
      tamperedFilePath;

    dialogInstruction =
      "DIALOG TEST 4/4: IMPORT the preselected TAMPERED recovery .finora file. Expected result is signature rejection AFTER clock advance.";

    lastDialogResult =
      undefined;

    const tamperedResult =
      await importFinoraRecipientTrustRecoveryFromNativeDialog(
        parentWindow,
        tamperedAcceptedAt,
      );

    assert(
      !tamperedResult.success &&
      /INVALID_SIGNATURE|signature verification failed/i.test(
        tamperedResult.error,
      ),
      tamperedResult.success
        ? "Tampered native Recovery import unexpectedly succeeded."
        : `Tampered native Recovery import returned wrong error: ${tamperedResult.error}`,
    );

    assert(
      lastDialogResult !==
        undefined &&
      !(lastDialogResult as OpenDialogReturnValue).canceled &&
      (lastDialogResult as OpenDialogReturnValue).filePaths.length ===
        1 &&
      resolve(
        (lastDialogResult as OpenDialogReturnValue).filePaths[0],
      ).toLowerCase() ===
        resolve(
          tamperedFilePath,
        ).toLowerCase(),
      "Tampered Recovery E2E did not select the generated tampered .finora file.",
    );

    assert(
      await snapshotRecipientTrust() ===
        trustBeforeTamper &&
      await snapshotRecoveryAuthority() ===
        rootBeforeTamper,
      "Tampered Recovery signature rejection mutated recipient trust or recovery authority.",
    );

    const clockAfterTamper =
      await loadFinoraClockHighWaterState();

    assert(
      clockAfterTamper !==
        undefined &&
      clockAfterTamper.highWaterAt ===
        tamperedAcceptedAt.toISOString(),
      "Tampered Recovery import did not preserve the already-accepted authoritative clock advance.",
    );

    console.log(
      "PASS: tampered native Recovery import advanced authoritative clock then failed cryptographic apply with zero trust mutation",
    );

    // --------------------------------------------------------
    // FINAL AUTHORITATIVE STATE
    // --------------------------------------------------------

    const finalTrust =
      await loadFinoraRecipientTrustStore();

    assert(
      finalTrust !==
        undefined,
      "Final Recipient Trust Store unexpectedly missing.",
    );

    const finalActiveKeys =
      finalTrust.trustedKeys.filter(
        (key) =>
          key.issuerId ===
            operationalIssuerId &&
          key.status ===
            "ACTIVE",
      );

    const finalA =
      finalTrust.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    assert(
      finalActiveKeys.length ===
        1 &&
      finalActiveKeys[0].signingKeyId ===
        materialB.signingKeyId &&
      finalA?.status ===
        "REVOKED" &&
      finalA.validUntil ===
        recoveryIssuedAt &&
      finalTrust.appliedTrustRecoveries?.length ===
        1 &&
      finalTrust.trustRecoverySequences?.length ===
        1 &&
      finalTrust.trustRecoverySequences[0].lastSequence ===
        1,
      "Rejected rollback/tampered Recovery imports changed final authoritative trust state.",
    );

    console.log(
      "PASS: final authoritative trust remains A REVOKED / B sole ACTIVE / recovery sequence 1",
    );

    console.log(
      "PASS: independently provisioned recovery authority remained unchanged through complete native import chain",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST RECOVERY NATIVE IMPORT E2E SELFTEST",
    );

    console.log(
      "============================================================",
    );
  } finally {
    // --------------------------------------------------------
    // RESTORE NATIVE DIALOG
    // --------------------------------------------------------

    if (
      originalDialogDescriptor !==
        undefined
    ) {
      Object.defineProperty(
        dialog,
        "showOpenDialog",
        originalDialogDescriptor,
      );
    }

    // --------------------------------------------------------
    // CLOSE TEST WINDOW
    // --------------------------------------------------------

    if (
      parentWindow !==
        undefined &&
      !parentWindow.isDestroyed()
    ) {
      parentWindow.destroy();
    }

    await new Promise<void>(
      (resolveDelay) => {
        setTimeout(
          resolveDelay,
          250,
        );
      },
    );

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
      "PASS: isolated temporary Recovery native-import userData and .finora fixtures deleted",
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
        "FAIL: FINORA RECIPIENT TRUST RECOVERY NATIVE IMPORT E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );