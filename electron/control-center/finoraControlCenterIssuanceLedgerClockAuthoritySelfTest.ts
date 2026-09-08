/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER ISSUANCE LEDGER CLOCK AUTHORITY SELF TEST

   VERIFY:

   - Isolated Electron userData
   - Real Electron safeStorage runtime
   - General issuance reservation succeeds
   - Reservation establishes issuer-bound clock high-water
   - Reservation issuedAt equals accepted authority observation
   - General issuance sequence starts at 1
   - Persisted issuance ledger contains exact first reservation
   - Future persisted issuer high-water rejects later reservation
   - Rejected rollback does not consume another issuance sequence
   - Rejected rollback does not mutate issuance ledger bytes
   - Rejected rollback does not mutate clock high-water state
   - Successful / rejected paths leave no temporary files

   IMPORTANT:

   - No renderer.
   - No IPC.
   - No recipient installation binding authority.
   - The future high-water seed is a native selftest fixture only.
   - This proves fail-closed issuance while the persisted encrypted
     high-water remains intact.
   - It does not claim resistance to arbitrary historical encrypted
     file replacement.
=========================================================== */

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
  loadFinoraControlCenterClockHighWaterState,
  persistFinoraControlCenterClockHighWaterState,
} from "./finoraControlCenterClockHighWaterStore.js";

import {
  reserveFinoraControlCenterIssuance,
} from "./finoraControlCenterIssuanceLedger.js";

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
// TIME
// ============================================================

function isCanonicalIsoTimestamp(
  value:
    string,
): boolean {

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

function addMilliseconds(
  iso:
    string,

  milliseconds:
    number,
): string {

  const parsed =
    Date.parse(
      iso,
    );

  assert(
    Number.isFinite(
      parsed,
    ),
    `Invalid timestamp fixture: ${iso}`,
  );

  return new Date(
    parsed +
      milliseconds,
  ).toISOString();
}

// ============================================================
// PERSISTED TEST VIEW
// ============================================================

interface PersistedIssuanceSequenceRecord {
  issuerId:
    string;

  purpose:
    string;

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

interface PersistedIssuanceLedger {
  sequences:
    PersistedIssuanceSequenceRecord[];

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    number;
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
        "finora-control-center-issuance-clock-selftest-",
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
      "Electron safeStorage encryption is unavailable for general issuance clock-authority selftest.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // FIXTURE SCOPE
    // --------------------------------------------------------

    const scope = {
      ownerId:
        "OWNER-AY9G3B",

      businessId:
        "BUSINESS-AY9G3B",

      branchId:
        "BRANCH-AY9G3B",

      installationId:
        "INSTALLATION-AY9G3B",
    };

    // --------------------------------------------------------
    // FIRST PRODUCTION RESERVATION
    // --------------------------------------------------------

    const firstReservation =
      await reserveFinoraControlCenterIssuance({
        purpose:
          "BRANCH_ACTIVATION",

        scope,
      });

    assert(
      firstReservation.sequence ===
        1 &&
      typeof firstReservation.packageId ===
        "string" &&
      firstReservation.packageId.length >
        0 &&
      isCanonicalIsoTimestamp(
        firstReservation.issuedAt,
      ),
      "Initial general issuance reservation is invalid.",
    );

    console.log(
      "PASS: first general issuance reservation succeeded at sequence 1",
    );

    // --------------------------------------------------------
    // AUTHORITY HIGH-WATER ESTABLISHED
    // --------------------------------------------------------

    const firstHighWater =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      firstHighWater !==
        undefined &&
      typeof firstHighWater.issuerId ===
        "string" &&
      firstHighWater.issuerId.length >
        0 &&
      firstHighWater.highWaterAt ===
        firstReservation.issuedAt,
      "General issuance did not establish matching issuer clock high-water.",
    );

    console.log(
      "PASS: general issuance reservation established matching issuer clock high-water",
    );

    // --------------------------------------------------------
    // PERSISTED ISSUANCE LEDGER
    // --------------------------------------------------------

    const controlCenterDirectory =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
      );

    const issuanceLedgerPath =
      join(
        controlCenterDirectory,
        "finora-control-center-issuance-ledger.bin",
      );

    const issuanceLedgerBeforeRollback =
      await readFile(
        issuanceLedgerPath,
      );

    assert(
      issuanceLedgerBeforeRollback.length >
        0,
      "Persisted general issuance ledger is empty.",
    );

    const decryptedLedger =
      safeStorage.decryptString(
        issuanceLedgerBeforeRollback,
      );

    const parsedLedger =
      JSON.parse(
        decryptedLedger,
      ) as PersistedIssuanceLedger;

    const persistedScope =
      parsedLedger.sequences.find(
        (
          record,
        ) =>
          record.issuerId ===
            firstHighWater.issuerId &&
          record.purpose ===
            "BRANCH_ACTIVATION" &&
          record.ownerId ===
            scope.ownerId &&
          record.businessId ===
            scope.businessId &&
          record.branchId ===
            scope.branchId &&
          record.installationId ===
            scope.installationId,
      );

    assert(
      parsedLedger.schemaVersion ===
        1 &&
      parsedLedger.createdAt ===
        firstReservation.issuedAt &&
      parsedLedger.updatedAt ===
        firstReservation.issuedAt &&
      persistedScope !==
        undefined &&
      persistedScope.lastReservedSequence ===
        1 &&
      persistedScope.updatedAt ===
        firstReservation.issuedAt,
      "Persisted general issuance ledger does not match the first authority-backed reservation.",
    );

    console.log(
      "PASS: persisted general issuance ledger contains exact authority-backed first reservation",
    );

    // --------------------------------------------------------
    // SEED FUTURE HIGH-WATER
    //
    // Fixture-only mutation. One hour gives ample separation from
    // the actual wall clock used by the next production reservation.
    // --------------------------------------------------------

    const futureHighWaterAt =
      addMilliseconds(
        firstReservation.issuedAt,
        60 * 60 * 1000,
      );

    await persistFinoraControlCenterClockHighWaterState({
      schemaVersion:
        1,

      issuerId:
        firstHighWater.issuerId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededHighWater =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      seededHighWater !==
        undefined &&
      seededHighWater.issuerId ===
        firstHighWater.issuerId &&
      seededHighWater.highWaterAt ===
        futureHighWaterAt,
      "Future issuer high-water fixture was not persisted.",
    );

    const seededHighWaterSerialized =
      JSON.stringify(
        seededHighWater,
      );

    console.log(
      "PASS: future issuer clock high-water fixture seeded",
    );

    // --------------------------------------------------------
    // PRODUCTION RESERVATION MUST FAIL CLOSED
    // --------------------------------------------------------

    let rollbackError:
      unknown;

    try {
      await reserveFinoraControlCenterIssuance({
        purpose:
          "BRANCH_ACTIVATION",

        scope,
      });
    } catch (
      error
    ) {
      rollbackError =
        error;
    }

    assert(
      rollbackError instanceof
        Error &&
      /rollback/i.test(
        rollbackError.message,
      ),
      "General issuance did not reject persisted issuer clock rollback.",
    );

    console.log(
      "PASS: general issuance rejected persisted issuer clock rollback before sequence reservation",
    );

    // --------------------------------------------------------
    // ISSUANCE LEDGER ZERO MUTATION
    // --------------------------------------------------------

    const issuanceLedgerAfterRollback =
      await readFile(
        issuanceLedgerPath,
      );

    assert(
      issuanceLedgerAfterRollback.equals(
        issuanceLedgerBeforeRollback,
      ),
      "Rejected clock rollback mutated persisted general issuance ledger bytes.",
    );

    const decryptedAfterRollback =
      safeStorage.decryptString(
        issuanceLedgerAfterRollback,
      );

    const parsedAfterRollback =
      JSON.parse(
        decryptedAfterRollback,
      ) as PersistedIssuanceLedger;

    const persistedAfterRollback =
      parsedAfterRollback.sequences.find(
        (
          record,
        ) =>
          record.issuerId ===
            firstHighWater.issuerId &&
          record.purpose ===
            "BRANCH_ACTIVATION" &&
          record.ownerId ===
            scope.ownerId &&
          record.businessId ===
            scope.businessId &&
          record.branchId ===
            scope.branchId &&
          record.installationId ===
            scope.installationId,
      );

    assert(
      persistedAfterRollback !==
        undefined &&
      persistedAfterRollback.lastReservedSequence ===
        1,
      "Rejected clock rollback consumed another issuance sequence.",
    );

    console.log(
      "PASS: rollback rejection preserved issuance ledger bytes and sequence 1",
    );

    // --------------------------------------------------------
    // HIGH-WATER ZERO MUTATION
    // --------------------------------------------------------

    const highWaterAfterRollback =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      highWaterAfterRollback !==
        undefined &&
      JSON.stringify(
        highWaterAfterRollback,
      ) ===
        seededHighWaterSerialized,
      "Rejected issuance rollback mutated persisted issuer clock high-water.",
    );

    console.log(
      "PASS: rollback rejection preserved seeded issuer clock high-water",
    );

    // --------------------------------------------------------
    // TEMP FILE CLEANUP
    // --------------------------------------------------------

    const directoryEntries =
      await readdir(
        controlCenterDirectory,
      );

    const temporaryEntries =
      directoryEntries.filter(
        (
          entry,
        ) =>
          entry.endsWith(
            ".tmp",
          ),
      );

    assert(
      temporaryEntries.length ===
        0,
      `General issuance clock-authority selftest left temporary files: ${temporaryEntries.join(", ")}`,
    );

    console.log(
      "PASS: general issuance authority paths left no temporary files",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA CONTROL CENTER ISSUANCE LEDGER CLOCK AUTHORITY SELFTEST",
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
      "PASS: isolated temporary general issuance clock-authority userData deleted",
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
        "FAIL: FINORA CONTROL CENTER ISSUANCE LEDGER CLOCK AUTHORITY SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );