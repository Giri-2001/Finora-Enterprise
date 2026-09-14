/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL CENTER â€” WALLET RECHARGE REQUEST APPROVAL BUNDLE

   RESPONSIBILITY:

   - Accept one already cryptographically verified Wallet
     Recharge Request snapshot.
   - Reuse the existing approval service to issue the signed
     WALLET_RECHARGE child package.
   - Wrap that child in the existing signed
     FINORA_CONTROL_BUNDLE_V1 recipient-compatible envelope.
   - Preserve exact target parity between outer bundle and child.
   - Reuse existing authoritative packageId / sequence / issuedAt
     reservation and signing paths for both package purposes.

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer-controlled financial or target fields.
   - No duplicate cryptography.
   - No private-key access.
   - No Business Date.
   - No recipient Wallet mutation.
   - No filesystem transport.
============================================================ */

import {
  issueFinoraControlBundlePackage,
} from "./finoraControlCenterIssuanceCoordinator.js";

import type {
  FinoraControlBundleIssuanceTarget,
} from "./finoraControlBundleIssuancePolicy.js";

import {
  approveFinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestApprovalService.js";

import type {
  FinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestVerifier.js";

function toRequiredControlBundleTarget(
  value:
    {
      ownerId?: string;
      businessId?: string;
      branchId?: string;
      installationId?: string;
      bindingKeyId?: string;
      fingerprintAlgorithm?: string;
      publicKeyFingerprint?: string;
    },
): FinoraControlBundleIssuanceTarget {

  if (
    typeof value.ownerId !== "string" ||
    value.ownerId.trim().length === 0 ||
    typeof value.businessId !== "string" ||
    value.businessId.trim().length === 0 ||
    typeof value.branchId !== "string" ||
    value.branchId.trim().length === 0 ||
    typeof value.installationId !== "string" ||
    value.installationId.trim().length === 0 ||
    typeof value.bindingKeyId !== "string" ||
    value.bindingKeyId.trim().length === 0 ||
    value.fingerprintAlgorithm !== "SHA-256" ||
    typeof value.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(
      value.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "Signed WALLET_RECHARGE child target is incomplete for Control Bundle issuance.",
    );
  }

  return {
    ownerId:
      value.ownerId,

    businessId:
      value.businessId,

    branchId:
      value.branchId,

    installationId:
      value.installationId,

    bindingKeyId:
      value.bindingKeyId,

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      value.publicKeyFingerprint,
  };
}

export async function issueFinoraVerifiedWalletRechargeApprovalBundle(
  request:
    FinoraVerifiedWalletRechargeRequest,
): Promise<
  Awaited<
    ReturnType<
      typeof issueFinoraControlBundlePackage
    >
  >
> {

  /*
   * Child issuance owns:
   * - exact verified request -> WALLET_RECHARGE mapping,
   * - current Branch Registry re-authorization,
   * - WALLET_RECHARGE reservation / authoritative issuedAt,
   * - WALLET_RECHARGE signing.
   */
  const signedWalletRecharge =
    await approveFinoraVerifiedWalletRechargeRequest(
      request,
    );

  /*
   * Recipient Wallet import already uses the generic native
   * Control Bundle import path. Therefore the approved child
   * must be transported inside the existing signed
   * FINORA_CONTROL_BUNDLE_V1 envelope.
   *
   * The outer target is copied from the already signed child
   * package target, not reconstructed from renderer input.
   * Existing Control Bundle policy enforces exact target parity.
   */
  return issueFinoraControlBundlePackage({
    target:
      toRequiredControlBundleTarget(
        signedWalletRecharge.target,
      ),

    payload: {
      schemaVersion:
        1,

      bundleFormat:
        "FINORA_CONTROL_BUNDLE_V1",

      packages: [
        signedWalletRecharge,
      ],
    },
  });
}

/* ============================================================
   END
============================================================ */