"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/storage/manualAtomicSettlementRequest.ts"
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

const errors = (compiled.diagnostics || []).filter(
  x => x.category === ts.DiagnosticCategory.Error
);

assert.equal(errors.length, 0);

const mod = { exports: {} };

vm.runInNewContext(
  compiled.outputText,
  {
    module: mod,
    exports: mod.exports,
    require: (specifier) => {
      assert.equal(
        specifier,
        "./manualInterestCurtailmentAudit"
      );

      const auditFile = path.resolve(
        __dirname,
        "../app/renderer/v2/storage/manualInterestCurtailmentAudit.ts"
      );

      const auditCompiled = ts.transpileModule(
        fs.readFileSync(auditFile, "utf8"),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020
          }
        }
      );

      const auditModule = { exports: {} };

      vm.runInNewContext(
        auditCompiled.outputText,
        {
          module: auditModule,
          exports: auditModule.exports,
          Date
        },
        { filename: auditFile, timeout: 5000 }
      );

      return auditModule.exports;
    }
  },
  { filename, timeout: 5000 }
);

const prepare =
  mod.exports.prepareManualAtomicSettlementRequest;

function sample() {
  const oldLoan = {
    id: "LOAN-R98",
    outstanding: 20000
  };

  const newLoan = {
    id: "LOAN-R98",
    outstanding: 19200
  };

  const collection = {
    id: "COL-R98",
    loanId: "LOAN-R98",
    collectionNumber: "COLLECTION-R98",
    receiptNumber: "RECEIPT-R98",
    paymentAmount: 900,
    penaltyAmount: 100,
    advanceAdjustment: 500,
    discountAmount: 0,
    outstandingBalance: 19200
  };

  return { oldLoan, newLoan, collection };
}

test("R98-01: valid 900 settlement envelope", () => {
  const s = sample();
  const result = prepare(
    s.oldLoan, s.newLoan, s.collection
  );

  assert.equal(result.loanInput.entity, "LOAN");
  assert.equal(result.collectionInput.entity, "COLLECTION");
  assert.equal(result.expectedLoanData.outstanding, 20000);
  assert.equal(result.collectionInput.data.penaltyAmount, 100);
  assert.equal(result.collectionInput.data.advanceAdjustment, 500);
});

test("R98-02: wrong loan ID rejected", () => {
  const s = sample();
  s.collection.loanId = "DIFFERENT";

  assert.throws(
    () => prepare(s.oldLoan, s.newLoan, s.collection),
    /ATOMIC_REQUEST_LOAN_SCOPE_MISMATCH/
  );
});

test("R98-03: over-allocated principal rejected", () => {
  const s = sample();
  s.collection.advanceAdjustment = 850;

  assert.throws(
    () => prepare(s.oldLoan, s.newLoan, s.collection),
    /ATOMIC_REQUEST_INVALID_ALLOCATION/
  );
});

test("R98-04: collection balance mismatch rejected", () => {
  const s = sample();
  s.collection.outstandingBalance = 19500;

  assert.throws(
    () => prepare(s.oldLoan, s.newLoan, s.collection),
    /ATOMIC_REQUEST_BALANCE_MISMATCH/
  );
});

test("R98-05: fractional cent rejected", () => {
  const s = sample();
  s.collection.penaltyAmount = 100.001;

  assert.throws(
    () => prepare(s.oldLoan, s.newLoan, s.collection),
    /ATOMIC_REQUEST_INVALID_PRECISION/
  );
});

test("R98-06: input objects remain unchanged", () => {
  const s = sample();
  const before = JSON.stringify(s);

  prepare(s.oldLoan, s.newLoan, s.collection);

  assert.equal(JSON.stringify(s), before);
});

// PAISARULE_C126_R99_REGRESSION

test("R99-01: valid 900 cash gives 800 debt reduction", () => {
  const s = sample();
  const result = prepare(s.oldLoan, s.newLoan, s.collection);

  assert.equal(
    result.expectedLoanData.outstanding -
      result.loanInput.data.outstanding,
    800
  );
});

test("R99-02: incorrect outstanding reduction rejected", () => {
  const s = sample();
  s.newLoan.outstanding = 19300;
  s.collection.outstandingBalance = 19300;

  assert.throws(
    () => prepare(s.oldLoan, s.newLoan, s.collection),
    /ATOMIC_REQUEST_SETTLEMENT_REDUCTION_MISMATCH/
  );
});

test("R99-03: unsupported discount rejected", () => {
  const s = sample();
  s.collection.discountAmount = 10;

  assert.throws(
    () => prepare(s.oldLoan, s.newLoan, s.collection),
    /ATOMIC_REQUEST_DISCOUNT_NOT_SUPPORTED/
  );
});

// PAISARULE_C126_R105_CURTAILMENT_PARITY_TESTS

function curtailmentSample() {
  const oldLoan = {
    id: "LOAN-R105",
    outstanding: 20000,
    interest: 2,
    repaymentType: "monthly"
  };

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

  oldLoan.schedule = before.map(row => ({ ...row }));

  const newLoan = {
    id: oldLoan.id,
    outstanding: 19180,
    schedule: after
  };

  const collection = {
    id: "COL-R105",
    loanId: oldLoan.id,
    collectionNumber: "COLLECTION-R105",
    receiptNumber: "RECEIPT-R105",
    receiptDate: "2026-11-08",
    paymentAmount: 900,
    penaltyAmount: 100,
    advanceAdjustment: 500,
    discountAmount: 0,
    outstandingBalance: 19180
  };

  return {
    oldLoan,
    newLoan,
    collection,
    evidence: { cashAllocatedSchedule: before }
  };
}

test("R105-01: verified interest saving permits 820 reduction", () => {
  const s = curtailmentSample();

  const result = prepare(
    s.oldLoan,
    s.newLoan,
    s.collection,
    s.evidence
  );

  assert.equal(
    result.expectedLoanData.outstanding -
      result.loanInput.data.outstanding,
    820
  );
});

test("R105-02: manipulated future interest rejected", () => {
  const s = curtailmentSample();
  s.newLoan.schedule[2].interestAmount = 340;

  assert.throws(
    () => prepare(
      s.oldLoan, s.newLoan, s.collection, s.evidence
    ),
    /CURTAILMENT_FUTURE_SCHEDULE_MISMATCH/
  );
});

test("R105-03: reduction without evidence rejected", () => {
  const s = curtailmentSample();

  assert.throws(
    () => prepare(
      s.oldLoan, s.newLoan, s.collection
    ),
    /ATOMIC_REQUEST_SETTLEMENT_REDUCTION_MISMATCH/
  );
});

// PAISARULE_C126_R106_EVIDENCE_TESTS

test("R106-01: original Loan schedule required", () => {
  const s = curtailmentSample();
  delete s.oldLoan.schedule;

  assert.throws(
    () => prepare(
      s.oldLoan, s.newLoan, s.collection, s.evidence
    ),
    /ATOMIC_REQUEST_BASELINE_SCHEDULE_REQUIRED/
  );
});

test("R106-02: settled historical EMI cannot be reversed", () => {
  const s = curtailmentSample();

  s.evidence.cashAllocatedSchedule[0].paidAmount = 0;
  s.newLoan.schedule[0].paidAmount = 0;

  assert.throws(
    () => prepare(
      s.oldLoan, s.newLoan, s.collection, s.evidence
    ),
    /ATOMIC_REQUEST_PAID_AMOUNT_REVERSED|ATOMIC_REQUEST_SETTLED_HISTORY_CHANGED/
  );
});

test("R106-03: original EMI amount cannot be rewritten", () => {
  const s = curtailmentSample();

  s.evidence.cashAllocatedSchedule[1].installmentAmount = 999;

  assert.throws(
    () => prepare(
      s.oldLoan, s.newLoan, s.collection, s.evidence
    ),
    /ATOMIC_REQUEST_BASELINE_ROW_CHANGED/
  );
});