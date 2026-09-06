/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET MUTATION COORDINATOR

   RESPONSIBILITY:
   - Serialize Wallet balance mutations per Wallet ID
   - Share one mutation boundary across Debit and Recharge flows
   - Allow unrelated Wallets to mutate independently
   - Keep failed operations from poisoning the Wallet queue
   - Release idle Wallet queues after completion

   IMPORTANT:
   - No React.
   - No UI.
   - No persistence.
   - No StorageManager access.
   - No Wallet calculations.
   - No ledger mutation.
   - No pricing logic.
   - No Business Date.
   - This is an in-process serialization boundary.
   - StorageManager does not provide a database transaction or CAS.
============================================================ */

/* ============================================================
   INTERNAL QUEUE STATE
============================================================ */

const walletMutationTails =
  new Map<string, Promise<void>>();

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeWalletMutationId(
  walletId: string,
): string {
  return String(
    walletId ?? "",
  ).trim();
}

/* ============================================================
   RUN SERIALIZED WALLET MUTATION
============================================================ */

/**
 * Executes one Wallet mutation only after the previous mutation
 * for the same Wallet ID has settled.
 *
 * Different Wallet IDs do not share the same queue.
 *
 * The queue tail always settles successfully so a rejected
 * operation cannot permanently poison later Wallet mutations.
 */
export async function runSerializedWalletMutation<T>(
  walletId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const normalizedWalletId =
    normalizeWalletMutationId(
      walletId,
    );

  if (!normalizedWalletId) {
    throw new Error(
      "Wallet ID is required before serialized Wallet mutation.",
    );
  }

  const previousTail =
    walletMutationTails.get(
      normalizedWalletId,
    ) ??
    Promise.resolve();

  let releaseCurrent:
    (() => void) | undefined;

  const currentGate =
    new Promise<void>(
      (resolve) => {
        releaseCurrent =
          resolve;
      },
    );

  const currentTail =
    previousTail
      .catch(
        () => undefined,
      )
      .then(
        () => currentGate,
      );

  walletMutationTails.set(
    normalizedWalletId,
    currentTail,
  );

  await previousTail.catch(
    () => undefined,
  );

  try {
    return await operation();
  } finally {
    releaseCurrent?.();

    if (
      walletMutationTails.get(
        normalizedWalletId,
      ) === currentTail
    ) {
      walletMutationTails.delete(
        normalizedWalletId,
      );
    }
  }
}

/* ============================================================
   TEST / DIAGNOSTIC READ
============================================================ */

/**
 * Returns whether an in-process Wallet mutation queue currently
 * exists for the supplied Wallet ID.
 *
 * This does not expose or mutate the queued operation.
 */
export function hasPendingSerializedWalletMutation(
  walletId: string,
): boolean {
  const normalizedWalletId =
    normalizeWalletMutationId(
      walletId,
    );

  if (!normalizedWalletId) {
    return false;
  }

  return walletMutationTails.has(
    normalizedWalletId,
  );
}

/* ============================================================
   END
============================================================ */