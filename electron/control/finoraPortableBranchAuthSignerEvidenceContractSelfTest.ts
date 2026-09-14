/* ============================================================
   FINORA ENTERPRISE OS
   PORTABLE SIGNER-EVIDENCE CONTRACT SELF-TEST
============================================================ */

import {
  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";

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

function expectReject(
  label:
    string,
  value:
    unknown,
): void {
  let rejected =
    false;

  try {
    validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
      value,
    );
  }
  catch {
    rejected =
      true;
  }

  assert(
    rejected,
    `${label} must fail closed.`,
  );
}

function main():
  void {
  const evidence = {
    authorizationId:
      "FINORA-CREDENTIAL-AUTH-TEST-1",

    packageId:
      "FINORA-CONTROL-PACKAGE-TEST-1",

    issuerId:
      "FINORA-CONTROL-CENTER-TEST",

    sequence:
      1,

    verifiedControlSigner: {
      issuerId:
        "FINORA-CONTROL-CENTER-TEST",

      signingKeyId:
        "FINORA-SIGNING-KEY-TEST",

      algorithm:
        "ECDSA_P256_SHA256",

      format:
        "SPKI_DER_BASE64",

      publicKey:
        "PUBLIC-KEY-EVIDENCE-TEST",

      status:
        "ACTIVE",

      validFrom:
        "2026-01-01T00:00:00.000Z",
    },

    verifiedAt:
      "2026-01-02T00:00:00.000Z",

    schemaVersion:
      1,
  } as const;

  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
    evidence,
  );

  console.log(
    "PASS: valid portable signer evidence accepted",
  );

  expectReject(
    "wrong signer issuer",
    {
      ...evidence,

      verifiedControlSigner: {
        ...evidence.verifiedControlSigner,

        issuerId:
          "OTHER-ISSUER",
      },
    },
  );

  expectReject(
    "revoked signer",
    {
      ...evidence,

      verifiedControlSigner: {
        ...evidence.verifiedControlSigner,

        status:
          "REVOKED",
      },
    },
  );

  expectReject(
    "non-positive sequence",
    {
      ...evidence,

      sequence:
        0,
    },
  );

  expectReject(
    "extra field",
    {
      ...evidence,

      unexpected:
        true,
    },
  );

  expectReject(
    "invalid validity order",
    {
      ...evidence,

      verifiedControlSigner: {
        ...evidence.verifiedControlSigner,

        validFrom:
          "2026-02-01T00:00:00.000Z",

        validUntil:
          "2026-01-01T00:00:00.000Z",
      },
    },
  );

  console.log(
    "PASS: signer/evidence issuer mismatch rejected",
  );

  console.log(
    "PASS: REVOKED signer evidence rejected",
  );

  console.log(
    "PASS: malformed sequence / extra keys / invalid validity rejected",
  );

  console.log(
    "PASS: D4E4I1B3B1 PORTABLE SIGNER-EVIDENCE CONTRACT FOUNDATION",
  );
}

try {
  main();
}
catch (
  error
) {
  console.error(
    "FAIL: D4E4I1B3B1 PORTABLE SIGNER-EVIDENCE CONTRACT FOUNDATION",
    error,
  );

  process.exitCode =
    1;
}