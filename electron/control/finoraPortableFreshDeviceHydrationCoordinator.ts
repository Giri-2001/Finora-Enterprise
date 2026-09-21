import type {
  FinoraBranchCredentialAuthorizationVerificationEvidence,
  FinoraControlBranchAccessGrant,
  FinoraControlBranchActivation,
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
  FinoraControlInstallationIdentity,
  FinoraControlStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import type {
  FinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

import type {
  FinoraFreshDeviceBootstrapHydrationPlan,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

// ============================================================
// ATOMIC HYDRATION STATE
// ============================================================

export interface FinoraPortableFreshDeviceHydrationState {
  installation:
    FinoraControlInstallationIdentity;

  activation:
    FinoraControlBranchActivation;

  storageEntitlement:
    FinoraControlStorageEntitlement;

  branchAccessGrant:
    FinoraControlBranchAccessGrant;

  credential:
    FinoraControlBranchCredential;

  credentialVerificationEvidence?:
    FinoraBranchCredentialAuthorizationVerificationEvidence;

  credentialPortabilityAuthorityProvenance?:
    FinoraBranchCredentialPortabilityAuthorityProvenanceV1;
}

export interface FinoraPortableFreshDeviceAtomicHydrationInput
  extends FinoraPortableFreshDeviceHydrationState {
  appliedAt:
    string;
}

export type FinoraPortableFreshDeviceAtomicHydrationResult =
  | {
      success:
        true;

      status:
        "HYDRATED" |
        "ALREADY_HYDRATED";
    }
  | {
      success:
        false;

      error:
        string;
    };

export interface FinoraPortableFreshDeviceHydrationDependencies {
  ensureNativeBinding():
    Promise<
      FinoraWindowsInstallationBindingPublic
    >;

  applyAtomicState(
    input:
      FinoraPortableFreshDeviceAtomicHydrationInput,
  ):
    Promise<
      FinoraPortableFreshDeviceAtomicHydrationResult
    >;

  now():
    Date;
}

export type FinoraPortableFreshDeviceHydrationResult =
  FinoraPortableFreshDeviceAtomicHydrationResult;

// ============================================================
// HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function hasText(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isTimestamp(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    Number.isFinite(
      Date.parse(
        value,
      ),
    )
  );
}

function isCanonicalBase64Bytes(
  value:
    unknown,

  expectedBytes:
    number,
): value is string {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0 ||
    value.length %
      4 !==
      0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    return false;
  }

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  return (
    decoded.length ===
      expectedBytes &&
    decoded.toString(
      "base64",
    ) ===
      value
  );
}

function toCredentialVerifier(
  value:
    unknown,
): FinoraControlBranchCredentialVerifierV1 {
  // ----------------------------------------------------------
  // PORTABLE -> CONTROL VERIFIER ADAPTER
  //
  // Portable Auth derives 64 bytes so verifier evidence and
  // encryption key material remain separated. The encrypted
  // Portable payload retains the 32-byte verifier evidence in
  // `verifier`, while Control Store persists that evidence as
  // `derivedKey`.
  // ----------------------------------------------------------

  if (
    !isRecord(
      value,
    ) ||
    value.algorithm !==
      "SCRYPT" ||
    !isCanonicalBase64Bytes(
      value.salt,
      16,
    ) ||
    value.N !==
      32768 ||
    value.r !==
      8 ||
    value.p !==
      1 ||
    value.derivedKeyLength !==
      64 ||
    value.verifierLength !==
      32 ||
    !isCanonicalBase64Bytes(
      value.verifier,
      32,
    )
  ) {
    throw new Error(
      "FINORA fresh-device hydration credential verifier is invalid.",
    );
  }

  return {
    algorithm:
      "SCRYPT",

    saltEncoding:
      "BASE64",

    salt:
      value.salt,

    derivedKeyEncoding:
      "BASE64",

    derivedKey:
      value.verifier,

    keyLength:
      32,

    N:
      value.N,

    r:
      value.r,

    p:
      value.p,
  };
}

function assertRole(
  role:
    unknown,
): asserts role is
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER" {
  if (
    role !==
      "ADMIN" &&
    role !==
      "MANAGER" &&
    role !==
      "COLLECTOR" &&
    role !==
      "VIEWER"
  ) {
    throw new Error(
      "FINORA fresh-device hydration role is invalid.",
    );
  }
}

function assertNumberingCodes(
  businessCode:
    string | null,

  branchCode:
    string | null,
): void {
  if (
    businessCode ===
      null ||
    branchCode ===
      null
  ) {
    if (
      businessCode !==
        null ||
      branchCode !==
        null
    ) {
      throw new Error(
        "FINORA fresh-device numbering codes must be present together.",
      );
    }

    return;
  }

  if (
    !hasText(
      businessCode,
    ) ||
    !hasText(
      branchCode,
    )
  ) {
    throw new Error(
      "FINORA fresh-device numbering codes are invalid.",
    );
  }
}

function assertNativeBinding(
  binding:
    FinoraWindowsInstallationBindingPublic,
): void {
  if (
    !hasText(
      binding.installationId,
    ) ||
    !hasText(
      binding.bindingKeyId,
    ) ||
    binding.fingerprintAlgorithm !==
      "SHA-256" ||
    !/^[A-Fa-f0-9]{64}$/.test(
      binding.publicKeyFingerprint,
    ) ||
    !isTimestamp(
      binding.createdAt,
    ) ||
    binding.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA current native installation binding is invalid.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${binding.publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    binding.bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA current native bindingKeyId is not canonical.",
    );
  }
}

function resolveSourceEvidence(
  value:
    unknown,

  sourceAuthorizationId:
    string,
): {
  credentialVerificationEvidence?:
    FinoraBranchCredentialAuthorizationVerificationEvidence;

  credentialPortabilityAuthorityProvenance?:
    FinoraBranchCredentialPortabilityAuthorityProvenanceV1;
} {
  if (
    !isRecord(
      value,
    ) ||
    value.authorizationId !==
      sourceAuthorizationId ||
    value.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA fresh-device source authorization evidence is invalid.",
    );
  }

  // ----------------------------------------------------------
  // SIGNED CONTROL-CENTER SOURCE EVIDENCE
  // ----------------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "packageId",
    )
  ) {
    if (
      !hasText(
        value.packageId,
      ) ||
      !hasText(
        value.issuerId,
      ) ||
      !Number.isSafeInteger(
        value.sequence,
      ) ||
      (
        value.sequence as number
      ) <=
        0 ||
      !isRecord(
        value.verifiedControlSigner,
      ) ||
      !isTimestamp(
        value.verifiedAt,
      )
    ) {
      throw new Error(
        "FINORA signed source authorization evidence is invalid.",
      );
    }

    const credentialVerificationEvidence:
      FinoraBranchCredentialAuthorizationVerificationEvidence = {
        authorizationId:
          sourceAuthorizationId,

        packageId:
          value.packageId,

        issuerId:
          value.issuerId,

        sequence:
          value.sequence as number,

        verifiedControlSigner:
          structuredClone(
            value.verifiedControlSigner,
          ) as unknown as
            FinoraBranchCredentialAuthorizationVerificationEvidence[
              "verifiedControlSigner"
            ],

        verifiedAt:
          value.verifiedAt,

        schemaVersion:
          1,
      };

    let credentialPortabilityAuthorityProvenance:
      FinoraBranchCredentialPortabilityAuthorityProvenanceV1 |
      undefined;

    if (
      value.portabilityAuthorityProof !==
        undefined
    ) {
      if (
        !isRecord(
          value.portabilityAuthorityProof,
        ) ||
        value.portabilityAuthorityProof.sourceAuthorizationId !==
          sourceAuthorizationId
      ) {
        throw new Error(
          "FINORA credential portability provenance is invalid.",
        );
      }

      credentialPortabilityAuthorityProvenance =
        structuredClone(
          value.portabilityAuthorityProof,
        ) as unknown as
          FinoraBranchCredentialPortabilityAuthorityProvenanceV1;
    }

    return {
      credentialVerificationEvidence,
      ...(
        credentialPortabilityAuthorityProvenance ===
          undefined
          ? {}
          : {
              credentialPortabilityAuthorityProvenance,
            }
      ),
    };
  }

  // ----------------------------------------------------------
  // LEGACY NATIVE-BOUND MIGRATION SOURCE
  //
  // Legacy evidence is valid Portable Auth lineage, but it must
  // never be transformed into fabricated Control Center signer
  // evidence. The encrypted Portable Auth remains its evidence.
  // ----------------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "legacyNativeBoundMigrationEvidence",
    ) &&
    isRecord(
      value.legacyNativeBoundMigrationEvidence,
    )
  ) {
    return {};
  }

  throw new Error(
    "FINORA fresh-device source authorization evidence kind is unsupported.",
  );
}

// ============================================================
// HYDRATION STATE BUILDER
// ============================================================

export function createFinoraPortableFreshDeviceHydrationState(
  plan:
    FinoraFreshDeviceBootstrapHydrationPlan,

  nativeBinding:
    FinoraWindowsInstallationBindingPublic,
): FinoraPortableFreshDeviceHydrationState {
  assertNativeBinding(
    nativeBinding,
  );

  assertRole(
    plan.role,
  );

  if (
    !hasText(
      plan.authorityId,
    ) ||
    !hasText(
      plan.sourceAuthorizationId,
    ) ||
    !hasText(
      plan.credentialId,
    ) ||
    !hasText(
      plan.activationId,
    ) ||
    !hasText(
      plan.branchAccessGrantId,
    ) ||
    !hasText(
      plan.storageEntitlementId,
    ) ||
    !hasText(
      plan.ownerId,
    ) ||
    !hasText(
      plan.businessId,
    ) ||
    !hasText(
      plan.branchId,
    ) ||
    !hasText(
      plan.userId,
    ) ||
    !hasText(
      plan.username,
    ) ||
    !hasText(
      plan.canonicalUsername,
    ) ||
    plan.canonicalUsername !==
      plan.username
        .trim()
        .normalize(
          "NFKC",
        )
        .toLowerCase() ||
    !hasText(
      plan.fullName,
    ) ||
    (
      plan.storageMode !==
        "LOCAL" &&
      plan.storageMode !==
        "USB"
    ) ||
    (
      plan.dataContext !==
        "REAL" &&
      plan.dataContext !==
        "DEMO"
    ) ||
    !Number.isSafeInteger(
      plan.authGeneration,
    ) ||
    plan.authGeneration <=
      0
  ) {
    throw new Error(
      "FINORA fresh-device hydration identity is invalid.",
    );
  }

  assertNumberingCodes(
    plan.businessCode,
    plan.branchCode,
  );

  if (
    plan.dataContext ===
      "REAL"
  ) {
    if (
      plan.branchAccessType !==
        "REGISTERED" ||
      plan.demoId !==
        undefined
    ) {
      throw new Error(
        "FINORA REAL hydration access context is invalid.",
      );
    }
  }
  else if (
    plan.branchAccessType !==
      "DEMO" ||
    !hasText(
      plan.demoId,
    )
  ) {
    throw new Error(
      "FINORA DEMO hydration access context is invalid.",
    );
  }

  if (
    plan.accessMode !==
      "ACTIVE" &&
    plan.accessMode !==
      "REGISTERED_EXPIRED_READ_ONLY"
  ) {
    throw new Error(
      "FINORA fresh-device hydration access mode is invalid.",
    );
  }

  if (
    plan.accessMode ===
      "REGISTERED_EXPIRED_READ_ONLY" &&
    plan.branchAccessType !==
      "REGISTERED"
  ) {
    throw new Error(
      "Only REGISTERED access may hydrate as read-only.",
    );
  }

  const requiredTimestamps =
    [
      plan.activationCreatedAt,
      plan.activationUpdatedAt,
      plan.storageEntitlementActivatedAt,
      plan.storageEntitlementCreatedAt,
      plan.storageEntitlementUpdatedAt,
      plan.accessValidFrom,
      plan.accessValidUntil,
      plan.branchAccessCreatedAt,
      plan.branchAccessUpdatedAt,
      plan.portableCredentialCreatedAt,
      plan.portableCredentialUpdatedAt,
      plan.runtimeAuthorityIssuedAt,
    ];

  if (
    requiredTimestamps.some(
      (
        value,
      ) =>
        !isTimestamp(
          value,
        ),
    ) ||
    (
      plan.activationActivatedAt !==
        undefined &&
      !isTimestamp(
        plan.activationActivatedAt,
      )
    ) ||
    !/^[a-f0-9]{64}$/.test(
      plan.portableAuthFingerprint,
    )
  ) {
    throw new Error(
      "FINORA fresh-device hydration timestamp or fingerprint evidence is invalid.",
    );
  }

  const passwordVerifier =
    toCredentialVerifier(
      plan.passwordVerifier,
    );

  const securityVerifier =
    toCredentialVerifier(
      plan.securityVerifier,
    );

  const sourceEvidence =
    resolveSourceEvidence(
      plan.sourceAuthorizationVerificationEvidence,
      plan.sourceAuthorizationId,
    );

  const installation:
    FinoraControlInstallationIdentity = {
      installationId:
        nativeBinding.installationId,

      ownerId:
        plan.ownerId,

      businessId:
        plan.businessId,

      branchId:
        plan.branchId,

      ...(
        plan.businessCode ===
          null
          ? {}
          : {
              businessCode:
                plan.businessCode,

              branchCode:
                plan.branchCode as string,
            }
      ),

      createdAt:
        nativeBinding.createdAt,

      updatedAt:
        nativeBinding.createdAt,

      schemaVersion:
        1,
    };

  const activation:
    FinoraControlBranchActivation = {
      activationId:
        plan.activationId,

      ownerId:
        plan.ownerId,

      businessId:
        plan.businessId,

      branchId:
        plan.branchId,

      status:
        "ACTIVE",

      ...(
        plan.activationActivatedAt ===
          undefined
          ? {}
          : {
              activatedAt:
                plan.activationActivatedAt,
            }
      ),

      createdAt:
        plan.activationCreatedAt,

      updatedAt:
        plan.activationUpdatedAt,

      schemaVersion:
        1,
    };

  const storageEntitlement:
    FinoraControlStorageEntitlement = {
      entitlementId:
        plan.storageEntitlementId,

      userId:
        plan.userId,

      ownerId:
        plan.ownerId,

      businessId:
        plan.businessId,

      branchId:
        plan.branchId,

      installationId:
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,

      storageMode:
        plan.storageMode,

      status:
        "ACTIVE",

      activatedAt:
        plan.storageEntitlementActivatedAt,

      createdAt:
        plan.storageEntitlementCreatedAt,

      updatedAt:
        plan.storageEntitlementUpdatedAt,

      schemaVersion:
        1,
    };

  const branchAccessGrant:
    FinoraControlBranchAccessGrant = {
      grantId:
        plan.branchAccessGrantId,

      userId:
        plan.userId,

      ownerId:
        plan.ownerId,

      businessId:
        plan.businessId,

      branchId:
        plan.branchId,

      storageMode:
        plan.storageMode,

      accessType:
        plan.branchAccessType,

      administrativeStatus:
        "ACTIVE",

      validity: {
        validFrom:
          plan.accessValidFrom,

        validUntil:
          plan.accessValidUntil,
      },

      ...(
        plan.dataContext ===
          "DEMO"
          ? {
              demoId:
                plan.demoId as string,

              ...(
                plan.demoRemarks ===
                  null
                  ? {}
                  : {
                      demoRemarks:
                        plan.demoRemarks,
                    }
              ),
            }
          : {
              ...(
                plan.registrationPayment ===
                  null
                  ? {}
                  : {
                      registrationPayment: {
                        ...plan.registrationPayment,
                      },
                    }
              ),

              ...(
                plan.registrationCycle ===
                  null
                  ? {}
                  : {
                      registrationCycle:
                        plan.registrationCycle,
                    }
              ),

              ...(
                plan.demoRemarks ===
                  null
                  ? {}
                  : {
                      demoRemarks:
                        plan.demoRemarks,
                    }
              ),
            }
      ),

      createdAt:
        plan.branchAccessCreatedAt,

      updatedAt:
        plan.branchAccessUpdatedAt,

      schemaVersion:
        1,
    };

  const credential:
    FinoraControlBranchCredential = {
      credentialId:
        plan.credentialId,

      sourceAuthorizationId:
        plan.sourceAuthorizationId,

      authGeneration:
        plan.authGeneration,

      userId:
        plan.userId,

      username:
        plan.username,

      canonicalUsername:
        plan.canonicalUsername,

      fullName:
        plan.fullName,

      role:
        plan.role,

      ownerId:
        plan.ownerId,

      businessId:
        plan.businessId,

      branchId:
        plan.branchId,

      storageMode:
        plan.storageMode,

      dataContext:
        plan.dataContext,

      ...(
        plan.dataContext ===
          "DEMO"
          ? {
              demoId:
                plan.demoId as string,
            }
          : {}
      ),

      status:
        "ACTIVE",

      verifier:
        passwordVerifier,

      securityVerifier,

      createdAt:
        plan.portableCredentialCreatedAt,

      updatedAt:
        plan.portableCredentialUpdatedAt,

      schemaVersion:
        1,
    };

  return {
    installation,
    activation,
    storageEntitlement,
    branchAccessGrant,
    credential,
    ...sourceEvidence,
  };
}

// ============================================================
// COORDINATOR
// ============================================================

export async function hydrateFinoraPortableFreshDeviceControlState(
  plan:
    FinoraFreshDeviceBootstrapHydrationPlan,

  dependencies:
    FinoraPortableFreshDeviceHydrationDependencies,
): Promise<
  FinoraPortableFreshDeviceHydrationResult
> {
  let nativeBinding:
    FinoraWindowsInstallationBindingPublic;

  try {
    nativeBinding =
      await dependencies
        .ensureNativeBinding();
  }
  catch {
    return {
      success:
        false,

      error:
        "FINORA current native installation binding is unavailable.",
    };
  }

  let state:
    FinoraPortableFreshDeviceHydrationState;

  try {
    state =
      createFinoraPortableFreshDeviceHydrationState(
        plan,
        nativeBinding,
      );
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      error:
        error instanceof
          Error
          ? error.message
          : "FINORA fresh-device hydration state is invalid.",
    };
  }

  const appliedAt =
    dependencies
      .now()
      .toISOString();

  try {
    return await dependencies
      .applyAtomicState({
        ...state,
        appliedAt,
      });
  }
  catch {
    return {
      success:
        false,

      error:
        "FINORA fresh-device Control Store hydration failed.",
    };
  }
}