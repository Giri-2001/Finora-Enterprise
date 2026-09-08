// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY PACKAGE GENERATOR
//
// MODULE  : Offline Recovery Authority
// LAYER   : Privileged Issuance + Native Artifact Export
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Reject an unavailable native parent window before issuance
// - Issue one signed RECIPIENT_TRUST_RECOVERY package through
//   the independent offline Recovery Authority
// - Export the signed package through the dedicated native
//   .finora artifact writer
// - Return only bounded issuance/export metadata
//
// SECURITY:
//
// - No renderer / IPC / preload.
// - No caller-supplied filesystem path.
// - No direct private-key handling.
// - No direct Recovery vault access.
// - No direct sequence-ledger access.
// - No recipient trust-store access.
// - No recipient Recovery public-anchor mutation.
// - No operational Control Center authority reuse.
//
// ORDERING:
//
// parent-window validation
// -> Recovery issuance
// -> native Save dialog/export
//
// The issuer persists sequence reservation before signing.
// Therefore Save cancellation or later export failure can consume
// a Recovery sequence. Forward sequence gaps are intentionally
// accepted by the recipient Recovery replay contract.
// ============================================================

import type {
  BrowserWindow,
} from "electron";

import {
  exportFinoraRecipientTrustRecoveryArtifact,
} from "./finoraRecipientTrustRecoveryArtifactWriter.js";

import {
  issueFinoraRecipientTrustRecovery,
} from "./finoraRecipientTrustRecoveryIssuer.js";

import type {
  FinoraRecipientTrustRecoveryIssueRequest,
} from "./finoraRecipientTrustRecoveryIssuer.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryGenerationResult =
  | {
      success:
        true;

      cancelled:
        true;

      sequence:
        number;

      packageId:
        string;

      issuedAt:
        string;

      recoveryAuthorityId:
        string;

      signingKeyId:
        string;
    }
  | {
      success:
        true;

      cancelled:
        false;

      sequence:
        number;

      packageId:
        string;

      issuedAt:
        string;

      recoveryAuthorityId:
        string;

      signingKeyId:
        string;

      fileName:
        string;

      bytesWritten:
        number;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// RESULT HELPER
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustRecoveryGenerationResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// GENERATE + EXPORT
// ============================================================

export async function generateAndExportFinoraRecipientTrustRecovery(
  parentWindow:
    BrowserWindow,

  request:
    FinoraRecipientTrustRecoveryIssueRequest,

  now?:
    Date,
): Promise<
  FinoraRecipientTrustRecoveryGenerationResult
> {
  // ----------------------------------------------------------
  // 1. PARENT WINDOW MUST EXIST BEFORE SEQUENCE RESERVATION
  // ----------------------------------------------------------

  if (
    parentWindow.isDestroyed()
  ) {
    return failure(
      "FINORA Recipient Trust Recovery export window is no longer available.",
    );
  }

  // ----------------------------------------------------------
  // 2. ISSUE SIGNED RECOVERY PACKAGE
  //
  // The issuer owns:
  // - independent Recovery private-key authority
  // - payload/draft validation
  // - issuer clock
  // - durable Recovery sequence reservation
  // - canonical signing
  // ----------------------------------------------------------

  const issueResult =
    await issueFinoraRecipientTrustRecovery(
      request,
      now,
    );

  if (
    !issueResult.success
  ) {
    return failure(
      issueResult.error,
    );
  }

  const signedRecovery =
    issueResult.data.signedRecovery;

  // ----------------------------------------------------------
  // 3. NATIVE .FINORA EXPORT
  //
  // No filesystem path is accepted from the caller here.
  // Native Save cancellation occurs after issuance and may
  // therefore leave an intentional sequence gap.
  // ----------------------------------------------------------

  const exportResult =
    await exportFinoraRecipientTrustRecoveryArtifact(
      parentWindow,
      signedRecovery,
    );

  if (
    !exportResult.success
  ) {
    return failure(
      exportResult.error,
    );
  }

  const common = {
    sequence:
      issueResult.data.sequence,

    packageId:
      signedRecovery.packageId,

    issuedAt:
      issueResult.data.issuedAt,

    recoveryAuthorityId:
      issueResult.data.recoveryAuthorityId,

    signingKeyId:
      issueResult.data.signingKeyId,
  };

  if (
    exportResult.cancelled
  ) {
    return {
      success:
        true,

      cancelled:
        true,

      ...common,
    };
  }

  return {
    success:
      true,

    cancelled:
      false,

    ...common,

    fileName:
      exportResult.fileName,

    bytesWritten:
      exportResult.bytesWritten,
  };
}

// ============================================================
// END
// ============================================================