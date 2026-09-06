/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET MUTATION COORDINATOR SELFTEST

   RESPONSIBILITY:
   - Prove same-Wallet mutation serialization
   - Prove different Wallets can execute independently
   - Prove failed mutations do not poison later mutations
   - Prove invalid Wallet identity fails before operation execution

   IMPORTANT:
   - No persistence.
   - No StorageManager.
   - No Wallet balance mutation.
   - No timing-based correctness assumptions.
============================================================ */

import {
  hasPendingSerializedWalletMutation,
  runSerializedWalletMutation,
} from "./walletMutationCoordinator";

/* ============================================================
   TEST HELPERS
============================================================ */

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve:
    Deferred<T>["resolve"] =
      () => undefined;

  let reject:
    Deferred<T>["reject"] =
      () => undefined;

  const promise =
    new Promise<T>(
      (resolvePromise, rejectPromise) => {
        resolve =
          resolvePromise;

        reject =
          rejectPromise;
      },
    );

  return {
    promise,
    resolve,
    reject,
  };
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `SELFTEST FAILED: ${message}`,
    );
  }

  console.log(
    `PASS: ${message}`,
  );
}

/* ============================================================
   SAME WALLET SERIALIZATION
============================================================ */

async function testSameWalletSerialization():
Promise<void> {
  const events: string[] = [];

  const firstStarted =
    createDeferred<void>();

  const releaseFirst =
    createDeferred<void>();

  const first =
    runSerializedWalletMutation(
      "WALLET-SERIAL-1",
      async () => {
        events.push(
          "first:start",
        );

        firstStarted.resolve();

        await releaseFirst.promise;

        events.push(
          "first:end",
        );

        return "FIRST";
      },
    );

  await firstStarted.promise;

  assert(
    hasPendingSerializedWalletMutation(
      "WALLET-SERIAL-1",
    ),
    "same-Wallet queue is visible while first mutation is active",
  );

  const second =
    runSerializedWalletMutation(
      "WALLET-SERIAL-1",
      async () => {
        events.push(
          "second:start",
        );

        events.push(
          "second:end",
        );

        return "SECOND";
      },
    );

  assert(
    !events.includes(
      "second:start",
    ),
    "second mutation does not enter while first same-Wallet mutation is active",
  );

  releaseFirst.resolve();

  const results =
    await Promise.all([
      first,
      second,
    ]);

  assert(
    results[0] === "FIRST" &&
    results[1] === "SECOND",
    "same-Wallet serialized operations preserve their results",
  );

  assert(
    events.join("|") ===
      "first:start|first:end|second:start|second:end",
    "same-Wallet mutations execute in strict queue order",
  );

  assert(
    !hasPendingSerializedWalletMutation(
      "WALLET-SERIAL-1",
    ),
    "same-Wallet queue is released after all mutations settle",
  );
}

/* ============================================================
   DIFFERENT WALLET PARALLELISM
============================================================ */

async function testDifferentWalletIndependence():
Promise<void> {
  const walletAStarted =
    createDeferred<void>();

  const releaseWalletA =
    createDeferred<void>();

  let walletBExecuted =
    false;

  const walletA =
    runSerializedWalletMutation(
      "WALLET-PARALLEL-A",
      async () => {
        walletAStarted.resolve();

        await releaseWalletA.promise;

        return "A";
      },
    );

  await walletAStarted.promise;

  const walletB =
    runSerializedWalletMutation(
      "WALLET-PARALLEL-B",
      async () => {
        walletBExecuted =
          true;

        return "B";
      },
    );

  const walletBResult =
    await walletB;

  assert(
    walletBExecuted &&
    walletBResult === "B",
    "different Wallet mutation executes while another Wallet remains blocked",
  );

  assert(
    hasPendingSerializedWalletMutation(
      "WALLET-PARALLEL-A",
    ),
    "blocked Wallet A retains its own independent queue",
  );

  assert(
    !hasPendingSerializedWalletMutation(
      "WALLET-PARALLEL-B",
    ),
    "completed Wallet B releases its independent queue",
  );

  releaseWalletA.resolve();

  const walletAResult =
    await walletA;

  assert(
    walletAResult === "A",
    "blocked Wallet A resumes and completes independently",
  );
}

/* ============================================================
   FAILURE DOES NOT POISON QUEUE
============================================================ */

async function testFailureDoesNotPoisonQueue():
Promise<void> {
  const failureStarted =
    createDeferred<void>();

  const releaseFailure =
    createDeferred<void>();

  const events: string[] = [];

  const failing =
    runSerializedWalletMutation(
      "WALLET-FAILURE-1",
      async () => {
        events.push(
          "failure:start",
        );

        failureStarted.resolve();

        await releaseFailure.promise;

        events.push(
          "failure:throw",
        );

        throw new Error(
          "EXPECTED SELFTEST FAILURE",
        );
      },
    );

  await failureStarted.promise;

  const following =
    runSerializedWalletMutation(
      "WALLET-FAILURE-1",
      async () => {
        events.push(
          "following:start",
        );

        return "RECOVERED";
      },
    );

  assert(
    !events.includes(
      "following:start",
    ),
    "following mutation waits behind a still-active failing mutation",
  );

  releaseFailure.resolve();

  let expectedFailureObserved =
    false;

  try {
    await failing;
  } catch (error) {
    expectedFailureObserved =
      error instanceof Error &&
      error.message ===
        "EXPECTED SELFTEST FAILURE";
  }

  assert(
    expectedFailureObserved,
    "mutation failure is returned to its caller",
  );

  const followingResult =
    await following;

  assert(
    followingResult === "RECOVERED",
    "later same-Wallet mutation runs after previous mutation failure",
  );

  assert(
    events.join("|") ===
      "failure:start|failure:throw|following:start",
    "failed mutation releases the same-Wallet queue deterministically",
  );

  assert(
    !hasPendingSerializedWalletMutation(
      "WALLET-FAILURE-1",
    ),
    "failed-operation queue is removed after subsequent work settles",
  );
}

/* ============================================================
   INVALID WALLET ID
============================================================ */

async function testInvalidWalletId():
Promise<void> {
  let operationExecuted =
    false;

  let rejected =
    false;

  try {
    await runSerializedWalletMutation(
      "   ",
      async () => {
        operationExecuted =
          true;

        return undefined;
      },
    );
  } catch (error) {
    rejected =
      error instanceof Error &&
      error.message.includes(
        "Wallet ID is required",
      );
  }

  assert(
    rejected,
    "empty Wallet ID is rejected",
  );

  assert(
    !operationExecuted,
    "invalid Wallet ID fails before mutation operation executes",
  );
}

/* ============================================================
   RUN
============================================================ */

async function runSelfTest():
Promise<void> {
  await testSameWalletSerialization();

  await testDifferentWalletIndependence();

  await testFailureDoesNotPoisonQueue();

  await testInvalidWalletId();

  console.log("");

  console.log(
    "PASS: FINORA WALLET MUTATION COORDINATOR SELFTEST",
  );
}

void runSelfTest().catch(
  (error) => {
    console.error(
      "FAIL: FINORA WALLET MUTATION COORDINATOR SELFTEST",
      error,
    );

    process.exitCode =
      1;
  },
);

/* ============================================================
   END
============================================================ */