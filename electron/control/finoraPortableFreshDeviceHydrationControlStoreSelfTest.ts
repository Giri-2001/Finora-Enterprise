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
} from "./finoraControlStore.js";

import type {
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