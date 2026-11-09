const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/components/collections/collectionStudio/CollectionSystemGenerated.tsx"
);

const source = fs.readFileSync(filename, "utf8");
const ast = ts.createSourceFile(
  filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX
);

const functions = ast.statements.filter(
  node => ts.isFunctionDeclaration(node) &&
    node.name?.text === "calculateCycleCloseAmount"
);

assert.equal(functions.length, 1);

const extracted = functions[0].getText(ast);

assert.match(extracted, /recordedUnpaidPenalty/);
assert.match(extracted, /invalidPenaltyEvidence/);

const compiled = ts.transpileModule(
  extracted + "\nmodule.exports = calculateCycleCloseAmount;\n",
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS
    }
  }
).outputText;

function parseCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
      ? date : null;
}

function buildPremiumCycleDate(year, month, day) {
  const last = new Date(Date.UTC(year, month + 1, 0))
    .getUTCDate();
  return new Date(
    Date.UTC(year, month, Math.min(day, last))
  );
}

const sandbox = {
  module: { exports: {} },
  parseCalendarDate,
  formatCalendarKey: date => date.toISOString().slice(0, 10),
  buildPremiumCycleDate,
  roundFinancialValue: value => Math.round(value * 100) / 100
};

vm.runInNewContext(compiled, sandbox, {
  filename: "production-cycle-calculator.js",
  timeout: 1000
});

const calculate = sandbox.module.exports;

function meta(overrides = {}) {
  const dueDates = [
    "2026-02-01",
    "2026-03-01",
    "2026-04-01",
    "2026-05-01",
    "2026-06-01",
    "2026-07-01"
  ];

  return {
    finalDueDate: "2026-07-01",
    cycleDay: 1,
    lateFee: 100,
    rows: dueDates.map((dueDate, index) => ({
      dueDate,
      installmentAmount: 200,
      interestAmount: 200,
      paidAmount: index < 3 ? 200 : 0,
      waivedAmount: 0,
      penaltyAmount: 0,
      penaltyPaidAmount: 0,
      penaltyWaivedAmount: 0,
      status: index < 3 ? "paid" : "pending"
    })),
    ...overrides
  };
}

function close(date, data = meta()) {
  return calculate(data, date, 10000, 2);
}

test("R55-01: April 1 closes for 10000", () => {
  const result = close("2026-04-01");
  assert.equal(result.amount, 10000);
  assert.equal(result.penaltyIncluded, 0);
});

test("R55-02: April 2 begins next cycle", () => {
  const result = close("2026-04-02");
  assert.equal(result.amount, 10200);
  assert.equal(result.penaltyIncluded, 0);
});

test("R55-03: April 2 through May 1 fixed at 10200", () => {
  for (const date of [
    "2026-04-02",
    "2026-04-15",
    "2026-04-30",
    "2026-05-01"
  ]) {
    const result = close(date);
    assert.equal(result.amount, 10200, date);
    assert.equal(result.penaltyIncluded, 0, date);
  }
});

test("R55-04: May 2 includes 100 missed-EMI late fee", () => {
  const result = close("2026-05-02");
  assert.equal(result.amount, 10500);
  assert.equal(result.penaltyIncluded, 100);
});

test("R55-05: fully paid historical penalty not doubled", () => {
  const data = meta();
  data.rows[2].penaltyAmount = 500;
  data.rows[2].penaltyPaidAmount = 500;
  const result = close("2026-04-15", data);
  assert.equal(result.amount, 10200);
  assert.equal(result.penaltyIncluded, 0);
});

test("R55-06: only unpaid penalty is added", () => {
  const data = meta();
  data.rows[2].penaltyAmount = 500;
  data.rows[2].penaltyPaidAmount = 200;
  data.rows[2].penaltyWaivedAmount = 100;
  const result = close("2026-04-15", data);
  assert.equal(result.amount, 10400);
  assert.equal(result.penaltyIncluded, 200);
});

test("R55-07: unsettled EMI with missing penalty evidence rejects", () => {
  const data = meta();
  data.rows[2].penaltyAmount = 500;
  data.rows[2].penaltyPaidAmount = null;
  data.rows[2].status = "partial";
  data.rows[2].paidAmount = 100;
  assert.equal(close("2026-04-15", data), null);
});

test("R55-08: penalty over-allocation rejects", () => {
  const data = meta();
  data.rows[2].penaltyAmount = 500;
  data.rows[2].penaltyPaidAmount = 400;
  data.rows[2].penaltyWaivedAmount = 200;
  assert.equal(close("2026-04-15", data), null);
});

test("R55-09: May 2 without late fee closes for 10400", () => {
  const data = meta({ lateFee: 0 });
  const result = close("2026-05-02", data);
  assert.equal(result.amount, 10400);
  assert.equal(result.penaltyIncluded, 0);
});
test("R60-01: fully settled legacy EMI is not charged unproven penalty", () => {
  const data = meta();
  data.rows[2].status = "overdue paid";
  data.rows[2].penaltyAmount = 500;
  data.rows[2].penaltyPaidAmount = null;
  data.rows[2].penaltyWaivedAmount = null;

  const result = close("2026-04-15", data);
  assert.equal(result.amount, 10200);
  assert.equal(result.penaltyIncluded, 0);
});
