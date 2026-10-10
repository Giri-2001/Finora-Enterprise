
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createFinoraServerWalletIpcBoundary: createBoundary } =
  require("../../dist-electron/control/finoraServerWalletIpcBoundary.js");

const event = {};
const input = () => ({
  amountInr: 100, paymentMethod: "PHONEPE",
  idempotencyKey: "ABCDEF12-1111-4111-8111-111111111111",
});
const receipt = () => ({
  success: true,
  data: {
    source: "POSTGRESQL_RECHARGE_REQUESTS",
    request: {
      requestId: "22222222-2222-4222-8222-222222222222",
      walletId: "1234567890", amountInr: "100.00",
      paymentMethod: "PHONEPE", status: "PENDING",
      createdAt: "2026-10-10T09:00:00.000Z",
    },
    replayed: false,
  },
});
function fixture(recharge = async () => receipt()) {
  let trusted = true;
  const calls = { recharge: 0, clear: 0 };
  const boundary = createBoundary({
    authorize: supplied => trusted && supplied === event,
    service: {
      recharge: async value => { calls.recharge++; return recharge(value); },
      clearLocal: () => { calls.clear++; },
      enroll: async () => ({ success: false, errorCode: "SERVER_REJECTED" }),
      signIn: async () => ({ success: false, errorCode: "SERVER_REJECTED" }),
      balance: async () => ({ success: false, errorCode: "UNAUTHORIZED" }),
      logout: async () => ({ localCleared: true, serverStatus: "REVOKED" }),
    },
  });
  return { boundary, calls, untrust: () => { trusted = false; } };
}

test("unauthorized sender cannot submit or clear wallet access", async () => {
  const f = fixture();
  assert.equal((await f.boundary.recharge({}, input())).errorCode, "UNAUTHORIZED");
  assert.deepEqual(f.calls, { recharge: 0, clear: 0 });
});

test("scope selectors, tokens and invalid input stop before service", async () => {
  const f = fixture();
  for (const value of [
    null, [], {},
    { ...input(), ownerId: "another" },
    { ...input(), walletId: "1234567890" },
    { ...input(), accessToken: "secret" },
    { ...input(), amountInr: 49 },
    { ...input(), amountInr: 2001 },
    { ...input(), amountInr: 50.5 },
    { ...input(), amountInr: "100" },
    { ...input(), paymentMethod: "OTHER" },
    { ...input(), idempotencyKey: input().idempotencyKey + "\n" },
  ]) {
    assert.equal((await f.boundary.recharge(event, value)).errorCode, "INVALID_REQUEST");
  }
  assert.equal(f.calls.recharge, 0);
});

test("input is snapshotted and response exposes only receipt fields", async () => {
  let finish;
  let received;
  const f = fixture(value => {
    received = value;
    return new Promise(resolve => { finish = resolve; });
  });
  const supplied = input();
  const pending = f.boundary.recharge(event, supplied);
  supplied.amountInr = 999;
  assert.deepEqual(received, {
    ...input(), idempotencyKey: input().idempotencyKey.toLowerCase(),
  });
  const result = receipt();
  result.accessToken = "private";
  result.data.request.adminActor = "private";
  result.data.balanceInr = "999.00";
  finish(result);
  assert.deepEqual(await pending, receipt());
});

test("finalized retries remain receipts without a new-credit assertion", async () => {
  for (const status of ["PENDING", "APPROVED", "DECLINED"]) {
    const f = fixture(async () => {
      const result = receipt();
      result.data.replayed = true;
      result.data.request.status = status;
      return result;
    });
    const result = await f.boundary.recharge(event, input());
    assert.equal(result.success, true);
    assert.equal(result.data.request.status, status);
    assert.equal(result.data.replayed, true);
    assert.equal("credited" in result.data, false);
  }
});

test("malformed financial results cannot become IPC success", async () => {
  for (const mutate of [
    r => { r.data.request.amountInr = 100; },
    r => { r.data.request.amountInr = "101.00"; },
    r => { r.data.request.paymentMethod = "GOOGLE_PAY"; },
    r => { r.data.request.walletId += "\n"; },
    r => { r.data.request.requestId += "\n"; },
    r => { r.data.request.createdAt = "bad"; },
    r => { r.data.request.status = "APPROVED"; },
    r => { r.data.replayed = "true"; },
  ]) {
    const f = fixture(async () => {
      const result = receipt();
      mutate(result);
      return result;
    });
    assert.equal((await f.boundary.recharge(event, input())).errorCode,
      "INVALID_SERVER_RESPONSE");
  }
});

test("lifecycle invalidation and logout suppress pending receipts", async () => {
  for (const action of ["invalidate", "logout"]) {
    let finish;
    const f = fixture(() => new Promise(resolve => { finish = resolve; }));
    const pending = f.boundary.recharge(event, input());
    if (action === "invalidate") f.boundary.invalidate();
    else await f.boundary.logout(event);
    finish(receipt());
    assert.equal((await pending).errorCode, "STALE_OPERATION");
  }
});

test("sender trust is rechecked after awaiting service", async () => {
  let finish;
  const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  const pending = f.boundary.recharge(event, input());
  f.untrust();
  finish(receipt());
  assert.equal((await pending).errorCode, "UNAUTHORIZED");
  assert.equal(f.calls.clear, 1);
});

test("known errors survive and exceptions remain sanitized", async () => {
  for (const code of [
    "IDEMPOTENCY_CONFLICT", "WALLET_NOT_AVAILABLE",
    "UNAUTHORIZED", "RATE_LIMITED", "private-details",
  ]) {
    const f = fixture(async () => ({ success: false, errorCode: code }));
    assert.equal((await f.boundary.recharge(event, input())).errorCode,
      code === "private-details" ? "SERVER_UNAVAILABLE" : code);
  }
  const f = fixture(async () => { throw new Error("private-details"); });
  assert.deepEqual(await f.boundary.recharge(event, input()), {
    success: false, errorCode: "SERVER_UNAVAILABLE",
  });
});
