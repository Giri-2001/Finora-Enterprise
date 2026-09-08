/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION ISSUANCE LEDGER

   MODULE  : Control Center
   LAYER   : Privileged Native Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Reserve recipient trust-transition package IDs
   - Reserve monotonic installation-level sequences
   - Produce authoritative issuedAt timestamps
   - Persist reservations before signing
   - Preserve stable issuer sequence continuity across
     Control Center signing-key rotations

   SCOPE:

   issuerId
   + RECIPIENT_TRUST_TRANSITION
   + installationId

   IMPORTANT:

   - No ownerId.
   - No businessId.
   - No branchId.
   - No renderer.
   - No IPC.
   - No private signing keys.
   - No recipient trust mutation.
   - No package signing.

   SECURITY / FAILURE MODEL:

   - safeStorage encrypted.
   - Unique temporary file + rename replacement.
   - Same Electron main-process serialization.
   - Reservation is persisted before caller signs.
   - Sequence gaps are allowed if signing/export later fails.
   - No cross-process CAS guarantee.
   - No fsync / power-loss durability claim.
=========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import {
  randomUUID,
} from "node:crypto";

import {
  promises as fs,
} from "node:fs";

import path from "node:path";

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
  "finora-recipient-trust-transition-issuance.bin";

const PURPOSE =
  "RECIPIENT_TRUST_TRANSITION" as const;

// ============================================================
// CONTRACTS
// ============================================================

export interface FinoraRecipientTrustTransitionIssuanceScope {
  issuerId:
    string;

  installationId:
    string;
}

export interface FinoraRecipientTrustTransitionIssuanceReservation {
  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;
}

interface FinoraRecipientTrustTransitionIssuanceSequenceRecord {
  issuerId:
    string;

  purpose:
    typeof PURPOSE;

  installationId:
    string;

  lastReservedSequence:
    number;

  updatedAt:
    string;
}

interface FinoraRecipientTrustTransitionIssuanceLedger {
  sequences:
    FinoraRecipientTrustTransitionIssuanceSequenceRecord[];

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// BASIC VALIDATION
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

function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is string {
  if (
    !isNonEmptyString(
      value,
    )
  ) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function isSequenceRecord(
  value:
    unknown,
): value is
  FinoraRecipientTrustTransitionIssuanceSequenceRecord {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "installationId",
      "issuerId",
      "lastReservedSequence",
      "purpose",
      "updatedAt",
    ];

  if (
    keys.length !==
      expectedKeys.length ||
    !keys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[index],
    )
  ) {
    return false;
  }

  return (
    isNonEmptyString(
      value.issuerId,
    ) &&
    value.purpose ===
      PURPOSE &&
    isNonEmptyString(
      value.installationId,
    ) &&
    Number.isSafeInteger(
      value.lastReservedSequence,
    ) &&
    (
      value.lastReservedSequence as number
    ) >
      0 &&
    isCanonicalIsoTimestamp(
      value.updatedAt,
    )
  );
}

function validateLedger(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustTransitionIssuanceLedger {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA recipient trust-transition issuance ledger is invalid.",
    );
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "createdAt",
      "schemaVersion",
      "sequences",
      "updatedAt",
    ];

  if (
    keys.length !==
      expectedKeys.length ||
    !keys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[index],
    ) ||
    value.schemaVersion !==
      1 ||
    !Array.isArray(
      value.sequences,
    ) ||
    !value.sequences.every(
      isSequenceRecord,
    ) ||
    !isCanonicalIsoTimestamp(
      value.createdAt,
    ) ||
    !isCanonicalIsoTimestamp(
      value.updatedAt,
    )
  ) {
    throw new Error(
      "FINORA recipient trust-transition issuance ledger schema is invalid.",
    );
  }

  const scopes =
    new Set<string>();

  for (
    const sequence of
      value.sequences
  ) {
    const scope =
      JSON.stringify([
        sequence.issuerId,
        sequence.purpose,
        sequence.installationId,
      ]);

    if (
      scopes.has(
        scope,
      )
    ) {
      throw new Error(
        "FINORA recipient trust-transition issuance ledger contains a duplicate sequence scope.",
      );
    }

    scopes.add(
      scope,
    );
  }
}

// ============================================================
// PATH
// ============================================================

function getLedgerPath():
  string {
  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA recipient trust-transition issuance ledger cannot be used before Electron is ready.",
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
// READ
// ============================================================

async function readLedger():
  Promise<
    FinoraRecipientTrustTransitionIssuanceLedger | undefined
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
  } catch (
    error
  ) {
    const code =
      (
        error as NodeJS.ErrnoException
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
      "FINORA secure storage is unavailable for recipient trust-transition issuance ledger.",
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
      "FINORA recipient trust-transition issuance ledger cannot be decrypted.",
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
      "FINORA recipient trust-transition issuance ledger is corrupt.",
    );
  }

  validateLedger(
    parsed,
  );

  return parsed;
}

// ============================================================
// WRITE
// ============================================================

async function writeLedger(
  ledger:
    FinoraRecipientTrustTransitionIssuanceLedger,
): Promise<void> {
  validateLedger(
    ledger,
  );

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure storage is unavailable. Trust-transition issuance reservation was not persisted.",
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
    `${ledgerPath}.${process.pid}.${randomUUID()}.tmp`;

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
  } catch (
    error
  ) {
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
// RESERVATION
// ============================================================

async function reserveInternal(
  scope:
    FinoraRecipientTrustTransitionIssuanceScope,
): Promise<
  FinoraRecipientTrustTransitionIssuanceReservation
> {
  if (
    !isNonEmptyString(
      scope.issuerId,
    ) ||
    !isNonEmptyString(
      scope.installationId,
    )
  ) {
    throw new Error(
      "FINORA recipient trust-transition issuance scope is incomplete.",
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

  if (
    clockResult.data.issuerId !==
    scope.issuerId
  ) {
    throw new Error(
      "FINORA recipient trust-transition issuance issuerId does not match the authoritative Control Center issuer.",
    );
  }

  const issuedAt =
    clockResult.data.observedAt;

  const existing =
    await readLedger();

  const ledger:
    FinoraRecipientTrustTransitionIssuanceLedger =
      existing ??
      {
        sequences:
          [],

        createdAt:
          issuedAt,

        updatedAt:
          issuedAt,

        schemaVersion:
          1,
      };

  const existingIndex =
    ledger.sequences.findIndex(
      (record) =>
        record.issuerId ===
          scope.issuerId &&
        record.purpose ===
          PURPOSE &&
        record.installationId ===
          scope.installationId,
    );

  const sequence =
    existingIndex >=
      0
      ? ledger.sequences[
          existingIndex
        ].lastReservedSequence +
        1
      : 1;

  if (
    !Number.isSafeInteger(
      sequence,
    ) ||
    sequence <=
      0
  ) {
    throw new Error(
      "FINORA recipient trust-transition issuance sequence overflowed.",
    );
  }

  const nextRecord:
    FinoraRecipientTrustTransitionIssuanceSequenceRecord = {
      issuerId:
        scope.issuerId,

      purpose:
        PURPOSE,

      installationId:
        scope.installationId,

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

  await writeLedger(
    ledger,
  );

  return {
    packageId:
      `FINORA-TRUST-${randomUUID()}`,

    sequence,

    issuedAt:
      issuedAt,
  };
}

// ============================================================
// SAME-PROCESS SERIALIZATION
// ============================================================

let issuanceQueue:
  Promise<void> =
    Promise.resolve();

export function reserveFinoraRecipientTrustTransitionIssuance(
  scope:
    FinoraRecipientTrustTransitionIssuanceScope,
): Promise<
  FinoraRecipientTrustTransitionIssuanceReservation
> {
  const operation =
    issuanceQueue.then(
      () =>
        reserveInternal(
          scope,
        ),
      () =>
        reserveInternal(
          scope,
        ),
    );

  issuanceQueue =
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