/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER CLOCK HIGH-WATER AUTHORITY SERVICE

   MODULE  : Control Center
   LAYER   : Privileged Main-Process Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve the stable Control Center issuer identity
   - Observe authoritative Control Center wall-clock time
   - Bind persisted high-water state to immutable issuerId
   - Reject wall-clock rollback below persisted high-water
   - Reject persisted high-water state bound to another issuer
   - Cross-check high-water state against current key creation time
   - Advance high-water monotonically
   - Serialize observations inside this Electron main process

   IMPORTANT:

   - MAIN PROCESS ONLY.
   - No renderer or IPC surface.
   - No recipient installationId dependency.
   - No signingKeyId binding.
   - No signing-key mutation.
   - No package issuance.
   - No caller-supplied issuer identity.
   - Production callers omit observedNow.
   - Explicit observedNow exists only for deterministic native tests.
   - The current wall clock is captured after Control Center identity
     resolution so first-use key-vault creation cannot create a false
     millisecond rollback against its own createdAt timestamp.
   - The current signing-key createdAt timestamp provides an additional
     persisted floor across key rotation.
   - Same-process serialization only; no cross-process CAS guarantee.
   - The encrypted store does not resist replacement together with an
     older valid key vault / high-water file by a sufficiently privileged
     same-user or operating-system attacker.
=========================================================== */

import {
  loadFinoraControlCenterClockHighWaterState,
  persistFinoraControlCenterClockHighWaterState,
} from "./finoraControlCenterClockHighWaterStore.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "./finoraControlCenterKeyVault.js";

// ============================================================
// ERROR CONTRACT
// ============================================================

export type FinoraControlCenterClockHighWaterAuthorityErrorCode =
  | "INVALID_OBSERVED_TIME"
  | "CONTROL_CENTER_IDENTITY_FAILED"
  | "CONTROL_CENTER_KEY_TIME_INVALID"
  | "ISSUER_ID_MISMATCH"
  | "CLOCK_HIGH_WATER_INCONSISTENT"
  | "CLOCK_ROLLBACK_DETECTED"
  | "CLOCK_HIGH_WATER_STORAGE_FAILED";

// ============================================================
// SUCCESS CONTRACT
// ============================================================

export type FinoraControlCenterClockHighWaterDisposition =
  | "INITIALIZED"
  | "UNCHANGED"
  | "ADVANCED";

export interface FinoraControlCenterClockHighWaterAcceptedObservation {
  issuerId:
    string;

  observedAt:
    string;

  highWaterAt:
    string;

  disposition:
    FinoraControlCenterClockHighWaterDisposition;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraControlCenterClockHighWaterAuthorityResult =
  | {
      success:
        true;

      data:
        FinoraControlCenterClockHighWaterAcceptedObservation;
    }
  | {
      success:
        false;

      errorCode:
        FinoraControlCenterClockHighWaterAuthorityErrorCode;

      error:
        string;
    };

// ============================================================
// FAILURE
// ============================================================

function failure(
  errorCode:
    FinoraControlCenterClockHighWaterAuthorityErrorCode,

  error:
    string,
): FinoraControlCenterClockHighWaterAuthorityResult {

  return {
    success:
      false,

    errorCode,

    error,
  };
}

// ============================================================
// TIME VALIDATION
// ============================================================

function toCanonicalObservedTime(
  observedNow:
    Date,
):
  | {
      success:
        true;

      milliseconds:
        number;

      iso:
        string;
    }
  | {
      success:
        false;
    } {

  const milliseconds =
    observedNow.getTime();

  if (
    !Number.isFinite(
      milliseconds,
    )
  ) {
    return {
      success:
        false,
    };
  }

  return {
    success:
      true,

    milliseconds,

    iso:
      observedNow.toISOString(),
  };
}

// ============================================================
// INTERNAL AUTHORITY
// ============================================================

async function observeInternal(
  explicitObservedNow?:
    Date,
): Promise<
  FinoraControlCenterClockHighWaterAuthorityResult
> {

  // ----------------------------------------------------------
  // 1. VALIDATE EXPLICIT TEST OBSERVATION BEFORE SIDE EFFECTS
  // ----------------------------------------------------------

  if (
    explicitObservedNow !==
    undefined
  ) {
    const explicitValidation =
      toCanonicalObservedTime(
        explicitObservedNow,
      );

    if (
      !explicitValidation.success
    ) {
      return failure(
        "INVALID_OBSERVED_TIME",
        "FINORA Control Center observed wall-clock time is invalid.",
      );
    }
  }

  // ----------------------------------------------------------
  // 2. AUTHORITATIVE CONTROL CENTER IDENTITY
  //
  // This may create the key vault on first use.
  // Production wall-clock capture deliberately occurs afterward.
  // ----------------------------------------------------------

  let identity:
    Awaited<
      ReturnType<
        typeof getFinoraControlCenterPublicIdentity
      >
    >;

  try {
    identity =
      await getFinoraControlCenterPublicIdentity();
  } catch (
    error
  ) {
    return failure(
      "CONTROL_CENTER_IDENTITY_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to resolve FINORA Control Center issuer identity.",
    );
  }

  // ----------------------------------------------------------
  // 3. CURRENT SIGNING-KEY CREATION FLOOR
  // ----------------------------------------------------------

  const currentKeyCreatedAtMs =
    Date.parse(
      identity.createdAt,
    );

  if (
    !Number.isFinite(
      currentKeyCreatedAtMs,
    ) ||
    new Date(
      currentKeyCreatedAtMs,
    ).toISOString() !==
      identity.createdAt
  ) {
    return failure(
      "CONTROL_CENTER_KEY_TIME_INVALID",
      "FINORA Control Center current signing-key creation timestamp is invalid.",
    );
  }

  // ----------------------------------------------------------
  // 4. OBSERVE CLOCK
  //
  // Production current time is captured only after identity
  // resolution / possible first-use vault creation.
  // ----------------------------------------------------------

  const observedNow =
    explicitObservedNow ??
    new Date();

  const observed =
    toCanonicalObservedTime(
      observedNow,
    );

  if (
    !observed.success
  ) {
    return failure(
      "INVALID_OBSERVED_TIME",
      "FINORA Control Center observed wall-clock time is invalid.",
    );
  }

  if (
    observed.milliseconds <
    currentKeyCreatedAtMs
  ) {
    return failure(
      "CLOCK_ROLLBACK_DETECTED",
      "FINORA Control Center wall-clock rollback was detected below the current signing-key creation time.",
    );
  }

  // ----------------------------------------------------------
  // 5. LOAD PERSISTED HIGH-WATER
  // ----------------------------------------------------------

  let persisted:
    Awaited<
      ReturnType<
        typeof loadFinoraControlCenterClockHighWaterState
      >
    >;

  try {
    persisted =
      await loadFinoraControlCenterClockHighWaterState();
  } catch (
    error
  ) {
    return failure(
      "CLOCK_HIGH_WATER_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to load FINORA Control Center clock high-water state.",
    );
  }

  // ----------------------------------------------------------
  // 6. INITIALIZE
  // ----------------------------------------------------------

  if (
    persisted ===
    undefined
  ) {
    try {
      await persistFinoraControlCenterClockHighWaterState({
        schemaVersion:
          1,

        issuerId:
          identity.issuerId,

        highWaterAt:
          observed.iso,
      });
    } catch (
      error
    ) {
      return failure(
        "CLOCK_HIGH_WATER_STORAGE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to initialize FINORA Control Center clock high-water state.",
      );
    }

    return {
      success:
        true,

      data: {
        issuerId:
          identity.issuerId,

        observedAt:
          observed.iso,

        highWaterAt:
          observed.iso,

        disposition:
          "INITIALIZED",
      },
    };
  }

  // ----------------------------------------------------------
  // 7. STABLE ISSUER BINDING
  // ----------------------------------------------------------

  if (
    persisted.issuerId !==
    identity.issuerId
  ) {
    return failure(
      "ISSUER_ID_MISMATCH",
      "FINORA Control Center clock high-water state belongs to a different issuer identity.",
    );
  }

  // ----------------------------------------------------------
  // 8. PERSISTED HIGH-WATER CONSISTENCY
  // ----------------------------------------------------------

  const persistedHighWaterMs =
    Date.parse(
      persisted.highWaterAt,
    );

  if (
    !Number.isFinite(
      persistedHighWaterMs,
    )
  ) {
    return failure(
      "CLOCK_HIGH_WATER_STORAGE_FAILED",
      "FINORA Control Center persisted clock high-water timestamp is invalid.",
    );
  }

  if (
    persistedHighWaterMs <
    currentKeyCreatedAtMs
  ) {
    return failure(
      "CLOCK_HIGH_WATER_INCONSISTENT",
      "FINORA Control Center persisted clock high-water precedes the current signing-key creation time.",
    );
  }

  // ----------------------------------------------------------
  // 9. ROLLBACK REJECTION
  // ----------------------------------------------------------

  if (
    observed.milliseconds <
    persistedHighWaterMs
  ) {
    return failure(
      "CLOCK_ROLLBACK_DETECTED",
      "FINORA Control Center persisted wall-clock rollback was detected.",
    );
  }

  // ----------------------------------------------------------
  // 10. EQUAL OBSERVATION — ACCEPT WITHOUT WRITE
  // ----------------------------------------------------------

  if (
    observed.milliseconds ===
    persistedHighWaterMs
  ) {
    return {
      success:
        true,

      data: {
        issuerId:
          identity.issuerId,

        observedAt:
          observed.iso,

        highWaterAt:
          persisted.highWaterAt,

        disposition:
          "UNCHANGED",
      },
    };
  }

  // ----------------------------------------------------------
  // 11. MONOTONIC ADVANCE
  // ----------------------------------------------------------

  try {
    await persistFinoraControlCenterClockHighWaterState({
      schemaVersion:
        1,

      issuerId:
        identity.issuerId,

      highWaterAt:
        observed.iso,
    });
  } catch (
    error
  ) {
    return failure(
      "CLOCK_HIGH_WATER_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to advance FINORA Control Center clock high-water state.",
    );
  }

  return {
    success:
      true,

    data: {
      issuerId:
        identity.issuerId,

      observedAt:
        observed.iso,

      highWaterAt:
        observed.iso,

      disposition:
        "ADVANCED",
    },
  };
}

// ============================================================
// SAME-PROCESS AUTHORITY SERIALIZATION
// ============================================================

let controlCenterClockHighWaterAuthorityQueue:
  Promise<void> =
    Promise.resolve();

export function observeFinoraControlCenterAuthoritativeWallClock(
  observedNow?:
    Date,
): Promise<
  FinoraControlCenterClockHighWaterAuthorityResult
> {

  /*
   * Snapshot an explicitly supplied Date before entering the queue.
   * Date is mutable; callers must not be able to alter an observation
   * after it has been submitted to the authority.
   *
   * Production calls normally provide no argument. In that case the
   * real wall clock is intentionally captured inside observeInternal()
   * after Control Center identity resolution.
   */
  const snapshot =
    observedNow ===
    undefined
      ? undefined
      : new Date(
          observedNow.getTime(),
        );

  const operation =
    controlCenterClockHighWaterAuthorityQueue.then(
      () =>
        observeInternal(
          snapshot,
        ),
      () =>
        observeInternal(
          snapshot,
        ),
    );

  controlCenterClockHighWaterAuthorityQueue =
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