import {
  canonicalizeFinoraCredentialUsername,
  findFinoraBranchActivation,
  findFinoraStorageEntitlement,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import {
  evaluateFinoraAuthoritativeBranchAccess,
} from "./finoraBranchAccessAuthorityService.js";

import {
  resolveFinoraBranchOperationalSessionContext,
} from "./finoraBranchLoginSessionAuthority.js";

import {
  createFinoraPortableBranchAuthFingerprint,
} from "./finoraBranchDeviceTrustAuthority.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityStore,
} from "./finoraPortableFreshDeviceRuntimeAuthorityStore.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityId,
  seedFinoraPortableFreshDeviceRuntimeAuthority,
} from "./finoraPortableFreshDeviceRuntimeAuthoritySeedCoordinator.js";

import {
  destroyFinoraBranchCertificationBootstrapAfterMigration,
  loadFinoraBranchCertificationBootstrap,
} from "./finoraBranchCertificationBootstrapStore.js";

import {
  backfillFinoraPortableBranchAuthLegacyCertification,
} from "./finoraControlStore.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential,
  FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies,
  FinoraPortableFreshDeviceRuntimeAuthoritySeedRequest,
  FinoraPortableFreshDeviceRuntimeAuthoritySeedResult,
  FinoraPortableFreshDeviceRuntimeAuthoritySeedSession,
} from "./finoraPortableFreshDeviceRuntimeAuthoritySeedCoordinator.js";

// ============================================================
// DEPENDENCIES
// ============================================================

export interface FinoraPortableFreshDeviceRuntimeAuthoritySeedServiceDependencies {
  resolveOperationalSessionContext:
    typeof resolveFinoraBranchOperationalSessionContext;

  readControlStore:
    typeof readFinoraControlStore;

  findBranchActivation:
    typeof findFinoraBranchActivation;

  evaluateBranchAccess:
    typeof evaluateFinoraAuthoritativeBranchAccess;

  findStorageEntitlement:
    typeof findFinoraStorageEntitlement;

  decryptPortableAuth:
    typeof decryptFinoraPortableBranchAuthEnvelopeV1;

  createPortableAuthFingerprint:
    typeof createFinoraPortableBranchAuthFingerprint;

  createSignedPackage:
    typeof createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1;

  createAuthorityId:
    typeof createFinoraPortableFreshDeviceRuntimeAuthorityId;

  now:
    () =>
      Date;
}

function createDefaultDependencies():
  FinoraPortableFreshDeviceRuntimeAuthoritySeedServiceDependencies {
  return {
    resolveOperationalSessionContext:
      resolveFinoraBranchOperationalSessionContext,

    readControlStore:
      readFinoraControlStore,

    findBranchActivation:
      findFinoraBranchActivation,

    evaluateBranchAccess:
      evaluateFinoraAuthoritativeBranchAccess,

    findStorageEntitlement:
      findFinoraStorageEntitlement,

    decryptPortableAuth:
      decryptFinoraPortableBranchAuthEnvelopeV1,

    createPortableAuthFingerprint:
      createFinoraPortableBranchAuthFingerprint,

    createSignedPackage:
      createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,

    createAuthorityId:
      createFinoraPortableFreshDeviceRuntimeAuthorityId,

    now:
      () =>
        new Date(),
  };
}

// ============================================================
// LEGACY BRANCH CERTIFICATION MIGRATION
//
// Older Portable Auth envelopes can predate Branch Certification
// private authority portability.
//
// Migration is permitted only from an already-authenticated
// operational session, using the current Password + Security Code,
// and only when the native bootstrap custody is already bound to
// the exact owner/business/branch scope.
//
// Portable Auth replacement uses compare-and-replace semantics.
// Durable non-secret provenance is committed before the native
// bootstrap private-key custody is destroyed.
//
// Retrying after a crash is safe:
// - replacement already present + bootstrap present -> finish
//   provenance/destruction;
// - bootstrap absent + migrated envelope present -> no-op.
// ============================================================

async function migrateLegacyPortableBranchCertification(
  input:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedRequest,

  portableStore:
    Pick<
      FinoraPortableBranchAuthStore,
      "read"
    >,

  production:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedServiceDependencies,
): Promise<void> {
  const sessionResult =
    await production
      .resolveOperationalSessionContext({
        sessionId:
          input.sessionId,
      });

  if (
    !sessionResult.success ||
    !sessionResult.data
  ) {
    throw new Error(
      "FINORA authenticated session is unavailable for Branch Certification migration.",
    );
  }

  const context =
    sessionResult.data;

  const expectedScope = {
    ownerId:
      context.principal.ownerId,

    businessId:
      context.principal.businessId,

    branchId:
      context.principal.branchId,
  };

  const storageMode =
    context.principal.storageMode;

  const envelope =
    await portableStore.read(
      storageMode,
    );

  if (
    envelope ===
      null
  ) {
    throw new Error(
      "FINORA Portable Branch Auth is unavailable for Branch Certification migration.",
    );
  }

  let payload =
    await production.decryptPortableAuth(
      envelope,
      input.password,
      input.securityCode,
      {
        expectedScope,
      },
    );

  const bootstrap =
    await loadFinoraBranchCertificationBootstrap();

  if (
    bootstrap ===
      undefined
  ) {
    if (
      payload.branchCertificationKeyMaterial !==
        undefined
    ) {
      return;
    }

    throw new Error(
      "FINORA Branch Certification bootstrap custody is unavailable for this legacy branch.",
    );
  }

  if (
    bootstrap.state !==
      "BRANCH_BOUND_AFTER_RESPONSE" ||
    bootstrap.branchBinding ===
      undefined
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap is not bound to an authoritative branch.",
    );
  }

  const binding =
    bootstrap.branchBinding;

  if (
    binding.ownerId !==
      expectedScope.ownerId ||
    binding.businessId !==
      expectedScope.businessId ||
    binding.branchId !==
      expectedScope.branchId
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap scope does not match the authenticated branch.",
    );
  }

  if (
    payload.sourceAuthorizationId.trim().length ===
      0 ||
    payload.authGeneration <=
      0 ||
    !Number.isSafeInteger(
      payload.authGeneration,
    )
  ) {
    throw new Error(
      "FINORA legacy Portable Branch Auth lineage is invalid.",
    );
  }

  if (
    payload.branchCertificationKeyMaterial ===
      undefined
  ) {
    const replacementStore =
      portableStore as
        Pick<
          FinoraPortableBranchAuthStore,
          "read" |
          "replaceExact"
        >;

    if (
      typeof replacementStore.replaceExact !==
        "function"
    ) {
      throw new Error(
        "FINORA Portable Branch Auth replacement authority is unavailable.",
      );
    }

    const migratedAt =
      production
        .now()
        .toISOString();

    const replacementEnvelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          payload.authStateId,

        sourceAuthorizationId:
          payload.sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          structuredClone(
            payload.sourceAuthorizationVerificationEvidence,
          ),

        branchCertificationKeyMaterial:
          structuredClone(
            bootstrap.certificationKeyMaterial,
          ),

        ownerId:
          payload.ownerId,

        businessId:
          payload.businessId,

        branchId:
          payload.branchId,

        userId:
          payload.userId,

        username:
          payload.username,

        fullName:
          payload.fullName,

        role:
          payload.role,

        dataContext:
          payload.dataContext,

        ...(
          payload.demoId ===
            undefined
            ? {}
            : {
                demoId:
                  payload.demoId,
              }
        ),

        storageMode:
          payload.storageMode,

        authGeneration:
          payload.authGeneration,

        createdAt:
          payload.createdAt,

        updatedAt:
          migratedAt,

        password:
          input.password,

        securityCode:
          input.securityCode,
      });

    await replacementStore.replaceExact(
      storageMode,
      envelope,
      replacementEnvelope,
    );

    payload =
      await production.decryptPortableAuth(
        replacementEnvelope,
        input.password,
        input.securityCode,
        {
          expectedScope,
        },
      );
  }

  const certification =
    payload.branchCertificationKeyMaterial;

  if (
    certification ===
      undefined ||
    certification.keyId !==
      bootstrap.certificationKeyMaterial.keyId ||
    certification.publicKeyFingerprint !==
      bootstrap.certificationKeyMaterial.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA migrated Branch Certification authority does not match native bootstrap custody.",
    );
  }

  const migratedAt =
    production
      .now()
      .toISOString();

  const backfillResult =
    await backfillFinoraPortableBranchAuthLegacyCertification({
      sourceAuthorizationId:
        payload.sourceAuthorizationId,

      ownerId:
        payload.ownerId,

      businessId:
        payload.businessId,

      branchId:
        payload.branchId,

      requestId:
        bootstrap.requestId,

      responseId:
        binding.responseId,

      certificationKeyId:
        certification.keyId,

      transitionedAt:
        migratedAt,
    });

  if (
    !backfillResult.success ||
    !backfillResult.data
  ) {
    throw new Error(
      backfillResult.error ??
        "Unable to persist legacy Branch Certification migration evidence.",
    );
  }

  await destroyFinoraBranchCertificationBootstrapAfterMigration({
    requestId:
      bootstrap.requestId,

    responseId:
      binding.responseId,

    ownerId:
      payload.ownerId,

    businessId:
      payload.businessId,

    branchId:
      payload.branchId,

    certificationKeyId:
      certification.keyId,

    migratedAt:
      backfillResult
        .data
        .transaction
        .certificationMigratedAt ??
      migratedAt,
  });

  const bootstrapAfter =
    await loadFinoraBranchCertificationBootstrap();

  if (
    bootstrapAfter !==
      undefined
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap custody remains after verified legacy migration.",
    );
  }
}

// ============================================================
// HELPERS
// ============================================================

function demosEqual(
  dataContext:
    "REAL" | "DEMO",

  left:
    string | undefined,

  right:
    string | undefined,
): boolean {
  if (
    dataContext ===
      "REAL"
  ) {
    return (
      left ===
        undefined &&
      right ===
        undefined
    );
  }

  return (
    typeof left ===
      "string" &&
    left.length >
      0 &&
    left ===
      right
  );
}

// ============================================================
// SERVICE
// ============================================================

export async function seedFinoraPortableFreshDeviceRuntimeAuthorityFromAuthenticatedSession(
  input:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedRequest,

  portableStore:
    Pick<
      FinoraPortableBranchAuthStore,
      "read"
    >,

  runtimeAuthorityStore:
    Pick<
      FinoraPortableFreshDeviceRuntimeAuthorityStore,
      "write"
    >,

  dependencyOverrides:
    Partial<
      FinoraPortableFreshDeviceRuntimeAuthoritySeedServiceDependencies
    > = {},
): Promise<
  FinoraPortableFreshDeviceRuntimeAuthoritySeedResult
> {
  const defaults =
    createDefaultDependencies();

  const production:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedServiceDependencies = {
      ...defaults,
      ...dependencyOverrides,
    };

  const dependencies:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies = {
      resolveSession:
        async (
          sessionId,
        ) => {
          const result =
            await production
              .resolveOperationalSessionContext({
                sessionId,
              });

          if (
            !result.success
          ) {
            return null;
          }

          const context =
            result.data;

          const session:
            FinoraPortableFreshDeviceRuntimeAuthoritySeedSession = {
              sessionId:
                context.session.sessionId,

              authGeneration:
                context.principal.authGeneration,

              userId:
                context.principal.userId,

              username:
                context.principal.username,

              fullName:
                context.session.fullName,

              role:
                context.session.role,

              ownerId:
                context.principal.ownerId,

              businessId:
                context.principal.businessId,

              branchId:
                context.principal.branchId,

              storageMode:
                context.principal.storageMode,

              dataContext:
                context.principal.dataContext,

              ...(
                context.principal.demoId ===
                  undefined
                  ? {}
                  : {
                      demoId:
                        context.principal.demoId,
                    }
              ),

              accessMode:
                context.session.accessMode,
            };

          return session;
        },

      resolveCredential:
        async (
          session,
        ) => {
          const storeResult =
            await production
              .readControlStore();

          if (
            !storeResult.success ||
            !storeResult.data
          ) {
            return null;
          }

          const expectedCanonicalUsername =
            canonicalizeFinoraCredentialUsername(
              session.username,
            );

          const matches =
            (
              storeResult.data.branchCredentials ??
              []
            ).filter(
              (
                credential,
              ) => {
                const generation =
                  credential.authGeneration ??
                  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION;

                return (
                  credential.status ===
                    "ACTIVE" &&
                  generation ===
                    session.authGeneration &&
                  credential.userId ===
                    session.userId &&
                  credential.username ===
                    session.username &&
                  credential.canonicalUsername ===
                    expectedCanonicalUsername &&
                  credential.fullName ===
                    session.fullName &&
                  credential.role ===
                    session.role &&
                  credential.ownerId ===
                    session.ownerId &&
                  credential.businessId ===
                    session.businessId &&
                  credential.branchId ===
                    session.branchId &&
                  credential.storageMode ===
                    session.storageMode &&
                  credential.dataContext ===
                    session.dataContext &&
                  demosEqual(
                    session.dataContext,
                    credential.demoId,
                    session.demoId,
                  ) &&
                  credential.securityVerifier !==
                    undefined
                );
              },
            );

          if (
            matches.length !==
              1
          ) {
            return null;
          }

          const credential =
            matches[0];

          const result:
            FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential = {
              credentialId:
                credential.credentialId,

              sourceAuthorizationId:
                credential.sourceAuthorizationId,

              authGeneration:
                credential.authGeneration ??
                FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,

              userId:
                credential.userId,

              username:
                credential.username,

              canonicalUsername:
                credential.canonicalUsername,

              fullName:
                credential.fullName,

              role:
                credential.role,

              ownerId:
                credential.ownerId,

              businessId:
                credential.businessId,

              branchId:
                credential.branchId,

              storageMode:
                credential.storageMode,

              dataContext:
                credential.dataContext,

              ...(
                credential.demoId ===
                  undefined
                  ? {}
                  : {
                      demoId:
                        credential.demoId,
                    }
              ),

              status:
                "ACTIVE",
            };

          return result;
        },

      resolveControlState:
        async (
          session,
          credential,
        ) => {
          const activationResult =
            await production
              .findBranchActivation(
                credential.ownerId,
                credential.businessId,
                credential.branchId,
              );

          if (
            !activationResult.success ||
            !activationResult.data ||
            activationResult.data.status !==
              "ACTIVE"
          ) {
            return null;
          }

          const accessResult =
            await production
              .evaluateBranchAccess({
                userId:
                  credential.userId,

                ownerId:
                  credential.ownerId,

                businessId:
                  credential.businessId,

                branchId:
                  credential.branchId,
              });

          if (
            !accessResult.success
          ) {
            return null;
          }

          const decision =
            accessResult.data;

          const grant =
            decision.grant;

          if (!grant) {
            return null;
          }

          const grantMatches =
            grant.userId ===
              credential.userId &&
            grant.ownerId ===
              credential.ownerId &&
            grant.businessId ===
              credential.businessId &&
            grant.branchId ===
              credential.branchId &&
            grant.storageMode ===
              credential.storageMode &&
            grant.administrativeStatus ===
              "ACTIVE" &&
            (
              credential.dataContext ===
                "REAL"
                ? (
                    grant.accessType ===
                      "REGISTERED" &&
                    grant.demoId ===
                      undefined
                  )
                : (
                    grant.accessType ===
                      "DEMO" &&
                    typeof credential.demoId ===
                      "string" &&
                    grant.demoId ===
                      credential.demoId
                  )
            );

          if (!grantMatches) {
            return null;
          }

          let accessMode:
            "ACTIVE" |
            "REGISTERED_EXPIRED_READ_ONLY";

          if (
            decision.allowed &&
            decision.state ===
              "ACTIVE"
          ) {
            accessMode =
              "ACTIVE";
          }
          else if (
            !decision.allowed &&
            decision.state ===
              "EXPIRED" &&
            grant.accessType ===
              "REGISTERED"
          ) {
            accessMode =
              "REGISTERED_EXPIRED_READ_ONLY";
          }
          else {
            return null;
          }

          if (
            accessMode !==
              session.accessMode
          ) {
            return null;
          }

          const entitlementResult =
            await production
              .findStorageEntitlement(
                credential.userId,
                credential.ownerId,
                credential.businessId,
                credential.branchId,
                credential.storageMode,
              );

          if (
            !entitlementResult.success ||
            !entitlementResult.data ||
            entitlementResult.data.status !==
              "ACTIVE"
          ) {
            return null;
          }

          const entitlement =
            entitlementResult.data;

          const entitlementMatches =
            entitlement.userId ===
              credential.userId &&
            entitlement.ownerId ===
              credential.ownerId &&
            entitlement.businessId ===
              credential.businessId &&
            entitlement.branchId ===
              credential.branchId &&
            entitlement.storageMode ===
              credential.storageMode;

          if (!entitlementMatches) {
            return null;
          }

          const controlStoreResult =
            await production
              .readControlStore();

          if (
            !controlStoreResult.success ||
            !controlStoreResult.data
          ) {
            return null;
          }

          const installation =
            controlStoreResult.data.installation;

          let businessCode:
            string | null =
              null;

          let branchCode:
            string | null =
              null;

          if (installation) {
            if (
              installation.ownerId !==
                credential.ownerId ||
              installation.businessId !==
                credential.businessId ||
              installation.branchId !==
                credential.branchId
            ) {
              return null;
            }

            const hasBusinessCode =
              installation.businessCode !==
                undefined;

            const hasBranchCode =
              installation.branchCode !==
                undefined;

            if (
              hasBusinessCode !==
                hasBranchCode
            ) {
              return null;
            }

            if (
              hasBusinessCode &&
              hasBranchCode
            ) {
              if (
                !installation.businessCode ||
                !installation.branchCode
              ) {
                return null;
              }

              businessCode =
                installation.businessCode;

              branchCode =
                installation.branchCode;
            }
          }

          const profile =
            (
              controlStoreResult.data.businessProfiles ??
              []
            ).find(
              (item) =>
                item.ownerId ===
                  credential.ownerId &&
                item.businessId ===
                  credential.businessId &&
                item.branchId ===
                  credential.branchId,
            );

          const businessProfile =
            profile ===
              undefined
              ? undefined
              : {
                  profileId:
                    profile.profileId,

                  ownerId:
                    profile.ownerId,

                  businessId:
                    profile.businessId,

                  branchId:
                    profile.branchId,

                  businessCode:
                    profile.businessCode,

                  branchCode:
                    profile.branchCode,

                  businessName:
                    profile.businessName,

                  branchName:
                    profile.branchName,

                  installationId:
                    profile.installationId,

                  bindingKeyId:
                    profile.bindingKeyId,

                  fingerprintAlgorithm:
                    profile.fingerprintAlgorithm,

                  publicKeyFingerprint:
                    profile.publicKeyFingerprint,

                  createdAt:
                    profile.createdAt,

                  updatedAt:
                    profile.updatedAt,

                  schemaVersion:
                    1 as const,
                };

          if (
            businessProfile !==
              undefined &&
            (
              businessCode ===
                null ||
              branchCode ===
                null ||
              businessProfile.businessCode !==
                businessCode ||
              businessProfile.branchCode !==
                branchCode
            )
          ) {
            return null;
          }
          return {
            activationId:
              activationResult.data.activationId,

            activationStatus:
              "ACTIVE" as const,

            businessCode,

            branchCode,

            ...(
              businessProfile ===
                undefined
                ? {}
                : {
                    businessProfile,
                  }
            ),

            ...(
              activationResult.data.activatedAt ===
                undefined
                ? {}
                : {
                    activationActivatedAt:
                      activationResult.data.activatedAt,
                  }
            ),

            activationCreatedAt:
              activationResult.data.createdAt,

            activationUpdatedAt:
              activationResult.data.updatedAt,

            branchAccessGrantId:
              grant.grantId,

            branchAccessType:
              grant.accessType,

            registrationPayment:
              grant.registrationPayment ===
                undefined
                ? null
                : (
                    () => {
                      if (
                        grant.registrationPayment.currency !==
                          "INR"
                      ) {
                        throw new Error(
                          "FINORA trusted REGISTERED Branch Access payment currency is invalid.",
                        );
                      }

                      return {
                        ...grant.registrationPayment,

                        currency:
                          "INR" as const,
                      };
                    }
                  )(),

            registrationCycle:
              grant.registrationCycle ??
              null,

            demoRemarks:
              grant.demoRemarks ??
              null,

            accessMode,

            accessValidFrom:
              grant.validity.validFrom,

            accessValidUntil:
              grant.validity.validUntil,

            branchAccessCreatedAt:
              grant.createdAt,

            branchAccessUpdatedAt:
              grant.updatedAt,

            storageEntitlementId:
              entitlement.entitlementId,

            storageEntitlementStatus:
              "ACTIVE" as const,

            storageEntitlementActivatedAt:
              entitlement.activatedAt,

            storageEntitlementCreatedAt:
              entitlement.createdAt,

            storageEntitlementUpdatedAt:
              entitlement.updatedAt,
          };
        },

      readPortableAuth:
        (
          storageMode,
        ) =>
          portableStore.read(
            storageMode,
          ),

      decryptPortableAuth:
        (
          envelope,
          password,
          securityCode,
          expectedScope,
        ) =>
          production.decryptPortableAuth(
            envelope,
            password,
            securityCode,
            {
              expectedScope,
            },
          ),

      createPortableAuthFingerprint:
        production
          .createPortableAuthFingerprint,

      createSignedPackage:
        production
          .createSignedPackage,

      persistRuntimeAuthority:
        (
          storageMode,
          packageValue,
        ) =>
          runtimeAuthorityStore.write(
            storageMode,
            packageValue,
          ),

      now:
        production.now,

      createAuthorityId:
        production.createAuthorityId,
    };

  const firstResult =
    await seedFinoraPortableFreshDeviceRuntimeAuthority(
      input,
      dependencies,
    );

  if (
    !firstResult.success &&
    firstResult.errorCode ===
      "CERTIFICATION_AUTHORITY_MISSING"
  ) {
    try {
      await migrateLegacyPortableBranchCertification(
        input,
        portableStore,
        production,
      );
    }
    catch (
      error
    ) {
      return {
        success:
          false,

        errorCode:
          "CERTIFICATION_AUTHORITY_MISSING",

        error:
          error instanceof Error
            ? error.message
            : "FINORA could not migrate legacy Branch Certification authority.",
      };
    }

    return seedFinoraPortableFreshDeviceRuntimeAuthority(
      input,
      dependencies,
    );
  }

  if (
    firstResult.success
  ) {
    // --------------------------------------------------------
    // BEST-EFFORT CRASH RECOVERY ONLY
    //
    // A normal successful runtime-authority seed must not gain
    // a dependency on unrelated native bootstrap custody.
    //
    // We only attempt legacy cleanup when bootstrap custody can
    // be read AND is already branch-bound to this exact current
    // authenticated branch.
    //
    // Missing / unreadable / unrelated bootstrap state therefore
    // cannot turn an already-valid seed into a failure.
    // --------------------------------------------------------

    let bootstrap;

    try {
      bootstrap =
        await loadFinoraBranchCertificationBootstrap();
    }
    catch {
      return firstResult;
    }

    if (
      bootstrap ===
        undefined ||
      bootstrap.state !==
        "BRANCH_BOUND_AFTER_RESPONSE" ||
      bootstrap.branchBinding ===
        undefined
    ) {
      return firstResult;
    }

    let sessionResult;

    try {
      sessionResult =
        await production
          .resolveOperationalSessionContext({
            sessionId:
              input.sessionId,
          });
    }
    catch {
      return firstResult;
    }

    if (
      !sessionResult.success ||
      !sessionResult.data
    ) {
      return firstResult;
    }

    const principal =
      sessionResult.data.principal;

    const binding =
      bootstrap.branchBinding;

    if (
      binding.ownerId !==
        principal.ownerId ||
      binding.businessId !==
        principal.businessId ||
      binding.branchId !==
        principal.branchId
    ) {
      return firstResult;
    }

    try {
      await migrateLegacyPortableBranchCertification(
        input,
        portableStore,
        production,
      );
    }
    catch (
      error
    ) {
      return {
        success:
          false,

        errorCode:
          "CERTIFICATION_AUTHORITY_MISSING",

        error:
          error instanceof Error
            ? error.message
            : "FINORA could not finalize exact-branch legacy Branch Certification migration.",
      };
    }
  }

  return firstResult;
}