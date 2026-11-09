const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/repositories/loan/selectedEmiWaiverAllocation.ts"
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

const allocate = loaded.exports.allocateSelectedEmiWaiver;

test("C132-01: 200 cash and 100 discount waives overdue only", () => {
  const result = allocate({
    emiRemaining: 200,
    overdueRemaining: 100,
    cash: 200,
    discount: 100,
  });

  assert.deepEqual(result, {
    overdueWaived: 100,
    emiWaived: 0,
    overdueCollected: 0,
    emiCollected: 200,
    overdueRemaining: 0,
    emiRemaining: 0,
    contractualReduction: 200,
    fullySettled: true,
  });
});

test("C132-02: no discount collects 100 overdue and 200 EMI", () => {
  const result = allocate({
    emiRemaining: 200,
    overdueRemaining: 100,
    cash: 300,
    discount: 0,
  });

  assert.equal(result.overdueCollected, 100);
  assert.equal(result.emiCollected, 200);
  assert.equal(result.contractualReduction, 200);
  assert.equal(result.fullySettled, true);
});

test("C132-03: discount beyond overdue cannot waive EMI", () => {
  assert.equal(allocate({
    emiRemaining: 200,
    overdueRemaining: 100,
    cash: 150,
    discount: 150,
  }), null);
});
test("C132-04: excess cash cannot leak into next EMI", () => {
  const result = allocate({
    emiRemaining: 200,
    overdueRemaining: 100,
    cash: 300,
    discount: 100,
  });

  assert.equal(result, null);
});

test("C132-05: invalid and overallocated discount rejected", () => {
  assert.equal(allocate({
    emiRemaining: 200,
    overdueRemaining: 100,
    cash: 0,
    discount: 301,
  }), null);

  assert.equal(allocate({
    emiRemaining: 200,
    overdueRemaining: 100,
    cash: 200,
    discount: -100,
  }), null);

  assert.equal(allocate({
    emiRemaining: 200,
    overdueRemaining: 100,
    cash: 200.001,
    discount: 100,
  }), null);
});
test("C132-06: maximum overdue discount is inclusive", () => {
  const result = allocate({
    emiRemaining: 3000,
    overdueRemaining: 2000,
    cash: 3000,
    discount: 2000,
  });

  assert.equal(result.overdueWaived, 2000);
  assert.equal(result.emiWaived, 0);
  assert.equal(result.overdueCollected, 0);
  assert.equal(result.emiCollected, 3000);
  assert.equal(result.contractualReduction, 3000);
  assert.equal(result.fullySettled, true);
});

test("C132-07: even one paisa above overdue is rejected", () => {
  assert.equal(allocate({
    emiRemaining: 3000,
    overdueRemaining: 2000,
    cash: 2999.99,
    discount: 2000.01,
  }), null);
});

test("C132-08: no overdue means no discount", () => {
  assert.equal(allocate({
    emiRemaining: 10500,
    overdueRemaining: 0,
    cash: 10000,
    discount: 500,
  }), null);
});

test("C132-09: partial overdue discount collects only cash overdue", () => {
  const result = allocate({
    emiRemaining: 3000,
    overdueRemaining: 2000,
    cash: 4000,
    discount: 1000,
  });

  assert.equal(result.overdueWaived, 1000);
  assert.equal(result.overdueCollected, 1000);
  assert.equal(result.emiCollected, 3000);
  assert.equal(result.emiWaived, 0);
  assert.equal(result.contractualReduction, 3000);
  assert.equal(result.fullySettled, true);
});

test("C132-10: closing with overdue waiver preserves principal", () => {
  const result = allocate({
    emiRemaining: 10000,
    overdueRemaining: 500,
    cash: 10000,
    discount: 500,
  });

  assert.equal(result.overdueWaived, 500);
  assert.equal(result.overdueCollected, 0);
  assert.equal(result.emiCollected, 10000);
  assert.equal(result.emiWaived, 0);
  assert.equal(result.contractualReduction, 10000);
  assert.equal(result.fullySettled, true);
});