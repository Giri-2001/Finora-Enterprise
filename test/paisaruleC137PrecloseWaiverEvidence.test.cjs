"use strict";

// PAISARULE_C137_R58_WAIVER_EVIDENCE_TESTS
// Execute actual TS module through TypeScript transpilation.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.resolve(
  __dirname,
  "../app/renderer/v2/storage/precloseWaiverEvidence.ts"
);

const sourceText = fs.readFileSync(sourcePath, "utf8");

assert.match(
  sourceText,
  /PAISARULE_C137_R57_PRECLOSE_WAIVER_EVIDENCE/
);

const compiled = ts.transpileModule(sourceText, {
  fileName: sourcePath,
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true
  },
  reportDiagnostics: true
});

assert.equal(
  (compiled.diagnostics || []).filter(
    d => d.category === ts.DiagnosticCategory.Error
  ).length,
  0
);

const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(compiled.outputText, sourcePath);

const verify = loaded.exports.verifyPrecloseWaiverEvidence;

assert.equal(typeof verify, "function");

function rows() {
  return [
    {
      installmentNumber: 1,
      dueDate: "2026-01-01",
      interestAmount: 1000,
      paidAmount: 1000,
      waivedAmount: 0,
      status: "Paid"
    },
    {
      installmentNumber: 2,
      dueDate: "2026-02-01",
      interestAmount: 1000,
      paidAmount: 0,
      waivedAmount: 0,
      status: "Overdue"
    },
    ...[3, 4, 5, 6].map((n) => ({
      installmentNumber: n,
      dueDate: `2026-${String(n).padStart(2, "0")}-01`,
      interestAmount: 1000,
      paidAmount: 0,
      waivedAmount: 0,
      status: "Pending"
    }))
  ];
}

function input(overrides = {}) {
  return {
    confirmed: true,
    precloseDate: "2026-02-02",
    paidThroughDate: "2026-02-02",
    expectedFutureInterestWaiver: 4000,
    originalRows: rows(),
    ...overrides
  };
}

test("R58-01 future four EMIs total 4000", () => {
  const result = verify(input());

  assert.equal(result.totalWaiverCents, 400000);
  assert.deepEqual(
    result.allocations.map(r => r.installmentNumber),
    [3, 4, 5, 6]
  );

  assert.ok(
    result.allocations.every(r => r.additionalWaiverCents === 100000)
  );
});

test("R58-02 reject 3900 without future cash evidence", () => {
  assert.throws(
    () => verify(input({ expectedFutureInterestWaiver: 3900 })),
    /PRECLOSE_WAIVER_SCHEDULE_TOTAL_MISMATCH/
  );
});

test("R58-03 future interest already paid reduces waiver", () => {
  const altered = rows();
  altered[2].paidAmount = 100;

  const result = verify(input({
    originalRows: altered,
    expectedFutureInterestWaiver: 3900
  }));

  assert.equal(result.totalWaiverCents, 390000);
  assert.equal(result.allocations[0].additionalWaiverCents, 90000);
});

test("R58-04 already settled future EMI is protected", () => {
  const altered = rows();
  altered[5].status = "Paid";
  altered[5].paidAmount = 1000;

  const result = verify(input({
    originalRows: altered,
    expectedFutureInterestWaiver: 3000
  }));

  assert.equal(result.totalWaiverCents, 300000);
  assert.deepEqual(
    result.allocations.map(r => r.installmentNumber),
    [3, 4, 5]
  );
});

test("R58-05 confirmation required", () => {
  assert.throws(
    () => verify(input({ confirmed: false })),
    /PRECLOSE_WAIVER_CONFIRMATION_REQUIRED/
  );
});

test("R58-06 paid-through date before preclose rejected", () => {
  assert.throws(
    () => verify(input({ paidThroughDate: "2026-02-01" })),
    /PRECLOSE_WAIVER_CYCLE_DATE_INVALID/
  );
});

test("R58-07 impossible calendar date rejected", () => {
  assert.throws(
    () => verify(input({ precloseDate: "2026-02-30" })),
    /PRECLOSE_WAIVER_CYCLE_DATE_INVALID/
  );
});

test("R58-08 duplicate EMI rejected", () => {
  const altered = rows();
  altered[5].installmentNumber = 5;

  assert.throws(
    () => verify(input({ originalRows: altered })),
    /PRECLOSE_WAIVER_EMI_IDENTITY_INVALID/
  );
});

test("R58-09 missing schedule rejected", () => {
  assert.throws(
    () => verify(input({ originalRows: [] })),
    /PRECLOSE_WAIVER_SCHEDULE_REQUIRED/
  );
});

test("R58-10 fractional paisa rejected", () => {
  assert.throws(
    () => verify(input({
      expectedFutureInterestWaiver: 4000.001
    })),
    /PRECLOSE_WAIVER_INVALID_PRECISION/
  );
});

test("R58-11 negative EMI interest rejected", () => {
  const altered = rows();
  altered[2].interestAmount = -1;

  assert.throws(
    () => verify(input({ originalRows: altered })),
    /PRECLOSE_WAIVER_INVALID_AMOUNT/
  );
});

test("R58-12 original rows are not mutated", () => {
  const original = rows();
  const before = JSON.stringify(original);

  verify(input({ originalRows: original }));

  assert.equal(JSON.stringify(original), before);
});