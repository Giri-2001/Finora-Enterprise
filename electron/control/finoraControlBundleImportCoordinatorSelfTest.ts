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
// - trustedKeys are supplied directly by this main-process
//   isolated test harness.
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
  importFinoraControlBundleFromNativeDialog,
} from "./finoraControlBundleImportCoordinator.js";

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

    console.log(
      "PASS: isolated ephemeral trusted signing identity created",
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
    // REAL NATIVE IMPORT COORDINATOR
    // --------------------------------------------------------

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

          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true,
        },
      });

    const importResult =
      await importFinoraControlBundleFromNativeDialog(
        parentWindow,
        trustedKeys,
        now,
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
      "PASS: native .finora transport + CONTROL_BUNDLE apply coordinator succeeded",
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

    try {

      await rm(
        temporaryUserData,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      console.log(
        "PASS: isolated temporary FINORA userData deleted",
      );

    } catch (
      cleanupError
    ) {

      if (!failure) {
        failure =
          cleanupError;
      }
    }
  }

  if (failure) {
    throw failure;
  }
}

// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {

      app.exit(
        0,
      );
    },
    (error) => {

      console.error(
        "FAIL: FINORA NATIVE .finora CONTROL_BUNDLE IMPORT E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );

// ============================================================
// END
// ============================================================