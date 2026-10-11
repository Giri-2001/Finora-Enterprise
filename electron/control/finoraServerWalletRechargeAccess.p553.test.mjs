
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createFinoraServerWalletOnlineAccess: createOnline } =
  require("../../dist-electron/control/finoraServerWalletOnlineAccess.js");
const { createFinoraServerWalletAccessService: createAccess } =
  require("../../dist-electron/control/finoraServerWalletAccessService.js");
const { createFinoraServerWalletCoordinator: createCoordinator } =
  require("../../dist-electron/control/finoraServerWalletCoordinator.js");
const { createFinoraServerWalletRechargeClient: createClient } =
  require("../../dist-electron/control/finoraServerWalletRechargeClient.js");

const scope = {
  userId: "1000000001", ownerId: "1000000002",
  businessId: "1000000003", branchId: "fixture-branch",
  credentialId: "fixture-credential", authGeneration: 1,
};
const key = { keyId: "11111111-1111-4111-8111-111111111111" };
const credentials = {
  username: "fixture.owner", password: "synthetic-password",
  securityCode: "synthetic-code",
};
const input = () => ({
  amountInr: 100, paymentMethod: "PHONEPE",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
});
const receipt = {
  ok: true, source: "POSTGRESQL_RECHARGE_REQUESTS",
  request: {
    requestId: "33333333-3333-4333-8333-333333333333",
    walletId: "1234567890", amountInr: "100.00",
    paymentMethod: "PHONEPE", status: "PENDING",
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  replayed: false,
};
const response = () => new Response(JSON.stringify(receipt), {
  status: 201, headers: { "content-type": "application/json" },
});

function fixture(transport) {
  const calls = { identity: 0, read: 0, create: 0, login: 0 };
  const online = createOnline({
    identify: async supplied => {
      calls.identity++;
      assert.deepEqual(supplied, credentials);
      return { success: true, data: {
        canonicalUsername: "fixture.owner", scope: { ...scope },
      }};
    },
    vault: {
      read: async supplied => {
        calls.read++;
        assert.deepEqual(supplied, scope);
        return { ...key };
      },
      getOrCreate: async () => {
        calls.create++;
        throw new Error("Unexpected key creation");
      },
    },
    accessFactory: options => createAccess({
      ...options,
      coordinator: createCoordinator({
        resolveScope: options.resolveScope,
        clock: () => Date.parse("2026-10-10T09:00:00.000Z"),
        login: async (supplied, suppliedScope, suppliedKey) => {
          calls.login++;
          assert.deepEqual(supplied, {
            username: credentials.username, password: credentials.password,
          });
          assert.deepEqual(suppliedScope, scope);
          assert.deepEqual(suppliedKey, key);
          return { success: true, data: {
            accessToken: "a".repeat(64),
            expiresAt: "2026-10-10T09:10:00.000Z",
            scope: { ...scope }, keyId: key.keyId,
          }};
        },
        submitRecharge: createClient(transport),
        revoke: async () => ({ success: true, data: { revoked: true } }),
      }),
    }),
  });
  return { online, calls };
}

test("online recharge requires an existing session without identity or vault work", async () => {
  let sent = 0;
  const f = fixture(async () => { sent++; return response(); });
  assert.deepEqual(await f.online.recharge(input()), {
    success: false, errorCode: "UNAUTHORIZED",
  });
  assert.deepEqual(f.calls, { identity: 0, read: 0, create: 0, login: 0 });
  assert.equal(sent, 0);
});

test("actual module chain sends main-owned token and preserves receipt fields", async () => {
  let sent = 0;
  const f = fixture(async (_url, options) => {
    sent++;
    assert.equal(new Headers(options.headers).get("authorization"),
      "Bearer " + "a".repeat(64));
    assert.deepEqual(JSON.parse(options.body), input());
    return response();
  });
  assert.equal((await f.online.signIn(credentials)).success, true);
  const result = await f.online.recharge(input());
  assert.deepEqual(result, {
    success: true,
    data: {
      source: receipt.source, request: receipt.request, replayed: false,
    },
  });
  assert.deepEqual(f.calls, { identity: 1, read: 1, create: 0, login: 1 });
  assert.equal(sent, 1);
  assert.equal(JSON.stringify(result).includes("a".repeat(64)), false);
});

test("forwarding preserves forbidden fields so validation rejects them", async () => {
  let sent = 0;
  const f = fixture(async () => { sent++; return response(); });
  await f.online.signIn(credentials);
  for (const extra of [
    { branchId: "another" }, { walletId: "9999999999" },
    { accessToken: "renderer-token" },
  ]) {
    assert.equal((await f.online.recharge({ ...input(), ...extra })).errorCode,
      "INVALID_REQUEST");
  }
  assert.equal(sent, 0);
});

test("online clear suppresses a pending receipt and blocks further submission", async () => {
  let finish;
  let sent = 0;
  const f = fixture(async () => {
    sent++;
    return new Promise(resolve => { finish = resolve; });
  });
  await f.online.signIn(credentials);
  const pending = f.online.recharge(input());
  f.online.clearLocal();
  finish(response());
  assert.equal((await pending).errorCode, "STALE_OPERATION");
  assert.equal((await f.online.recharge(input())).errorCode, "UNAUTHORIZED");
  assert.equal(sent, 1);
});

test("online logout revokes local access without automatic reauthentication", async () => {
  let sent = 0;
  const f = fixture(async () => { sent++; return response(); });
  await f.online.signIn(credentials);
  assert.equal((await f.online.recharge(input())).success, true);
  assert.deepEqual(await f.online.logout(), {
    localCleared: true, serverStatus: "REVOKED",
  });
  assert.equal((await f.online.recharge(input())).errorCode, "UNAUTHORIZED");
  assert.deepEqual(f.calls, { identity: 1, read: 1, create: 0, login: 1 });
  assert.equal(sent, 1);
});
