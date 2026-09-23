// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// EXACT REAL TENANT STORAGE SNAPSHOT SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import type {
  FinoraFullBranchBackupScopeV2,
} from "./finoraFullBranchBackupContract.js";

import {
  captureFinoraFullBranchRealStorageSnapshot,
} from "./finoraFullBranchBackupStorageSnapshot.js";

function makeRecord(
  input: {
    id:
      string;

    entity:
      string;

    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    demoId?:
      string;

    data?:
      unknown;
  },
): Record<string, unknown> {
  return {
    id:
      input.id,

    entity:
      input.entity,

    data:
      input.data ?? {
        value:
          input.id,
      },

    createdAt:
      "2026-09-23T10:00:00.000Z",

    updatedAt:
      "2026-09-23T11:00:00.000Z",

    ownerId:
      input.ownerId,

    businessId:
      input.businessId,

    branchId:
      input.branchId,

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

export function runFinoraFullBranchBackupStorageSnapshotSelfTest():
  void {
  const scope:
    FinoraFullBranchBackupScopeV2 =
    {
      ownerId:
        "OWNER-A",

      businessId:
        "BUSINESS-A",

      branchId:
        "BRANCH-A",
    };

  const activeCustomer =
    makeRecord({
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

      data: {
        identity: {
          customerId:
            "CUSTOMER-1",
        },

        /*
         * Historical values inside domain payload are provenance
         * and must not control physical backup selection.
         */
        businessId:
          "HISTORICAL-BUSINESS",

        branchId:
          "HISTORICAL-BRANCH",
      },
    });

  const activeLoan =
    makeRecord({
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
    });

  const siblingOwner =
    makeRecord({
      id:
        "CUSTOMER-SIBLING-OWNER",

      entity:
        "CUSTOMER",

      ownerId:
        "OWNER-B",

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,
    });

  const siblingBusiness =
    makeRecord({
      id:
        "CUSTOMER-SIBLING-BUSINESS",

      entity:
        "CUSTOMER",

      ownerId:
        scope.ownerId,

      businessId:
        "BUSINESS-B",

      branchId:
        scope.branchId,
    });

  const siblingBranch =
    makeRecord({
      id:
        "CUSTOMER-SIBLING-BRANCH",

      entity:
        "CUSTOMER",

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        "BRANCH-B",
    });

  const activeDemo =
    makeRecord({
      id:
        "CUSTOMER-DEMO",

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

  const snapshot =
    captureFinoraFullBranchRealStorageSnapshot({
      exportedAt:
        "2026-09-23T12:00:00.000Z",

      branchScope:
        scope,

      records: [
        activeCustomer,
        activeLoan,
        siblingOwner,
        siblingBusiness,
        siblingBranch,
        activeDemo,
      ],
    });

  assert.equal(
    snapshot.dataContext,
    "REAL",
  );

  assert.equal(
    snapshot.recordCount,
    2,
  );

  assert.deepEqual(
    snapshot.records.map(
      (
        record:
          unknown,
      ) =>
        (
          record as {
            id:
              string;
          }
        ).id,
    ),
    [
      "CUSTOMER-1",
      "LOAN-1",
    ],
  );

  console.log(
    "PASS: exact REAL tenant records selected and sibling tenants excluded",
  );

  assert.equal(
    snapshot.records.some(
      (
        record:
          unknown,
      ) =>
        (
          record as {
            id:
              string;
          }
        ).id ===
          "CUSTOMER-DEMO",
    ),
    false,
  );

  console.log(
    "PASS: DEMO records excluded from Full Branch Backup",
  );

  const customerSnapshot =
    snapshot.records[0] as {
      data: {
        businessId:
          string;

        branchId:
          string;
      };
  };

  assert.equal(
    customerSnapshot.data.businessId,
    "HISTORICAL-BUSINESS",
  );

  assert.equal(
    customerSnapshot.data.branchId,
    "HISTORICAL-BRANCH",
  );

  console.log(
    "PASS: historical inner payload provenance preserved",
  );

  (
    activeCustomer.data as {
      businessId:
        string;
    }
  ).businessId =
    "MUTATED-AFTER-CAPTURE";

  assert.equal(
    customerSnapshot.data.businessId,
    "HISTORICAL-BUSINESS",
  );

  console.log(
    "PASS: snapshot is detached from mutable source records",
  );

  expectFailure(
    () =>
      captureFinoraFullBranchRealStorageSnapshot({
        exportedAt:
          "2026-09-23T12:00:00.000Z",

        branchScope:
          scope,

        records: [
          {
            id:
              "LEGACY-1",

            entity:
              "CUSTOMER",

            data:
              {},

            createdAt:
              "2026-09-23T10:00:00.000Z",

            updatedAt:
              "2026-09-23T11:00:00.000Z",

            ownerId:
              scope.ownerId,

            /*
             * Missing businessId + branchId is ambiguous legacy
             * outer scope and must never be silently omitted.
             */
          },
        ],
      }),
  );

  console.log(
    "PASS: partial / ambiguous outer tenant scope fails closed",
  );

  expectFailure(
    () =>
      captureFinoraFullBranchRealStorageSnapshot({
        exportedAt:
          "2026-09-23T12:00:00.000Z",

        branchScope:
          scope,

        records: [
          {
            ownerId:
              scope.ownerId,

            businessId:
              scope.businessId,

            branchId:
              scope.branchId,
          },
        ],
      }),
  );

  console.log(
    "PASS: structurally invalid persisted record fails closed",
  );

  const emptyExactTenant =
    captureFinoraFullBranchRealStorageSnapshot({
      exportedAt:
        "2026-09-23T12:00:00.000Z",

      branchScope:
        scope,

      records: [
        siblingOwner,
        activeDemo,
      ],
    });

  assert.equal(
    emptyExactTenant.recordCount,
    0,
  );

  console.log(
    "PASS: valid empty REAL branch snapshot is representable",
  );

  console.log(
    "PASS: Full Branch Backup storage snapshot self-test complete",
  );
}

if (
  require.main ===
    module
) {
  try {
    runFinoraFullBranchBackupStorageSnapshotSelfTest();
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