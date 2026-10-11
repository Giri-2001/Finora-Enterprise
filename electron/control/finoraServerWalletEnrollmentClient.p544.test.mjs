import test from "node:test";
import assert from "node:assert/strict";
import {
  generateFinoraOwnerWalletProofKeyV1,
} from "../../dist-electron/control/finoraOwnerWalletProofCrypto.js";
import {
  createFinoraServerWalletEnrollmentClient as createClient,
} from "../../dist-electron/control/finoraServerWalletEnrollmentClient.js";

const material = generateFinoraOwnerWalletProofKeyV1();
const credentials = {
  username: " TestOwner ", password: " Exact Password ", securityCode: "12345678",
};
const scope = {
  userId: "9880000004", ownerId: "9880000001",
  businessId: "9880000002", branchId: "9880000003",
  credentialId: "9880000008", authGeneration: 1,
};
function grant() {
  return {
    ok: true, ...scope,
    enrollmentAuthorizationId: "11111111-1111-4111-8111-111111111111",
    challenge: "a".repeat(64), keyId: material.keyId,
    publicKeySha256: material.publicKeySha256,
    expiresAt: new Date(Date.now() + 120000).toISOString(),
  };
}
function response(body, status) {
  return new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });
}

test("sends explicit credentials then public proof; never transmits private key", async () => {
  const calls = [];
  const enrolledAt = new Date().toISOString();
  const client = createClient(async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return calls.length === 1
      ? response(grant(), 201)
      : response({ ok: true, keyId: material.keyId, enrolledAt, internal: "HIDDEN" }, 200);
  });
  assert.deepEqual(await client(credentials, scope, material), {
    success: true, data: { keyId: material.keyId, enrolledAt },
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url,
    "https://api.finoraenterprise.com/owner/wallet/enrollment/start");
  assert.equal(calls[1].url,
    "https://api.finoraenterprise.com/owner/wallet/enrollment/redeem");
  assert.deepEqual(Object.keys(calls[0].body).sort(), [
    "username", "password", "securityCode", "keyId", "publicKeySpkiDerBase64",
  ].sort());
  assert.deepEqual(Object.keys(calls[1].body).sort(), [
    "challenge", "enrollmentAuthorizationId", "keyId",
    "publicKeySpkiDerBase64", "publicKeySha256", "signatureBase64",
  ].sort());
  assert.equal(calls[0].body.password, credentials.password);
  for (const call of calls) {
    assert.equal(call.options.redirect, "error");
    assert.equal(call.options.credentials, "omit");
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.body.includes(material.privateKeyPkcs8DerBase64), false);
  }
});

test("wrong scope or generation never reaches redemption", async () => {
  for (const change of [
    { ownerId: "OTHER" }, { businessId: "OTHER" }, { branchId: "OTHER" },
    { userId: "OTHER" }, { credentialId: "OTHER" }, { authGeneration: 2 },
  ]) {
    let calls = 0;
    const client = createClient(async () => {
      calls++;
      return response({ ...grant(), ...change }, 201);
    });
    assert.equal((await client(credentials, scope, material)).errorCode,
      "INVALID_SERVER_RESPONSE");
    assert.equal(calls, 1);
  }
});

test("wrong key binding or expired grant never reaches redemption", async () => {
  for (const change of [
    { keyId: "11111111-1111-4111-8111-111111111111" },
    { publicKeySha256: "0".repeat(64) },
    { challenge: "a".repeat(64) + "\n" },
    { expiresAt: new Date(Date.now() - 1000).toISOString() },
    { expiresAt: new Date(Date.now() + 300000).toISOString() },
  ]) {
    let calls = 0;
    const client = createClient(async () => {
      calls++;
      return response({ ...grant(), ...change }, 201);
    });
    assert.equal((await client(credentials, scope, material)).success, false);
    assert.equal(calls, 1);
  }
});

test("rejection, limiting and outage return explicit failures", async () => {
  for (const [status, errorCode] of [
    [401, "SERVER_REJECTED"], [429, "RATE_LIMITED"],
    [409, "KEY_CONFLICT"], [503, "SERVER_UNAVAILABLE"],
    [404, "SERVER_UNAVAILABLE"],
  ]) {
    const client = createClient(async () => response({ detail: "HIDDEN" }, status));
    assert.deepEqual(await client(credentials, scope, material), {
      success: false, errorCode,
    });
  }
  const client = createClient(async () => { throw new Error("PRIVATE_DETAIL"); });
  assert.deepEqual(await client(credentials, scope, material), {
    success: false, errorCode: "SERVER_UNAVAILABLE",
  });
});

test("invalid credentials and key material stop before network", async () => {
  let calls = 0;
  const client = createClient(async () => { calls++; throw new Error("NETWORK"); });
  assert.equal((await client(
    { ...credentials, password: "" }, scope, material,
  )).errorCode, "INVALID_REQUEST");
  assert.equal((await client(
    credentials, scope, { ...material, publicKeySha256: "0".repeat(64) },
  )).errorCode, "INVALID_REQUEST");
  assert.equal(calls, 0);
});

test("malformed activation response never reports enrollment success", async () => {
  let calls = 0;
  const client = createClient(async () => {
    calls++;
    return calls === 1 ? response(grant(), 201)
      : response({ ok: true, keyId: material.keyId, enrolledAt: "invalid" }, 200);
  });
  assert.deepEqual(await client(credentials, scope, material), {
    success: false, errorCode: "INVALID_SERVER_RESPONSE",
  });
});