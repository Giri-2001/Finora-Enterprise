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
  verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

import {
  seedFinoraPortableFreshDeviceRuntimeAuthorityFromAuthenticatedSession,
} from "./finoraPortableFreshDeviceRuntimeAuthoritySeedService.js";

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

  for (
    const args of [
      [
        createdAt,
      ],
      [
        new Date(
          createdAt,
        ),
      ],
      [],
    ] as unknown[][]
  ) {
    try {
      return generator(
        ...args,
      );
    }
    catch {
      // Try the next supported historical signature.
    }
  }

  throw new Error(
    "Unable to generate Branch Certification test key material.",
  );
}

async function main():
  Promise<void> {
  const keyMaterial =
    createKeyMaterial(
      "2026-09-20T00:00:00.000Z",
    );

  const envelope =
    {} as
      FinoraPortableBranchAuthEnvelopeV1;

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

  let portableReadMode:
    string |
    undefined;

  let persistedMode:
    string |
    undefined;

  let persistedPackage:
    Parameters<
      typeof verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1
    >[0];

  const result =
    await seedFinoraPortableFreshDeviceRuntimeAuthorityFromAuthenticatedSession(
      {
        sessionId:
          "SESSION-001",

        password:
          "CorrectPassword123!",

        securityCode:
          "SecurityCode123!",
      },

      {
        read:
          async (
            storageMode,
          ) => {
            portableReadMode =
              storageMode;

            return envelope;
          },
      },

      {
        write:
          async (
            storageMode,
            packageValue,
          ) => {
            persistedMode =
              storageMode;

            persistedPackage =
              packageValue;
          },
      },

      {
        resolveOperationalSessionContext:
          async () =>
            ({
              success:
                true,

              data: {
                session: {
                  sessionId:
                    "SESSION-001",

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

                  loginTime:
                    "2026-09-20T00:30:00.000Z",

                  lastActivity:
                    "2026-09-20T00:30:00.000Z",

                  validatedAt:
                    "2026-09-20T00:30:00.000Z",
                },

                principal: {
                  authGeneration:
                    1,

                  userId:
                    "USER-001",

                  username:
                    "giriadmin",

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
                },
              },
            }),

        readControlStore:
          async () =>
            ({
              success:
                true,

              data: {
                branchCredentials: [
                  {
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

                    verifier:
                      {} as never,

                    securityVerifier:
                      {} as never,

                    createdAt:
                      "2026-01-01T00:00:00.000Z",

                    updatedAt:
                      "2026-09-20T00:00:00.000Z",

                    schemaVersion:
                      1,
                  },
                ],
              },
            } as never),

        findBranchActivation:
          async () =>
            ({
              success:
                true,

              data: {
                activationId:
                  "ACTIVATION-001",

                ownerId:
                  "OWNER-001",

                businessId:
                  "BUSINESS-001",

                branchId:
                  "BRANCH-001",

                status:
                  "ACTIVE",

                activatedAt:
                  "2026-01-01T00:00:00.000Z",

                createdAt:
                  "2026-01-01T00:00:00.000Z",

                updatedAt:
                  "2026-01-01T00:00:00.000Z",

                schemaVersion:
                  1,
              },
            }),

        evaluateBranchAccess:
          async () =>
            ({
              success:
                true,

              data: {
                allowed:
                  true,

                state:
                  "ACTIVE",

                reason:
                  "FINORA Branch Access is active.",

                observedAt:
                  "2026-09-20T01:00:00.000Z",

                grant: {
                  grantId:
                    "GRANT-001",

                  userId:
                    "USER-001",

                  ownerId:
                    "OWNER-001",

                  businessId:
                    "BUSINESS-001",

                  branchId:
                    "BRANCH-001",

                  storageMode:
                    "USB",

                  accessType:
                    "REGISTERED",

                  administrativeStatus:
                    "ACTIVE",

                  validity: {
                    validFrom:
                      "2026-01-01T00:00:00.000Z",

                    validUntil:
                      "2027-01-01T00:00:00.000Z",
                  },

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

                  createdAt:
                    "2026-01-01T00:00:00.000Z",

                  updatedAt:
                    "2026-01-01T00:00:00.000Z",

                  schemaVersion:
                    1,
                },
              },
            }),

        findStorageEntitlement:
          async () =>
            ({
              success:
                true,

              data: {
                entitlementId:
                  "ENTITLEMENT-001",

                userId:
                  "USER-001",

                ownerId:
                  "OWNER-001",

                businessId:
                  "BUSINESS-001",

                branchId:
                  "BRANCH-001",

                installationId:
                  "HISTORICAL-INSTALLATION-001",

                bindingKeyId:
                  "FINORA-BINDING-HISTORICAL",

                fingerprintAlgorithm:
                  "SHA-256",

                publicKeyFingerprint:
                  "A".repeat(
                    64,
                  ),

                storageMode:
                  "USB",

                status:
                  "ACTIVE",

                activatedAt:
                  "2026-01-01T00:00:00.000Z",

                createdAt:
                  "2026-01-01T00:00:00.000Z",

                updatedAt:
                  "2026-01-01T00:00:00.000Z",

                schemaVersion:
                  1,
              },
            }),

        decryptPortableAuth:
          async (
            _envelope,
            password,
            securityCode,
            options,
          ) => {
            assert(
              password ===
                "CorrectPassword123!",
              "Production adapter changed Password.",
            );

            assert(
              securityCode ===
                "SecurityCode123!",
              "Production adapter changed Security Code.",
            );

            assert(
              options !==
                undefined &&
              options.expectedScope !==
                undefined &&
              options.expectedScope.ownerId ===
                "OWNER-001" &&
              options.expectedScope.businessId ===
                "BUSINESS-001" &&
              options.expectedScope.branchId ===
                "BRANCH-001",
              "Production adapter did not pass exact expected branch scope.",
            );

            return portablePayload;
          },

        createPortableAuthFingerprint:
          () =>
            "c".repeat(
              64,
            ),

        createAuthorityId:
          () =>
            "FINORA-FRESH-RUNTIME-AUTHORITY-PRODUCTION-TEST",

        now:
          () =>
            new Date(
              "2026-09-20T01:00:00.000Z",
            ),
      },
    );

  assert(
    result.success,
    "Production seed adapter rejected valid authoritative state.",
  );

  assert(
    portableReadMode ===
      "USB" &&
    persistedMode ===
      "USB",
    "Production seed adapter crossed the provisioned storage boundary.",
  );

  assert(
    persistedPackage !==
      undefined &&
    verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
      persistedPackage,
      keyMaterial,
    ),
    "Production adapter did not persist a valid Branch-Certification signed authority.",
  );

  if (
    persistedPackage ===
      undefined
  ) {
    throw new Error(
      "Persisted runtime authority package is unavailable.",
    );
  }

  assert(
    persistedPackage.payload.credentialId ===
      "CREDENTIAL-001" &&
    persistedPackage.payload.activationId ===
      "ACTIVATION-001" &&
    persistedPackage.payload.branchAccessGrantId ===
      "GRANT-001" &&
    persistedPackage.payload.storageEntitlementId ===
      "ENTITLEMENT-001",
    "Production adapter lost authoritative record identities.",
  );

  console.log(
    "PASS: production adapter resolves exact session + credential + activation + access + entitlement authority",
  );

  console.log(
    "PASS: production adapter preserves provisioned USB storage boundary",
  );

  console.log(
    "PASS: production adapter decrypts Portable Auth only with exact branch scope",
  );

  console.log(
    "PASS: production adapter persists one valid Branch-Certification signed runtime authority",
  );

  console.log(
    "PASS: STEP A2 PRODUCTION RUNTIME AUTHORITY SEED ADAPTER EXECUTABLE PROOF",
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