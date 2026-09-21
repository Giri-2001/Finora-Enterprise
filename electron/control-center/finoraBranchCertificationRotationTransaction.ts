import type {
  BrowserWindow,
} from "electron";

import type {
  FinoraVerifiedBranchCertificationRotationRequest,
} from "./finoraBranchCertificationRotationRequestVerifier.js";

import {
  issueFinoraBranchCertificationRotationPackage,
} from "./finoraBranchCertificationRotationIssuer.js";

import {
  rotateFinoraControlCenterBranchCertification,
} from "./finoraControlCenterBranchRegistryStore.js";

import {
  exportFinoraBranchCertificationRotationAuthorityFile,
} from "./finoraBranchCertificationRotationAuthorityFileTransport.js";

import type {
  FinoraBranchCertificationRotationAuthorityExportResult,
} from "./finoraBranchCertificationRotationAuthorityFileTransport.js";

import type {
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

import type {
  FinoraBranchCertificationRotationPayloadV1,
} from "../control/finoraBranchCertificationRotationContract.js";

// ============================================================
// EXPORTER CONTRACT
// ============================================================

export type FinoraBranchCertificationRotationAuthorityExporter =
  (
    signedPackage:
      FinoraControlCenterSignedPackage<
        FinoraBranchCertificationRotationPayloadV1
      >,
  ) =>
    Promise<
      FinoraBranchCertificationRotationAuthorityExportResult
    >;

// ============================================================
// RESULT
// ============================================================

export type FinoraBranchCertificationRotationTransactionResult =
  | {
      success:
        true;

      cancelled:
        true;

      exported:
        false;
    }
  | {
      success:
        true;

      cancelled:
        false;

      exported:
        true;

      registryUpdated:
        boolean;

      fileName:
        string;

      bytesWritten:
        number;

      packageId:
        string;

      requestId:
        string;

      sequence:
        number;
    }
  | {
      success:
        false;

      exported:
        boolean;

      error:
        string;

      packageId?:
        string;

      requestId?:
        string;

      sequence?:
        number;

      fileName?:
        string;
    };

// ============================================================
// CORE COORDINATOR
// ============================================================

export async function coordinateFinoraBranchCertificationRotationIssueExportCommit(
  verifiedRequest:
    FinoraVerifiedBranchCertificationRotationRequest,

  exportAuthority:
    FinoraBranchCertificationRotationAuthorityExporter,
): Promise<
  FinoraBranchCertificationRotationTransactionResult
> {

  let signedPackage:
    FinoraControlCenterSignedPackage<
      FinoraBranchCertificationRotationPayloadV1
    >;

  try {
    signedPackage =
      await issueFinoraBranchCertificationRotationPackage({
        verifiedRequest,
      });
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      exported:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Branch Certification Rotation authority.",
    };
  }

  let exportResult:
    FinoraBranchCertificationRotationAuthorityExportResult;

  try {
    exportResult =
      await exportAuthority(
        signedPackage,
      );
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      exported:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to export FINORA Branch Certification Rotation authority.",

      packageId:
        signedPackage.packageId,

      requestId:
        signedPackage.payload.requestId,

      sequence:
        signedPackage.sequence,
    };
  }

  if (
    !exportResult.success
  ) {
    return {
      success:
        false,

      exported:
        false,

      error:
        exportResult.error,

      packageId:
        signedPackage.packageId,

      requestId:
        signedPackage.payload.requestId,

      sequence:
        signedPackage.sequence,
    };
  }

  if (
    exportResult.cancelled
  ) {
    return {
      success:
        true,

      cancelled:
        true,

      exported:
        false,
    };
  }

  /*
   * COMMIT BARRIER
   *
   * No Registry certification mutation occurs before the authority
   * file exists outside Control Center.
   */
  try {
    const rotation =
      await rotateFinoraControlCenterBranchCertification({
        ownerId:
          signedPackage.payload.ownerId,

        businessId:
          signedPackage.payload.businessId,

        branchId:
          signedPackage.payload.branchId,

        requestingInstallationId:
          signedPackage.payload.requestingInstallationId,

        requestingBindingKeyId:
          signedPackage.payload.requestingBindingKeyId,

        requestingFingerprintAlgorithm:
          signedPackage.payload.requestingFingerprintAlgorithm,

        requestingPublicKeyFingerprint:
          signedPackage.payload.requestingPublicKeyFingerprint,

        sourcePackageId:
          signedPackage.packageId,

        sequence:
          signedPackage.sequence,

        ...(
          signedPackage.payload.legacyCertificationAdoption ===
            true
            ? {
                legacyCertificationAdoption:
                  true as const,
              }
            : {
                previousCertificationPublicKey: {
                  ...signedPackage.payload.previousCertificationPublicKey!,
                },
              }
        ),

        replacementCertificationPublicKey: {
          ...signedPackage.payload.replacementCertificationPublicKey,
        },
      });

    return {
      success:
        true,

      cancelled:
        false,

      exported:
        true,

      registryUpdated:
        rotation.updated,

      fileName:
        exportResult.fileName,

      bytesWritten:
        exportResult.bytesWritten,

      packageId:
        exportResult.packageId,

      requestId:
        exportResult.requestId,

      sequence:
        exportResult.sequence,
    };
  }
  catch (
    error
  ) {

    /*
     * The signed authority has already escaped Control Center.
     * Reissuing would create a second authority package for an
     * operation that may still be applied by the branch.
     */
    return {
      success:
        false,

      exported:
        true,

      error:
        `The FINORA Branch Certification Rotation authority was exported successfully, but automatic Branch Registry rotation failed. Do not issue another rotation authority for this request. Repair the Registry from the authentic exported authority evidence. Registry error: ${
          error instanceof Error
            ? error.message
            : "Unknown Branch Registry rotation failure."
        }`,

      packageId:
        signedPackage.packageId,

      requestId:
        signedPackage.payload.requestId,

      sequence:
        signedPackage.sequence,

      fileName:
        exportResult.fileName,
    };
  }
}

// ============================================================
// PRODUCTION NATIVE EXPORT WRAPPER
// ============================================================

export async function issueExportAndCommitFinoraBranchCertificationRotation(
  parentWindow:
    BrowserWindow,

  verifiedRequest:
    FinoraVerifiedBranchCertificationRotationRequest,
): Promise<
  FinoraBranchCertificationRotationTransactionResult
> {

  return coordinateFinoraBranchCertificationRotationIssueExportCommit(
    verifiedRequest,
    (
      signedPackage,
    ) =>
      exportFinoraBranchCertificationRotationAuthorityFile(
        parentWindow,
        signedPackage,
      ),
  );
}