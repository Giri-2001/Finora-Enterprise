"use strict";

// PAISARULE_C137_R48_PRECLOSE_GATE_REGRESSION
// Run the actual TypeScript implementation, not a duplicated formula.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.resolve(
  __dirname,
  "../app/renderer/v2/storage/precloseFinancialGate.ts"
);

const source = fs.readFileSync(sourcePath, "utf8");

assert.match(
  source,
  /PAISARULE_C137_R47_PRECLOSE_FINANCIAL_GATE/
);

const compiled = ts.transpileModule(source, {
  fileName: sourcePath,
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true
  },
  reportDiagnostics: true
});

const errors = (compiled.diagnostics || []).filter(
  (diagnostic) =>
    diagnostic.category === ts.DiagnosticCategory.Error
);

assert.equal(errors.length, 0, "TypeScript transpilation errors");

const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(compiled.outputText, sourcePath);

const { verifyPrecloseFinancialGate } = loaded.exports;

assert.equal(typeof verifyPrecloseFinancialGate, "function");

function input(overrides = {}) {
  return {
    confirmed: true,
    outstanding: 56000,
    cashReceived: 52100,
    penaltyReceived: 100,
    futureInterestWaiver: 4000,
    manualPrincipal: 0,
    ...overrides
  };
}

test("R48-01: verified cash and 100 penalty reconcile", () => {
  const result = verifyPrecloseFinancialGate(input());

  assert.equal(result.cashReceivedCents, 5210000);
  assert.equal(result.penaltyReceivedCents, 10000);
  assert.equal(result.debtCashCents, 5200000);
  assert.equal(result.waiverCents, 400000);
  assert.equal(result.originalOutstandingCents, 5600000);
  assert.equal(result.remainingOutstandingCents, 0);
});

test("R48-02: 3900 waiver fails when penalty is 100", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({ futureInterestWaiver: 3900 })
    ),
    /PRECLOSE_CASH_WAIVER_RECONCILIATION_FAILED/
  );
});

test("R48-03: 3900 reconciles when verified penalty is zero", () => {
  const result = verifyPrecloseFinancialGate(
    input({
      penaltyReceived: 0,
      futureInterestWaiver: 3900
    })
  );

  assert.equal(result.waiverCents, 390000);
  assert.equal(result.remainingOutstandingCents, 0);
});

test("R48-04: confirmation required", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({ confirmed: false })
    ),
    /PRECLOSE_CONFIRMATION_REQUIRED/
  );
});

test("R48-05: manual principal must remain zero", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({ manualPrincipal: 1 })
    ),
    /PRECLOSE_MANUAL_PRINCIPAL_MUST_BE_ZERO/
  );
});

test("R48-06: penalty cannot exceed cash", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({ penaltyReceived: 52101 })
    ),
    /PRECLOSE_PENALTY_EXCEEDS_CASH/
  );
});

test("R48-07: negative discount is rejected", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({ futureInterestWaiver: -1 })
    ),
    /PRECLOSE_INVALID_WAIVER/
  );
});

test("R48-08: fractional paisa is rejected", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({ cashReceived: 52100.001 })
    ),
    /PRECLOSE_INVALID_PRECISION_CASH/
  );
});

test("R48-09: debt cash cannot exceed outstanding", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({
        cashReceived: 56001,
        penaltyReceived: 0,
        futureInterestWaiver: 0
      })
    ),
    /PRECLOSE_DEBT_CASH_EXCEEDS_OUTSTANDING/
  );
});

test("R48-10: zero outstanding is rejected", () => {
  assert.throws(
    () => verifyPrecloseFinancialGate(
      input({ outstanding: 0 })
    ),
    /PRECLOSE_POSITIVE_BALANCE_REQUIRED/
  );
});