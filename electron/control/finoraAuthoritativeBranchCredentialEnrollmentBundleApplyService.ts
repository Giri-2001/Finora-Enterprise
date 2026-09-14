/* ============================================================
   FINORA BRANCH CREDENTIAL ENROLLMENT
   AUTHORITATIVE RECIPIENT-TRUST APPLY SERVICE

   RESPONSIBILITY:

   - Main process only.
   - Snapshot caller-controlled bundle/time before queue entry.
   - Serialize the complete recipient-trust-sensitive operation.
   - Load authoritative recipient trusted signing keys.
   - Fail closed when recipient trust is unbootstrapped.
   - Delegate cryptographic/composition/application authority to
     applyFinoraBranchCredentialEnrollmentBundle().

   SECURITY:

   - No BrowserWindow dependency.
   - No native dialog dependency.
   - No renderer IPC.
   - No caller-supplied filepath.
   - No caller-supplied trusted keys.
   - No trust-on-first-use.
   - No recipient-trust mutation.
   - No Control Center private signing material.

   SERIALIZATION:

   recipient trust load
   -> exact two-child cryptographic/composition verification
   -> credential authorization + portability provenance apply

   executes inside the shared recipient-trust authority queue.

   This prevents a concurrent trust transition from changing
   signer authority between trusted-key resolution and completion
   of the credential-enrollment apply operation.
============================================================ */

import {
  applyFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundleApplyService.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraControlStoreResult,
  FinoraVerifiedBranchAccessApplyResult,
} from "./finoraControlStore.js";

function failure(
  error:
    string,
): FinoraControlStoreResult<never> {

  return {
    success:
      false,

    error,
  };
}

async function applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrustInternal(
  bundle:
    unknown,

  now:
    Date,
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBranchAccessApplyResult
  >
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
  }
  catch (
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
      "FINORA recipient trust must be bootstrapped before importing a Branch Credential Enrollment Bundle.",
    );
  }

  return applyFinoraBranchCredentialEnrollmentBundle(
    bundle,
    recipientTrust.trustedKeys,
    now,
  );
}

export function applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrust(
  bundle:
    unknown,

  now:
    Date,
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBranchAccessApplyResult
  >
> {

  if (
    !(now instanceof Date) ||
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    return Promise.resolve(
      failure(
        "FINORA Branch Credential Enrollment verification time is invalid.",
      ),
    );
  }

  let bundleSnapshot:
    unknown;

  try {
    bundleSnapshot =
      structuredClone(
        bundle,
      );
  }
  catch (
    error
  ) {
    return Promise.resolve(
      failure(
        error instanceof Error
          ? `Unable to snapshot FINORA Branch Credential Enrollment Bundle: ${error.message}`
          : "Unable to snapshot FINORA Branch Credential Enrollment Bundle.",
      ),
    );
  }

  const nowSnapshot =
    new Date(
      now.getTime(),
    );

  return runFinoraRecipientTrustAuthoritySerialized(
    () =>
      applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrustInternal(
        bundleSnapshot,
        nowSnapshot,
      ),
  );
}