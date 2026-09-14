import {
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

function assertTrue(
  condition:
    unknown,

  message:
    string,
): asserts condition {

  if (!condition) {
    throw new Error(
      `FAIL: ${message}`,
    );
  }
}

const sourceAuthorizationId =
  "FINORA-CREDENTIAL-ENROLLMENT-I5C-000001";

const verifiedControlSigner = {
  issuerId:
    "ISSUER-I5C",

  signingKeyId:
    "KEY-I5C",

  algorithm:
    "ECDSA_P256_SHA256",

  format:
    "SPKI_DER_BASE64",

  publicKey:
    "PUBLIC-KEY-I5C",

  status:
    "ACTIVE",

  validFrom:
    "2026-09-01T00:00:00.000Z",
};

const signedPortabilityAuthorityPackage = {
  packageId:
    "FINORA-BRANCH-PORTABILITY-I5C",

  purpose:
    "BRANCH_PORTABILITY_AUTHORITY",

  issuer: {
    type:
      "FINORA_CONTROL_CENTER",

    issuerId:
      verifiedControlSigner.issuerId,

    signingKeyId:
      verifiedControlSigner.signingKeyId,
  },

  target: {
    ownerId:
      "OWNER-I5C",

    businessId:
      "BUSINESS-I5C",

    branchId:
      "BRANCH-I5C",
  },

  issuedAt:
    "2026-09-12T12:00:00.000Z",

  sequence:
    1,

  payloadVersion:
    1,

  payload: {
    sourceAuthorizationId,

    userId:
      "USER-I5C",

    username:
      "branch-admin",

    role:
      "ADMIN",

    ownerId:
      "OWNER-I5C",

    businessId:
      "BUSINESS-I5C",

    branchId:
      "BRANCH-I5C",

    storageMode:
      "USB",

    dataContext:
      "REAL",

    sourceAuthorizationMethod:
      "SET_PASSWORD_ON_RECIPIENT",

    schemaVersion:
      1,
  },

  payloadDigest: {
    algorithm:
      "SHA-256",

    value:
      "0".repeat(
        64,
      ),
  },

  signature: {
    algorithm:
      "ECDSA_P256_SHA256",

    encoding:
      "IEEE_P1363",

    signingKeyId:
      verifiedControlSigner.signingKeyId,

    value:
      "AA==",
  },

  schemaVersion:
    1,
};

const valid = {
  sourceAuthorizationId,

  signedPortabilityAuthorityPackage,

  verifiedControlSigner,

  verifiedAt:
    "2026-09-12T12:01:00.000Z",

  schemaVersion:
    1,
};

assertTrue(
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
    valid,
  ),
  "Valid portability provenance was rejected.",
);

console.log(
  "PASS: valid portability provenance accepted",
);

assertTrue(
  !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1({
    ...valid,

    sourceAuthorizationId:
      "FINORA-CREDENTIAL-ENROLLMENT-WRONG",
  }),
  "Mismatched source authorization lineage was accepted.",
);

console.log(
  "PASS: mismatched sourceAuthorizationId rejected",
);

assertTrue(
  !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1({
    ...valid,

    verifiedControlSigner: {
      ...verifiedControlSigner,

      signingKeyId:
        "DIFFERENT-KEY",
    },
  }),
  "Mismatched signer identity was accepted.",
);

console.log(
  "PASS: mismatched verified signer identity rejected",
);

assertTrue(
  !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1({
    ...valid,

    signedPortabilityAuthorityPackage: {
      ...signedPortabilityAuthorityPackage,

      target: {
        ...signedPortabilityAuthorityPackage.target,

        installationId:
          "MUST-NOT-BE-HERE",
      },
    },
  }),
  "Installation-shaped portability target was accepted.",
);

console.log(
  "PASS: installation-shaped portability target rejected",
);

assertTrue(
  !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1({
    ...valid,

    signedPortabilityAuthorityPackage: {
      ...signedPortabilityAuthorityPackage,

      payload: {
        ...signedPortabilityAuthorityPackage.payload,

        ownerId:
          "WRONG-OWNER",
      },
    },
  }),
  "Payload/target branch mismatch was accepted.",
);

console.log(
  "PASS: portability payload/target mismatch rejected",
);

assertTrue(
  !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1({
    ...valid,

    extraAuthority:
      true,
  }),
  "Extra provenance authority field was accepted.",
);

console.log(
  "PASS: extra provenance field rejected",
);

console.log(
  "PASS: D4E4I5C PORTABILITY PROVENANCE CONTRACT EXECUTABLE PROOF",
);