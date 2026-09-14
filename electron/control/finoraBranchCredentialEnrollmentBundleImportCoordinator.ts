/* ============================================================
   FINORA BRANCH CREDENTIAL ENROLLMENT
   NATIVE IMPORT COORDINATOR

   FLOW:

   native .finora selection/read
   -> cancellation preserved as non-error
   -> authoritative wall-clock observation
   -> authoritative recipient-trust apply service
   -> safe applied summary

   SECURITY:

   - No renderer-provided filepath.
   - File selection completes before recipient-trust queue entry.
   - File transport performs no cryptographic trust decision.
   - Coordinator accepts no caller-provided trusted keys.
   - Coordinator performs no Control Store mutation directly.
   - Existing CONTROL_BUNDLE import path is independent.
============================================================ */

import type {
  BrowserWindow,
} from "electron";

import {
  validateFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundle.js";

import {
  openFinoraBranchCredentialEnrollmentBundleFile,
} from "./finoraBranchCredentialEnrollmentBundleImportFileTransport.js";

import {
  observeFinoraAuthoritativeWallClock,
} from "./finoraClockHighWaterAuthorityService.js";

import {
  applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrust,
} from "./finoraAuthoritativeBranchCredentialEnrollmentBundleApplyService.js";

export interface FinoraBranchCredentialEnrollmentImportApplySummary {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  sourceAuthorizationId:
    string;

  branchAccessPackageId:
    string;

  portabilityAuthorityPackageId:
    string;

  appliedAt:
    string;
}

export type FinoraBranchCredentialEnrollmentBundleImportResult =
  | {
      success:
        true;

      cancelled:
        true;
    }
  | {
      success:
        true;

      cancelled:
        false;

      fileName:
        string;

      bytesRead:
        number;

      applySummary:
        FinoraBranchCredentialEnrollmentImportApplySummary;
    }
  | {
      success:
        false;

      error:
        string;
    };

function failure(
  error:
    string,
): FinoraBranchCredentialEnrollmentBundleImportResult {

  return {
    success:
      false,

    error,
  };
}

export async function importFinoraBranchCredentialEnrollmentBundleFromNativeDialog(
  parentWindow:
    BrowserWindow,

  now?:
    Date,
): Promise<
  FinoraBranchCredentialEnrollmentBundleImportResult
> {

  // ----------------------------------------------------------
  // 1. NATIVE FILE TRANSPORT
  //
  // No recipient-trust queue is held while the operator is
  // selecting/reading the file.
  // ----------------------------------------------------------

  const fileResult =
    await openFinoraBranchCredentialEnrollmentBundleFile(
      parentWindow,
    );

  if (!fileResult.success) {
    return failure(
      fileResult.error,
    );
  }

  if (fileResult.cancelled) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  /*
   * Transport already performed this validation while parsing.
   * Re-validating here gives this coordinator a typed, strict
   * composition summary without trusting generic payload fields.
   */
  const composition =
    validateFinoraBranchCredentialEnrollmentBundle(
      fileResult.bundle,
    );

  if (!composition.valid) {
    return failure(
      composition.error,
    );
  }

  // ----------------------------------------------------------
  // 2. AUTHORITATIVE WALL CLOCK
  //
  // Production captures wall time only after file selection.
  // Tests may inject one explicit Date.
  // ----------------------------------------------------------

  const observedNow =
    now ??
    new Date();

  const clockResult =
    await observeFinoraAuthoritativeWallClock(
      observedNow,
    );

  if (!clockResult.success) {
    return failure(
      clockResult.error,
    );
  }

  const acceptedNow =
    new Date(
      clockResult.data.observedAt,
    );

  // ----------------------------------------------------------
  // 3. AUTHORITATIVE RECIPIENT TRUST + I5D APPLY
  // ----------------------------------------------------------

  const applyResult =
    await applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrust(
      composition.bundle,
      acceptedNow,
    );

  if (!applyResult.success) {
    return failure(
      applyResult.error ??
        "FINORA Branch Credential Enrollment Bundle application failed.",
    );
  }

  const branchAccessPackage =
    composition.bundle.branchAccessPackage;

  const portabilityPackage =
    composition.bundle.branchPortabilityAuthorityPackage;

  // ----------------------------------------------------------
  // 4. SAFE SUMMARY
  // ----------------------------------------------------------

  return {
    success:
      true,

    cancelled:
      false,

    fileName:
      fileResult.fileName,

    bytesRead:
      fileResult.bytesRead,

    applySummary: {
      ownerId:
        branchAccessPackage.target.ownerId,

      businessId:
        branchAccessPackage.target.businessId,

      branchId:
        branchAccessPackage.target.branchId,

      sourceAuthorizationId:
        composition.sourceAuthorizationId,

      branchAccessPackageId:
        branchAccessPackage.packageId,

      portabilityAuthorityPackageId:
        portabilityPackage.packageId,

      appliedAt:
        acceptedNow.toISOString(),
    },
  };
}