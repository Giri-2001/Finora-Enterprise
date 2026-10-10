import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletIpcBoundary,
} from "../../dist-electron/control/finoraServerWalletIpcBoundary.js";

const event = {};
const input = { username: "fixture.owner", password: "synthetic", securityCode: "synthetic" };
const date = "2026-10-10T12:00:00.000Z";
const balance = {
  source: "POSTGRESQL_WALLETS", walletId: "9890000006",
  balanceInr: "50.00", currency: "INR", updatedAt: date,
};

function setup(overrides = {}) {
  let authorized = true;
  let clears = 0;
  const calls = [];
  const service = {
    async enroll(value) {
      calls.push(["enroll", value]);
      return { success: true, data: { keyId: "test-key", enrolledAt: date } };
    },
    async signIn(value) {
      calls.push(["login", value]);
      return { success: true, data: { expiresAt: date, accessToken: "exclude" } };
    },
    async balance() {
      calls.push(["balance"]);
      return { success: true, data: { ...balance, accessToken: "exclude" } };
    },
    async logout() {
      calls.push(["logout"]);
      return { localCleared: true, serverStatus: "REVOKED", accessToken: "exclude" };
    },
    clearLocal() { clears++; },
    ...overrides,
  };
  return {
    boundary: createFinoraServerWalletIpcBoundary({
      service, authorize: () => authorized,
    }),
    calls, clearCount: () => clears,
    deny: () => { authorized = false; },
  };
}

test("unauthorized senders cannot invoke or clear wallet service", async () => {
  const f = setup();
  f.deny();
  for (const method of ["enroll", "signIn", "balance", "logout"]) {
    assert.equal((await f.boundary[method](event, input)).errorCode, "UNAUTHORIZED");
  }
  assert.equal(f.calls.length, 0);
  assert.equal(f.clearCount(), 0);
});

test("scope, tokens and other extra fields are rejected", async () => {
  const f = setup();
  for (const field of ["branchId", "accessToken", "privateKey", "url", "walletOperationNonce"]) {
    assert.equal(
      (await f.boundary.signIn(event, { ...input, [field]: "selected" })).errorCode,
      "INVALID_REQUEST",
    );
  }
  assert.equal((await f.boundary.balance(event, {})).errorCode, "INVALID_REQUEST");
  assert.equal((await f.boundary.logout(event, {})).errorCode, "INVALID_REQUEST");
  assert.equal(f.calls.length, 0);
});

test("login and balance return only explicit safe fields", async () => {
  const f = setup();
  assert.deepEqual(await f.boundary.signIn(event, input), {
    success: true, data: { expiresAt: date },
  });
  assert.deepEqual(await f.boundary.balance(event), { success: true, data: balance });
  assert.deepEqual(f.calls[0][1], input);
});

test("enrollment and logout preserve their separate outcomes", async () => {
  const f = setup();
  assert.deepEqual(await f.boundary.enroll(event, input), {
    success: true, data: { keyId: "test-key", enrolledAt: date },
  });
  assert.deepEqual(await f.boundary.logout(event), {
    localCleared: true, serverStatus: "REVOKED",
  });
});

test("lifecycle invalidation suppresses an old balance response", async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  const f = setup({
    async balance() { await waiting; return { success: true, data: balance }; },
  });
  const pending = f.boundary.balance(event);
  f.boundary.invalidate();
  release();
  assert.equal((await pending).errorCode, "STALE_OPERATION");
  assert.equal(f.clearCount(), 1);
});

test("sender trust is checked again before returning an async result", async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  const f = setup({
    async balance() { await waiting; return { success: true, data: balance }; },
  });
  const pending = f.boundary.balance(event);
  f.deny();
  release();
  assert.equal((await pending).errorCode, "UNAUTHORIZED");
  assert.equal(f.clearCount(), 1);
});

test("replacement login suppresses the older response", async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const f = setup({
    async signIn() {
      if (++calls === 1) await waiting;
      return { success: true, data: { expiresAt: date } };
    },
  });
  const first = f.boundary.signIn(event, input);
  assert.equal((await f.boundary.signIn(event, input)).success, true);
  release();
  assert.equal((await first).errorCode, "STALE_OPERATION");
});

test("exceptions and malformed balances do not expose details or invent zero", async () => {
  for (const handler of [
    async () => { throw new Error("private detail"); },
    async () => ({ success: false, errorCode: "private detail" }),
    async () => ({ success: true, data: { ...balance, balanceInr: -1 } }),
  ]) {
    const f = setup({ balance: handler });
    const result = await f.boundary.balance(event);
    assert.equal(result.success, false);
    assert.equal(Object.hasOwn(result, "data"), false);
    assert.equal(JSON.stringify(result).includes("private detail"), false);
  }
});