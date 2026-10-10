import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletTrustedScopeResolver,
} from "../../dist-electron/control/finoraServerWalletTrustedScope.js";

function payload() {
  return {
    userId: "9890000004", ownerId: "9890000001",
    businessId: "9890000002", branchId: "9890000003",
    credentialId: "9890000008", authGeneration: 1,
    role: "OWNER", dataContext: "REAL",
    username: "TestOwner", canonicalUsername: "testowner",
    mustChangePassword: false, mustChangeSecurityCode: false,
    storageMode: "USB", subscriptionStatus: "ACTIVE",
    accessValidUntil: "2020-01-01T00:00:00.000Z",
    extraInternalField: "must-not-return",
  };
}

// Positive mapping tests isolate policy with a stub verifier.
// They do not establish that these synthetic payloads have valid signatures.
function resolverFor(value) {
  return createFinoraServerWalletTrustedScopeResolver(() => ({ payload: value }));
}

test("verified identity maps to explicit scope fields only", () => {
  const input = payload();
  const result = resolverFor(input)({});
  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    scope: {
      userId: input.userId, ownerId: input.ownerId,
      businessId: input.businessId, branchId: input.branchId,
      credentialId: input.credentialId, authGeneration: 1,
    },
    canonicalUsername: "testowner",
  });
});

test("original envelope goes to verifier and unverified scope is ignored", () => {
  const envelope = { payload: { branchId: "client-selected" } };
  let received;
  const resolve = createFinoraServerWalletTrustedScopeResolver(value => {
    received = value;
    return { payload: payload() };
  });
  assert.equal(resolve(envelope).data.scope.branchId, "9890000003");
  assert.equal(received, envelope);
});

test("real pinned verifier rejects unsigned and malformed bootstrap", () => {
  const resolve = createFinoraServerWalletTrustedScopeResolver();
  for (const value of [
    null, {}, [], payload(),
    { schemaVersion: 1, payload: payload(), signature: { value: "forged" } },
  ]) {
    assert.deepEqual(resolve(value), {
      success: false, errorCode: "WALLET_IDENTITY_UNVERIFIED",
    });
  }
});

test("non-owner, demo and incomplete first login remain blocked", () => {
  for (const change of [
    { role: "ADMIN" }, { role: "MANAGER" }, { dataContext: "DEMO" },
    { mustChangePassword: true }, { mustChangeSecurityCode: true },
    { mustChangePassword: undefined },
  ]) {
    assert.equal(resolverFor({ ...payload(), ...change })({}).success, false);
  }
});

test("malformed scope and generation fail closed", () => {
  for (const field of [
    "userId", "ownerId", "businessId", "branchId", "credentialId",
  ]) {
    for (const value of ["", "bad\n", "x".repeat(129), null]) {
      assert.equal(
        resolverFor({ ...payload(), [field]: value })({}).success, false,
      );
    }
  }
  for (const value of [0, -1, 1.5, "1", NaN]) {
    assert.equal(
      resolverFor({ ...payload(), authGeneration: value })({}).success, false,
    );
  }
});

test("mapping has no storage-mode or current subscription-date dependency", () => {
  const results = ["CLOUD", "LOCAL", "USB"].map(storageMode =>
    resolverFor({ ...payload(), storageMode })({}),
  );
  assert.equal(results[0].success, true);
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[1], results[2]);
});

test("identity mismatch, verifier rejection and exceptions are sanitized", () => {
  assert.equal(
    resolverFor({ ...payload(), canonicalUsername: "another" })({}).success,
    false,
  );
  for (const verify of [
    () => null,
    () => { throw new Error("private diagnostic"); },
  ]) {
    assert.deepEqual(createFinoraServerWalletTrustedScopeResolver(verify)({}), {
      success: false, errorCode: "WALLET_IDENTITY_UNVERIFIED",
    });
  }
  assert.throws(() => createFinoraServerWalletTrustedScopeResolver(null));
});

test("returned identity does not retain mutable verifier payload", () => {
  const input = payload();
  const result = resolverFor(input)({});
  input.branchId = "changed";
  assert.equal(result.data.scope.branchId, "9890000003");
  result.data.scope.ownerId = "changed";
  assert.equal(input.ownerId, "9890000001");
});