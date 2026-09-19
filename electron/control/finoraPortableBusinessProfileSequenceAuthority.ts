/*
 * FINORA ENTERPRISE OS
 * PORTABLE BUSINESS_PROFILE RECIPIENT SEQUENCE AUTHORITY
 *
 * This authority is deliberately pure:
 * - no Control Store persistence
 * - no current-device rebinding
 * - no generic controlSequences mutation
 *
 * Portable BUSINESS_PROFILE sequence authority is branch scoped.
 * Historical native BUSINESS_PROFILE rows remain installation
 * scoped, so their maximum must be folded across installationIds.
 */

export const FINORA_PORTABLE_BUSINESS_PROFILE_PURPOSE =
  "BUSINESS_PROFILE" as const;

export interface FinoraPortableBusinessProfileAppliedPackageRecord {
  packageId:
    string;
}

export interface FinoraPortableBusinessProfileLegacySequenceRecord {
  issuerId:
    string;

  purpose:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  lastSequence:
    number;
}

export interface FinoraPortableBusinessProfileSequenceStateRecord {
  issuerId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  lastSequence:
    number;

  updatedAt:
    string;
}

export interface EvaluateFinoraPortableBusinessProfileSequenceInput {
  packageId:
    string;

  issuerId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  sequence:
    number;

  appliedControlPackages:
    readonly FinoraPortableBusinessProfileAppliedPackageRecord[];

  controlSequences:
    readonly FinoraPortableBusinessProfileLegacySequenceRecord[];

  portableBusinessProfileSequences:
    readonly FinoraPortableBusinessProfileSequenceStateRecord[];
}

export type FinoraPortableBusinessProfileSequenceEvaluation =
  | {
      success:
        true;

      previousSequence:
        number;
    }
  | {
      success:
        false;

      reason:
        | "INVALID_INPUT"
        | "PACKAGE_REPLAY"
        | "STALE_SEQUENCE";

      previousSequence:
        number;
    };

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isPositiveSafeInteger(
  value:
    unknown,
): value is number {

  return (
    Number.isSafeInteger(
      value,
    ) &&
    (
      value as
        number
    ) >
      0
  );
}

export function evaluateFinoraPortableBusinessProfileSequence(
  input:
    EvaluateFinoraPortableBusinessProfileSequenceInput,
): FinoraPortableBusinessProfileSequenceEvaluation {

  if (
    !isNonEmptyString(
      input.packageId,
    ) ||
    !isNonEmptyString(
      input.issuerId,
    ) ||
    !isNonEmptyString(
      input.ownerId,
    ) ||
    !isNonEmptyString(
      input.businessId,
    ) ||
    !isNonEmptyString(
      input.branchId,
    ) ||
    !isPositiveSafeInteger(
      input.sequence,
    )
  ) {
    return {
      success:
        false,

      reason:
        "INVALID_INPUT",

      previousSequence:
        0,
    };
  }

  /*
   * packageId replay is global.
   *
   * Deliberately do not scope packageId replay by purpose,
   * branch, issuer, or installation.
   */
  if (
    input.appliedControlPackages.some(
      (record) =>
        record.packageId ===
        input.packageId,
    )
  ) {
    return {
      success:
        false,

      reason:
        "PACKAGE_REPLAY",

      previousSequence:
        0,
    };
  }

  let historicalNativeHighWater =
    0;

  /*
   * Legacy BUSINESS_PROFILE sequence rows are installation scoped.
   *
   * Portable branch authority folds every historical installation
   * row for the exact issuer + owner + business + branch.
   */
  for (
    const record of
      input.controlSequences
  ) {

    if (
      record.issuerId !==
        input.issuerId ||
      record.purpose !==
        FINORA_PORTABLE_BUSINESS_PROFILE_PURPOSE ||
      record.ownerId !==
        input.ownerId ||
      record.businessId !==
        input.businessId ||
      record.branchId !==
        input.branchId
    ) {
      continue;
    }

    if (
      isPositiveSafeInteger(
        record.lastSequence,
      )
    ) {
      historicalNativeHighWater =
        Math.max(
          historicalNativeHighWater,
          record.lastSequence,
        );
    }
  }

  let portableHighWater =
    0;

  for (
    const record of
      input.portableBusinessProfileSequences
  ) {

    if (
      record.issuerId !==
        input.issuerId ||
      record.ownerId !==
        input.ownerId ||
      record.businessId !==
        input.businessId ||
      record.branchId !==
        input.branchId
    ) {
      continue;
    }

    if (
      isPositiveSafeInteger(
        record.lastSequence,
      )
    ) {
      portableHighWater =
        Math.max(
          portableHighWater,
          record.lastSequence,
        );
    }
  }

  const previousSequence =
    Math.max(
      historicalNativeHighWater,
      portableHighWater,
    );

  if (
    input.sequence <=
      previousSequence
  ) {
    return {
      success:
        false,

      reason:
        "STALE_SEQUENCE",

      previousSequence,
    };
  }

  return {
    success:
      true,

    previousSequence,
  };
}