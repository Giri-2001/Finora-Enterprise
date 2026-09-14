/* ============================================================
   FINORA BRANCH CREDENTIAL ENROLLMENT
   IMPORT COORDINATOR E2E SELF TEST

   D4E4I5E-D2 PROOF:

   - Isolated Electron userData.
   - Real native Windows installation binding.
   - Real Control Store installation identity.
   - Real Control Center signing authority.
   - Active REGISTERED Branch Access prerequisite.
   - Real signed two-child Credential Enrollment Bundle.
   - Real .finora serialization and filesystem artifact.

   COORDINATOR BEHAVIOR:

   1. Native dialog cancellation is a successful non-error and
      does not mutate the Control Store.

   2. Selecting a valid artifact while recipient trust is
      unbootstrapped fails closed and does not mutate the
      Control Store.

   3. Production recipient-trust bootstrap installs the exact
      Control Center public signing key.

   4. Selecting the same artifact then succeeds through:
      native transport
      -> authoritative clock
      -> authoritative recipient-trust queue/load
      -> I5D cryptographic composition apply.

   5. Credential authorization, verified signer evidence and
      reusable portability provenance are persisted.

   6. Returned coordinator summary is deliberately small and
      contains no filepath, signature, public key or secret.
============================================================ */

import {
  app,
  BrowserWindow,
  dialog,
} from "electron";

import {
  createHash,
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
} from "node:path";

import {
  loadOrCreateFinoraControlCenterKeyVault,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  issueFinoraBranchAccessPackage,
} from "../control-center/finoraControlCenterIssuanceCoordinator.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "../control-center/finoraBranchCredentialEnrollmentBundleIssuer.js";

import {
  serializeFinoraBranchCredentialEnrollmentBundleFile,
} from "../control-center/finoraBranchCredentialEnrollmentBundleFileTransport.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchAccessGrantPayload,
  FinoraBranchAccessPackageTarget,
  FinoraBranchCredentialEnrollmentAuthorization,
} from "./finoraBranchAccessPackage.types.js";

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
  applyFinoraSignedBranchAccessPackage,
} from "./finoraBranchAccessPackageApplyService.js";

import {
  bootstrapFinoraRecipientTrust,
} from "./finoraRecipientTrustBootstrapService.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  importFinoraBranchCredentialEnrollmentBundleFromNativeDialog,
} from "./finoraBranchCredentialEnrollmentBundleImportCoordinator.js";

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

function expectSuccess(
  label:
    string,

  result: {
    success:
      boolean;

    error?:
      string;
  },
): void {

  assert(
    result.success,
    result.error ??
      `${label}: expected success.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

function addDays(
  timestamp:
    string,

  days:
    number,
): string {

  return new Date(
    Date.parse(
      timestamp,
    ) +
      days *
        24 *
        60 *
        60 *
        1000,
  ).toISOString();
}

function publicKeyFingerprint(
  publicKeySpkiDerBase64:
    string,
): string {

  return createHash(
    "sha256",
  )
    .update(
      Buffer.from(
        publicKeySpkiDerBase64,
        "base64",
      ),
    )
    .digest(
      "hex",
    );
}

async function readControlStoreJson():
  Promise<string> {

  const result =
    await readFinoraControlStore();

  assert(
    result.success &&
      result.data,
    result.error ??
      "Unable to read FINORA Control Store.",
  );

  return JSON.stringify(
    result.data,
  );
}

async function runSelfTest():
  Promise<void> {

  let temporaryUserData:
    string |
    undefined;

  let parentWindow:
    BrowserWindow |
    undefined;

  let originalOpenDialogDescriptor:
    PropertyDescriptor |
    undefined;

  try {
    // ========================================================
    // 1. ISOLATED ELECTRON STATE
    // ========================================================

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-i5e-coordinator-e2e-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    parentWindow =
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

    console.log(
      "PASS: isolated Electron userData and hidden native parent window configured",
    );

    // ========================================================
    // 2. EXACT NATIVE INSTALLATION + CONTROL STORE IDENTITY
    // ========================================================

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.publicKeyFingerprint.length ===
        64,
      "Native installation binding is incomplete.",
    );

    const setupNow =
      new Date();

    const createdAt =
      new Date(
        setupNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const ownerId =
      "OWNER-I5E-COORDINATOR";

    const businessId =
      "BUSINESS-I5E-COORDINATOR";

    const branchId =
      "BRANCH-I5E-COORDINATOR";

    const userId =
      "USER-I5E-COORDINATOR";

    const grantId =
      "GRANT-I5E-COORDINATOR";

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "I5E01",

        branchCode:
          "B01",

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    expectSuccess(
      "isolated Control Store installation identity persisted",
      installationResult,
    );

    const target:
      FinoraBranchAccessPackageTarget = {

        ownerId,

        businessId,

        branchId,

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
      "PASS: authoritative native + Control Store installation target configured",
    );

    // ========================================================
    // 3. REAL CONTROL CENTER AUTHORITY / TRUSTED KEY
    // ========================================================

    const controlCenterVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    const trustedKey:
      FinoraBranchTrustedControlPublicKey = {

        issuerId:
          controlCenterVault.issuerId,

        signingKeyId:
          controlCenterVault.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          controlCenterVault.publicKeySpkiDerBase64,

        status:
          "ACTIVE",

        validFrom:
          controlCenterVault.createdAt,
      };

    console.log(
      "PASS: real Control Center signing authority established",
    );

    // ========================================================
    // 4. ACTIVE REGISTERED BRANCH ACCESS PREREQUISITE
    // ========================================================

    const accessGrant:
      FinoraBranchAccessGrantPayload = {

        grantId,

        userId,

        ownerId,

        businessId,

        branchId,

        storageMode:
          "LOCAL",

        accessType:
          "REGISTERED",

        administrativeStatus:
          "ACTIVE",

        validity: {
          validFrom:
            createdAt,

          validUntil:
            addDays(
              createdAt,
              365,
            ),
        },

        registrationPayment: {
          amount:
            2000,

          currency:
            "INR",

          paymentMode:
            "CASH",

          paidAt:
            createdAt,

          remarks:
            "FINORA I5E coordinator E2E prerequisite.",

          refundable:
            false,
        },

        registrationCycle:
          1,

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const bootstrapAccessPackage =
      await issueFinoraBranchAccessPackage({
        target,

        payload: {
          action:
            "ISSUE",

          accessGrant,

          schemaVersion:
            1,
        },
      });

    const bootstrapAccessResult =
      await applyFinoraSignedBranchAccessPackage(
        bootstrapAccessPackage,
        [
          trustedKey,
        ],
        new Date(
          Date.now() +
            5_000,
        ),
      );

    expectSuccess(
      "active REGISTERED Branch Access prerequisite applied",
      bootstrapAccessResult,
    );

    // ========================================================
    // 5. REAL CREDENTIAL ENROLLMENT BUNDLE + .finora FILE
    // ========================================================

    const sourceAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5E-COORDINATOR-000001",

        userId,

        username:
          "branch.admin",

        fullName:
          "Branch Administrator",

        role:
          "ADMIN",

        ownerId,

        businessId,

        branchId,

        storageMode:
          "LOCAL",

        dataContext:
          "REAL",

        method:
          FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

        oneTime:
          true,

        schemaVersion:
          1,
      };

    const bundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,
        sourceAuthorization,
      });

    const serialized =
      serializeFinoraBranchCredentialEnrollmentBundleFile(
        bundle,
      );

    const importFilePath =
      join(
        temporaryUserData,
        "FINORA-I5E-CREDENTIAL-ENROLLMENT.finora",
      );

    await writeFile(
      importFilePath,
      serialized.content,
      {
        encoding:
          "utf8",

        flag:
          "wx",

        mode:
          0o600,
      },
    );

    console.log(
      "PASS: real signed two-child Credential Enrollment .finora artifact created",
    );

    // ========================================================
    // 6. NATIVE DIALOG INTERCEPTION
    //
    // Exact Electron dialog property is restored in finally.
    // No renderer filepath enters production coordinator.
    // ========================================================

    originalOpenDialogDescriptor =
      Object.getOwnPropertyDescriptor(
        dialog,
        "showOpenDialog",
      );

    assert(
      originalOpenDialogDescriptor !==
        undefined &&
      typeof originalOpenDialogDescriptor.value ===
        "function",
      "Electron dialog.showOpenDialog descriptor is unavailable.",
    );

    function installDialogResult(
      result: {
        canceled:
          boolean;

        filePaths:
          string[];
      },
    ): void {

      assert(
        originalOpenDialogDescriptor !==
          undefined,
        "Original dialog descriptor is unavailable.",
      );

      Object.defineProperty(
        dialog,
        "showOpenDialog",
        {
          ...originalOpenDialogDescriptor,

          value:
            async () =>
              ({
                canceled:
                  result.canceled,

                filePaths:
                  [
                    ...result.filePaths,
                  ],
              }),
        },
      );
    }

    // ========================================================
    // 7. CANCELLATION IS NON-ERROR + ZERO CONTROL STORE MUTATION
    // ========================================================

    const beforeCancel =
      await readControlStoreJson();

    installDialogResult({
      canceled:
        true,

      filePaths:
        [],
    });

    const cancelResult =
      await importFinoraBranchCredentialEnrollmentBundleFromNativeDialog(
        parentWindow,
        new Date(
          Date.now() +
            10_000,
        ),
      );

    assert(
      cancelResult.success &&
      cancelResult.cancelled,
      cancelResult.success
        ? "Credential Enrollment import cancellation was not preserved."
        : cancelResult.error,
    );

    const afterCancel =
      await readControlStoreJson();

    assert(
      afterCancel ===
        beforeCancel,
      "Cancelled Credential Enrollment import mutated Control Store.",
    );

    console.log(
      "PASS: native Credential Enrollment import cancellation is non-error with zero Control Store mutation",
    );

    // ========================================================
    // 8. RECIPIENT TRUST MUST STILL BE UNBOOTSTRAPPED
    // ========================================================

    const trustBeforeBootstrap =
      await loadFinoraRecipientTrustStore();

    assert(
      trustBeforeBootstrap ===
        undefined,
      "Recipient trust unexpectedly exists before explicit bootstrap.",
    );

    // ========================================================
    // 9. VALID FILE + UNBOOTSTRAPPED TRUST -> FAIL CLOSED
    // ========================================================

    installDialogResult({
      canceled:
        false,

      filePaths: [
        importFilePath,
      ],
    });

    const beforeUnbootstrapped =
      await readControlStoreJson();

    const unbootstrappedNow =
      new Date(
        Date.now() +
          15_000,
      );

    const unbootstrappedResult =
      await importFinoraBranchCredentialEnrollmentBundleFromNativeDialog(
        parentWindow,
        unbootstrappedNow,
      );

    assert(
      !unbootstrappedResult.success &&
      unbootstrappedResult.error.includes(
        "recipient trust must be bootstrapped",
      ),
      unbootstrappedResult.success
        ? "Unbootstrapped Credential Enrollment import unexpectedly succeeded."
        : `Unexpected unbootstrapped error: ${unbootstrappedResult.error}`,
    );

    const afterUnbootstrapped =
      await readControlStoreJson();

    assert(
      afterUnbootstrapped ===
        beforeUnbootstrapped,
      "Unbootstrapped Credential Enrollment rejection mutated Control Store.",
    );

    console.log(
      "PASS: unbootstrapped authoritative Credential Enrollment import failed closed with zero Control Store mutation",
    );

    // ========================================================
    // 10. PRODUCTION RECIPIENT TRUST BOOTSTRAP
    // ========================================================

    const trustedKeyFingerprint =
      publicKeyFingerprint(
        trustedKey.publicKey,
      );

    const trustBootstrapResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey,

        expectedPublicKeyFingerprint:
          trustedKeyFingerprint,
      });

    assert(
      trustBootstrapResult.success,
      trustBootstrapResult.success
        ? "Recipient Trust bootstrap unexpectedly failed."
        : trustBootstrapResult.error,
    );

    const persistedRecipientTrust =
      await loadFinoraRecipientTrustStore();

    assert(
      persistedRecipientTrust !==
        undefined &&
      persistedRecipientTrust.trustedKeys.length ===
        1 &&
      persistedRecipientTrust.trustedKeys[0]?.issuerId ===
        trustedKey.issuerId &&
      persistedRecipientTrust.trustedKeys[0]?.signingKeyId ===
        trustedKey.signingKeyId &&
      persistedRecipientTrust.trustedKeys[0]?.publicKey ===
        trustedKey.publicKey &&
      persistedRecipientTrust.trustedKeys[0]?.status ===
        "ACTIVE",
      "Production Recipient Trust bootstrap did not persist exact initial trusted key.",
    );

    console.log(
      "PASS: production Recipient Trust bootstrap persisted exact active Control Center signing key",
    );

    // ========================================================
    // 11. SAME REAL FILE -> AUTHORITATIVE SUCCESS
    // ========================================================

    installDialogResult({
      canceled:
        false,

      filePaths: [
        importFilePath,
      ],
    });

    const successfulNow =
      new Date(
        unbootstrappedNow.getTime() +
          5_000,
      );

    const importResult =
      await importFinoraBranchCredentialEnrollmentBundleFromNativeDialog(
        parentWindow,
        successfulNow,
      );

    assert(
      importResult.success &&
      !importResult.cancelled,
      importResult.success
        ? "Credential Enrollment coordinator returned cancellation instead of success."
        : importResult.error,
    );

    assert(
      importResult.fileName ===
        "FINORA-I5E-CREDENTIAL-ENROLLMENT.finora" &&
      importResult.bytesRead ===
        serialized.bytes,
      "Successful coordinator import returned incorrect native file metadata.",
    );

    assert(
      importResult.applySummary.ownerId ===
        ownerId &&
      importResult.applySummary.businessId ===
        businessId &&
      importResult.applySummary.branchId ===
        branchId &&
      importResult.applySummary.sourceAuthorizationId ===
        sourceAuthorization.authorizationId &&
      importResult.applySummary.branchAccessPackageId ===
        bundle.branchAccessPackage.packageId &&
      importResult.applySummary.portabilityAuthorityPackageId ===
        bundle.branchPortabilityAuthorityPackage.packageId &&
      importResult.applySummary.appliedAt ===
        successfulNow.toISOString(),
      "Successful coordinator import returned incorrect safe apply summary.",
    );

    console.log(
      "PASS: real .finora artifact imported through native transport + authoritative clock + recipient trust + I5D apply",
    );

    // ========================================================
    // 12. SAFE RESULT SHAPE
    // ========================================================

    const topLevelKeys =
      Object.keys(
        importResult,
      ).sort();

    const expectedTopLevelKeys =
      [
        "applySummary",
        "bytesRead",
        "cancelled",
        "fileName",
        "success",
      ].sort();

    assert(
      JSON.stringify(
        topLevelKeys,
      ) ===
        JSON.stringify(
          expectedTopLevelKeys,
        ),
      "Coordinator success result exposes unexpected top-level fields.",
    );

    const summaryKeys =
      Object.keys(
        importResult.applySummary,
      ).sort();

    const expectedSummaryKeys =
      [
        "appliedAt",
        "branchAccessPackageId",
        "branchId",
        "businessId",
        "ownerId",
        "portabilityAuthorityPackageId",
        "sourceAuthorizationId",
      ].sort();

    assert(
      JSON.stringify(
        summaryKeys,
      ) ===
        JSON.stringify(
          expectedSummaryKeys,
        ),
      "Coordinator apply summary exposes unexpected fields.",
    );

    const resultJson =
      JSON.stringify(
        importResult,
      );

    assert(
      !resultJson.includes(
        importFilePath,
      ) &&
      !resultJson.includes(
        trustedKey.publicKey,
      ) &&
      !resultJson.includes(
        bundle.branchAccessPackage.signature.value,
      ) &&
      !resultJson.includes(
        bundle.branchPortabilityAuthorityPackage.signature.value,
      ),
      "Coordinator result leaked filepath, public-key material or signed-package signature material.",
    );

    console.log(
      "PASS: coordinator returns only bounded safe file metadata + apply summary",
    );

    // ========================================================
    // 13. AUTHORITATIVE CONTROL STORE PERSISTENCE
    // ========================================================

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final coordinator Control Store.",
    );

    const persistedAuthorization =
      finalStore.data.branchCredentialEnrollmentAuthorizations
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              sourceAuthorization.authorizationId,
        );

    assert(
      persistedAuthorization?.userId ===
        userId &&
      persistedAuthorization.username ===
        "branch.admin" &&
      persistedAuthorization.ownerId ===
        ownerId &&
      persistedAuthorization.businessId ===
        businessId &&
      persistedAuthorization.branchId ===
        branchId,
      "Coordinator import did not persist exact credential authorization.",
    );

    const persistedVerificationEvidence =
      finalStore.data.branchCredentialAuthorizationVerificationEvidence
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              sourceAuthorization.authorizationId,
        );

    assert(
      persistedVerificationEvidence?.packageId ===
        bundle.branchAccessPackage.packageId &&
      persistedVerificationEvidence.verifiedControlSigner.issuerId ===
        trustedKey.issuerId &&
      persistedVerificationEvidence.verifiedControlSigner.signingKeyId ===
        trustedKey.signingKeyId &&
      persistedVerificationEvidence.verifiedAt ===
        successfulNow.toISOString(),
      "Coordinator import did not persist exact Branch Access verification evidence.",
    );

    const persistedPortability =
      finalStore.data.branchCredentialPortabilityAuthorities
        ?.find(
          (
            item,
          ) =>
            item.sourceAuthorizationId ===
              sourceAuthorization.authorizationId,
        );

    assert(
      persistedPortability?.signedPortabilityAuthorityPackage.packageId ===
        bundle.branchPortabilityAuthorityPackage.packageId &&
      persistedPortability.verifiedControlSigner.issuerId ===
        trustedKey.issuerId &&
      persistedPortability.verifiedControlSigner.signingKeyId ===
        trustedKey.signingKeyId &&
      persistedPortability.verifiedAt ===
        successfulNow.toISOString(),
      "Coordinator import did not atomically persist exact portability provenance.",
    );

    const replayJson =
      JSON.stringify(
        finalStore.data.appliedControlPackages ??
          [],
      );

    assert(
      replayJson.includes(
        bundle.branchAccessPackage.packageId,
      ) &&
      !replayJson.includes(
        bundle.branchPortabilityAuthorityPackage.packageId,
      ),
      "Coordinator import violated Branch Access / reusable portability replay separation.",
    );

    console.log(
      "PASS: coordinator persisted credential authorization + signer evidence + reusable portability provenance",
    );

    console.log(
      "PASS: portability authority remains outside normal applied-package replay state",
    );

    console.log(
      "PASS: D4E4I5E-D2 COORDINATOR EXECUTABLE E2E PROOF",
    );
  }
  finally {
    if (
      originalOpenDialogDescriptor !==
        undefined
    ) {
      Object.defineProperty(
        dialog,
        "showOpenDialog",
        originalOpenDialogDescriptor,
      );
    }

    if (
      parentWindow !==
        undefined &&
      !parentWindow.isDestroyed()
    ) {
      parentWindow.destroy();
    }

    if (
      temporaryUserData !==
        undefined
    ) {
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
        "PASS: isolated temporary FINORA state deleted",
      );
    }
  }
}

void runSelfTest()
  .then(
    () => {
      console.log(
        "PASS: I5E coordinator self-test process exiting with code 0",
      );

      app.quit();
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED",
      );

      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );