/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL CENTER
   VERIFIED WALLET RECHARGE REQUEST DECLINE SERVICE

   RESPONSIBILITY:

   - Accept only a cryptographically verified Recharge Request.
   - Derive the complete WALLET_RECHARGE_DECLINE issuance draft
     from that locked verified request.
   - Re-authorize the exact Branch Registry identity immediately
     before privileged issuance.
   - Delegate packageId / sequence / issuedAt ownership to the
     existing serialized issuance coordinator.

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer-supplied target, amount, payment reference,
     payment method or payment source.
   - No filesystem.
   - No Wallet / Payment Intent mutation.
============================================================ */

import type {
  FinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestVerifier.js";

import {
  authorizeFinoraControlCenterRegistryBoundIssuanceTarget,
} from "./finoraControlCenterBranchIssuanceAuthorization.js";

import {
  issueFinoraWalletRechargeDeclinePackage,
} from "./finoraControlCenterIssuanceCoordinator.js";

export async function declineFinoraVerifiedWalletRechargeRequest(
  request:
    FinoraVerifiedWalletRechargeRequest,
) {

  const target = {
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
  };

  /*
   * Re-check the authoritative registry immediately before
   * signing. The earlier Request verification is not treated as
   * a perpetual issuance authorization.
   */
  await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
    target,
  );

  return issueFinoraWalletRechargeDeclinePackage({
    target,

    payload: {
      schemaVersion:
        1,

      outcome:
        "DECLINED",

      requestId:
        request.requestId,

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

      requestedAt:
        request.requestedAt,

      scope: {
        ownerId:
          request.target.ownerId,

        businessId:
          request.target.businessId,

        branchId:
          request.target.branchId,
      },

      installationBinding: {
        schemaVersion:
          1,

        installationId:
          request.target.installationId,

        bindingKeyId:
          request.target.bindingKeyId,

        fingerprintAlgorithm:
          request.target.fingerprintAlgorithm,

        publicKeyFingerprint:
          request.target.publicKeyFingerprint,
      },
    },
  });
}

/* ============================================================
   END
============================================================ */