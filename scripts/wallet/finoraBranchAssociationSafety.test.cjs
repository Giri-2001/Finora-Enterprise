"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

function canAssociate(local, server, authorization) {
  if (!local || !server || !authorization) return false;

  if (local.role !== "OWNER" || server.role !== "OWNER") {
    return false;
  }

  if (local.dataContext !== "REAL") return false;

  if (authorization.status !== "ACTIVE") return false;

  if (authorization.verified !== true) return false;

  if (authorization.localBranchId !== local.branchId) {
    return false;
  }

  if (authorization.serverBranchId !== server.branchId) {
    return false;
  }

  if (authorization.localOwnerId !== local.ownerId) {
    return false;
  }

  if (authorization.serverOwnerId !== server.ownerId) {
    return false;
  }

  if (authorization.serverUserId !== server.userId) {
    return false;
  }

  return true;
}

const local = Object.freeze({
  role: "OWNER",
  dataContext: "REAL",
  userId: "LOCAL-USER",
  ownerId: "LOCAL-OWNER",
  branchId: "LOCAL-BRANCH",
});

const server = Object.freeze({
  role: "OWNER",
  userId: "SERVER-USER",
  ownerId: "SERVER-OWNER",
  branchId: "SERVER-BRANCH",
});

const authorization = Object.freeze({
  status: "ACTIVE",
  verified: true,
  localOwnerId: "LOCAL-OWNER",
  localBranchId: "LOCAL-BRANCH",
  serverOwnerId: "SERVER-OWNER",
  serverUserId: "SERVER-USER",
  serverBranchId: "SERVER-BRANCH",
});

test("Explicitly associated differing IDs may match", () => {
  assert.equal(canAssociate(local, server, authorization), true);
});

test("No association denies access", () => {
  assert.equal(canAssociate(local, server, null), false);
});

test("Wrong server branch denies access", () => {
  assert.equal(
    canAssociate(local, server, {
      ...authorization,
      serverBranchId: "ANOTHER-BRANCH",
    }),
    false,
  );
});

test("Wrong owner denies access", () => {
  assert.equal(
    canAssociate(local, server, {
      ...authorization,
      serverOwnerId: "ANOTHER-OWNER",
    }),
    false,
  );
});

test("Revoked association denies access", () => {
  assert.equal(
    canAssociate(local, server, {
      ...authorization,
      status: "REVOKED",
    }),
    false,
  );
});

test("Unverified association denies access", () => {
  assert.equal(
    canAssociate(local, server, {
      ...authorization,
      verified: false,
    }),
    false,
  );
});

test("Non-owner login denies Wallet association", () => {
  assert.equal(
    canAssociate({ ...local, role: "COLLECTOR" }, server, authorization),
    false,
  );
});