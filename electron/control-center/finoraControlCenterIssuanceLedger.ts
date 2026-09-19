// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// ISSUANCE SEQUENCE LEDGER
//
// RESPONSIBILITY:
//
// - Allocate signed-package envelope metadata in Electron main
// - Generate packageId inside the privileged boundary
// - Allocate monotonic issuance sequence per replay scope
// - Persist reservations before package signing
// - Prevent renderer-controlled sequence/package identifiers
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - NO renderer exposure.
// - NO signing private-key exposure.
// - Encrypted with Electron safeStorage.
// - Atomic temp-file -> rename replacement.
// - Corrupt ledgers are never silently replaced.
//
// CONSISTENCY:
//
// - Reservation operations are serialized inside this Electron
//   main process.
// - A crash after reservation may leave a sequence gap.
// - Sequence gaps are acceptable; duplicate/stale sequence reuse
//   is not.
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";

import path from "node:path";

import {
  randomUUID,
} from "node:crypto";

import type {
  FinoraControlCenterPackagePurpose,
} from "./finoraControlCenterSigner.js";

import {
  observeFinoraControlCenterAuthoritativeWallClock,
} from "./finoraControlCenterClockHighWaterAuthorityService.js";

// ============================================================
// CONSTANTS
// ============================================================

const LEDGER_DIRECTORY =
  "FINORA";

const LEDGER_SUBDIRECTORY =
  "control-center";

const LEDGER_FILE =
  "finora-control-center-issuance-ledger.bin";

// ============================================================
// CONTRACTS
// ============================================================

/**
 * Purpose namespace owned by the issuance ledger.
 *
 * INSTALLATION_ENROLLMENT_RESPONSE is intentionally a
 * pre-trust bootstrap issuance purpose and is NOT added to
 * FinoraControlCenterPackagePurpose.
 */
export type FinoraControlCenterIssuancePurpose =
  | FinoraControlCenterPackagePurpose
  | "INSTALLATION_ENROLLMENT_RESPONSE";

export interface FinoraControlCenterIssuanceScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;
}

export interface ReserveFinoraControlCenterIssuanceInput {
  purpose:
    FinoraControlCenterIssuancePurpose;

  scope:
    FinoraControlCenterIssuanceScope;
}

export interface FinoraHistoricalBranchAccessIssuanceHighWaterScope {
  issuerId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraHistoricalBusinessProfileIssuanceHighWaterScope {
  issuerId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraHistoricalPricingPolicyIssuanceHighWaterScope {
  issuerId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraHistoricalStorageEntitlementIssuanceHighWaterScope {
  issuerId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}
export interface FinoraControlCenterIssuanceReservation {
  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;
}

interface FinoraControlCenterIssuanceSequenceRecord {
  issuerId:
    string;

  purpose:
    FinoraControlCenterIssuancePurpose;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  lastReservedSequence:
    number;

  updatedAt:
    string;
}

interface FinoraControlCenterIssuanceLedger {
  sequences:
    FinoraControlCenterIssuanceSequenceRecord[];

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// PATH
// ============================================================

function getLedgerPath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Center issuance ledger cannot be used before Electron is ready.",
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

function isIssuancePurpose(
  value:
    unknown,
): value is FinoraControlCenterIssuancePurpose {

  return (
    value ===
      "BRANCH_ACTIVATION" ||
    value ===
      "BRANCH_ACCESS" ||
    value ===
      "DEVICE_REVOCATION" ||
    value ===
      "STORAGE_ENTITLEMENT" ||
    value ===
      "BUSINESS_PROFILE" ||
    value ===
      "PRICING_POLICY" ||
    value ===
      "WALLET_RECHARGE" ||
    value ===
      "WALLET_RECHARGE_DECLINE" ||
    value ===
      "CONTROL_BUNDLE" ||
    value ===
      "INSTALLATION_ENROLLMENT_RESPONSE"
  );
}

function isSequenceRecord(
  value:
    unknown,
): value is FinoraControlCenterIssuanceSequenceRecord {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const record =
    value as
      Record<string, unknown>;

  return (
    isNonEmptyString(
      record.issuerId,
    ) &&
    isIssuancePurpose(
      record.purpose,
    ) &&
    isNonEmptyString(
      record.ownerId,
    ) &&
    isNonEmptyString(
      record.businessId,
    ) &&
    isNonEmptyString(
      record.branchId,
    ) &&
    isNonEmptyString(
      record.installationId,
    ) &&
    Number.isSafeInteger(
      record.lastReservedSequence,
    ) &&
    (
      record.lastReservedSequence as
        number
    ) >
      0 &&
    isCanonicalTimestamp(
      record.updatedAt,
    )
  );
}

function isIssuanceLedger(
  value:
    unknown,
): value is FinoraControlCenterIssuanceLedger {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const record =
    value as
      Record<string, unknown>;

  return (
    record.schemaVersion ===
      1 &&
    Array.isArray(
      record.sequences,
    ) &&
    record.sequences.every(
      isSequenceRecord,
    ) &&
    isCanonicalTimestamp(
      record.createdAt,
    ) &&
    isCanonicalTimestamp(
      record.updatedAt,
    )
  );
}

function validateReservationInput(
  input:
    ReserveFinoraControlCenterIssuanceInput,
): void {

  if (
    !isIssuancePurpose(
      input.purpose,
    ) ||
    !isNonEmptyString(
      input.scope.ownerId,
    ) ||
    !isNonEmptyString(
      input.scope.businessId,
    ) ||
    !isNonEmptyString(
      input.scope.branchId,
    ) ||
    !isNonEmptyString(
      input.scope.installationId,
    )
  ) {
    throw new Error(
      "FINORA Control Center issuance scope is incomplete.",
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
  FinoraControlCenterIssuanceLedger {

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
    FinoraControlCenterIssuanceLedger | undefined
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
      "FINORA secure issuance-ledger encryption is unavailable.",
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
      "FINORA Control Center issuance ledger cannot be decrypted.",
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
      "FINORA Control Center issuance ledger is corrupt.",
    );
  }

  if (
    !isIssuanceLedger(
      parsed,
    )
  ) {
    throw new Error(
      "FINORA Control Center issuance ledger schema is invalid.",
    );
  }

  return parsed;
}

// ============================================================
// HISTORICAL BRANCH_ACCESS BRANCH HIGH-WATER
// ============================================================

export async function getFinoraHistoricalBranchAccessIssuanceHighWater(
  scope:
    FinoraHistoricalBranchAccessIssuanceHighWaterScope,
): Promise<number> {

  if (
    typeof scope !==
      "object" ||
    scope ===
      null ||
    Array.isArray(
      scope,
    )
  ) {
    throw new Error(
      "FINORA historical Branch Access issuance scope is invalid.",
    );
  }

  const actualKeys =
    Object.keys(
      scope,
    ).sort();

  const expectedKeys =
    [
      "issuerId",
      "ownerId",
      "businessId",
      "branchId",
    ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    !actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[
            index
          ],
    ) ||
    !isNonEmptyString(
      scope.issuerId,
    ) ||
    !isNonEmptyString(
      scope.ownerId,
    ) ||
    !isNonEmptyString(
      scope.businessId,
    ) ||
    !isNonEmptyString(
      scope.branchId,
    )
  ) {
    throw new Error(
      "FINORA historical Branch Access issuance scope is incomplete.",
    );
  }

  const ledger =
    await readLedger();

  if (!ledger) {
    return 0;
  }

  let highWater =
    0;

  for (
    const record
    of ledger.sequences
  ) {
    if (
      record.issuerId ===
        scope.issuerId &&
      record.purpose ===
        "BRANCH_ACCESS" &&
      record.ownerId ===
        scope.ownerId &&
      record.businessId ===
        scope.businessId &&
      record.branchId ===
        scope.branchId
    ) {
      highWater =
        Math.max(
          highWater,
          record.lastReservedSequence,
        );
    }
  }

  return highWater;
}

// ============================================================
// HISTORICAL BUSINESS_PROFILE BRANCH HIGH-WATER
// ============================================================

export async function getFinoraHistoricalBusinessProfileIssuanceHighWater(
  scope:
    FinoraHistoricalBusinessProfileIssuanceHighWaterScope,
): Promise<number> {

  if (
    typeof scope !==
      "object" ||
    scope ===
      null ||
    Array.isArray(
      scope,
    )
  ) {
    throw new Error(
      "FINORA historical Business Profile issuance scope is invalid.",
    );
  }

  const actualKeys =
    Object.keys(
      scope,
    ).sort();

  const expectedKeys =
    [
      "issuerId",
      "ownerId",
      "businessId",
      "branchId",
    ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    !actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[
            index
          ],
    ) ||
    !isNonEmptyString(
      scope.issuerId,
    ) ||
    !isNonEmptyString(
      scope.ownerId,
    ) ||
    !isNonEmptyString(
      scope.businessId,
    ) ||
    !isNonEmptyString(
      scope.branchId,
    )
  ) {
    throw new Error(
      "FINORA historical Business Profile issuance scope is incomplete.",
    );
  }

  const ledger =
    await readLedger();

  if (!ledger) {
    return 0;
  }

  let highWater =
    0;

  for (
    const record
    of ledger.sequences
  ) {
    if (
      record.issuerId ===
        scope.issuerId &&
      record.purpose ===
        "BUSINESS_PROFILE" &&
      record.ownerId ===
        scope.ownerId &&
      record.businessId ===
        scope.businessId &&
      record.branchId ===
        scope.branchId
    ) {
      highWater =
        Math.max(
          highWater,
          record.lastReservedSequence,
        );
    }
  }

  return highWater;
}
// ============================================================
// HISTORICAL PRICING_POLICY BRANCH HIGH-WATER
// ============================================================

export async function getFinoraHistoricalPricingPolicyIssuanceHighWater(
  scope:
    FinoraHistoricalPricingPolicyIssuanceHighWaterScope,
): Promise<number> {

  if (
    typeof scope !==
      "object" ||
    scope ===
      null ||
    Array.isArray(
      scope,
    )
  ) {
    throw new Error(
      "FINORA historical Pricing Policy issuance scope is invalid.",
    );
  }

  const actualKeys =
    Object.keys(
      scope,
    ).sort();

  const expectedKeys =
    [
      "issuerId",
      "ownerId",
      "businessId",
      "branchId",
    ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    !actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[
            index
          ],
    ) ||
    !isNonEmptyString(
      scope.issuerId,
    ) ||
    !isNonEmptyString(
      scope.ownerId,
    ) ||
    !isNonEmptyString(
      scope.businessId,
    ) ||
    !isNonEmptyString(
      scope.branchId,
    )
  ) {
    throw new Error(
      "FINORA historical Pricing Policy issuance scope is incomplete.",
    );
  }

  const ledger =
    await readLedger();

  if (!ledger) {
    return 0;
  }

  let highWater =
    0;

  for (
    const record
    of ledger.sequences
  ) {
    if (
      record.issuerId ===
        scope.issuerId &&
      record.purpose ===
        "PRICING_POLICY" &&
      record.ownerId ===
        scope.ownerId &&
      record.businessId ===
        scope.businessId &&
      record.branchId ===
        scope.branchId
    ) {
      highWater =
        Math.max(
          highWater,
          record.lastReservedSequence,
        );
    }
  }

  return highWater;
}
// ============================================================
// HISTORICAL STORAGE_ENTITLEMENT BRANCH HIGH-WATER
// ============================================================
export async function getFinoraHistoricalStorageEntitlementIssuanceHighWater(
  scope:
    FinoraHistoricalStorageEntitlementIssuanceHighWaterScope,
): Promise<number> {

  if (
    typeof scope !==
      "object" ||
    scope ===
      null ||
    Array.isArray(
      scope,
    )
  ) {
    throw new Error(
      "FINORA historical Storage Entitlement issuance scope is invalid.",
    );
  }

  const actualKeys =
    Object.keys(
      scope,
    ).sort();

  const expectedKeys =
    [
      "issuerId",
      "ownerId",
      "businessId",
      "branchId",
    ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    !actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[
            index
          ],
    ) ||
    !isNonEmptyString(
      scope.issuerId,
    ) ||
    !isNonEmptyString(
      scope.ownerId,
    ) ||
    !isNonEmptyString(
      scope.businessId,
    ) ||
    !isNonEmptyString(
      scope.branchId,
    )
  ) {
    throw new Error(
      "FINORA historical Storage Entitlement issuance scope is incomplete.",
    );
  }

  const ledger =
    await readLedger();

  if (!ledger) {
    return 0;
  }

  let highWater =
    0;

  for (
    const record
    of ledger.sequences
  ) {
    if (
      record.issuerId ===
        scope.issuerId &&
      record.purpose ===
        "STORAGE_ENTITLEMENT" &&
      record.ownerId ===
        scope.ownerId &&
      record.businessId ===
        scope.businessId &&
      record.branchId ===
        scope.branchId
    ) {
      highWater =
        Math.max(
          highWater,
          record.lastReservedSequence,
        );
    }
  }

  return highWater;
}
// ============================================================
// WRITE
// ============================================================

async function writeLedger(
  ledger:
    FinoraControlCenterIssuanceLedger,
): Promise<void> {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure issuance-ledger encryption is unavailable. Reservation was not persisted.",
    );
  }

  if (
    !isIssuanceLedger(
      ledger,
    )
  ) {
    throw new Error(
      "FINORA Control Center issuance ledger failed schema validation.",
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
// SCOPE MATCH
// ============================================================

function isSameIssuanceScope(
  record:
    FinoraControlCenterIssuanceSequenceRecord,
  issuerId:
    string,
  input:
    ReserveFinoraControlCenterIssuanceInput,
): boolean {

  return (
    record.issuerId ===
      issuerId &&
    record.purpose ===
      input.purpose &&
    record.ownerId ===
      input.scope.ownerId &&
    record.businessId ===
      input.scope.businessId &&
    record.branchId ===
      input.scope.branchId &&
    record.installationId ===
      input.scope.installationId
  );
}

// ============================================================
// INTERNAL RESERVATION
// ============================================================

async function reserveInternal(
  input:
    ReserveFinoraControlCenterIssuanceInput,
): Promise<
  FinoraControlCenterIssuanceReservation
> {

  validateReservationInput(
    input,
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
      (record) =>
        isSameIssuanceScope(
          record,
          issuerId,
          input,
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
      "FINORA Control Center issuance sequence is exhausted.",
    );
  }


  const nextRecord:
    FinoraControlCenterIssuanceSequenceRecord = {

      issuerId:
        issuerId,

      purpose:
        input.purpose,

      ownerId:
        input.scope.ownerId,

      businessId:
        input.scope.businessId,

      branchId:
        input.scope.branchId,

      installationId:
        input.scope.installationId,

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
   * Persist the sequence reservation BEFORE returning envelope
   * metadata to the caller.
   *
   * If signing later fails or the process crashes, the reserved
   * number remains consumed. This intentionally prefers gaps
   * over duplicate signed sequence reuse.
   */
  await writeLedger(
    ledger,
  );

  const packageId =
    input.purpose ===
      "INSTALLATION_ENROLLMENT_RESPONSE"
      ? `FINORA-ENROLLMENT-RESPONSE-${randomUUID()}`
      : `FINORA-CC-PKG-${randomUUID()}`;

  return {
    packageId,

    sequence,

    issuedAt,
  };
}

// ============================================================
// SAME-PROCESS SERIALIZATION
// ============================================================

let issuanceReservationQueue:
  Promise<void> =
    Promise.resolve();

export function reserveFinoraControlCenterIssuance(
  input:
    ReserveFinoraControlCenterIssuanceInput,
): Promise<
  FinoraControlCenterIssuanceReservation
> {

  const operation =
    issuanceReservationQueue.then(
      () =>
        reserveInternal(
          input,
        ),
      () =>
        reserveInternal(
          input,
        ),
    );

  issuanceReservationQueue =
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
