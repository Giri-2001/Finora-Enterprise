import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletOnlineAccess,
} from "../../dist-electron/control/finoraServerWalletOnlineAccess.js";

const credentials = {
  username: "fixture.owner", password: "synthetic", securityCode: "synthetic",
};
const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};
const identity = () => ({
  success: true,
  data: { scope: { ...scope }, canonicalUsername: credentials.username },
});

function setup(identify = async () => identity(), overrides = {}) {
  const calls = [];
  let resolver;
  let capturedContext;
  const service = createFinoraServerWalletOnlineAccess({
    vault: { read() {}, getOrCreate() {} },
    identify,
    accessFactory(options) {
      resolver = options.resolveScope;
      return {
        clearLocal() { calls.push("clear"); },
        async enroll(context, input) {
          calls.push("enroll");
          capturedContext = context;
          assert.deepEqual(resolver(structuredClone(context)), identity());
          assert.deepEqual(input, credentials);
          return { success: true, data: { keyId: "test-key", enrolledAt: "test-time" } };
        },
        async signIn(context, input) {
          calls.push("login");
          capturedContext = context;
          assert.deepEqual(resolver(structuredClone(context)), identity());
          assert.deepEqual(input, {
            username: credentials.username, password: credentials.password,
          });
          return { success: true, data: { expiresAt: "test-expiry" } };
        },
        async balance() { return { success: false, errorCode: "UNAUTHORIZED" }; },
        async logout() { calls.push("logout"); return { localCleared: true }; },
        ...overrides,
      };
    },
  });
  return {
    service, calls,
    resolve: value => resolver(value),
    context: () => capturedContext,
  };
}

test("explicit enrollment resolves server identity before access service", async () => {
  const f = setup();
  const result = await f.service.enroll(credentials);
  assert.equal(result.success, true);
  assert.deepEqual(f.calls, ["clear", "enroll"]);
});

test("login forwards password without security code to existing login flow", async () => {
  const f = setup();
  assert.deepEqual(await f.service.signIn(credentials), {
    success: true, data: { expiresAt: "test-expiry" },
  });
  assert.deepEqual(f.calls, ["clear", "login"]);
});

test("renderer-shaped identity cannot resolve internal trusted scope", async () => {
  const f = setup();
  await f.service.signIn(credentials);
  for (const value of [
    scope, identity().data, { walletOperationNonce: "guessed" },
    { ...f.context(), branchId: "selected" },
  ]) {
    assert.equal(f.resolve(value).success, false);
  }
  f.service.clearLocal();
  assert.equal(f.resolve(f.context()).success, false);
});

test("identity rejection never reaches enrollment or login", async () => {
  const f = setup(async () => ({ success: false, errorCode: "SERVER_REJECTED" }));
  assert.deepEqual(await f.service.signIn(credentials), {
    success: false, errorCode: "SERVER_REJECTED",
  });
  assert.deepEqual(f.calls, ["clear"]);
});

test("clear during identity lookup prevents late access", async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  const f = setup(async () => { await waiting; return identity(); });
  const pending = f.service.signIn(credentials);
  f.service.clearLocal();
  release();
  assert.equal((await pending).errorCode, "STALE_OPERATION");
  assert.equal(f.calls.includes("login"), false);
});

test("replacement operation invalidates previous internal context", async () => {
  const f = setup();
  await f.service.signIn(credentials);
  const old = f.context();
  await f.service.signIn(credentials);
  assert.equal(f.resolve(old).success, false);
  assert.equal(f.resolve(f.context()).success, true);
});

test("logout cancels pending identity lookup", async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  const f = setup(async () => { await waiting; return identity(); });
  const pending = f.service.enroll(credentials);
  await f.service.logout();
  release();
  assert.equal((await pending).errorCode, "STALE_OPERATION");
  assert.equal(f.calls.includes("enroll"), false);
});

test("malformed identity and exceptions fail closed", async () => {
  for (const identify of [
    async () => ({
      success: true, data: { scope, canonicalUsername: "another.owner" },
    }),
    async () => { throw new Error("private detail"); },
  ]) {
    const f = setup(identify);
    assert.equal((await f.service.signIn(credentials)).success, false);
    assert.equal(f.calls.includes("login"), false);
  }
});