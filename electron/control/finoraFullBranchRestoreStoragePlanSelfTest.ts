// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// EXACT REAL TENANT RESTORE PLANNER SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import {
  createFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  calculateFinoraFullBranchExactRealDigest,
  planFinoraFullBranchExactRealRestore,
} from "./finoraFullBranchRestoreStoragePlan.js";

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

    marker?:
      string;
  },
): Record<string, unknown> {
  return {
    id:
      input.id,

    entity:
      input.entity,

    data: {
      marker:
        input.marker ??
        input.id,
    },

    createdAt:
      "2026-09-23T10:00:00.000Z",

    updatedAt:
      "2026-09-23T11:00:00.000Z",

    ...(
      input.ownerId ===
        undefined
        ? {}
        : {
            ownerId:
              input.ownerId,
          }
    ),

    ...(
      input.businessId ===
        undefined
        ? {}
        : {
            businessId:
              input.businessId,
          }
    ),

    ...(
      input.branchId ===
        undefined
        ? {}
        : {
            branchId:
              input.branchId,
          }
    ),

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

function expectFailure(
  action:
    () => unknown,
): void {
  let failed =
    false;

  try {
    action();
  }
  catch {
    failed =
      true;
  }

  assert.equal(
    failed,
    true,
  );
}

export function runFinoraFullBranchRestoreStoragePlanSelfTest():
  void {
  const staleCustomer =
    record({
      id:
        "OLD-CUSTOMER",

      entity:
        "CUSTOMER",

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,
    });

  const staleEntityMissingFromBackup =
    record({
      id:
        "STALE-NOTIFICATION",

      entity:
        "NOTIFICATION",

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,
    });

  const siblingBranch =
    record({
      id:
        "SIBLING-CUSTOMER",

      entity:
        "CUSTOMER",

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        "BRANCH-B",
    });

  const siblingOwner =
    record({
      id:
        "OTHER-OWNER",

      entity:
        "LOAN",

      ownerId:
        "OWNER-B",

      businessId:
        "BUSINESS-B",

      branchId:
        "BRANCH-B",
    });

  const sameScopeDemo =
    record({
      id:
        "DEMO-CUSTOMER",

      entity:
        "CUSTOMER",

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      demoId:
        "DEMO-1",
    });

  const restoredCustomer =
    record({
      id:
        "CUSTOMER-1",

      entity:
        "CUSTOMER",

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      marker:
        "BACKUP-CUSTOMER",
    });

  const restoredLoan =
    record({
      id:
        "LOAN-1",

      entity:
        "LOAN",

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      marker:
        "BACKUP-LOAN",
    });

  const snapshot =
    createFinoraFullBranchRealSnapshotV1({
      exportedAt:
        "2026-09-23T12:00:00.000Z",

      branchScope:
        scope,

      records: [
        restoredCustomer,
        restoredLoan,
      ],
    });

  const plan =
    planFinoraFullBranchExactRealRestore({
      currentRecords: [
        staleCustomer,
        staleEntityMissingFromBackup,
        siblingBranch,
        siblingOwner,
        sameScopeDemo,
      ],

      snapshot,

      expectedScope:
        scope,
    });

  assert.equal(
    plan.snapshotRecordCount,
    2,
  );

  assert.equal(
    plan.removedExistingExactRealCount,
    2,
  );

  assert.equal(
    plan.preservedRecordCount,
    3,
  );

  assert.equal(
    plan.finalRecordCount,
    5,
  );

  const ids =
    plan.records.map(
      (
        item,
      ) =>
        item.id,
    );

  assert.equal(
    ids.includes(
      "OLD-CUSTOMER",
    ),
    false,
  );

  assert.equal(
    ids.includes(
      "STALE-NOTIFICATION",
    ),
    false,
  );

  assert.equal(
    ids.includes(
      "CUSTOMER-1",
    ),
    true,
  );

  assert.equal(
    ids.includes(
      "LOAN-1",
    ),
    true,
  );

  console.log(
    "PASS: all stale exact REAL tenant records are removed before snapshot insertion",
  );

  assert.equal(
    ids.includes(
      "SIBLING-CUSTOMER",
    ),
    true,
  );

  assert.equal(
    ids.includes(
      "OTHER-OWNER",
    ),
    true,
  );

  assert.equal(
    ids.includes(
      "DEMO-CUSTOMER",
    ),
    true,
  );

  console.log(
    "PASS: sibling tenants and existing DEMO records are preserved",
  );

  const exactRestored =
    plan.records.filter(
      (
        item,
      ) =>
        item.ownerId ===
          scope.ownerId &&
        item.businessId ===
          scope.businessId &&
        item.branchId ===
          scope.branchId &&
        item.demoId ===
          undefined,
    );

  assert.deepEqual(
    exactRestored.map(
      (
        item,
      ) =>
        item.id,
    ),
    [
      "CUSTOMER-1",
      "LOAN-1",
    ],
  );

  console.log(
    "PASS: final exact REAL tenant state equals backup snapshot exactly",
  );

  const digestAgain =
    calculateFinoraFullBranchExactRealDigest(
      plan.records,
      scope,
    );

  assert.equal(
    digestAgain,
    plan.exactRealDigestSha256,
  );

  assert.match(
    plan.exactRealDigestSha256,
    /^[A-F0-9]{64}$/,
  );

  console.log(
    "PASS: deterministic exact-tenant SHA-256 digest supports readback verification",
  );

  (
    restoredCustomer.data as {
      marker:
        string;
    }
  ).marker =
    "MUTATED-AFTER-PLAN";

  const plannedCustomer =
    plan.records.find(
      (
        item,
      ) =>
        item.id ===
          "CUSTOMER-1",
    );

  assert.equal(
    (
      plannedCustomer?.data as {
        marker:
          string;
      }
    ).marker,
    "BACKUP-CUSTOMER",
  );

  console.log(
    "PASS: planned restore state is detached from mutable snapshot input",
  );

  const wrongScopeSnapshot =
    createFinoraFullBranchRealSnapshotV1({
      exportedAt:
        "2026-09-23T12:00:00.000Z",

      branchScope: {
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          "WRONG-BRANCH",
      },

      records: [],
    });

  expectFailure(
    () =>
      planFinoraFullBranchExactRealRestore({
        currentRecords:
          [],

        snapshot:
          wrongScopeSnapshot,

        expectedScope:
          scope,
      }),
  );

  console.log(
    "PASS: snapshot branch-scope mismatch fails closed",
  );

  const crossTenantRecordSnapshot =
    createFinoraFullBranchRealSnapshotV1({
      exportedAt:
        "2026-09-23T12:00:00.000Z",

      branchScope:
        scope,

      records: [
        record({
          id:
            "WRONG-BRANCH-RECORD",

          entity:
            "CUSTOMER",

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            "WRONG-BRANCH",
        }),
      ],
    });

  expectFailure(
    () =>
      planFinoraFullBranchExactRealRestore({
        currentRecords:
          [],

        snapshot:
          crossTenantRecordSnapshot,

        expectedScope:
          scope,
      }),
  );

  console.log(
    "PASS: cross-tenant record inside backup snapshot fails closed",
  );

  const demoSnapshot =
    createFinoraFullBranchRealSnapshotV1({
      exportedAt:
        "2026-09-23T12:00:00.000Z",

      branchScope:
        scope,

      records: [
        record({
          id:
            "FORBIDDEN-DEMO",

          entity:
            "CUSTOMER",

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,

          demoId:
            "DEMO-2",
        }),
      ],
    });

  expectFailure(
    () =>
      planFinoraFullBranchExactRealRestore({
        currentRecords:
          [],

        snapshot:
          demoSnapshot,

        expectedScope:
          scope,
      }),
  );

  console.log(
    "PASS: DEMO record inside Full Backup snapshot fails closed",
  );

  expectFailure(
    () =>
      planFinoraFullBranchExactRealRestore({
        currentRecords: [
          record({
            id:
              "AMBIGUOUS-LEGACY",

            entity:
              "CUSTOMER",

            ownerId:
              scope.ownerId,
          }),
        ],

        snapshot,

        expectedScope:
          scope,
      }),
  );

  console.log(
    "PASS: ambiguous existing target record fails closed instead of being silently preserved",
  );

  const emptyTargetPlan =
    planFinoraFullBranchExactRealRestore({
      currentRecords:
        [],

      snapshot,

      expectedScope:
        scope,
    });

  assert.equal(
    emptyTargetPlan.finalRecordCount,
    2,
  );

  assert.equal(
    emptyTargetPlan.removedExistingExactRealCount,
    0,
  );

  console.log(
    "PASS: empty replacement USB storage can receive the exact REAL snapshot",
  );

  console.log(
    "PASS: Full Branch exact REAL restore planner self-test complete",
  );
}

if (
  require.main ===
    module
) {
  try {
    runFinoraFullBranchRestoreStoragePlanSelfTest();
  }
  catch (
    error:
      unknown
  ) {
    console.error(
      error,
    );

    process.exitCode =
      1;
  }
}