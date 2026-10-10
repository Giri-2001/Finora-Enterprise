import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletLogoutClient,
} from "../../dist-electron/control/finoraServerWalletLogoutClient.js";
import {
  createFinoraServerWalletCoordinator,
} from "../../dist-electron/control/finoraServerWalletCoordinator.js";

const token = "a".repeat(64);
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });
}

test("logout uses fixed HTTPS endpoint and protected transport options", async () => {
  const logout = createFinoraServerWalletLogoutClient(async (url, options) => {
    assert.equal(url, "https://api.finoraenterprise.com/owner/wallet/logout");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.authorization, `Bearer ${token}`);
    assert.equal(options.redirect, "error");
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    assert.equal(options.body, undefined);
    return json({ ok: true, revoked: true, secret: "excluded" });
  });
  assert.deepEqual(await logout(token), {
    success: true, data: { revoked: true },
  });
});

test("invalid tokens never reach transport", async () => {
  let calls = 0;
  const logout = createFinoraServerWalletLogoutClient(async () => { calls++; });
  for (const value of ["", token + "\n", "A".repeat(64), null]) {
    assert.equal((await logout(value)).errorCode, "INVALID_REQUEST");
  }
  assert.equal(calls, 0);
});

test("false revocation remains false rather than a confirmed revocation", async () => {
  const logout = createFinoraServerWalletLogoutClient(
    async () => json({ ok: true, revoked: false }),
  );
  assert.deepEqual(await logout(token), {
    success: true, data: { revoked: false },
  });
});

test("unauthorized and outage responses do not claim revocation", async () => {
  for (const [status, errorCode] of [
    [401, "UNAUTHORIZED"], [503, "SERVER_UNAVAILABLE"],
  ]) {
    const logout = createFinoraServerWalletLogoutClient(
      async () => json({ ok: false }, status),
    );
    assert.deepEqual(await logout(token), { success: false, errorCode });
  }
});

test("malformed success and non-JSON responses are rejected", async () => {
  for (const make of [
    () => json({ ok: true }),
    () => json({ ok: true, revoked: "true" }),
    () => json({ ok: false, revoked: true }),
    () => new Response("<html>error</html>"),
    () => new Response("{", {
      headers: { "content-type": "application/json" },
    }),
  ]) {
    const logout = createFinoraServerWalletLogoutClient(async () => make());
    assert.equal((await logout(token)).errorCode, "INVALID_SERVER_RESPONSE");
  }
});

test("transport exceptions are sanitized and invalid dependency rejected", async () => {
  const logout = createFinoraServerWalletLogoutClient(async () => {
    throw new Error("private detail");
  });
  assert.deepEqual(await logout(token), {
    success: false, errorCode: "SERVER_UNAVAILABLE",
  });
  assert.throws(() => createFinoraServerWalletLogoutClient(null));
});

const now = Date.parse("2026-10-10T06:00:00.000Z");
const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};
const key = { keyId: "11111111-1111-4111-8111-111111111111" };
const credentials = { username: "testowner", password: "synthetic" };

function setup(revoke) {
  return createFinoraServerWalletCoordinator({
    clock: () => now,
    resolveScope: () => ({
      success: true,
      data: { scope: { ...scope }, canonicalUsername: "testowner" },
    }),
    login: async () => ({
      success: true,
      data: {
        accessToken: token, scope: { ...scope }, keyId: key.keyId,
        expiresAt: new Date(now + 1_800_000).toISOString(),
      },
    }),
    readBalance: async () => ({
      success: true,
      data: {
        source: "POSTGRESQL_WALLETS", walletId: "9890000006",
        balanceInr: "50.00", currency: "INR",
        updatedAt: new Date(now).toISOString(),
      },
    }),
    revoke,
  });
}

test("coordinator clears immediately and late logout preserves new login", async () => {
  let finish;
  let received;
  const pending = new Promise(resolve => { finish = resolve; });
  const coordinator = setup(value => { received = value; return pending; });
  await coordinator.signIn({}, credentials, key);
  const loggingOut = coordinator.logout();
  assert.equal((await coordinator.balance()).errorCode, "UNAUTHORIZED");
  assert.equal(received, token);
  await coordinator.signIn({}, credentials, key);
  finish({ success: true, data: { revoked: true } });
  assert.deepEqual(await loggingOut, {
    localCleared: true, serverStatus: "REVOKED",
  });
  assert.equal((await coordinator.balance()).success, true);
});

test("failed server logout still clears local access and reports uncertainty", async () => {
  for (const revoke of [
    async () => ({ success: false, errorCode: "SERVER_UNAVAILABLE" }),
    async () => { throw new Error("private detail"); },
  ]) {
    const coordinator = setup(revoke);
    await coordinator.signIn({}, credentials, key);
    assert.deepEqual(await coordinator.logout(), {
      localCleared: true, serverStatus: "SERVER_UNAVAILABLE",
    });
    assert.equal((await coordinator.balance()).errorCode, "UNAUTHORIZED");
  }
});

test("logout without local session makes no revocation request", async () => {
  let calls = 0;
  const coordinator = setup(async () => {
    calls++;
    return { success: true, data: { revoked: true } };
  });
  assert.deepEqual(await coordinator.logout(), {
    localCleared: true, serverStatus: "NO_LOCAL_SESSION",
  });
  assert.equal(calls, 0);
});