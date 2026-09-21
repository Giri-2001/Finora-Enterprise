import assert from "node:assert/strict";

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  generateFinoraWindowsInstallationBindingMaterial,
  toFinoraWindowsInstallationBindingPublic,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "../control/finoraBranchCertificationCrypto.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
} from "../control/finoraBranchCertificationRotationContract.js";

import type {
  FinoraVerifiedBranchCertificationRotationRequest,
} from "./finoraBranchCertificationRotationRequestVerifier.js";

import {
  findFinoraControlCenterBranchRegistryRecord,
  registerFinoraControlCenterBranch,
  rotateFinoraControlCenterBranchCertification,
} from "./finoraControlCenterBranchRegistryStore.js";

import {
  coordinateFinoraBranchCertificationRotationIssueExportCommit,
} from "./finoraBranchCertificationRotationTransaction.js";

import {
  serializeFinoraBranchCertificationRotationAuthorityFile,
} from "./finoraBranchCertificationRotationAuthorityFileTransport.js";

async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-bcr-transaction-",
      ),
    );

  app.setPath(
    "userData",
    isolatedUserData,
  );

  try {
    await app.whenReady();

    assert.equal(
      safeStorage.isEncryptionAvailable(),
      true,
    );

    console.log(
      "PASS: real Electron Control Center encryption available",
    );

    const now =
      Date.now();

    const device =
      toFinoraWindowsInstallationBindingPublic(
        generateFinoraWindowsInstallationBindingMaterial(
          new Date(
            now - 60_000,
          ),
        ),
      );

    const previous =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 50_000,
          ),
        ),
      );

    const replacement =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 40_000,
          ),
        ),
      );

    await registerFinoraControlCenterBranch({
      identity: {
        ownerId:
          "OWNER-BCR-TX-001",

        businessId:
          "BUSINESS-BCR-TX-001",

        branchId:
          "BRANCH-BCR-TX-001",

        businessCode:
          "BCRTX01",

        branchCode:
          "BCRTXBR1",

        installation: {
          installationId:
            device.installationId,

          bindingKeyId:
            device.bindingKeyId,

          platform:
            device.platform,

          algorithm:
            device.algorithm,

          publicKeyFormat:
            device.publicKeyFormat,

          publicKey:
            device.publicKey,

          fingerprintAlgorithm:
            device.fingerprintAlgorithm,

          publicKeyFingerprint:
            device.publicKeyFingerprint,

          bindingCreatedAt:
            device.createdAt,
        },
      },

      branchCertificationPublicKey: {
        ...previous,
      },
    });

    const verified:
      FinoraVerifiedBranchCertificationRotationRequest = {

        request: {
          requestId:
            "FIN-BCR-REQ-TX-001",

          ownerId:
            "OWNER-BCR-TX-001",

          businessId:
            "BUSINESS-BCR-TX-001",

          branchId:
            "BRANCH-BCR-TX-001",

          requestingInstallationId:
            device.installationId,

          requestingBindingKeyId:
            device.bindingKeyId,

          requestingFingerprintAlgorithm:
            device.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            device.publicKeyFingerprint,

          authStateId:
            "AUTH-BCR-TX-001",

          authGeneration:
            1,

          portableAuthFingerprintAlgorithm:
            "SHA-256",

          portableAuthFingerprint:
            "b".repeat(
              64,
            ),

          previousCertificationKeyId:
            previous.keyId,

          replacementCertificationPublicKey: {
            ...replacement,
          },

          recoveryReason:
            FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

          requestedAt:
            new Date(
              now - 5_000,
            ).toISOString(),
        },

        deviceBinding: {
          ...device,
        },

        schemaVersion:
          1,
      };

    // ----------------------------------------------------------
    // CANCELLED EXPORT
    // ----------------------------------------------------------

    const cancelled =
      await coordinateFinoraBranchCertificationRotationIssueExportCommit(
        verified,
        async (
          signedPackage,
        ) => {

          assert.equal(
            signedPackage.sequence,
            1,
          );

          const registryBeforeExport =
            await findFinoraControlCenterBranchRegistryRecord(
              verified.request.ownerId,
              verified.request.businessId,
              verified.request.branchId,
            );

          assert.equal(
            registryBeforeExport?.branchCertificationPublicKey?.keyId,
            previous.keyId,
          );

          return {
            success:
              true,

            cancelled:
              true,
          };
        },
      );

    if (
      !cancelled.success
    ) {
      throw new Error(
        cancelled.error,
      );
    }

    assert.equal(
      cancelled.success,
      true,
    );

    assert.equal(
      cancelled.cancelled,
      true,
    );

    const afterCancel =
      await findFinoraControlCenterBranchRegistryRecord(
        verified.request.ownerId,
        verified.request.businessId,
        verified.request.branchId,
      );

    assert.equal(
      afterCancel?.branchCertificationPublicKey?.keyId,
      previous.keyId,
    );

    console.log(
      "PASS: cancelled export leaves Registry certification unchanged",
    );

    // ----------------------------------------------------------
    // EXPORT FAILURE
    // ----------------------------------------------------------

    const exportFailure =
      await coordinateFinoraBranchCertificationRotationIssueExportCommit(
        verified,
        async (
          signedPackage,
        ) => {

          assert.equal(
            signedPackage.sequence,
            1,
          );

          return {
            success:
              false,

            error:
              "SIMULATED_EXPORT_FAILURE",
          };
        },
      );

    assert.equal(
      exportFailure.success,
      false,
    );

    assert.equal(
      exportFailure.exported,
      false,
    );

    const afterFailure =
      await findFinoraControlCenterBranchRegistryRecord(
        verified.request.ownerId,
        verified.request.businessId,
        verified.request.branchId,
      );

    assert.equal(
      afterFailure?.branchCertificationPublicKey?.keyId,
      previous.keyId,
    );

    console.log(
      "PASS: failed export leaves Registry certification unchanged",
    );

    // ----------------------------------------------------------
    // SUCCESSFUL EXPORT
    // ----------------------------------------------------------

    let exporterObservedOldAnchor =
      false;

    let serializedPrivateLeak =
      false;

    const success =
      await coordinateFinoraBranchCertificationRotationIssueExportCommit(
        verified,
        async (
          signedPackage,
        ) => {

          assert.equal(
            signedPackage.sequence,
            1,
          );

          const registryDuringExport =
            await findFinoraControlCenterBranchRegistryRecord(
              verified.request.ownerId,
              verified.request.businessId,
              verified.request.branchId,
            );

          exporterObservedOldAnchor =
            registryDuringExport?.branchCertificationPublicKey?.keyId ===
              previous.keyId;

          const serialized =
            serializeFinoraBranchCertificationRotationAuthorityFile(
              signedPackage,
            );

          const parsed =
            JSON.parse(
              serialized.content,
            ) as {
              format:
                string;

              signedPackage:
                {
                  purpose:
                    string;

                  packageId:
                    string;

                  sequence:
                    number;
                };

              schemaVersion:
                number;
            };

          assert.equal(
            parsed.format,
            "FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_V1",
          );

          assert.equal(
            parsed.signedPackage.purpose,
            "BRANCH_CERTIFICATION_ROTATION",
          );

          assert.equal(
            parsed.signedPackage.packageId,
            signedPackage.packageId,
          );

          assert.equal(
            parsed.signedPackage.sequence,
            1,
          );

          assert.equal(
            parsed.schemaVersion,
            1,
          );

          serializedPrivateLeak =
            serialized.content.includes(
              '"privateKey"',
            ) ||
            serialized.content.includes(
              "replacementCertificationKeyMaterial",
            );

          return {
            success:
              true,

            cancelled:
              false,

            fileName:
              "FIN-BCR-DONE-TEST.finora",

            bytesWritten:
              serialized.bytes,

            packageId:
              signedPackage.packageId,

            requestId:
              signedPackage.payload.requestId,

            sequence:
              signedPackage.sequence,
          };
        },
      );

    assert.equal(
      exporterObservedOldAnchor,
      true,
    );

    assert.equal(
      serializedPrivateLeak,
      false,
    );

    assert.equal(
      success.success,
      true,
    );

    if (
      !success.success ||
      success.cancelled
    ) {
      throw new Error(
        "Successful rotation transaction did not return exported success.",
      );
    }

    assert.equal(
      success.exported,
      true,
    );

    assert.equal(
      success.registryUpdated,
      true,
    );

    assert.equal(
      success.sequence,
      1,
    );

    const afterSuccess =
      await findFinoraControlCenterBranchRegistryRecord(
        verified.request.ownerId,
        verified.request.businessId,
        verified.request.branchId,
      );

    assert.equal(
      afterSuccess?.branchCertificationPublicKey?.keyId,
      replacement.keyId,
    );

    assert.equal(
      afterSuccess?.branchCertificationRotation?.sourcePackageId,
      success.packageId,
    );

    assert.equal(
      afterSuccess?.branchCertificationRotation?.sequence,
      1,
    );

    console.log(
      "PASS: Registry remains on old certification authority during export",
    );

    console.log(
      "PASS: authority file contains no private certification material",
    );

    console.log(
      "PASS: successful export commits exact Registry old -> new transition",
    );

    console.log(
      "PASS: cancelled/failed/successful exact retries reuse durable signed sequence 1",
    );

    // ----------------------------------------------------------
    // LEGACY MISSING-CERTIFICATION AUTHORITY ADOPTION
    // ----------------------------------------------------------

    const legacyDevice =
      toFinoraWindowsInstallationBindingPublic(
        generateFinoraWindowsInstallationBindingMaterial(
          new Date(
            now - 30_000,
          ),
        ),
      );

    const unauthorizedLegacyDevice =
      toFinoraWindowsInstallationBindingPublic(
        generateFinoraWindowsInstallationBindingMaterial(
          new Date(
            now - 25_000,
          ),
        ),
      );

    const negativeLegacyDevice =
      toFinoraWindowsInstallationBindingPublic(
        generateFinoraWindowsInstallationBindingMaterial(
          new Date(
            now - 22_000,
          ),
        ),
      );

    const legacyReplacement =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 20_000,
          ),
        ),
      );

    const legacyConflictReplacement =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 15_000,
          ),
        ),
      );

    await registerFinoraControlCenterBranch({
      identity: {
        ownerId:
          "OWNER-BCR-TX-LEGACY-001",

        businessId:
          "BUSINESS-BCR-TX-LEGACY-001",

        branchId:
          "BRANCH-BCR-TX-LEGACY-001",

        businessCode:
          "BCRLGC1",

        branchCode:
          "BCRLGBR1",

        installation: {
          installationId:
            legacyDevice.installationId,

          bindingKeyId:
            legacyDevice.bindingKeyId,

          platform:
            legacyDevice.platform,

          algorithm:
            legacyDevice.algorithm,

          publicKeyFormat:
            legacyDevice.publicKeyFormat,

          publicKey:
            legacyDevice.publicKey,

          fingerprintAlgorithm:
            legacyDevice.fingerprintAlgorithm,

          publicKeyFingerprint:
            legacyDevice.publicKeyFingerprint,

          bindingCreatedAt:
            legacyDevice.createdAt,
        },
      },
    });

    const legacyBefore =
      await findFinoraControlCenterBranchRegistryRecord(
        "OWNER-BCR-TX-LEGACY-001",
        "BUSINESS-BCR-TX-LEGACY-001",
        "BRANCH-BCR-TX-LEGACY-001",
      );

    assert.ok(
      legacyBefore,
    );

    assert.equal(
      legacyBefore?.branchCertificationPublicKey,
      undefined,
    );

    assert.equal(
      legacyBefore?.branchCertificationRotation,
      undefined,
    );

    const legacyVerified:
      FinoraVerifiedBranchCertificationRotationRequest = {

        request: {
          requestId:
            "FIN-BCR-REQ-TX-LEGACY-001",

          ownerId:
            "OWNER-BCR-TX-LEGACY-001",

          businessId:
            "BUSINESS-BCR-TX-LEGACY-001",

          branchId:
            "BRANCH-BCR-TX-LEGACY-001",

          requestingInstallationId:
            legacyDevice.installationId,

          requestingBindingKeyId:
            legacyDevice.bindingKeyId,

          requestingFingerprintAlgorithm:
            legacyDevice.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            legacyDevice.publicKeyFingerprint,

          authStateId:
            "AUTH-BCR-TX-LEGACY-001",

          authGeneration:
            1,

          portableAuthFingerprintAlgorithm:
            "SHA-256",

          portableAuthFingerprint:
            "c".repeat(
              64,
            ),

          replacementCertificationPublicKey: {
            ...legacyReplacement,
          },

          recoveryReason:
            FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

          requestedAt:
            new Date(
              now - 4_000,
            ).toISOString(),
        },

        deviceBinding: {
          ...legacyDevice,
        },

        schemaVersion:
          1,
      };

    let legacyExportObservedMissingAnchor =
      false;

    let firstLegacyPackageId =
      "";

    let firstLegacySequence =
      0;

    const legacySuccess =
      await coordinateFinoraBranchCertificationRotationIssueExportCommit(
        legacyVerified,
        async (
          signedPackage,
        ) => {

          assert.equal(
            signedPackage.payload.legacyCertificationAdoption,
            true,
          );

          assert.equal(
            signedPackage.payload.previousCertificationPublicKey,
            undefined,
          );

          assert.equal(
            signedPackage.payload.replacementCertificationPublicKey.keyId,
            legacyReplacement.keyId,
          );

          assert.ok(
            Number.isSafeInteger(
              signedPackage.sequence,
            ) &&
              signedPackage.sequence >
                0,
          );

          const registryDuringLegacyExport =
            await findFinoraControlCenterBranchRegistryRecord(
              legacyVerified.request.ownerId,
              legacyVerified.request.businessId,
              legacyVerified.request.branchId,
            );

          assert.equal(
            registryDuringLegacyExport?.branchCertificationPublicKey,
            undefined,
          );

          assert.equal(
            registryDuringLegacyExport?.branchCertificationRotation,
            undefined,
          );

          legacyExportObservedMissingAnchor =
            true;

          const serializedLegacy =
            serializeFinoraBranchCertificationRotationAuthorityFile(
              signedPackage,
            );

          const parsedLegacy =
            JSON.parse(
              serializedLegacy.content,
            ) as {
              signedPackage: {
                payload: {
                  legacyCertificationAdoption?:
                    true;

                  previousCertificationPublicKey?:
                    unknown;
                };
              };
            };

          assert.equal(
            parsedLegacy.signedPackage.payload.legacyCertificationAdoption,
            true,
          );

          assert.equal(
            parsedLegacy.signedPackage.payload.previousCertificationPublicKey,
            undefined,
          );

          firstLegacyPackageId =
            signedPackage.packageId;

          firstLegacySequence =
            signedPackage.sequence;

          return {
            success:
              true,

            cancelled:
              false,

            fileName:
              "FIN-BCR-DONE-LEGACY-TEST.finora",

            bytesWritten:
              serializedLegacy.bytes,

            packageId:
              signedPackage.packageId,

            requestId:
              signedPackage.payload.requestId,

            sequence:
              signedPackage.sequence,
          };
        },
      );

    assert.equal(
      legacyExportObservedMissingAnchor,
      true,
    );

    assert.equal(
      legacySuccess.success,
      true,
    );

    if (
      !legacySuccess.success ||
      legacySuccess.cancelled
    ) {
      throw new Error(
        "Legacy certification adoption did not return exported success.",
      );
    }

    assert.equal(
      legacySuccess.exported,
      true,
    );

    assert.equal(
      legacySuccess.registryUpdated,
      true,
    );

    assert.equal(
      legacySuccess.packageId,
      firstLegacyPackageId,
    );

    assert.equal(
      legacySuccess.sequence,
      firstLegacySequence,
    );

    const legacyAfter =
      await findFinoraControlCenterBranchRegistryRecord(
        legacyVerified.request.ownerId,
        legacyVerified.request.businessId,
        legacyVerified.request.branchId,
      );

    assert.equal(
      legacyAfter?.branchCertificationPublicKey?.keyId,
      legacyReplacement.keyId,
    );

    assert.equal(
      legacyAfter?.branchCertificationRotation?.legacyCertificationAdoption,
      true,
    );

    assert.equal(
      legacyAfter?.branchCertificationRotation?.previousCertificationPublicKey,
      undefined,
    );

    assert.equal(
      legacyAfter?.branchCertificationRotation?.replacementCertificationPublicKey.keyId,
      legacyReplacement.keyId,
    );

    assert.equal(
      legacyAfter?.branchCertificationRotation?.sourcePackageId,
      firstLegacyPackageId,
    );

    assert.equal(
      legacyAfter?.branchCertificationRotation?.sequence,
      firstLegacySequence,
    );

    const legacyRetry =
      await coordinateFinoraBranchCertificationRotationIssueExportCommit(
        legacyVerified,
        async (
          signedPackage,
        ) => {

          assert.equal(
            signedPackage.packageId,
            firstLegacyPackageId,
          );

          assert.equal(
            signedPackage.sequence,
            firstLegacySequence,
          );

          assert.equal(
            signedPackage.payload.legacyCertificationAdoption,
            true,
          );

          assert.equal(
            signedPackage.payload.previousCertificationPublicKey,
            undefined,
          );

          const serializedRetry =
            serializeFinoraBranchCertificationRotationAuthorityFile(
              signedPackage,
            );

          return {
            success:
              true,

            cancelled:
              false,

            fileName:
              "FIN-BCR-DONE-LEGACY-RETRY.finora",

            bytesWritten:
              serializedRetry.bytes,

            packageId:
              signedPackage.packageId,

            requestId:
              signedPackage.payload.requestId,

            sequence:
              signedPackage.sequence,
          };
        },
      );

    assert.equal(
      legacyRetry.success,
      true,
    );

    if (
      !legacyRetry.success ||
      legacyRetry.cancelled
    ) {
      throw new Error(
        "Legacy exact retry did not return exported success.",
      );
    }

    assert.equal(
      legacyRetry.registryUpdated,
      false,
    );

    assert.equal(
      legacyRetry.packageId,
      firstLegacyPackageId,
    );

    assert.equal(
      legacyRetry.sequence,
      firstLegacySequence,
    );

    // ----------------------------------------------------------
    // LEGACY FAIL-CLOSED GUARDS
    // ----------------------------------------------------------

    await registerFinoraControlCenterBranch({
      identity: {
        ownerId:
          "OWNER-BCR-TX-LEGACY-NEG-001",

        businessId:
          "BUSINESS-BCR-TX-LEGACY-NEG-001",

        branchId:
          "BRANCH-BCR-TX-LEGACY-NEG-001",

        businessCode:
          "BCRLGN1",

        branchCode:
          "BCRLGNB1",

        installation: {
          installationId:
            negativeLegacyDevice.installationId,

          bindingKeyId:
            negativeLegacyDevice.bindingKeyId,

          platform:
            negativeLegacyDevice.platform,

          algorithm:
            negativeLegacyDevice.algorithm,

          publicKeyFormat:
            negativeLegacyDevice.publicKeyFormat,

          publicKey:
            negativeLegacyDevice.publicKey,

          fingerprintAlgorithm:
            negativeLegacyDevice.fingerprintAlgorithm,

          publicKeyFingerprint:
            negativeLegacyDevice.publicKeyFingerprint,

          bindingCreatedAt:
            negativeLegacyDevice.createdAt,
        },
      },
    });

    const unexpectedPrevious:
      FinoraVerifiedBranchCertificationRotationRequest = {
        request: {
          ...legacyVerified.request,

          requestId:
            "FIN-BCR-REQ-TX-LEGACY-NEG-PREV-001",

          ownerId:
            "OWNER-BCR-TX-LEGACY-NEG-001",

          businessId:
            "BUSINESS-BCR-TX-LEGACY-NEG-001",

          branchId:
            "BRANCH-BCR-TX-LEGACY-NEG-001",

          requestingInstallationId:
            negativeLegacyDevice.installationId,

          requestingBindingKeyId:
            negativeLegacyDevice.bindingKeyId,

          requestingFingerprintAlgorithm:
            negativeLegacyDevice.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            negativeLegacyDevice.publicKeyFingerprint,

          previousCertificationKeyId:
            legacyReplacement.keyId,
        },

        deviceBinding: {
          ...negativeLegacyDevice,
        },

        schemaVersion:
          1,
      };

    let unexpectedPreviousExporterCalled =
      false;

    const unexpectedPreviousResult =
      await coordinateFinoraBranchCertificationRotationIssueExportCommit(
        unexpectedPrevious,
        async () => {
          unexpectedPreviousExporterCalled =
            true;

          throw new Error(
            "FAIL: unexpected-previous exporter must not run.",
          );
        },
      );

    assert.equal(
      unexpectedPreviousResult.success,
      false,
    );

    assert.equal(
      unexpectedPreviousExporterCalled,
      false,
    );

    if (
      unexpectedPreviousResult.success
    ) {
      throw new Error(
        "Unexpected previous-key legacy request was accepted.",
      );
    }

    assert.match(
      unexpectedPreviousResult.error,
      /unexpected previous certification keyId evidence/,
    );

    const unauthorizedVerified:
      FinoraVerifiedBranchCertificationRotationRequest = {
        request: {
          ...legacyVerified.request,

          requestId:
            "FIN-BCR-REQ-TX-LEGACY-NEG-DEVICE-001",

          ownerId:
            "OWNER-BCR-TX-LEGACY-NEG-001",

          businessId:
            "BUSINESS-BCR-TX-LEGACY-NEG-001",

          branchId:
            "BRANCH-BCR-TX-LEGACY-NEG-001",

          requestingInstallationId:
            unauthorizedLegacyDevice.installationId,

          requestingBindingKeyId:
            unauthorizedLegacyDevice.bindingKeyId,

          requestingFingerprintAlgorithm:
            unauthorizedLegacyDevice.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            unauthorizedLegacyDevice.publicKeyFingerprint,
        },

        deviceBinding: {
          ...unauthorizedLegacyDevice,
        },

        schemaVersion:
          1,
      };

    let unauthorizedExporterCalled =
      false;

    const unauthorizedResult =
      await coordinateFinoraBranchCertificationRotationIssueExportCommit(
        unauthorizedVerified,
        async () => {
          unauthorizedExporterCalled =
            true;

          throw new Error(
            "FAIL: unauthorized-device exporter must not run.",
          );
        },
      );

    assert.equal(
      unauthorizedResult.success,
      false,
    );

    assert.equal(
      unauthorizedExporterCalled,
      false,
    );

    if (
      unauthorizedResult.success
    ) {
      throw new Error(
        "Unauthorized legacy requesting installation was accepted.",
      );
    }

    assert.match(
      unauthorizedResult.error,
      /requesting installation is not authorized/,
    );

    await assert.rejects(
      () =>
        rotateFinoraControlCenterBranchCertification({
          ownerId:
            "OWNER-BCR-TX-LEGACY-NEG-001",

          businessId:
            "BUSINESS-BCR-TX-LEGACY-NEG-001",

          branchId:
            "BRANCH-BCR-TX-LEGACY-NEG-001",

          requestingInstallationId:
            negativeLegacyDevice.installationId,

          requestingBindingKeyId:
            negativeLegacyDevice.bindingKeyId,

          requestingFingerprintAlgorithm:
            negativeLegacyDevice.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            negativeLegacyDevice.publicKeyFingerprint,

          sourcePackageId:
            "FINORA-LEGACY-NEG-BOTH-001",

          sequence:
            1,

          legacyCertificationAdoption:
            true,

          previousCertificationPublicKey: {
            ...legacyReplacement,
          },

          replacementCertificationPublicKey: {
            ...legacyConflictReplacement,
          },
        }),
      /cannot provide a previous certification authority/,
    );

    await assert.rejects(
      () =>
        rotateFinoraControlCenterBranchCertification({
          ownerId:
            "OWNER-BCR-TX-LEGACY-NEG-001",

          businessId:
            "BUSINESS-BCR-TX-LEGACY-NEG-001",

          branchId:
            "BRANCH-BCR-TX-LEGACY-NEG-001",

          requestingInstallationId:
            negativeLegacyDevice.installationId,

          requestingBindingKeyId:
            negativeLegacyDevice.bindingKeyId,

          requestingFingerprintAlgorithm:
            negativeLegacyDevice.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            negativeLegacyDevice.publicKeyFingerprint,

          sourcePackageId:
            "FINORA-LEGACY-NEG-MISSING-MARKER-001",

          sequence:
            1,

          replacementCertificationPublicKey: {
            ...legacyConflictReplacement,
          },
        }),
      /requires its previous certification authority/,
    );

    await assert.rejects(
      () =>
        rotateFinoraControlCenterBranchCertification({
          ownerId:
            legacyVerified.request.ownerId,

          businessId:
            legacyVerified.request.businessId,

          branchId:
            legacyVerified.request.branchId,

          requestingInstallationId:
            legacyDevice.installationId,

          requestingBindingKeyId:
            legacyDevice.bindingKeyId,

          requestingFingerprintAlgorithm:
            legacyDevice.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            legacyDevice.publicKeyFingerprint,

          sourcePackageId:
            "FINORA-LEGACY-NEG-CURRENT-001",

          sequence:
            firstLegacySequence +
              1,

          legacyCertificationAdoption:
            true,

          replacementCertificationPublicKey: {
            ...legacyConflictReplacement,
          },
        }),
      /requires a Registry branch with no existing certification authority/,
    );

    const negativeLegacyAfter =
      await findFinoraControlCenterBranchRegistryRecord(
        "OWNER-BCR-TX-LEGACY-NEG-001",
        "BUSINESS-BCR-TX-LEGACY-NEG-001",
        "BRANCH-BCR-TX-LEGACY-NEG-001",
      );

    assert.equal(
      negativeLegacyAfter?.branchCertificationPublicKey,
      undefined,
    );

    assert.equal(
      negativeLegacyAfter?.branchCertificationRotation,
      undefined,
    );

    console.log(
      "PASS: legacy missing-authority package carries explicit adoption marker without previous authority",
    );

    console.log(
      "PASS: legacy Registry remains authority-less until successful export commit",
    );

    console.log(
      "PASS: successful legacy export adopts replacement as first authoritative certification key",
    );

    console.log(
      "PASS: durable legacy adoption evidence omits previous authority and preserves exact package sequence",
    );

    console.log(
      "PASS: exact legacy retry reuses durable signed package and performs idempotent Registry commit",
    );

    console.log(
      "PASS: legacy previous-key, unauthorized-device, malformed-schema, missing-marker and current-anchor guards fail closed",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: A5-M18C-D1-B1 ROTATION ISSUE/EXPORT/COMMIT EXECUTABLE PROOF",
    );

    console.log(
      "============================================================",
    );
  }
  finally {
    await rm(
      isolatedUserData,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    app.exit(
      0,
    );
  }
}

run().catch(
  (
    error,
  ) => {

    console.error(
      error instanceof Error
        ? error.stack ?? error.message
        : String(
            error,
          ),
    );

    app.exit(
      1,
    );
  },
);