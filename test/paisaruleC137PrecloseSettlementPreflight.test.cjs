"use strict";

// PAISARULE_C137_R59_INTEGRATION_REGRESSION

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const originalLoader = Module._extensions[".ts"];

Module._extensions[".ts"] = function (mod, filename) {
  const source = fs.readFileSync(filename, "utf8");

  const compiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      strict: true
    },
    reportDiagnostics: true
  });

  const errors = (compiled.diagnostics || []).filter(
    diagnostic =>
      diagnostic.category === ts.DiagnosticCategory.Error
  );

  assert.equal(errors.length, 0);

  mod._compile(compiled.outputText, filename);
};

let prepare;

try {
  const target = path.resolve(
    __dirname,
    "../app/renderer/v2/storage/precloseSettlementPreflight.ts"
  );

  prepare = require(target).preparePrecloseSettlementPreflight;
} finally {
  if (originalLoader) {
    Module._extensions[".ts"] = originalLoader;
  } else {
    delete Module._extensions[".ts"];
  }
}

assert.equal(typeof prepare, "function");

function schedule() {
  return [1, 2, 3, 4, 5, 6].map(number => ({
    installmentNumber: number,
    dueDate: `2026-${String(number).padStart(2, "0")}-01`,
    interestAmount: 1000,
    paidAmount: number === 1 ? 1000 : 0,
    waivedAmount: 0,
    status:
      number === 1 ? "Paid" :
      number === 2 ? "Overdue" : "Pending"
  }));
}

function settlement(overrides = {}) {
  return {
    confirmed: true,
    outstanding: 56000,
    cashReceived: 52100,
    penaltyReceived: 100,
    futureInterestWaiver: 4000,
    manualPrincipal: 0,
    precloseDate: "2026-02-02",
    paidThroughDate: "2026-02-02",
    originalRows: schedule(),
    ...overrides
  };
}

test("R59-01: cash and four future EMIs reconcile", () => {
  const result = prepare(settlement());

  assert.equal(result.cashReceivedCents, 5210000);
  assert.equal(result.penaltyReceivedCents, 10000);
  assert.equal(result.debtCashCents, 5200000);
  assert.equal(result.futureInterestWaiverCents, 400000);
  assert.equal(result.remainingOutstandingCents, 0);

  assert.deepEqual(
    result.allocations.map(row => row.installmentNumber),
    [3, 4, 5, 6]
  );
});

test("R59-02: erroneous 3900 waiver is rejected", () => {
  assert.throws(
    () => prepare(settlement({
      futureInterestWaiver: 3900
    })),
    /PRECLOSE_CASH_WAIVER_RECONCILIATION_FAILED/
  );
});

test("R59-03: reconciled cash cannot bypass EMI evidence", () => {
  const rows = schedule();
  rows[5].paidAmount = 1000;
  rows[5].status = "Paid";

  assert.throws(
    () => prepare(settlement({ originalRows: rows })),
    /PRECLOSE_WAIVER_SCHEDULE_TOTAL_MISMATCH/
  );
});

test("R59-04: confirmation OFF is rejected", () => {
  assert.throws(
    () => prepare(settlement({ confirmed: false })),
    /PRECLOSE_CONFIRMATION_REQUIRED/
  );
});

test("R59-05: invalid cutoff is rejected", () => {
  assert.throws(
    () => prepare(settlement({
      paidThroughDate: "2026-02-01"
    })),
    /PRECLOSE_WAIVER_CYCLE_DATE_INVALID/
  );
});

test("R59-06: manual principal cannot bypass policy", () => {
  assert.throws(
    () => prepare(settlement({ manualPrincipal: 100 })),
    /PRECLOSE_MANUAL_PRINCIPAL_MUST_BE_ZERO/
  );
});

test("R59-07: no mutations to original EMI schedule", () => {
  const input = settlement();
  const original = JSON.stringify(input);

  prepare(input);

  assert.equal(JSON.stringify(input), original);
});