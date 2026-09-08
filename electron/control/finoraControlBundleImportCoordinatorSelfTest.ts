// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// CONTROL BUNDLE NATIVE IMPORT COORDINATOR SELF TEST
//
// ISOLATION:
//
// - Temporary Electron userData.
// - Temporary Control Store.
// - Temporary native installation binding.
// - Ephemeral P-256 Control Center signing identity.
// - Test .finora artifact is created only for this runtime test
//   and deleted before exit.
//
// RUNTIME PROOF:
//
// signed .finora file
//   -> native Open dialog
//   -> bounded file transport
//   -> JSON parse
//   -> outer CONTROL_BUNDLE verification
//   -> child cryptographic preflight
//   -> purpose-specific child apply
//   -> trusted Control Store persistence
//
// IMPORTANT:
//
// - The isolated harness persists recipient trust through the
//   encrypted production recipient trust-store boundary.
// - The import coordinator receives no trustedKeys argument.
// - This does NOT create production trust bootstrap.
// - This does NOT expose trustedKeys through renderer IPC.
//
// ============================================================

import {
  app,
  BrowserWindow,
} from "electron";

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
} from "node:path";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  readFinoraControlStore,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  registerFinoraControlHandlers,
} from "./finoraControlIpc.js";

import {
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

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

interface SelfTestTarget {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
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
// SIGNED PACKAGE FACTORY
// ============================================================

function createSignedPackage(
  input: {

    packageId:
      string;

    purpose:
      string;

    target:
      SelfTestTarget;

    issuedAt:
      string;

    sequence:
      number;

    payload:
      Record<string, unknown>;

    issuerId:
      string;

    signingKeyId:
      string;

    privateKeyPkcs8DerBase64:
      string;
  },
) {

  const unsignedPackage = {

    packageId:
      input.packageId,

    purpose:
      input.purpose,

    issuer: {

      type:
        "FINORA_CONTROL_CENTER" as const,

      issuerId:
        input.issuerId,

      signingKeyId:
        input.signingKeyId,
    },

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

    payloadDigest:
      createFinoraControlCenterPayloadDigest(
        input.payload,
      ),

    schemaVersion:
      1 as const,
  };

  const canonical =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonical,
      input.privateKeyPkcs8DerBase64,
    );

  return {

    ...unsignedPackage,

    signature: {

      algorithm:
        "ECDSA_P256_SHA256" as const,

      encoding:
        "IEEE_P1363" as const,

      canonicalization:
        "FINORA_CANONICAL_JSON_V1" as const,

      signingKeyId:
        input.signingKeyId,

      value:
        signature,
    },
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
        "finora-control-bundle-import-selftest-",
      ),
    );

  const importFilePath =
    join(
      process.cwd(),
      "FINORA-CONTROL-BUNDLE-IMPORT-E2E.finora",
    );

  let parentWindow:
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
    // NATIVE BINDING
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: isolated native installation binding created",
    );

    // --------------------------------------------------------
    // TIME / SCOPE
    // --------------------------------------------------------

    const now =
      new Date();

    const issuedAt =
      new Date(
        now.getTime() -
          2 *
            60 *
            1000,
      ).toISOString();

    const installationCreatedAt =
      new Date(
        now.getTime() -
          24 *
            60 *
            60 *
            1000,
      ).toISOString();

    const validFrom =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const validUntil =
      new Date(
        now.getTime() +
          60 *
            60 *
            1000,
      ).toISOString();

    const scope:
      SelfTestScope = {

        ownerId:
          "OWNER-CONTROL-BUNDLE-IMPORT-E2E",

        businessId:
          "BUSINESS-CONTROL-BUNDLE-IMPORT-E2E",

        branchId:
          "BRANCH-CONTROL-BUNDLE-IMPORT-E2E",
      };

    // --------------------------------------------------------
    // CONTROL STORE INSTALLATION
    // --------------------------------------------------------

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
          "CBI01",

        branchCode:
          "B01",

        createdAt:
          installationCreatedAt,

        updatedAt:
          installationCreatedAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    assert(
      installationResult.success,
      installationResult.error ??
        "Unable to persist isolated installation identity.",
    );

    console.log(
      "PASS: isolated Control Store installation identity persisted",
    );

    // --------------------------------------------------------
    // EPHEMERAL TRUSTED SIGNER
    // --------------------------------------------------------

    const signingMaterial =
      generateFinoraControlCenterSigningMaterial();

    const issuerId =
      "FINORA-CONTROL-BUNDLE-IMPORT-E2E-CONTROL-CENTER";

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] = [
        {

          issuerId,

          signingKeyId:
            signingMaterial.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            signingMaterial.publicKeySpkiDerBase64,

          status:
            "ACTIVE",

          validFrom:
            installationCreatedAt,
        },
      ];

    await persistFinoraRecipientTrustStore({
      schemaVersion:
        1,

      trustedKeys,
    });

    const persistedRecipientTrust =
      await loadFinoraRecipientTrustStore();

    assert(
      persistedRecipientTrust !==
        undefined &&
      persistedRecipientTrust.trustedKeys.length ===
        1 &&
      persistedRecipientTrust.trustedKeys[0].issuerId ===
        issuerId &&
      persistedRecipientTrust.trustedKeys[0].signingKeyId ===
        signingMaterial.signingKeyId,
      "Authoritative recipient trust fixture was not persisted correctly.",
    );

    console.log(
      "PASS: isolated ephemeral trusted signing identity persisted through authoritative recipient trust store",
    );

    // --------------------------------------------------------
    // EXACT TARGET
    // --------------------------------------------------------

    const target:
      SelfTestTarget = {

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    // --------------------------------------------------------
    // VALID PRICING POLICY CHILD
    // --------------------------------------------------------

    const childPackageId =
      "FINORA-CONTROL-BUNDLE-IMPORT-E2E-PRICING";

    const pricingPayload = {

      action:
        "REPLACE",

      overrideSet: {

        overrideSetId:
          "FINORA-CONTROL-BUNDLE-IMPORT-E2E-SET",

        scope: {

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,
        },

        overrides: [
          {

            overrideId:
              "FINORA-CONTROL-BUNDLE-IMPORT-E2E-RULE",

            chargeCode:
              "LOAN_DISBURSEMENT",

            model:
              "FIXED_PRICE_OVERRIDE",

            amount:
              7,

            currency:
              "INR",

            validity: {

              validFrom,

              validUntil,
            },

            schemaVersion:
              1,
          },
        ],

        schemaVersion:
          1,
      },

      installationBinding: {

        installationId:
          target.installationId,

        bindingKeyId:
          target.bindingKeyId,

        fingerprintAlgorithm:
          target.fingerprintAlgorithm,

        publicKeyFingerprint:
          target.publicKeyFingerprint,

        schemaVersion:
          1,
      },

      issuedAt,

      schemaVersion:
        1,
    };

    const childPackage =
      createSignedPackage({

        packageId:
          childPackageId,

        purpose:
          "PRICING_POLICY",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          pricingPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    // --------------------------------------------------------
    // VALID OUTER CONTROL_BUNDLE
    // --------------------------------------------------------

    const bundlePayload = {

      bundleFormat:
        "FINORA_CONTROL_BUNDLE_V1",

      packages: [
        childPackage,
      ],

      issuedAt,

      schemaVersion:
        1,
    };

    const signedBundle =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-IMPORT-E2E-OUTER",

        purpose:
          "CONTROL_BUNDLE",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          bundlePayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });


    // --------------------------------------------------------
    // AUTHORITATIVE TARGET DIAGNOSTIC PREFLIGHT
    //
    // SELFTEST ONLY.
    //
    // Before native transport / IPC, prove that the generated
    // signed bundle belongs to the exact authoritative target
    // reconstructed from persisted Control Store installation
    // identity plus the current native installation binding.
    //
    // Production verifier is invoked directly here without
    // mutation.
    // --------------------------------------------------------

    const {
      getFinoraWindowsInstallationBinding:
        getRuntimeNativeBinding,
    } =
      await import(
        "./finoraInstallationBindingService.js"
      );

    const {
      loadFinoraRecipientTrustStore:
        loadRuntimeRecipientTrust,
    } =
      await import(
        "./finoraRecipientTrustStore.js"
      );

    const {
      verifyFinoraSignedControlPackageNative:
        verifyRuntimeSignedControlPackage,
    } =
      await import(
        "./finoraSignedControlPackageVerifier.js"
      );

    const diagnosticStoreResult =
      await readFinoraControlStore();

    assert(
      diagnosticStoreResult.success &&
        diagnosticStoreResult.data &&
        diagnosticStoreResult.data.installation,
      diagnosticStoreResult.error ??
        "Diagnostic preflight could not load persisted Control Store installation identity.",
    );

    const diagnosticInstallation =
      diagnosticStoreResult.data.installation;

    const diagnosticNativeBinding =
      await getRuntimeNativeBinding();

    assert(
      diagnosticNativeBinding !==
        undefined,
      "Diagnostic preflight could not load authoritative native installation binding.",
    );

    const diagnosticRecipientTrust =
      await loadRuntimeRecipientTrust();

    assert(
      diagnosticRecipientTrust !==
        undefined &&
      diagnosticRecipientTrust.trustedKeys.length >
        0,
      "Diagnostic preflight could not load authoritative recipient trust.",
    );

    const diagnosticExpectedTarget:
      SelfTestTarget = {

        ownerId:
          diagnosticInstallation.ownerId,

        businessId:
          diagnosticInstallation.businessId,

        branchId:
          diagnosticInstallation.branchId,

        installationId:
          diagnosticInstallation.installationId,

        bindingKeyId:
          diagnosticNativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          diagnosticNativeBinding.publicKeyFingerprint,
      };

    const diagnosticTargetComparisons = {

      ownerId:
        signedBundle.target.ownerId ===
          diagnosticExpectedTarget.ownerId,

      businessId:
        signedBundle.target.businessId ===
          diagnosticExpectedTarget.businessId,

      branchId:
        signedBundle.target.branchId ===
          diagnosticExpectedTarget.branchId,

      installationId:
        signedBundle.target.installationId ===
          diagnosticExpectedTarget.installationId,

      bindingKeyId:
        signedBundle.target.bindingKeyId ===
          diagnosticExpectedTarget.bindingKeyId,

      fingerprintAlgorithm:
        signedBundle.target.fingerprintAlgorithm ===
          diagnosticExpectedTarget.fingerprintAlgorithm,

      publicKeyFingerprint:
        signedBundle.target.publicKeyFingerprint ===
          diagnosticExpectedTarget.publicKeyFingerprint,
    };

    console.log(
      "DIAGNOSTIC TARGET FIELD EQUALITY:",
      diagnosticTargetComparisons,
    );

    console.log(
      "DIAGNOSTIC SIGNED TARGET:",
      signedBundle.target,
    );

    console.log(
      "DIAGNOSTIC AUTHORITATIVE TARGET:",
      diagnosticExpectedTarget,
    );

    assert(
      Object.values(
        diagnosticTargetComparisons,
      ).every(
        (
          matches,
        ) =>
          matches,
      ),
      "Generated signed CONTROL_BUNDLE target differs from the authoritative runtime target before IPC.",
    );

    const inMemoryVerification =
      verifyRuntimeSignedControlPackage(
        signedBundle,
        diagnosticRecipientTrust.trustedKeys,
        diagnosticExpectedTarget,
        now,
      );

    assert(
      inMemoryVerification.valid,
      inMemoryVerification.valid
        ? "In-memory signed CONTROL_BUNDLE verification unexpectedly failed."
        : `${inMemoryVerification.reason}: ${inMemoryVerification.error}`,
    );

    console.log(
      "PASS: in-memory signed CONTROL_BUNDLE matches authoritative runtime target",
    );

    // --------------------------------------------------------
    // TEST .finora FILE
    // --------------------------------------------------------

    await rm(
      importFilePath,
      {
        force:
          true,
      },
    );

    const serializedBundle =
      JSON.stringify(
        signedBundle,
        null,
        2,
      );

    const parsedSerializedBundle:
      unknown =
        JSON.parse(
          serializedBundle,
        );

    const serializedVerification =
      verifyRuntimeSignedControlPackage(
        parsedSerializedBundle,
        diagnosticRecipientTrust.trustedKeys,
        diagnosticExpectedTarget,
        now,
      );

    assert(
      serializedVerification.valid,
      serializedVerification.valid
        ? "Serialized signed CONTROL_BUNDLE verification unexpectedly failed."
        : `${serializedVerification.reason}: ${serializedVerification.error}`,
    );

    console.log(
      "PASS: serialized/parsed CONTROL_BUNDLE preserves authoritative target and signature verification",
    );

    await writeFile(
      importFilePath,
      serializedBundle,
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
      `TEST FILE BYTES: ${Buffer.byteLength(serializedBundle, "utf8")}`,
    );

    // --------------------------------------------------------
    // NATIVE DIALOG SELECTED-FILE IDENTITY DIAGNOSTIC
    //
    // SELFTEST ONLY.
    //
    // Observe the real Electron Open dialog result used by the
    // production import transport. The wrapper delegates to the
    // original native dialog and does not supply a path itself.
    //
    // Proves:
    // - exact path selected by native dialog
    // - exact bytes/hash selected
    // - selected JSON outer target
    // - authoritative target immediately after dialog returns
    // --------------------------------------------------------

    const {
      dialog:
        runtimeDialog,
    } =
      await import(
        "electron"
      );

    const {
      readFile:
        readDiagnosticFile,
    } =
      await import(
        "node:fs/promises"
      );

    const {
      createHash:
        createDiagnosticHash,
    } =
      await import(
        "node:crypto"
      );

    const {
      resolve:
        resolveDiagnosticPath,
    } =
      await import(
        "node:path"
      );

    const originalOpenDialogDescriptor =
      Object.getOwnPropertyDescriptor(
        runtimeDialog,
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
        runtimeDialog,
      ) as
        typeof runtimeDialog.showOpenDialog;

    Object.defineProperty(
      runtimeDialog,
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
                await readDiagnosticFile(
                  selectedPath,
                );

              const expectedBytes =
                Buffer.from(
                  serializedBundle,
                  "utf8",
                );

              const selectedSha256 =
                createDiagnosticHash(
                  "sha256",
                )
                  .update(
                    selectedBytes,
                  )
                  .digest(
                    "hex",
                  );

              const expectedSha256 =
                createDiagnosticHash(
                  "sha256",
                )
                  .update(
                    expectedBytes,
                  )
                  .digest(
                    "hex",
                  );

              console.log(
                "DIAGNOSTIC NATIVE DIALOG SELECTED PATH:",
                selectedPath,
              );

              console.log(
                "DIAGNOSTIC NATIVE DIALOG SELECTED BYTES:",
                selectedBytes.byteLength,
              );

              console.log(
                "DIAGNOSTIC GENERATED BUNDLE BYTES:",
                expectedBytes.byteLength,
              );

              console.log(
                "DIAGNOSTIC NATIVE DIALOG SELECTED SHA256:",
                selectedSha256,
              );

              console.log(
                "DIAGNOSTIC GENERATED BUNDLE SHA256:",
                expectedSha256,
              );

              assert(
                resolveDiagnosticPath(
                  selectedPath,
                ) ===
                  resolveDiagnosticPath(
                    importFilePath,
                  ),
                "Native dialog did not select the exact generated E2E .finora path.",
              );

              assert(
                selectedBytes.equals(
                  expectedBytes,
                ),
                "Native dialog selected file bytes differ from the generated E2E bundle.",
              );

              const parsedSelectedBundle:
                unknown =
                  JSON.parse(
                    selectedBytes.toString(
                      "utf8",
                    ),
                  );

              const selectedVerification =
                verifyRuntimeSignedControlPackage(
                  parsedSelectedBundle,
                  diagnosticRecipientTrust.trustedKeys,
                  diagnosticExpectedTarget,
                  now,
                );

              assert(
                selectedVerification.valid,
                selectedVerification.valid
                  ? "Selected native-dialog bundle verification unexpectedly failed."
                  : `${selectedVerification.reason}: ${selectedVerification.error}`,
              );

              const postDialogStoreResult =
                await readFinoraControlStore();

              assert(
                postDialogStoreResult.success &&
                  postDialogStoreResult.data &&
                  postDialogStoreResult.data.installation,
                postDialogStoreResult.error ??
                  "Unable to reload authoritative Control Store immediately after native dialog.",
              );

              const postDialogNativeBinding =
                await getRuntimeNativeBinding();

              assert(
                postDialogNativeBinding !==
                  undefined,
                "Unable to reload native installation binding immediately after native dialog.",
              );

              const postDialogExpectedTarget:
                SelfTestTarget = {

                  ownerId:
                    postDialogStoreResult.data.installation.ownerId,

                  businessId:
                    postDialogStoreResult.data.installation.businessId,

                  branchId:
                    postDialogStoreResult.data.installation.branchId,

                  installationId:
                    postDialogStoreResult.data.installation.installationId,

                  bindingKeyId:
                    postDialogNativeBinding.bindingKeyId,

                  fingerprintAlgorithm:
                    "SHA-256",

                  publicKeyFingerprint:
                    postDialogNativeBinding.publicKeyFingerprint,
                };

              const postDialogTargetMatches =
                Object.entries(
                  diagnosticExpectedTarget,
                ).every(
                  (
                    [
                      key,
                      value,
                    ],
                  ) =>
                    postDialogExpectedTarget[
                      key as
                        keyof SelfTestTarget
                    ] ===
                      value,
                );

              console.log(
                "DIAGNOSTIC POST-DIALOG AUTHORITATIVE TARGET:",
                postDialogExpectedTarget,
              );

              assert(
                postDialogTargetMatches,
                "Authoritative target changed while the native dialog was open.",
              );

              console.log(
                "PASS: native dialog selected exact generated .finora bytes",
              );

              console.log(
                "PASS: authoritative target remained unchanged through native dialog selection",
              );
            }

            return nativeResult;
          },
      },
    );

    restoreNativeOpenDialog =
      () => {
        Object.defineProperty(
          runtimeDialog,
          "showOpenDialog",
          originalOpenDialogDescriptor,
        );
      };

    // --------------------------------------------------------
    // REAL PRODUCTION PRELOAD + CONTROL IPC + NATIVE IMPORT
    //
    // The private electron/main.ts URL-origin validator cannot
    // be imported without starting the application entrypoint.
    // This E2E therefore supplies a narrow test validator while
    // executing the real production Control IPC handler.
    //
    // The handler's own exact BrowserWindow main-frame identity
    // check remains active and authoritative in this test.
    // --------------------------------------------------------

    registerFinoraControlHandlers(
      (
        senderFrame,
      ) =>
        senderFrame !==
          null,
    );

    parentWindow =
      new BrowserWindow({
        width:
          640,

        height:
          240,

        show:
          true,

        title:
          "FINORA Control Bundle Import E2E",

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

    await parentWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          "<!doctype html><html><body>FINORA Control Bundle Import E2E</body></html>",
        ),
    );

    const preloadImportAvailable =
      await parentWindow.webContents.executeJavaScript(
        'typeof window.finora?.control?.importControlBundle === "function"',
        true,
      );

    assert(
      preloadImportAvailable ===
        true,
      "Production preload did not expose window.finora.control.importControlBundle().",
    );

    console.log(
      "PASS: production preload exposed zero-argument Control Bundle import bridge",
    );

    const importResult =
      await parentWindow.webContents.executeJavaScript(
        "window.finora.control.importControlBundle()",
        true,
      );


    if (!importResult.success) {
      throw new Error(
        importResult.error ??
          "Native CONTROL_BUNDLE import failed.",
      );
    }

    assert(
      !importResult.cancelled,
      "Native CONTROL_BUNDLE import was cancelled.",
    );

    assert(
      importResult.fileName ===
        "FINORA-CONTROL-BUNDLE-IMPORT-E2E.finora",
      "Imported filename is incorrect.",
    );

    assert(
      importResult.bytesRead ===
        Buffer.byteLength(
          serializedBundle,
          "utf8",
        ),
      "Imported byte count does not match the test .finora file.",
    );

    assert(
      importResult.applySummary.childResults.length ===
        1 &&
      importResult.applySummary.succeededCount ===
        1 &&
      importResult.applySummary.failedCount ===
        0 &&
      importResult.applySummary.allChildrenApplied,
      "Imported CONTROL_BUNDLE apply summary is invalid.",
    );

    console.log(
      "PASS: production preload + Control IPC + native .finora + authoritative CONTROL_BUNDLE apply chain succeeded",
    );

    // --------------------------------------------------------
    // TRUSTED PERSISTENCE PROOF
    // --------------------------------------------------------

    const storeResult =
      await readFinoraControlStore();

    assert(
      storeResult.success &&
        storeResult.data,
      storeResult.error ??
        "Unable to read isolated Control Store after import.",
    );

    const childPersisted =
      (
        storeResult.data.appliedControlPackages ??
          []
      ).some(
        (record) =>
          record.packageId ===
            childPackageId,
      );

    assert(
      childPersisted,
      "Imported signed child package was not persisted.",
    );

    console.log(
      "PASS: imported signed child persisted in isolated trusted Control Store",
    );

    // --------------------------------------------------------
    // CLOCK HIGH-WATER ROLLBACK FAIL-CLOSED E2E
    //
    // Seed a future high-water using the authoritative native
    // installationId. This direct store write is test-fixture
    // setup only. Production import never receives installationId
    // or a caller-supplied high-water state.
    //
    // Then invoke the exact same zero-argument production preload
    // bridge. The native dialog selects the same valid .finora.
    // Clock rollback must stop the operation before recipient
    // trust or Control Store application can mutate state.
    // --------------------------------------------------------

    const controlStoreBeforeRollback =
      JSON.stringify(
        storeResult.data,
      );

    const recipientTrustBeforeRollback =
      await loadFinoraRecipientTrustStore();

    assert(
      recipientTrustBeforeRollback !==
        undefined,
      "Recipient Trust Store is unavailable before rollback E2E proof.",
    );

    const recipientTrustSnapshotBeforeRollback =
      JSON.stringify(
        recipientTrustBeforeRollback,
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

    const seededHighWater =
      await loadFinoraClockHighWaterState();

    assert(
      seededHighWater !==
        undefined &&
      seededHighWater.installationId ===
        nativeBinding.installationId &&
      seededHighWater.highWaterAt ===
        futureHighWaterAt,
      "Future clock high-water rollback fixture was not persisted correctly.",
    );

    console.log(
      "PASS: authoritative installation clock high-water seeded into the future for rollback E2E proof",
    );

    const rollbackImportResult =
      await parentWindow.webContents.executeJavaScript(
        "window.finora.control.importControlBundle()",
        true,
      );

    assert(
      rollbackImportResult &&
      rollbackImportResult.success ===
        false,
      "Production Control Bundle import unexpectedly succeeded during clock rollback.",
    );

    assert(
      typeof rollbackImportResult.error ===
        "string" &&
      /clock rollback/i.test(
        rollbackImportResult.error,
      ),
      "Production Control Bundle import did not fail specifically for clock rollback.",
    );

    console.log(
      "PASS: production preload + Control IPC + native .finora import rejected persisted clock rollback before apply",
    );

    const controlStoreAfterRollback =
      await readFinoraControlStore();

    assert(
      controlStoreAfterRollback.success &&
        controlStoreAfterRollback.data,
      controlStoreAfterRollback.error ??
        "Unable to read isolated Control Store after rollback rejection.",
    );

    assert(
      JSON.stringify(
        controlStoreAfterRollback.data,
      ) ===
        controlStoreBeforeRollback,
      "Clock-rollback rejection mutated trusted Control Store state.",
    );

    const recipientTrustAfterRollback =
      await loadFinoraRecipientTrustStore();

    assert(
      recipientTrustAfterRollback !==
        undefined &&
      JSON.stringify(
        recipientTrustAfterRollback,
      ) ===
        recipientTrustSnapshotBeforeRollback,
      "Clock-rollback rejection mutated Recipient Trust Store state.",
    );

    const highWaterAfterRollback =
      await loadFinoraClockHighWaterState();

    assert(
      highWaterAfterRollback !==
        undefined &&
      highWaterAfterRollback.installationId ===
        nativeBinding.installationId &&
      highWaterAfterRollback.highWaterAt ===
        futureHighWaterAt,
      "Clock-rollback rejection mutated the persisted future high-water fixture.",
    );

    console.log(
      "PASS: clock rollback rejection preserved Control Store, Recipient Trust Store and persisted high-water state",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA NATIVE .finora CONTROL_BUNDLE IMPORT E2E SELFTEST",
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
      parentWindow &&
      !parentWindow.isDestroyed()
    ) {
      parentWindow.destroy();
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
        "PASS: temporary .finora E2E artifact deleted",
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
     * BrowserWindow creation activates Chromium profile state.
     *
     * On Windows, Electron/Chromium may retain or recreate files
     * under app.getPath("userData") until the Electron process
     * has fully exited.
     *
     * Therefore this self-test does not claim in-process
     * deletion of temporaryUserData. The outer runtime harness
     * must delete the isolated directory after Electron exits
     * and verify that no matching self-test directory remains.
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
//
// Native Open dialog interaction is intentionally asynchronous
// and operator-driven in this E2E harness.
//
// BrowserWindow.destroy() during finally can emit
// "window-all-closed". On Windows/Linux, Electron may otherwise
// terminate the application before runSelfTest() settles and
// before buffered PASS / FAIL output is drained.
//
// This self-test therefore owns window-all-closed and allows
// ONLY the explicit final app.exit(0 / 1) path below to end the
// Electron process.
//
// Keep one explicit main-process event-loop handle alive until
// runSelfTest() settles so Electron cannot terminate before the
// native dialog result, assertions and finally cleanup complete.
// ============================================================

app.on(
  "window-all-closed",
  () => {
    // Intentionally keep the self-test main process alive.
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
        "FAIL: FINORA NATIVE .finora CONTROL_BUNDLE IMPORT E2E SELFTEST",
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