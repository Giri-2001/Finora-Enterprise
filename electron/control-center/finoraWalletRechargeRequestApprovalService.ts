/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL CENTER â€” WALLET RECHARGE REQUEST APPROVAL SERVICE

   RESPONSIBILITY:

   - Accept one already cryptographically verified Wallet
     Recharge Request snapshot from privileged main-process
     session authority.
   - Derive the complete existing WALLET_RECHARGE issuance
     request from that locked snapshot only.
   - Re-authorize the exact target against Branch Registry.
   - Reuse the existing serialized Wallet Recharge issuance
     coordinator for packageId / sequence / authoritative time.
   - Reuse the existing WALLET_RECHARGE signer and policy.

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer-controlled target / amount / paymentReference.
   - No renderer-controlled payment method / source.
   - No Business Date.
   - No local clock generated here.
   - No duplicate signing implementation.
   - No private-key access.
   - No Wallet mutation.
   - No filesystem export.
============================================================ */

import {
  authorizeFinoraControlCenterRegistryBoundIssuanceTarget,
} from "./finoraControlCenterBranchIssuanceAuthorization.js";

import {
  issueFinoraWalletRechargePackage,
  type IssueFinoraWalletRechargeRequest,
} from "./finoraControlCenterIssuanceCoordinator.js";

import type {
  FinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestVerifier.js";

function buildIssuanceRequestFromVerifiedRequest(
  request:
    FinoraVerifiedWalletRechargeRequest,
): IssueFinoraWalletRechargeRequest {

  return {
    target: {
      ownerId:
        request.target.ownerId,

      businessId:
        request.target.businessId,

      branchId:
        request.target.branchId,

      installationId:
        request.target.installationId,

      bindingKeyId:
        request.target.bindingKeyId,

      fingerprintAlgorithm:
        request.target.fingerprintAlgorithm,

      publicKeyFingerprint:
        request.target.publicKeyFingerprint,
    },

    payload: {
      scope: {
        ownerId:
          request.target.ownerId,

        businessId:
          request.target.businessId,

        branchId:
          request.target.branchId,
      },

      installationBinding: {
        installationId:
          request.target.installationId,

        bindingKeyId:
          request.target.bindingKeyId,

        fingerprintAlgorithm:
          request.target.fingerprintAlgorithm,

        publicKeyFingerprint:
          request.target.publicKeyFingerprint,

        schemaVersion:
          1,
      },

      paymentReference:
        request.paymentReference,

      amountMinor:
        request.amountMinor,

      currency:
        request.currency,

      paymentMethod:
        request.paymentMethod,

      paymentSource:
        request.paymentSource,

      schemaVersion:
        1,
    },
  };
}

export async function approveFinoraVerifiedWalletRechargeRequest(
  request:
    FinoraVerifiedWalletRechargeRequest,
): Promise<
  Awaited<
    ReturnType<
      typeof issueFinoraWalletRechargePackage
    >
  >
> {

  const issuanceRequest =
    buildIssuanceRequestFromVerifiedRequest(
      request,
    );

  /*
   * Re-authorize the exact imported signed request target
   * against the current Branch Registry immediately before
   * reserving/signing the approval package.
   */
  await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
    issuanceRequest.target,
  );

  /*
   * Existing issuance coordinator owns serialization,
   * packageId, sequence and authoritative issuedAt.
   */
  return issueFinoraWalletRechargePackage(
    issuanceRequest,
  );
}

/* ============================================================
   END
============================================================ */