"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/storage/manualInterestCurtailmentAudit.ts"
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
  compiled.diagnostics.filter(
    d => d.category === ts.DiagnosticCategory.Error
  ).length,
  0
);

const mod = { exports: {} };

vm.runInNewContext(
  compiled.outputText,
  { module: mod, exports: mod.exports, Date },
  { filename, timeout: 5000 }
);

const verify = mod.exports.verifyInterestOnlyCurtailment;

function sample() {
  const before = [
    {
      installmentNumber: 1,
      dueDate: "2026-01-01",
      installmentAmount: 360,
      principalAmount: 0,
      interestAmount: 360,
      paidAmount: 360,
      waivedAmount: 0,
      penaltyAmount: 0,
      status: "Overdue Paid"
    },
    {
      installmentNumber: 2,
      dueDate: "2026-10-01",
      installmentAmount: 360,
      principalAmount: 0,
      interestAmount: 360,
      paidAmount: 0,
      waivedAmount: 0,
      penaltyAmount: 0,
      status: "Pending"
    },
    {
      installmentNumber: 3,
      dueDate: "2026-12-01",
      installmentAmount: 360,
      principalAmount: 0,
      interestAmount: 360,
      paidAmount: 0,
      waivedAmount: 0,
      penaltyAmount: 0,
      status: "Pending"
    },
    {
      installmentNumber: 4,
      dueDate: "2027-01-01",
      installmentAmount: 18360,
      principalAmount: 18000,
      interestAmount: 360,
      paidAmount: 0,
      waivedAmount: 0,
      penaltyAmount: 0,
      status: "Pending"
    }
  ];

  const after = before.map(row => ({ ...row }));

  for (const index of [2, 3]) {
    after[index] = {
      ...after[index],
      installmentAmount: index === 3 ? 17850 : 350,
      principalAmount: index === 3 ? 17500 : 0,
      interestAmount: 350,
      outstandingBalance: index === 3 ? 0 : 17500,
      paidAmount: 0,
      penaltyAmount: 0,
      receiptNumber: "",
      paidDate: "",
      status: "Pending"
    };
  }

  return { before, after };
}

test("R104-01: verified 500 principal and 20 interest saving", () => {
  const s = sample();
  const result = verify(
    s.before, s.after, 500, 2, "monthly", "2026-11-08"
  );

  assert.equal(result.principalReductionCents, 50000);
  assert.equal(result.futureInterestSavingCents, 2000);
});

test("R104-02: edited past EMI rejected", () => {
  const s = sample();
  s.after[0].paidAmount = 0;

  assert.throws(
    () => verify(
      s.before, s.after, 500, 2, "monthly", "2026-11-08"
    ),
    /CURTAILMENT_FUTURE_SCHEDULE_MISMATCH/
  );
});

test("R104-03: manipulated future interest rejected", () => {
  const s = sample();
  s.after[2].interestAmount = 340;

  assert.throws(
    () => verify(
      s.before, s.after, 500, 2, "monthly", "2026-11-08"
    ),
    /CURTAILMENT_FUTURE_SCHEDULE_MISMATCH/
  );
});

test("R104-04: no eligible future EMI rejected", () => {
  const s = sample();

  assert.throws(
    () => verify(
      s.before, s.after, 500, 2, "monthly", "2027-12-01"
    ),
    /CURTAILMENT_NO_FUTURE_EMIS/
  );
});