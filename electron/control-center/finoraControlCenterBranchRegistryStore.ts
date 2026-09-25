/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL CENTER â€” BRANCH REGISTRY STORE

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
  assertFinoraBranchCertificationPublicKey,
} from "../control/finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationPublicKeyV1,
} from "../control/finoraBranchCertificationContract.js";

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

  /*
   * Optional only because authentic historical Enrollment V1
   * evidence has no Branch Certification authority.
   *
   * New live Enrollment V2 callers require this field.
   */
  branchCertificationPublicKey?:
    FinoraBranchCertificationPublicKeyV1;
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

function isSameInstallationIdentity(
  left:
    FinoraControlCenterBranchRegistryRecord["identity"]["installation"],
  right:
    FinoraControlCenterBranchRegistryRecord["identity"]["installation"],
): boolean {

  return (
    left.installationId ===
      right.installationId &&
    left.bindingKeyId ===
      right.bindingKeyId &&
    left.platform ===
      right.platform &&
    left.algorithm ===
      right.algorithm &&
    left.publicKeyFormat ===
      right.publicKeyFormat &&
    left.publicKey ===
      right.publicKey &&
    left.fingerprintAlgorithm ===
      right.fingerprintAlgorithm &&
    left.publicKeyFingerprint ===
      right.publicKeyFingerprint &&
    left.bindingCreatedAt ===
      right.bindingCreatedAt
  );
}

function isSameBranchCertificationPublicKey(
  left:
    FinoraBranchCertificationPublicKeyV1,

  right:
    FinoraBranchCertificationPublicKeyV1,
): boolean {

  return (
    left.keyId ===
      right.keyId &&
    left.algorithm ===
      right.algorithm &&
    left.publicKeyFormat ===
      right.publicKeyFormat &&
    left.publicKey ===
      right.publicKey &&
    left.fingerprintAlgorithm ===
      right.fingerprintAlgorithm &&
    left.publicKeyFingerprint ===
      right.publicKeyFingerprint &&
    left.createdAt ===
      right.createdAt &&
    left.schemaVersion ===
      right.schemaVersion
  );
}

function validateBranchCertificationRotationEvidence(
  record:
    FinoraControlCenterBranchRegistryRecord,
): void {

  const evidence =
    record.branchCertificationRotation;

  if (
    evidence ===
      undefined
  ) {
    return;
  }

  if (
    typeof evidence !==
      "object" ||
    evidence ===
      null ||
    Array.isArray(
      evidence,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry certification-rotation evidence is invalid.",
    );
  }

  const legacyCertificationAdoption =
    evidence.legacyCertificationAdoption ===
      true;

  const keys =
    Object.keys(
      evidence,
    ).sort();

  const expectedKeys =
    [
      "sourcePackageId",
      "sequence",
      "requestingInstallationId",
      "requestingBindingKeyId",
      "requestingFingerprintAlgorithm",
      "requestingPublicKeyFingerprint",
      ...(
        legacyCertificationAdoption
          ? [
              "legacyCertificationAdoption",
            ]
          : [
              "previousCertificationPublicKey",
            ]
      ),
      "replacementCertificationPublicKey",
      "rotatedAt",
      "schemaVersion",
    ].sort();

  if (
    keys.join("|") !==
      expectedKeys.join("|") ||
    !isNonEmptyString(
      evidence.sourcePackageId,
    ) ||
    !Number.isSafeInteger(
      evidence.sequence,
    ) ||
    evidence.sequence <=
      0 ||
    !isNonEmptyString(
      evidence.requestingInstallationId,
    ) ||
    !isNonEmptyString(
      evidence.requestingBindingKeyId,
    ) ||
    evidence.requestingFingerprintAlgorithm !==
      "SHA-256" ||
    !/^[0-9a-f]{64}$/.test(
      evidence.requestingPublicKeyFingerprint,
    ) ||
    evidence.requestingBindingKeyId !==
      `FINORA-BINDING-${evidence.requestingPublicKeyFingerprint
        .slice(
          0,
          32,
        )
        .toUpperCase()}` ||
    !isCanonicalTimestamp(
      evidence.rotatedAt,
    ) ||
    evidence.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry certification-rotation evidence is malformed.",
    );
  }

  assertFinoraBranchCertificationPublicKey(
    evidence.replacementCertificationPublicKey,
  );

  if (
    legacyCertificationAdoption
  ) {
    if (
      evidence.previousCertificationPublicKey !==
        undefined
    ) {
      throw new Error(
        "FINORA Control Center legacy Branch Certification adoption cannot contain a previous authority.",
      );
    }
  }
  else {
    if (
      evidence.previousCertificationPublicKey ===
        undefined
    ) {
      throw new Error(
        "FINORA Control Center Branch Certification Rotation evidence requires its previous authority.",
      );
    }

    assertFinoraBranchCertificationPublicKey(
      evidence.previousCertificationPublicKey,
    );

    if (
      isSameBranchCertificationPublicKey(
        evidence.previousCertificationPublicKey,
        evidence.replacementCertificationPublicKey,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry certification rotation cannot preserve the same authority.",
      );
    }
  }

  if (
    record.branchCertificationPublicKey ===
      undefined ||
    !isSameBranchCertificationPublicKey(
      record.branchCertificationPublicKey,
      evidence.replacementCertificationPublicKey,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry certification-rotation evidence does not match the current certification authority.",
    );
  }
}

function validateAuthorizedDevice(
  device:
    FinoraControlCenterBranchRegistryRecord["authorizedDevices"][number],
): void {

  validateInstallationIdentity(
    device.installation,
  );

  if (
    device.evidenceSource !==
      "INITIAL_PROVISIONING" ||
    !isCanonicalTimestamp(
      device.firstObservedAt,
    ) ||
    !isCanonicalTimestamp(
      device.updatedAt,
    ) ||
    Date.parse(
      device.updatedAt,
    ) <
      Date.parse(
        device.firstObservedAt,
      )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry authorized-device evidence is invalid.",
    );
  }
}

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
    record.branchCertificationPublicKey !==
      undefined
  ) {
    assertFinoraBranchCertificationPublicKey(
      record.branchCertificationPublicKey,
    );
  }

  validateBranchCertificationRotationEvidence(
    record,
  );

  if (
    !Array.isArray(
      record.authorizedDevices,
    ) ||
    record.authorizedDevices.length !==
      1
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry must contain exactly one initial provisioned authorized device in schema V2.",
    );
  }

  const initialAuthorizedDevice =
    record.authorizedDevices[0];

  validateAuthorizedDevice(
    initialAuthorizedDevice,
  );

  if (
    initialAuthorizedDevice.evidenceSource !==
      "INITIAL_PROVISIONING" ||
    !isSameInstallationIdentity(
      initialAuthorizedDevice.installation,
      record.identity.installation,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry initial authorized device must exactly match the immutable provisioned installation identity.",
    );
  }

  const rotationEvidence =
    record.branchCertificationRotation;

  if (
    rotationEvidence !==
      undefined
  ) {

    const requestingDeviceAuthorized =
      record.authorizedDevices.some(
        (
          authorized,
        ) => {

          const installation =
            authorized.installation;

          return (
            installation.installationId ===
              rotationEvidence.requestingInstallationId &&
            installation.bindingKeyId ===
              rotationEvidence.requestingBindingKeyId &&
            installation.fingerprintAlgorithm ===
              rotationEvidence.requestingFingerprintAlgorithm &&
            installation.publicKeyFingerprint ===
              rotationEvidence.requestingPublicKeyFingerprint
          );
        },
      );

    if (
      !requestingDeviceAuthorized
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry certification-rotation evidence references an unauthorized requesting installation.",
      );
    }
  }

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

  const authorizedInstallationIds =
    new Set<string>();

  const authorizedBindingKeyIds =
    new Set<string>();

  const authorizedFingerprints =
    new Set<string>();

  const authorizedPublicKeys =
    new Set<string>();

  const branchCertificationKeyIds =
    new Set<string>();

  const branchCertificationFingerprints =
    new Set<string>();

  const branchCertificationPublicKeys =
    new Set<string>();

  for (
    const record of
      branches
  ) {

    const identity =
      record.identity;

    const certification =
      record.branchCertificationPublicKey;

    if (
      certification !==
        undefined
    ) {

      if (
        branchCertificationKeyIds.has(
          certification.keyId,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry contains a Branch Certification keyId assigned to more than one branch.",
        );
      }

      if (
        branchCertificationFingerprints.has(
          certification.publicKeyFingerprint,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry contains a Branch Certification fingerprint assigned to more than one branch.",
        );
      }

      if (
        branchCertificationPublicKeys.has(
          certification.publicKey,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry contains a Branch Certification public key assigned to more than one branch.",
        );
      }

      branchCertificationKeyIds.add(
        certification.keyId,
      );

      branchCertificationFingerprints.add(
        certification.publicKeyFingerprint,
      );

      branchCertificationPublicKeys.add(
        certification.publicKey,
      );
    }

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

    for (
      const device of
        record.authorizedDevices
    ) {

      const installation =
        device.installation;

      if (
        authorizedInstallationIds.has(
          installation.installationId,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry contains a duplicate authorized-device Installation ID.",
        );
      }

      if (
        authorizedBindingKeyIds.has(
          installation.bindingKeyId,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry contains a duplicate authorized-device Binding Key ID.",
        );
      }

      if (
        authorizedFingerprints.has(
          installation.publicKeyFingerprint,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry contains a duplicate authorized-device public-key fingerprint.",
        );
      }

      if (
        authorizedPublicKeys.has(
          installation.publicKey,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry contains a duplicate authorized-device public key.",
        );
      }

      authorizedInstallationIds.add(
        installation.installationId,
      );

      authorizedBindingKeyIds.add(
        installation.bindingKeyId,
      );

      authorizedFingerprints.add(
        installation.publicKeyFingerprint,
      );

      authorizedPublicKeys.add(
        installation.publicKey,
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
// V1 -> V2 MIGRATION
// ============================================================

function migrateFinoraControlCenterBranchRegistryV1(
  value:
    unknown,
): {
  value:
    unknown;
  migrated:
    boolean;
} {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return {
      value,
      migrated:
        false,
    };
  }

  const legacyRoot =
    value as
      Record<string, unknown>;

  if (
    legacyRoot.schemaVersion !==
      1
  ) {
    return {
      value,
      migrated:
        false,
    };
  }

  if (
    !Array.isArray(
      legacyRoot.branches,
    ) ||
    !isCanonicalTimestamp(
      legacyRoot.createdAt,
    ) ||
    !isCanonicalTimestamp(
      legacyRoot.updatedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry V1 persistence schema is invalid.",
    );
  }

  const migratedBranches =
    legacyRoot.branches.map(
      (branchValue) => {

        if (
          typeof branchValue !==
            "object" ||
          branchValue ===
            null ||
          Array.isArray(
            branchValue,
          )
        ) {
          throw new Error(
            "FINORA Control Center Branch Registry V1 branch record is invalid.",
          );
        }

        const legacyRecord =
          branchValue as
            Record<string, unknown>;

        if (
          legacyRecord.schemaVersion !==
            1 ||
          typeof legacyRecord.identity !==
            "object" ||
          legacyRecord.identity ===
            null ||
          Array.isArray(
            legacyRecord.identity,
          )
        ) {
          throw new Error(
            "FINORA Control Center Branch Registry V1 branch metadata is invalid.",
          );
        }

        const identity =
          legacyRecord.identity as
            FinoraControlCenterBranchRegistryRecord["identity"];

        validateProvisionedIdentity(
          identity,
        );

        if (
          legacyRecord.profile !==
            undefined
        ) {
          validateProfile(
            legacyRecord.profile as
              NonNullable<FinoraControlCenterBranchRegistryRecord["profile"]>,
          );
        }

        if (
          legacyRecord.access !==
            undefined
        ) {
          validateAccess(
            legacyRecord.access as
              NonNullable<FinoraControlCenterBranchRegistryRecord["access"]>,
          );
        }

        if (
          legacyRecord.lastSync !==
            undefined
        ) {
          validateLastSync(
            legacyRecord.lastSync as
              NonNullable<FinoraControlCenterBranchRegistryRecord["lastSync"]>,
          );
        }

        if (
          legacyRecord.lastReportedWallet !==
            undefined
        ) {
          validateLastReportedWallet(
            legacyRecord.lastReportedWallet as
              NonNullable<FinoraControlCenterBranchRegistryRecord["lastReportedWallet"]>,
          );
        }

        if (
          !isCanonicalTimestamp(
            legacyRecord.createdAt,
          ) ||
          !isCanonicalTimestamp(
            legacyRecord.updatedAt,
          ) ||
          Date.parse(
            legacyRecord.updatedAt,
          ) <
            Date.parse(
              legacyRecord.createdAt,
            )
        ) {
          throw new Error(
            "FINORA Control Center Branch Registry V1 record timestamps are invalid.",
          );
        }

        const createdAt =
          legacyRecord.createdAt;

        const migratedRecord:
          FinoraControlCenterBranchRegistryRecord = {

            identity:
              JSON.parse(
                JSON.stringify(
                  identity,
                ),
              ) as
                FinoraControlCenterBranchRegistryRecord["identity"],

            authorizedDevices: [
              {
                installation: {
                  ...identity.installation,
                },

                evidenceSource:
                  "INITIAL_PROVISIONING",

                firstObservedAt:
                  createdAt,

                updatedAt:
                  createdAt,
              },
            ],

            ...(legacyRecord.profile !==
            undefined
              ? {
                  profile:
                    JSON.parse(
                      JSON.stringify(
                        legacyRecord.profile,
                      ),
                    ),
                }
              : {}),

            ...(legacyRecord.access !==
            undefined
              ? {
                  access:
                    JSON.parse(
                      JSON.stringify(
                        legacyRecord.access,
                      ),
                    ),
                }
              : {}),

            ...(legacyRecord.lastSync !==
            undefined
              ? {
                  lastSync:
                    JSON.parse(
                      JSON.stringify(
                        legacyRecord.lastSync,
                      ),
                    ),
                }
              : {}),

            ...(legacyRecord.lastReportedWallet !==
            undefined
              ? {
                  lastReportedWallet:
                    JSON.parse(
                      JSON.stringify(
                        legacyRecord.lastReportedWallet,
                      ),
                    ),
                }
              : {}),

            createdAt,

            updatedAt:
              legacyRecord.updatedAt,

            schemaVersion:
              FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
          };

        return migratedRecord;
      },
    );

  const migratedRegistry:
    FinoraControlCenterBranchRegistry = {

      branches:
        migratedBranches,

      createdAt:
        legacyRoot.createdAt,

      updatedAt:
        legacyRoot.updatedAt,

      schemaVersion:
        FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
    };

  return {
    value:
      migratedRegistry,
    migrated:
      true,
  };
}

// ============================================================
// READ
// ============================================================

function migrateFinoraControlCenterBranchRegistryV2(
  value:
    unknown,
): {
  value:
    unknown;
  migrated:
    boolean;
} {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return {
      value,
      migrated:
        false,
    };
  }

  const legacyRoot =
    value as
      Record<string, unknown>;

  if (
    legacyRoot.schemaVersion !==
      2
  ) {
    return {
      value,
      migrated:
        false,
    };
  }

  if (
    !Array.isArray(
      legacyRoot.branches,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry V2 persistence schema is invalid.",
    );
  }

  const migratedBranches =
    legacyRoot.branches.map(
      (branchValue) => {

        if (
          typeof branchValue !==
            "object" ||
          branchValue ===
            null ||
          Array.isArray(
            branchValue,
          )
        ) {
          throw new Error(
            "FINORA Control Center Branch Registry V2 branch record is invalid.",
          );
        }

        const legacyRecord =
          branchValue as
            Record<string, unknown>;

        if (
          legacyRecord.schemaVersion !==
            2
        ) {
          throw new Error(
            "FINORA Control Center Branch Registry V2 branch metadata is invalid.",
          );
        }

        return {
          ...legacyRecord,
          schemaVersion:
            FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
        };
      },
    );

  return {
    value: {
      ...legacyRoot,
      branches:
        migratedBranches,
      schemaVersion:
        FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION,
    },
    migrated:
      true,
  };
}


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

  const migrationV1 =
    migrateFinoraControlCenterBranchRegistryV1(
      parsed,
    );

  const migrationV2 =
    migrateFinoraControlCenterBranchRegistryV2(
      migrationV1.value,
    );

  const registry =
    migrationV2.value;

  validateFinoraControlCenterBranchRegistry(
    registry,
  );

  if (
    migrationV1.migrated ||
    migrationV2.migrated
  ) {
    await writeRegistry(
      registry,
    );
  }

  return registry;
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

  if (
    input.branchCertificationPublicKey !==
      undefined
  ) {
    assertFinoraBranchCertificationPublicKey(
      input.branchCertificationPublicKey,
    );
  }

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

    const incomingCertification =
      input.branchCertificationPublicKey;

    const existingCertification =
      existing.branchCertificationPublicKey;

    /*
     * Legacy exact branch registrations remain byte-stable when
     * no certification evidence is supplied.
     */
    if (
      incomingCertification ===
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

    /*
     * Once pinned, Branch Certification authority is immutable.
     * Exact retries are idempotent and do not rewrite registry bytes.
     */
    if (
      existingCertification !==
        undefined
    ) {

      if (
        !isSameBranchCertificationPublicKey(
          existingCertification,
          incomingCertification,
        )
      ) {
        throw new Error(
          "FINORA Control Center Branch Registry rejected a conflicting Branch Certification authority for an existing branch.",
        );
      }

      return {
        created:
          false,

        record:
          cloneRegistryRecord(
            existing,
          ),
      };
    }

    /*
     * One-time certification pin:
     *
     * The immutable provisioned identity already matched above.
     * Callers may only supply this input from verified Enrollment
     * Request V2 evidence.
     */
    existing.branchCertificationPublicKey = {
      ...incomingCertification,
    };

    existing.updatedAt =
      observedAt;

    registry.updatedAt =
      observedAt;

    validateFinoraControlCenterBranchRegistry(
      registry,
    );

    await writeRegistry(
      registry,
    );

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
        JSON.parse(
          JSON.stringify(
            input.identity,
          ),
        ) as
          FinoraControlCenterBranchProvisionedIdentity,

      authorizedDevices: [
        {
          installation: {
            ...input.identity.installation,
          },

          evidenceSource:
            "INITIAL_PROVISIONING",

          firstObservedAt:
            observedAt,

          updatedAt:
            observedAt,
        },
      ],

      ...(
        input.branchCertificationPublicKey ===
          undefined
          ? {}
          : {
              branchCertificationPublicKey: {
                ...input.branchCertificationPublicKey,
              },
            }
      ),

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
// BRANCH CERTIFICATION ROTATION
//
// Registration remains immutable. Certification replacement is
// only available through this dedicated transition.
//
// IMPORTANT:
// - Uses the SAME branchRegistrationQueue as registration.
// - Exact retry returns without clock observation or file rewrite.
// - Stale/conflicting old authority fails closed.
// - Replacement key identity must remain globally unique.
// ============================================================

export interface RotateFinoraControlCenterBranchCertificationInput {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  requestingInstallationId:
    string;

  requestingBindingKeyId:
    string;

  requestingFingerprintAlgorithm:
    "SHA-256";

  requestingPublicKeyFingerprint:
    string;

  sourcePackageId:
    string;

  sequence:
    number;

  legacyCertificationAdoption?:
    true;

  previousCertificationPublicKey?:
    FinoraBranchCertificationPublicKeyV1;

  replacementCertificationPublicKey:
    FinoraBranchCertificationPublicKeyV1;
}

export interface RotateFinoraControlCenterBranchCertificationResult {

  updated:
    boolean;

  record:
    FinoraControlCenterBranchRegistryRecord;
}

function isExactCertificationRotationEvidence(
  evidence:
    NonNullable<
      FinoraControlCenterBranchRegistryRecord[
        "branchCertificationRotation"
      ]
    >,

  input:
    RotateFinoraControlCenterBranchCertificationInput,
): boolean {

  if (
    evidence.sourcePackageId !==
      input.sourcePackageId ||
    evidence.sequence !==
      input.sequence ||
    evidence.requestingInstallationId !==
      input.requestingInstallationId ||
    evidence.requestingBindingKeyId !==
      input.requestingBindingKeyId ||
    evidence.requestingFingerprintAlgorithm !==
      input.requestingFingerprintAlgorithm ||
    evidence.requestingPublicKeyFingerprint !==
      input.requestingPublicKeyFingerprint ||
    evidence.legacyCertificationAdoption !==
      input.legacyCertificationAdoption ||
    !isSameBranchCertificationPublicKey(
      evidence.replacementCertificationPublicKey,
      input.replacementCertificationPublicKey,
    )
  ) {
    return false;
  }

  if (
    input.legacyCertificationAdoption ===
      true
  ) {
    return (
      evidence.previousCertificationPublicKey ===
        undefined &&
      input.previousCertificationPublicKey ===
        undefined
    );
  }

  return (
    evidence.previousCertificationPublicKey !==
      undefined &&
    input.previousCertificationPublicKey !==
      undefined &&
    isSameBranchCertificationPublicKey(
      evidence.previousCertificationPublicKey,
      input.previousCertificationPublicKey,
    )
  );
}

function assertReplacementCertificationUnique(
  branches:
    readonly FinoraControlCenterBranchRegistryRecord[],

  target:
    FinoraControlCenterBranchRegistryRecord,

  replacement:
    FinoraBranchCertificationPublicKeyV1,
): void {

  for (
    const record of
    branches
  ) {

    if (
      record ===
        target
    ) {
      continue;
    }

    const existing =
      record.branchCertificationPublicKey;

    if (
      existing ===
        undefined
    ) {
      continue;
    }

    if (
      existing.keyId ===
        replacement.keyId
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a replacement Branch Certification keyId already assigned to another branch.",
      );
    }

    if (
      existing.publicKeyFingerprint ===
        replacement.publicKeyFingerprint
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a replacement Branch Certification fingerprint already assigned to another branch.",
      );
    }

    if (
      existing.publicKey ===
        replacement.publicKey
    ) {
      throw new Error(
        "FINORA Control Center Branch Registry rejected a replacement Branch Certification public key already assigned to another branch.",
      );
    }
  }
}

async function rotateCertificationInternal(
  input:
    RotateFinoraControlCenterBranchCertificationInput,
): Promise<
  RotateFinoraControlCenterBranchCertificationResult
> {

  if (
    !isNonEmptyString(
      input.ownerId,
    ) ||
    !isNonEmptyString(
      input.businessId,
    ) ||
    !isNonEmptyString(
      input.branchId,
    ) ||
    !isNonEmptyString(
      input.requestingInstallationId,
    ) ||
    !isNonEmptyString(
      input.requestingBindingKeyId,
    ) ||
    input.requestingFingerprintAlgorithm !==
      "SHA-256" ||
    !/^[0-9a-f]{64}$/.test(
      input.requestingPublicKeyFingerprint,
    ) ||
    input.requestingBindingKeyId !==
      `FINORA-BINDING-${input.requestingPublicKeyFingerprint
        .slice(
          0,
          32,
        )
        .toUpperCase()}` ||
    !isNonEmptyString(
      input.sourcePackageId,
    ) ||
    !Number.isSafeInteger(
      input.sequence,
    ) ||
    input.sequence <=
      0
  ) {
    throw new Error(
      "FINORA Control Center Branch Certification Rotation mutation input is invalid.",
    );
  }

  assertFinoraBranchCertificationPublicKey(
    input.replacementCertificationPublicKey,
  );

  if (
    input.legacyCertificationAdoption ===
      true
  ) {
    if (
      input.previousCertificationPublicKey !==
        undefined
    ) {
      throw new Error(
        "FINORA legacy Branch Certification adoption cannot provide a previous certification authority.",
      );
    }
  }
  else {
    const previousCertificationPublicKey =
      input.previousCertificationPublicKey;

    if (
      previousCertificationPublicKey ===
        undefined
    ) {
      throw new Error(
        "FINORA Control Center Branch Certification Rotation requires its previous certification authority.",
      );
    }

    assertFinoraBranchCertificationPublicKey(
      previousCertificationPublicKey,
    );

    if (
      isSameBranchCertificationPublicKey(
        previousCertificationPublicKey,
        input.replacementCertificationPublicKey,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Certification Rotation replacement must differ from the previous authority.",
      );
    }
  }

  const registry =
    await readRegistry();

  if (
    registry ===
      undefined
  ) {
    throw new Error(
      "FINORA Control Center Branch Registry is unavailable for certification rotation.",
    );
  }

  const record =
    registry.branches.find(
      (
        candidate,
      ) =>
        candidate.identity.ownerId ===
          input.ownerId &&
        candidate.identity.businessId ===
          input.businessId &&
        candidate.identity.branchId ===
          input.branchId,
    );

  if (
    record ===
      undefined
  ) {
    throw new Error(
      "FINORA Control Center Branch Certification Rotation rejected an unknown Registry branch.",
    );
  }

  const requestingDeviceAuthorized =
    record.authorizedDevices.some(
      (
        authorized,
      ) => {

        const installation =
          authorized.installation;

        return (
          installation.installationId ===
            input.requestingInstallationId &&
          installation.bindingKeyId ===
            input.requestingBindingKeyId &&
          installation.fingerprintAlgorithm ===
            input.requestingFingerprintAlgorithm &&
          installation.publicKeyFingerprint ===
            input.requestingPublicKeyFingerprint
        );
      },
    );

  if (
    !requestingDeviceAuthorized
  ) {
    throw new Error(
      "FINORA Control Center Branch Certification Rotation mutation rejected an unauthorized requesting installation.",
    );
  }

  const current =
    record.branchCertificationPublicKey;

  if (
    current !==
      undefined &&
    isSameBranchCertificationPublicKey(
      current,
      input.replacementCertificationPublicKey,
    )
  ) {
    const evidence =
      record.branchCertificationRotation;

    if (
      evidence !==
        undefined &&
      isExactCertificationRotationEvidence(
        evidence,
        input,
      )
    ) {
      return {
        updated:
          false,

        record:
          cloneRegistryRecord(
            record,
          ),
      };
    }

    throw new Error(
      "FINORA Control Center Branch Certification Rotation rejected a conflicting retry for the current authority.",
    );
  }

  const legacyCertificationAdoption =
    input.legacyCertificationAdoption ===
      true;

  if (
    legacyCertificationAdoption
  ) {
    if (
      current !==
        undefined
    ) {
      throw new Error(
        "FINORA legacy Branch Certification adoption requires a Registry branch with no existing certification authority.",
      );
    }

    if (
      input.previousCertificationPublicKey !==
        undefined
    ) {
      throw new Error(
        "FINORA legacy Branch Certification adoption cannot provide a previous certification authority.",
      );
    }

    if (
      record.branchCertificationRotation !==
        undefined
    ) {
      throw new Error(
        "FINORA legacy Branch Certification adoption rejected a branch with prior certification-rotation evidence.",
      );
    }
  }
  else {
    if (
      current ===
        undefined
    ) {
      throw new Error(
        "FINORA Control Center Branch Certification Rotation requires an existing certification authority.",
      );
    }

    if (
      input.previousCertificationPublicKey ===
        undefined
    ) {
      throw new Error(
        "FINORA Control Center Branch Certification Rotation requires its previous certification authority.",
      );
    }

    if (
      !isSameBranchCertificationPublicKey(
        current,
        input.previousCertificationPublicKey,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Certification Rotation previous authority is stale or conflicts with the current Registry anchor.",
      );
    }

    const previousEvidence =
      record.branchCertificationRotation;

    if (
      previousEvidence !==
        undefined
    ) {
      if (
        previousEvidence.sourcePackageId ===
          input.sourcePackageId
      ) {
        throw new Error(
          "FINORA Control Center Branch Certification Rotation packageId replay was rejected.",
        );
      }

      const sameRequestingDevice =
        previousEvidence.requestingInstallationId ===
          input.requestingInstallationId &&
        previousEvidence.requestingBindingKeyId ===
          input.requestingBindingKeyId &&
        previousEvidence.requestingPublicKeyFingerprint ===
          input.requestingPublicKeyFingerprint;

      if (
        sameRequestingDevice &&
        input.sequence <=
          previousEvidence.sequence
      ) {
        throw new Error(
          "FINORA Control Center Branch Certification Rotation sequence rollback/replay was rejected.",
        );
      }
    }
  }
  /*
   * Package IDs must not be reused across branch rotation evidence.
   */
  for (
    const other of
    registry.branches
  ) {

    if (
      other ===
        record
    ) {
      continue;
    }

    if (
      other.branchCertificationRotation?.sourcePackageId ===
        input.sourcePackageId
    ) {
      throw new Error(
        "FINORA Control Center Branch Certification Rotation packageId is already assigned to another branch rotation.",
      );
    }
  }

  assertReplacementCertificationUnique(
    registry.branches,
    record,
    input.replacementCertificationPublicKey,
  );

  /*
   * All deterministic preflights have passed.
   * Only now observe authoritative time and mutate.
   */
  const clockResult =
    await observeFinoraControlCenterAuthoritativeWallClock();

  if (
    !clockResult.success
  ) {
    throw new Error(
      clockResult.error,
    );
  }

  const rotatedAt =
    clockResult.data.observedAt;

  record.branchCertificationPublicKey = {
    ...input.replacementCertificationPublicKey,
  };

  record.branchCertificationRotation = {
    sourcePackageId:
      input.sourcePackageId,

    sequence:
      input.sequence,

    requestingInstallationId:
      input.requestingInstallationId,

    requestingBindingKeyId:
      input.requestingBindingKeyId,

    requestingFingerprintAlgorithm:
      input.requestingFingerprintAlgorithm,

    requestingPublicKeyFingerprint:
      input.requestingPublicKeyFingerprint,

    ...(
      input.legacyCertificationAdoption ===
        true
        ? {
            legacyCertificationAdoption:
              true as const,
          }
        : {
            previousCertificationPublicKey: {
              ...input.previousCertificationPublicKey!,
            },
          }
    ),

    replacementCertificationPublicKey: {
      ...input.replacementCertificationPublicKey,
    },

    rotatedAt,

    schemaVersion:
      1,
  };

  record.updatedAt =
    rotatedAt;

  registry.updatedAt =
    rotatedAt;

  validateFinoraControlCenterBranchRegistry(
    registry,
  );

  await writeRegistry(
    registry,
  );

  return {
    updated:
      true,

    record:
      cloneRegistryRecord(
        record,
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

export function rotateFinoraControlCenterBranchCertification(
  input:
    RotateFinoraControlCenterBranchCertificationInput,
): Promise<
  RotateFinoraControlCenterBranchCertificationResult
> {

  const operation =
    branchRegistrationQueue.then(
      () =>
        rotateCertificationInternal(
          input,
        ),
      () =>
        rotateCertificationInternal(
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
