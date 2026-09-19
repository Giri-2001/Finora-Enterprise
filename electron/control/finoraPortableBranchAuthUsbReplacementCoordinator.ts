// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH USB REPLACEMENT COORDINATOR
// VERSION : 1.0
// PHASE   : 5.6M-1A
// ============================================================
//
// Scope:
// - readable OLD USB -> empty/exact NEW USB
// - exact encrypted Portable Auth artifact is preserved
// - Password + Security Code authenticate source custody
// - Branch Certification private authority is never regenerated
// - source USB is never modified
// - conflicting target USB fails closed
//
// Lost/unreadable OLD USB recovery is intentionally NOT handled
// here. That belongs to Backup / Restore authority.
//
// ============================================================

import {
  resolve,
} from "node:path";

import {
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthUsbReplacementScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraPortableBranchAuthUsbReplacementInput {
  sourceUsbRoot:
    string;

  targetUsbRoot:
    string;

  password:
    string;

  securityCode:
    string;

  expectedScope:
    FinoraPortableBranchAuthUsbReplacementScope;
}

export type FinoraPortableBranchAuthUsbReplacementErrorCode =
  | "INVALID_REQUEST"
  | "SOURCE_NOT_FOUND"
  | "SOURCE_STORAGE_FAILED"
  | "AUTHENTICATION_FAILED"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "TARGET_STORAGE_FAILED"
  | "TARGET_VERIFICATION_FAILED"
  | "SOURCE_CHANGED";

export interface FinoraPortableBranchAuthUsbReplacementSuccess {
  success:
    true;

  data: {
    result:
      "WRITTEN" |
      "ALREADY_MATCHED";

    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    authGeneration:
      number;

    certificationKeyId:
      string;
  };

  errorCode:
    null;

  error:
    null;
}

export interface FinoraPortableBranchAuthUsbReplacementFailure {
  success:
    false;

  data:
    null;

  errorCode:
    FinoraPortableBranchAuthUsbReplacementErrorCode;

  error:
    string;
}

export type FinoraPortableBranchAuthUsbReplacementResult =
  | FinoraPortableBranchAuthUsbReplacementSuccess
  | FinoraPortableBranchAuthUsbReplacementFailure;

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthUsbReplacementErrorCode,
  error:
    string,
): FinoraPortableBranchAuthUsbReplacementFailure {
  return {
    success:
      false,

    data:
      null,

    errorCode,

    error,
  };
}

function normalizeUsbRoot(
  value:
    string,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  if (
    trimmed.length ===
      0
  ) {
    return null;
  }

  return resolve(
    trimmed,
  );
}

function rootsEqual(
  left:
    string,
  right:
    string,
): boolean {
  return (
    left.toLocaleLowerCase("en-US") ===
    right.toLocaleLowerCase("en-US")
  );
}

function envelopesEqual(
  left:
    unknown,
  right:
    unknown,
): boolean {
  return (
    JSON.stringify(
      left,
    ) ===
    JSON.stringify(
      right,
    )
  );
}

// ============================================================
// COORDINATOR
// ============================================================

export async function replaceFinoraPortableBranchAuthUsb(
  input:
    FinoraPortableBranchAuthUsbReplacementInput,
): Promise<
  FinoraPortableBranchAuthUsbReplacementResult
> {
  const sourceUsbRoot =
    normalizeUsbRoot(
      input.sourceUsbRoot,
    );

  const targetUsbRoot =
    normalizeUsbRoot(
      input.targetUsbRoot,
    );

  if (
    sourceUsbRoot ===
      null ||
    targetUsbRoot ===
      null
  ) {
    return failure(
      "INVALID_REQUEST",
      "Source and target USB roots are required.",
    );
  }

  if (
    rootsEqual(
      sourceUsbRoot,
      targetUsbRoot,
    )
  ) {
    return failure(
      "INVALID_REQUEST",
      "Source and target USB roots must be different.",
    );
  }

  const sourceStore =
    new FinoraPortableBranchAuthStore({
      resolveLocalRoot:
        () =>
          null,

      resolveUsbRoot:
        async () =>
          sourceUsbRoot,
    });

  const targetStore =
    new FinoraPortableBranchAuthStore({
      resolveLocalRoot:
        () =>
          null,

      resolveUsbRoot:
        async () =>
          targetUsbRoot,
    });

  let sourceEnvelope;

  try {
    sourceEnvelope =
      await sourceStore.read(
        "USB",
      );
  }
  catch (
    error
  ) {
    return failure(
      "SOURCE_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to read source Portable Branch Auth state.",
    );
  }

  if (
    sourceEnvelope ===
      null
  ) {
    return failure(
      "SOURCE_NOT_FOUND",
      "Source USB does not contain Portable Branch Auth state.",
    );
  }

  let sourcePayload;

  try {
    sourcePayload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        sourceEnvelope,
        input.password,
        input.securityCode,
        {
          expectedScope:
            input.expectedScope,
        },
      );
  }
  catch {
    return failure(
      "AUTHENTICATION_FAILED",
      "Portable Branch Auth authentication failed.",
    );
  }

  if (
    sourcePayload.storageMode !==
      "USB"
  ) {
    return failure(
      "AUTHENTICATION_FAILED",
      "Portable Branch Auth authentication failed.",
    );
  }

  const certificationKeyMaterial =
    sourcePayload.branchCertificationKeyMaterial;

  if (
    certificationKeyMaterial ===
      undefined
  ) {
    return failure(
      "CERTIFICATION_AUTHORITY_MISSING",
      "Portable Branch Auth does not contain migrated Branch Certification authority.",
    );
  }

  let ensureResult:
    "WRITTEN" |
    "ALREADY_MATCHED";

  try {
    ensureResult =
      await targetStore.ensureExact(
        "USB",
        sourceEnvelope,
      );
  }
  catch (
    error
  ) {
    return failure(
      "TARGET_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to provision replacement USB Portable Branch Auth state.",
    );
  }

  let targetEnvelope;

  try {
    targetEnvelope =
      await targetStore.read(
        "USB",
      );
  }
  catch (
    error
  ) {
    return failure(
      "TARGET_VERIFICATION_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to verify replacement USB Portable Branch Auth state.",
    );
  }

  if (
    targetEnvelope ===
      null ||
    !envelopesEqual(
      targetEnvelope,
      sourceEnvelope,
    )
  ) {
    return failure(
      "TARGET_VERIFICATION_FAILED",
      "Replacement USB did not preserve the exact Portable Branch Auth artifact.",
    );
  }

  let sourceEnvelopeAfter;

  try {
    sourceEnvelopeAfter =
      await sourceStore.read(
        "USB",
      );
  }
  catch (
    error
  ) {
    return failure(
      "SOURCE_CHANGED",
      error instanceof Error
        ? error.message
        : "Unable to verify source USB after replacement.",
    );
  }

  if (
    sourceEnvelopeAfter ===
      null ||
    !envelopesEqual(
      sourceEnvelopeAfter,
      sourceEnvelope,
    )
  ) {
    return failure(
      "SOURCE_CHANGED",
      "Source USB changed during replacement.",
    );
  }

  return {
    success:
      true,

    data: {
      result:
        ensureResult,

      ownerId:
        sourcePayload.ownerId,

      businessId:
        sourcePayload.businessId,

      branchId:
        sourcePayload.branchId,

      authGeneration:
        sourcePayload.authGeneration,

      certificationKeyId:
        certificationKeyMaterial.keyId,
    },

    errorCode:
      null,

    error:
      null,
  };
}