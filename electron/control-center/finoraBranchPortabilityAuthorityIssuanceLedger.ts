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

export const FINORA_BRANCH_PORTABILITY_AUTHORITY_PURPOSE =
  "BRANCH_PORTABILITY_AUTHORITY" as const;

export interface FinoraBranchPortabilityAuthorityIssuanceScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraBranchPortabilityAuthorityIssuanceReservation {
  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;
}

interface FinoraBranchPortabilityAuthoritySequenceRecord {
  issuerId:
    string;

  purpose:
    typeof FINORA_BRANCH_PORTABILITY_AUTHORITY_PURPOSE;

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

interface FinoraBranchPortabilityAuthorityIssuanceLedger {
  sequences:
    FinoraBranchPortabilityAuthoritySequenceRecord[];

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
  "finora-branch-portability-authority-issuance-ledger.bin";

function getLedgerPath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Branch Portability Authority issuance ledger cannot be used before Electron is ready.",
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
): value is FinoraBranchPortabilityAuthorityIssuanceScope {

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
): value is FinoraBranchPortabilityAuthoritySequenceRecord {

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
      FINORA_BRANCH_PORTABILITY_AUTHORITY_PURPOSE &&
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
): value is FinoraBranchPortabilityAuthorityIssuanceLedger {

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
    FinoraBranchPortabilityAuthorityIssuanceScope,
): void {

  if (!isIssuanceScope(scope)) {
    throw new Error(
      "FINORA Branch Portability Authority issuance scope must contain exactly ownerId, businessId, and branchId.",
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
  FinoraBranchPortabilityAuthorityIssuanceLedger {

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
    FinoraBranchPortabilityAuthorityIssuanceLedger | undefined
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
      "FINORA secure Branch Portability Authority issuance-ledger encryption is unavailable.",
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
      "FINORA Branch Portability Authority issuance ledger cannot be decrypted.",
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
      "FINORA Branch Portability Authority issuance ledger is corrupt.",
    );
  }

  if (!isLedger(parsed)) {
    throw new Error(
      "FINORA Branch Portability Authority issuance ledger schema is invalid.",
    );
  }

  return parsed;
}

// ============================================================
// WRITE
// ============================================================

async function writeLedger(
  ledger:
    FinoraBranchPortabilityAuthorityIssuanceLedger,
): Promise<void> {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Portability Authority issuance-ledger encryption is unavailable. Reservation was not persisted.",
    );
  }

  if (!isLedger(ledger)) {
    throw new Error(
      "FINORA Branch Portability Authority issuance ledger failed schema validation.",
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
    FinoraBranchPortabilityAuthoritySequenceRecord,

  issuerId:
    string,

  scope:
    FinoraBranchPortabilityAuthorityIssuanceScope,
): boolean {

  return (
    record.issuerId ===
      issuerId &&
    record.purpose ===
      FINORA_BRANCH_PORTABILITY_AUTHORITY_PURPOSE &&
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
    FinoraBranchPortabilityAuthorityIssuanceScope,
): Promise<
  FinoraBranchPortabilityAuthorityIssuanceReservation
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

  const previousSequence =
    existingIndex >=
      0
      ? ledger.sequences[
          existingIndex
        ].lastReservedSequence
      : 0;

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
      "FINORA Branch Portability Authority issuance sequence is exhausted.",
    );
  }

  const nextRecord:
    FinoraBranchPortabilityAuthoritySequenceRecord = {
      issuerId,

      purpose:
        FINORA_BRANCH_PORTABILITY_AUTHORITY_PURPOSE,

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
      `FINORA-BRANCH-PORTABILITY-${randomUUID()}`,

    sequence,

    issuedAt,
  };
}

// ============================================================
// SAME-PROCESS SERIALIZATION
// ============================================================

let branchPortabilityIssuanceQueue:
  Promise<void> =
    Promise.resolve();

export function reserveFinoraBranchPortabilityAuthorityIssuance(
  scope:
    FinoraBranchPortabilityAuthorityIssuanceScope,
): Promise<
  FinoraBranchPortabilityAuthorityIssuanceReservation
> {

  const operation =
    branchPortabilityIssuanceQueue.then(
      () =>
        reserveInternal(
          scope,
        ),
      () =>
        reserveInternal(
          scope,
        ),
    );

  branchPortabilityIssuanceQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}