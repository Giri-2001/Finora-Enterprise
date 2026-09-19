import {
  canonicalizeFinoraControlCenterValue,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  createFinoraBranchCertificationFingerprint,
  createFinoraBranchCertificationKeyId,
  generateFinoraBranchCertificationKeyMaterial,
  assertFinoraBranchCertificationKeyMaterial,
  assertFinoraBranchCertificationPublicKey,
  signFinoraBranchCertificationCanonicalValue,
  toFinoraBranchCertificationPublicKey,
  verifyFinoraBranchCertificationCanonicalValue,
} from "./finoraBranchCertificationCrypto.js";

function assert(
  condition:
    unknown,

  message:
    string,
): asserts condition {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function expectThrow(
  operation:
    () => void,

  label:
    string,
): void {

  let threw =
    false;

  try {
    operation();
  } catch {
    threw =
      true;
  }

  assert(
    threw,
    `${label} did not fail closed.`,
  );
}

function main():
  void {

  const createdAt =
    new Date(
      "2026-09-16T00:00:00.000Z",
    );

  const material =
    generateFinoraBranchCertificationKeyMaterial(
      createdAt,
    );

  assertFinoraBranchCertificationKeyMaterial(
    material,
  );

  assert(
    material.createdAt ===
      createdAt.toISOString(),
    "Generated Branch Certification timestamp changed.",
  );

  console.log(
    "PASS: Branch Certification P-256 key material generated and validated",
  );

  const publicKey =
    toFinoraBranchCertificationPublicKey(
      material,
    );

  assertFinoraBranchCertificationPublicKey(
    publicKey,
  );

  assert(
    !(
      "privateKey" in
      publicKey
    ) &&
    !(
      "privateKeyFormat" in
      publicKey
    ),
    "Branch Certification public projection leaked private-key material.",
  );

  assert(
    createFinoraBranchCertificationFingerprint(
      publicKey.publicKey,
    ) ===
      publicKey.publicKeyFingerprint,
    "Branch Certification public-key fingerprint is not deterministic.",
  );

  assert(
    createFinoraBranchCertificationKeyId(
      publicKey.publicKeyFingerprint,
    ) ===
      publicKey.keyId,
    "Branch Certification keyId is not canonical.",
  );

  console.log(
    "PASS: Branch Certification public projection contains no private material",
  );

  const canonicalPayload =
    canonicalizeFinoraControlCenterValue({
      purpose:
        "FINORA_BRANCH_CERTIFICATION_CRYPTO_SELFTEST",

      branchScope: {
        ownerId:
          "OWNER-BRANCH-CERT-SELFTEST",

        businessId:
          "BUSINESS-BRANCH-CERT-SELFTEST",

        branchId:
          "BRANCH-BRANCH-CERT-SELFTEST",
      },

      deviceFingerprint:
        "ab".repeat(
          32,
        ),

      issuedAt:
        "2026-09-16T00:05:00.000Z",

      schemaVersion:
        1,
    });

  const signature =
    signFinoraBranchCertificationCanonicalValue(
      canonicalPayload,
      material,
    );

  assert(
    Buffer.from(
      signature.value,
      "base64",
    ).byteLength ===
      64,
    "Branch Certification signature is not exactly 64 IEEE-P1363 bytes.",
  );

  assert(
    verifyFinoraBranchCertificationCanonicalValue(
      canonicalPayload,
      signature,
      publicKey,
    ),
    "Valid Branch Certification signature did not verify.",
  );

  console.log(
    "PASS: Branch Certification canonical value signs and verifies",
  );

  assert(
    !verifyFinoraBranchCertificationCanonicalValue(
      canonicalPayload +
        " ",
      signature,
      publicKey,
    ),
    "Tampered canonical Branch Certification value verified.",
  );

  console.log(
    "PASS: tampered Branch Certification payload is rejected",
  );

  const otherMaterial =
    generateFinoraBranchCertificationKeyMaterial(
      new Date(
        "2026-09-16T00:10:00.000Z",
      ),
    );

  const otherPublicKey =
    toFinoraBranchCertificationPublicKey(
      otherMaterial,
    );

  assert(
    !verifyFinoraBranchCertificationCanonicalValue(
      canonicalPayload,
      signature,
      otherPublicKey,
    ),
    "Branch Certification signature verified under the wrong authority key.",
  );

  console.log(
    "PASS: wrong Branch Certification authority key is rejected",
  );

  const mismatchedMaterial = {
    ...material,

    privateKey:
      otherMaterial.privateKey,
  };

  expectThrow(
    () =>
      assertFinoraBranchCertificationKeyMaterial(
        mismatchedMaterial,
      ),
    "Mismatched Branch Certification public/private keypair",
  );

  console.log(
    "PASS: mismatched Branch Certification public/private keypair is rejected",
  );

  const fingerprintTamperedPublicKey = {
    ...publicKey,

    publicKeyFingerprint:
      "0".repeat(
        64,
      ),
  };

  expectThrow(
    () =>
      assertFinoraBranchCertificationPublicKey(
        fingerprintTamperedPublicKey,
      ),
    "Tampered Branch Certification fingerprint",
  );

  console.log(
    "PASS: tampered Branch Certification public-key fingerprint is rejected",
  );

  const keyIdTamperedPublicKey = {
    ...publicKey,

    keyId:
      "FINORA-BRANCH-CERT-INVALID",
  };

  expectThrow(
    () =>
      assertFinoraBranchCertificationPublicKey(
        keyIdTamperedPublicKey,
      ),
    "Non-canonical Branch Certification keyId",
  );

  console.log(
    "PASS: non-canonical Branch Certification keyId is rejected",
  );

  const malformedSignature = {
    ...signature,

    value:
      Buffer.alloc(
        63,
        1,
      ).toString(
        "base64",
      ),
  };

  assert(
    !verifyFinoraBranchCertificationCanonicalValue(
      canonicalPayload,
      malformedSignature,
      publicKey,
    ),
    "Malformed Branch Certification signature length was accepted.",
  );

  console.log(
    "PASS: malformed Branch Certification signature length is rejected",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: PHASE 5.6L-3D1 BRANCH CERTIFICATION CRYPTO EXECUTABLE PROOF",
  );

  console.log(
    "============================================================",
  );
}

try {

  main();

  console.log(
    "PASS: Branch Certification Crypto self-test process exiting with code 0",
  );

} catch (
  error
) {

  console.error(
    error instanceof Error
      ? error.stack ??
          error.message
      : String(
          error,
        ),
  );

  process.exitCode =
    1;
}