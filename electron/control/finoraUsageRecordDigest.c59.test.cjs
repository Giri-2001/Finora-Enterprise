const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "finoraUsageRecordDigest.ts");
const js = ts.transpileModule(
  fs.readFileSync(sourcePath, "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = module.paths;
loaded._compile(js, sourcePath);

const { createFinoraUsageRecordDigest: digest } = loaded.exports;

function record(data) {
  return {
    id: "FIN-CUS-100003",
    entity: "CUSTOMER",
    ownerId: "OWNER001",
    businessId: "BUSINESS001",
    branchId: "BRANCH001",
    data,
  };
}

test("finite financial decimals and gold weights are accepted", () => {
  const result = digest(record({
    amount: 1250.75,
    goldWeight: 12.345,
    outstanding: 0,
    optional: null,
  }));
  assert.match(result, /^[a-f0-9]{64}$/);
});

test("object property order does not affect digest", () => {
  const a = digest(record({
    identity: { customerId: "FIN-CUS-100003", name: "Example" },
    amount: 30.5,
  }));
  const b = digest(record({
    amount: 30.5,
    identity: { name: "Example", customerId: "FIN-CUS-100003" },
  }));
  assert.equal(a, b);
});

test("different scope and different customer data change digest", () => {
  const original = record({ amount: 30 });
  const base = digest(original);
  assert.notEqual(base, digest({ ...original, branchId: "BRANCH002" }));
  assert.notEqual(base, digest(record({ amount: 31 })));
});

test("array order changes digest", () => {
  assert.notEqual(
    digest(record({ values: [1, 2] })),
    digest(record({ values: [2, 1] })),
  );
});

test("nonfinite numbers, unsafe integers, undefined reject", () => {
  for (const value of [NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, undefined]) {
    assert.throws(() => digest(record({ amount: value })));
  }
});

test("same record always produces same digest", () => {
  const value = record({ amount: 123.45, goldWeight: 7.625 });
  assert.equal(digest(value), digest(value));
});

test("missing business scope rejects", () => {
  assert.throws(() =>
    digest({ ...record({ amount: 30 }), businessId: "" })
  );
});

test("digests are hex SHA256 strings", () => {
  assert.match(
    digest(record({ amount: "30.00" })),
    /^[a-f0-9]{64}$/,
  );
});