import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletAccessService,
} from "../../dist-electron/control/finoraServerWalletAccessService.js";

const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};
const key = { keyId: "11111111-1111-4111-8111-111111111111" };
const credentials = {
  username: "testowner", password: "synthetic-password",
  securityCode: "synthetic-security",
};
const expiresAt = "2026-10-10T07:00:00.000Z";
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function setup(overrides = {}) {
  const calls = { read: 0, create: 0, login: 0, enroll: 0, clear: 0 };
  const vault = {
    read: async received => {
      calls.read++;
      assert.deepEqual(received, scope);
      return key;
    },
    getOrCreate: async received => {
      calls.create++;
      assert.deepEqual(received, scope);
      return key;
    },
  };
  const coordinator = {
    signIn: async (_signed, supplied, material) => {
      calls.login++;
      assert.deepEqual(supplied, {
        username: credentials.username, password: credentials.password,
      });
      assert.equal(material, key);
      return { success: true, data: { expiresAt, hidden: "excluded" } };
    },
    clearLocal: () => { calls.clear++; },
    balance: async () => ({ success: false, errorCode: "UNAUTHORIZED" }),
    logout: async () => ({ localCleared: true, serverStatus: "NO_LOCAL_SESSION" }),
  };
  const enroll = async (supplied, receivedScope, material) => {
    calls.enroll++;
    assert.deepEqual(supplied, credentials);
    assert.deepEqual(receivedScope, scope);
    assert.equal(material, key);
    return {
      success: true,
      data: { keyId: key.keyId, enrolledAt: expiresAt, hidden: "excluded" },
    };
  };
  const service = createFinoraServerWalletAccessService({
    vault, coordinator, enroll,
    resolveScope: () => ({
      success: true,
      data: { scope: { ...scope }, canonicalUsername: "testowner" },
    }),
    ...overrides,
  });
  return { service, calls };
}

test("explicit enrollment persists key before client call and creates no session", async () => {
  const { service, calls } = setup();
  assert.deepEqual(await service.enroll({}, credentials), {
    success: true, data: { keyId: key.keyId, enrolledAt: expiresAt },
  });
  assert.equal(calls.create, 1);
  assert.equal(calls.enroll, 1);
  assert.equal(calls.login, 0);
});

test("login reads existing key without generation or enrollment", async () => {
  const { service, calls } = setup();
  assert.deepEqual(await service.signIn({}, credentials), {
    success: true, data: { expiresAt },
  });
  assert.equal(calls.read, 1);
  assert.equal(calls.create, 0);
  assert.equal(calls.enroll, 0);
  assert.equal(calls.login, 1);
});

test("missing key requires explicit enrollment without reaching login", async () => {
  const { service, calls } = setup({
    vault: {
      read: async () => null,
      getOrCreate: async () => { throw new Error("must not generate"); },
    },
  });
  assert.equal(
    (await service.signIn({}, credentials)).errorCode,
    "KEY_ENROLLMENT_REQUIRED",
  );
  assert.equal(calls.login, 0);
});

test("unverified identity and mismatched username stop before vault access", async () => {
  const denied = setup({
    resolveScope: () => ({
      success: false, errorCode: "WALLET_IDENTITY_UNVERIFIED",
    }),
  });
  await denied.service.enroll({}, credentials);
  await denied.service.signIn({}, credentials);
  assert.equal(denied.calls.create + denied.calls.read, 0);

  const mismatch = setup();
  await mismatch.service.signIn({}, { ...credentials, username: "another" });
  assert.equal(mismatch.calls.read, 0);
});

test("clearing during vault read prevents late login", async () => {
  const pending = deferred();
  const { service, calls } = setup({
    vault: { read: () => pending.promise, getOrCreate: async () => key },
  });
  const attempt = service.signIn({}, credentials);
  service.clearLocal();
  pending.resolve(key);
  assert.equal((await attempt).errorCode, "STALE_OPERATION");
  assert.equal(calls.login, 0);
});

test("clearing during key creation prevents late enrollment submission", async () => {
  const pending = deferred();
  const { service, calls } = setup({
    vault: { read: async () => key, getOrCreate: () => pending.promise },
  });
  const attempt = service.enroll({}, credentials);
  service.clearLocal();
  pending.resolve(key);
  assert.equal((await attempt).errorCode, "STALE_OPERATION");
  assert.equal(calls.enroll, 0);
});

test("key conflict remains explicit and does not trigger login or replacement", async () => {
  const { service, calls } = setup({
    enroll: async () => ({ success: false, errorCode: "KEY_CONFLICT" }),
  });
  assert.equal((await service.enroll({}, credentials)).errorCode, "KEY_CONFLICT");
  assert.equal(calls.create, 1);
  assert.equal(calls.login, 0);
});

test("vault failures are sanitized and logout cancels a pending login", async () => {
  const broken = setup({
    vault: {
      read: async () => { throw new Error("private detail"); },
      getOrCreate: async () => { throw new Error("private detail"); },
    },
  });
  assert.deepEqual(await broken.service.signIn({}, credentials), {
    success: false, errorCode: "WALLET_ACCESS_UNAVAILABLE",
  });

  const pending = deferred();
  const { service, calls } = setup({
    vault: { read: () => pending.promise, getOrCreate: async () => key },
  });
  const attempt = service.signIn({}, credentials);
  await service.logout();
  pending.resolve(key);
  assert.equal((await attempt).errorCode, "STALE_OPERATION");
  assert.equal(calls.login, 0);
});