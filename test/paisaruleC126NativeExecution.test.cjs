const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const mainPath = path.resolve(__dirname, "../electron/main.ts");
const source = fs.readFileSync(mainPath, "utf8");

const start = source.indexOf(
  "async function handleUsbAtomicCollectionSettlementUnlocked("
);

const end = source.indexOf(
  "// Internal locked wrapper.",
  start
);

assert.ok(start >= 0, "Native function must exist");
assert.ok(end > start, "Native function boundary must exist");

const functionSource = source.slice(start, end);

assert.match(
  functionSource,
  /PAISARULE_C126_R121_NATIVE_STATUS_AUTHORITY/
);

assert.match(
  functionSource,
  /PAISARULE_C126_R122R1_NATIVE_INTEREST_AUTHORITY/
);

const compiled = ts.transpileModule(functionSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS
  }
});

let usbAccessAttempts = 0;

const native = vm.runInNewContext(
  compiled.outputText +
    "\nhandleUsbAtomicCollectionSettlementUnlocked;",
  {
    validateRecord: (record) =>
      !!record &&
      typeof record === "object" &&
      typeof record.entity === "string" &&
      typeof record.id === "string",
    failure: (error) => ({ success: false, error }),
    findFinoraUsbRoot: async () => {
      usbAccessAttempts++;
      return null;
    },
    Date,
    console
  },
  {
    filename: "isolated-native-financial-preflight.js",
    timeout: 5000
  }
);

function fixture() {
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
      penaltyPaidAmount: 0,
      penaltyWaivedAmount: 0,
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
      penaltyAmount: 100,
      penaltyPaidAmount: 0,
      penaltyWaivedAmount: 0,
      status: "Overdue"
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
      penaltyPaidAmount: 0,
      penaltyWaivedAmount: 0,
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
      penaltyPaidAmount: 0,
      penaltyWaivedAmount: 0,
      status: "Pending"
    }
  ];

  const after = before.map(row => ({ ...row }));

  after[1].paidAmount = 360;
  after[1].penaltyPaidAmount = 40;
  after[1].status = "Partial";

  after[2].installmentAmount = 350;
  after[2].interestAmount = 350;
  after[2].outstandingBalance = 17500;

  after[3].installmentAmount = 17850;
  after[3].principalAmount = 17500;
  after[3].interestAmount = 350;
  after[3].outstandingBalance = 0;

  const originalLoan = {
    id: "R124-LOAN",
    ownerId: "R124-OWNER",
    businessId: "R124-BUSINESS",
    branchId: "R124-BRANCH",
    outstanding: 20000,
    interestType: "interestOnly",
    interest: 2,
    repaymentType: "monthly",
    schedule: before
  };

  const updatedLoan = {
    ...originalLoan,
    outstanding: 19120,
    schedule: after
  };

  const snapshot = {
    version: 1,
    previousOutstanding: 20000,
    remainingOutstanding: 19120,
    amountReceived: 900,
    penaltyReceived: 40,
    discountAmount: 0,
    selectedEmiNumbers: [],
    scheduleAvailable: true,
    totalEmis: 4,
    remainingEmis: 3,
    installments: after.map(row => ({
      number: row.installmentNumber,
      dueDate: row.dueDate,
      amount: row.installmentAmount,
      paidAmount: row.paidAmount,
      waivedAmount: row.waivedAmount,
      penaltyAmount: row.penaltyAmount,
      penaltyPaidAmount: row.penaltyPaidAmount,
      penaltyWaivedAmount: row.penaltyWaivedAmount,
      status: row.status
    }))
  };

  const collection = {
    id: "R124-COLLECTION",
    loanId: originalLoan.id,
    ownerId: originalLoan.ownerId,
    businessId: originalLoan.businessId,
    branchId: originalLoan.branchId,
    collectionNumber: "R124-COLLECTION-NUMBER",
    receiptNumber: "R124-RECEIPT-NUMBER",
    receiptDate: "2026-11-08",
    paymentAmount: 900,
    penaltyAmount: 40,
    discountAmount: 0,
    advanceAdjustment: 500,
    outstandingBalance: 19120,
    selectedEmiNumbers: [],
    status: "Approved",
    receiptSnapshot: snapshot
  };

  const options = {
    ownerId: originalLoan.ownerId,
    businessId: originalLoan.businessId,
    branchId: originalLoan.branchId
  };

  return {
    originalLoan,
    loanRecord: {
      entity: "LOAN",
      id: originalLoan.id,
      data: updatedLoan
    },
    collectionRecord: {
      entity: "COLLECTION",
      id: collection.id,
      data: collection
    },
    options
  };
}

async function execute(s) {
  usbAccessAttempts = 0;

  return native(
    s.originalLoan,
    s.loanRecord,
    s.collectionRecord,
    s.options
  );
}

test("R124-01: valid principal curtailment reaches USB boundary", async () => {
  const s = fixture();
  const result = await execute(s);

  assert.equal(
    result.error,
    "PAISARULE USB is disconnected.",
    `Unexpected financial rejection: ${result.error}`
  );

  assert.equal(usbAccessAttempts, 1);
});

test("R124-02: invalid overdue EMI status rejected before USB", async () => {
  const s = fixture();

  s.loanRecord.data.schedule[1].status = "Paid";
  s.collectionRecord.data.receiptSnapshot.installments[1].status =
    "Paid";

  const result = await execute(s);

  assert.match(
    result.error,
    /SETTLEMENT_EMI_STATUS_MISMATCH/
  );

  assert.equal(usbAccessAttempts, 0);
});

test("R124-03: manipulated future interest rejected before USB", async () => {
  const s = fixture();

  s.loanRecord.data.schedule[2].interestAmount = 345;

  const result = await execute(s);

  assert.match(
    result.error,
    /SETTLEMENT_FUTURE_EMI_RECALC_MISMATCH/
  );

  assert.equal(usbAccessAttempts, 0);
});