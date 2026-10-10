
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createFinoraServerWalletCoordinator: createCoordinator } =
  require("../../dist-electron/control/finoraServerWalletCoordinator.js");
const { createFinoraServerWalletRechargeClient: createClient } =
  require("../../dist-electron/control/finoraServerWalletRechargeClient.js");

const scope = {
  userId: "1000000001", ownerId: "1000000002",
  businessId: "1000000003", branchId: "fixture-branch",
  credentialId: "fixture-credential", authGeneration: 1,
};
const material = { keyId: "11111111-1111-4111-8111-111111111111" };
const input = () => ({
  amountInr: 100, paymentMethod: "PHONEPE",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
});
const receipt = (replayed = false, status = "PENDING") => ({
  ok: true, source: "POSTGRESQL_RECHARGE_REQUESTS",
  request: {
    requestId: "33333333-3333-4333-8333-333333333333",
    walletId: "1234567890", amountInr: "100.00",
    paymentMethod: "PHONEPE", status,
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  replayed,
});
const response = (body = receipt(), status = 201) =>
  new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });
function fixture(transport) {
  let now = Date.parse("2026-10-10T09:00:00.000Z");
  let logins = 0;
  const coordinator = createCoordinator({
    clock: () => now,
    resolveScope: () => ({
      success: true,
      data: { scope: { ...scope }, canonicalUsername: "fixture.owner" },
    }),
    login: async () => ({
      success: true,
      data: {
        accessToken: (++logins === 1 ? "a" : "b").repeat(64),
        expiresAt: new Date(now + 600000).toISOString(),
        scope: { ...scope }, keyId: material.keyId,
      },
    }),
    submitRecharge: createClient(transport),
    readBalance: async () => { throw new Error("Unexpected balance read"); },
    revoke: async () => ({ success: true, data: { revoked: true } }),
  });
  return {
    coordinator,
    advance: ms => { now += ms; },
    login: () => coordinator.signIn({}, {
      username: "fixture.owner", password: "synthetic",
    }, material),
  };
}

test("missing or expired session never sends a recharge", async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; return response(); });
  assert.equal((await f.coordinator.recharge(input())).errorCode, "UNAUTHORIZED");
  assert.equal((await f.login()).success, true);
  f.advance(600001);
  assert.equal((await f.coordinator.recharge(input())).errorCode, "UNAUTHORIZED");
  assert.equal(calls, 0);
});

test("main-owned token submits exact payload and returns only a receipt", async () => {
  const f = fixture(async (_url, options) => {
    assert.equal(new Headers(options.headers).get("authorization"),
      "Bearer " + "a".repeat(64));
    assert.deepEqual(JSON.parse(options.body), input());
    const body = receipt();
    body.token = "secret";
    body.request.adminActor = "private";
    return response(body);
  });
  assert.equal((await f.login()).success, true);
  assert.deepEqual(await f.coordinator.recharge(input()), {
    success: true,
    data: {
      source: receipt().source,
      request: receipt().request, replayed: false,
    },
  });
});

test("client-selected scope and malformed amounts cannot reach transport", async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; return response(); });
  await f.login();
  for (const value of [
    { ...input(), walletId: "1234567890" },
    { ...input(), branchId: "another" },
    { ...input(), amountInr: 49 },
  ]) {
    assert.equal((await f.coordinator.recharge(value)).errorCode, "INVALID_REQUEST");
  }
  assert.equal(calls, 0);
});

test("logout suppresses an in-flight receipt and blocks further requests", async () => {
  let finish;
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    return new Promise(resolve => { finish = resolve; });
  });
  await f.login();
  const pending = f.coordinator.recharge(input());
  assert.equal((await f.coordinator.logout()).localCleared, true);
  finish(response());
  assert.equal((await pending).errorCode, "STALE_OPERATION");
  assert.equal((await f.coordinator.recharge(input())).errorCode, "UNAUTHORIZED");
  assert.equal(calls, 1);
});

test("late unauthorized response cannot invalidate a replacement session", async () => {
  let finish;
  let calls = 0;
  const f = fixture(async (_url, options) => {
    calls++;
    if (calls === 1) return new Promise(resolve => { finish = resolve; });
    assert.equal(new Headers(options.headers).get("authorization"),
      "Bearer " + "b".repeat(64));
    return response();
  });
  await f.login();
  const pending = f.coordinator.recharge(input());
  assert.equal((await f.login()).success, true);
  finish(new Response("", { status: 401 }));
  assert.equal((await pending).errorCode, "STALE_OPERATION");
  assert.equal((await f.coordinator.recharge(input())).success, true);
});

test("current unauthorized response invalidates local access", async () => {
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    return new Response("", { status: 401 });
  });
  await f.login();
  assert.equal((await f.coordinator.recharge(input())).errorCode, "UNAUTHORIZED");
  assert.equal((await f.coordinator.recharge(input())).errorCode, "UNAUTHORIZED");
  assert.equal(calls, 1);
});

test("outage and conflicts retain the session; replay preserves final status", async () => {
  let calls = 0;
  const sent = [];
  const f = fixture(async (_url, options) => {
    sent.push(JSON.parse(options.body));
    calls++;
    if (calls === 1) throw new Error("private transport details");
    if (calls === 2) return new Response("", { status: 409 });
    return response(receipt(true, "APPROVED"), 200);
  });
  await f.login();
  assert.equal((await f.coordinator.recharge(input())).errorCode, "SERVER_UNAVAILABLE");
  assert.equal((await f.coordinator.recharge(input())).errorCode, "IDEMPOTENCY_CONFLICT");
  const result = await f.coordinator.recharge(input());
  assert.equal(result.success, true);
  assert.equal(result.data.replayed, true);
  assert.equal(result.data.request.status, "APPROVED");
  assert.equal("balanceInr" in result.data, false);
  assert.deepEqual(sent, [input(), input(), input()]);
});

test("local clear and expiry suppress late receipts without claiming rollback", async () => {
  for (const action of ["clear", "expire"]) {
    let finish;
    const f = fixture(async () =>
      new Promise(resolve => { finish = resolve; }));
    await f.login();
    const pending = f.coordinator.recharge(input());
    if (action === "clear") f.coordinator.clearLocal();
    else f.advance(600001);
    finish(response());
    assert.deepEqual(await pending, { success: false, errorCode: "STALE_OPERATION" });
  }
});
