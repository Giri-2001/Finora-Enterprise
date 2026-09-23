// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH RESTORE TRANSACTION CORE SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import {
  createFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  calculateFinoraFullBranchExactRealDigest,
} from "./finoraFullBranchRestoreStoragePlan.js";

import {
  executeFinoraFullBranchRestoreTransaction,
} from "./finoraFullBranchRestoreTransaction.js";

import type {
  FinoraFullBranchRestoreTransactionDependencies,
  FinoraFullBranchRestoreTransactionMaterial,
} from "./finoraFullBranchRestoreTransaction.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

const scope = {
  ownerId:
    "OWNER-A",

  businessId:
    "BUSINESS-A",

  branchId:
    "BRANCH-A",
};

function record(
  input: {
    id:
      string;

    entity:
      string;

    ownerId?:
      string;

    businessId?:
      string;

    branchId?:
      string;

    demoId?:
      string;
  },
): Record<string, unknown> {
  return {
    id:
      input.id,

    entity:
      input.entity,

    data: {
      id:
        input.id,
    },

    createdAt:
      "2026-09-23T10:00:00.000Z",

    updatedAt:
      "2026-09-23T11:00:00.000Z",

    ownerId:
      input.ownerId ??
      scope.ownerId,

    businessId:
      input.businessId ??
      scope.businessId,

    branchId:
      input.branchId ??
      scope.branchId,

    ...(
      input.demoId ===
        undefined
        ? {}
        : {
            demoId:
              input.demoId,
          }
    ),
  };
}

const snapshot =
  createFinoraFullBranchRealSnapshotV1({
    exportedAt:
      "2026-09-23T12:00:00.000Z",

    branchScope:
      scope,

    records: [
      record({
        id:
          "CUSTOMER-1",

        entity:
          "CUSTOMER",
      }),

      record({
        id:
          "LOAN-1",

        entity:
          "LOAN",
      }),
    ],
  });

const expectedDigest =
  calculateFinoraFullBranchExactRealDigest(
    snapshot.records as never[],
    scope,
  );

const restoredRuntimeAuthority =
  "RUNTIME-AUTHORITY-RESTORED";

const previousRuntimeAuthority =
  "RUNTIME-AUTHORITY-PREVIOUS";

const material:
  FinoraFullBranchRestoreTransactionMaterial =
  {
    branchScope:
      scope,

    storageMode:
      "USB",

    authGeneration:
      2,

    portableAuthEnvelopeSerialized:
      "PORTABLE-AUTH-RESTORED",

    runtimeAuthorityPackageSerialized:
      restoredRuntimeAuthority,

    snapshot,

    snapshotRecordCount:
      2,

    exactRealDigestSha256:
      expectedDigest,
  };

const restoredEnvelope =
  {
    schemaVersion:
      1,
  } as unknown as FinoraPortableBranchAuthEnvelopeV1;

const previousEnvelope =
  {
    schemaVersion:
      1,
  } as unknown as FinoraPortableBranchAuthEnvelopeV1;

interface Harness {
  dependencies:
    FinoraFullBranchRestoreTransactionDependencies;

  getStorage:
    () =>
      unknown[];

  getAuth:
    () =>
      FinoraPortableBranchAuthEnvelopeV1 |
      null;

  getRuntimeAuthority:
    () =>
      string |
      null;

  state: {
    storageWriteCalls:
      number;

    storageRollbackCalls:
      number;

    authWriteCalls:
      number;

    authRollbackCalls:
      number;

    runtimeWriteCalls:
      number;

    runtimeRollbackCalls:
      number;

    writeOrder:
      string[];

    rollbackOrder:
      string[];
  };
}

function clone<T>(
  value:
    T,
): T {
  return structuredClone(
    value,
  );
}

function createHarness(
  options: {
    initialAuth?:
      FinoraPortableBranchAuthEnvelopeV1 |
      null;

    corruptStorageReadback?:
      boolean;

    authWriteMutatesThenFails?:
      boolean;

    corruptAuthReadback?:
      boolean;

    rollbackStorageFails?:
      boolean;

    initialRuntimeAuthority?:
      string |
      null;

    runtimeWriteMutatesThenFails?:
      boolean;

    corruptRuntimeReadback?:
      boolean;

    rollbackRuntimeFails?:
      boolean;
  } = {},
): Harness {
  const initialStorage =
    [
      record({
        id:
          "STALE-CUSTOMER",

        entity:
          "CUSTOMER",
      }),

      record({
        id:
          "SIBLING",

        entity:
          "CUSTOMER",

        branchId:
          "BRANCH-B",
      }),

      record({
        id:
          "EXISTING-DEMO",

        entity:
          "CUSTOMER",

        demoId:
          "DEMO-1",
      }),
    ];

  let storage:
    unknown[] =
      clone(
        initialStorage,
      );

  let auth =
    options.initialAuth ===
      undefined
      ? null
      : options.initialAuth;

  let runtimeAuthority =
    options.initialRuntimeAuthority ===
      undefined
      ? null
      : options.initialRuntimeAuthority;

  const state = {
    storageWriteCalls:
      0,

    storageRollbackCalls:
      0,

    authWriteCalls:
      0,

    authRollbackCalls:
      0,

    runtimeWriteCalls:
      0,

    runtimeRollbackCalls:
      0,

    writeOrder:
      [] as string[],

    rollbackOrder:
      [] as string[],
  };

  const dependencies:
    FinoraFullBranchRestoreTransactionDependencies =
    {
      parsePortableAuth:
        (
          serialized,
        ) => {
          if (
            serialized !==
              material.portableAuthEnvelopeSerialized
          ) {
            throw new Error(
              "Unexpected Portable Auth.",
            );
          }

          return restoredEnvelope;
        },

      serializePortableAuth:
        (
          envelope,
        ) =>
          envelope ===
            restoredEnvelope
            ? material.portableAuthEnvelopeSerialized
            : "PREVIOUS-AUTH",

      captureTargetStorage:
        async () => ({
          records:
            clone(
              storage,
            ),

          rollbackToken:
            clone(
              storage,
            ),
        }),

      writeTargetStorageRecords:
        async (
          records,
        ) => {
          state.storageWriteCalls +=
            1;

          state.writeOrder.push(
            "storage",
          );

          storage =
            clone(
              [...records],
            );
        },

      readTargetStorageRecords:
        async () => {
          if (
            options.corruptStorageReadback
          ) {
            return [
              ...clone(
                storage,
              ),

              record({
                id:
                  "CORRUPT-EXTRA",

                entity:
                  "CUSTOMER",
              }),
            ];
          }

          return clone(
            storage,
          );
        },

      rollbackTargetStorage:
        async (
          token,
        ) => {
          state.storageRollbackCalls +=
            1;

          state.rollbackOrder.push(
            "storage",
          );

          if (
            options.rollbackStorageFails
          ) {
            throw new Error(
              "Rollback failed.",
            );
          }

          storage =
            clone(
              token as unknown[],
            );
        },

      readTargetPortableAuth:
        async () => {
          if (
            options.corruptAuthReadback &&
            state.authWriteCalls >
              0
          ) {
            return previousEnvelope;
          }

          return auth;
        },

      writeTargetPortableAuth:
        async (
          envelope,
        ) => {
          state.authWriteCalls +=
            1;

          state.writeOrder.push(
            "auth",
          );

          auth =
            envelope;

          if (
            options.authWriteMutatesThenFails
          ) {
            throw new Error(
              "Auth write failed after mutation.",
            );
          }
        },

      rollbackTargetPortableAuth:
        async (
          previous,
        ) => {
          state.authRollbackCalls +=
            1;

          state.rollbackOrder.push(
            "auth",
          );

          auth =
            previous;
        },

      readTargetRuntimeAuthority:
        async () => {
          if (
            options.corruptRuntimeReadback &&
            state.runtimeWriteCalls >
              0
          ) {
            return previousRuntimeAuthority;
          }

          return runtimeAuthority;
        },

      writeTargetRuntimeAuthority:
        async (
          serialized,
        ) => {
          state.runtimeWriteCalls +=
            1;

          state.writeOrder.push(
            "runtime",
          );

          runtimeAuthority =
            serialized;

          if (
            options.runtimeWriteMutatesThenFails
          ) {
            throw new Error(
              "Runtime Authority write failed after mutation.",
            );
          }
        },

      rollbackTargetRuntimeAuthority:
        async (
          previous,
        ) => {
          state.runtimeRollbackCalls +=
            1;

          state.rollbackOrder.push(
            "runtime",
          );

          if (
            options.rollbackRuntimeFails
          ) {
            throw new Error(
              "Runtime Authority rollback failed.",
            );
          }

          runtimeAuthority =
            previous;
        },
    };

  return {
    dependencies,

    getStorage:
      () =>
        clone(
          storage,
        ),

    getAuth:
      () =>
        auth,

    getRuntimeAuthority:
      () =>
        runtimeAuthority,

    state,
  };
}

export async function runFinoraFullBranchRestoreTransactionSelfTest():
  Promise<void> {
  const successHarness =
    createHarness();

  const success =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      successHarness.dependencies,
    );

  assert.equal(
    success.success,
    true,
  );

  assert.equal(
    successHarness.state.storageWriteCalls,
    1,
  );

  assert.equal(
    successHarness.state.authWriteCalls,
    1,
  );

  assert.equal(
    successHarness.state.storageRollbackCalls,
    0,
  );

  assert.equal(
    successHarness.state.authRollbackCalls,
    0,
  );

  assert.equal(
    successHarness.state.runtimeWriteCalls,
    1,
  );

  assert.equal(
    successHarness.state.runtimeRollbackCalls,
    0,
  );

  assert.equal(
    successHarness.getRuntimeAuthority(),
    restoredRuntimeAuthority,
  );

  assert.deepEqual(
    successHarness.state.writeOrder,
    [
      "storage",
      "auth",
      "runtime",
    ],
  );

  const successIds =
    successHarness.getStorage().map(
      (
        value,
      ) =>
        (
          value as {
            id:
              string;
          }
        ).id,
    );

  assert.equal(
    successIds.includes(
      "STALE-CUSTOMER",
    ),
    false,
  );

  assert.equal(
    successIds.includes(
      "SIBLING",
    ),
    true,
  );

  assert.equal(
    successIds.includes(
      "EXISTING-DEMO",
    ),
    true,
  );

  assert.equal(
    successIds.includes(
      "CUSTOMER-1",
    ),
    true,
  );

  assert.equal(
    successIds.includes(
      "LOAN-1",
    ),
    true,
  );

  assert.equal(
    successHarness.getAuth(),
    restoredEnvelope,
  );

  console.log(
    "PASS: exact REAL snapshot + Portable Auth commit succeeds as one verified transaction",
  );

  const storageFailureHarness =
    createHarness({
      corruptStorageReadback:
        true,
    });

  const beforeStorageFailure =
    storageFailureHarness.getStorage();

  const storageFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      storageFailureHarness.dependencies,
    );

  assert.equal(
    storageFailure.success,
    false,
  );

  if (
    !storageFailure.success
  ) {
    assert.equal(
      storageFailure.errorCode,
      "TARGET_STORAGE_READBACK_FAILED",
    );
  }

  assert.deepEqual(
    storageFailureHarness.getStorage(),
    beforeStorageFailure,
  );

  assert.equal(
    storageFailureHarness.getAuth(),
    null,
  );

  assert.equal(
    storageFailureHarness.state.authWriteCalls,
    0,
  );

  console.log(
    "PASS: storage readback mismatch rolls storage back before Portable Auth mutation",
  );

  const authFailureHarness =
    createHarness({
      initialAuth:
        previousEnvelope,

      authWriteMutatesThenFails:
        true,
    });

  const beforeAuthFailureStorage =
    authFailureHarness.getStorage();

  const authFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      authFailureHarness.dependencies,
    );

  assert.equal(
    authFailure.success,
    false,
  );

  if (
    !authFailure.success
  ) {
    assert.equal(
      authFailure.errorCode,
      "TARGET_AUTH_WRITE_FAILED",
    );
  }

  assert.deepEqual(
    authFailureHarness.getStorage(),
    beforeAuthFailureStorage,
  );

  assert.equal(
    authFailureHarness.getAuth(),
    previousEnvelope,
  );

  assert.equal(
    authFailureHarness.state.storageRollbackCalls,
    1,
  );

  assert.equal(
    authFailureHarness.state.authRollbackCalls,
    1,
  );

  console.log(
    "PASS: Portable Auth write failure rolls back both storage and prior auth state",
  );

  const authReadbackHarness =
    createHarness({
      initialAuth:
        previousEnvelope,

      corruptAuthReadback:
        true,
    });

  const beforeAuthReadbackStorage =
    authReadbackHarness.getStorage();

  const authReadbackFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      authReadbackHarness.dependencies,
    );

  assert.equal(
    authReadbackFailure.success,
    false,
  );

  if (
    !authReadbackFailure.success
  ) {
    assert.equal(
      authReadbackFailure.errorCode,
      "TARGET_AUTH_READBACK_FAILED",
    );
  }

  assert.deepEqual(
    authReadbackHarness.getStorage(),
    beforeAuthReadbackStorage,
  );

  assert.equal(
    authReadbackHarness.getAuth(),
    previousEnvelope,
  );

  console.log(
    "PASS: Portable Auth readback mismatch rolls back storage and Portable Auth before Runtime Authority mutation",
  );

  const runtimeWriteFailureHarness =
    createHarness({
      initialAuth:
        previousEnvelope,

      initialRuntimeAuthority:
        previousRuntimeAuthority,

      runtimeWriteMutatesThenFails:
        true,
    });

  const beforeRuntimeWriteStorage =
    runtimeWriteFailureHarness.getStorage();

  const runtimeWriteFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      runtimeWriteFailureHarness.dependencies,
    );

  assert.equal(
    runtimeWriteFailure.success,
    false,
  );

  if (
    !runtimeWriteFailure.success
  ) {
    assert.equal(
      runtimeWriteFailure.errorCode,
      "TARGET_RUNTIME_AUTHORITY_WRITE_FAILED",
    );
  }

  assert.deepEqual(
    runtimeWriteFailureHarness.getStorage(),
    beforeRuntimeWriteStorage,
  );

  assert.equal(
    runtimeWriteFailureHarness.getAuth(),
    previousEnvelope,
  );

  assert.equal(
    runtimeWriteFailureHarness.getRuntimeAuthority(),
    previousRuntimeAuthority,
  );

  assert.deepEqual(
    runtimeWriteFailureHarness.state.rollbackOrder,
    [
      "runtime",
      "auth",
      "storage",
    ],
  );

  console.log(
    "PASS: Runtime Authority write failure rolls back Runtime Authority, Portable Auth and storage in reverse mutation order",
  );

  const runtimeReadbackHarness =
    createHarness({
      initialAuth:
        previousEnvelope,

      initialRuntimeAuthority:
        previousRuntimeAuthority,

      corruptRuntimeReadback:
        true,
    });

  const beforeRuntimeReadbackStorage =
    runtimeReadbackHarness.getStorage();

  const runtimeReadbackFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      runtimeReadbackHarness.dependencies,
    );

  assert.equal(
    runtimeReadbackFailure.success,
    false,
  );

  if (
    !runtimeReadbackFailure.success
  ) {
    assert.equal(
      runtimeReadbackFailure.errorCode,
      "TARGET_RUNTIME_AUTHORITY_READBACK_FAILED",
    );
  }

  assert.deepEqual(
    runtimeReadbackHarness.getStorage(),
    beforeRuntimeReadbackStorage,
  );

  assert.equal(
    runtimeReadbackHarness.getAuth(),
    previousEnvelope,
  );

  assert.equal(
    runtimeReadbackHarness.getRuntimeAuthority(),
    previousRuntimeAuthority,
  );

  assert.deepEqual(
    runtimeReadbackHarness.state.rollbackOrder,
    [
      "runtime",
      "auth",
      "storage",
    ],
  );

  console.log(
    "PASS: Runtime Authority readback mismatch rolls back all three authorities",
  );

  const runtimeRollbackFailureHarness =
    createHarness({
      initialAuth:
        previousEnvelope,

      initialRuntimeAuthority:
        previousRuntimeAuthority,

      runtimeWriteMutatesThenFails:
        true,

      rollbackRuntimeFails:
        true,
    });

  const runtimeRollbackFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      runtimeRollbackFailureHarness.dependencies,
    );

  assert.equal(
    runtimeRollbackFailure.success,
    false,
  );

  if (
    !runtimeRollbackFailure.success
  ) {
    assert.equal(
      runtimeRollbackFailure.errorCode,
      "ROLLBACK_FAILED",
    );
  }

  assert.deepEqual(
    runtimeRollbackFailureHarness.state.rollbackOrder,
    [
      "runtime",
      "auth",
      "storage",
    ],
  );

  assert.equal(
    runtimeRollbackFailureHarness.getAuth(),
    previousEnvelope,
  );

  console.log(
    "PASS: Runtime Authority rollback failure is surfaced while Portable Auth and storage rollback are still attempted",
  );

  const badDigestMaterial = {
    ...material,

    exactRealDigestSha256:
      "0".repeat(
        64,
      ),
  };

  const digestHarness =
    createHarness();

  const digestFailure =
    await executeFinoraFullBranchRestoreTransaction(
      badDigestMaterial,
      digestHarness.dependencies,
    );

  assert.equal(
    digestFailure.success,
    false,
  );

  if (
    !digestFailure.success
  ) {
    assert.equal(
      digestFailure.errorCode,
      "PREWRITE_DIGEST_MISMATCH",
    );
  }

  assert.equal(
    digestHarness.state.storageWriteCalls,
    0,
  );

  assert.equal(
    digestHarness.state.authWriteCalls,
    0,
  );

  console.log(
    "PASS: pre-write digest mismatch fails before any target mutation",
  );

  const missingRuntimeMaterialHarness =
    createHarness();

  const missingRuntimeMaterial = {
    ...material,

    runtimeAuthorityPackageSerialized:
      undefined,
  };

  const missingRuntimeMaterialFailure =
    await executeFinoraFullBranchRestoreTransaction(
      missingRuntimeMaterial,
      missingRuntimeMaterialHarness.dependencies,
    );

  assert.equal(
    missingRuntimeMaterialFailure.success,
    false,
  );

  if (
    !missingRuntimeMaterialFailure.success
  ) {
    assert.equal(
      missingRuntimeMaterialFailure.errorCode,
      "INVALID_MATERIAL",
    );
  }

  assert.equal(
    missingRuntimeMaterialHarness.state.storageWriteCalls,
    0,
  );

  assert.equal(
    missingRuntimeMaterialHarness.state.authWriteCalls,
    0,
  );

  assert.equal(
    missingRuntimeMaterialHarness.state.runtimeWriteCalls,
    0,
  );

  console.log(
    "PASS: missing Runtime Authority material fails closed before any target mutation",
  );

  const missingRuntimeDependencyHarness =
    createHarness();

  const {
    readTargetRuntimeAuthority:
      omittedRuntimeAuthorityReader,

    ...missingRuntimeDependencies
  } =
    missingRuntimeDependencyHarness.dependencies;

  void omittedRuntimeAuthorityReader;

  const missingRuntimeDependencyFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      missingRuntimeDependencies,
    );

  assert.equal(
    missingRuntimeDependencyFailure.success,
    false,
  );

  if (
    !missingRuntimeDependencyFailure.success
  ) {
    assert.equal(
      missingRuntimeDependencyFailure.errorCode,
      "TARGET_CAPTURE_FAILED",
    );
  }

  assert.equal(
    missingRuntimeDependencyHarness.state.storageWriteCalls,
    0,
  );

  assert.equal(
    missingRuntimeDependencyHarness.state.authWriteCalls,
    0,
  );

  assert.equal(
    missingRuntimeDependencyHarness.state.runtimeWriteCalls,
    0,
  );

  console.log(
    "PASS: missing Runtime Authority target dependency fails closed before any target mutation",
  );

  const rollbackFailureHarness =
    createHarness({
      corruptStorageReadback:
        true,

      rollbackStorageFails:
        true,
    });

  const rollbackFailure =
    await executeFinoraFullBranchRestoreTransaction(
      material,
      rollbackFailureHarness.dependencies,
    );

  assert.equal(
    rollbackFailure.success,
    false,
  );

  if (
    !rollbackFailure.success
  ) {
    assert.equal(
      rollbackFailure.errorCode,
      "ROLLBACK_FAILED",
    );
  }

  console.log(
    "PASS: rollback failure is surfaced distinctly and never reported as restore success",
  );

  console.log(
    "PASS: Full Branch Restore transaction core self-test complete",
  );
}

if (
  require.main ===
    module
) {
  runFinoraFullBranchRestoreTransactionSelfTest()
    .catch(
      (
        error:
          unknown,
      ) => {
        console.error(
          error,
        );

        process.exitCode =
          1;
      },
    );
}