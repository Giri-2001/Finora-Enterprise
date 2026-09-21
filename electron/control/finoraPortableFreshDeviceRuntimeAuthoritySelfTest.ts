import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import {
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,
  canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

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

function createTestKeyMaterial(
  createdAt:
    string,
): FinoraBranchCertificationKeyMaterialV1 {
  const generator =
    generateFinoraBranchCertificationKeyMaterial as unknown as
      (
        ...args:
          unknown[]
      ) =>
        FinoraBranchCertificationKeyMaterialV1;

  const attempts:
    unknown[][] = [
      [
        createdAt,
      ],
      [
        new Date(
          createdAt,
        ),
      ],
      [],
    ];

  let lastError:
    unknown;

  for (
    const args of attempts
  ) {
    try {
      return generator(
        ...args,
      );
    }
    catch (
      error
    ) {
      lastError =
        error;
    }
  }

  throw (
    lastError instanceof
      Error
      ? lastError
      : new Error(
          "Unable to generate Branch Certification test key material.",
        )
  );
}

const now =
  "2026-09-20T00:00:00.000Z";

const payload:
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1 = {
    schemaVersion:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,

    purpose:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,

    authorityId:
      "FINORA-FRESH-RUNTIME-AUTHORITY-TEST-001",

    sourceAuthorizationId:
      "FINORA-SOURCE-AUTH-TEST-001",

    credentialId:
      "FINORA-CREDENTIAL-TEST-001",

    activationId:
      "FINORA-ACTIVATION-TEST-001",

    branchAccessGrantId:
      "FINORA-ACCESS-GRANT-TEST-001",

    storageEntitlementId:
      "FINORA-STORAGE-ENTITLEMENT-TEST-001",

    ownerId:
      "OWNER-TEST-001",

    businessId:
      "BUSINESS-TEST-001",

    branchId:
      "BRANCH-TEST-001",

    userId:
      "USER-TEST-001",

    username:
      "giriadmin",

    canonicalUsername:
      "giriadmin",

    fullName:
      "Giri Admin",

    role:
      "ADMIN",

    storageMode:
      "USB",

    dataContext:
      "REAL",

    demoId:
      null,

    authGeneration:
      1,

    activationStatus:
      "ACTIVE",

    businessCode:
      null,

    branchCode:
      null,

    activationActivatedAt:
      "2026-01-01T00:00:00.000Z",

    activationCreatedAt:
      "2026-01-01T00:00:00.000Z",

    activationUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    branchAccessType:
      "REGISTERED",
    registrationPayment: {
      amount:
        2000,

      currency:
        "INR",

      paymentMode:
        "CASH",

      paidAt:
        "2026-01-01T00:00:00.000Z",

      refundable:
        false,
    },

    registrationCycle:
      1,

    demoRemarks:
      null,
    accessMode:
      "ACTIVE",

    accessValidFrom:
      "2026-01-01T00:00:00.000Z",

    accessValidUntil:
      "2027-01-01T00:00:00.000Z",

    branchAccessCreatedAt:
      "2026-01-01T00:00:00.000Z",

    branchAccessUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    storageEntitlementStatus:
      "ACTIVE",

    storageEntitlementActivatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementCreatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    portableAuthFingerprint:
      "a".repeat(
        64,
      ),

    issuedAt:
      now,
  };

const keyMaterial =
  createTestKeyMaterial(
    now,
  );

const secondKeyMaterial =
  createTestKeyMaterial(
    "2026-09-20T00:00:01.000Z",
  );

const canonicalOne =
  canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
    payload,
  );

const canonicalTwo =
  canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
    structuredClone(
      payload,
    ),
  );

assert(
  canonicalOne ===
    canonicalTwo,
  "Canonical runtime authority serialization is not deterministic.",
);

console.log(
  "PASS: runtime authority canonicalization is deterministic",
);

const signedPackage =
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    payload,
    keyMaterial,
  );

assert(
  verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    signedPackage,
    keyMaterial,
  ),
  "Valid Branch Certification signed runtime authority was rejected.",
);

console.log(
  "PASS: valid Branch Certification signed runtime authority verifies",
);

const serialized =
  JSON.stringify(
    signedPackage,
  );

assert(
  !serialized.includes(
    keyMaterial.privateKey,
  ),
  "Runtime authority package leaked Branch Certification private key material.",
);

console.log(
  "PASS: signed runtime authority package does not contain Branch Certification private key",
);

const storageTamper =
  structuredClone(
    signedPackage,
  );

storageTamper.payload.storageMode =
  "LOCAL";

assert(
  !verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    storageTamper,
    keyMaterial,
  ),
  "Storage-mode tamper was accepted.",
);

console.log(
  "PASS: storage-mode tamper is rejected",
);

const identityTamper =
  structuredClone(
    signedPackage,
  );

identityTamper.payload.branchId =
  "BRANCH-TAMPERED";

assert(
  !verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    identityTamper,
    keyMaterial,
  ),
  "Branch identity tamper was accepted.",
);

console.log(
  "PASS: branch identity tamper is rejected",
);

const generationTamper =
  structuredClone(
    signedPackage,
  );

generationTamper.payload.authGeneration =
  2;

assert(
  !verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    generationTamper,
    keyMaterial,
  ),
  "Credential generation tamper was accepted.",
);

console.log(
  "PASS: auth-generation tamper is rejected",
);

const accessTamper =
  structuredClone(
    signedPackage,
  );

accessTamper.payload.accessMode =
  "REGISTERED_EXPIRED_READ_ONLY";

assert(
  !verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    accessTamper,
    keyMaterial,
  ),
  "Branch access-mode tamper was accepted.",
);

console.log(
  "PASS: branch access-mode tamper is rejected",
);

assert(
  !verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    signedPackage,
    secondKeyMaterial,
  ),
  "Runtime authority verified with the wrong Branch Certification key.",
);

console.log(
  "PASS: wrong Branch Certification key is rejected",
);

const demoMismatch =
  structuredClone(
    payload,
  ) as unknown as Record<
    string,
    unknown
  >;

demoMismatch.dataContext =
  "DEMO";

let demoMismatchRejected =
  false;

try {
  canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
    demoMismatch as unknown as
      FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
  );
}
catch {
  demoMismatchRejected =
    true;
}

assert(
  demoMismatchRejected,
  "REAL/DEMO authority mismatch was accepted.",
);

console.log(
  "PASS: REAL/DEMO semantic mismatch is rejected",
);

console.log(
  "PASS: STEP A1 PORTABLE FRESH-DEVICE RUNTIME AUTHORITY EXECUTABLE PROOF",
);