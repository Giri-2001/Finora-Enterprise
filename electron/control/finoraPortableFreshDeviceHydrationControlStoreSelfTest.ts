import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  applyFinoraPortableFreshDeviceHydrationState,
  readFinoraControlStore,
  saveFinoraBranchAccessGrant,
  saveFinoraBranchActivation,
  saveFinoraInstallationIdentity,
  saveFinoraStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraControlBusinessProfile,
  FinoraPortableFreshDeviceHydrationApplyInput,
} from "./finoraControlStore.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

// ============================================================
// ASSERT
// ============================================================

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

function exactEqual(
  left:
    unknown,

  right:
    unknown,
): boolean {
  return (
    JSON.stringify(
      left,
    ) ===
    JSON.stringify(
      right,
    )
  );
}

// ============================================================
// PLAINTEXT SCAN
// ============================================================

async function scanDirectoryForPlaintext(
  root:
    string,

  markers:
    readonly string[],
): Promise<
  string[]
> {
  const findings:
    string[] = [];

  async function walk(
    directory:
      string,
  ): Promise<void> {
    let entries;

    try {
      entries =
        await readdir(
          directory,
          {
            withFileTypes:
              true,
          },
        );
    }
    catch {
      return;
    }

    for (
      const entry of entries
    ) {
      const fullPath =
        join(
          directory,
          entry.name,
        );

      if (
        entry.isDirectory()
      ) {
        await walk(
          fullPath,
        );

        continue;
      }

      if (
        !entry.isFile()
      ) {
        continue;
      }

      let bytes:
        Buffer;

      try {
        bytes =
          await readFile(
            fullPath,
          );
      }
      catch {
        continue;
      }

      for (
        const marker of markers
      ) {
        if (
          bytes.includes(
            Buffer.from(
              marker,
              "utf8",
            ),
          )
        ) {
          findings.push(
            `${fullPath} :: ${marker}`,
          );
        }
      }
    }
  }

  await walk(
    root,
  );

  return findings;
}

// ============================================================
// SELF-TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-fresh-hydration-store-selftest-",
      ),
    );

  let failure:
    unknown;

  app.setPath(
    "userData",
    temporaryUserData,
  );

  try {
    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    const asyncEncryptionAvailable =
      await safeStorage
        .isAsyncEncryptionAvailable();

    const syncEncryptionAvailable =
      safeStorage
        .isEncryptionAvailable();

    assert(
      asyncEncryptionAvailable ||
        syncEncryptionAvailable,
      "Electron safeStorage encryption is unavailable.",
    );

    console.log(
      "PASS: real Electron safeStorage encryption available",
    );

    // --------------------------------------------------------
    // CURRENT DEVICE NATIVE P-256 IDENTITY
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.fingerprintAlgorithm ===
        "SHA-256" &&
      /^[a-fA-F0-9]{64}$/.test(
        nativeBinding.publicKeyFingerprint,
      ),
      "Native P-256 installation binding is invalid.",
    );

    console.log(
      "PASS: current native P-256 installation binding established",
    );

    // --------------------------------------------------------
    // FRESH CONTROL STORE MUST BEGIN EMPTY
    // --------------------------------------------------------

    const beforeResult =
      await readFinoraControlStore();

    assert(
      beforeResult.success &&
        beforeResult.data !==
          undefined,
      "Unable to read fresh isolated Control Store.",
    );

    const before =
      beforeResult.data;

    assert(
      before.installation ===
        undefined &&
      before.activations.length ===
        0 &&
      before.storageEntitlements.length ===
        0 &&
      (
        before.branchAccessGrants ??
        []
      ).length ===
        0 &&
      (
        before.branchCredentials ??
        []
      ).length ===
        0,
      "Isolated Control Store was not fresh.",
    );

    console.log(
      "PASS: isolated Control Store begins without branch authority state",
    );

    // --------------------------------------------------------
    // EXACT HYDRATION INPUT
    // --------------------------------------------------------

    const createdAt =
      "2026-01-01T00:00:00.000Z";

    const authorityUpdatedAt =
      "2026-09-19T00:00:00.000Z";

    const appliedAt =
      "2026-09-20T10:00:00.000Z";

    const validUntil =
      "2027-01-01T00:00:00.000Z";

    const ownerId =
      "OWNER-H6-ATOMIC-HYDRATION";

    const businessId =
      "BUSINESS-H6-ATOMIC-HYDRATION";

    const branchId =
      "BRANCH-H6-ATOMIC-HYDRATION";

    const userId =
      "USER-H6-ATOMIC-HYDRATION";

    const username =
      "h6atomicadmin";

    const passwordVerifier = {
      algorithm:
        "SCRYPT" as const,

      saltEncoding:
        "BASE64" as const,

      salt:
        Buffer.alloc(
          16,
          11,
        ).toString(
          "base64",
        ),

      derivedKeyEncoding:
        "BASE64" as const,

      derivedKey:
        Buffer.alloc(
          32,
          12,
        ).toString(
          "base64",
        ),

      keyLength:
        32 as const,

      N:
        32768 as const,

      r:
        8 as const,

      p:
        1 as const,
    };

    const securityVerifier = {
      algorithm:
        "SCRYPT" as const,

      saltEncoding:
        "BASE64" as const,

      salt:
        Buffer.alloc(
          16,
          21,
        ).toString(
          "base64",
        ),

      derivedKeyEncoding:
        "BASE64" as const,

      derivedKey:
        Buffer.alloc(
          32,
          22,
        ).toString(
          "base64",
        ),

      keyLength:
        32 as const,

      N:
        32768 as const,

      r:
        8 as const,

      p:
        1 as const,
    };

    const historicalProfileInstallationId =
      nativeBinding.installationId ===
        "INSTALLATION-H6-HISTORICAL-PROFILE"
        ? "INSTALLATION-H6-HISTORICAL-PROFILE-ALT"
        : "INSTALLATION-H6-HISTORICAL-PROFILE";

    const zeroFingerprint =
      "0".repeat(
        64,
      );

    const oneFingerprint =
      "1".repeat(
        64,
      );

    const historicalProfileFingerprint =
      nativeBinding.publicKeyFingerprint.toLowerCase() ===
        zeroFingerprint
        ? oneFingerprint
        : zeroFingerprint;

    const historicalProfileBindingKeyId =
      `FINORA-BINDING-${historicalProfileFingerprint
        .slice(
          0,
          32,
        )
        .toUpperCase()}`;

    assert(
      historicalProfileInstallationId !==
        nativeBinding.installationId &&
      historicalProfileFingerprint !==
        nativeBinding.publicKeyFingerprint.toLowerCase() &&
      historicalProfileBindingKeyId !==
        nativeBinding.bindingKeyId,
      "Historical Business Profile fixture unexpectedly matches the current device binding.",
    );

    const signedBusinessProfile:
      FinoraControlBusinessProfile = {
        profileId:
          "PROFILE-H6-SIGNED-HISTORICAL",

        ownerId,

        businessId,

        branchId,

        businessCode:
          "H6B01",

        branchCode:
          "H6R01",

        businessName:
          "H6 Signed Business",

        branchName:
          "H6 Signed Branch",

        installationId:
          historicalProfileInstallationId,

        bindingKeyId:
          historicalProfileBindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          historicalProfileFingerprint,

        createdAt,

        updatedAt:
          authorityUpdatedAt,

        schemaVersion:
          1,
      };

    const hydration:
      FinoraPortableFreshDeviceHydrationApplyInput = {
        installation: {
          installationId:
            nativeBinding.installationId,

          ownerId,

          businessId,

          branchId,

          businessCode:
            "H6B01",

          branchCode:
            "H6R01",

          createdAt:
            nativeBinding.createdAt,

          updatedAt:
            nativeBinding.createdAt,

          schemaVersion:
            1,
        },

        activation: {
          activationId:
            "ACTIVATION-H6",

          ownerId,

          businessId,

          branchId,

          status:
            "ACTIVE",

          activatedAt:
            createdAt,

          createdAt,

          updatedAt:
            authorityUpdatedAt,

          schemaVersion:
            1,
        },

        storageEntitlement: {
          entitlementId:
            "ENTITLEMENT-H6",

          userId,

          ownerId,

          businessId,

          branchId,

          installationId:
            nativeBinding.installationId,

          bindingKeyId:
            nativeBinding.bindingKeyId,

          fingerprintAlgorithm:
            "SHA-256",

          publicKeyFingerprint:
            nativeBinding.publicKeyFingerprint,

          storageMode:
            "USB",

          status:
            "ACTIVE",

          activatedAt:
            createdAt,

          createdAt,

          updatedAt:
            authorityUpdatedAt,

          schemaVersion:
            1,
        },

        branchAccessGrant: {
          grantId:
            "ACCESS-H6",

          userId,

          ownerId,

          businessId,

          branchId,

          storageMode:
            "USB",

          accessType:
            "REGISTERED",

          administrativeStatus:
            "ACTIVE",

          validity: {
            validFrom:
              createdAt,

            validUntil,
          },

          registrationPayment: {
            amount:
              2000,

            currency:
              "INR",

            paymentMode:
              "CASH",

            paidAt:
              createdAt,

            refundable:
              false,
          },

          registrationCycle:
            1,

          createdAt,

          updatedAt:
            authorityUpdatedAt,

          schemaVersion:
            1,
        },

        businessProfile:
          signedBusinessProfile,

        credential: {
          credentialId:
            "CREDENTIAL-H6",

          sourceAuthorizationId:
            "AUTHORIZATION-H6",

          authGeneration:
            1,

          userId,

          username,

          canonicalUsername:
            username,

          fullName:
            "H6 Atomic Admin",

          role:
            "ADMIN",

          ownerId,

          businessId,

          branchId,

          storageMode:
            "USB",

          dataContext:
            "REAL",

          status:
            "ACTIVE",

          verifier:
            passwordVerifier,

          securityVerifier,

          createdAt,

          updatedAt:
            authorityUpdatedAt,

          schemaVersion:
            1,
        },

        appliedAt,
      };

    // --------------------------------------------------------
    // FIRST ATOMIC APPLY
    // --------------------------------------------------------

    const firstApply =
      await applyFinoraPortableFreshDeviceHydrationState(
        hydration,
      );

    assert(
      firstApply.success &&
        firstApply.data?.status ===
          "HYDRATED",
      firstApply.success
        ? "First hydration did not return HYDRATED."
        : (
            firstApply.error ??
            "First hydration failed."
          ),
    );

    console.log(
      "PASS: first fresh-device hydration returns HYDRATED",
    );

    // --------------------------------------------------------
    // DURABLE READ-BACK
    // --------------------------------------------------------

    const hydratedResult =
      await readFinoraControlStore();

    assert(
      hydratedResult.success &&
        hydratedResult.data !==
          undefined,
      "Unable to read hydrated Control Store.",
    );

    const hydrated =
      hydratedResult.data;

    assert(
      exactEqual(
        hydrated.installation,
        hydration.installation,
      ),
      "Hydrated installation identity does not match.",
    );

    assert(
      hydrated.activations.length ===
        1 &&
      exactEqual(
        hydrated.activations[0],
        hydration.activation,
      ),
      "Hydrated activation does not match.",
    );

    assert(
      hydrated.storageEntitlements.length ===
        1 &&
      exactEqual(
        hydrated.storageEntitlements[0],
        hydration.storageEntitlement,
      ),
      "Hydrated Storage Entitlement does not match.",
    );

    assert(
      (
        hydrated.branchAccessGrants ??
        []
      ).length ===
        1 &&
      exactEqual(
        hydrated.branchAccessGrants?.[0],
        hydration.branchAccessGrant,
      ),
      "Hydrated Branch Access Grant does not match.",
    );

    assert(
      (
        hydrated.branchCredentials ??
        []
      ).length ===
        1 &&
      exactEqual(
        hydrated.branchCredentials?.[0],
        hydration.credential,
      ),
      "Hydrated credential does not match.",
    );

    assert(
      (
        hydrated.businessProfiles ??
        []
      ).length ===
        1 &&
      exactEqual(
        hydrated.businessProfiles?.[0],
        signedBusinessProfile,
      ),
      "Hydrated signed Business Profile does not match the Runtime Authority snapshot.",
    );

    assert(
      hydrated.businessProfiles?.[0]?.installationId ===
        historicalProfileInstallationId &&
      hydrated.businessProfiles?.[0]?.bindingKeyId ===
        historicalProfileBindingKeyId &&
      hydrated.businessProfiles?.[0]?.publicKeyFingerprint ===
        historicalProfileFingerprint &&
      hydrated.businessProfiles?.[0]?.installationId !==
        nativeBinding.installationId &&
      hydrated.businessProfiles?.[0]?.bindingKeyId !==
        nativeBinding.bindingKeyId &&
      hydrated.businessProfiles?.[0]?.publicKeyFingerprint !==
        nativeBinding.publicKeyFingerprint,
      "Hydration rebound historical Business Profile binding evidence to the current device.",
    );

    console.log(
      "PASS: signed Business Profile persists with exact historical binding evidence",
    );

    assert(
      (
        hydrated.branchCredentialAuthorizationVerificationEvidence ??
        []
      ).length ===
        0 &&
      (
        hydrated.branchCredentialPortabilityAuthorities ??
        []
      ).length ===
        0,
      "Legacy-style H6 hydration unexpectedly fabricated signed Control Center evidence.",
    );

    console.log(
      "PASS: installation + activation + access + entitlement + credential persist together",
    );

    // --------------------------------------------------------
    // CONTROL-CENTER PACKAGE / SEQUENCE STATE MUST REMAIN EMPTY
    // --------------------------------------------------------

    assert(
      (
        hydrated.appliedControlPackages ??
        []
      ).length ===
        0 &&
      (
        hydrated.controlSequences ??
        []
      ).length ===
        0 &&
      (
        hydrated.portableBranchAccessSequences ??
        []
      ).length ===
        0 &&
      (
        hydrated.portableBusinessProfileSequences ??
        []
      ).length ===
        0 &&
      (
        hydrated.portablePricingPolicySequences ??
        []
      ).length ===
        0 &&
      (
        hydrated.portableStorageEntitlementSequences ??
        []
      ).length ===
        0,
      "Fresh hydration fabricated Control Center package or sequence state.",
    );

    console.log(
      "PASS: hydration creates no Control Center applied-package or sequence authority",
    );

    // --------------------------------------------------------
    // RAW USERDATA MUST NOT EXPOSE CONTROL-STORE PLAINTEXT
    // --------------------------------------------------------

    const plaintextFindings =
      await scanDirectoryForPlaintext(
        temporaryUserData,
        [
          ownerId,
          branchId,
          username,
          "CREDENTIAL-H6",
        ],
      );

    assert(
      plaintextFindings.length ===
        0,
      (
        "Hydrated authority plaintext was found under isolated userData: " +
        plaintextFindings.join(
          " | ",
        )
      ),
    );

    console.log(
      "PASS: hydrated branch authority is not present as plaintext in isolated userData",
    );

    // --------------------------------------------------------
    // EXACT RETRY MUST BE IDEMPOTENT
    // --------------------------------------------------------

    const replay =
      await applyFinoraPortableFreshDeviceHydrationState(
        hydration,
      );

    assert(
      replay.success &&
        replay.data?.status ===
          "ALREADY_HYDRATED",
      "Exact hydration replay was not idempotent.",
    );

    const afterReplayResult =
      await readFinoraControlStore();

    assert(
      afterReplayResult.success &&
        afterReplayResult.data !==
          undefined &&
      exactEqual(
        hydrated,
        afterReplayResult.data,
      ),
      "Exact hydration replay mutated Control Store state.",
    );

    console.log(
      "PASS: exact retry returns ALREADY_HYDRATED without mutation",
    );

    // --------------------------------------------------------
    // ALTERED REPLAY MUST FAIL CLOSED AND PRESERVE STATE
    // --------------------------------------------------------

    const alteredInput:
      FinoraPortableFreshDeviceHydrationApplyInput = {
        ...hydration,

        credential: {
          ...hydration.credential,

          fullName:
            "ALTERED H6 ADMIN",
        },

        appliedAt:
          "2026-09-20T10:01:00.000Z",
      };

    const alteredApply =
      await applyFinoraPortableFreshDeviceHydrationState(
        alteredInput,
      );

    assert(
      !alteredApply.success,
      "Altered hydration replay unexpectedly succeeded.",
    );

    const afterAlteredResult =
      await readFinoraControlStore();

    assert(
      afterAlteredResult.success &&
        afterAlteredResult.data !==
          undefined &&
      exactEqual(
        hydrated,
        afterAlteredResult.data,
      ),
      "Rejected altered hydration replay mutated durable state.",
    );

    console.log(
      "PASS: altered replay is rejected and durable Control Store remains unchanged",
    );

    // --------------------------------------------------------
    // PROFILE-ONLY CONVERGENCE
    //
    // Reproduce the Windows Laptop 1 condition:
    // core + credential authority already hydrated exactly,
    // but the signed Business Profile is still missing.
    // --------------------------------------------------------

    const profileOnlyControlFile =
      join(
        temporaryUserData,
        "FINORA",
        "control",
        "finora-control.bin",
      );

    await rm(
      profileOnlyControlFile,
      {
        force:
          true,
      },
    );

    const hydrationWithoutBusinessProfile =
      structuredClone(
        hydration,
      );

    delete hydrationWithoutBusinessProfile.businessProfile;

    const profileBaseApply =
      await applyFinoraPortableFreshDeviceHydrationState(
        hydrationWithoutBusinessProfile,
      );

    assert(
      profileBaseApply.success &&
        profileBaseApply.data?.status ===
          "HYDRATED",
      "Unable to create exact hydrated authority with the Business Profile intentionally absent.",
    );

    const profileOnlyBeforeResult =
      await readFinoraControlStore();

    assert(
      profileOnlyBeforeResult.success &&
        profileOnlyBeforeResult.data !==
          undefined,
      "Unable to read profile-only convergence fixture.",
    );

    const profileOnlyBefore =
      profileOnlyBeforeResult.data;

    assert(
      (
        profileOnlyBefore.businessProfiles ??
        []
      ).length ===
        0 &&
      (
        profileOnlyBefore.branchCredentials ??
        []
      ).length ===
        1 &&
      exactEqual(
        profileOnlyBefore.branchCredentials?.[0],
        hydration.credential,
      ),
      "Profile-only fixture is not exact hydrated authority with only Business Profile missing.",
    );

    const profileRepairApply =
      await applyFinoraPortableFreshDeviceHydrationState(
        hydration,
      );

    assert(
      profileRepairApply.success &&
        profileRepairApply.data?.status ===
          "HYDRATED",
      profileRepairApply.success
        ? "Profile-only convergence did not return HYDRATED."
        : (
            profileRepairApply.error ??
            "Profile-only convergence failed."
          ),
    );

    const profileOnlyAfterResult =
      await readFinoraControlStore();

    assert(
      profileOnlyAfterResult.success &&
        profileOnlyAfterResult.data !==
          undefined,
      "Unable to read profile-only converged Control Store.",
    );

    const profileOnlyAfter =
      profileOnlyAfterResult.data;

    assert(
      exactEqual(
        profileOnlyAfter.installation,
        profileOnlyBefore.installation,
      ) &&
      exactEqual(
        profileOnlyAfter.activations,
        profileOnlyBefore.activations,
      ) &&
      exactEqual(
        profileOnlyAfter.storageEntitlements,
        profileOnlyBefore.storageEntitlements,
      ) &&
      exactEqual(
        profileOnlyAfter.branchAccessGrants,
        profileOnlyBefore.branchAccessGrants,
      ) &&
      exactEqual(
        profileOnlyAfter.branchCredentials,
        profileOnlyBefore.branchCredentials,
      ) &&
      exactEqual(
        profileOnlyAfter.branchCredentialAuthorizationVerificationEvidence,
        profileOnlyBefore.branchCredentialAuthorizationVerificationEvidence,
      ) &&
      exactEqual(
        profileOnlyAfter.branchCredentialPortabilityAuthorities,
        profileOnlyBefore.branchCredentialPortabilityAuthorities,
      ) &&
      (
        profileOnlyAfter.businessProfiles ??
        []
      ).length ===
        1 &&
      exactEqual(
        profileOnlyAfter.businessProfiles?.[0],
        signedBusinessProfile,
      ),
      "Profile-only convergence changed existing authority or failed to persist the signed profile.",
    );

    assert(
      (
        profileOnlyAfter.appliedControlPackages ??
        []
      ).length ===
        0 &&
      (
        profileOnlyAfter.portableBusinessProfileSequences ??
        []
      ).length ===
        0,
      "Profile-only convergence fabricated BUSINESS_PROFILE package or sequence authority.",
    );

    console.log(
      "PASS: exact hydrated authority safely converges by adding only the missing signed Business Profile",
    );

    const mismatchedProfileInput:
      FinoraPortableFreshDeviceHydrationApplyInput = {
        ...hydration,

        businessProfile: {
          ...signedBusinessProfile,

          branchId:
            "BRANCH-H6-PROFILE-SCOPE-MISMATCH",
        },

        appliedAt:
          "2026-09-20T10:02:00.000Z",
      };

    const mismatchedProfileApply =
      await applyFinoraPortableFreshDeviceHydrationState(
        mismatchedProfileInput,
      );

    assert(
      !mismatchedProfileApply.success,
      "Mismatched Business Profile scope unexpectedly hydrated.",
    );

    const afterMismatchedProfileResult =
      await readFinoraControlStore();

    assert(
      afterMismatchedProfileResult.success &&
        afterMismatchedProfileResult.data !==
          undefined &&
      exactEqual(
        profileOnlyAfter,
        afterMismatchedProfileResult.data,
      ),
      "Rejected mismatched Business Profile scope mutated durable Control Store state.",
    );

    console.log(
      "PASS: mismatched Business Profile scope is rejected without durable mutation",
    );

    // --------------------------------------------------------
    // NATIVE BINDING ASSERTION
    // --------------------------------------------------------

    assert(
      hydrated.installation?.installationId ===
        nativeBinding.installationId &&
      hydrated.storageEntitlements[0]?.installationId ===
        nativeBinding.installationId &&
      hydrated.storageEntitlements[0]?.bindingKeyId ===
        nativeBinding.bindingKeyId &&
      hydrated.storageEntitlements[0]?.publicKeyFingerprint ===
        nativeBinding.publicKeyFingerprint,
      "Hydrated Control Store is not bound to current native device.",
    );

    console.log(
      "PASS: durable entitlement is bound to the current device P-256 identity",
    );

    // --------------------------------------------------------
    // EXACT-COMPATIBLE PARTIAL AUTHORITY CONVERGENCE
    //
    // Recreate the real production cutover shape:
    //
    // - installation exists
    // - activation exists
    // - entitlement exists
    // - access grant exists
    // - credential is still absent
    //
    // Hydration must add the missing credential without
    // replacing any exact-compatible authority record.
    // --------------------------------------------------------

    const isolatedControlFile =
      join(
        temporaryUserData,
        "FINORA",
        "control",
        "finora-control.bin",
      );

    await rm(
      isolatedControlFile,
      {
        force:
          true,
      },
    );

    const partialInstallationSeed =
      await saveFinoraInstallationIdentity(
        hydration.installation,
      );

    assert(
      partialInstallationSeed.success,
      partialInstallationSeed.error ??
        "Unable to seed partial installation authority.",
    );

    const partialActivationSeed =
      await saveFinoraBranchActivation(
        hydration.activation,
      );

    assert(
      partialActivationSeed.success,
      partialActivationSeed.error ??
        "Unable to seed partial activation authority.",
    );

    const partialEntitlementSeed =
      await saveFinoraStorageEntitlement(
        hydration.storageEntitlement,
      );

    assert(
      partialEntitlementSeed.success,
      partialEntitlementSeed.error ??
        "Unable to seed partial Storage Entitlement authority.",
    );

    const partialAccessSeed =
      await saveFinoraBranchAccessGrant(
        hydration.branchAccessGrant,
      );

    assert(
      partialAccessSeed.success,
      partialAccessSeed.error ??
        "Unable to seed partial Branch Access authority.",
    );

    const partialBeforeResult =
      await readFinoraControlStore();

    assert(
      partialBeforeResult.success &&
        partialBeforeResult.data !==
          undefined,
      "Unable to read exact-compatible partial authority fixture.",
    );

    const partialBefore =
      partialBeforeResult.data;

    assert(
      exactEqual(
        partialBefore.installation,
        hydration.installation,
      ) &&
      partialBefore.activations.length ===
        1 &&
      exactEqual(
        partialBefore.activations[0],
        hydration.activation,
      ) &&
      partialBefore.storageEntitlements.length ===
        1 &&
      exactEqual(
        partialBefore.storageEntitlements[0],
        hydration.storageEntitlement,
      ) &&
      (
        partialBefore.branchAccessGrants ??
        []
      ).length ===
        1 &&
      exactEqual(
        partialBefore.branchAccessGrants?.[0],
        hydration.branchAccessGrant,
      ) &&
      (
        partialBefore.branchCredentials ??
        []
      ).length ===
        0,
      "Partial convergence fixture does not match the required credential-missing state.",
    );

    const partialApply =
      await applyFinoraPortableFreshDeviceHydrationState(
        hydration,
      );

    assert(
      partialApply.success &&
        partialApply.data?.status ===
          "HYDRATED",
      partialApply.success
        ? "Exact-compatible partial convergence did not return HYDRATED."
        : (
            partialApply.error ??
            "Exact-compatible partial convergence failed."
          ),
    );

    const partialAfterResult =
      await readFinoraControlStore();

    assert(
      partialAfterResult.success &&
        partialAfterResult.data !==
          undefined,
      "Unable to read converged partial authority state.",
    );

    const partialAfter =
      partialAfterResult.data;

    assert(
      exactEqual(
        partialAfter.installation,
        partialBefore.installation,
      ) &&
      exactEqual(
        partialAfter.activations,
        partialBefore.activations,
      ) &&
      exactEqual(
        partialAfter.storageEntitlements,
        partialBefore.storageEntitlements,
      ) &&
      exactEqual(
        partialAfter.branchAccessGrants,
        partialBefore.branchAccessGrants,
      ) &&
      (
        partialAfter.branchCredentials ??
        []
      ).length ===
        1 &&
      exactEqual(
        partialAfter.branchCredentials?.[0],
        hydration.credential,
      ),
      "Partial convergence replaced existing authority or failed to add the missing credential.",
    );

    console.log(
      "PASS: exact-compatible partial authority converges by adding the missing credential",
    );

    // --------------------------------------------------------
    // MISMATCHED PARTIAL AUTHORITY MUST FAIL CLOSED
    // --------------------------------------------------------

    await rm(
      isolatedControlFile,
      {
        force:
          true,
      },
    );

    const mismatchInstallationSeed =
      await saveFinoraInstallationIdentity(
        hydration.installation,
      );

    assert(
      mismatchInstallationSeed.success,
      mismatchInstallationSeed.error ??
        "Unable to seed mismatch installation authority.",
    );

    const mismatchedActivation = {
      ...hydration.activation,

      activationId:
        "ACTIVATION-H6-PARTIAL-MISMATCH",
    };

    const mismatchActivationSeed =
      await saveFinoraBranchActivation(
        mismatchedActivation,
      );

    assert(
      mismatchActivationSeed.success,
      mismatchActivationSeed.error ??
        "Unable to seed mismatched activation authority.",
    );

    const mismatchBeforeResult =
      await readFinoraControlStore();

    assert(
      mismatchBeforeResult.success &&
        mismatchBeforeResult.data !==
          undefined,
      "Unable to read mismatched partial authority fixture.",
    );

    const mismatchBefore =
      mismatchBeforeResult.data;

    const mismatchApply =
      await applyFinoraPortableFreshDeviceHydrationState(
        hydration,
      );

    assert(
      !mismatchApply.success,
      "Mismatched partial authority unexpectedly hydrated.",
    );

    const mismatchAfterResult =
      await readFinoraControlStore();

    assert(
      mismatchAfterResult.success &&
        mismatchAfterResult.data !==
          undefined &&
      exactEqual(
        mismatchBefore,
        mismatchAfterResult.data,
      ),
      "Rejected mismatched partial authority mutated durable Control Store state.",
    );

    console.log(
      "PASS: mismatched partial authority is rejected without durable mutation",
    );

    console.log(
      "PASS: STEP A3-A2-H6 REAL ENCRYPTED CONTROL-STORE ATOMIC HYDRATION PROOF",
    );
  }
  catch (
    error
  ) {
    failure =
      error;

    console.error(
      error,
    );

    process.exitCode =
      1;
  }
  finally {
    // Electron may still have transient files open on Windows.
    // Cleanup is best-effort and is not part of source correctness.
    try {
      await rm(
        temporaryUserData,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
    catch {
      // Best-effort isolated-test cleanup only.
    }

    app.quit();
  }

  if (failure) {
    throw failure;
  }
}

void runSelfTest().catch(
  (
    error,
  ) => {
    console.error(
      error,
    );

    process.exitCode =
      1;

    app.quit();
  },
);