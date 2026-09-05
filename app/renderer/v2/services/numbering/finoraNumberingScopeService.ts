// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// SIGNED NUMBERING SCOPE SERVICE
//
// RESPONSIBILITY:
//
// - Resolve the active FINORA installation scope
// - Load the authoritative signed Business Profile
// - Resolve immutable Business / Branch numbering codes from
//   the signed Business Profile
// - Reject installation/profile scope mismatches
// - Reject stale/conflicting legacy installation code metadata
// - Return one canonical FinoraNumberingScope to Numbering
//   services
//
// IMPORTANT:
//
// - Installation Identity owns installation / scope identity.
// - Signed Business Profile owns businessCode / branchCode.
// - Legacy installation codes are compatibility metadata only.
// - Legacy installation code conflicts fail closed.
// - No repository access.
// - No direct StorageManager access.
// - No localStorage access.
// - No React.
// - No UI logic.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  loadFinoraBusinessProfile,
  loadFinoraInstallationIdentity,
} from "../activation/activationService";

import type {
  FinoraNumberingScope,
} from "../../types/numbering/numbering.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  normalizeNumberingCode,
} from "../../utils/numbering/numbering.formatter";

// ============================================================
// NORMALIZE SIGNED CODE
// ============================================================

function normalizeSignedCode(
  value:
    string,
  label:
    string,
): StorageResult<string> {

  if (!value.trim()) {
    return {
      success:
        false,

      error:
        `Signed FINORA ${label} is missing.`,
    };
  }

  try {

    return {
      success:
        true,

      data:
        normalizeNumberingCode(
          value,
        ),
    };

  } catch (error) {

    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : `Signed FINORA ${label} is invalid.`,
    };
  }
}

// ============================================================
// VALIDATE LEGACY INSTALLATION CODE
//
// Installation Identity historically carried businessCode and
// branchCode.
//
// Those values are no longer Numbering authority.
//
// If still present, they must agree with the signed profile.
// Missing legacy values are accepted.
// ============================================================

function validateLegacyInstallationCode(
  installationValue:
    string | undefined,
  signedValue:
    string,
  label:
    string,
): StorageResult<void> {

  if (!installationValue?.trim()) {
    return {
      success:
        true,
    };
  }

  let normalizedInstallationValue:
    string;

  try {

    normalizedInstallationValue =
      normalizeNumberingCode(
        installationValue,
      );

  } catch (error) {

    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : `Legacy FINORA ${label} metadata is invalid.`,
    };
  }

  if (
    normalizedInstallationValue !==
      signedValue
  ) {

    return {
      success:
        false,

      error:
        `FINORA ${label} conflict detected between Installation Identity and signed Business Profile.`,
    };
  }

  return {
    success:
      true,
  };
}

// ============================================================
// RESOLVE FINORA NUMBERING SCOPE
// ============================================================

export async function resolveFinoraNumberingScope():
  Promise<
    StorageResult<
      FinoraNumberingScope
    >
  > {

  const installationResult =
    await loadFinoraInstallationIdentity();

  if (
    !installationResult.success
  ) {

    return {
      success:
        false,

      error:
        installationResult.error ??
        "Unable to load FINORA installation identity.",
    };
  }

  const installation =
    installationResult.data;

  if (!installation) {

    return {
      success:
        false,

      error:
        "FINORA installation has not been provisioned.",
    };
  }

  const profileResult =
    await loadFinoraBusinessProfile(
      installation.ownerId,
      installation.businessId,
      installation.branchId,
    );

  if (
    !profileResult.success
  ) {

    return {
      success:
        false,

      error:
        profileResult.error ??
        "Unable to load the signed FINORA Business Profile.",
    };
  }

  const profile =
    profileResult.data;

  if (!profile) {

    return {
      success:
        false,

      error:
        "The signed FINORA Business Profile is unavailable for the active installation scope.",
    };
  }

  if (
    profile.ownerId !==
      installation.ownerId ||
    profile.businessId !==
      installation.businessId ||
    profile.branchId !==
      installation.branchId
  ) {

    return {
      success:
        false,

      error:
        "The signed FINORA Business Profile does not match the active installation scope.",
    };
  }

  const businessCodeResult =
    normalizeSignedCode(
      profile.businessCode,
      "Business Code",
    );

  if (
    !businessCodeResult.success ||
    !businessCodeResult.data
  ) {

    return {
      success:
        false,

      error:
        businessCodeResult.error ??
        "Signed FINORA Business Code is required.",
    };
  }

  const branchCodeResult =
    normalizeSignedCode(
      profile.branchCode,
      "Branch Code",
    );

  if (
    !branchCodeResult.success ||
    !branchCodeResult.data
  ) {

    return {
      success:
        false,

      error:
        branchCodeResult.error ??
        "Signed FINORA Branch Code is required.",
    };
  }

  const legacyBusinessCodeValidation =
    validateLegacyInstallationCode(
      installation.businessCode,
      businessCodeResult.data,
      "Business Code",
    );

  if (
    !legacyBusinessCodeValidation.success
  ) {

    return {
      success:
        false,

      error:
        legacyBusinessCodeValidation.error ??
        "FINORA Business Code compatibility validation failed.",
    };
  }

  const legacyBranchCodeValidation =
    validateLegacyInstallationCode(
      installation.branchCode,
      branchCodeResult.data,
      "Branch Code",
    );

  if (
    !legacyBranchCodeValidation.success
  ) {

    return {
      success:
        false,

      error:
        legacyBranchCodeValidation.error ??
        "FINORA Branch Code compatibility validation failed.",
    };
  }

  return {
    success:
      true,

    data: {
      ownerId:
        installation.ownerId,

      businessId:
        installation.businessId,

      branchId:
        installation.branchId,

      businessCode:
        businessCodeResult.data,

      branchCode:
        branchCodeResult.data,
    },
  };
}

// ============================================================
// END
// ============================================================