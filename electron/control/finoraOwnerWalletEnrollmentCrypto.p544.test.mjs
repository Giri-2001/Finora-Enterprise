import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  generateFinoraOwnerWalletProofKeyV1,
  signFinoraOwnerWalletProofV1,
} from "../../dist-electron/control/finoraOwnerWalletProofCrypto.js";
import {
  buildFinoraOwnerWalletEnrollmentMessageV1 as build,
  signFinoraOwnerWalletEnrollmentV1 as signEnrollment,
} from "../../dist-electron/control/finoraOwnerWalletEnrollmentCrypto.js";

if (!process.env.FINORA_P544D_BACKEND_VERIFIER) {
  throw new Error("EXPLICIT_BACKEND_VERIFIER_PATH_REQUIRED");
}
const backend = await import(
  pathToFileURL(process.env.FINORA_P544D_BACKEND_VERIFIER).href
);

const material = generateFinoraOwnerWalletProofKeyV1();
const input = {
  challenge: "a".repeat(64),
  keyId: material.keyId,
  userId: "9880000004",
  ownerId: "9880000001",
  businessId: "9880000002",
  branchId: "9880000003",
  credentialId: "9880000008",
  authGeneration: 1,
};

function submission(signatureBase64) {
  return {
    keyId: material.keyId,
    publicKeySpkiDerBase64: material.publicKeySpkiDerBase64,
    publicKeySha256: material.publicKeySha256,
    signatureBase64,
  };
}

test("Electron enrollment message exactly matches backend message", () => {
  assert.equal(
    build(input),
    backend.buildOwnerWalletEnrollmentMessage(
      input, input.challenge, input.keyId,
    ),
  );
});

test("actual backend verifies Electron enrollment signature", () => {
  const signature = signEnrollment(input, material);
  assert.equal(
    backend.verifyOwnerWalletEnrollmentSignature(
      input, input.challenge, submission(signature),
    ), true,
  );
});

test("login signature cannot authorize enrollment", () => {
  const signature = signFinoraOwnerWalletProofV1(input, material);
  assert.equal(
    backend.verifyOwnerWalletEnrollmentSignature(
      input, input.challenge, submission(signature),
    ), false,
  );
});

test("changed branch or challenge invalidates enrollment signature", () => {
  const signature = signEnrollment(input, material);
  assert.equal(
    backend.verifyOwnerWalletEnrollmentSignature(
      { ...input, branchId: "9880000099" },
      input.challenge,
      submission(signature),
    ), false,
  );
  assert.equal(
    backend.verifyOwnerWalletEnrollmentSignature(
      input, "b".repeat(64), submission(signature),
    ), false,
  );
});

test("mismatched key material and malformed challenge cannot be signed", () => {
  const other = generateFinoraOwnerWalletProofKeyV1();

  for (const change of [
    { keyId: other.keyId },
    { publicKeySha256: "0".repeat(64) },
    { privateKeyPkcs8DerBase64: other.privateKeyPkcs8DerBase64 },
    { publicKeySpkiDerBase64: material.publicKeySpkiDerBase64 + "\n" },
  ]) {
    assert.throws(() => signEnrollment(input, { ...material, ...change }));
  }

  for (const change of [
    { challenge: input.challenge + "\n" },
    { keyId: input.keyId + "\n" },
    { branchId: "branch\ninjection" },
    { authGeneration: 0 },
  ]) {
    assert.throws(() => signEnrollment({ ...input, ...change }, material));
  }
});