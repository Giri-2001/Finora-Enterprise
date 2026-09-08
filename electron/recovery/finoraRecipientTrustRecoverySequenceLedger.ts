// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY SEQUENCE + CLOCK LEDGER
//
// MODULE  : Offline Recovery Authority
// LAYER   : Privileged Native Persistence
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Reserve Recovery package sequence numbers before signing
// - Bind issuance state to one immutable Recovery Authority ID
// - Scope sequences by:
//   * recoveryAuthorityId
//   * RECIPIENT_TRUST_RECOVERY purpose
//   * installationId
//   * operationalIssuerId
// - Persist an issuer-local wall-clock high-water
// - Reject wall-clock rollback before sequence reservation
// - Encrypt complete ledger state using Electron safeStorage
// - Serialize same-process reservation operations
//
// SECURITY:
//
// - No renderer / IPC / preload.
// - No recipient trust-store mutation.
// - No recipient Recovery public-anchor mutation.
// - No private signing-key access.
// - No package signing.
// - No artifact writing.
//
// FAILURE MODEL:
//
// Sequence reservation is durable before signing. A later signing
// or export failure can therefore leave a sequence gap. Recipient
// Recovery validation intentionally allows forward sequence gaps.
//
// This store does not claim arbitrary historical encrypted-file
// rollback resistance, cross-process CAS, fsync durability, or
// arbitrary same-user/OS compromise resistance.
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

import {
  FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,
} from "../control/finoraRecipientTrustRecoveryContract.js";

// ============================================================
// CONSTANTS
// ============================================================

const RECOVERY_SEQUENCE_LEDGER_SCHEMA_VERSION =
  1 as const;

const RECOVERY_LEDGER_DIRECTORY =
  "finora";

const RECOVERY_LEDGER_SUBDIRECTORY =
  "recovery";

const RECOVERY_SEQUENCE_LEDGER_FILE =
  "finora-recipient-trust-recovery-sequence-ledger.bin";

// ============================================================
// TYPES
// ============================================================

export interface FinoraRecipientTrustRecoverySequenceScope {
  purpose:
    typeof FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE;

  installationId:
    string;

  operationalIssuerId:
    string;

  lastReservedSequence:
    number;

  updatedAt:
    string;
}

export interface FinoraRecipientTrustRecoverySequenceLedgerState {
  schemaVersion:
    typeof RECOVERY_SEQUENCE_LEDGER_SCHEMA_VERSION;

  recoveryAuthorityId:
    string;

  highWaterAt:
    string;

  scopes:
    FinoraRecipientTrustRecoverySequenceScope[];
}

export interface FinoraRecipientTrustRecoverySequenceReservationRequest {
  recoveryAuthorityId:
    string;

  installationId:
    string;

  operationalIssuerId:
    string;

  observedAt:
    string;
}

export interface FinoraRecipientTrustRecoverySequenceReservation {
  recoveryAuthorityId:
    string;

  purpose:
    typeof FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE;

  installationId:
    string;

  operationalIssuerId:
    string;

  sequence:
    number;

  reservedAt:
    string;

  highWaterAt:
    string;
}

// ============================================================
// HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is
  Record<
    string,
    unknown
  > {
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

function hasOnlyKeys(
  value:
    Record<
      string,
      unknown
    >,
  expected:
    readonly string[],
): boolean {
  const actual =
    Object.keys(
      value,
    );

  if (
    actual.length !==
      expected.length
  ) {
    return false;
  }

  const expectedSet =
    new Set(
      expected,
    );

  return actual.every(
    (key) =>
      expectedSet.has(
        key,
      ),
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is
  string {
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
): value is
  string {
  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  const milliseconds =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      milliseconds,
    ) &&
    new Date(
      milliseconds,
    ).toISOString() ===
      value
  );
}

function isPositiveSafeInteger(
  value:
    unknown,
): value is
  number {
  return (
    typeof value ===
      "number" &&
    Number.isSafeInteger(
      value,
    ) &&
    value >
      0
  );
}

function validateScopeIdentity(
  installationId:
    unknown,
  operationalIssuerId:
    unknown,
): void {
  if (
    !isNonEmptyString(
      installationId,
    ) ||
    !isNonEmptyString(
      operationalIssuerId,
    )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence scope is invalid.",
    );
  }
}

// ============================================================
// STRICT STATE VALIDATION
// ============================================================

export function validateFinoraRecipientTrustRecoverySequenceLedgerState(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustRecoverySequenceLedgerState {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "schemaVersion",
        "recoveryAuthorityId",
        "highWaterAt",
        "scopes",
      ],
    ) ||
    value.schemaVersion !==
      RECOVERY_SEQUENCE_LEDGER_SCHEMA_VERSION ||
    !isNonEmptyString(
      value.recoveryAuthorityId,
    ) ||
    !isCanonicalIsoTimestamp(
      value.highWaterAt,
    ) ||
    !Array.isArray(
      value.scopes,
    )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence ledger structure is invalid.",
    );
  }

  const seenScopes =
    new Set<
      string
    >();

  for (
    const candidate of
      value.scopes
  ) {
    if (
      !isRecord(
        candidate,
      ) ||
      !hasOnlyKeys(
        candidate,
        [
          "purpose",
          "installationId",
          "operationalIssuerId",
          "lastReservedSequence",
          "updatedAt",
        ],
      ) ||
      candidate.purpose !==
        FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE ||
      !isNonEmptyString(
        candidate.installationId,
      ) ||
      !isNonEmptyString(
        candidate.operationalIssuerId,
      ) ||
      !isPositiveSafeInteger(
        candidate.lastReservedSequence,
      ) ||
      !isCanonicalIsoTimestamp(
        candidate.updatedAt,
      )
    ) {
      throw new Error(
        "FINORA Recipient Trust Recovery sequence ledger contains an invalid scope.",
      );
    }

    if (
      Date.parse(
        candidate.updatedAt,
      ) >
      Date.parse(
        value.highWaterAt,
      )
    ) {
      throw new Error(
        "FINORA Recipient Trust Recovery sequence scope timestamp exceeds ledger high-water.",
      );
    }

    const scopeKey =
      JSON.stringify([
        candidate.purpose,
        candidate.installationId,
        candidate.operationalIssuerId,
      ]);

    if (
      seenScopes.has(
        scopeKey,
      )
    ) {
      throw new Error(
        "FINORA Recipient Trust Recovery sequence ledger contains a duplicate scope.",
      );
    }

    seenScopes.add(
      scopeKey,
    );
  }
}

// ============================================================
// REQUEST VALIDATION
// ============================================================

function validateReservationRequest(
  request:
    FinoraRecipientTrustRecoverySequenceReservationRequest,
): void {
  if (
    !isRecord(
      request,
    )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence reservation request is invalid.",
    );
  }

  if (
    !isNonEmptyString(
      request.recoveryAuthorityId,
    ) ||
    !isCanonicalIsoTimestamp(
      request.observedAt,
    )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence reservation authority or timestamp is invalid.",
    );
  }

  validateScopeIdentity(
    request.installationId,
    request.operationalIssuerId,
  );
}

// ============================================================
// PATH
// ============================================================

function getRecoverySequenceLedgerPath():
  string {
  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence ledger cannot be used before Electron is ready.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    RECOVERY_LEDGER_DIRECTORY,
    RECOVERY_LEDGER_SUBDIRECTORY,
    RECOVERY_SEQUENCE_LEDGER_FILE,
  );
}

// ============================================================
// SECURE STORAGE
// ============================================================

function assertSafeStorageAvailable():
  void {
  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure storage is unavailable for the Recipient Trust Recovery sequence ledger.",
    );
  }
}

// ============================================================
// LOAD
// ============================================================

export async function loadFinoraRecipientTrustRecoverySequenceLedger():
  Promise<
    FinoraRecipientTrustRecoverySequenceLedgerState |
    undefined
  > {
  const ledgerPath =
    getRecoverySequenceLedgerPath();

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
        error as
          NodeJS.ErrnoException
      ).code;

    if (
      code ===
        "ENOENT"
    ) {
      return undefined;
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA Recipient Trust Recovery sequence ledger.",
    );
  }

  assertSafeStorageAvailable();

  let plaintext:
    string;

  try {
    plaintext =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence ledger cannot be decrypted.",
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
      "FINORA Recipient Trust Recovery sequence ledger contains invalid JSON.",
    );
  }

  validateFinoraRecipientTrustRecoverySequenceLedgerState(
    parsed,
  );

  return parsed;
}

// ============================================================
// PERSIST COMPLETE STATE
// ============================================================

async function persistRecoverySequenceLedger(
  state:
    FinoraRecipientTrustRecoverySequenceLedgerState,
): Promise<void> {
  validateFinoraRecipientTrustRecoverySequenceLedgerState(
    state,
  );

  assertSafeStorageAvailable();

  const ledgerPath =
    getRecoverySequenceLedgerPath();

  const ledgerDirectory =
    path.dirname(
      ledgerPath,
    );

  await fs.mkdir(
    ledgerDirectory,
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
        state,
      ),
    );

  const temporaryPath =
    `${ledgerPath}.${process.pid}.${randomUUID()}.tmp`;

  let temporaryCreated =
    false;

  try {
    await fs.writeFile(
      temporaryPath,
      encrypted,
      {
        flag:
          "wx",

        mode:
          0o600,
      },
    );

    temporaryCreated =
      true;

    await fs.rename(
      temporaryPath,
      ledgerPath,
    );

    temporaryCreated =
      false;
  } finally {
    if (
      temporaryCreated
    ) {
      try {
        await fs.rm(
          temporaryPath,
          {
            force:
              true,
          },
        );
      } catch {
        // Best-effort cleanup only.
      }
    }
  }
}

// ============================================================
// RESERVATION INTERNAL
// ============================================================

async function reserveRecoverySequenceInternal(
  request:
    FinoraRecipientTrustRecoverySequenceReservationRequest,
): Promise<
  FinoraRecipientTrustRecoverySequenceReservation
> {
  validateReservationRequest(
    request,
  );

  const existing =
    await loadFinoraRecipientTrustRecoverySequenceLedger();

  if (
    existing &&
    existing.recoveryAuthorityId !==
      request.recoveryAuthorityId
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence ledger is bound to another Recovery Authority.",
    );
  }

  if (
    existing &&
    Date.parse(
      request.observedAt,
    ) <
      Date.parse(
        existing.highWaterAt,
      )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority wall-clock rollback was detected.",
    );
  }

  const scopes =
    existing
      ? existing.scopes.map(
          (scope) => ({
            ...scope,
          }),
        )
      : [];

  const scopeIndex =
    scopes.findIndex(
      (scope) =>
        scope.purpose ===
          FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE &&
        scope.installationId ===
          request.installationId &&
        scope.operationalIssuerId ===
          request.operationalIssuerId,
    );

  let sequence:
    number;

  if (
    scopeIndex >=
      0
  ) {
    const current =
      scopes[
        scopeIndex
      ];

    if (
      current.lastReservedSequence >=
        Number.MAX_SAFE_INTEGER
    ) {
      throw new Error(
        "FINORA Recipient Trust Recovery sequence space is exhausted for this target scope.",
      );
    }

    sequence =
      current.lastReservedSequence +
      1;

    scopes[
      scopeIndex
    ] = {
      ...current,

      lastReservedSequence:
        sequence,

      updatedAt:
        request.observedAt,
    };
  } else {
    sequence =
      1;

    scopes.push({
      purpose:
        FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,

      installationId:
        request.installationId,

      operationalIssuerId:
        request.operationalIssuerId,

      lastReservedSequence:
        sequence,

      updatedAt:
        request.observedAt,
    });
  }

  const nextHighWaterAt =
    existing &&
    Date.parse(
      existing.highWaterAt,
    ) >
      Date.parse(
        request.observedAt,
      )
      ? existing.highWaterAt
      : request.observedAt;

  const nextState:
    FinoraRecipientTrustRecoverySequenceLedgerState = {
      schemaVersion:
        RECOVERY_SEQUENCE_LEDGER_SCHEMA_VERSION,

      recoveryAuthorityId:
        request.recoveryAuthorityId,

      highWaterAt:
        nextHighWaterAt,

      scopes,
    };

  validateFinoraRecipientTrustRecoverySequenceLedgerState(
    nextState,
  );

  await persistRecoverySequenceLedger(
    nextState,
  );

  const persisted =
    await loadFinoraRecipientTrustRecoverySequenceLedger();

  if (
    !persisted ||
    JSON.stringify(
      persisted,
    ) !==
      JSON.stringify(
        nextState,
      )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery sequence reservation read-back verification failed.",
    );
  }

  return {
    recoveryAuthorityId:
      request.recoveryAuthorityId,

    purpose:
      FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,

    installationId:
      request.installationId,

    operationalIssuerId:
      request.operationalIssuerId,

    sequence,

    reservedAt:
      request.observedAt,

    highWaterAt:
      persisted.highWaterAt,
  };
}

// ============================================================
// SAME-PROCESS SERIALIZATION
// ============================================================

let recoverySequenceReservationQueue:
  Promise<
    void
  > =
    Promise.resolve();

export function reserveFinoraRecipientTrustRecoverySequence(
  request:
    FinoraRecipientTrustRecoverySequenceReservationRequest,
): Promise<
  FinoraRecipientTrustRecoverySequenceReservation
> {
  const operation =
    recoverySequenceReservationQueue.then(
      () =>
        reserveRecoverySequenceInternal(
          request,
        ),
      () =>
        reserveRecoverySequenceInternal(
          request,
        ),
    );

  recoverySequenceReservationQueue =
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