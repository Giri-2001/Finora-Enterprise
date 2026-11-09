const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../app/renderer/v2/repositories/loan/preclosureCycle.ts"
);

const compiled = ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }
);

const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(compiled.outputText, filename);

const resolve = loaded.exports.resolvePreclosureCycle;

const schedule = [
  "2026-02-01",
  "2026-03-01",
  "2026-04-01",
  "2026-05-01",
  "2026-06-01",
  "2026-07-01"
];

function cycle(date) {
  return resolve("2026-01-01", schedule, date);
}

test("R44-01 April 2 begins May due cycle", () => {
  assert.deepEqual(cycle("2026-04-02"), {
    cycleStart: "2026-04-02",
    cycleEnd: "2026-05-01",
    cycleDueDate: "2026-05-01",
    cycleNumber: 4
  });
});

test("R44-02 all dates inside same cycle are identical", () => {
  const dates = [
    "2026-04-02",
    "2026-04-15",
    "2026-04-30",
    "2026-05-01"
  ];

  const results = dates.map(cycle);

  assert.ok(results.every(
    result => JSON.stringify(result) === JSON.stringify(results[0])
  ));
});

test("R44-03 April 1 belongs to previous cycle", () => {
  assert.equal(cycle("2026-04-01").cycleNumber, 3);
});

test("R44-04 May 2 begins next cycle", () => {
  assert.deepEqual(cycle("2026-05-02"), {
    cycleStart: "2026-05-02",
    cycleEnd: "2026-06-01",
    cycleDueDate: "2026-06-01",
    cycleNumber: 5
  });
});

test("R44-05 rejects date before loan", () => {
  assert.equal(cycle("2025-12-31"), null);
});

test("R44-06 rejects invalid date", () => {
  assert.equal(cycle("2026-04-31"), null);
});

test("R44-07 rejects duplicate due dates", () => {
  assert.equal(resolve(
    "2026-01-01",
    ["2026-02-01", "2026-02-01"],
    "2026-01-20"
  ), null);
});

test("R44-08 rejects dates after last EMI", () => {
  assert.equal(cycle("2026-07-02"), null);
});

test("R44-09 February 1 due is inclusive", () => {
  assert.equal(cycle("2026-02-01").cycleNumber, 1);
});

test("R44-10 first day after February due advances", () => {
  assert.equal(cycle("2026-02-02").cycleNumber, 2);
});