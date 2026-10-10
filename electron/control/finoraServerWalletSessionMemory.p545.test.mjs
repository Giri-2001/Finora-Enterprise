import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletSessionMemory,
} from "../../dist-electron/control/finoraServerWalletSessionMemory.js";

const baseTime = Date.parse("2026-10-10T06:00:00.000Z");
const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};
const key = "11111111-1111-4111-8111-111111111111";
const other = { ...scope, branchId: "9890000099" };
function result(s = scope, token = "a".repeat(64)) {
  return {
    success: true,
    data: {
      accessToken: token, scope: { ...s }, keyId: key,
      expiresAt: new Date(baseTime + 1_800_000).toISOString(),
    },
  };
}
function setup() {
  let now = baseTime;
  const store = createFinoraServerWalletSessionMemory(() => now);
  return { store, setTime: value => { now = value; } };
}
function login(store, s = scope, token = "a".repeat(64)) {
  const ticket = store.beginLogin(s, key);
  assert.equal(typeof ticket, "symbol");
  assert.equal(store.completeLogin(ticket, result(s, token)), true);
  return store.acquire(s);
}

test("stores a scoped session only after successful completion", () => {
  const { store } = setup();
  assert.equal(store.acquire(scope), null);
  const ticket = store.beginLogin(scope, key);
  assert.equal(store.acquire(scope), null);
  assert.equal(store.completeLogin(ticket, result()), true);
  assert.equal(store.acquire(scope).accessToken, "a".repeat(64));
});

test("every identity field and generation must match on access", () => {
  const { store } = setup();
  login(store);
  for (const field of Object.keys(scope)) {
    const changed = {
      ...scope,
      [field]: field === "authGeneration" ? 2 : "9890000099",
    };
    assert.equal(store.acquire(changed), null, field);
  }
});

test("new login supersedes an older in-flight login", () => {
  const { store } = setup();
  const old = store.beginLogin(scope, key);
  const current = store.beginLogin(other, key);
  assert.equal(store.completeLogin(current, result(other)), true);
  assert.equal(store.completeLogin(old, result()), false);
  assert.equal(store.acquire(other).scope.branchId, other.branchId);
  assert.equal(store.acquire(scope), null);
});

test("local clear prevents a late login response restoring access", () => {
  const { store } = setup();
  const ticket = store.beginLogin(scope, key);
  store.clear();
  assert.equal(store.completeLogin(ticket, result()), false);
  assert.equal(store.acquire(scope), null);
});

test("expired sessions and clock rollback clear local access", () => {
  const first = setup();
  login(first.store);
  first.setTime(baseTime + 1_800_000);
  assert.equal(first.store.acquire(scope), null);
  const second = setup();
  login(second.store);
  second.setTime(baseTime - 1);
  assert.equal(second.store.acquire(scope), null);
});

test("late unauthorized response cannot invalidate a newer session", () => {
  const { store } = setup();
  const old = login(store);
  const current = login(store, scope, "b".repeat(64));
  assert.equal(store.invalidate(old.leaseId), false);
  assert.equal(store.acquire(scope).accessToken, "b".repeat(64));
  assert.equal(store.invalidate(current.leaseId), true);
  assert.equal(store.acquire(scope), null);
});

test("scope and key mismatch or malformed session fails closed", () => {
  const bad = [
    result(other),
    { success: false, errorCode: "SERVER_REJECTED" },
    { success: true, data: { ...result().data, keyId: "bad" } },
    { success: true, data: { ...result().data, accessToken: "bad" } },
    { success: true, data: { ...result().data, expiresAt: "bad" } },
    { success: true, data: {
      ...result().data,
      expiresAt: new Date(baseTime + 1_806_000).toISOString(),
    } },
  ];
  for (const value of bad) {
    const { store } = setup();
    const ticket = store.beginLogin(scope, key);
    assert.equal(store.completeLogin(ticket, value), false);
    assert.equal(store.acquire(scope), null);
  }
});

test("caller mutations cannot rewrite stored or pending scope", () => {
  const { store } = setup();
  const supplied = { ...scope };
  const ticket = store.beginLogin(supplied, key);
  supplied.branchId = other.branchId;
  const response = result();
  assert.equal(store.completeLogin(ticket, response), true);
  response.data.scope.branchId = other.branchId;
  response.data.accessToken = "b".repeat(64);
  const lease = store.acquire(scope);
  lease.scope.branchId = other.branchId;
  assert.equal(store.acquire(scope).scope.branchId, scope.branchId);
  assert.equal(store.acquire(scope).accessToken, "a".repeat(64));
});

test("new failed login cannot retain a previous session", () => {
  const { store } = setup();
  login(store);
  const ticket = store.beginLogin(scope, key);
  assert.equal(store.acquire(scope), null);
  assert.equal(store.completeLogin(ticket, {
    success: false, errorCode: "SERVER_UNAVAILABLE",
  }), false);
  assert.equal(store.acquire(scope), null);
  assert.equal(store.completeLogin(ticket, result()), false);
});

test("invalid identity and clock fail closed", () => {
  const { store, setTime } = setup();
  assert.equal(store.beginLogin({ ...scope, branchId: "" }, key), null);
  assert.equal(store.beginLogin(scope, key + "\n"), null);
  login(store);
  setTime(NaN);
  assert.equal(store.acquire(scope), null);
  assert.throws(() => createFinoraServerWalletSessionMemory(null));
});