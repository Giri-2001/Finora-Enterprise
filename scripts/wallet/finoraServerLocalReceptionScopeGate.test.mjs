import test from "node:test";
import assert from "node:assert/strict";
import {
  verifyFinoraServerLocalReceptionScope as verify,
} from "../../electron/control/finoraServerLocalReceptionScopeGate.ts";

const principal = {
  userId: "user-1",
  ownerId: "owner-1",
  businessId: "business-1",
  branchId: "branch-1",
};

const local = {
  ...principal,
  role: "OWNER",
  dataContext: "REAL",
  storageMode: "LOCAL",
  accessMode: "ACTIVE",
};

test("matching independently verified scopes are eligible", () => {
  assert.deepEqual(verify(true, principal, local), {
    allowed: true,
    operationalMode: "ACTIVE",
  });
});

for (const key of [
  "userId", "ownerId", "businessId", "branchId",
]) {
  test(`wrong ${key} denies handoff`, () => {
    const wrong = { ...principal, [key]: "different" };
    assert.equal(verify(true, wrong, local).allowed, false);
  });
}

test("unverified server session denies handoff", () => {
  assert.equal(verify(false, principal, local).allowed, false);
});

test("missing local authority denies handoff", () => {
  assert.equal(verify(true, principal, null).allowed, false);
});

test("non-owner denies handoff", () => {
  assert.equal(
    verify(true, principal, { ...local, role: "STAFF" }).allowed,
    false,
  );
});

test("demo context denies handoff", () => {
  assert.equal(
    verify(true, principal, { ...local, dataContext: "DEMO" }).allowed,
    false,
  );
});

test("invalid storage mode denies handoff", () => {
  assert.equal(
    verify(true, principal, { ...local, storageMode: "UNKNOWN" }).allowed,
    false,
  );
});

test("inactive authorization denies handoff", () => {
  assert.equal(
    verify(true, principal, { ...local, accessMode: "DENIED" }).allowed,
    false,
  );
});

test("expired subscription stays read-only", () => {
  assert.deepEqual(
    verify(true, principal, {
      ...local,
      accessMode: "REGISTERED_EXPIRED_READ_ONLY",
    }),
    {
      allowed: true,
      operationalMode: "REGISTERED_EXPIRED_READ_ONLY",
    },
  );
});
/* P1-693L_NEGATIVE_CASES */
test("truthy but non-boolean verification is rejected", () => {
  assert.equal(verify(1, principal, local).allowed, false);
});

test("blank server identity is rejected", () => {
  assert.equal(
    verify(true, { ...principal, ownerId: "   " }, local).allowed,
    false,
  );
});

test("blank local identity is rejected", () => {
  assert.equal(
    verify(true, principal, { ...local, branchId: "   " }).allowed,
    false,
  );
});

test("missing server principal is rejected", () => {
  assert.equal(verify(true, null, local).allowed, false);
});

test("different user and branch cannot borrow authorization", () => {
  assert.equal(
    verify(
      true,
      { ...principal, userId: "other-user", branchId: "other-branch" },
      local,
    ).allowed,
    false,
  );
});

test("expired mode must never become ACTIVE", () => {
  const result = verify(true, principal, {
    ...local,
    accessMode: "REGISTERED_EXPIRED_READ_ONLY",
  });
  assert.equal(result.allowed, true);
  assert.equal(result.operationalMode, "REGISTERED_EXPIRED_READ_ONLY");
});