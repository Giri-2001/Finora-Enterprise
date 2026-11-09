const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/services/numbering/loanSequenceService.ts"
);

const source = fs.readFileSync(filename, "utf8");

const ast = ts.createSourceFile(
  filename,
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS
);

const matches = ast.statements.filter(
  node =>
    ts.isFunctionDeclaration(node) &&
    node.name?.text ===
      "resolveNextLoanSequenceWithLoanBootstrap"
);

assert.equal(matches.length, 1);

const extracted = matches[0].getText(ast);

assert.match(
  extracted,
  /PAISARULE_C133_R4_SEQUENCE_CONTINUITY/
);

assert.match(extracted, /paisaruleShape/);

const compiled = ts.transpileModule(
  extracted +
    "\nmodule.exports = resolveNextLoanSequenceWithLoanBootstrap;\n",
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS
    }
  }
).outputText;

const scope = {
  customerNumber: 100004,
  businessCode: "B001",
  branchCode: "BR001"
};

async function nextNumber(loans, lastIssued) {
  const sandbox = {
    module: { exports: {} },
    LOAN_SEQUENCE_MIN: 1,
    LOAN_SEQUENCE_MAX: 999,

    resolveNextLoanSequence: state => {
      const next = state?.lastIssuedLoanSequence == null
        ? 1
        : state.lastIssuedLoanSequence + 1;

      return next > 999
        ? { success: false, error: "MAX_SEQUENCE" }
        : { success: true, data: next };
    },

    getLoansResult: async () => ({
      success: true,
      data: loans
    })
  };

  vm.runInNewContext(compiled, sandbox, {
    filename: "production-loan-sequence.js",
    timeout: 1000
  });

  const fn = sandbox.module.exports;

  return fn(
    scope,
    lastIssued === null
      ? undefined
      : { lastIssuedLoanSequence: lastIssued }
  );
}

function loan(sequence, customer = "100004", prefix = "PAISA") {
  return {
    loanNumber:
      `${prefix}-LOAN-${customer}-${String(sequence).padStart(3, "0")}`,
    status: "Closed"
  };
}

test("C133-01: two Closed Loans produce sequence 003", async () => {
  const result = await nextNumber(
    [loan(1), loan(2)],
    null
  );

  assert.equal(result.success, true);
  assert.equal(result.data, 3);
});

test("C133-02: Preclosed Loan number is never recycled", async () => {
  const record = loan(1);
  record.status = "Preclosed";

  const result = await nextNumber([record], null);

  assert.equal(result.success, true);
  assert.equal(result.data, 2);
});

test("C133-03: existing reserved maximum remains authoritative", async () => {
  const result = await nextNumber(
    [loan(1), loan(2)],
    5
  );

  assert.equal(result.success, true);
  assert.equal(result.data, 6);
});

test("C133-04: historical maximum beats stale reservation", async () => {
  const result = await nextNumber(
    [loan(1), loan(3)],
    1
  );

  assert.equal(result.success, true);
  assert.equal(result.data, 4);
});

test("C133-05: historical sequence gaps are never filled", async () => {
  const result = await nextNumber(
    [loan(1), loan(4)],
    null
  );

  assert.equal(result.success, true);
  assert.equal(result.data, 5);
});

test("C133-06: another Customer's Loan does not advance this sequence", async () => {
  const result = await nextNumber(
    [loan(1), loan(8, "100005")],
    null
  );

  assert.equal(result.success, true);
  assert.equal(result.data, 2);
});

test("C133-07: exhausted sequence must fail closed", async () => {
  const result = await nextNumber(
    [loan(999)],
    null
  );

  assert.equal(result.success, false);
});