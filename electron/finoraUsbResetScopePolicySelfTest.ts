// ============================================================
// FINORA ENTERPRISE OS
//
// USB RESET SCOPE POLICY SELF TEST
//
// RUNTIME SCOPE:
//
// - Exercises the exact pure production reset policy used by
//   Electron main.
// - Proves logical REAL / DEMO record isolation.
// - Does NOT claim physical USB filesystem / SAF E2E coverage.
//
// COVERAGE:
//
// - Missing scope rejection with zero logical mutation.
// - Invalid REAL + demoId rejection with zero logical mutation.
// - REAL OWNER-A reset isolation.
// - DEMO-A + OWNER-A reset isolation.
// - DEMO-A reset without owner narrowing.
// - Invalid DEMO owner rejection with zero logical mutation.
//
// ============================================================

import assert from "node:assert/strict";

import {
  recordMatchesFinoraUsbResetScope,
  validateFinoraUsbResetScope,
} from "./finoraUsbResetScopePolicy.js";

import type {
  FinoraUsbResetScope,
} from "./finoraUsbResetScopePolicy.js";

// ============================================================
// TEST MODEL
// ============================================================

interface SelfTestRecord {
  id: string;

  ownerId?: string;

  demoId?: string;
}

interface LogicalResetResult {
  error: string | null;

  records: SelfTestRecord[];
}

// ============================================================
// LOGICAL RESET HARNESS
//
// This intentionally delegates all scope validation and record
// matching decisions to the production policy module.
// ============================================================

function applyLogicalReset(
  records: readonly SelfTestRecord[],

  scope: unknown,
): LogicalResetResult {
  const error =
    validateFinoraUsbResetScope(
      scope,
    );

  if (error) {
    return {
      error,

      records:
        [...records],
    };
  }

  const validatedScope =
    scope as FinoraUsbResetScope;

  return {
    error:
      null,

    records:
      records.filter(
        (record) =>
          !recordMatchesFinoraUsbResetScope(
            record,
            validatedScope,
          ),
      ),
  };
}

function ids(
  records: readonly SelfTestRecord[],
): string[] {
  return records
    .map(
      (record) =>
        record.id,
    )
    .sort();
}

// ============================================================
// FIXTURE
// ============================================================

const fixture:
  readonly SelfTestRecord[] = [
    {
      id:
        "REAL-OWNER-A",

      ownerId:
        "OWNER-A",
    },
    {
      id:
        "REAL-OWNER-B",

      ownerId:
        "OWNER-B",
    },
    {
      id:
        "DEMO-A-OWNER-A",

      ownerId:
        "OWNER-A",

      demoId:
        "DEMO-A",
    },
    {
      id:
        "DEMO-B-OWNER-A",

      ownerId:
        "OWNER-A",

      demoId:
        "DEMO-B",
    },
    {
      id:
        "DEMO-A-OWNER-B",

      ownerId:
        "OWNER-B",

      demoId:
        "DEMO-A",
    },
    {
      id:
        "UNSCOPED-LEGACY",
    },
  ];

// ============================================================
// SELF TEST
// ============================================================

function runSelfTest(): void {
  // ----------------------------------------------------------
  // TEST 1 — MISSING SCOPE
  // ----------------------------------------------------------

  const missingScope =
    applyLogicalReset(
      fixture,
      undefined,
    );

  assert.equal(
    missingScope.error,
    "FINORA reset scope is required.",
  );

  assert.deepEqual(
    ids(missingScope.records),
    ids(fixture),
  );

  console.log(
    "PASS: missing reset scope rejected with zero logical mutation",
  );

  // ----------------------------------------------------------
  // TEST 2 — INVALID REAL SCOPE WITH DEMO ID
  // ----------------------------------------------------------

  const invalidRealScope = {
    dataContext:
      "REAL",

    ownerId:
      "OWNER-A",

    demoId:
      "DEMO-A",
  };

  const invalidReal =
    applyLogicalReset(
      fixture,
      invalidRealScope,
    );

  assert.equal(
    invalidReal.error,
    "REAL FINORA USB reset scope must not include a Demo ID.",
  );

  assert.deepEqual(
    ids(invalidReal.records),
    ids(fixture),
  );

  console.log(
    "PASS: invalid REAL + Demo ID scope rejected with zero logical mutation",
  );

  // ----------------------------------------------------------
  // TEST 3 — REAL OWNER-A RESET
  // ----------------------------------------------------------

  const realOwnerA =
    applyLogicalReset(
      fixture,
      {
        dataContext:
          "REAL",

        ownerId:
          "OWNER-A",
      },
    );

  assert.equal(
    realOwnerA.error,
    null,
  );

  assert.deepEqual(
    ids(realOwnerA.records),
    [
      "DEMO-A-OWNER-A",
      "DEMO-A-OWNER-B",
      "DEMO-B-OWNER-A",
      "REAL-OWNER-B",
      "UNSCOPED-LEGACY",
    ].sort(),
  );

  console.log(
    "PASS: REAL OWNER-A reset removes only OWNER-A REAL records",
  );

  console.log(
    "PASS: REAL OWNER-A reset preserves OWNER-B REAL and all Demo records",
  );

  // ----------------------------------------------------------
  // TEST 4 — DEMO-A + OWNER-A RESET
  // ----------------------------------------------------------

  const demoAOwnerA =
    applyLogicalReset(
      fixture,
      {
        dataContext:
          "DEMO",

        ownerId:
          "OWNER-A",

        demoId:
          "DEMO-A",
      },
    );

  assert.equal(
    demoAOwnerA.error,
    null,
  );

  assert.deepEqual(
    ids(demoAOwnerA.records),
    [
      "DEMO-A-OWNER-B",
      "DEMO-B-OWNER-A",
      "REAL-OWNER-A",
      "REAL-OWNER-B",
      "UNSCOPED-LEGACY",
    ].sort(),
  );

  console.log(
    "PASS: DEMO-A OWNER-A reset removes only the exact Demo/owner boundary",
  );

  console.log(
    "PASS: DEMO-A OWNER-A reset preserves DEMO-B, OWNER-B DEMO-A, and REAL records",
  );

  // ----------------------------------------------------------
  // TEST 5 — DEMO-A WITHOUT OWNER NARROWING
  // ----------------------------------------------------------

  const demoA =
    applyLogicalReset(
      fixture,
      {
        dataContext:
          "DEMO",

        demoId:
          "DEMO-A",
      },
    );

  assert.equal(
    demoA.error,
    null,
  );

  assert.deepEqual(
    ids(demoA.records),
    [
      "DEMO-B-OWNER-A",
      "REAL-OWNER-A",
      "REAL-OWNER-B",
      "UNSCOPED-LEGACY",
    ].sort(),
  );

  console.log(
    "PASS: DEMO-A reset without owner narrowing removes only matching Demo IDs",
  );

  console.log(
    "PASS: DEMO-A reset preserves REAL records and other Demo environments",
  );

  // ----------------------------------------------------------
  // TEST 6 — INVALID DEMO OWNER
  // ----------------------------------------------------------

  const invalidDemoOwner =
    applyLogicalReset(
      fixture,
      {
        dataContext:
          "DEMO",

        ownerId:
          "   ",

        demoId:
          "DEMO-A",
      },
    );

  assert.equal(
    invalidDemoOwner.error,
    "FINORA DEMO USB reset owner ID must be a non-empty string when supplied.",
  );

  assert.deepEqual(
    ids(invalidDemoOwner.records),
    ids(fixture),
  );

  console.log(
    "PASS: invalid DEMO owner scope rejected with zero logical mutation",
  );

  console.log(
    "PASS: FINORA USB RESET SCOPE LOGICAL ISOLATION SELFTEST",
  );
}

// ============================================================
// ENTRY
// ============================================================

try {
  runSelfTest();
} catch (error) {
  console.error(
    "FAIL: FINORA USB RESET SCOPE LOGICAL ISOLATION SELFTEST",
    error,
  );

  process.exitCode =
    1;
}

// ============================================================
// END
// ============================================================