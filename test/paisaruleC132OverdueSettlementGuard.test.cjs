const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/repositories/loan/overdueOnlySettlementGuard.ts"
);

const compiled = ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
);

const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(compiled.outputText, filename);

const verify = loaded.exports.verifyOverdueOnlySettlement;

function evidence(overrides = {}) {
  return {
    previousOutstanding: 10000,
    nextOutstanding: 7000,
    emiDue: 3000,
    overdueDue: 2000,
    cash: 3000,
    discount: 2000,
    overdueCollected: 0,
    emiCollected: 3000,
    principalCollected: 0,
    overdueWaived: 2000,
    emiWaived: 0,
    futureInterestSaving: 0,
    ...overrides,
  };
}

test("C132-G01: full overdue waiver is valid", () => {
  assert.deepEqual(verify(evidence()), {
    contractualReduction: 3000,
    remainingEmi: 0,
    remainingOverdue: 0,
    fullySettled: false,
  });
});

test("C132-G02: one paisa beyond overdue rejected", () => {
  assert.equal(verify(evidence({
    discount: 2000.01,
    overdueWaived: 2000.01,
  })), null);
});

test("C132-G03: EMI waiver is prohibited", () => {
  assert.equal(verify(evidence({ emiWaived: 1 })), null);
});

test("C132-G04: waived overdue cannot reduce loan balance", () => {
  assert.equal(verify(evidence({
    nextOutstanding: 5000,
  })), null);
});

test("C132-G05: cash must reconcile exactly", () => {
  assert.equal(verify(evidence({
    cash: 2999,
  })), null);
});

test("C132-G06: partial overdue discount tracks actual income", () => {
  const result = verify(evidence({
    cash: 4000,
    discount: 1000,
    overdueCollected: 1000,
    overdueWaived: 1000,
  }));

  assert.equal(result.remainingOverdue, 0);
  assert.equal(result.contractualReduction, 3000);
});

test("C132-G07: zero overdue prohibits discount", () => {
  assert.equal(verify(evidence({
    overdueDue: 0,
  })), null);
});

test("C132-G08: full loan closure with overdue waiver", () => {
  const result = verify(evidence({
    previousOutstanding: 10000,
    nextOutstanding: 0,
    emiDue: 10000,
    overdueDue: 500,
    cash: 10000,
    discount: 500,
    emiCollected: 10000,
    overdueWaived: 500,
  }));

  assert.equal(result.fullySettled, true);
  assert.equal(result.contractualReduction, 10000);
});

test("C132-G09: loan cannot close with unpaid EMI", () => {
  const result = verify(evidence({
    previousOutstanding: 10000,
    nextOutstanding: 0,
    emiDue: 10500,
    overdueDue: 500,
    cash: 10000,
    discount: 500,
    emiCollected: 10000,
    overdueWaived: 500,
  }));

  assert.equal(result, null);
});

test("C132-G10: invalid fractional money rejected", () => {
  assert.equal(verify(evidence({
    discount: 0.001,
  })), null);
});
test("C132-G11: closed balance with unpaid overdue is rejected", () => {
  const result = verify(evidence({
    previousOutstanding: 3000,
    nextOutstanding: 0,
    emiDue: 3000,
    overdueDue: 2000,
    cash: 3000,
    discount: 1000,
    overdueCollected: 0,
    emiCollected: 3000,
    overdueWaived: 1000,
  }));

  assert.equal(result, null);
});