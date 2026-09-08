/* ===========================================================
   FINORA ENTERPRISE OS™

   CLOCK HIGH-WATER AUTHORITY SERVICE

   MODULE  : Control Plane
   LAYER   : Main-Process Security Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve authoritative native installation identity
   - Serialize clock high-water observations in one main process
   - Initialize installation-local high-water state
   - Detect backward wall-clock movement
   - Advance persisted high-water state only when time moves forward
   - Reject installation-identity mismatch without mutation

   IMPORTANT:

   - Caller never supplies installationId.
   - Missing native installation binding is fail-closed.
   - Equal timestamps are accepted without unnecessary rewrite.
   - Rollback rejection never mutates persisted high-water state.
   - This is Electron main-process serialization only.
   - No cross-process CAS guarantee.
   - This authority assumes the encrypted high-water record itself
     has not been replaced with an older valid historical copy.
   - No renderer or IPC surface is exposed here.
=========================================================== */

import {
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraClockHighWaterAuthorityErrorCode =
  | "INVALID_OBSERVED_TIME"
  | "INSTALLATION_BINDING_UNAVAILABLE"
  | "INSTALLATION_ID_MISMATCH"
  | "CLOCK_ROLLBACK_DETECTED"
  | "CLOCK_HIGH_WATER_STORAGE_FAILED";

export interface FinoraClockHighWaterAcceptedObservation {
  installationId:
    string;

  observedAt:
    string;

  highWaterAt:
    string;

  initialized:
    boolean;

  advanced:
    boolean;
}

export type FinoraClockHighWaterAuthorityResult =
  | {
      success:
        true;

      data:
        FinoraClockHighWaterAcceptedObservation;
    }
  | {
      success:
        false;

      errorCode:
        FinoraClockHighWaterAuthorityErrorCode;

      error:
        string;
    };

// ============================================================
// FAILURE
// ============================================================

function failure(
  errorCode:
    FinoraClockHighWaterAuthorityErrorCode,
  error:
    string,
): FinoraClockHighWaterAuthorityResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

// ============================================================
// AUTHORITY QUEUE
// ============================================================

let clockHighWaterAuthorityQueue:
  Promise<void> =
  Promise.resolve();

function runFinoraClockHighWaterAuthoritySerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {
  const run =
    clockHighWaterAuthorityQueue.then(
      operation,
      operation,
    );

  clockHighWaterAuthorityQueue =
    run.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return run;
}

// ============================================================
// OBSERVE INTERNAL
// ============================================================

async function observeFinoraClockHighWaterInternal(
  explicitObservedNow?:
    Date,
): Promise<
  FinoraClockHighWaterAuthorityResult
> {
  const authoritativeBinding =
    await getFinoraWindowsInstallationBinding();

  if (
    !authoritativeBinding
  ) {
    return failure(
      "INSTALLATION_BINDING_UNAVAILABLE",
      "FINORA clock high-water authority requires an established native installation binding.",
    );
  }

  /*
   * Explicit observations are immutable snapshots submitted by
   * trusted main-process callers.
   *
   * Production no-argument observations capture the real wall
   * clock here, after authoritative installation identity has
   * been resolved and while this operation owns the serialized
   * recipient clock-authority queue.
   */
  const observedNow =
    explicitObservedNow ??
    new Date();

  const observedAtMs =
    observedNow.getTime();

  if (
    !Number.isFinite(
      observedAtMs,
    )
  ) {
    return failure(
      "INVALID_OBSERVED_TIME",
      "FINORA clock high-water observation time is invalid.",
    );
  }

  const observedAt =
    new Date(
      observedAtMs,
    ).toISOString();

  let persisted:
    Awaited<
      ReturnType<
        typeof loadFinoraClockHighWaterState
      >
    >;

  try {
    persisted =
      await loadFinoraClockHighWaterState();
  } catch (
    error
  ) {
    return failure(
      "CLOCK_HIGH_WATER_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to load FINORA clock high-water state.",
    );
  }

  if (
    !persisted
  ) {
    try {
      await persistFinoraClockHighWaterState({
        schemaVersion:
          1,

        installationId:
          authoritativeBinding.installationId,

        highWaterAt:
          observedAt,
      });
    } catch (
      error
    ) {
      return failure(
        "CLOCK_HIGH_WATER_STORAGE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to initialize FINORA clock high-water state.",
      );
    }

    return {
      success:
        true,

      data: {
        installationId:
          authoritativeBinding.installationId,

        observedAt,

        highWaterAt:
          observedAt,

        initialized:
          true,

        advanced:
          true,
      },
    };
  }

  if (
    persisted.installationId !==
      authoritativeBinding.installationId
  ) {
    return failure(
      "INSTALLATION_ID_MISMATCH",
      "FINORA clock high-water state does not belong to the authoritative native installation.",
    );
  }

  const highWaterAtMs =
    Date.parse(
      persisted.highWaterAt,
    );

  if (
    observedAtMs <
      highWaterAtMs
  ) {
    return failure(
      "CLOCK_ROLLBACK_DETECTED",
      "FINORA detected system clock rollback below the persisted high-water timestamp.",
    );
  }

  if (
    observedAtMs ===
      highWaterAtMs
  ) {
    return {
      success:
        true,

      data: {
        installationId:
          authoritativeBinding.installationId,

        observedAt,

        highWaterAt:
          persisted.highWaterAt,

        initialized:
          false,

        advanced:
          false,
      },
    };
  }

  try {
    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        authoritativeBinding.installationId,

      highWaterAt:
        observedAt,
    });
  } catch (
    error
  ) {
    return failure(
      "CLOCK_HIGH_WATER_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to advance FINORA clock high-water state.",
    );
  }

  return {
    success:
      true,

    data: {
      installationId:
        authoritativeBinding.installationId,

      observedAt,

      highWaterAt:
        observedAt,

      initialized:
        false,

      advanced:
        true,
    },
  };
}

// ============================================================
// PUBLIC AUTHORITY
// ============================================================

export function observeFinoraAuthoritativeWallClock(
  observedNow?:
    Date,
): Promise<
  FinoraClockHighWaterAuthorityResult
> {
  /*
   * Snapshot an explicitly supplied Date before entering the
   * queue. Date is mutable; a caller must not be able to alter
   * an observation after submitting it to this authority.
   *
   * Production no-argument calls intentionally defer real wall
   * clock capture to observeFinoraClockHighWaterInternal(), after
   * authoritative installation-binding resolution.
   */
  const snapshot =
    observedNow ===
    undefined
      ? undefined
      : new Date(
          observedNow.getTime(),
        );

  if (
    snapshot !== undefined &&
    !Number.isFinite(
      snapshot.getTime(),
    )
  ) {
    return Promise.resolve(
      failure(
        "INVALID_OBSERVED_TIME",
        "FINORA clock high-water observation time is invalid.",
      ),
    );
  }

  return runFinoraClockHighWaterAuthoritySerialized(
    () =>
      observeFinoraClockHighWaterInternal(
        snapshot,
      ),
  );
}

// ============================================================
// END
// ============================================================