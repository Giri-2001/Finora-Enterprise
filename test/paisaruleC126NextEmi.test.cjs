"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/repositories/loan/manualCollectionNextEmi.ts"
);

const compiled = ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    },
    reportDiagnostics: true
  }
);

assert.equal(
  (compiled.diagnostics || []).filter(
    x => x.category === ts.DiagnosticCategory.Error
  ).length,
  0
);

const mod = { exports: {} };

vm.runInNewContext(
  compiled.outputText,
  { module: mod, exports: mod.exports },
  { filename, timeout: 5000 }
);

const nextEmi = mod.exports.getManualCollectionNextEmi;

function row(n, amount, paid, penalty = 0, penaltyPaid = 0) {
  return {
    installmentNumber: n,
    dueDate: n === 3 ? "2026-04-01" : "2026-05-01",
    installmentAmount: amount,
    paidAmount: paid,
    waivedAmount: 0,
    penaltyAmount: penalty,
    ...(penalty > 0 ? {
      penaltyPaidAmount: penaltyPaid,
      penaltyWaivedAmount: 0
    } : {})
  };
}

test("R88-01: EMI 4 partial 100 means next payable 300", () => {
  const result = nextEmi([
    row(3, 300, 300, 100, 100),
    row(4, 400, 100)
  ]);

  assert.equal(result.installmentNumber, 4);
  assert.equal(result.dueDate, "2026-05-01");
  assert.equal(result.emiRemaining, 300);
  assert.equal(result.totalPayable, 300);
});

test("R88-02: zero penalty, partial 200 means 200 payable", () => {
  const result = nextEmi([
    row(3, 300, 300),
    row(4, 400, 200)
  ]);

  assert.equal(result.installmentNumber, 4);
  assert.equal(result.totalPayable, 200);
});

test("R88-03: unpaid penalty included once", () => {
  const result = nextEmi([
    row(3, 300, 300, 100, 40),
    row(4, 400, 0)
  ]);

  assert.equal(result.installmentNumber, 3);
  assert.equal(result.emiRemaining, 0);
  assert.equal(result.penaltyRemaining, 60);
  assert.equal(result.totalPayable, 60);
});

test("R88-04: fully settled schedule has no next EMI", () => {
  assert.equal(
    nextEmi([row(3, 300, 300, 100, 100)]),
    null
  );
});

test("R88-05: missing penalty evidence fails closed", () => {
  const legacy = row(3, 300, 300, 100, 100);
  delete legacy.penaltyPaidAmount;

  assert.throws(
    () => nextEmi([legacy]),
    /NEXT_EMI_PENALTY_EVIDENCE_REQUIRED/
  );
});