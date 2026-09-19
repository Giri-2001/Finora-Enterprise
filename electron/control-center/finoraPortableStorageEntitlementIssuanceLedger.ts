import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";

import path from "node:path";

import {
  randomUUID,
} from "node:crypto";

import {
  observeFinoraControlCenterAuthoritativeWallClock,
} from "./finoraControlCenterClockHighWaterAuthorityService.js";

// ============================================================
// CONTRACT
// ============================================================

import {
  getFinoraHistoricalStorageEntitlementIssuanceHighWater,
} from "./finoraControlCenterIssuanceLedger.js";
export const FINORA_PORTABLE_STORAGE_ENTITLEMENT_PURPOSE =
  "STORAGE_ENTITLEMENT" as const;

export interface FinoraPortableStorageEntitlementIssuanceScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraPortableStorageEntitlementIssuanceReservation {
  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;
}

interface FinoraPortableStorageEntitlementSequenceRecord {
  issuerId:
    string;

  purpose:
    typeof FINORA_PORTABLE_STORAGE_ENTITLEMENT_PURPOSE;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  lastReservedSequence:
    number;

  updatedAt:
    string;
}

interface FinoraPortableStorageEntitlementIssuanceLedger {
  sequences:
    FinoraPortableStorageEntitlementSequenceRecord[];

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// STORAGE
// ============================================================

const LEDGER_DIRECTORY =
  "FINORA";

const LEDGER_SUBDIRECTORY =
  "control-center";

const LEDGER_FILE =
  "finora-portable-storage-entitlement-issuance-ledger.bin";

function getLedgerPath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Portable Storage Entitlement issuance ledger cannot be used before Electron is ready.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    LEDGER_DIRECTORY,
    LEDGER_SUBDIRECTORY,
    LEDGER_FILE,
  );
}

// ============================================================
// VALIDATION
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

function hasExactKeys(
  value:
    Record<string, unknown>,

  expectedKeys:
    readonly string[],
): boolean {

  const actualKeys =
    Object.keys(
      value,
    ).sort();

  const canonicalExpectedKeys =
    [
      ...expectedKeys,
    ].sort();

  return (
    actualKeys.length ===
      canonicalExpectedKeys.length &&
    actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
        canonicalExpectedKeys[index],
    )
  );
}

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
    !value
  ) {
    return false;
  }

  const timestamp =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      timestamp,
    )
  ) {
    return false;
  }

  return (
    new Date(
      timestamp,
    ).toISOString() ===
      value
  );
}

function isIssuanceScope(
  value:
    unknown,
): value is FinoraPortableStorageEntitlementIssuanceScope {

  if (!isRecord(value)) {
    return false;
  }

  return (
    hasExactKeys(
      value,
      [
        "ownerId",
        "businessId",
        "branchId",
      ],
    ) &&
    isNonEmptyString(
      value.ownerId,
    ) &&
    isNonEmptyString(
      value.businessId,
    ) &&
    isNonEmptyString(
      value.branchId,
    )
  );
}

function isSequenceRecord(
  value:
    unknown,
): value is FinoraPortableStorageEntitlementSequenceRecord {

  if (!isRecord(value)) {
    return false;
  }

  return (
    hasExactKeys(
      value,
      [
        "issuerId",
        "purpose",
        "ownerId",
        "businessId",
        "branchId",
        "lastReservedSequence",
        "updatedAt",
      ],
    ) &&
    isNonEmptyString(
      value.issuerId,
    ) &&
    value.purpose ===
      FINORA_PORTABLE_STORAGE_ENTITLEMENT_PURPOSE &&
    isNonEmptyString(
      value.ownerId,
    ) &&
    isNonEmptyString(
      value.businessId,
    ) &&
    isNonEmptyString(
      value.branchId,
    ) &&
    Number.isSafeInteger(
      value.lastReservedSequence,
    ) &&
    (
      value.lastReservedSequence as
        number
    ) >
      0 &&
    isCanonicalTimestamp(
      value.updatedAt,
    )
  );
}

function isLedger(
  value:
    unknown,
): value is FinoraPortableStorageEntitlementIssuanceLedger {

  if (!isRecord(value)) {
    return false;
  }

  return (
    hasExactKeys(
      value,
      [
        "sequences",
        "createdAt",
        "updatedAt",
        "schemaVersion",
      ],
    ) &&
    value.schemaVersion ===
      1 &&
    Array.isArray(
      value.sequences,
    ) &&
    value.sequences.every(
      isSequenceRecord,
    ) &&
    isCanonicalTimestamp(
      value.createdAt,
    ) &&
    isCanonicalTimestamp(
      value.updatedAt,
    )
  );
}

function validateReservationScope(
  scope:
    FinoraPortableStorageEntitlementIssuanceScope,
): void {

  if (!isIssuanceScope(scope)) {
    throw new Error(
      "FINORA Portable Storage Entitlement issuance scope must contain exactly ownerId, businessId, and branchId.",
    );
  }
}

// ============================================================
// DEFAULT
// ============================================================

function createEmptyLedger(
  issuedAt:
    string,
):
  FinoraPortableStorageEntitlementIssuanceLedger {

  return {
    sequences:
      [],

    createdAt:
      issuedAt,

    updatedAt:
      issuedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// READ
// ============================================================

async function readLedger():
  Promise<
    FinoraPortableStorageEntitlementIssuanceLedger | undefined
  > {

  const ledgerPath =
    getLedgerPath();

  let encrypted:
    Buffer;

  try {
    encrypted =
      await fs.readFile(
        ledgerPath,
      );
  } catch (error) {
    const code =
      (
        error as
          NodeJS.ErrnoException
      ).code;

    if (code === "ENOENT") {
      return undefined;
    }

    throw error;
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Portable Storage Entitlement issuance-ledger encryption is unavailable.",
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
      "FINORA Portable Storage Entitlement issuance ledger cannot be decrypted.",
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
      "FINORA Portable Storage Entitlement issuance ledger is corrupt.",
    );
  }

  if (!isLedger(parsed)) {
    throw new Error(
      "FINORA Portable Storage Entitlement issuance ledger schema is invalid.",
    );
  }

  return parsed;
}

// ============================================================
// WRITE
// ============================================================

async function writeLedger(
  ledger:
    FinoraPortableStorageEntitlementIssuanceLedger,
): Promise<void> {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Portable Storage Entitlement issuance-ledger encryption is unavailable. Reservation was not persisted.",
    );
  }

  if (!isLedger(ledger)) {
    throw new Error(
      "FINORA Portable Storage Entitlement issuance ledger failed schema validation.",
    );
  }

  const ledgerPath =
    getLedgerPath();

  const directory =
    path.dirname(
      ledgerPath,
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,

      mode:
        0o700,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        ledger,
      ),
    );

  const temporaryPath =
    `${ledgerPath}.${process.pid}.tmp`;

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
      ledgerPath,
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
// SCOPE
// ============================================================

function isSameScope(
  record:
    FinoraPortableStorageEntitlementSequenceRecord,

  issuerId:
    string,

  scope:
    FinoraPortableStorageEntitlementIssuanceScope,
): boolean {

  return (
    record.issuerId ===
      issuerId &&
    record.purpose ===
      FINORA_PORTABLE_STORAGE_ENTITLEMENT_PURPOSE &&
    record.ownerId ===
      scope.ownerId &&
    record.businessId ===
      scope.businessId &&
    record.branchId ===
      scope.branchId
  );
}

// ============================================================
// RESERVE
// ============================================================

async function reserveInternal(
  scope:
    FinoraPortableStorageEntitlementIssuanceScope,
): Promise<
  FinoraPortableStorageEntitlementIssuanceReservation
> {

  validateReservationScope(
    scope,
  );

  const clockResult =
    await observeFinoraControlCenterAuthoritativeWallClock();

  if (!clockResult.success) {
    throw new Error(
      clockResult.error,
    );
  }

  const issuerId =
    clockResult.data.issuerId;

  const issuedAt =
    clockResult.data.observedAt;

  const existingLedger =
    await readLedger();

  const ledger =
    existingLedger ??
      createEmptyLedger(
        issuedAt,
      );

  const existingIndex =
    ledger.sequences.findIndex(
      (
        record,
      ) =>
        isSameScope(
          record,
          issuerId,
          scope,
        ),
    );

  const portableHighWater =
    existingIndex >=
      0
      ? ledger.sequences[
          existingIndex
        ].lastReservedSequence
      : 0;

  /*
   * STORAGE_ENTITLEMENT existed before device portability and its
   * legacy Control Center sequence namespace is installation
   * scoped.
   *
   * A permanent branch may therefore own historical sequence
   * records across multiple installation IDs.
   *
   * Every portable reservation re-reads that historical
   * branch-wide maximum. This is deliberately not a one-time
   * migration seed: later native credential operations may
   * advance the legacy STORAGE_ENTITLEMENT namespace.
   */
  const historicalHighWater =
    await getFinoraHistoricalStorageEntitlementIssuanceHighWater({
      issuerId,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,
    });

  const previousSequence =
    Math.max(
      historicalHighWater,
      portableHighWater,
    );

  const sequence =
    previousSequence +
      1;

  if (
    !Number.isSafeInteger(
      sequence,
    ) ||
    sequence <=
      0
  ) {
    throw new Error(
      "FINORA Portable Storage Entitlement issuance sequence is exhausted.",
    );
  }

  const nextRecord:
    FinoraPortableStorageEntitlementSequenceRecord = {
      issuerId,

      purpose:
        FINORA_PORTABLE_STORAGE_ENTITLEMENT_PURPOSE,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      lastReservedSequence:
        sequence,

      updatedAt:
        issuedAt,
    };

  if (
    existingIndex >=
      0
  ) {
    ledger.sequences[
      existingIndex
    ] =
      nextRecord;
  } else {
    ledger.sequences.push(
      nextRecord,
    );
  }

  ledger.updatedAt =
    issuedAt;

  /*
   * Persist the reservation before returning package metadata.
   * A later signing failure or process interruption may leave a
   * gap, but a consumed sequence is never reused.
   */
  await writeLedger(
    ledger,
  );

  return {
    packageId:
      `FINORA-PORTABLE-BUSINESS-PROFILE-${randomUUID()}`,

    sequence,

    issuedAt,
  };
}

// ============================================================
// SAME-PROCESS SERIALIZATION
// ============================================================

let portableBusinessProfileIssuanceQueue:
  Promise<void> =
    Promise.resolve();

export function reserveFinoraPortableStorageEntitlementIssuance(
  scope:
    FinoraPortableStorageEntitlementIssuanceScope,
): Promise<
  FinoraPortableStorageEntitlementIssuanceReservation
> {

  const operation =
    portableBusinessProfileIssuanceQueue.then(
      () =>
        reserveInternal(
          scope,
        ),
      () =>
        reserveInternal(
          scope,
        ),
    );

  portableBusinessProfileIssuanceQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}
