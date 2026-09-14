/* ============================================================
   FINORA ENTERPRISE OS
   PORTABLE BRANCH AUTH TEST-ONLY SIGNER EVIDENCE
============================================================ */

import type {
  FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";

export function createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
  authorizationId:
    string,
): FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 {
  return {
    authorizationId,

    packageId:
      `FINORA-CONTROL-PACKAGE-SELFTEST-${authorizationId}`,

    issuerId:
      "FINORA-CONTROL-CENTER-SELFTEST",

    sequence:
      1,

    verifiedControlSigner: {
      issuerId:
        "FINORA-CONTROL-CENTER-SELFTEST",

      signingKeyId:
        "FINORA-CONTROL-SIGNING-KEY-SELFTEST",

      algorithm:
        "ECDSA_P256_SHA256",

      format:
        "SPKI_DER_BASE64",

      publicKey:
        "FINORA-SELFTEST-PUBLIC-KEY-EVIDENCE",

      status:
        "ACTIVE",

      validFrom:
        "2026-01-01T00:00:00.000Z",
    },

    verifiedAt:
      "2026-01-02T00:00:00.000Z",

    schemaVersion:
      1,
  };
}