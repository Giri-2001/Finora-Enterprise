/* ===========================================================
   FINORA ENTERPRISE OS™

   AUTHORITATIVE CONTROL BUNDLE APPLY SERVICE

   MODULE  : Native Control
   LAYER   : Recipient Trust Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept one already-read signed CONTROL_BUNDLE candidate
   - Serialize the complete trust-sensitive apply operation
   - Load authoritative recipient trusted signing keys
   - Fail closed when recipient trust is unbootstrapped
   - Delegate cryptographic/composition/domain application to
     the signed CONTROL_BUNDLE apply service

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer IPC.
   - No BrowserWindow.
   - No native dialog.
   - No caller-supplied filepath.
   - No caller-supplied trusted keys.
   - No caller-supplied installation target.
   - No private signing key.
   - No Control Center key-vault access.
   - No trust-on-first-use.
   - No bootstrap authority.
   - No recipient trust mutation authority.

   SERIALIZATION:

   Entire:

   recipient trust load
   -> CONTROL_BUNDLE cryptographic/composition preflight
   -> purpose-specific child application

   executes inside the shared recipient-trust authority queue.

   This prevents a recipient trust transition from changing
   signer authority between trusted-key snapshot resolution and
   completion of the bundle apply operation.

   IMPORTANT:

   CONTROL_BUNDLE child application remains deliberately
   NON-ATOMIC after successful cryptographic/composition
   preflight.

   Serialization is Electron main-process memory only.
   There is no cross-process CAS guarantee.
=========================================================== */

import {
  applyFinoraSignedControlBundlePackage,
} from "./finoraControlBundlePackageApplyService.js";

import type {
  FinoraControlBundleApplyResult,
} from "./finoraControlBundlePackageApplyService.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

// ============================================================
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraControlBundleApplyResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// INTERNAL APPLY
// ============================================================

async function applyFinoraSignedControlBundleWithAuthoritativeRecipientTrustInternal(
  signedBundle:
    unknown,

  now:
    Date,
): Promise<
  FinoraControlBundleApplyResult
> {
  let recipientTrust:
    Awaited<
      ReturnType<
        typeof loadFinoraRecipientTrustStore
      >
    >;

  try {
    recipientTrust =
      await loadFinoraRecipientTrustStore();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load authoritative FINORA recipient trust.",
    );
  }

  if (
    recipientTrust ===
      undefined ||
    recipientTrust.trustedKeys.length ===
      0
  ) {
    return failure(
      "FINORA recipient trust must be bootstrapped before importing a Control Bundle.",
    );
  }

  return applyFinoraSignedControlBundlePackage(
    signedBundle,
    recipientTrust.trustedKeys,
    now,
  );
}

// ============================================================
// PUBLIC SERIALIZED APPLY
// ============================================================

export function applyFinoraSignedControlBundleWithAuthoritativeRecipientTrust(
  signedBundle:
    unknown,

  now:
    Date,
): Promise<
  FinoraControlBundleApplyResult
> {
  return runFinoraRecipientTrustAuthoritySerialized(
    () =>
      applyFinoraSignedControlBundleWithAuthoritativeRecipientTrustInternal(
        signedBundle,
        now,
      ),
  );
}

// ============================================================
// END
// ============================================================