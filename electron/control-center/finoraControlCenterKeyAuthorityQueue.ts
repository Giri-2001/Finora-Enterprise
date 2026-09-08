/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER KEY AUTHORITY QUEUE

   MODULE  : Control Center
   LAYER   : Main-Process Serialization
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Serialize Control Center operations whose correctness
     depends on one coherent signing-key authority snapshot.

   INTENDED USERS:

   - Signing-key rotation service
   - Recipient trust-transition issuer

   WHY SHARED:

   A trust-transition issuer may need to assert that:

   - one selected signing key still exists,
   - one top-level current key is still current,
   - ROTATE destination equals that current key,

   while producing a signed transition.

   A concurrent local key rotation must not interleave with
   that authority decision.

   IMPORTANT:

   - Electron main-process memory only.
   - No persistence.
   - No IPC.
   - No renderer.
   - No key material.
   - No signing.
   - No package issuance.
   - No cross-process CAS guarantee.
=========================================================== */

// ============================================================
// QUEUE
// ============================================================

let controlCenterKeyAuthorityQueue:
  Promise<void> =
    Promise.resolve();

// ============================================================
// SERIALIZE
// ============================================================

export function runFinoraControlCenterKeyAuthoritySerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {
  const run =
    controlCenterKeyAuthorityQueue.then(
      operation,
      operation,
    );

  controlCenterKeyAuthorityQueue =
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