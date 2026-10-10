import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(
  new URL(
    "../../app/renderer/v2/services/wallet/finoraServerWalletBridge.ts",
    import.meta.url,
  ),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;

const { resolveFinoraServerWalletBridge: resolve, getFinoraServerWalletBridge } =
  await import("data:text/javascript;base64," +
    Buffer.from(compiled).toString("base64"));

function fixture() {
  const calls = [];
  const api = {
    enroll: async (...args) => {
      calls.push(["enroll", args]);
      return { success: true, data: { keyId: "synthetic", enrolledAt: "synthetic" } };
    },
    signIn: async (...args) => {
      calls.push(["signIn", args]);
      return { success: false, errorCode: "UNAUTHORIZED" };
    },
    balance: async (...args) => {
      calls.push(["balance", args]);
      return { success: false, errorCode: "SERVER_UNAVAILABLE" };
    },
    logout: async (...args) => {
      calls.push(["logout", args]);
      return { localCleared: true, serverStatus: "SERVER_UNAVAILABLE" };
    },
    recharge: async (...args) => {
      calls.push(["recharge", args]);
      return { success: false, errorCode: "IDEMPOTENCY_CONFLICT" };
    },
    extraInternalMethod: () => {},
  };
  return { calls, api, host: { finora: { serverWallet: api } } };
}

test("facade exposes only five frozen wallet methods", () => {
  const f = fixture();
  const bridge = resolve(f.host);
  assert.deepEqual(Object.keys(bridge).sort(),
    ["balance", "enroll", "logout", "recharge", "signIn"]);
  assert.equal(Object.isFrozen(bridge), true);
});

test("missing and incomplete bridges remain unavailable", () => {
  for (const host of [
    undefined, null, [], {}, { finora: {} },
    { finora: { serverWallet: { balance() {} } } },
  ]) assert.equal(resolve(host), null);
  assert.equal(getFinoraServerWalletBridge(), null);
});

test("credential operations reach the matching preload methods", async () => {
  const f = fixture();
  const bridge = resolve(f.host);
  const input = {
    username: "fixture.owner", password: "synthetic", securityCode: "synthetic",
  };
  await bridge.enroll(input);
  const result = await bridge.signIn(input);
  assert.deepEqual(f.calls, [
    ["enroll", [input]], ["signIn", [input]],
  ]);
  assert.equal(result.errorCode, "UNAUTHORIZED");
});

test("balance and logout use no scope arguments and retain failure outcomes", async () => {
  const f = fixture();
  const bridge = resolve(f.host);
  assert.deepEqual(await bridge.balance(),
    { success: false, errorCode: "SERVER_UNAVAILABLE" });
  assert.deepEqual(await bridge.logout(),
    { localCleared: true, serverStatus: "SERVER_UNAVAILABLE" });
  assert.deepEqual(f.calls, [["balance", []], ["logout", []]]);
});

test("method references are snapshotted and throwing bridge access fails closed", async () => {
  const f = fixture();
  const bridge = resolve(f.host);
  f.api.balance = () => { throw new Error("Replacement must not run"); };
  assert.equal((await bridge.balance()).errorCode, "SERVER_UNAVAILABLE");
  const hostile = {
    get finora() { throw new Error("Synthetic access failure"); },
  };
  assert.equal(resolve(hostile), null);
});

test("recharge forwards one payload and snapshots its preload method", async () => {
  const f = fixture();
  const bridge = resolve(f.host);
  f.api.recharge = () => { throw new Error("Replacement must not run"); };
  const input = {
    amountInr: 100, paymentMethod: "PHONEPE",
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
  };
  assert.deepEqual(await bridge.recharge(input), {
    success: false, errorCode: "IDEMPOTENCY_CONFLICT",
  });
  assert.deepEqual(f.calls, [["recharge", [input]]]);
});

test("bridge lacking recharge fails closed instead of exposing partial capability", () => {
  const f = fixture();
  delete f.api.recharge;
  assert.equal(resolve(f.host), null);
});
