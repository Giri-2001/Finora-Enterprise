const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");

const previousLoader = Module._extensions[".ts"];

Module._extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(result.outputText, filename);
};

let project;
try {
  ({ projectOverdueOnlyScheduleRow: project } = require(
    path.resolve(
      __dirname,
      "../app/renderer/v2/repositories/loan/overdueOnlyScheduleProjection.ts"
    )
  ));
} finally {
  if (previousLoader) {
    Module._extensions[".ts"] = previousLoader;
  } else {
    delete Module._extensions[".ts"];
  }
}

function row(overrides = {}) {
  return {
    installmentAmount: 3000,
    paidAmount: 0,
    waivedAmount: 0,
    penaltyAmount: 2000,
    penaltyPaidAmount: 0,
    penaltyWaivedAmount: 0,
    status: "Overdue",
    installmentNumber: 1,
    ...overrides,
  };
}

test("C132-S01: full overdue discount only", () => {
  const original = row();
  const result = project(original, 3000, 2000, true);

  assert.equal(result.installment.paidAmount, 3000);
  assert.equal(result.installment.penaltyPaidAmount, 0);
  assert.equal(result.installment.penaltyWaivedAmount, 2000);
  assert.equal(result.installment.waivedAmount, 0);
  assert.equal(result.installment.status, "Overdue Paid");
  assert.equal(result.contractualReduction, 3000);
  assert.equal(result.fullySettled, true);
  assert.equal(original.paidAmount, 0);
});

test("C132-S02: partial overdue discount", () => {
  const result = project(row(), 4000, 1000, true);
  assert.equal(result.overdueCollected, 1000);
  assert.equal(result.overdueWaived, 1000);
  assert.equal(result.emiCollected, 3000);
  assert.equal(result.contractualReduction, 3000);
});

test("C132-S03: one paisa above overdue fails", () => {
  assert.equal(project(row(), 2999.99, 2000.01, true), null);
});

test("C132-S04: no overdue prohibits discount", () => {
  assert.equal(project(row({ penaltyAmount: 0 }), 3000, 1, true), null);
});

test("C132-S05: existing penalty waiver respected", () => {
  const result = project(row({
    penaltyWaivedAmount: 500,
  }), 3000, 1500, true);
  assert.equal(result.installment.penaltyWaivedAmount, 2000);
  assert.equal(result.overdueWaived, 1500);
});

test("C132-S06: prior settled EMI remains immutable", () => {
  assert.equal(project(row({
    status: "Overdue Paid",
    paidAmount: 3000,
  }), 0, 100, true), null);
});

test("C132-S07: invalid historical accounting fails", () => {
  assert.equal(project(row({
    penaltyPaidAmount: 2500,
  }), 3000, 0, true), null);
});

test("C132-S08: discount needs overdue eligibility", () => {
  assert.equal(project(row(), 3000, 2000, false), null);
});