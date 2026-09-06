/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   SIGNED WALLET RECHARGE RESUME SERVICE

   RESPONSIBILITY:
   - Load exact-scope PENDING Wallet Recharge intents
   - Probe native-verified authorization per paymentReference
   - Ignore only AUTHORIZATION_NOT_FOUND
   - Fail closed on bridge/read/validation/mismatch failures
   - Return exactly one resumable paymentReference
   - Reject multiple authorized PENDING intents as ambiguous

   IMPORTANT:
   - No Wallet mutation.
   - No Payment Intent mutation.
   - No direct repository access.
   - No direct StorageManager access.
   - No signed package apply authority.
   - No caller-created verification authority.
============================================================ */

import {
  getPendingWalletRechargeIntentsForScope,
} from "./walletPaymentIntentService";

import {
  resolveSignedWalletRechargeAuthorization,
} from "./finoraWalletRechargeAuthorizationService";

/* ============================================================
   INPUT
============================================================ */

export interface ResolveSignedWalletRechargeResumeCandidateInput {
  walletId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

/* ============================================================
   RESULT
============================================================ */

export interface ResolveSignedWalletRechargeResumeCandidateSuccess {
  success:
    true;

  /**
   * Undefined means there are currently no fully verified
   * signed authorizations for this Wallet's PENDING intents.
   */
  paymentReference:
    string | undefined;
}

export interface ResolveSignedWalletRechargeResumeCandidateFailure {
  success:
    false;

  errorCode:
    | "INVALID_INPUT"
    | "PENDING_INTENT_READ_FAILED"
    | "AUTHORIZATION_PROBE_FAILED"
    | "AMBIGUOUS_SIGNED_RECHARGE";

  error:
    string;
}

export type ResolveSignedWalletRechargeResumeCandidateResult =
  | ResolveSignedWalletRechargeResumeCandidateSuccess
  | ResolveSignedWalletRechargeResumeCandidateFailure;

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeRequiredText(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   RESOLVE RESUMABLE SIGNED RECHARGE
============================================================ */

/**
 * Resolve at most one PENDING Recharge that is already backed
 * by a fully native-verified signed authorization.
 *
 * Probe semantics are deliberately strict:
 *
 * - AUTHORIZATION_NOT_FOUND means this PENDING intent simply
 *   has no signed authorization yet, so probing may continue.
 *
 * - Every other resolver failure is security-significant and
 *   stops the scan immediately.
 *
 * - More than one authorized PENDING intent is ambiguous and
 *   must never be auto-selected for Wallet credit.
 */
export async function resolveSignedWalletRechargeResumeCandidate(
  input: ResolveSignedWalletRechargeResumeCandidateInput,
): Promise<ResolveSignedWalletRechargeResumeCandidateResult> {
  const walletId =
    normalizeRequiredText(input.walletId);

  const ownerId =
    normalizeRequiredText(input.ownerId);

  const businessId =
    normalizeRequiredText(input.businessId);

  const branchId =
    normalizeRequiredText(input.branchId);

  if (
    !walletId ||
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Valid Wallet scope is required to resolve a signed Recharge resume candidate.",
    };
  }

  const pendingResult =
    await getPendingWalletRechargeIntentsForScope({
      walletId,
      ownerId,
      businessId,
      branchId,
    });

  if (!pendingResult.success) {
    return {
      success:
        false,

      errorCode:
        "PENDING_INTENT_READ_FAILED",

      error:
        pendingResult.error,
    };
  }

  let candidatePaymentReference:
    string | undefined;

  for (const intent of pendingResult.data) {
    const paymentReference =
      normalizeRequiredText(
        intent.paymentReference,
      );

    if (!paymentReference) {
      return {
        success:
          false,

        errorCode:
          "AUTHORIZATION_PROBE_FAILED",

        error:
          "A PENDING Wallet Recharge intent is missing its canonical payment reference.",
      };
    }

    const authorizationResult =
      await resolveSignedWalletRechargeAuthorization({
        walletId,
        ownerId,
        businessId,
        branchId,
        paymentReference,
      });

    if (!authorizationResult.success) {
      if (
        authorizationResult.errorCode ===
        "AUTHORIZATION_NOT_FOUND"
      ) {
        continue;
      }

      return {
        success:
          false,

        errorCode:
          "AUTHORIZATION_PROBE_FAILED",

        error:
          authorizationResult.error,
      };
    }

    if (
      candidatePaymentReference &&
      candidatePaymentReference !==
        paymentReference
    ) {
      return {
        success:
          false,

        errorCode:
          "AMBIGUOUS_SIGNED_RECHARGE",

        error:
          "Multiple PENDING Wallet Recharges have verified signed authorizations. Automatic completion is blocked.",
      };
    }

    candidatePaymentReference =
      paymentReference;
  }

  return {
    success:
      true,

    paymentReference:
      candidatePaymentReference,
  };
}

/* ============================================================
   END
============================================================ */
