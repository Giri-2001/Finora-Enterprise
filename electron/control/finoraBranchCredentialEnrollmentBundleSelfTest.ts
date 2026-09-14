import {
  FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FORMAT,
  validateFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundle.js";

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

function fakeSignature() {
  return {
    algorithm:
      "ECDSA_P256_SHA256",

    encoding:
      "IEEE_P1363",

    canonicalization:
      "FINORA_CANONICAL_JSON_V1",

    signingKeyId:
      "KEY-I4B",

    value:
      "AA==",
  };
}

function fakeDigest() {
  return {
    algorithm:
      "SHA-256",

    value:
      "0".repeat(
        64,
      ),
  };
}

function buildValidBundle() {
  const ownerId =
    "OWNER-I4B";

  const businessId =
    "BUSINESS-I4B";

  const branchId =
    "BRANCH-I4B";

  const authorizationId =
    "FINORA-CREDENTIAL-ENROLLMENT-I4B-000001";

  const credentialEnrollment = {
    authorizationId,

    userId:
      "USER-I4B",

    username:
      "branch-admin",

    fullName:
      "Display Name",

    role:
      "ADMIN",

    ownerId,

    businessId,

    branchId,

    storageMode:
      "USB",

    dataContext:
      "REAL",

    method:
      "SET_PASSWORD_ON_RECIPIENT",

    oneTime:
      true,

    schemaVersion:
      1,
  };

  const commonIssuer = {
    type:
      "FINORA_CONTROL_CENTER",

    issuerId:
      "ISSUER-I4B",

    signingKeyId:
      "KEY-I4B",
  };

  return {
    bundleFormat:
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FORMAT,

    branchAccessPackage: {
      packageId:
        "PACKAGE-I4B-BRANCH-ACCESS",

      purpose:
        "BRANCH_ACCESS",

      issuer:
        commonIssuer,

      target: {
        ownerId,

        businessId,

        branchId,

        installationId:
          "INSTALLATION-I4B",

        bindingKeyId:
          "FINORA-BINDING-00000000000000000000000000000000",

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          "0".repeat(
            64,
          ),
      },

      issuedAt:
        "2026-09-12T12:00:00.000Z",

      sequence:
        1,

      payloadVersion:
        1,

      payload: {
        action:
          "AUTHORIZE_CREDENTIAL",

        credentialEnrollment,

        issuedAt:
          "2026-09-12T12:00:00.000Z",

        schemaVersion:
          1,
      },

      payloadDigest:
        fakeDigest(),

      signature:
        fakeSignature(),

      schemaVersion:
        1,
    },

    branchPortabilityAuthorityPackage: {
      packageId:
        "PACKAGE-I4B-PORTABILITY",

      purpose:
        "BRANCH_PORTABILITY_AUTHORITY",

      issuer:
        commonIssuer,

      target: {
        ownerId,

        businessId,

        branchId,
      },

      issuedAt:
        "2026-09-12T12:00:01.000Z",

      sequence:
        1,

      payloadVersion:
        1,

      payload: {
        sourceAuthorizationId:
          authorizationId,

        userId:
          credentialEnrollment.userId,

        username:
          credentialEnrollment.username,

        role:
          credentialEnrollment.role,

        ownerId,

        businessId,

        branchId,

        storageMode:
          credentialEnrollment.storageMode,

        dataContext:
          credentialEnrollment.dataContext,

        sourceAuthorizationMethod:
          credentialEnrollment.method,

        schemaVersion:
          1,
      },

      payloadDigest:
        fakeDigest(),

      signature:
        fakeSignature(),

      schemaVersion:
        1,
    },

    schemaVersion:
      1,
  };
}

function expectRejected(
  label:
    string,

  value:
    unknown,
): void {

  const result =
    validateFinoraBranchCredentialEnrollmentBundle(
      value,
    );

  assertTrue(
    !result.valid,
    `${label} unexpectedly passed.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

const valid =
  buildValidBundle();

const validResult =
  validateFinoraBranchCredentialEnrollmentBundle(
    valid,
  );

assertTrue(
  validResult.valid,
  validResult.valid
    ? ""
    : validResult.error,
);

assertTrue(
  validResult.sourceAuthorizationId ===
    "FINORA-CREDENTIAL-ENROLLMENT-I4B-000001",
  "Validated lineage identifier is incorrect.",
);

console.log(
  "PASS: valid two-child Credential Enrollment composition accepted",
);

expectRejected(
  "unsigned outer wrapper cannot carry extra trust fields",
  {
    ...valid,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER",
    },
  },
);

expectRejected(
  "authorizationId/sourceAuthorizationId mismatch rejected",
  {
    ...valid,

    branchPortabilityAuthorityPackage: {
      ...valid.branchPortabilityAuthorityPackage,

      payload: {
        ...valid.branchPortabilityAuthorityPackage.payload,

        sourceAuthorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I4B-WRONG",
      },
    },
  },
);

expectRejected(
  "installation-shaped portability target rejected",
  {
    ...valid,

    branchPortabilityAuthorityPackage: {
      ...valid.branchPortabilityAuthorityPackage,

      target: {
        ...valid.branchPortabilityAuthorityPackage.target,

        installationId:
          "MUST-NOT-BE-HERE",
      },
    },
  },
);

expectRejected(
  "branch-scope mismatch rejected",
  {
    ...valid,

    branchPortabilityAuthorityPackage: {
      ...valid.branchPortabilityAuthorityPackage,

      target: {
        ...valid.branchPortabilityAuthorityPackage.target,

        branchId:
          "WRONG-BRANCH",
      },
    },
  },
);

expectRejected(
  "non-AUTHORIZE_CREDENTIAL BRANCH_ACCESS child rejected",
  {
    ...valid,

    branchAccessPackage: {
      ...valid.branchAccessPackage,

      payload: {
        ...valid.branchAccessPackage.payload,

        action:
          "ISSUE",
      },
    },
  },
);

expectRejected(
  "different Control Center issuer identity rejected",
  {
    ...valid,

    branchPortabilityAuthorityPackage: {
      ...valid.branchPortabilityAuthorityPackage,

      issuer: {
        ...valid.branchPortabilityAuthorityPackage.issuer,

        issuerId:
          "DIFFERENT-ISSUER",
      },
    },
  },
);

console.log(
  "",
);

console.log(
  "PASS: D4E4I4B CREDENTIAL ENROLLMENT COMPOSITION CONTRACT EXECUTABLE PROOF",
);