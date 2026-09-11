/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER — BRANCH REGISTRY STORE

   MODULE  : Control Center
   LAYER   : Privileged Main-Process Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist provisioned FINORA branch identities
   - Preserve recipient public installation-binding authority
   - Provide future Admin Panel branch-card registry reads
   - Reject immutable branch identity conflicts
   - Reject duplicate installation / binding identities
   - Protect complete registry state with Electron safeStorage
   - Replace registry atomically
   - Serialize same-process registration mutations

   SECURITY:

   - MAIN PROCESS ONLY.
   - NO renderer exposure.
   - NO preload exposure.
   - NO recipient secret material.
   - NO Control Center signing material.
   - Corrupt encrypted state is never silently replaced.
   - Branch identity is not an ordinary editable profile.
   - Business Date is not used.
============================================================ */

import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";

import path from "node:path";

import {
  assertFinoraP256SpkiPublicKey,
  createFinoraInstallationBindingFingerprint,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  observeFinoraControlCenterAuthoritativeWallClock,
} from "./finoraControlCenterClockHighWaterAuthorityService.js";

import {
  FINORA_CONTROL_CENTER_BRANCH_REGISTRY_BINDING_ALGORITHM,
  FINORA_CONTROL_CENTER_BRANCH_REGISTRY_FINGERPRINT_ALGORITHM,
  FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PLATFORM,
  FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PUBLIC_KEY_FORMAT,
  FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
} from "./finoraControlCenterBranchRegistry.types.js";

import type {
  FinoraControlCenterBranchAccessSummary,
  FinoraControlCenterBranchDisplayProfile,
  FinoraControlCenterBranchInstallationIdentity,
  FinoraControlCenterBranchLastReportedWallet,
  FinoraControlCenterBranchLastSync,
  FinoraControlCenterBranchProvisionedIdentity,
  FinoraControlCenterBranchRegistry,
  FinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistry.types.js";

// ============================================================
// PATH
// ============================================================

const REGISTRY_DIRECTORY =
  "FINORA";

const REGISTRY_SUBDIRECTORY =
  "control-center";

const REGISTRY_FILE =
  "finora-control-center-branch-registry.bin";

function getRegistryPath():
  string {

  return path.join(
    app.getPath(
      "userData",
    ),
    REGISTRY_DIRECTORY,
    REGISTRY_SUBDIRECTORY,
    REGISTRY_FILE,
  );
}

// ============================================================
// PUBLIC INPUT / RESULT
// ============================================================

export interface RegisterFinoraControlCenterBranchInput {

  identity:
    FinoraControlCenterBranchProvisionedIdentity;
}

export interface RegisterFinoraControlCenterBranchResult {

  created:
    boolean;

  record:
    FinoraControlCenterBranchRegistryRecord;
}

// ============================================================
// BASIC VALIDATION
// ============================================================

function isNonEmptyString(
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

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    return false;
  }

  const timestamp =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      timestamp,
    ) &&
    new Date(
      timestamp,
    ).toISOString() ===
      value
  );
}

function isOptionalNonEmptyString(
  value:
    unknown,
): value is string | undefined {

  return (
    value === undefined ||
    isNonEmptyString(
      value,
    )
  );
}

// ============================================================
// INSTALLATION IDENTITY VALIDATION
// ============================================================

function validateInstallationIdentity(
  installation:
    FinoraControlCenterBranchInstallationIdentity,
): void {

  if (
    !isNonEmptyString(
      installation.installationId,
    ) ||
    !isNonEmptyString(
      installation.bindingKeyId,
    ) ||
    installation.platform !==
      FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PLATFORM ||
    installation.algorithm !==
      FINORA_CONTROL_CENTER_BRANCH_REGISTRY_BINDING_ALGORITHM ||
    installation.publicKeyFormat !==
      FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PUBLIC_KEY_FORMAT ||
    !isNonEmptyString(
      installation.publicKey,
    ) ||
    installation.fingerprintAlgorithm !==
      FINORA_CONTROL_CENTER_BRANCH_REGISTRY_FINGERPRINT_ALGORITHM ||
    !/^[0-9a-f]{64}$/.test(
      installation.publicKeyFingerprint,
    ) ||
    !isCanonicalTimestamp(
      installation.bindingCreatedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry installation identity is invalid.",
    );
  }

  /*
   * Validate canonical SPKI / EC / P-256 shape using the same
   * public installation-binding crypto primitive used by FINORA.
   */
  assertFinoraP256SpkiPublicKey(
    installation.publicKey,
  );

  const expectedFingerprint =
    createFinoraInstallationBindingFingerprint(
      installation.publicKey,
    );

  if (
    expectedFingerprint !==
      installation.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry installation fingerprint does not match its public key.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${expectedFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    installation.bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry bindingKeyId does not match its public key fingerprint.",
    );
  }
}

// ============================================================
// PROVISIONED IDENTITY VALIDATION
// ============================================================

function validateProvisionedIdentity(
  identity:
    FinoraControlCenterBranchProvisionedIdentity,
): void {

  if (
    !isNonEmptyString(
      identity.ownerId,
    ) ||
    !isNonEmptyString(
      identity.businessId,
    ) ||
    !isNonEmptyString(
      identity.branchId,
    ) ||
    !isNonEmptyString(
      identity.businessCode,
    ) ||
    !isNonEmptyString(
      identity.branchCode,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry provisioned identity is incomplete.",
    );
  }

  validateInstallationIdentity(
    identity.installation,
  );
}

// ============================================================
// PROFILE VALIDATION
// ============================================================

function validateProfile(
  profile:
    FinoraControlCenterBranchDisplayProfile,
): void {

  if (
    !isNonEmptyString(
      profile.businessName,
    ) ||
    !isNonEmptyString(
      profile.branchName,
    ) ||
    !isOptionalNonEmptyString(
      profile.sourcePackageId,
    ) ||
    !isCanonicalTimestamp(
      profile.updatedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry display profile is invalid.",
    );
  }
}

// ============================================================
// ACCESS VALIDATION
// ============================================================

function validateAccess(
  access:
    FinoraControlCenterBranchAccessSummary,
): void {

  if (
    !isOptionalNonEmptyString(
      access.grantId,
    ) ||
    (
      access.accessType !==
        "REGISTERED" &&
      access.accessType !==
        "DEMO"
    ) ||
    (
      access.administrativeStatus !==
        "ACTIVE" &&
      access.administrativeStatus !==
        "SUSPENDED" &&
      access.administrativeStatus !==
        "REVOKED"
    ) ||
    (
      access.storageMode !==
        "LOCAL" &&
      access.storageMode !==
        "USB"
    ) ||
    !isCanonicalTimestamp(
      access.validFrom,
    ) ||
    !isCanonicalTimestamp(
      access.validUntil,
    ) ||
    Date.parse(
      access.validUntil,
    ) <=
      Date.parse(
        access.validFrom,
      ) ||
    !isOptionalNonEmptyString(
      access.sourcePackageId,
    ) ||
    !isCanonicalTimestamp(
      access.updatedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry access summary is invalid.",
    );
  }
}

// ============================================================
// LAST-SYNC VALIDATION
// ============================================================

function validateLastSync(
  sync:
    FinoraControlCenterBranchLastSync,
): void {

  if (
    !isNonEmptyString(
      sync.snapshotId,
    ) ||
    !isCanonicalTimestamp(
      sync.reportedAt,
    ) ||
    !isCanonicalTimestamp(
      sync.receivedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry last-sync evidence is invalid.",
    );
  }
}

// ============================================================
// LAST-REPORTED WALLET VALIDATION
// ============================================================

function validateLastReportedWallet(
  wallet:
    FinoraControlCenterBranchLastReportedWallet,
): void {

  if (
    !isNonEmptyString(
      wallet.walletId,
    ) ||
    !Number.isSafeInteger(
      wallet.balanceMinor,
    ) ||
    wallet.balanceMinor <
      0 ||
    wallet.currency !==
      "INR" ||
    !isCanonicalTimestamp(
      wallet.reportedAt,
    ) ||
    (
      wallet.lastTransactionAt !==
        undefined &&
      !isCanonicalTimestamp(
        wallet.lastTransactionAt,
      )
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry last-reported Wallet state is invalid.",
    );
  }
}

// ============================================================
// RECORD VALIDATION
// ============================================================

function validateRecord(
  record:
    FinoraControlCenterBranchRegistryRecord,
): void {

  validateProvisionedIdentity(
    record.identity,
  );

  if (
    record.profile !==
      undefined
  ) {
    validateProfile(
      record.profile,
    );
  }

  if (
    record.access !==
      undefined
  ) {
    validateAccess(
      record.access,
    );
  }

  if (
    record.lastSync !==
      undefined
  ) {
    validateLastSync(
      record.lastSync,
    );
  }

  if (
    record.lastReportedWallet !==
      undefined
  ) {
    validateLastReportedWallet(
      record.lastReportedWallet,
    );
  }

  if (
    !isCanonicalTimestamp(
      record.createdAt,
    ) ||
    !isCanonicalTimestamp(
      record.updatedAt,
    ) ||
    Date.parse(
      record.updatedAt,
    ) <
      Date.parse(
        record.createdAt,
      ) ||
    record.schemaVersion !==
      FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry record metadata is invalid.",
    );
  }
}

// ============================================================
// IDENTITY KEYS
// ============================================================

function branchScopeKey(
  identity:
    FinoraControlCenterBranchProvisionedIdentity,
): string {

  return [
    identity.ownerId,
    identity.businessId,
    identity.branchId,
  ].join(
    "\u001f",
  );
}

function branchCodeKey(
  identity:
    FinoraControlCenterBranchProvisionedIdentity,
): string {

  return [
    identity.businessId,
    identity.branchCode,
  ].join(
    "\u001f",
  );
}

// ============================================================
// IMMUTABLE IDENTITY EQUALITY
// ============================================================

function isSameProvisionedIdentity(
  left:
    FinoraControlCenterBranchProvisionedIdentity,
  right:
    FinoraControlCenterBranchProvisionedIdentity,
): boolean {

  return (
    left.ownerId ===
      right.ownerId &&
    left.businessId ===
      right.businessId &&
    left.branchId ===
      right.branchId &&
    left.businessCode ===
      right.businessCode &&
    left.branchCode ===
      right.branchCode &&
    left.installation.installationId ===
      right.installation.installationId &&
    left.installation.bindingKeyId ===
      right.installation.bindingKeyId &&
    left.installation.platform ===
      right.installation.platform &&
    left.installation.algorithm ===
      right.installation.algorithm &&
    left.installation.publicKeyFormat ===
      right.installation.publicKeyFormat &&
    left.installation.publicKey ===
      right.installation.publicKey &&
    left.installation.fingerprintAlgorithm ===
      right.installation.fingerprintAlgorithm &&
    left.installation.publicKeyFingerprint ===
      right.installation.publicKeyFingerprint &&
    left.installation.bindingCreatedAt ===
      right.installation.bindingCreatedAt
  );
}

// ============================================================
// REGISTRY UNIQUENESS
// ============================================================

function validateRegistryUniqueness(
  branches:
    readonly FinoraControlCenterBranchRegistryRecord[],
): void {

  const scopes =
    new Set<string>();

  const branchIds =
    new Set<string>();

  const branchCodes =
    new Set<string>();

  const installationIds =
    new Set<string>();

  const bindingKeyIds =
    new Set<string>();

  const fingerprints =
    new Set<string>();

  const publicKeys =
    new Set<string>();

  for (
    const record of
      branches
  ) {

    const identity =
      record.identity;

    const scope =
      branchScopeKey(
        identity,
      );

    const codeScope =
      branchCodeKey(
        identity,
      );

    if (
      scopes.has(
        scope,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry contains a duplicate Owner / Business / Branch scope.",
      );
    }

    if (
      branchIds.has(
        identity.branchId,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry contains a duplicate Branch ID.",
      );
    }

    if (
      branchCodes.has(
        codeScope,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry contains a duplicate Branch Code inside one Business.",
      );
    }

    if (
      installationIds.has(
        identity.installation.installationId,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry contains a duplicate Installation ID.",
      );
    }

    if (
      bindingKeyIds.has(
        identity.installation.bindingKeyId,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry contains a duplicate Binding Key ID.",
      );
    }

    if (
      fingerprints.has(
        identity.installation.publicKeyFingerprint,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry contains a duplicate recipient public-key fingerprint.",
      );
    }

    if (
      publicKeys.has(
        identity.installation.publicKey,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry contains a duplicate recipient public key.",
      );
    }

    scopes.add(
      scope,
    );

    branchIds.add(
      identity.branchId,
    );

    branchCodes.add(
      codeScope,
    );

    installationIds.add(
      identity.installation.installationId,
    );

    bindingKeyIds.add(
      identity.installation.bindingKeyId,
    );

    fingerprints.add(
      identity.installation.publicKeyFingerprint,
    );

    publicKeys.add(
      identity.installation.publicKey,
    );
  }
}

// ============================================================
// ROOT VALIDATION
// ============================================================

export function validateFinoraControlCenterBranchRegistry(
  value:
    unknown,
): asserts value is FinoraControlCenterBranchRegistry {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry root is invalid.",
    );
  }

  const record =
    value as
      Record<string, unknown>;

  if (
    record.schemaVersion !==
      FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION ||
    !Array.isArray(
      record.branches,
    ) ||
    !isCanonicalTimestamp(
      record.createdAt,
    ) ||
    !isCanonicalTimestamp(
      record.updatedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry persistence schema is invalid.",
    );
  }

  const registry =
    value as
      FinoraControlCenterBranchRegistry;

  for (
    const branch of
      registry.branches
  ) {
    validateRecord(
      branch,
    );
  }

  validateRegistryUniqueness(
    registry.branches,
  );

  if (
    registry.branches.length >
      0
  ) {

    const newestBranchUpdate =
      Math.max(
        ...registry.branches.map(
          (branch) =>
            Date.parse(
              branch.updatedAt,
            ),
        ),
      );

    if (
      Date.parse(
        registry.updatedAt,
      ) <
        newestBranchUpdate
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry root updatedAt precedes a branch update.",
      );
    }
  }
}

// ============================================================
// EMPTY ROOT
// ============================================================

function createEmptyRegistry(
  observedAt:
    string,
): FinoraControlCenterBranchRegistry {

  return {
    branches:
      [],

    createdAt:
      observedAt,

    updatedAt:
      observedAt,

    schemaVersion:
      FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
  };
}

// ============================================================
// CLONE
// ============================================================

function cloneRegistryRecord(
  record:
    FinoraControlCenterBranchRegistryRecord,
): FinoraControlCenterBranchRegistryRecord {

  return JSON.parse(
    JSON.stringify(
      record,
    ),
  ) as
    FinoraControlCenterBranchRegistryRecord;
}

function cloneRegistry(
  registry:
    FinoraControlCenterBranchRegistry,
): FinoraControlCenterBranchRegistry {

  return JSON.parse(
    JSON.stringify(
      registry,
    ),
  ) as
    FinoraControlCenterBranchRegistry;
}

// ============================================================
// READ
// ============================================================

async function readRegistry():
  Promise<
    FinoraControlCenterBranchRegistry | undefined
  > {

  const registryPath =
    getRegistryPath();

  let encrypted:
    Buffer;

  try {

    encrypted =
      await fs.readFile(
        registryPath,
      );

  } catch (error) {

    const code =
      (
        error as
          NodeJS.ErrnoException
      ).code;

    if (
      code ===
        "ENOENT"
    ) {
      return undefined;
    }

    throw error;
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Registry encryption is unavailable.",
    );
  }

  let plaintext:
    string;

  try {

    plaintext =
      safeStorage.decryptString(
        encrypted,
      );

  } catch {

    throw new Error(
      "FINORA Control Center Branch Registry cannot be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        plaintext,
      );

  } catch {

    throw new Error(
      "FINORA Control Center Branch Registry is corrupt.",
    );
  }

  validateFinoraControlCenterBranchRegistry(
    parsed,
  );

  return parsed;
}

// ============================================================
// WRITE
// ============================================================

async function writeRegistry(
  registry:
    FinoraControlCenterBranchRegistry,
): Promise<void> {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Registry encryption is unavailable. Registry was not persisted.",
    );
  }

  validateFinoraControlCenterBranchRegistry(
    registry,
  );

  const registryPath =
    getRegistryPath();

  const directory =
    path.dirname(
      registryPath,
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        registry,
      ),
    );

  const temporaryPath =
    `${registryPath}.${process.pid}.${Date.now()}.tmp`;

  try {

    await fs.writeFile(
      temporaryPath,
      encrypted,
      {
        mode:
          0o600,
      },
    );

    await fs.rename(
      temporaryPath,
      registryPath,
    );

  } catch (error) {

    await fs.rm(
      temporaryPath,
      {
        force:
          true,
      },
    )
      .catch(
        () =>
          undefined,
      );

    throw error;
  }
}

// ============================================================
// PUBLIC READ
// ============================================================

export async function loadFinoraControlCenterBranchRegistry():
  Promise<
    FinoraControlCenterBranchRegistry | undefined
  > {

  const registry =
    await readRegistry();

  return registry ===
    undefined
    ? undefined
    : cloneRegistry(
        registry,
      );
}

// ============================================================
// FIND
// ============================================================

export async function findFinoraControlCenterBranchRegistryRecord(
  ownerId:
    string,
  businessId:
    string,
  branchId:
    string,
):
  Promise<
    FinoraControlCenterBranchRegistryRecord | undefined
  > {

  if (
    !isNonEmptyString(
      ownerId,
    ) ||
    !isNonEmptyString(
      businessId,
    ) ||
    !isNonEmptyString(
      branchId,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry lookup scope is incomplete.",
    );
  }

  const registry =
    await readRegistry();

  const record =
    registry?.branches.find(
      (branch) =>
        branch.identity.ownerId ===
          ownerId &&
        branch.identity.businessId ===
          businessId &&
        branch.identity.branchId ===
          branchId,
    );

  return record ===
    undefined
    ? undefined
    : cloneRegistryRecord(
        record,
      );
}

// ============================================================
// REGISTRATION COLLISION CHECK
// ============================================================

function assertNoRegistrationCollision(
  branches:
    readonly FinoraControlCenterBranchRegistryRecord[],
  identity:
    FinoraControlCenterBranchProvisionedIdentity,
): void {

  for (
    const record of
      branches
  ) {

    const existing =
      record.identity;

    const sameScope =
      branchScopeKey(
        existing,
      ) ===
        branchScopeKey(
          identity,
        );

    if (
      sameScope
    ) {

      if (
        !isSameProvisionedIdentity(
          existing,
          identity,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry rejected an immutable identity change for an existing branch.",
        );
      }

      continue;
    }

    if (
      existing.branchId ===
        identity.branchId
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a Branch ID already assigned to another scope.",
      );
    }

    if (
      branchCodeKey(
        existing,
      ) ===
        branchCodeKey(
          identity,
        )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a Branch Code already assigned inside this Business.",
      );
    }

    if (
      existing.installation.installationId ===
        identity.installation.installationId
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected an Installation ID already assigned to another branch.",
      );
    }

    if (
      existing.installation.bindingKeyId ===
        identity.installation.bindingKeyId
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a Binding Key ID already assigned to another branch.",
      );
    }

    if (
      existing.installation.publicKeyFingerprint ===
        identity.installation.publicKeyFingerprint
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a recipient fingerprint already assigned to another branch.",
      );
    }

    if (
      existing.installation.publicKey ===
        identity.installation.publicKey
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a recipient public key already assigned to another branch.",
      );
    }
  }
}

// ============================================================
// INTERNAL REGISTER
// ============================================================

async function registerInternal(
  input:
    RegisterFinoraControlCenterBranchInput,
): Promise<
  RegisterFinoraControlCenterBranchResult
> {

  validateProvisionedIdentity(
    input.identity,
  );

  const clockResult =
    await observeFinoraControlCenterAuthoritativeWallClock();

  if (
    !clockResult.success
  ) {
    throw new Error(
      clockResult.error,
    );
  }

  const observedAt =
    clockResult.data.observedAt;

  const existingRegistry =
    await readRegistry();

  const registry =
    existingRegistry ??
      createEmptyRegistry(
        observedAt,
      );

  assertNoRegistrationCollision(
    registry.branches,
    input.identity,
  );

  const existing =
    registry.branches.find(
      (record) =>
        branchScopeKey(
          record.identity,
        ) ===
          branchScopeKey(
            input.identity,
          ),
    );

  /*
   * Exact registration is idempotent.
   *
   * Registration itself never mutates an already provisioned
   * identity. Future profile/access/snapshot updates belong to
   * separate verified update paths.
   */
  if (
    existing !==
      undefined
  ) {

    return {
      created:
        false,

      record:
        cloneRegistryRecord(
          existing,
        ),
    };
  }

  const newRecord:
    FinoraControlCenterBranchRegistryRecord = {

      identity:
        cloneRegistryRecord({
          identity:
            input.identity,

          createdAt:
            observedAt,

          updatedAt:
            observedAt,

          schemaVersion:
            FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
        }).identity,

      createdAt:
        observedAt,

      updatedAt:
        observedAt,

      schemaVersion:
        FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
    };

  registry.branches.push(
    newRecord,
  );

  registry.updatedAt =
    observedAt;

  validateFinoraControlCenterBranchRegistry(
    registry,
  );

  /*
   * Persist complete encrypted registry before returning success.
   * A caller must never observe "registered" before durable state.
   */
  await writeRegistry(
    registry,
  );

  return {
    created:
      true,

    record:
      cloneRegistryRecord(
        newRecord,
      ),
  };
}

// ============================================================
// SAME-PROCESS SERIALIZATION
// ============================================================

let branchRegistrationQueue:
  Promise<void> =
    Promise.resolve();

export function registerFinoraControlCenterBranch(
  input:
    RegisterFinoraControlCenterBranchInput,
): Promise<
  RegisterFinoraControlCenterBranchResult
> {

  const operation =
    branchRegistrationQueue.then(
      () =>
        registerInternal(
          input,
        ),
      () =>
        registerInternal(
          input,
        ),
    );

  branchRegistrationQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}

// ============================================================
// END
// ============================================================