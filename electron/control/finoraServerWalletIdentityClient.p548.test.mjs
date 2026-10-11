import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletIdentityClient,
} from "../../dist-electron/control/finoraServerWalletIdentityClient.js";

const input = {
  username: "Fixture.Owner",
  password: " synthetic password ",
  securityCode: " synthetic code ",
};
const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};
const identity = { ...scope, canonicalUsername: "fixture.owner" };
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json; charset=utf-8" },
});

test("fixed HTTPS request preserves secrets and protects transport options", async () => {
  const client = createFinoraServerWalletIdentityClient(async (url, options) => {
    assert.equal(url, "https://api.finoraenterprise.com/owner/wallet/identity");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(options.body), input);
    assert.equal(Object.hasOwn(options.headers, "Authorization"), false);
    return json({ ok: true, identity });
  });
  assert.equal((await client(input)).success, true);
});

test("identity result includes explicit scope but no token or grant", async () => {
  const client = createFinoraServerWalletIdentityClient(async () => json({
    ok: true, accessToken: "exclude",
    identity: { ...identity, privateKey: "exclude", enrollmentAuthorizationId: "exclude" },
  }));
  assert.deepEqual(await client(input), {
    success: true, data: { scope, canonicalUsername: "fixture.owner" },
  });
});

test("invalid credentials and client scope never reach transport", async () => {
  let calls = 0;
  const client = createFinoraServerWalletIdentityClient(async () => {
    calls++;
    return json({ ok: true, identity });
  });
  for (const value of [
    null, [], {},
    { ...input, branchId: "selected" },
    { ...input, url: "https://example.invalid" },
    { ...input, username: "bad\nname" },
    { ...input, password: "" },
    { ...input, securityCode: "x".repeat(73) },
    { ...input, password: "\u00e9".repeat(37) },
  ]) {
    assert.deepEqual(await client(value), {
      success: false, errorCode: "INVALID_REQUEST",
    });
  }
  assert.equal(calls, 0);
});

test("rejection, rate limiting and unavailable statuses remain failures", async () => {
  for (const [status, errorCode] of [
    [400, "SERVER_REJECTED"], [401, "SERVER_REJECTED"],
    [403, "SERVER_REJECTED"], [429, "RATE_LIMITED"],
    [503, "SERVER_UNAVAILABLE"], [302, "SERVER_UNAVAILABLE"],
  ]) {
    const client = createFinoraServerWalletIdentityClient(
      async () => json({ error: "private detail" }, status),
    );
    assert.deepEqual(await client(input), { success: false, errorCode });
  }
});

test("malformed identity or wrong username cannot become success", async () => {
  for (const value of [
    null, {},
    { ...identity, branchId: "" },
    { ...identity, ownerId: "bad\nid" },
    { ...identity, authGeneration: "1" },
    { ...identity, authGeneration: 0 },
    { ...identity, canonicalUsername: "another.owner" },
  ]) {
    const client = createFinoraServerWalletIdentityClient(
      async () => json({ ok: true, identity: value }),
    );
    assert.deepEqual(await client(input), {
      success: false, errorCode: "INVALID_SERVER_RESPONSE",
    });
  }
});

test("HTML, broken JSON and oversized responses are rejected", async () => {
  for (const makeResponse of [
    () => new Response("<html>error</html>", {
      headers: { "Content-Type": "text/html" },
    }),
    () => new Response("{broken", {
      headers: { "Content-Type": "application/json" },
    }),
    () => json({ ok: true, identity, padding: "x".repeat(17000) }),
  ]) {
    const client = createFinoraServerWalletIdentityClient(async () => makeResponse());
    assert.deepEqual(await client(input), {
      success: false, errorCode: "INVALID_SERVER_RESPONSE",
    });
  }
});

test("network errors are sanitized and invalid dependency is rejected", async () => {
  assert.throws(() => createFinoraServerWalletIdentityClient(null));
  const client = createFinoraServerWalletIdentityClient(async () => {
    throw new Error("private network detail");
  });
  assert.deepEqual(await client(input), {
    success: false, errorCode: "SERVER_UNAVAILABLE",
  });
});

test("caller mutation during request cannot change expected identity", async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  const supplied = { ...input };
  const client = createFinoraServerWalletIdentityClient(async () => {
    await waiting;
    return json({ ok: true, identity });
  });
  const pending = client(supplied);
  supplied.username = "another.owner";
  release();
  assert.equal((await pending).data.canonicalUsername, "fixture.owner");
});