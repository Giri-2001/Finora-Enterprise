/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST MAINTENANCE
   VALID ROTATE NATIVE IMPORT E2E SELFTEST

   MODULE  : Electron Control Plane
   LAYER   : Runtime Integration Self Test
   VERSION : 1.0
   STATUS  : Phase 14 Runtime Proof

   ISOLATION:

   - Temporary Electron userData
   - Temporary native installation binding
   - Temporary encrypted Recipient Trust Store
   - Ephemeral P-256 issuer authority A / B
   - Temporary signed .finora transition artifact
   - Dedicated production maintenance BrowserWindow
   - Dedicated production preload
   - Dedicated production IPC
   - Production native file transport
   - Production authoritative transition apply service

   RUNTIME PROOF:

   bootstrap ACTIVE A
     -> signed ROTATE A -> B
     -> dedicated maintenance renderer
     -> zero-argument dedicated preload bridge
     -> exact dedicated maintenance mainFrame IPC
     -> real native Open dialog
     -> bounded .finora file transport
     -> coordinator
     -> authoritative signed transition apply
     -> encrypted Recipient Trust Store mutation

   IMPORTANT:

   - The production native transport is not modified for testing.
   - The renderer never supplies a filesystem path.
   - The renderer never supplies package bytes.
   - The renderer never supplies trusted keys.
   - The renderer never supplies target identity.
   - The renderer never supplies replay sequence.
   - The renderer never receives bootstrap authority.
   - Native dialog defaultPath is injected only by this isolated
     main-process self-test wrapper.
=========================================================== */

import {
  app,
  BrowserWindow,
  dialog,
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
  readFile,
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
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  bootstrapFinoraRecipientTrust,
} from "./finoraRecipientTrustBootstrapService.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,
  FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope,
  createFinoraRecipientTrustTransitionPayloadDigest,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustRevokeRetiredPayload,
  FinoraRecipientTrustRotatePayload,
  FinoraRecipientTrustTransitionPayload,
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
  FinoraRecipientTrustTransitionUnsignedEnvelope,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  registerFinoraRecipientTrustMaintenanceHandlers,
} from "./finoraRecipientTrustMaintenanceIpc.js";

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
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

// ============================================================
// TEST SIGNING MATERIAL
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
      `FINORA-KEY-${fingerprint
        .slice(
          0,
          24,
        )
        .toUpperCase()}`,
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
// UNSIGNED ENVELOPE
// ============================================================

function createUnsignedEnvelope(
  input: {
    packageId:
      string;

    issuerId:
      string;

    signingKeyId:
      string;

    target:
      FinoraRecipientTrustTransitionTarget;

    issuedAt:
      string;

    sequence:
      number;

    payload:
      FinoraRecipientTrustTransitionPayload;
  },
): FinoraRecipientTrustTransitionUnsignedEnvelope {
  return {
    packageId:
      input.packageId,

    purpose:
      FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

    target: {
      ...input.target,
    },

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload:
      input.payload,

    schemaVersion:
      1,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER",

      issuerId:
        input.issuerId,

      signingKeyId:
        input.signingKeyId,
    },

    payloadDigest:
      createFinoraRecipientTrustTransitionPayloadDigest(
        input.payload,
      ),
  };
}

// ============================================================
// REAL ECDSA SIGN
// ============================================================

function signEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustTransitionUnsignedEnvelope,
  privateKey:
    KeyObject,
): FinoraRecipientTrustTransitionSignedEnvelope {
  const canonical =
    canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
      unsignedEnvelope,
    );

  const signature =
    nodeSign(
      "sha256",
      Buffer.from(
        canonical,
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
    "Generated trust-transition signature was not 64-byte IEEE-P1363.",
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
// ROTATE PAYLOAD
// ============================================================

function createRotatePayload(
  issuerId:
    string,
  newMaterial:
    TestSigningMaterial,
  issuedAt:
    string,
): FinoraRecipientTrustRotatePayload {
  return {
    transitionFormat:
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

    action:
      "ROTATE",

    newTrustedKey:
      createActiveTrustedKey(
        issuerId,
        newMaterial,
        issuedAt,
      ),

    issuedAt,

    schemaVersion:
      1,
  };
}

function createRevokePayload(
  revokedSigningKeyId:
    string,
  issuedAt:
    string,
): FinoraRecipientTrustRevokeRetiredPayload {
  return {
    transitionFormat:
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

    action:
      "REVOKE_RETIRED",

    revokedSigningKeyId,

    issuedAt,

    schemaVersion:
      1,
  };
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
        "finora-recipient-trust-maintenance-e2e-",
      ),
    );

  const importFilePath =
    join(
      process.cwd(),
      "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E.finora",
    );

  let maintenanceWindow:
    BrowserWindow |
    undefined;

  let ordinaryProbeWindow:
    BrowserWindow |
    undefined;

  let controlCenterProbeWindow:
    BrowserWindow |
    undefined;

  let restoreNativeOpenDialog:
    (() => void) |
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
    // AUTHORITATIVE NATIVE INSTALLATION TARGET
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.fingerprintAlgorithm ===
        "SHA-256" &&
      /^[0-9a-f]{64}$/.test(
        nativeBinding.publicKeyFingerprint,
      ),
      "Authoritative native installation binding was not created correctly.",
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
      "PASS: authoritative native installation target created",
    );

    // --------------------------------------------------------
    // EPHEMERAL AUTHORITY A / B
    // --------------------------------------------------------

    const issuerId =
      "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E";

    const materialA =
      createSigningMaterial();

    const materialB =
      createSigningMaterial();

    const clockAnchor =
      Date.now();

    const initialValidFrom =
      new Date(
        clockAnchor -
          10 * 60 * 1000,
      ).toISOString();

    const rotateIssuedAt =
      new Date(
        clockAnchor -
          60 * 1000,
      ).toISOString();

    // --------------------------------------------------------
    // OUT-OF-BAND BOOTSTRAP A
    // --------------------------------------------------------

    const trustedKeyA =
      createActiveTrustedKey(
        issuerId,
        materialA,
        initialValidFrom,
      );

    const bootstrapResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey:
          trustedKeyA,

        expectedPublicKeyFingerprint:
          materialA.fingerprint,
      });

    assert(
      bootstrapResult.success,
      bootstrapResult.success
        ? "Recipient trust bootstrap A unexpectedly failed."
        : bootstrapResult.error,
    );

    const bootstrappedStore =
      await loadFinoraRecipientTrustStore();

    assert(
      bootstrappedStore !==
        undefined &&
      bootstrappedStore.trustedKeys.length ===
        1 &&
      bootstrappedStore.trustedKeys[0].signingKeyId ===
        materialA.signingKeyId &&
      bootstrappedStore.trustedKeys[0].status ===
        "ACTIVE",
      "Bootstrap A did not establish exactly one ACTIVE recipient trust key.",
    );

    console.log(
      "PASS: recipient trust bootstrapped out-of-band with ACTIVE key A",
    );

    // --------------------------------------------------------
    // SIGNED ROTATE A -> B / SEQUENCE 1
    // --------------------------------------------------------

    const rotatePayload =
      createRotatePayload(
        issuerId,
        materialB,
        rotateIssuedAt,
      );

    const rotateSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E-ROTATE-0001",

          issuerId,

          signingKeyId:
            materialA.signingKeyId,

          target,

          issuedAt:
            rotateIssuedAt,

          sequence:
            1,

          payload:
            rotatePayload,
        }),
        materialA.privateKey,
      );

    /*
     * Replay proof must survive normal signer verification first.
     *
     * After ROTATE A -> B, A is RETIRED and B is ACTIVE.
     * Therefore the duplicate packageId is carried by a fresh,
     * otherwise-valid B-signed transition so rejection reaches
     * the persisted replay ledger rather than failing because
     * the original signer A is no longer ACTIVE.
     */
    const replayIssuedAt =
      new Date(
        clockAnchor -
          30 * 1000,
      ).toISOString();

    const duplicatePackageSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            rotateSigned.packageId,

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            replayIssuedAt,

          sequence:
            2,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              replayIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    // --------------------------------------------------------
    // TEST .finora ARTIFACT
    // --------------------------------------------------------

    await rm(
      importFilePath,
      {
        force:
          true,
      },
    );

    const serializedTransition =
      JSON.stringify(
        rotateSigned,
        null,
        2,
      );

    let expectedDialogBytes =
      Buffer.from(
        serializedTransition,
        "utf8",
      );

    await writeFile(
      importFilePath,
      serializedTransition,
      {
        encoding:
          "utf8",

        flag:
          "wx",
      },
    );

    console.log(
      `SELECT THIS FILE IN THE NATIVE DIALOG: ${importFilePath}`,
    );

    console.log(
      `TEST FILE BYTES: ${Buffer.byteLength(serializedTransition, "utf8")}`,
    );

    // --------------------------------------------------------
    // REAL NATIVE DIALOG WRAPPER
    //
    // SELFTEST ONLY.
    //
    // The production transport still invokes Electron's real
    // showOpenDialog(). This wrapper only supplies defaultPath
    // and verifies the operator-selected file identity.
    // --------------------------------------------------------

    const originalOpenDialogDescriptor =
      Object.getOwnPropertyDescriptor(
        dialog,
        "showOpenDialog",
      );

    assert(
      originalOpenDialogDescriptor !==
        undefined &&
      typeof originalOpenDialogDescriptor.value ===
        "function",
      "Electron dialog.showOpenDialog descriptor is unavailable for selftest observation.",
    );

    const originalShowOpenDialog =
      originalOpenDialogDescriptor.value.bind(
        dialog,
      ) as
        typeof dialog.showOpenDialog;

    Object.defineProperty(
      dialog,
      "showOpenDialog",
      {
        ...originalOpenDialogDescriptor,

        value:
          async (
            ownerWindow:
              BrowserWindow,

            options:
              Electron.OpenDialogOptions,
          ) => {
            console.log(
              "DIAGNOSTIC NATIVE DIALOG DEFAULT PATH:",
              importFilePath,
            );

            const nativeResult =
              await originalShowOpenDialog(
                ownerWindow,
                {
                  ...options,

                  defaultPath:
                    importFilePath,
                },
              );

            if (
              !nativeResult.canceled &&
              nativeResult.filePaths.length >
                0
            ) {
              const selectedPath =
                nativeResult.filePaths[0];

              assert(
                selectedPath !==
                  undefined,
                "Native dialog returned no selected path.",
              );

              const selectedBytes =
                await readFile(
                  selectedPath,
                );

              const expectedBytes =
                expectedDialogBytes;

              assert(
                resolve(
                  selectedPath,
                ) ===
                  resolve(
                    importFilePath,
                  ),
                "Native dialog did not select the exact generated trust-transition E2E path.",
              );

              assert(
                selectedBytes.equals(
                  expectedBytes,
                ),
                "Native dialog selected bytes differ from the generated trust-transition artifact.",
              );

              console.log(
                "PASS: native dialog selected exact generated trust-transition .finora bytes",
              );
            }

            return nativeResult;
          },
      },
    );

    restoreNativeOpenDialog =
      () => {
        Object.defineProperty(
          dialog,
          "showOpenDialog",
          originalOpenDialogDescriptor,
        );
      };

    // --------------------------------------------------------
    // REAL DEDICATED PRODUCTION IPC + WINDOW
    // --------------------------------------------------------

    registerFinoraRecipientTrustMaintenanceHandlers();

    await openFinoraRecipientTrustMaintenanceWindow();

    maintenanceWindow =
      BrowserWindow
        .getAllWindows()
        .find(
          (
            candidate,
          ) =>
            candidate.getTitle() ===
              "FINORA Recipient Trust Maintenance",
        );

    assert(
      maintenanceWindow !==
        undefined &&
      !maintenanceWindow.isDestroyed(),
      "Dedicated Recipient Trust Maintenance BrowserWindow was not created.",
    );

    console.log(
      "PASS: dedicated Recipient Trust Maintenance production window opened",
    );

    // --------------------------------------------------------
    // ORDINARY / CONTROL CENTER AUTHORITY ISOLATION
    //
    // Use the real production preloads in sandboxed windows.
    //
    // These probe windows must:
    // - receive no dedicated maintenance bridge,
    // - receive no trust-transition import method,
    // - fail the exact maintenance-window mainFrame predicate.
    //
    // No native import is invoked from either probe.
    // --------------------------------------------------------

    ordinaryProbeWindow =
      new BrowserWindow({
        width:
          480,

        height:
          240,

        show:
          false,

        title:
          "FINORA Ordinary Renderer Authority Probe",

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

    await ordinaryProbeWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          "<!doctype html><html><body>FINORA Ordinary Renderer Authority Probe</body></html>",
        ),
    );

    const ordinaryAuthorityProbe =
      await ordinaryProbeWindow.webContents.executeJavaScript(
        `({
          dedicatedBridge:
            typeof window.finoraRecipientTrustMaintenance,
          transitionImport:
            typeof window.finora?.control?.importSignedTrustTransition,
          rawRequire:
            typeof require
        })`,
        true,
      );

    assert(
      ordinaryAuthorityProbe.dedicatedBridge ===
        "undefined" &&
      ordinaryAuthorityProbe.transitionImport ===
        "undefined" &&
      ordinaryAuthorityProbe.rawRequire ===
        "undefined",
      "Ordinary FINORA production preload unexpectedly exposed Recipient Trust Maintenance authority.",
    );

    assert(
      !isTrustedFinoraRecipientTrustMaintenanceRenderer(
        ordinaryProbeWindow.webContents.mainFrame,
      ),
      "Ordinary FINORA renderer mainFrame was unexpectedly trusted as the Recipient Trust Maintenance renderer.",
    );

    console.log(
      "PASS: ordinary FINORA renderer has no trust-transition import bridge and fails maintenance mainFrame authorization",
    );

    controlCenterProbeWindow =
      new BrowserWindow({
        width:
          480,

        height:
          240,

        show:
          false,

        title:
          "FINORA Control Center Authority Probe",

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

    await controlCenterProbeWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          "<!doctype html><html><body>FINORA Control Center Authority Probe</body></html>",
        ),
    );

    const controlCenterAuthorityProbe =
      await controlCenterProbeWindow.webContents.executeJavaScript(
        `({
          dedicatedBridge:
            typeof window.finoraRecipientTrustMaintenance,
          transitionImport:
            typeof window.finoraControlCenter?.importSignedTrustTransition,
          rawRequire:
            typeof require
        })`,
        true,
      );

    assert(
      controlCenterAuthorityProbe.dedicatedBridge ===
        "undefined" &&
      controlCenterAuthorityProbe.transitionImport ===
        "undefined" &&
      controlCenterAuthorityProbe.rawRequire ===
        "undefined",
      "Control Center production preload unexpectedly exposed Recipient Trust Maintenance apply authority.",
    );

    assert(
      !isTrustedFinoraRecipientTrustMaintenanceRenderer(
        controlCenterProbeWindow.webContents.mainFrame,
      ),
      "Control Center renderer mainFrame was unexpectedly trusted as the Recipient Trust Maintenance renderer.",
    );

    console.log(
      "PASS: Control Center renderer has no trust-transition apply bridge and fails maintenance mainFrame authorization",
    );

    // --------------------------------------------------------
    // REAL PRODUCTION PRELOAD BRIDGE
    // --------------------------------------------------------

    const preloadImportAvailable =
      await maintenanceWindow.webContents.executeJavaScript(
        'typeof window.finoraRecipientTrustMaintenance?.importSignedTrustTransition === "function"',
        true,
      );

    assert(
      preloadImportAvailable ===
        true,
      "Production Recipient Trust Maintenance preload did not expose the zero-argument import bridge.",
    );

    console.log(
      "PASS: dedicated production preload exposed zero-argument trust-transition import bridge",
    );

    // --------------------------------------------------------
    // RENDERER -> PRELOAD -> IPC -> NATIVE DIALOG -> APPLY
    // --------------------------------------------------------

    const importResult =
      await maintenanceWindow.webContents.executeJavaScript(
        "window.finoraRecipientTrustMaintenance.importSignedTrustTransition()",
        true,
      );

    if (
      !importResult ||
      importResult.success !==
        true
    ) {
      throw new Error(
        importResult?.error ??
          "Recipient Trust Maintenance native import failed.",
      );
    }

    assert(
      importResult.cancelled ===
        false,
      "Recipient Trust Maintenance native import was cancelled.",
    );

    assert(
      importResult.fileName ===
        "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E.finora",
      "Imported Recipient Trust Transition filename is incorrect.",
    );

    assert(
      importResult.bytesRead ===
        Buffer.byteLength(
          serializedTransition,
          "utf8",
        ),
      "Imported Recipient Trust Transition byte count is incorrect.",
    );

    assert(
      importResult.applySummary?.action ===
        "ROTATE" &&
      importResult.applySummary?.sequence ===
        1 &&
      importResult.applySummary?.activeSigningKeyId ===
        materialB.signingKeyId &&
      importResult.applySummary?.affectedSigningKeyId ===
        materialA.signingKeyId,
      "Recipient Trust Maintenance ROTATE apply summary is incorrect.",
    );

    console.log(
      "PASS: maintenance renderer -> preload -> exact IPC -> native .finora -> authoritative ROTATE apply succeeded",
    );

    // --------------------------------------------------------
    // AUTHORITATIVE PERSISTENCE PROOF
    // --------------------------------------------------------

    const afterRotate =
      await loadFinoraRecipientTrustStore();

    assert(
      afterRotate !==
        undefined,
      "Recipient trust store disappeared after maintenance ROTATE.",
    );

    const keyAAfterRotate =
      afterRotate.trustedKeys.find(
        (
          key,
        ) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const keyBAfterRotate =
      afterRotate.trustedKeys.find(
        (
          key,
        ) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    assert(
      keyAAfterRotate?.status ===
        "RETIRED" &&
      keyAAfterRotate.validUntil ===
        rotateIssuedAt &&
      keyBAfterRotate?.status ===
        "ACTIVE" &&
      keyBAfterRotate.validFrom ===
        rotateIssuedAt &&
      keyBAfterRotate.validUntil ===
        undefined,
      "Maintenance ROTATE did not persist A RETIRED / B ACTIVE at the signed boundary.",
    );

    assert(
      afterRotate.appliedTrustTransitions?.length ===
        1 &&
      afterRotate.appliedTrustTransitions[0].packageId ===
        rotateSigned.packageId &&
      afterRotate.appliedTrustTransitions[0].sequence ===
        1 &&
      afterRotate.trustTransitionSequences?.length ===
        1 &&
      afterRotate.trustTransitionSequences[0].lastSequence ===
        1 &&
      afterRotate.trustTransitionSequences[0].installationId ===
        nativeBinding.installationId,
      "Maintenance ROTATE did not persist replay ledger and sequence 1.",
    );

    console.log(
      "PASS: maintenance ROTATE persisted A RETIRED, B ACTIVE, replay ledger, and sequence 1",
    );

    // --------------------------------------------------------
    // REPLAY — DUPLICATE PACKAGE ID THROUGH REAL NATIVE CHAIN
    //
    // B is now ACTIVE. Replace only the isolated test artifact
    // with an otherwise-valid B-signed transition carrying the
    // already-applied ROTATE packageId. This ensures normal
    // signature/key verification succeeds before replay defense.
    // --------------------------------------------------------

    const beforeReplay =
      JSON.stringify(
        afterRotate,
      );

    const serializedReplayTransition =
      JSON.stringify(
        duplicatePackageSigned,
        null,
        2,
      );

    await writeFile(
      importFilePath,
      serializedReplayTransition,
      {
        encoding:
          "utf8",

        flag:
          "w",
      },
    );

    expectedDialogBytes =
      Buffer.from(
        serializedReplayTransition,
        "utf8",
      );

    console.log(
      "REPLAY TEST: select the B-signed duplicate-package .finora file",
    );

    const replayResult =
      await maintenanceWindow.webContents.executeJavaScript(
        "window.finoraRecipientTrustMaintenance.importSignedTrustTransition()",
        true,
      );

    assert(
      replayResult &&
      replayResult.success ===
        false,
      "Already-applied Recipient Trust Transition replay was unexpectedly accepted.",
    );

    assert(
      typeof replayResult.error ===
        "string" &&
      replayResult.error.includes(
        "already been applied",
      ),
      `Replay rejection returned unexpected error: ${replayResult.error}`,
    );

    const afterReplay =
      await loadFinoraRecipientTrustStore();

    assert(
      afterReplay !==
        undefined &&
      JSON.stringify(
        afterReplay,
      ) ===
        beforeReplay,
      "Rejected Recipient Trust Transition replay mutated persisted trust state.",
    );

    console.log(
      "PASS: maintenance native-import replay rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // STALE SEQUENCE — UNIQUE PACKAGE ID / CURRENT ACTIVE B
    //
    // Replay state is unchanged after the rejected duplicate.
    // Last accepted sequence remains 1.
    //
    // This package has:
    // - a fresh packageId,
    // - current ACTIVE signer B,
    // - a valid REVOKE_RETIRED payload,
    // - the correct authoritative native target,
    // - but stale sequence 1.
    //
    // Rejection must therefore reach the monotonic sequence
    // guard and preserve recipient trust state byte-for-byte.
    // --------------------------------------------------------

    const beforeStaleSequence =
      JSON.stringify(
        afterReplay,
      );

    const staleIssuedAt =
      new Date(
        clockAnchor -
          15 * 1000,
      ).toISOString();

    const staleSequenceSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E-STALE-0001",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            staleIssuedAt,

          sequence:
            1,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              staleIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    const serializedStaleSequence =
      JSON.stringify(
        staleSequenceSigned,
        null,
        2,
      );

    await writeFile(
      importFilePath,
      serializedStaleSequence,
      {
        encoding:
          "utf8",

        flag:
          "w",
      },
    );

    expectedDialogBytes =
      Buffer.from(
        serializedStaleSequence,
        "utf8",
      );

    console.log(
      "STALE SEQUENCE TEST: select the B-signed sequence-1 .finora file",
    );

    const staleSequenceResult =
      await maintenanceWindow.webContents.executeJavaScript(
        "window.finoraRecipientTrustMaintenance.importSignedTrustTransition()",
        true,
      );

    assert(
      staleSequenceResult &&
      staleSequenceResult.success ===
        false,
      "Stale Recipient Trust Transition sequence was unexpectedly accepted.",
    );

    assert(
      typeof staleSequenceResult.error ===
        "string" &&
      staleSequenceResult.error.includes(
        "sequence is stale",
      ),
      `Stale-sequence rejection returned unexpected error: ${staleSequenceResult.error}`,
    );

    const afterStaleSequence =
      await loadFinoraRecipientTrustStore();

    assert(
      afterStaleSequence !==
        undefined &&
      JSON.stringify(
        afterStaleSequence,
      ) ===
        beforeStaleSequence,
      "Rejected stale Recipient Trust Transition mutated persisted trust state.",
    );

    console.log(
      "PASS: maintenance native-import stale sequence rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // WRONG AUTHORITATIVE NATIVE TARGET
    //
    // Fresh packageId, current ACTIVE signer B, valid sequence 2
    // and otherwise-valid REVOKE_RETIRED payload.
    //
    // The signed installationId is deliberately wrong so this
    // case must be rejected by authoritative target validation
    // without mutating recipient trust state.
    // --------------------------------------------------------

    const beforeWrongTarget =
      JSON.stringify(
        afterStaleSequence,
      );

    const wrongTargetIssuedAt =
      new Date(
        clockAnchor -
          10 * 1000,
      ).toISOString();

    const wrongTarget:
      FinoraRecipientTrustTransitionTarget = {
        ...target,

        installationId:
          "FINORA-WRONG-INSTALLATION-E2E",
      };

    const wrongTargetSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E-WRONG-TARGET-0001",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target:
            wrongTarget,

          issuedAt:
            wrongTargetIssuedAt,

          sequence:
            2,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              wrongTargetIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    const serializedWrongTarget =
      JSON.stringify(
        wrongTargetSigned,
        null,
        2,
      );

    await writeFile(
      importFilePath,
      serializedWrongTarget,
      {
        encoding:
          "utf8",

        flag:
          "w",
      },
    );

    expectedDialogBytes =
      Buffer.from(
        serializedWrongTarget,
        "utf8",
      );

    console.log(
      "WRONG TARGET TEST: select the B-signed wrong-installation .finora file",
    );

    const wrongTargetResult =
      await maintenanceWindow.webContents.executeJavaScript(
        "window.finoraRecipientTrustMaintenance.importSignedTrustTransition()",
        true,
      );

    assert(
      wrongTargetResult &&
      wrongTargetResult.success ===
        false,
      "Wrong-target Recipient Trust Transition was unexpectedly accepted.",
    );

    assert(
      typeof wrongTargetResult.error ===
        "string" &&
      wrongTargetResult.error.includes(
        "TARGET_MISMATCH",
      ),
      `Wrong-target rejection returned unexpected error: ${wrongTargetResult.error}`,
    );

    const afterWrongTarget =
      await loadFinoraRecipientTrustStore();

    assert(
      afterWrongTarget !==
        undefined &&
      JSON.stringify(
        afterWrongTarget,
      ) ===
        beforeWrongTarget,
      "Rejected wrong-target Recipient Trust Transition mutated persisted trust state.",
    );

    console.log(
      "PASS: maintenance native-import wrong target rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // SIGNATURE TAMPER
    //
    // Fresh packageId, current ACTIVE signer B, correct target,
    // valid sequence 2 and otherwise-valid REVOKE_RETIRED
    // payload. The signed envelope is then altered only in the
    // ECDSA signature bytes.
    //
    // Rejection must therefore reach native cryptographic
    // verification and preserve recipient trust state.
    // --------------------------------------------------------

    const beforeSignatureTamper =
      JSON.stringify(
        afterWrongTarget,
      );

    const tamperIssuedAt =
      new Date(
        clockAnchor -
          5 * 1000,
      ).toISOString();

    const validTamperBase =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E-TAMPER-0001",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            tamperIssuedAt,

          sequence:
            2,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              tamperIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    const tamperedSignatureBytes =
      Buffer.from(
        validTamperBase.signature.value,
        "base64",
      );

    assert(
      tamperedSignatureBytes.byteLength ===
        64,
      "Trust-transition E2E tamper base signature was not 64 bytes.",
    );

    tamperedSignatureBytes[0] =
      tamperedSignatureBytes[0] ^
      0x01;

    const tamperedSignatureSigned:
      FinoraRecipientTrustTransitionSignedEnvelope = {
        ...validTamperBase,

        signature: {
          ...validTamperBase.signature,

          value:
            tamperedSignatureBytes.toString(
              "base64",
            ),
        },
      };

    const serializedTamperedSignature =
      JSON.stringify(
        tamperedSignatureSigned,
        null,
        2,
      );

    await writeFile(
      importFilePath,
      serializedTamperedSignature,
      {
        encoding:
          "utf8",

        flag:
          "w",
      },
    );

    expectedDialogBytes =
      Buffer.from(
        serializedTamperedSignature,
        "utf8",
      );

    console.log(
      "SIGNATURE TAMPER TEST: select the B-signed tampered-signature .finora file",
    );

    const tamperedSignatureResult =
      await maintenanceWindow.webContents.executeJavaScript(
        "window.finoraRecipientTrustMaintenance.importSignedTrustTransition()",
        true,
      );

    assert(
      tamperedSignatureResult &&
      tamperedSignatureResult.success ===
        false,
      "Tampered-signature Recipient Trust Transition was unexpectedly accepted.",
    );

    assert(
      typeof tamperedSignatureResult.error ===
        "string" &&
      tamperedSignatureResult.error.includes(
        "INVALID_SIGNATURE",
      ),
      `Signature-tamper rejection returned unexpected error: ${tamperedSignatureResult.error}`,
    );

    const afterSignatureTamper =
      await loadFinoraRecipientTrustStore();

    assert(
      afterSignatureTamper !==
        undefined &&
      JSON.stringify(
        afterSignatureTamper,
      ) ===
        beforeSignatureTamper,
      "Rejected tampered-signature Recipient Trust Transition mutated persisted trust state.",
    );

    console.log(
      "PASS: maintenance native-import signature tamper rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // VALID REVOKE_RETIRED A — SEQUENCE 2 / ACTIVE SIGNER B
    //
    // All rejected cases above preserved last accepted sequence
    // at 1 and preserved B as the sole ACTIVE signing authority.
    //
    // This valid B-signed sequence-2 transition must revoke the
    // historical RETIRED key A while preserving B ACTIVE.
    // --------------------------------------------------------

    const revokeIssuedAt =
      new Date(
        clockAnchor,
      ).toISOString();

    const revokeSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-MAINTENANCE-E2E-REVOKE-0002",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            revokeIssuedAt,

          sequence:
            2,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              revokeIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    const serializedRevoke =
      JSON.stringify(
        revokeSigned,
        null,
        2,
      );

    await writeFile(
      importFilePath,
      serializedRevoke,
      {
        encoding:
          "utf8",

        flag:
          "w",
      },
    );

    expectedDialogBytes =
      Buffer.from(
        serializedRevoke,
        "utf8",
      );

    console.log(
      "VALID REVOKE_RETIRED TEST: select the B-signed sequence-2 .finora file",
    );

    const revokeResult =
      await maintenanceWindow.webContents.executeJavaScript(
        "window.finoraRecipientTrustMaintenance.importSignedTrustTransition()",
        true,
      );

    assert(
      revokeResult &&
      revokeResult.success ===
        true &&
      revokeResult.cancelled ===
        false,
      revokeResult?.error ??
        "Valid REVOKE_RETIRED Recipient Trust Transition unexpectedly failed.",
    );

    assert(
      revokeResult.applySummary?.action ===
        "REVOKE_RETIRED" &&
      revokeResult.applySummary?.sequence ===
        2 &&
      revokeResult.applySummary?.activeSigningKeyId ===
        materialB.signingKeyId &&
      revokeResult.applySummary?.affectedSigningKeyId ===
        materialA.signingKeyId,
      "Recipient Trust Maintenance REVOKE_RETIRED apply summary is incorrect.",
    );

    const afterRevoke =
      await loadFinoraRecipientTrustStore();

    assert(
      afterRevoke !==
        undefined,
      "Recipient trust store disappeared after valid REVOKE_RETIRED.",
    );

    const keyAAfterRevoke =
      afterRevoke.trustedKeys.find(
        (
          key,
        ) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const keyBAfterRevoke =
      afterRevoke.trustedKeys.find(
        (
          key,
        ) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    assert(
      keyAAfterRevoke?.status ===
        "REVOKED" &&
      keyAAfterRevoke.validUntil ===
        rotateIssuedAt &&
      keyBAfterRevoke?.status ===
        "ACTIVE" &&
      keyBAfterRevoke.validUntil ===
        undefined,
      "Valid REVOKE_RETIRED did not persist A REVOKED / B ACTIVE correctly.",
    );

    assert(
      afterRevoke.appliedTrustTransitions?.length ===
        2 &&
      afterRevoke.appliedTrustTransitions[1].packageId ===
        revokeSigned.packageId &&
      afterRevoke.appliedTrustTransitions[1].sequence ===
        2 &&
      afterRevoke.trustTransitionSequences?.length ===
        1 &&
      afterRevoke.trustTransitionSequences[0].lastSequence ===
        2 &&
      afterRevoke.trustTransitionSequences[0].installationId ===
        nativeBinding.installationId,
      "Valid REVOKE_RETIRED did not advance replay ledger and sequence 2.",
    );

    console.log(
      "PASS: maintenance native-import REVOKE_RETIRED persisted A REVOKED, B ACTIVE, replay ledger, and sequence 2",
    );

    // --------------------------------------------------------
    // CLOCK HIGH-WATER ROLLBACK FAIL-CLOSED E2E
    //
    // Direct high-water persistence below is self-test fixture
    // setup only. Production maintenance import receives neither
    // installationId nor caller-controlled high-water state.
    //
    // The same production maintenance renderer/preload/IPC/native
    // file chain is invoked again with the existing valid
    // REVOKE_RETIRED artifact. Persisted clock rollback must stop
    // the operation before transition verification/application can
    // mutate trusted keys or the transition replay ledger.
    // --------------------------------------------------------

    const trustSnapshotBeforeClockRollback =
      JSON.stringify(
        afterRevoke,
      );

    const futureHighWaterAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000,
      ).toISOString();

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        nativeBinding.installationId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededClockHighWater =
      await loadFinoraClockHighWaterState();

    assert(
      seededClockHighWater !==
        undefined &&
      seededClockHighWater.installationId ===
        nativeBinding.installationId &&
      seededClockHighWater.highWaterAt ===
        futureHighWaterAt,
      "Recipient Trust Maintenance future clock high-water fixture was not persisted correctly.",
    );

    console.log(
      "PASS: maintenance authoritative installation clock high-water seeded into the future for rollback proof",
    );

    console.log(
      "CLOCK ROLLBACK TEST: select the existing valid B-signed sequence-2 .finora file",
    );

    const clockRollbackResult =
      await maintenanceWindow.webContents.executeJavaScript(
        "window.finoraRecipientTrustMaintenance.importSignedTrustTransition()",
        true,
      );

    assert(
      clockRollbackResult &&
      clockRollbackResult.success ===
        false,
      "Recipient Trust Maintenance import unexpectedly succeeded during persisted clock rollback.",
    );

    assert(
      typeof clockRollbackResult.error ===
        "string" &&
      /clock rollback/i.test(
        clockRollbackResult.error,
      ),
      "Recipient Trust Maintenance import did not fail specifically for persisted clock rollback.",
    );

    console.log(
      "PASS: dedicated maintenance preload + exact IPC + native .finora import rejected persisted clock rollback before trust apply",
    );

    const trustAfterClockRollback =
      await loadFinoraRecipientTrustStore();

    assert(
      trustAfterClockRollback !==
        undefined &&
      JSON.stringify(
        trustAfterClockRollback,
      ) ===
        trustSnapshotBeforeClockRollback,
      "Clock-rollback rejection mutated Recipient Trust trusted-key or replay-ledger state.",
    );

    const highWaterAfterClockRollback =
      await loadFinoraClockHighWaterState();

    assert(
      highWaterAfterClockRollback !==
        undefined &&
      highWaterAfterClockRollback.installationId ===
        nativeBinding.installationId &&
      highWaterAfterClockRollback.highWaterAt ===
        futureHighWaterAt,
      "Clock-rollback rejection mutated persisted clock high-water state.",
    );

    console.log(
      "PASS: maintenance clock rollback rejection preserved trusted keys, replay ledger, and persisted high-water state",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST MAINTENANCE VALID ROTATE E2E SELFTEST",
    );

    console.log(
      "============================================================",
    );
  } catch (
    error
  ) {
    failure =
      error;
  } finally {
    if (
      restoreNativeOpenDialog
    ) {
      restoreNativeOpenDialog();

      restoreNativeOpenDialog =
        undefined;
    }

    if (
      ordinaryProbeWindow &&
      !ordinaryProbeWindow.isDestroyed()
    ) {
      ordinaryProbeWindow.destroy();
    }

    if (
      controlCenterProbeWindow &&
      !controlCenterProbeWindow.isDestroyed()
    ) {
      controlCenterProbeWindow.destroy();
    }

    if (
      maintenanceWindow &&
      !maintenanceWindow.isDestroyed()
    ) {
      maintenanceWindow.destroy();
    }

    try {
      await rm(
        importFilePath,
        {
          force:
            true,
        },
      );

      console.log(
        "PASS: temporary trust-transition .finora E2E artifact deleted",
      );
    } catch (
      cleanupError
    ) {
      if (!failure) {
        failure =
          cleanupError;
      }
    }

    /*
     * Chromium profile files may remain locked until Electron has
     * fully exited. The outer PowerShell runtime harness will
     * remove temporaryUserData after process exit and verify no
     * matching self-test directory remains.
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
// ENTRY / EXPLICIT EXIT
// ============================================================

app.on(
  "window-all-closed",
  () => {
    // Self-test owns explicit final app.exit(0 / 1).
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
      resolveFlush,
    ) => {
      process.stdout.write(
        "",
        () => {
          process.stderr.write(
            "",
            () => {
              resolveFlush();
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
        "FAIL: FINORA RECIPIENT TRUST MAINTENANCE VALID ROTATE E2E SELFTEST",
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