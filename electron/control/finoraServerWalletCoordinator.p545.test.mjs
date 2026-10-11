import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletCoordinator,
} from "../../dist-electron/control/finoraServerWalletCoordinator.js";

const now = Date.parse("2026-10-10T06:00:00.000Z");
const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};
const key = {
  keyId: "11111111-1111-4111-8111-111111111111",
};
const credentials = { username: "testowner", password: "test-password" };
const token = "a".repeat(64);

function session(s = scope) {
  return {
    success: true,
    data: {
      accessToken: token, scope: { ...s }, keyId: key.keyId,
      expiresAt: new Date(now + 1_800_000).toISOString(),
    },
  };
}
function money(value = "50.00") {
  return {
    success: true,
    data: {
      source: "POSTGRESQL_WALLETS", walletId: "9890000006",
      balanceInr: value, currency: "INR",
      updatedAt: new Date(now).toISOString(),
      internalSecret: "must-not-return",
    },
  };
}
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function setup(overrides = {}) {
  return createFinoraServerWalletCoordinator({
    clock: () => now,
    resolveScope: () => ({
      success: true,
      data: { scope: { ...scope }, canonicalUsername: "testowner" },
    }),
    login: async () => session(),
    readBalance: async () => money(),
    ...overrides,
  });
}

test("login token stays internal and balance returns explicit fields", async () => {
  let receivedToken;
  const coordinator = setup({
    readBalance: async value => {
      receivedToken = value;
      return money();
    },
  });
  assert.deepEqual(await coordinator.balance(), {
    success: false, errorCode: "UNAUTHORIZED",
  });
  const login = await coordinator.signIn({}, credentials, key);
  assert.deepEqual(Object.keys(login.data), ["expiresAt"]);
  const balance = await coordinator.balance();
  assert.equal(receivedToken, token);
  assert.equal(balance.data.balanceInr, "50.00");
  assert.equal("internalSecret" in balance.data, false);
  assert.equal(JSON.stringify([login, balance]).includes(token), false);
});

test("unverified identity and username mismatch never invoke login", async () => {
  let calls = 0;
  const login = async () => { calls++; return session(); };
  const denied = setup({
    login,
    resolveScope: () => ({
      success: false, errorCode: "WALLET_IDENTITY_UNVERIFIED",
    }),
  });
  assert.equal((await denied.signIn({}, credentials, key)).success, false);
  const mismatch = setup({ login });
  assert.equal((await mismatch.signIn({}, {
    ...credentials, username: "another",
  }, key)).errorCode, "INVALID_REQUEST");
  assert.equal(calls, 0);
});

test("clear during login prevents late session installation", async () => {
  const pending = deferred();
  const coordinator = setup({ login: () => pending.promise });
  const signingIn = coordinator.signIn({}, credentials, key);
  coordinator.clearLocal();
  pending.resolve(session());
  assert.equal((await signingIn).errorCode, "STALE_OPERATION");
  assert.equal((await coordinator.balance()).errorCode, "UNAUTHORIZED");
});

test("replacement login suppresses old in-flight balance", async () => {
  const pending = deferred();
  let reads = 0;
  const coordinator = setup({
    readBalance: async () => ++reads === 1 ? pending.promise : money("150.00"),
  });
  await coordinator.signIn({}, credentials, key);
  const oldBalance = coordinator.balance();
  await coordinator.signIn({}, credentials, key);
  pending.resolve(money("50.00"));
  assert.equal((await oldBalance).errorCode, "STALE_OPERATION");
  assert.equal((await coordinator.balance()).data.balanceInr, "150.00");
});

test("late unauthorized response cannot clear replacement session", async () => {
  const pending = deferred();
  let reads = 0;
  const coordinator = setup({
    readBalance: async () => ++reads === 1 ? pending.promise : money(),
  });
  await coordinator.signIn({}, credentials, key);
  const old = coordinator.balance();
  await coordinator.signIn({}, credentials, key);
  pending.resolve({ success: false, errorCode: "UNAUTHORIZED" });
  assert.equal((await old).errorCode, "STALE_OPERATION");
  assert.equal((await coordinator.balance()).success, true);
});

test("current unauthorized session is forgotten without another API call", async () => {
  let reads = 0;
  const coordinator = setup({
    readBalance: async () => {
      reads++;
      return { success: false, errorCode: "UNAUTHORIZED" };
    },
  });
  await coordinator.signIn({}, credentials, key);
  assert.equal((await coordinator.balance()).errorCode, "UNAUTHORIZED");
  assert.equal((await coordinator.balance()).errorCode, "UNAUTHORIZED");
  assert.equal(reads, 1);
});

test("outage and exceptions never return fabricated balance or secrets", async () => {
  for (const readBalance of [
    async () => ({ success: false, errorCode: "SERVER_UNAVAILABLE" }),
    async () => { throw new Error("secret"); },
  ]) {
    const coordinator = setup({ readBalance });
    await coordinator.signIn({}, credentials, key);
    assert.deepEqual(await coordinator.balance(), {
      success: false, errorCode: "SERVER_UNAVAILABLE",
    });
  }
});

test("failed replacement login removes previous local access", async () => {
  let attempts = 0;
  const coordinator = setup({
    login: async () => ++attempts === 1 ? session() : ({
      success: false, errorCode: "SERVER_REJECTED",
    }),
  });
  await coordinator.signIn({}, credentials, key);
  assert.equal((await coordinator.balance()).success, true);
  assert.equal(
    (await coordinator.signIn({}, credentials, key)).errorCode,
    "SERVER_REJECTED",
  );
  assert.equal((await coordinator.balance()).errorCode, "UNAUTHORIZED");
});