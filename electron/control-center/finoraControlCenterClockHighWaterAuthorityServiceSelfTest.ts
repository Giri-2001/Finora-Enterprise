/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER CLOCK HIGH-WATER AUTHORITY SELF TEST

   VERIFY:

   - Isolated Electron userData
   - Stable authoritative Control Center issuer identity
   - Missing issuer high-water initializes once
   - Equal observation is accepted without advancement
   - Forward observation advances persisted high-water
   - Backward observation is rejected with zero persisted mutation
   - Foreign issuer binding is rejected with zero mutation
   - Observation before current signing-key createdAt is rejected
   - Mutable caller Date is snapshotted before queued execution
   - Concurrent forward observations serialize deterministically
   - Final persisted state is encrypted and exact
   - Successful writes leave no temporary files

   IMPORTANT:

   - Real Electron safeStorage runtime.
   - Isolated temporary userData only.
   - No renderer.
   - No IPC.
   - No recipient installation binding.
   - This proves rollback detection while the current encrypted
     issuer high-water and key vault remain intact.
   - It does not claim resistance to replacement by coordinated
     older valid encrypted historical files.
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
  observeFinoraControlCenterAuthoritativeWallClock,
} from "./finoraControlCenterClockHighWaterAuthorityService.js";

import {
  loadFinoraControlCenterClockHighWaterState,
  persistFinoraControlCenterClockHighWaterState,
} from "./finoraControlCenterClockHighWaterStore.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "./finoraControlCenterKeyVault.js";

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
// RUN
// ============================================================

async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-control-center-clock-authority-selftest-",
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
      "Electron safeStorage encryption is unavailable for Control Center clock authority selftest.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // AUTHORITATIVE CONTROL CENTER IDENTITY
    // --------------------------------------------------------

    const identity =
      await getFinoraControlCenterPublicIdentity();

    assert(
      typeof identity.issuerId ===
        "string" &&
      identity.issuerId.length >
        0,
      "Control Center public identity did not provide issuerId.",
    );

    const keyCreatedAtMs =
      Date.parse(
        identity.createdAt,
      );

    assert(
      Number.isFinite(
        keyCreatedAtMs,
      ) &&
      new Date(
        keyCreatedAtMs,
      ).toISOString() ===
        identity.createdAt,
      "Control Center current signing-key createdAt is invalid.",
    );

    console.log(
      "PASS: stable authoritative Control Center issuer identity established",
    );

    // --------------------------------------------------------
    // FIXED TEST CLOCKS
    // --------------------------------------------------------

    const firstAt =
      addMilliseconds(
        identity.createdAt,
        1_000,
      );

    const secondAt =
      addMilliseconds(
        identity.createdAt,
        2_000,
      );

    const thirdAt =
      addMilliseconds(
        identity.createdAt,
        3_000,
      );

    const fourthAt =
      addMilliseconds(
        identity.createdAt,
        4_000,
      );

    const fifthAt =
      addMilliseconds(
        identity.createdAt,
        5_000,
      );

    // --------------------------------------------------------
    // INITIALIZE
    // --------------------------------------------------------

    const initial =
      await observeFinoraControlCenterAuthoritativeWallClock(
        new Date(
          firstAt,
        ),
      );

    assert(
      initial.success &&
      initial.data.issuerId ===
        identity.issuerId &&
      initial.data.observedAt ===
        firstAt &&
      initial.data.highWaterAt ===
        firstAt &&
      initial.data.disposition ===
        "INITIALIZED",
      "Missing Control Center clock high-water did not initialize correctly.",
    );

    const afterInitial =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      afterInitial !==
        undefined &&
      afterInitial.schemaVersion ===
        1 &&
      afterInitial.issuerId ===
        identity.issuerId &&
      afterInitial.highWaterAt ===
        firstAt,
      "Initialized Control Center high-water state is incorrect.",
    );

    console.log(
      "PASS: missing issuer clock high-water initialized from authoritative observation",
    );

    // --------------------------------------------------------
    // EQUAL
    // --------------------------------------------------------

    const beforeEqualSerialized =
      JSON.stringify(
        afterInitial,
      );

    const equal =
      await observeFinoraControlCenterAuthoritativeWallClock(
        new Date(
          firstAt,
        ),
      );

    assert(
      equal.success &&
      equal.data.observedAt ===
        firstAt &&
      equal.data.highWaterAt ===
        firstAt &&
      equal.data.disposition ===
        "UNCHANGED",
      "Equal Control Center clock observation was not accepted as unchanged.",
    );

    const afterEqual =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      afterEqual !==
        undefined &&
      JSON.stringify(
        afterEqual,
      ) ===
        beforeEqualSerialized,
      "Equal Control Center clock observation changed persisted state.",
    );

    console.log(
      "PASS: equal issuer clock observation accepted without high-water advancement",
    );

    // --------------------------------------------------------
    // FORWARD
    // --------------------------------------------------------

    const forward =
      await observeFinoraControlCenterAuthoritativeWallClock(
        new Date(
          secondAt,
        ),
      );

    assert(
      forward.success &&
      forward.data.observedAt ===
        secondAt &&
      forward.data.highWaterAt ===
        secondAt &&
      forward.data.disposition ===
        "ADVANCED",
      "Forward Control Center clock observation did not advance.",
    );

    const afterForward =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      afterForward !==
        undefined &&
      afterForward.issuerId ===
        identity.issuerId &&
      afterForward.highWaterAt ===
        secondAt,
      "Forward Control Center clock observation was not persisted.",
    );

    console.log(
      "PASS: forward issuer clock observation advanced persisted high-water",
    );

    // --------------------------------------------------------
    // PERSISTED ROLLBACK
    // --------------------------------------------------------

    const beforeRollbackSerialized =
      JSON.stringify(
        afterForward,
      );

    const rollback =
      await observeFinoraControlCenterAuthoritativeWallClock(
        new Date(
          firstAt,
        ),
      );

    assert(
      !rollback.success &&
      rollback.errorCode ===
        "CLOCK_ROLLBACK_DETECTED",
      "Backward Control Center clock observation was not rejected.",
    );

    const afterRollback =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      afterRollback !==
        undefined &&
      JSON.stringify(
        afterRollback,
      ) ===
        beforeRollbackSerialized,
      "Rejected Control Center clock rollback mutated persisted high-water.",
    );

    console.log(
      "PASS: persisted issuer clock rollback rejected with zero high-water mutation",
    );

    // --------------------------------------------------------
    // FOREIGN ISSUER BINDING
    // --------------------------------------------------------

    await persistFinoraControlCenterClockHighWaterState({
      schemaVersion:
        1,

      issuerId:
        "FINORA-CC-FOREIGN-SELFTEST",

      highWaterAt:
        secondAt,
    });

    const foreignBefore =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      foreignBefore !==
        undefined,
      "Foreign issuer high-water fixture was not persisted.",
    );

    const foreignBeforeSerialized =
      JSON.stringify(
        foreignBefore,
      );

    const foreignResult =
      await observeFinoraControlCenterAuthoritativeWallClock(
        new Date(
          thirdAt,
        ),
      );

    assert(
      !foreignResult.success &&
      foreignResult.errorCode ===
        "ISSUER_ID_MISMATCH",
      "Foreign issuer Control Center high-water was not rejected.",
    );

    const foreignAfter =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      foreignAfter !==
        undefined &&
      JSON.stringify(
        foreignAfter,
      ) ===
        foreignBeforeSerialized,
      "Foreign issuer rejection mutated persisted high-water state.",
    );

    console.log(
      "PASS: foreign issuer high-water rejected with zero persisted mutation",
    );

    // Restore valid issuer state for remaining authority tests.
    await persistFinoraControlCenterClockHighWaterState({
      schemaVersion:
        1,

      issuerId:
        identity.issuerId,

      highWaterAt:
        secondAt,
    });

    // --------------------------------------------------------
    // CURRENT SIGNING-KEY CREATED-AT FLOOR
    // --------------------------------------------------------

    const beforeKeyFloor =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      beforeKeyFloor !==
        undefined,
      "Valid high-water state was unavailable before key-floor test.",
    );

    const beforeKeyFloorSerialized =
      JSON.stringify(
        beforeKeyFloor,
      );

    const beforeCurrentKeyAt =
      addMilliseconds(
        identity.createdAt,
        -1,
      );

    const keyFloorResult =
      await observeFinoraControlCenterAuthoritativeWallClock(
        new Date(
          beforeCurrentKeyAt,
        ),
      );

    assert(
      !keyFloorResult.success &&
      keyFloorResult.errorCode ===
        "CLOCK_ROLLBACK_DETECTED",
      "Observation before current signing-key createdAt was not rejected.",
    );

    const afterKeyFloor =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      afterKeyFloor !==
        undefined &&
      JSON.stringify(
        afterKeyFloor,
      ) ===
        beforeKeyFloorSerialized,
      "Current signing-key time-floor rejection mutated persisted high-water.",
    );

    console.log(
      "PASS: current signing-key createdAt floor rejected backward observation with zero mutation",
    );

    // --------------------------------------------------------
    // MUTABLE DATE SNAPSHOT
    // --------------------------------------------------------

    const mutableDate =
      new Date(
        thirdAt,
      );

    const mutablePromise =
      observeFinoraControlCenterAuthoritativeWallClock(
        mutableDate,
      );

    mutableDate.setTime(
      Date.parse(
        firstAt,
      ),
    );

    const mutableResult =
      await mutablePromise;

    assert(
      mutableResult.success &&
      mutableResult.data.observedAt ===
        thirdAt &&
      mutableResult.data.highWaterAt ===
        thirdAt &&
      mutableResult.data.disposition ===
        "ADVANCED",
      "Queued Control Center clock observation did not preserve submitted Date snapshot.",
    );

    console.log(
      "PASS: mutable caller Date was snapshotted before authority queue execution",
    );

    // --------------------------------------------------------
    // CONCURRENT FORWARD OBSERVATIONS
    //
    // Calls are submitted in fourthAt -> fifthAt order.
    // Own authority serialization must preserve deterministic
    // monotonic advancement without a lost update.
    // --------------------------------------------------------

    const [
      concurrentFourth,
      concurrentFifth,
    ] =
      await Promise.all([
        observeFinoraControlCenterAuthoritativeWallClock(
          new Date(
            fourthAt,
          ),
        ),

        observeFinoraControlCenterAuthoritativeWallClock(
          new Date(
            fifthAt,
          ),
        ),
      ]);

    assert(
      concurrentFourth.success &&
      concurrentFourth.data.observedAt ===
        fourthAt &&
      concurrentFourth.data.highWaterAt ===
        fourthAt &&
      concurrentFourth.data.disposition ===
        "ADVANCED",
      "First concurrent Control Center clock observation did not advance to fourthAt.",
    );

    assert(
      concurrentFifth.success &&
      concurrentFifth.data.observedAt ===
        fifthAt &&
      concurrentFifth.data.highWaterAt ===
        fifthAt &&
      concurrentFifth.data.disposition ===
        "ADVANCED",
      "Second concurrent Control Center clock observation did not advance to fifthAt.",
    );

    const finalState =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      finalState !==
        undefined &&
      finalState.schemaVersion ===
        1 &&
      finalState.issuerId ===
        identity.issuerId &&
      finalState.highWaterAt ===
        fifthAt,
      "Concurrent Control Center clock observations did not persist deterministic final high-water.",
    );

    console.log(
      "PASS: concurrent issuer clock observations serialized deterministically without lost high-water advancement",
    );

    // --------------------------------------------------------
    // ENCRYPTED FINAL STATE
    // --------------------------------------------------------

    const controlCenterDirectory =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
      );

    const highWaterPath =
      join(
        controlCenterDirectory,
        "finora-control-center-clock-high-water.bin",
      );

    const encrypted =
      await readFile(
        highWaterPath,
      );

    assert(
      encrypted.length >
        0,
      "Control Center clock high-water encrypted file is empty.",
    );

    const encryptedUtf8 =
      encrypted.toString(
        "utf8",
      );

    assert(
      !encryptedUtf8.includes(
        identity.issuerId,
      ) &&
      !encryptedUtf8.includes(
        fifthAt,
      ) &&
      !encryptedUtf8.includes(
        '"schemaVersion"',
      ),
      "Control Center clock high-water appears to contain plaintext state.",
    );

    const decrypted =
      safeStorage.decryptString(
        encrypted,
      );

    const parsed =
      JSON.parse(
        decrypted,
      ) as {
        schemaVersion:
          unknown;

        issuerId:
          unknown;

        highWaterAt:
          unknown;
      };

    assert(
      parsed.schemaVersion ===
        1 &&
      parsed.issuerId ===
        identity.issuerId &&
      parsed.highWaterAt ===
        fifthAt,
      "Encrypted Control Center clock high-water does not contain exact final state.",
    );

    console.log(
      "PASS: final issuer clock high-water is encrypted and contains exact persisted state",
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
      `Control Center clock authority left temporary files behind: ${temporaryEntries.join(", ")}`,
    );

    console.log(
      "PASS: successful Control Center clock high-water writes left no temporary files",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA CONTROL CENTER CLOCK HIGH-WATER AUTHORITY SELFTEST",
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
      "PASS: isolated temporary Control Center clock authority userData deleted",
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
        "FAIL: FINORA CONTROL CENTER CLOCK HIGH-WATER AUTHORITY SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );