import test from "node:test";
import assert from "node:assert/strict";

import {
  generateFinoraOwnerWalletProofKeyV1,
  buildFinoraOwnerWalletProofMessageV1,
  signFinoraOwnerWalletProofV1,
  verifyFinoraOwnerWalletProofV1,
} from "./finoraOwnerWalletProofCrypto.ts";

function challengeFor(keyId) {
  return {
    challenge: "a".repeat(64),
    keyId,
    userId: "USER0001",
    ownerId: "OWNER0001",
    businessId: "BIZ0001",
    branchId: "BRANCH0001",
    credentialId: "CRED0001",
    authGeneration: 1,
  };
}

test("generates distinct dedicated P256 keys with UUIDs", () => {
  const a = generateFinoraOwnerWalletProofKeyV1();
  const b = generateFinoraOwnerWalletProofKeyV1();

  assert.match(a.keyId, /^[0-9a-f-]{36}$/);
  assert.notEqual(a.keyId, b.keyId);
  assert.notEqual(a.publicKeySha256, b.publicKeySha256);
});

test("signs backend-compatible DER proof", () => {
  const key = generateFinoraOwnerWalletProofKeyV1();
  const input = challengeFor(key.keyId);

  const signature = signFinoraOwnerWalletProofV1(
    input,
    key,
  );

  assert.equal(
    verifyFinoraOwnerWalletProofV1(
      input,
      signature,
      key,
    ),
    true,
  );

  assert.equal(
    verifyFinoraOwnerWalletProofV1(
      { ...input, branchId: "OTHERBRANCH" },
      signature,
      key,
    ),
    false,
  );
});

test("wrong key is rejected", () => {
  const a = generateFinoraOwnerWalletProofKeyV1();
  const b = generateFinoraOwnerWalletProofKeyV1();

  const input = challengeFor(a.keyId);
  const signature = signFinoraOwnerWalletProofV1(
    input,
    a,
  );

  assert.equal(
    verifyFinoraOwnerWalletProofV1(
      input,
      signature,
      b,
    ),
    false,
  );
});

test("rejects changed fingerprint", () => {
  const key = generateFinoraOwnerWalletProofKeyV1();

  assert.throws(
    () => signFinoraOwnerWalletProofV1(
      challengeFor(key.keyId),
      { ...key, publicKeySha256: "0".repeat(64) },
    ),
    /fingerprint mismatch/,
  );
});

test("canonical message has wallet-specific domain", () => {
  const key = generateFinoraOwnerWalletProofKeyV1();
  const msg = buildFinoraOwnerWalletProofMessageV1(
    challengeFor(key.keyId),
  );

  assert.ok(
    msg.startsWith("FINORA-OWNER-WALLET-PROOF-V1\n"),
  );

  assert.equal(msg.split("\n").length, 9);
});