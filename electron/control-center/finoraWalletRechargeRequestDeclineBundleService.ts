/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL CENTER
   WALLET RECHARGE REQUEST DECLINE BUNDLE SERVICE

   RESPONSIBILITY:

   - Issue the dedicated signed WALLET_RECHARGE_DECLINE child.
   - Wrap that exact signed child in FINORA_CONTROL_BUNDLE_V1.
   - Reuse the existing serialized Control Bundle issuer.
   - Preserve exact child / outer target parity.

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer authority.
   - No filesystem.
   - No Wallet / Payment Intent mutation.
============================================================ */

import type {
  FinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestVerifier.js";

import {
  declineFinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestDeclineService.js";

import {
  issueFinoraControlBundlePackage,
} from "./finoraControlCenterIssuanceCoordinator.js";

export async function issueFinoraVerifiedWalletRechargeDeclineBundle(
  request:
    FinoraVerifiedWalletRechargeRequest,
) {

  const signedDecline =
    await declineFinoraVerifiedWalletRechargeRequest(
      request,
    );

  return issueFinoraControlBundlePackage({
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
      schemaVersion:
        1,

      bundleFormat:
        "FINORA_CONTROL_BUNDLE_V1",

      packages: [
        signedDecline,
      ],
    },
  });
}

/* ============================================================
   END
============================================================ */