import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

import {
  seedFinoraPortableFreshDeviceRuntimeAuthority,
} from "./finoraPortableFreshDeviceRuntimeAuthoritySeedCoordinator.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthoritySeedControlState,
  FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential,
  FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies,
  FinoraPortableFreshDeviceRuntimeAuthoritySeedSession,
} from "./finoraPortableFreshDeviceRuntimeAuthoritySeedCoordinator.js";

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

function createKeyMaterial(
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
    lastError instanceof Error
      ? lastError
      : new Error(
          "Unable to generate Branch Certification test key material.",
        )
  );
}

async function main():
  Promise<void> {
  const keyMaterial =
    createKeyMaterial(
      "2026-09-20T00:00:00.000Z",
    );

  const fakeEnvelope =
    {} as
      FinoraPortableBranchAuthEnvelopeV1;

  const session:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedSession = {
      sessionId:
        "SESSION-001",

      authGeneration:
        1,

      userId:
        "USER-001",

      username:
        "giriadmin",

      fullName:
        "Giri Admin",

      role:
        "ADMIN",

      ownerId:
        "OWNER-001",

      businessId:
        "BUSINESS-001",

      branchId:
        "BRANCH-001",

      storageMode:
        "USB",

      dataContext:
        "REAL",

      accessMode:
        "ACTIVE",
    };

  const credential:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential = {
      credentialId:
        "CREDENTIAL-001",

      sourceAuthorizationId:
        "SOURCE-AUTH-001",

      authGeneration:
        1,

      userId:
        "USER-001",

      username:
        "giriadmin",

      canonicalUsername:
        "giriadmin",

      fullName:
        "Giri Admin",

      role:
        "ADMIN",

      ownerId:
        "OWNER-001",

      businessId:
        "BUSINESS-001",

      branchId:
        "BRANCH-001",

      storageMode:
        "USB",

      dataContext:
        "REAL",

      status:
        "ACTIVE",
    };

  const controlState:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedControlState = {
      activationId:
        "ACTIVATION-001",

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

      branchAccessGrantId:
        "GRANT-001",

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

      storageEntitlementId:
        "ENTITLEMENT-001",

      storageEntitlementStatus:
        "ACTIVE",

      storageEntitlementActivatedAt:
        "2026-01-01T00:00:00.000Z",

      storageEntitlementCreatedAt:
        "2026-01-01T00:00:00.000Z",

      storageEntitlementUpdatedAt:
        "2026-09-20T00:00:00.000Z",
    };

  const portablePayload =
    {
      sourceAuthorizationId:
        "SOURCE-AUTH-001",

      authGeneration:
        1,

      userId:
        "USER-001",

      username:
        "giriadmin",

      canonicalUsername:
        "giriadmin",

      fullName:
        "Giri Admin",

      role:
        "ADMIN",

      ownerId:
        "OWNER-001",

      businessId:
        "BUSINESS-001",

      branchId:
        "BRANCH-001",

      storageMode:
        "USB",

      dataContext:
        "REAL",

      branchCertificationKeyMaterial:
        keyMaterial,
    } as unknown as
      FinoraPortableBranchAuthPayloadV1;

  let persistedMode:
    string |
    undefined;

  let persistedPackage:
    Parameters<
      typeof createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1
    >[0] |
    undefined;

  let persistedSignedPackage:
    ReturnType<
      typeof createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1
    > |
    undefined;

  const dependencies:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies = {
      resolveSession:
        async (
          sessionId,
        ) =>
          sessionId ===
            session.sessionId
            ? session
            : null,

      resolveCredential:
        async () =>
          credential,

      resolveControlState:
        async () =>
          controlState,

      readPortableAuth:
        async (
          storageMode,
        ) =>
          storageMode ===
            "USB"
            ? fakeEnvelope
            : null,

      decryptPortableAuth:
        async (
          _envelope,
          password,
          securityCode,
          expectedScope,
        ) => {
          if (
            password !==
              "CorrectPassword123!" ||
            securityCode !==
              "SecurityCode123!" ||
            expectedScope.ownerId !==
              session.ownerId ||
            expectedScope.businessId !==
              session.businessId ||
            expectedScope.branchId !==
              session.branchId
          ) {
            throw new Error(
              "Authentication failed.",
            );
          }

          return portablePayload;
        },

      createPortableAuthFingerprint:
        () =>
          "b".repeat(
            64,
          ),

      createSignedPackage:
        (
          payload,
          material,
        ) => {
          persistedPackage =
            payload;

          return createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
            payload,
            material,
          );
        },

      persistRuntimeAuthority:
        async (
          storageMode,
          packageValue,
        ) => {
          persistedMode =
            storageMode;

          persistedSignedPackage =
            packageValue;
        },

      now:
        () =>
          new Date(
            "2026-09-20T01:00:00.000Z",
          ),

      createAuthorityId:
        () =>
          "FINORA-FRESH-RUNTIME-AUTHORITY-TEST-001",
    };

  const success =
    await seedFinoraPortableFreshDeviceRuntimeAuthority(
      {
        sessionId:
          "SESSION-001",

        password:
          "CorrectPassword123!",

        securityCode:
          "SecurityCode123!",
      },
      dependencies,
    );

  assert(
    success.success,
    "Valid trusted-device runtime-authority seed was rejected.",
  );

  assert(
    persistedMode ===
      "USB",
    "Runtime authority was not persisted to authoritative USB storage mode.",
  );

  assert(
    persistedPackage !==
      undefined &&
    persistedPackage.credentialId ===
      credential.credentialId &&
    persistedPackage.activationId ===
      controlState.activationId &&
    persistedPackage.branchAccessGrantId ===
      controlState.branchAccessGrantId &&
    persistedPackage.storageEntitlementId ===
      controlState.storageEntitlementId &&
    persistedPackage.portableAuthFingerprint ===
      "b".repeat(
        64,
      ),
    "Signed runtime authority did not preserve exact authoritative identities.",
  );

  assert(
    persistedSignedPackage !==
      undefined &&
    verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
      persistedSignedPackage,
      keyMaterial,
    ),
    "Persisted runtime authority signature did not verify.",
  );

  console.log(
    "PASS: trusted session seeds one exact Branch-Certification signed runtime authority",
  );

  console.log(
    "PASS: seed persists only to the authenticated provisioned storage mode",
  );

  const wrongPassword =
    await seedFinoraPortableFreshDeviceRuntimeAuthority(
      {
        sessionId:
          "SESSION-001",

        password:
          "WrongPassword",

        securityCode:
          "SecurityCode123!",
      },
      dependencies,
    );

  assert(
    !wrongPassword.success &&
    wrongPassword.errorCode ===
      "PORTABLE_AUTH_AUTHENTICATION_FAILED",
    "Wrong Password did not fail closed.",
  );

  console.log(
    "PASS: wrong Password cannot seed portable runtime authority",
  );

  const mismatchedDependencies:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies = {
      ...dependencies,

      decryptPortableAuth:
        async () =>
          ({
            ...portablePayload,

            branchId:
              "OTHER-BRANCH",
          } as unknown as
            FinoraPortableBranchAuthPayloadV1),
    };

  const mismatch =
    await seedFinoraPortableFreshDeviceRuntimeAuthority(
      {
        sessionId:
          "SESSION-001",

        password:
          "CorrectPassword123!",

        securityCode:
          "SecurityCode123!",
      },
      mismatchedDependencies,
    );

  assert(
    !mismatch.success &&
    mismatch.errorCode ===
      "PORTABLE_AUTH_MISMATCH",
    "Portable Auth identity mismatch was accepted.",
  );

  console.log(
    "PASS: mismatched Portable Auth cannot seed runtime authority",
  );

  const missingCertificationDependencies:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies = {
      ...dependencies,

      decryptPortableAuth:
        async () =>
          ({
            ...portablePayload,

            branchCertificationKeyMaterial:
              undefined,
          } as unknown as
            FinoraPortableBranchAuthPayloadV1),
    };

  const missingCertification =
    await seedFinoraPortableFreshDeviceRuntimeAuthority(
      {
        sessionId:
          "SESSION-001",

        password:
          "CorrectPassword123!",

        securityCode:
          "SecurityCode123!",
      },
      missingCertificationDependencies,
    );

  assert(
    !missingCertification.success &&
    missingCertification.errorCode ===
      "CERTIFICATION_AUTHORITY_MISSING",
    "Missing Branch Certification authority did not fail closed.",
  );

  console.log(
    "PASS: missing Branch Certification authority fails closed",
  );

  const localCredentialDependencies:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies = {
      ...dependencies,

      resolveCredential:
        async () =>
          ({
            ...credential,

            storageMode:
              "LOCAL",
          }),
    };

  const storageMismatch =
    await seedFinoraPortableFreshDeviceRuntimeAuthority(
      {
        sessionId:
          "SESSION-001",

        password:
          "CorrectPassword123!",

        securityCode:
          "SecurityCode123!",
      },
      localCredentialDependencies,
    );

  assert(
    !storageMismatch.success &&
    storageMismatch.errorCode ===
      "CREDENTIAL_STATE_MISMATCH",
    "Cross-storage credential mismatch was accepted.",
  );

  console.log(
    "PASS: cross-storage authority mismatch fails before Portable Auth access",
  );

  console.log(
    "PASS: STEP A2 TRUSTED-DEVICE RUNTIME AUTHORITY SEED COORDINATOR EXECUTABLE PROOF",
  );
}

void main().catch(
  (
    error,
  ) => {
    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);