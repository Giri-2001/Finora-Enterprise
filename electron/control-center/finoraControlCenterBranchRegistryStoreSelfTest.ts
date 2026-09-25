/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER — BRANCH REGISTRY STORE SELF TEST

   VERIFY:

   - Isolated Electron userData
   - Real Electron safeStorage runtime
   - Dynamic validity derives 365 -> 355 days after 10 days
   - First branch registration persists encrypted registry
   - Exact same registration is idempotent
   - Second independent branch registers successfully
   - Immutable existing branch identity mutation is rejected
   - Duplicate Branch ID is rejected
   - Duplicate Branch Code inside one Business is rejected
   - Duplicate Installation ID is rejected
   - Duplicate recipient key / binding identity is rejected
   - Rejected registrations do not mutate registry bytes
   - Encrypted malformed registry schema fails closed
   - Corrupt ciphertext fails closed
   - Registry recovery fixture restores original valid bytes
   - Successful / rejected paths leave no temporary files

   IMPORTANT:

   - No renderer.
   - No IPC.
   - No production Control Center userData.
   - No real provisioned branch data.
   - No recipient private key is persisted in Branch Registry.
============================================================ */

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "../control/finoraBranchCertificationCrypto.js";
import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  generateFinoraWindowsInstallationBindingMaterial,
  toFinoraWindowsInstallationBindingPublic,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  calculateFinoraControlCenterBranchValidity,
} from "./finoraControlCenterBranchValidity.js";

import {
  loadFinoraControlCenterBranchRegistry,
  registerFinoraControlCenterBranch,
} from "./finoraControlCenterBranchRegistryStore.js";

import { authorizeFinoraControlCenterRegistryBoundIssuanceTarget } from "./finoraControlCenterBranchIssuanceAuthorization.js";

import type {
  FinoraControlCenterBranchProvisionedIdentity,
} from "./finoraControlCenterBranchRegistry.types.js";

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

// ============================================================
// EXPECT REJECTION
// ============================================================

async function expectRejection(
  operation:
    () => Promise<unknown>,

  expectedMessagePart:
    string,

  label:
    string,
): Promise<void> {

  let rejection:
    unknown;

  try {
    await operation();
  } catch (error) {
    rejection =
      error;
  }

  assert(
    rejection instanceof
      Error,
    `${label} unexpectedly succeeded.`,
  );

  assert(
    rejection.message.includes(
      expectedMessagePart,
    ),
    `${label} rejected with unexpected error: ${rejection.message}`,
  );
}

// ============================================================
// IDENTITY FIXTURE
// ============================================================

function createIdentity(
  input: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    businessCode:
      string;

    branchCode:
      string;

    bindingMaterial:
      ReturnType<
        typeof generateFinoraWindowsInstallationBindingMaterial
      >;

    installationIdOverride?:
      string;
  },
): FinoraControlCenterBranchProvisionedIdentity {

  const publicBinding =
    toFinoraWindowsInstallationBindingPublic(
      input.bindingMaterial,
    );

  return {
    ownerId:
      input.ownerId,

    businessId:
      input.businessId,

    branchId:
      input.branchId,

    businessCode:
      input.businessCode,

    branchCode:
      input.branchCode,

    installation: {
      installationId:
        input.installationIdOverride ??
        publicBinding.installationId,

      bindingKeyId:
        publicBinding.bindingKeyId,

      platform:
        publicBinding.platform,

      algorithm:
        publicBinding.algorithm,

      publicKeyFormat:
        publicBinding.publicKeyFormat,

      publicKey:
        publicBinding.publicKey,

      fingerprintAlgorithm:
        publicBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        publicBinding.publicKeyFingerprint,

      bindingCreatedAt:
        publicBinding.createdAt,
    },
  };
}

// ============================================================
// RUN
// ============================================================

async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-control-center-branch-registry-selftest-",
      ),
    );

  app.setPath(
    "userData",
    temporaryUserData,
  );

  try {

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable for Branch Registry selftest.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // ========================================================
    // SMART VALIDITY
    // ========================================================

    const validity =
      calculateFinoraControlCenterBranchValidity(
        "2027-09-10T12:00:00.000Z",
        new Date(
          "2026-09-20T12:00:00.000Z",
        ),
      );

    assert(
      validity.expired ===
        false &&
      validity.remainingDays ===
        355,
      `Expected 355 remaining days, received ${validity.remainingDays}.`,
    );

    console.log(
      "PASS: 365-day validity derives 355 remaining days after exactly 10 days",
    );

    const expiredValidity =
      calculateFinoraControlCenterBranchValidity(
        "2027-09-10T12:00:00.000Z",
        new Date(
          "2027-09-10T12:00:00.000Z",
        ),
      );

    assert(
      expiredValidity.expired ===
        true &&
      expiredValidity.remainingDays ===
        0,
      "Exact expiry did not derive zero remaining days.",
    );

    console.log(
      "PASS: exact expiry derives zero remaining days",
    );

    // ========================================================
    // BINDING FIXTURES
    // ========================================================

    const bindingA =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          "2026-09-10T12:00:00.000Z",
        ),
      );

    const bindingB =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          "2026-09-10T12:01:00.000Z",
        ),
      );

    const bindingC =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          "2026-09-10T12:02:00.000Z",
        ),
      );

    const branchA =
      createIdentity({
        ownerId:
          "OWNER-SELFTEST-A",

        businessId:
          "BUSINESS-SELFTEST-A",

        branchId:
          "BRANCH-SELFTEST-A-001",

        businessCode:
          "STA",

        branchCode:
          "STA01",

        bindingMaterial:
          bindingA,
      });

    const branchB =
      createIdentity({
        ownerId:
          "OWNER-SELFTEST-B",

        businessId:
          "BUSINESS-SELFTEST-B",

        branchId:
          "BRANCH-SELFTEST-B-001",

        businessCode:
          "STB",

        branchCode:
          "STB01",

        bindingMaterial:
          bindingB,
      });

    // ========================================================
    // FIRST REGISTRATION
    // ========================================================

    const first =
      await registerFinoraControlCenterBranch({
        identity:
          branchA,
      });

    assert(
      first.created ===
        true,
      "First Branch Registry registration was not created.",
    );

    const registryAfterFirst =
      await loadFinoraControlCenterBranchRegistry();

    assert(
      registryAfterFirst !==
        undefined &&
      registryAfterFirst.branches.length ===
        1 &&
      registryAfterFirst.branches[0].identity.branchId ===
        branchA.branchId,
      "First persisted Branch Registry record is incorrect.",
    );

    console.log(
      "PASS: first branch registered and read back",
    );

    const firstRecord =
      registryAfterFirst.branches[0];

    assert(
      firstRecord.authorizedDevices.length ===
        1 &&
      firstRecord.authorizedDevices[0].evidenceSource ===
        "INITIAL_PROVISIONING" &&
      JSON.stringify(
        firstRecord.authorizedDevices[0].installation,
      ) ===
        JSON.stringify(
          branchA.installation,
        ) &&
      firstRecord.authorizedDevices[0].firstObservedAt ===
        firstRecord.createdAt &&
      firstRecord.authorizedDevices[0].updatedAt ===
        firstRecord.createdAt,
      "New Branch Registry record did not seed the exact initial provisioned authorized device.",
    );

    console.log(
      "PASS: initial provisioned installation seeded as the exact authorized device",
    );

    // ========================================================
    // ENCRYPTED PERSISTENCE
    // ========================================================

    const controlCenterDirectory =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
      );

    const registryPath =
      join(
        controlCenterDirectory,
        "finora-control-center-branch-registry.bin",
      );

    const encryptedAfterFirst =
      await readFile(
        registryPath,
      );

    assert(
      encryptedAfterFirst.length >
        0,
      "Persisted Branch Registry ciphertext is empty.",
    );

    assert(
      !encryptedAfterFirst.includes(
        Buffer.from(
          branchA.ownerId,
          "utf8",
        ),
      ),
      "Persisted Branch Registry unexpectedly contains plaintext Owner ID.",
    );

    assert(
      !encryptedAfterFirst.includes(
        Buffer.from(
          branchA.branchId,
          "utf8",
        ),
      ),
      "Persisted Branch Registry unexpectedly contains plaintext Branch ID.",
    );

    console.log(
      "PASS: persisted Branch Registry is encrypted at rest",
    );

    // ========================================================
    // IDEMPOTENT EXACT REGISTRATION
    // ========================================================

    const beforeIdempotent =
      await readFile(
        registryPath,
      );

    const repeated =
      await registerFinoraControlCenterBranch({
        identity:
          branchA,
      });

    assert(
      repeated.created ===
        false &&
      repeated.record.identity.branchId ===
        branchA.branchId,
      "Exact Branch Registry re-registration was not idempotent.",
    );

    const afterIdempotent =
      await readFile(
        registryPath,
      );

    assert(
      beforeIdempotent.equals(
        afterIdempotent,
      ),
      "Idempotent Branch Registry registration rewrote persisted registry bytes.",
    );

    console.log(
      "PASS: exact branch registration is idempotent with zero registry mutation",
    );

    // ========================================================
    // BRANCH CERTIFICATION ONE-TIME PIN
    // ========================================================

    const branchCertificationMaterial3D3C =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-17T02:00:00.000Z",
        ),
      );

    const branchCertificationPublicKey3D3C =
      toFinoraBranchCertificationPublicKey(
        branchCertificationMaterial3D3C,
      );

    const registryBytesBeforeCertificationPin3D3C =
      await readFile(
        registryPath,
      );

    const certificationPinResult3D3C =
      await registerFinoraControlCenterBranch({
        identity:
          firstRecord.identity,

        branchCertificationPublicKey:
          branchCertificationPublicKey3D3C,
      });

    const registryBytesAfterCertificationPin3D3C =
      await readFile(
        registryPath,
      );

    assert(
      certificationPinResult3D3C.created ===
        false &&
      certificationPinResult3D3C.record.branchCertificationPublicKey?.keyId ===
        branchCertificationPublicKey3D3C.keyId &&
      !registryBytesBeforeCertificationPin3D3C.equals(
        registryBytesAfterCertificationPin3D3C,
      ),
      "Authentic Branch Certification authority was not pinned exactly once onto the existing branch.",
    );

    console.log(
      "PASS: Branch Certification authority pinned once onto an existing exact branch",
    );

    const bytesBeforeExactCertificationRetry3D3C =
      Buffer.from(
        registryBytesAfterCertificationPin3D3C,
      );

    const exactCertificationRetry3D3C =
      await registerFinoraControlCenterBranch({
        identity:
          firstRecord.identity,

        branchCertificationPublicKey:
          branchCertificationPublicKey3D3C,
      });

    const bytesAfterExactCertificationRetry3D3C =
      await readFile(
        registryPath,
      );

    assert(
      exactCertificationRetry3D3C.created ===
        false &&
      exactCertificationRetry3D3C.record.branchCertificationPublicKey?.keyId ===
        branchCertificationPublicKey3D3C.keyId &&
      bytesBeforeExactCertificationRetry3D3C.equals(
        bytesAfterExactCertificationRetry3D3C,
      ),
      "Exact Branch Certification pin retry rewrote registry state.",
    );

    console.log(
      "PASS: exact Branch Certification pin retry is byte-stable",
    );

    const bytesBeforeLegacyRegistrationRetry3D3C =
      Buffer.from(
        bytesAfterExactCertificationRetry3D3C,
      );

    const legacyRegistrationRetry3D3C =
      await registerFinoraControlCenterBranch({
        identity:
          firstRecord.identity,
      });

    const bytesAfterLegacyRegistrationRetry3D3C =
      await readFile(
        registryPath,
      );

    assert(
      legacyRegistrationRetry3D3C.record.branchCertificationPublicKey?.keyId ===
        branchCertificationPublicKey3D3C.keyId &&
      bytesBeforeLegacyRegistrationRetry3D3C.equals(
        bytesAfterLegacyRegistrationRetry3D3C,
      ),
      "Legacy exact registration removed or rewrote pinned Branch Certification authority.",
    );

    console.log(
      "PASS: registration without certification preserves an existing pinned authority",
    );

    const conflictingCertification3D3C =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            "2026-09-17T02:01:00.000Z",
          ),
        ),
      );

    const bytesBeforeConflictingCertification3D3C =
      await readFile(
        registryPath,
      );

    let conflictingCertificationRejected3D3C =
      false;

    try {

      await registerFinoraControlCenterBranch({
        identity:
          firstRecord.identity,

        branchCertificationPublicKey:
          conflictingCertification3D3C,
      });

    } catch {
      conflictingCertificationRejected3D3C =
        true;
    }

    const bytesAfterConflictingCertification3D3C =
      await readFile(
        registryPath,
      );

    assert(
      conflictingCertificationRejected3D3C &&
      bytesBeforeConflictingCertification3D3C.equals(
        bytesAfterConflictingCertification3D3C,
      ),
      "Conflicting Branch Certification authority was not rejected with zero registry mutation.",
    );

    console.log(
      "PASS: conflicting Branch Certification authority rejected with zero registry mutation",
    );

    // ========================================================
    // SECOND BRANCH
    // ========================================================

    const second =
      await registerFinoraControlCenterBranch({
        identity:
          branchB,
      });

    assert(
      second.created ===
        true,
      "Second independent branch was not created.",
    );

    const registryAfterSecond =
      await loadFinoraControlCenterBranchRegistry();

    assert(
      registryAfterSecond !==
        undefined &&
      registryAfterSecond.branches.length ===
        2 &&
      registryAfterSecond.branches.some(
        (record) =>
          record.identity.branchId ===
            branchA.branchId,
      ) &&
      registryAfterSecond.branches.some(
        (record) =>
          record.identity.branchId ===
            branchB.branchId,
      ),
      "Two-branch Branch Registry state is incorrect.",
    );

    console.log(
      "PASS: second independent branch registered successfully",
    );

    const stableRegistryBytes =
      await readFile(
        registryPath,
      );

    // ========================================================
    // IMMUTABLE SAME-SCOPE MUTATION
    // ========================================================

    const mutatedSameScope:
      FinoraControlCenterBranchProvisionedIdentity = {
        ...branchA,

        businessCode:
          "MUTATED",
      };

    await expectRejection(
      () =>
        registerFinoraControlCenterBranch({
          identity:
            mutatedSameScope,
        }),
      "immutable identity change",
      "Immutable same-scope mutation",
    );

    assert(
      (
        await readFile(
          registryPath,
        )
      ).equals(
        stableRegistryBytes,
      ),
      "Immutable identity rejection mutated registry bytes.",
    );

    console.log(
      "PASS: immutable existing branch identity mutation rejected with zero registry mutation",
    );

    // ========================================================
    // DUPLICATE BRANCH ID
    // ========================================================

    const duplicateBranchId =
      createIdentity({
        ownerId:
          "OWNER-SELFTEST-C",

        businessId:
          "BUSINESS-SELFTEST-C",

        branchId:
          branchA.branchId,

        businessCode:
          "STC",

        branchCode:
          "STC01",

        bindingMaterial:
          bindingC,
      });

    await expectRejection(
      () =>
        registerFinoraControlCenterBranch({
          identity:
            duplicateBranchId,
        }),
      "Branch ID already assigned",
      "Duplicate Branch ID",
    );

    console.log(
      "PASS: duplicate Branch ID rejected",
    );

    // ========================================================
    // DUPLICATE BRANCH CODE IN SAME BUSINESS
    // ========================================================

    const duplicateBranchCode =
      createIdentity({
        ownerId:
          "OWNER-SELFTEST-A",

        businessId:
          branchA.businessId,

        branchId:
          "BRANCH-SELFTEST-A-002",

        businessCode:
          branchA.businessCode,

        branchCode:
          branchA.branchCode,

        bindingMaterial:
          bindingC,
      });

    await expectRejection(
      () =>
        registerFinoraControlCenterBranch({
          identity:
            duplicateBranchCode,
        }),
      "Branch Code already assigned",
      "Duplicate Branch Code",
    );

    console.log(
      "PASS: duplicate Branch Code inside one Business rejected",
    );

    // ========================================================
    // DUPLICATE INSTALLATION ID
    // ========================================================

    const duplicateInstallation =
      createIdentity({
        ownerId:
          "OWNER-SELFTEST-D",

        businessId:
          "BUSINESS-SELFTEST-D",

        branchId:
          "BRANCH-SELFTEST-D-001",

        businessCode:
          "STD",

        branchCode:
          "STD01",

        bindingMaterial:
          bindingC,

        installationIdOverride:
          branchA.installation.installationId,
      });

    await expectRejection(
      () =>
        registerFinoraControlCenterBranch({
          identity:
            duplicateInstallation,
        }),
      "Installation ID already assigned",
      "Duplicate Installation ID",
    );

    console.log(
      "PASS: duplicate Installation ID rejected",
    );

    // ========================================================
    // DUPLICATE RECIPIENT CRYPTO IDENTITY
    //
    // Use branch A's exact public key/binding under a different
    // installationId and branch scope. The installationId itself
    // is therefore unique, so the cryptographic binding collision
    // must reject it.
    // ========================================================

    const duplicateRecipientBinding:
      FinoraControlCenterBranchProvisionedIdentity = {

        ownerId:
          "OWNER-SELFTEST-E",

        businessId:
          "BUSINESS-SELFTEST-E",

        branchId:
          "BRANCH-SELFTEST-E-001",

        businessCode:
          "STE",

        branchCode:
          "STE01",

        installation: {
          ...branchA.installation,

          installationId:
            "FINORA-INSTALLATION-SELFTEST-UNIQUE-E",
        },
      };

    await expectRejection(
      () =>
        registerFinoraControlCenterBranch({
          identity:
            duplicateRecipientBinding,
        }),
      "Binding Key ID already assigned",
      "Duplicate recipient binding",
    );

    console.log(
      "PASS: duplicate recipient binding/fingerprint/public-key identity rejected",
    );

    assert(
      (
        await readFile(
          registryPath,
        )
      ).equals(
        stableRegistryBytes,
      ),
      "Rejected collision paths mutated persisted Branch Registry bytes.",
    );

    console.log(
      "PASS: all rejected registration collisions preserved registry bytes",
    );
    // ========================================================
    // SIGNED ISSUANCE REGISTRY AUTHORIZATION
    // ========================================================

    const authorizationTarget = {
      ownerId:
        branchA.ownerId,

      businessId:
        branchA.businessId,

      branchId:
        branchA.branchId,

      installationId:
        branchA.installation.installationId,

      bindingKeyId:
        branchA.installation.bindingKeyId,

      fingerprintAlgorithm:
        branchA.installation.fingerprintAlgorithm,

      publicKeyFingerprint:
        branchA.installation.publicKeyFingerprint,
    };

    const authorizationBytesBefore =
      await readFile(
        registryPath,
      );

    await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
      authorizationTarget,
    );

    assert(
      (
        await readFile(
          registryPath,
        )
      ).equals(
        authorizationBytesBefore,
      ),
      "Valid Branch Registry authorization mutated persisted registry bytes.",
    );

    console.log(
      "PASS: valid registered Branch Registry target authorized with zero registry mutation",
    );

    // --------------------------------------------------------
    // WRONG / UNREGISTERED SCOPE
    // --------------------------------------------------------

    await expectRejection(
      () =>
        authorizeFinoraControlCenterRegistryBoundIssuanceTarget({
          ...authorizationTarget,

          ownerId:
            `${authorizationTarget.ownerId}-UNREGISTERED`,
        }),
      "not present in the authoritative Branch Registry",
      "Wrong Owner scope authorization",
    );

    await expectRejection(
      () =>
        authorizeFinoraControlCenterRegistryBoundIssuanceTarget({
          ...authorizationTarget,

          businessId:
            `${authorizationTarget.businessId}-UNREGISTERED`,
        }),
      "not present in the authoritative Branch Registry",
      "Wrong Business scope authorization",
    );

    await expectRejection(
      () =>
        authorizeFinoraControlCenterRegistryBoundIssuanceTarget({
          ...authorizationTarget,

          branchId:
            `${authorizationTarget.branchId}-UNREGISTERED`,
        }),
      "not present in the authoritative Branch Registry",
      "Unregistered Branch authorization",
    );

    console.log(
      "PASS: unregistered owner/business/branch scopes rejected",
    );

    // --------------------------------------------------------
    // IMMUTABLE INSTALLATION IDENTITY
    // --------------------------------------------------------

    await expectRejection(
      () =>
        authorizeFinoraControlCenterRegistryBoundIssuanceTarget({
          ...authorizationTarget,

          installationId:
            `${authorizationTarget.installationId}-MISMATCH`,
        }),
      "does not exactly match the authoritative Branch Registry identity",
      "Wrong Installation ID authorization",
    );

    await expectRejection(
      () =>
        authorizeFinoraControlCenterRegistryBoundIssuanceTarget({
          ...authorizationTarget,

          bindingKeyId:
            `${authorizationTarget.bindingKeyId}-MISMATCH`,
        }),
      "does not exactly match the authoritative Branch Registry identity",
      "Wrong Binding Key ID authorization",
    );

    await expectRejection(
      () =>
        authorizeFinoraControlCenterRegistryBoundIssuanceTarget({
          ...authorizationTarget,

          fingerprintAlgorithm:
            "SHA-512",
        }),
      "does not exactly match the authoritative Branch Registry identity",
      "Wrong Fingerprint Algorithm authorization",
    );

    const mismatchedFingerprint =
      authorizationTarget.publicKeyFingerprint ===
        "0".repeat(
          64,
        )
        ? "1".repeat(
            64,
          )
        : "0".repeat(
            64,
          );

    await expectRejection(
      () =>
        authorizeFinoraControlCenterRegistryBoundIssuanceTarget({
          ...authorizationTarget,

          publicKeyFingerprint:
            mismatchedFingerprint,
        }),
      "does not exactly match the authoritative Branch Registry identity",
      "Wrong Public Key Fingerprint authorization",
    );

    console.log(
      "PASS: installation/binding/fingerprint mismatches rejected",
    );

    // --------------------------------------------------------
    // AUTHORIZATION IS READ ONLY
    // --------------------------------------------------------

    const authorizationBytesAfter =
      await readFile(
        registryPath,
      );

    assert(
      authorizationBytesBefore.equals(
        authorizationBytesAfter,
      ),
      "Branch Registry authorization paths mutated persisted registry bytes.",
    );

    console.log(
      "PASS: all authorization success/rejection paths preserved registry bytes",
    );

    // ========================================================
    // ENCRYPTED MALFORMED SCHEMA — FAIL CLOSED
    // ========================================================

    // ========================================================
    // ENCRYPTED V1 -> V2 -> V3 MIGRATION
    // ========================================================

    const stableRegistryPlaintext =
      safeStorage.decryptString(
        stableRegistryBytes,
      );

    const stableRegistryValue =
      JSON.parse(
        stableRegistryPlaintext,
      ) as {
        branches:
          Array<Record<string, unknown>>;
        createdAt:
          string;
        updatedAt:
          string;
        schemaVersion:
          number;
      };

    assert(
      stableRegistryValue.schemaVersion ===
        3 &&
      stableRegistryValue.branches.length ===
        2,
      "Known-good V3 Branch Registry fixture is invalid before V1 migration proof.",
    );

    const legacyV1Registry = {
      branches:
        stableRegistryValue.branches.map(
          (branch) => {

            const legacyBranch = {
              ...branch,
            };

            delete legacyBranch.authorizedDevices;
            delete legacyBranch.branchCertificationPublicKey;

            legacyBranch.schemaVersion =
              1;

            return legacyBranch;
          },
        ),

      createdAt:
        stableRegistryValue.createdAt,

      updatedAt:
        stableRegistryValue.updatedAt,

      schemaVersion:
        1,
    };

    const encryptedLegacyV1Registry =
      safeStorage.encryptString(
        JSON.stringify(
          legacyV1Registry,
        ),
      );

    await writeFile(
      registryPath,
      encryptedLegacyV1Registry,
    );

    const migratedRegistry =
      await loadFinoraControlCenterBranchRegistry();

    assert(
      migratedRegistry !==
        undefined &&
      migratedRegistry.schemaVersion ===
        3 &&
      migratedRegistry.branches.length ===
        2 &&
      migratedRegistry.branches.every(
        (branch) =>
          branch.schemaVersion ===
            3 &&
          branch.authorizedDevices.length ===
            1 &&
          branch.authorizedDevices[0].evidenceSource ===
            "INITIAL_PROVISIONING" &&
          JSON.stringify(
            branch.authorizedDevices[0].installation,
          ) ===
            JSON.stringify(
              branch.identity.installation,
            ) &&
          branch.authorizedDevices[0].firstObservedAt ===
            branch.createdAt &&
          branch.authorizedDevices[0].updatedAt ===
            branch.createdAt,
      ),
      "Encrypted V1 Branch Registry did not migrate through V2 to canonical V3 authorized-device state.",
    );

    const migratedAsLegacy = {
      branches:
        migratedRegistry.branches.map(
          (branch) => {

            const legacyBranch =
              JSON.parse(
                JSON.stringify(
                  branch,
                ),
              ) as
                Record<string, unknown>;

            delete legacyBranch.authorizedDevices;
            delete legacyBranch.branchCertificationPublicKey;

            legacyBranch.schemaVersion =
              1;

            return legacyBranch;
          },
        ),

      createdAt:
        migratedRegistry.createdAt,

      updatedAt:
        migratedRegistry.updatedAt,

      schemaVersion:
        1,
    };

    assert(
      JSON.stringify(
        migratedAsLegacy,
      ) ===
        JSON.stringify(
          legacyV1Registry,
        ),
      "V1 -> V2 -> V3 migration changed pre-existing Branch Registry data.",
    );

    const migratedRegistryBytes =
      await readFile(
        registryPath,
      );

    const persistedMigratedValue =
      JSON.parse(
        safeStorage.decryptString(
          migratedRegistryBytes,
        ),
      ) as {
        branches:
          Array<{
            schemaVersion:
              number;
            authorizedDevices:
              unknown[];
          }>;
        schemaVersion:
          number;
      };

    assert(
      persistedMigratedValue.schemaVersion ===
        3 &&
      persistedMigratedValue.branches.every(
        (branch) =>
          branch.schemaVersion ===
            3 &&
          Array.isArray(
            branch.authorizedDevices,
          ) &&
          branch.authorizedDevices.length ===
            1,
      ),
      "Migrated V3 Branch Registry was not persisted after V1 load.",
    );

    const bytesBeforeSecondMigratedLoad =
      Buffer.from(
        migratedRegistryBytes,
      );

    const secondMigratedLoad =
      await loadFinoraControlCenterBranchRegistry();

    const bytesAfterSecondMigratedLoad =
      await readFile(
        registryPath,
      );

    assert(
      secondMigratedLoad !==
        undefined &&
      secondMigratedLoad.schemaVersion ===
        3 &&
      bytesBeforeSecondMigratedLoad.equals(
        bytesAfterSecondMigratedLoad,
      ),
      "Canonical migrated V3 registry was rewritten on the second load.",
    );

    console.log(
      "PASS: encrypted V1 registry migrated through V2 to V3 with legacy data preserved",
    );

    // ========================================================
    // MALFORMED AUTHORIZED-DEVICE EVIDENCE — FAIL CLOSED
    // ========================================================

    const malformedAuthorizedDeviceRegistry =
      JSON.parse(
        safeStorage.decryptString(
          migratedRegistryBytes,
        ),
      ) as {
        branches:
          Array<{
            authorizedDevices:
              unknown[];
          }>;
      };

    assert(
      malformedAuthorizedDeviceRegistry.branches.length >
        0 &&
      malformedAuthorizedDeviceRegistry.branches[0].authorizedDevices.length ===
        1,
      "Expected one migrated authorized-device fixture before malformed proof.",
    );

    malformedAuthorizedDeviceRegistry.branches[0].authorizedDevices.push(
      JSON.parse(
        JSON.stringify(
          malformedAuthorizedDeviceRegistry.branches[0].authorizedDevices[0],
        ),
      ),
    );

    await writeFile(
      registryPath,
      safeStorage.encryptString(
        JSON.stringify(
          malformedAuthorizedDeviceRegistry,
        ),
      ),
    );

    await expectRejection(
      () =>
        loadFinoraControlCenterBranchRegistry(),
      "exactly one initial provisioned authorized device",
      "Duplicate authorized-device evidence",
    );

    console.log(
      "PASS: duplicate authorized-device evidence fails closed",
    );

    await writeFile(
      registryPath,
      migratedRegistryBytes,
    );

    const malformedEncrypted =
      safeStorage.encryptString(
        JSON.stringify({
          branches:
            [],

          createdAt:
            "INVALID",

          updatedAt:
            "INVALID",

          schemaVersion:
            1,
        }),
      );

    await writeFile(
      registryPath,
      malformedEncrypted,
    );

    await expectRejection(
      () =>
        loadFinoraControlCenterBranchRegistry(),
      "persistence schema is invalid",
      "Encrypted malformed Branch Registry schema",
    );

    console.log(
      "PASS: encrypted malformed Branch Registry schema fails closed",
    );

    // Restore known-good encrypted state.
    await writeFile(
      registryPath,
      stableRegistryBytes,
    );

    const restoredRegistry =
      await loadFinoraControlCenterBranchRegistry();

    assert(
      restoredRegistry !==
        undefined &&
      restoredRegistry.branches.length ===
        2,
      "Known-good Branch Registry fixture did not restore after malformed-schema test.",
    );

    console.log(
      "PASS: known-good encrypted registry restored after malformed-schema proof",
    );

    // ========================================================
    // CORRUPT CIPHERTEXT — FAIL CLOSED
    // ========================================================

    await writeFile(
      registryPath,
      Buffer.from(
        "FINORA-BRANCH-REGISTRY-CORRUPT-CIPHERTEXT",
        "utf8",
      ),
    );

    await expectRejection(
      () =>
        loadFinoraControlCenterBranchRegistry(),
      "cannot be decrypted",
      "Corrupt Branch Registry ciphertext",
    );

    console.log(
      "PASS: corrupt Branch Registry ciphertext fails closed",
    );

    // Restore valid state before final filesystem audit.
    await writeFile(
      registryPath,
      stableRegistryBytes,
    );

    const finalRegistry =
      await loadFinoraControlCenterBranchRegistry();

    assert(
      finalRegistry !==
        undefined &&
      finalRegistry.branches.length ===
        2,
      "Final restored Branch Registry is invalid.",
    );

    // ========================================================
    // TEMP FILE CLEANUP
    // ========================================================

    const directoryEntries =
      await readdir(
        controlCenterDirectory,
      );

    const temporaryEntries =
      directoryEntries.filter(
        (entry) =>
          entry.endsWith(
            ".tmp",
          ),
      );

    assert(
      temporaryEntries.length ===
        0,
      `Branch Registry selftest left temporary files: ${temporaryEntries.join(", ")}`,
    );

    console.log(
      "PASS: Branch Registry runtime paths left no temporary files",
    );

    // ========================================================
    // FINAL
    // ========================================================

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA CONTROL CENTER BRANCH REGISTRY STORE SELFTEST",
    );

    console.log(
      "============================================================",
    );

  } finally {

    await rm(
      temporaryUserData,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    console.log(
      "PASS: isolated temporary Branch Registry userData deleted",
    );
  }
}

// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {
      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {

      console.error(
        "FAIL: FINORA CONTROL CENTER BRANCH REGISTRY STORE SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );