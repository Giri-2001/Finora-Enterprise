"use strict";

// PAISARULE C126-R86
// Offline synthetic tests. No USB, wallet, DB or network.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const base = path.resolve(
  __dirname, "../app/renderer/v2/repositories/loan"
);

function load(filename, imports = {}) {
  const location = path.join(base, filename);
  const source = fs.readFileSync(location, "utf8");

  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    },
    reportDiagnostics: true
  });

  const errors = (result.diagnostics || []).filter(
    x => x.category === ts.DiagnosticCategory.Error
  );

  assert.equal(errors.length, 0);

  const moduleObject = { exports: {} };

  vm.runInNewContext(result.outputText, {
    module: moduleObject,
    exports: moduleObject.exports,
    require: name => {
      if (!Object.prototype.hasOwnProperty.call(imports, name)) {
        throw new Error("Unexpected dependency: " + name);
      }
      return imports[name];
    }
  }, {
    filename: location,
    timeout: 5000
  });

  return moduleObject.exports;
}

const allocation = load("manualPenaltyAllocation.ts");

const settlement = load(
  "manualPenaltyScheduleSettlement.ts",
  { "./manualPenaltyAllocation": allocation }
);

const project =
  settlement.projectManualPenaltyScheduleSettlement;

assert.equal(typeof project, "function");

function rows(penalty = 100) {
  return [
    {
      installmentNumber: 3,
      installmentAmount: 300,
      paidAmount: 0,
      waivedAmount: 0,
      penaltyAmount: penalty,
      ...(penalty > 0 ? {
        penaltyPaidAmount: 0,
        penaltyWaivedAmount: 0
      } : {}),
      status: "Overdue",
      dueDate: "2026-04-01"
    },
    {
      installmentNumber: 4,
      installmentAmount: 400,
      paidAmount: 0,
      waivedAmount: 0,
      penaltyAmount: 0,
      status: "Overdue",
      dueDate: "2026-05-01"
    }
  ];
}

function run(schedule, cash, principal = 0) {
  return project(
    schedule,
    cash,
    principal,
    "R86-SYNTHETIC-RECEIPT",
    "2026-05-02"
  );
}

test("R86-01: 500 with penalty settles EMI 3 then 100 into EMI 4", () => {
  const result = run(rows(100), 500);

  assert.equal(result.penaltyReceived, 100);
  assert.equal(result.emiReceived, 400);
  assert.equal(result.principalReceived, 0);
  assert.equal(result.unallocatedCash, 0);

  assert.equal(result.schedule[0].paidAmount, 300);
  assert.equal(result.schedule[0].penaltyPaidAmount, 100);
  assert.equal(result.schedule[1].paidAmount, 100);
});

test("R86-02: zero penalty sends 200 into EMI 4", () => {
  const result = run(rows(0), 500);

  assert.equal(result.penaltyReceived, 0);
  assert.equal(result.emiReceived, 500);
  assert.equal(result.schedule[0].paidAmount, 300);
  assert.equal(result.schedule[1].paidAmount, 200);
});

test("R86-03: 900 with principal 500 settles only EMI 3", () => {
  const result = run(rows(100), 900, 500);

  assert.equal(result.principalReceived, 500);
  assert.equal(result.penaltyReceived, 100);
  assert.equal(result.emiReceived, 300);
  assert.equal(result.schedule[0].paidAmount, 300);
  assert.equal(result.schedule[0].penaltyPaidAmount, 100);
  assert.equal(result.schedule[1].paidAmount, 0);
});

test("R86-04: insufficient payment cannot jump to next EMI", () => {
  const result = run(rows(100), 250);

  assert.equal(result.schedule[0].penaltyPaidAmount, 0);
  assert.equal(result.schedule[0].paidAmount, 250);
  assert.equal(result.schedule[1].paidAmount, 0);
});

test("R86-05: legacy missing evidence remains blocked", () => {
  const schedule = rows(100);
  delete schedule[0].penaltyPaidAmount;

  assert.throws(
    () => run(schedule, 500),
    /LEGACY_PENALTY_EVIDENCE_REQUIRED/
  );
});

test("R86-06: source schedule remains unchanged", () => {
  const schedule = rows(100);
  const original = JSON.stringify(schedule);

  run(schedule, 500);

  assert.equal(JSON.stringify(schedule), original);
});

// PAISARULE_C126_R87_STATUS_REGRESSION

test("R87-01: overdue penalty settled and next EMI partial", () => {
  const result = run(rows(100), 500);
  assert.equal(result.schedule[0].status, "Overdue Paid");
  assert.equal(result.schedule[1].status, "Partial");
  assert.equal(result.schedule[0].penaltyPaidAmount, 100);
  assert.equal(result.schedule[1].paidAmount, 100);
});

test("R87-02: zero-penalty overdue EMI is Overdue Paid", () => {
  const result = run(rows(0), 500);
  assert.equal(result.schedule[0].status, "Overdue Paid");
  assert.equal(result.schedule[1].status, "Partial");
  assert.equal(result.schedule[1].paidAmount, 200);
});

test("R87-03: full payment before due date is Paid", () => {
  const schedule = rows(0);
  schedule[0].dueDate = "2026-06-01";
  schedule[0].status = "Pending";
  const result = run(schedule, 300);
  assert.equal(result.schedule[0].status, "Paid");
  assert.equal(result.schedule[1].paidAmount, 0);
});