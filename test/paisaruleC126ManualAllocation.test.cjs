"use strict";

// PAISARULE C126-R82
// Synthetic financial regression only.
// No storage, USB, network, or production transaction.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const sourcePath = path.resolve(
  __dirname,
  "../app/renderer/v2/repositories/loan/manualPenaltyAllocation.ts"
);

const source = fs.readFileSync(sourcePath, "utf8");

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  reportDiagnostics: true,
});

const errors = (compiled.diagnostics || []).filter(
  (d) => d.category === ts.DiagnosticCategory.Error
);

assert.equal(errors.length, 0);

const mod = { exports: {} };

vm.runInNewContext(
  compiled.outputText,
  {
    module: mod,
    exports: mod.exports,
  },
  { filename: sourcePath, timeout: 5000 }
);

const plan = mod.exports.planSequentialManualCollection;

assert.equal(typeof plan, "function");

function schedule() {
  return [
    {
      installmentNumber: 1,
      emiRemaining: 0,
      penaltyAssessed: 100,
      penaltyPaid: 100,
      penaltyWaived: 0,
    },
    {
      installmentNumber: 2,
      emiRemaining: 0,
      penaltyAssessed: 100,
      penaltyPaid: 100,
      penaltyWaived: 0,
    },
    {
      installmentNumber: 3,
      emiRemaining: 300,
      penaltyAssessed: 100,
      penaltyPaid: 0,
      penaltyWaived: 0,
    },
    {
      installmentNumber: 4,
      emiRemaining: 300,
      penaltyAssessed: 0,
    },
  ];
}

test("R82-01: exact 900 allocation", () => {
  const result = plan(schedule(), 900, 500);

  assert.equal(result.cashReceived, 900);
  assert.equal(result.principalReceived, 500);
  assert.equal(result.penaltyReceived, 100);
  assert.equal(result.emiReceived, 300);
  assert.equal(result.unallocatedCash, 0);
});

test("R82-02: EMI 3 fully allocated", () => {
  const result = plan(schedule(), 900, 500);
  const row = result.lines.find(
    (x) => x.installmentNumber === 3
  );

  assert.ok(row);
  assert.equal(row.penaltyReceived, 100);
  assert.equal(row.emiReceived, 300);
  assert.equal(row.penaltyRemaining, 0);
  assert.equal(row.emiRemaining, 0);
});

test("R82-03: EMI 4 allocation unchanged", () => {
  const result = plan(schedule(), 900, 500);
  const row = result.lines.find(
    (x) => x.installmentNumber === 4
  );

  assert.ok(row);
  assert.equal(row.emiReceived, 0);
  assert.equal(row.penaltyReceived, 0);
  assert.equal(row.emiRemaining, 300);
});

test("R82-04: historical penalty evidence required", () => {
  const rows = schedule();
  delete rows[0].penaltyPaid;

  assert.throws(
    () => plan(rows, 900, 500),
    /PENALTY_SETTLEMENT_EVIDENCE_REQUIRED/
  );
});

test("R82-05: partial cash pays EMI before remaining penalty", () => {
  const rows = [
    {
      installmentNumber: 1,
      emiRemaining: 300,
      penaltyAssessed: 100,
      penaltyPaid: 40,
      penaltyWaived: 0,
    },
  ];

  const result = plan(rows, 160, 0);

  assert.equal(result.penaltyReceived, 0);
  assert.equal(result.emiReceived, 160);
  assert.equal(result.lines[0].penaltyRemaining, 60);
  assert.equal(result.lines[0].emiRemaining, 140);
});

test("R82-06: excess principal rejected", () => {
  assert.throws(
    () => plan(schedule(), 900, 901),
    /PRINCIPAL_EXCEEDS_CASH/
  );
});

test("R82-07: duplicate EMI number rejected", () => {
  const rows = schedule();
  rows.push({ ...rows[0] });

  assert.throws(
    () => plan(rows, 900, 500),
    /INVALID_OR_DUPLICATE_EMI_NUMBER/
  );
});

test("R82-08: over-settled penalty rejected", () => {
  const rows = schedule();
  rows[2].penaltyPaid = 101;

  assert.throws(
    () => plan(rows, 900, 500),
    /PENALTY_OVER_SETTLED/
  );
});

test("R82-09: insufficient cash remains on first EMI", () => {
  const result = plan(schedule(), 50, 0);

  const row = result.lines.find(
    (x) => x.installmentNumber === 3
  );

  assert.ok(row);
  assert.equal(row.penaltyReceived, 0);
  assert.equal(row.emiReceived, 50);
  assert.equal(row.penaltyRemaining, 100);
  assert.equal(row.emiRemaining, 250);
});

test("R82-10: planner does not mutate inputs", () => {
  const rows = schedule();
  const original = JSON.stringify(rows);

  plan(rows, 900, 500);

  assert.equal(JSON.stringify(rows), original);
});

// PAISARULE_C126_R85_SEQUENTIAL_SPILLOVER

test("R85-01: penalty 100 then EMI 300 then next EMI 100", () => {
  const rows = [
    {
      installmentNumber: 3,
      emiRemaining: 300,
      penaltyAssessed: 100,
      penaltyPaid: 0,
      penaltyWaived: 0,
    },
    {
      installmentNumber: 4,
      emiRemaining: 400,
      penaltyAssessed: 0,
    },
  ];

  const result = plan(rows, 500, 0);

  assert.equal(result.penaltyReceived, 100);
  assert.equal(result.emiReceived, 400);
  assert.equal(result.unallocatedCash, 0);

  assert.equal(result.lines[0].penaltyRemaining, 0);
  assert.equal(result.lines[0].emiRemaining, 0);
  assert.equal(result.lines[1].emiReceived, 100);
  assert.equal(result.lines[1].emiRemaining, 300);
});

test("R85-02: zero penalty then EMI 300 then next EMI 200", () => {
  const rows = [
    {
      installmentNumber: 3,
      emiRemaining: 300,
      penaltyAssessed: 0,
    },
    {
      installmentNumber: 4,
      emiRemaining: 400,
      penaltyAssessed: 0,
    },
  ];

  const result = plan(rows, 500, 0);

  assert.equal(result.penaltyReceived, 0);
  assert.equal(result.emiReceived, 500);
  assert.equal(result.unallocatedCash, 0);

  assert.equal(result.lines[0].emiReceived, 300);
  assert.equal(result.lines[0].emiRemaining, 0);
  assert.equal(result.lines[1].emiReceived, 200);
  assert.equal(result.lines[1].emiRemaining, 200);
});

test("R85-03: earlier incomplete EMI blocks later EMI", () => {
  const rows = [
    {
      installmentNumber: 3,
      emiRemaining: 300,
      penaltyAssessed: 100,
      penaltyPaid: 0,
      penaltyWaived: 0,
    },
    {
      installmentNumber: 4,
      emiRemaining: 400,
      penaltyAssessed: 0,
    },
  ];

  const result = plan(rows, 250, 0);

  assert.equal(result.lines[0].penaltyReceived, 0);
  assert.equal(result.lines[0].emiReceived, 250);
  assert.equal(result.lines[0].penaltyRemaining, 100);
  assert.equal(result.lines[0].emiRemaining, 50);
  assert.equal(result.lines[1].emiReceived, 0);
});

test("R85-04: manual principal excluded before EMI spillover", () => {
  const rows = [
    {
      installmentNumber: 3,
      emiRemaining: 300,
      penaltyAssessed: 100,
      penaltyPaid: 0,
      penaltyWaived: 0,
    },
    {
      installmentNumber: 4,
      emiRemaining: 400,
      penaltyAssessed: 0,
    },
  ];

  const result = plan(rows, 900, 500);

  assert.equal(result.principalReceived, 500);
  assert.equal(result.penaltyReceived, 100);
  assert.equal(result.emiReceived, 300);
  assert.equal(result.unallocatedCash, 0);
  assert.equal(result.lines[0].emiRemaining, 0);
  assert.equal(result.lines[1].emiReceived, 0);
});