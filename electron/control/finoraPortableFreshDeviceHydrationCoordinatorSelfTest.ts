import {
  hydrateFinoraPortableFreshDeviceControlState,
} from "./finoraPortableFreshDeviceHydrationCoordinator.js";

import type {
  FinoraPortableFreshDeviceAtomicHydrationInput,
} from "./finoraPortableFreshDeviceHydrationCoordinator.js";

import type {
  FinoraFreshDeviceBootstrapHydrationPlan,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

import type {
  FinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

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

const T0 =
  "2026-01-01T00:00:00.000Z";

const T1 =
  "2026-09-20T00:00:00.000Z";

const fingerprint =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const verifier = {
  algorithm:
    "SCRYPT" as const,

  salt:
    Buffer.alloc(
      16,
      1,
    ).toString(
      "base64",
    ),

  N:
    32768 as const,

  r:
    8 as const,

  p:
    1 as const,

  derivedKeyLength:
    64 as const,

  verifierLength:
    32 as const,

  verifier:
    Buffer.alloc(
      32,
      2,
    ).toString(
      "base64",
    ),
};

const nativeBinding:
  FinoraWindowsInstallationBindingPublic = {
    installationId:
      "INSTALLATION-NEW-WINDOWS",

    bindingKeyId:
      "FINORA-BINDING-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",

    platform:
      "WINDOWS",

    algorithm:
      "ECDSA_P256_SHA256",

    publicKeyFormat:
      "SPKI_DER_BASE64",

    publicKey:
      Buffer.from(
        "test-public-key",
        "utf8",
      ).toString(
        "base64",
      ),

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      fingerprint,

    createdAt:
      T1,

    schemaVersion:
      1,
  };

const basePlan:
  FinoraFreshDeviceBootstrapHydrationPlan = {
    authorityId:
      "RUNTIME-AUTHORITY-1",

    sourceAuthorizationId:
      "AUTHORIZATION-1",

    sourceAuthorizationVerificationEvidence: {
      authorizationId:
        "AUTHORIZATION-1",

      packageId:
        "PACKAGE-1",

      issuerId:
        "ISSUER-1",

      sequence:
        1,

      verifiedControlSigner: {
        issuerId:
          "ISSUER-1",
      },

      verifiedAt:
        T0,

      schemaVersion:
        1,
    },

    credentialId:
      "CREDENTIAL-1",

    activationId:
      "ACTIVATION-1",

    activationActivatedAt:
      T0,

    activationCreatedAt:
      T0,

    activationUpdatedAt:
      T1,

    branchAccessGrantId:
      "ACCESS-1",

    storageEntitlementId:
      "ENTITLEMENT-1",

    storageEntitlementActivatedAt:
      T0,

    storageEntitlementCreatedAt:
      T0,

    storageEntitlementUpdatedAt:
      T1,

    ownerId:
      "OWNER-1",

    businessId:
      "BUSINESS-1",

    branchId:
      "BRANCH-1",

    businessCode:
      "BUS001",

    branchCode:
      "BR001",

    userId:
      "USER-1",

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

    passwordVerifier:
      verifier,

    securityVerifier:
      verifier,

    authGeneration:
      1,

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
      T0,

    accessValidUntil:
      "2027-01-01T00:00:00.000Z",

    branchAccessCreatedAt:
      T0,

    branchAccessUpdatedAt:
      T1,

    portableAuthFingerprint:
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

    portableCredentialCreatedAt:
      T0,

    portableCredentialUpdatedAt:
      T1,

    runtimeAuthorityIssuedAt:
      T1,
  };

async function run():
  Promise<void> {
  let applyCount =
    0;

  let captured:
    FinoraPortableFreshDeviceAtomicHydrationInput |
    undefined;

  const result =
    await hydrateFinoraPortableFreshDeviceControlState(
      basePlan,
      {
        ensureNativeBinding:
          async () =>
            nativeBinding,

        applyAtomicState:
          async (
            input,
          ) => {
            applyCount +=
              1;

            captured =
              input;

            return {
              success:
                true,

              status:
                "HYDRATED",
            };
          },

        now:
          () =>
            new Date(
              "2026-09-20T10:00:00.000Z",
            ),
      },
    );

  assert(
    result.success &&
      result.status ===
        "HYDRATED",
    "Valid hydration did not succeed.",
  );

  assert(
    applyCount ===
      1 &&
      captured !==
        undefined,
    "Hydration must invoke one atomic apply.",
  );

  assert(
    captured.installation.installationId ===
      nativeBinding.installationId &&
      captured.storageEntitlement.installationId ===
        nativeBinding.installationId &&
      captured.storageEntitlement.bindingKeyId ===
        nativeBinding.bindingKeyId &&
      captured.storageEntitlement.publicKeyFingerprint ===
        nativeBinding.publicKeyFingerprint,
    "Hydration did not bind local state to the current native device.",
  );

  assert(
    captured.installation.businessCode ===
      "BUS001" &&
      captured.installation.branchCode ===
        "BR001",
    "Signed business / branch numbering identity was not preserved.",
  );

  assert(
    captured.credential.verifier.algorithm ===
      "SCRYPT" &&
      captured.credential.securityVerifier?.algorithm ===
        "SCRYPT",
    "Portable credential verifiers were not preserved.",
  );

  assert(
    captured.credentialVerificationEvidence?.authorizationId ===
      "AUTHORIZATION-1",
    "Signed source verification evidence was not preserved.",
  );

  console.log(
    "PASS: current native P-256 binding becomes hydrated installation + entitlement binding",
  );

  console.log(
    "PASS: credential, activation, access and numbering authority become one atomic apply input",
  );

  console.log(
    "PASS: signed source authorization evidence is preserved without minting Control Center package state",
  );

  // ----------------------------------------------------------
  // LEGACY SOURCE EVIDENCE MUST NOT BECOME CONTROL-CENTER
  // VERIFICATION EVIDENCE.
  // ----------------------------------------------------------

  let legacyCaptured:
    FinoraPortableFreshDeviceAtomicHydrationInput |
    undefined;

  const legacyPlan = {
    ...basePlan,

    sourceAuthorizationVerificationEvidence: {
      authorizationId:
        "AUTHORIZATION-1",

      legacyNativeBoundMigrationEvidence: {
        preserved:
          true,
      },

      schemaVersion:
        1,
    },
  };

  const legacyResult =
    await hydrateFinoraPortableFreshDeviceControlState(
      legacyPlan,
      {
        ensureNativeBinding:
          async () =>
            nativeBinding,

        applyAtomicState:
          async (
            input,
          ) => {
            legacyCaptured =
              input;

            return {
              success:
                true,

              status:
                "HYDRATED",
            };
          },

        now:
          () =>
            new Date(
              "2026-09-20T10:00:00.000Z",
            ),
      },
    );

  assert(
    legacyResult.success &&
      legacyCaptured !==
        undefined &&
      legacyCaptured.credentialVerificationEvidence ===
        undefined &&
      legacyCaptured.credentialPortabilityAuthorityProvenance ===
        undefined,
    "Legacy lineage must not fabricate Control Center signer evidence.",
  );

  console.log(
    "PASS: legacy native-bound lineage never fabricates Control Center verification evidence",
  );

  // ----------------------------------------------------------
  // ONE-SIDED NUMBERING MUST FAIL BEFORE MUTATION.
  // ----------------------------------------------------------

  let invalidApplyCount =
    0;

  const invalidNumberingPlan = {
    ...basePlan,

    branchCode:
      null,
  };

  const invalidNumberingResult =
    await hydrateFinoraPortableFreshDeviceControlState(
      invalidNumberingPlan,
      {
        ensureNativeBinding:
          async () =>
            nativeBinding,

        applyAtomicState:
          async () => {
            invalidApplyCount +=
              1;

            return {
              success:
                true,

              status:
                "HYDRATED",
            };
          },

        now:
          () =>
            new Date(
              "2026-09-20T10:00:00.000Z",
            ),
      },
    );

  assert(
    !invalidNumberingResult.success &&
      invalidApplyCount ===
        0,
    "Invalid numbering identity reached atomic mutation.",
  );

  console.log(
    "PASS: malformed numbering identity fails before Control Store mutation",
  );

  // ----------------------------------------------------------
  // WRONG SOURCE AUTHORIZATION LINK MUST FAIL BEFORE MUTATION.
  // ----------------------------------------------------------

  let mismatchApplyCount =
    0;

  const mismatchedEvidencePlan = {
    ...basePlan,

    sourceAuthorizationVerificationEvidence: {
      ...(
        basePlan.sourceAuthorizationVerificationEvidence as
          Record<string, unknown>
      ),

      authorizationId:
        "AUTHORIZATION-OTHER",
    },
  };

  const mismatchResult =
    await hydrateFinoraPortableFreshDeviceControlState(
      mismatchedEvidencePlan,
      {
        ensureNativeBinding:
          async () =>
            nativeBinding,

        applyAtomicState:
          async () => {
            mismatchApplyCount +=
              1;

            return {
              success:
                true,

              status:
                "HYDRATED",
            };
          },

        now:
          () =>
            new Date(
              "2026-09-20T10:00:00.000Z",
            ),
      },
    );

  assert(
    !mismatchResult.success &&
      mismatchApplyCount ===
        0,
    "Mismatched source authorization evidence reached mutation.",
  );

  console.log(
    "PASS: source-authorization mismatch fails before Control Store mutation",
  );

  console.log(
    "PASS: STEP A3-A2-H4 ATOMIC FRESH-DEVICE HYDRATION COORDINATOR EXECUTABLE PROOF",
  );
}

void run().catch(
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