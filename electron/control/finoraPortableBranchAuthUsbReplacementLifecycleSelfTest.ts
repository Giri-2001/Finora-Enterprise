// ============================================================
// FINORA ENTERPRISE OS
// USB REPLACEMENT LIFECYCLE SELF-TEST
// PHASE : 5.6M-1D1
// ============================================================

import {
  FINORA_USB_REPLACEMENT_LIFECYCLE_SCHEMA_VERSION,
  getFinoraPortableBranchAuthUsbReplacementLifecycleV1,
} from "./finoraPortableBranchAuthUsbReplacementLifecycle.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      message,
    );
  }
}

function runSelfTest(): void {
  const lifecycle =
    getFinoraPortableBranchAuthUsbReplacementLifecycleV1();

  assert(
    lifecycle.schemaVersion ===
      FINORA_USB_REPLACEMENT_LIFECYCLE_SCHEMA_VERSION &&
    lifecycle.schemaVersion ===
      1,
    "USB replacement lifecycle schema version is invalid.",
  );

  console.log(
    "PASS: USB replacement lifecycle schemaVersion is frozen at 1",
  );

  assert(
    lifecycle.targetState ===
      "EXACT_VERIFIED_COPY",
    "Target state is not exact verified copy.",
  );

  console.log(
    "PASS: NEW USB lifecycle truth is exact verified Portable Auth copy",
  );

  assert(
    lifecycle.crashRecovery ===
      "IDEMPOTENT_RETRY" &&
    lifecycle.crashJournalRequired ===
      false,
    "Readable-source replacement incorrectly requires a crash journal.",
  );

  console.log(
    "PASS: crash after target commit is recovered by idempotent retry without extra journal",
  );

  assert(
    lifecycle.sourceState ===
      "UNCHANGED_AND_STILL_VALID",
    "OLD USB lifecycle truth incorrectly claims source mutation or invalidation.",
  );

  console.log(
    "PASS: successful replacement explicitly keeps OLD USB unchanged and still valid",
  );

  assert(
    lifecycle.sourceRetirement ===
      "PHYSICAL_RETIREMENT_REQUIRED",
    "OLD USB retirement policy is not explicit.",
  );

  console.log(
    "PASS: OLD USB requires physical retirement or secure erase",
  );

  assert(
    lifecycle.offlinePreexistingCloneRevocation ===
      "NOT_AVAILABLE",
    "Offline pre-existing clone revocation is incorrectly claimed.",
  );

  console.log(
    "PASS: current offline replacement makes no false pre-existing clone revocation claim",
  );

  assert(
    lifecycle.authGeneration ===
      "UNCHANGED",
    "USB media replacement incorrectly mutates authGeneration semantics.",
  );

  console.log(
    "PASS: USB media replacement does not bump credential authGeneration",
  );

  assert(
    lifecycle.lostOrUnreadableSource ===
      "BACKUP_RESTORE_REQUIRED",
    "Lost source recovery was incorrectly folded into readable USB replacement.",
  );

  console.log(
    "PASS: lost or unreadable OLD USB remains Backup + Restore territory",
  );

  const serialized =
    JSON.stringify(
      lifecycle,
    );

  assert(
    !serialized.includes(
      '"sourceRetirement":"REVOKED"',
    ) &&
    !serialized.includes(
      '"sourceState":"DESTROYED"',
    ),
    "Lifecycle contract contains a false software retirement claim.",
  );

  console.log(
    "PASS: lifecycle contract contains no software-revoked or destroyed-source claim",
  );

  const second =
    getFinoraPortableBranchAuthUsbReplacementLifecycleV1();

  assert(
    second ===
      lifecycle &&
    Object.isFrozen(
      lifecycle,
    ),
    "Lifecycle policy is not immutable.",
  );

  console.log(
    "PASS: lifecycle policy is process-stable and immutable",
  );

  console.log(
    "PASS: 5.6M-1D1 USB replacement lifecycle truth executable proof",
  );
}

try {
  runSelfTest();

  process.exitCode =
    0;
}
catch (
  error
) {
  console.error(
    "SELF-TEST FAILED:",
    error,
  );

  process.exitCode =
    1;
}