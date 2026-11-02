import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const source = new URL(
  "./finoraFourPlanPricingResponseContract.ts",
  import.meta.url,
);

const raw = await fs.readFile(source, "utf8");

const compiled = ts.transpileModule(raw, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
  reportDiagnostics: true,
});

assert.equal(
  compiled.diagnostics?.filter(
    d => d.category === ts.DiagnosticCategory.Error,
  ).length ?? 0,
  0,
);

const moduleUrl = `data:text/javascript;base64,${
  Buffer.from(compiled.outputText).toString("base64")
}`;

const { parseFinoraFourPlanPricingResponse: parse } =
  await import(moduleUrl);

const months = [1, 3, 6, 12];
const codes = [
  "CUSTOMER_CREATE",
  "LOAN_DISBURSEMENT",
  "COLLECTION",
];

function response(scope = "GLOBAL") {
  const makePrice = () => ({
    amountInr: "100.00",
    source: "GLOBAL",
    revisionId: "1234567890",
  });

  return {
    ok: true,
    scope,
    branchId: scope === "GLOBAL" ? null : "TEST-01",
    plans: months.map(m => ({
      months: m,
      subscription: makePrice(),
      fees: Object.fromEntries(
        codes.map(code => [code, makePrice()]),
      ),
    })),
  };
}

test("all four global plans and sixteen prices accepted", () => {
  const result = parse(response(), "GLOBAL", null);
  assert.equal(result.plans.length, 4);
  assert.equal(
    result.plans[0].fees.COLLECTION.amountInr,
    "100.00",
  );
});

test("explicit zero is preserved", () => {
  const body = response();
  body.plans[0].fees.COLLECTION.amountInr = "0.00";

  const result = parse(body, "GLOBAL", null);

  assert.equal(
    result.plans[0].fees.COLLECTION.amountInr,
    "0.00",
  );
});

test("branch override can coexist with global inheritance", () => {
  const body = response("BRANCH");

  body.plans[0].subscription = {
    amountInr: "0.00",
    source: "BRANCH",
    revisionId: "1234567891",
  };

  const result = parse(body, "BRANCH", "TEST-01");

  assert.equal(
    result.plans[0].subscription.source,
    "BRANCH",
  );

  assert.equal(
    result.plans[0].fees.COLLECTION.source,
    "GLOBAL",
  );
});

test("cross-branch response is rejected", () => {
  assert.throws(
    () => parse(
      response("BRANCH"),
      "BRANCH",
      "OTHER-01",
    ),
    /FINORA_PLAN_PRICING_SCOPE_INVALID/,
  );
});

test("missing fee cannot default to zero", () => {
  const body = response();
  delete body.plans[0].fees.COLLECTION;

  assert.throws(
    () => parse(body, "GLOBAL", null),
    /FINORA_PLAN_FEES_INCOMPLETE/,
  );
});

test("duplicate plan period is rejected", () => {
  const body = response();
  body.plans[1].months = 1;

  assert.throws(
    () => parse(body, "GLOBAL", null),
    /FINORA_PLAN_MONTHS_INVALID/,
  );
});

test("invalid and negative money rejected", () => {
  for (const invalid of [
    "-1.00",
    "",
    "1.999",
    "NaN",
    "1,000.00",
  ]) {
    const body = response();
    body.plans[0].subscription.amountInr = invalid;

    assert.throws(
      () => parse(body, "GLOBAL", null),
      /FINORA_PLAN_PRICE_AMOUNT_INVALID/,
    );
  }
});

test("unknown price source rejected", () => {
  const body = response();
  body.plans[0].subscription.source = "UNKNOWN";

  assert.throws(
    () => parse(body, "GLOBAL", null),
    /FINORA_PLAN_PRICE_SOURCE_INVALID/,
  );
});

test("extra response fields rejected", () => {
  const body = response();
  body.unexpected = true;

  assert.throws(
    () => parse(body, "GLOBAL", null),
    /FINORA_PLAN_PRICING_RESPONSE_FIELDS_INVALID/,
  );
});
