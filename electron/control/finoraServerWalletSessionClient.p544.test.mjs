import test from "node:test";
import assert from "node:assert/strict";
import {
  generateFinoraOwnerWalletProofKeyV1,
  verifyFinoraOwnerWalletProofV1,
} from "../../dist-electron/control/finoraOwnerWalletProofCrypto.js";
import {
  createFinoraServerWalletSessionClient as createClient,
} from "../../dist-electron/control/finoraServerWalletSessionClient.js";

const material = generateFinoraOwnerWalletProofKeyV1();
const credentials = { username: " Owner ", password: " Exact Password " };
const scope = {
  userId: "9880000004", ownerId: "9880000001",
  businessId: "9880000002", branchId: "9880000003",
  credentialId: "9880000008", authGeneration: 1,
};
function challenge() {
  return {
    ok: true, challenge: "a".repeat(64), authTicket: "b".repeat(64),
    credentialId: scope.credentialId, authGeneration: 1,
    expiresAt: new Date(Date.now() + 120000).toISOString(),
  };
}
function session() {
  return {
    ok: true, tokenType: "Bearer", accessToken: "c".repeat(64),
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
  };
}
function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });
}

test("signs actual login challenge and returns internally scoped session", async () => {
  const calls = [];
  const sessionBody = session();
  const login = createClient(async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, options, body });
    if (calls.length === 1) return response(challenge());

    assert.equal(verifyFinoraOwnerWalletProofV1({
      ...scope, keyId: material.keyId, challenge: body.challenge,
    }, body.signature, material), true);
    return response({ ...sessionBody, internal: "HIDDEN" });
  });

  const result = await login(credentials, scope, material);
  assert.deepEqual(result, {
    success: true,
    data: {
      accessToken: sessionBody.accessToken,
      expiresAt: sessionBody.expiresAt,
      scope,
      keyId: material.keyId,
    },
  });
  assert.equal(calls[0].url,
    "https://api.finoraenterprise.com/owner/wallet/proof/challenge");
  assert.equal(calls[1].url,
    "https://api.finoraenterprise.com/owner/wallet/proof/session");
  assert.deepEqual(calls[0].body, {
    username: "Owner", password: credentials.password,
  });
  assert.deepEqual(Object.keys(calls[1].body).sort(), [
    "challenge", "authTicket", "keyId", "signature",
  ].sort());
  for (const call of calls) {
    assert.equal(call.options.redirect, "error");
    assert.equal(call.options.credentials, "omit");
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.body.includes(material.privateKeyPkcs8DerBase64), false);
  }
});

test("wrong credential lineage and malformed challenges stop before signing request", async () => {
  for (const change of [
    { credentialId: "OTHER" }, { authGeneration: 2 },
    { challenge: "a".repeat(64) + "\n" },
    { authTicket: "invalid" },
    { expiresAt: new Date(Date.now() - 1000).toISOString() },
  ]) {
    let calls = 0;
    const login = createClient(async () => {
      calls++;
      return response({ ...challenge(), ...change });
    });
    assert.equal((await login(credentials, scope, material)).errorCode,
      "INVALID_SERVER_RESPONSE");
    assert.equal(calls, 1);
  }
});

test("malformed token, token type and expiry never produce session success", async () => {
  for (const change of [
    { accessToken: "c".repeat(64) + "\n" },
    { tokenType: "OTHER" },
    { expiresAt: "invalid" },
    { expiresAt: new Date(Date.now() + 3600000).toISOString() },
  ]) {
    let calls = 0;
    const login = createClient(async () => response(
      ++calls === 1 ? challenge() : { ...session(), ...change },
    ));
    assert.equal((await login(credentials, scope, material)).errorCode,
      "INVALID_SERVER_RESPONSE");
  }
});

test("HTTP rejection and rate limiting never fall back to legacy login", async () => {
  for (const [status, errorCode] of [
    [401, "SERVER_REJECTED"], [429, "RATE_LIMITED"],
    [404, "SERVER_UNAVAILABLE"], [503, "SERVER_UNAVAILABLE"],
  ]) {
    let calls = 0;
    const login = createClient(async () => {
      calls++;
      return response({ detail: "HIDDEN" }, status);
    });
    assert.deepEqual(await login(credentials, scope, material), {
      success: false, errorCode,
    });
    assert.equal(calls, 1);
  }
});

test("invalid input and mismatched key material never reach network", async () => {
  let calls = 0;
  const login = createClient(async () => { calls++; throw new Error("NETWORK"); });
  assert.equal((await login(
    { ...credentials, password: "" }, scope, material,
  )).errorCode, "INVALID_REQUEST");
  assert.equal((await login(
    credentials, scope, { ...material, publicKeySha256: "0".repeat(64) },
  )).errorCode, "INVALID_REQUEST");
  assert.equal(calls, 0);
});

test("network failure is sanitized and does not return token or scope", async () => {
  const login = createClient(async () => { throw new Error("PRIVATE_DETAIL"); });
  assert.deepEqual(await login(credentials, scope, material), {
    success: false, errorCode: "SERVER_UNAVAILABLE",
  });
});