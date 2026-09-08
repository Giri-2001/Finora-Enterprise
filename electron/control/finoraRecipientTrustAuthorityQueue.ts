/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST AUTHORITY QUEUE

   MODULE  : Electron Control Plane
   LAYER   : Main-Process Serialization
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Serialize operations whose correctness depends on one
     coherent recipient trusted-key state.

   INTENDED USERS:

   - Recipient trust bootstrap
   - Recipient trust-transition apply
   - Production Control Bundle import

   WHY SHARED:

   A Control Bundle import must not:

   1. load one trusted-key snapshot,
   2. race with a trust transition that revokes/retires a key,
   3. continue verification/application using stale authority.

   The complete trust-sensitive operation must execute against
   one serialized recipient-trust authority boundary.

   IMPORTANT:

   - Electron main-process memory only.
   - No persistence.
   - No IPC.
   - No renderer.
   - No trusted-key material.
   - No cryptography.
   - No filesystem access.
   - No cross-process CAS guarantee.
=========================================================== */

// ============================================================
// QUEUE
// ============================================================

let recipientTrustAuthorityQueue:
  Promise<void> =
    Promise.resolve();

// ============================================================
// SERIALIZE
// ============================================================

export function runFinoraRecipientTrustAuthoritySerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {
  const run =
    recipientTrustAuthorityQueue.then(
      operation,
      operation,
    );

  recipientTrustAuthorityQueue =
    run.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return run;
}

// ============================================================
// END
// ============================================================