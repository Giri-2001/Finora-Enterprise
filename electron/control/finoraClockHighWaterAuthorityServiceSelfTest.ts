/* ===========================================================
   FINORA ENTERPRISE OS™

   CLOCK HIGH-WATER AUTHORITY SERVICE SELF TEST

   VERIFY:

   - Isolated Electron userData
   - Authoritative native installation binding
   - Missing high-water initializes once
   - Equal observation is accepted without logical advancement
   - Forward observation advances persisted high-water
   - Backward observation is rejected with zero persisted mutation
   - Installation mismatch is rejected with zero persisted mutation
   - Concurrent forward observations serialize deterministically
   - Explicit mutable Date input is snapshotted before queue execution
   - No-argument production observation uses authority-owned wall clock
   - No renderer / IPC authority is involved

   IMPORTANT:

   This proves wall-clock rollback detection while the persisted
   encrypted high-water record remains intact. It does not claim
   resistance to arbitrary replacement by an older valid encrypted
   historical copy.
=========================================================== */

import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  observeFinoraAuthoritativeWallClock,
} from "./finoraClockHighWaterAuthorityService.js";

import {
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

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
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-clock-high-water-authority-selftest-",
      ),
    );

  app.setPath(
    "userData",
    temporaryUserData,
  );

  try {
    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // AUTHORITATIVE INSTALLATION BINDING
    // --------------------------------------------------------

    const binding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      typeof binding.installationId ===
        "string" &&
      binding.installationId.length >
        0,
      "Authoritative installation binding did not provide installationId.",
    );

    console.log(
      "PASS: authoritative native installation binding established",
    );

    // --------------------------------------------------------
    // FIXED TEST CLOCK
    // --------------------------------------------------------

    const firstAt =
      "2026-09-08T04:30:00.000Z";

    const secondAt =
      "2026-09-08T04:31:00.000Z";

    const thirdAt =
      "2026-09-08T04:32:00.000Z";

    const fourthAt =
      "2026-09-08T04:33:00.000Z";

    const fifthAt =
      "2026-09-08T04:34:00.000Z";

    // --------------------------------------------------------
    // INITIALIZE
    // --------------------------------------------------------

    const initialResult =
      await observeFinoraAuthoritativeWallClock(
        new Date(
          firstAt,
        ),
      );

    assert(
      initialResult.success &&
      initialResult.data.installationId ===
        binding.installationId &&
      initialResult.data.observedAt ===
        firstAt &&
      initialResult.data.highWaterAt ===
        firstAt &&
      initialResult.data.initialized ===
        true &&
      initialResult.data.advanced ===
        true,
      "Initial clock high-water observation did not initialize correctly.",
    );

    const afterInitial =
      await loadFinoraClockHighWaterState();

    assert(
      afterInitial !==
        undefined &&
      afterInitial.installationId ===
        binding.installationId &&
      afterInitial.highWaterAt ===
        firstAt,
      "Initial clock high-water state was not persisted correctly.",
    );

    console.log(
      "PASS: missing clock high-water initialized from authoritative observation",
    );

    // --------------------------------------------------------
    // EQUAL — ACCEPT / NO LOGICAL ADVANCEMENT
    // --------------------------------------------------------

    const beforeEqual =
      JSON.stringify(
        afterInitial,
      );

    const equalResult =
      await observeFinoraAuthoritativeWallClock(
        new Date(
          firstAt,
        ),
      );

    assert(
      equalResult.success &&
      equalResult.data.initialized ===
        false &&
      equalResult.data.advanced ===
        false &&
      equalResult.data.highWaterAt ===
        firstAt,
      "Equal clock observation was not accepted without advancement.",
    );

    const afterEqual =
      await loadFinoraClockHighWaterState();

    assert(
      afterEqual !==
        undefined &&
      JSON.stringify(
        afterEqual,
      ) ===
        beforeEqual,
      "Equal clock observation changed logical persisted high-water state.",
    );

    console.log(
      "PASS: equal clock observation accepted without logical high-water advancement",
    );

    // --------------------------------------------------------
    // FORWARD — ADVANCE
    // --------------------------------------------------------

    const forwardResult =
      await observeFinoraAuthoritativeWallClock(
        new Date(
          secondAt,
        ),
      );

    assert(
      forwardResult.success &&
      forwardResult.data.initialized ===
        false &&
      forwardResult.data.advanced ===
        true &&
      forwardResult.data.highWaterAt ===
        secondAt,
      "Forward clock observation did not advance high-water state.",
    );

    const afterForward =
      await loadFinoraClockHighWaterState();

    assert(
      afterForward !==
        undefined &&
      afterForward.installationId ===
        binding.installationId &&
      afterForward.highWaterAt ===
        secondAt,
      "Forward clock high-water advancement was not persisted.",
    );

    console.log(
      "PASS: forward clock observation advanced persisted high-water",
    );

    // --------------------------------------------------------
    // ROLLBACK — REJECT / ZERO MUTATION
    // --------------------------------------------------------

    const beforeRollback =
      JSON.stringify(
        afterForward,
      );

    const rollbackResult =
      await observeFinoraAuthoritativeWallClock(
        new Date(
          firstAt,
        ),
      );

    assert(
      !rollbackResult.success &&
      rollbackResult.errorCode ===
        "CLOCK_ROLLBACK_DETECTED",
      "Backward clock observation was not rejected as rollback.",
    );

    const afterRollback =
      await loadFinoraClockHighWaterState();

    assert(
      afterRollback !==
        undefined &&
      JSON.stringify(
        afterRollback,
      ) ===
        beforeRollback,
      "Rejected clock rollback mutated persisted high-water state.",
    );

    console.log(
      "PASS: backward clock observation rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // INSTALLATION MISMATCH — REJECT / ZERO MUTATION
    //
    // Direct persistence is test-fixture setup only.
    // Production authority never accepts caller installationId.
    // --------------------------------------------------------

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        "FINORA-CLOCK-HIGH-WATER-WRONG-INSTALLATION",

      highWaterAt:
        secondAt,
    });

    const mismatchedState =
      await loadFinoraClockHighWaterState();

    assert(
      mismatchedState !==
        undefined,
      "Installation-mismatch fixture was not persisted.",
    );

    const beforeMismatch =
      JSON.stringify(
        mismatchedState,
      );

    const mismatchResult =
      await observeFinoraAuthoritativeWallClock(
        new Date(
          thirdAt,
        ),
      );

    assert(
      !mismatchResult.success &&
      mismatchResult.errorCode ===
        "INSTALLATION_ID_MISMATCH",
      "Mismatched clock high-water installation was not rejected.",
    );

    const afterMismatch =
      await loadFinoraClockHighWaterState();

    assert(
      afterMismatch !==
        undefined &&
      JSON.stringify(
        afterMismatch,
      ) ===
        beforeMismatch,
      "Rejected installation mismatch mutated persisted high-water state.",
    );

    console.log(
      "PASS: mismatched installation high-water rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // RESTORE AUTHORITATIVE FIXTURE
    // --------------------------------------------------------

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        binding.installationId,

      highWaterAt:
        secondAt,
    });

    // --------------------------------------------------------
    // CONCURRENT FORWARD OBSERVATIONS
    //
    // Calls are submitted in thirdAt -> fourthAt order.
    // Shared authority serialization must preserve that order and
    // persist the final fourthAt high-water without lost update.
    // --------------------------------------------------------

    const [
      concurrentThird,
      concurrentFourth,
    ] =
      await Promise.all([
        observeFinoraAuthoritativeWallClock(
          new Date(
            thirdAt,
          ),
        ),

        observeFinoraAuthoritativeWallClock(
          new Date(
            fourthAt,
          ),
        ),
      ]);

    assert(
      concurrentThird.success &&
      concurrentThird.data.highWaterAt ===
        thirdAt &&
      concurrentThird.data.advanced ===
        true,
      "First concurrent forward observation did not advance to thirdAt.",
    );

    assert(
      concurrentFourth.success &&
      concurrentFourth.data.highWaterAt ===
        fourthAt &&
      concurrentFourth.data.advanced ===
        true,
      "Second concurrent forward observation did not advance to fourthAt.",
    );

    const afterConcurrent =
      await loadFinoraClockHighWaterState();

    assert(
      afterConcurrent !==
        undefined &&
      afterConcurrent.installationId ===
        binding.installationId &&
      afterConcurrent.highWaterAt ===
        fourthAt,
      "Concurrent clock observations did not persist deterministic final high-water.",
    );

    console.log(
      "PASS: concurrent forward clock observations serialized deterministically without lost high-water advancement",
    );

    // --------------------------------------------------------
    // EXPLICIT MUTABLE DATE — SNAPSHOT BEFORE QUEUE EXECUTION
    //
    // The authority must copy a caller-supplied Date when the
    // observation is submitted. Mutating the original Date after
    // submission must not alter the queued observation.
    // --------------------------------------------------------

    const mutableObservedNow =
      new Date(
        fifthAt,
      );

    const mutableSnapshotPromise =
      observeFinoraAuthoritativeWallClock(
        mutableObservedNow,
      );

    mutableObservedNow.setTime(
      Date.parse(
        firstAt,
      ),
    );

    const mutableSnapshotResult =
      await mutableSnapshotPromise;

    assert(
      mutableSnapshotResult.success &&
      mutableSnapshotResult.data.observedAt ===
        fifthAt &&
      mutableSnapshotResult.data.highWaterAt ===
        fifthAt &&
      mutableSnapshotResult.data.initialized ===
        false &&
      mutableSnapshotResult.data.advanced ===
        true,
      "Explicit mutable Date was not snapshotted before queued authority execution.",
    );

    const afterMutableSnapshot =
      await loadFinoraClockHighWaterState();

    assert(
      afterMutableSnapshot !==
        undefined &&
      afterMutableSnapshot.installationId ===
        binding.installationId &&
      afterMutableSnapshot.highWaterAt ===
        fifthAt,
      "Mutable Date snapshot observation was not persisted using the submitted timestamp.",
    );

    console.log(
      "PASS: explicit mutable Date input snapshotted before queued authority execution",
    );

    // --------------------------------------------------------
    // NO-ARG PRODUCTION CLOCK — AUTHORITY-OWNED OBSERVATION
    //
    // No current time is supplied by the caller. The authority
    // captures the real wall clock internally after resolving the
    // authoritative installation binding.
    // --------------------------------------------------------

    const noArgResult =
      await observeFinoraAuthoritativeWallClock();

    assert(
      noArgResult.success,
      noArgResult.success
        ? "No-argument authority observation unexpectedly failed."
        : noArgResult.error,
    );

    const noArgObservedAtMs =
      Date.parse(
        noArgResult.data.observedAt,
      );

    const fifthAtMs =
      Date.parse(
        fifthAt,
      );

    assert(
      Number.isFinite(
        noArgObservedAtMs,
      ) &&
      noArgObservedAtMs >=
        fifthAtMs &&
      noArgResult.data.installationId ===
        binding.installationId &&
      noArgResult.data.highWaterAt ===
        noArgResult.data.observedAt,
      "No-argument authority observation did not use a valid authority-owned forward wall-clock timestamp.",
    );

    const afterNoArg =
      await loadFinoraClockHighWaterState();

    assert(
      afterNoArg !==
        undefined &&
      afterNoArg.installationId ===
        binding.installationId &&
      afterNoArg.highWaterAt ===
        noArgResult.data.observedAt,
      "No-argument authority observation was not persisted as the authoritative high-water.",
    );

    console.log(
      "PASS: no-argument production observation captured and persisted authority-owned wall clock",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA CLOCK HIGH-WATER AUTHORITY SERVICE SELFTEST",
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
      "PASS: isolated temporary clock high-water userData deleted",
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
        "FAIL: FINORA CLOCK HIGH-WATER AUTHORITY SERVICE SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );