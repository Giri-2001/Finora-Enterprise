/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER SESSION AUTHORITY

   RESPONSIBILITY:
   - Hold Developer Control Center unlock state in process memory.
   - Verify candidate Security Codes through injected authority.
   - Apply bounded exponential failed-attempt backoff.
   - Provide a backend assertUnlocked boundary.
   - Allow explicit lock on Control Center window close.

   SECURITY:
   - No plaintext Security Code is retained.
   - No filesystem or renderer storage exists here.
   - No signing authority exists here.
   - No device binding exists here.
   - Process restart naturally destroys the unlocked session.
   ============================================================ */

export const
  FINORA_DEVELOPER_SESSION_BACKOFF_BASE_MS =
    1_000 as const;

export const
  FINORA_DEVELOPER_SESSION_BACKOFF_MAX_MS =
    60_000 as const;

export interface FinoraDeveloperControlCenterSessionState {
  unlocked:
    boolean;

  failedAttempts:
    number;

  retryAfterMs:
    number;
}

export interface FinoraDeveloperControlCenterSessionDependencies {
  readConfigurationState:
    () => Promise<{
      configured:
        boolean;
    }>;

  verifySecurityCode:
    (
      securityCode:
        string,
    ) => Promise<boolean>;

  readThrottleState?:
    () => Promise<{
      failedAttempts:
        number;

      blockedUntilMilliseconds:
        number;
    }>;

  writeThrottleState?:
    (
      state: {
        failedAttempts:
          number;

        blockedUntilMilliseconds:
          number;
      },
    ) => Promise<void>;

  clearThrottleState?:
    () => Promise<void>;

  nowMilliseconds?:
    () => number;
}

export interface FinoraDeveloperControlCenterUnlockSuccess {
  success:
    true;

  status:
    "UNLOCKED";

  state:
    FinoraDeveloperControlCenterSessionState;
}

export interface FinoraDeveloperControlCenterUnlockFailure {
  success:
    false;

  errorCode:
    | "SECURITY_CODE_NOT_CONFIGURED"
    | "SECURITY_CODE_INVALID"
    | "RETRY_LATER";

  retryAfterMs:
    number;

  state:
    FinoraDeveloperControlCenterSessionState;
}

export type FinoraDeveloperControlCenterUnlockResult =
  | FinoraDeveloperControlCenterUnlockSuccess
  | FinoraDeveloperControlCenterUnlockFailure;

export interface FinoraDeveloperControlCenterSessionAuthority {
  getState:
    () => FinoraDeveloperControlCenterSessionState;

  unlock:
    (
      securityCode:
        string,
    ) => Promise<
      FinoraDeveloperControlCenterUnlockResult
    >;

  lock:
    () => void;

  assertUnlocked:
    () => void;
}

function computeBackoffMilliseconds(
  failedAttempts:
    number,
): number {

  const exponent =
    Math.min(
      Math.max(
        failedAttempts - 1,
        0,
      ),
      6,
    );

  return Math.min(
    FINORA_DEVELOPER_SESSION_BACKOFF_MAX_MS,
    FINORA_DEVELOPER_SESSION_BACKOFF_BASE_MS *
      (2 ** exponent),
  );
}

export function
createFinoraDeveloperControlCenterSessionAuthority(
  dependencies:
    FinoraDeveloperControlCenterSessionDependencies,
): FinoraDeveloperControlCenterSessionAuthority {

  const now =
    dependencies.nowMilliseconds ??
    Date.now;

  const readThrottleState =
    dependencies.readThrottleState ??
    (
      async () => ({
        failedAttempts:
          0,

        blockedUntilMilliseconds:
          0,
      })
    );

  const writeThrottleState =
    dependencies.writeThrottleState ??
    (
      async () =>
        undefined
    );

  const clearThrottleState =
    dependencies.clearThrottleState ??
    (
      async () =>
        undefined
    );

  let unlocked =
    false;

  let failedAttempts =
    0;

  let blockedUntilMilliseconds =
    0;

  function retryAfterMilliseconds():
    number {

    return Math.max(
      0,
      Math.ceil(
        blockedUntilMilliseconds -
          now(),
      ),
    );
  }

  function getState():
    FinoraDeveloperControlCenterSessionState {

    return {
      unlocked,

      failedAttempts,

      retryAfterMs:
        retryAfterMilliseconds(),
    };
  }

  async function unlock(
    securityCode:
      string,
  ): Promise<
    FinoraDeveloperControlCenterUnlockResult
  > {

    if (unlocked) {
      return {
        success:
          true,

        status:
          "UNLOCKED",

        state:
          getState(),
      };
    }

    const persistedThrottle =
      await readThrottleState();

    if (
      !Number.isSafeInteger(
        persistedThrottle.failedAttempts,
      ) ||
      persistedThrottle.failedAttempts <
        0 ||
      !Number.isFinite(
        persistedThrottle.blockedUntilMilliseconds,
      ) ||
      persistedThrottle.blockedUntilMilliseconds <
        0
    ) {
      throw new Error(
        "FINORA Developer Control Center persisted throttle state is invalid.",
      );
    }

    failedAttempts =
      persistedThrottle.failedAttempts;

    blockedUntilMilliseconds =
      persistedThrottle.blockedUntilMilliseconds;

    const retryAfterMs =
      retryAfterMilliseconds();

    if (
      retryAfterMs >
      0
    ) {
      return {
        success:
          false,

        errorCode:
          "RETRY_LATER",

        retryAfterMs,

        state:
          getState(),
      };
    }

    const configuration =
      await dependencies
        .readConfigurationState();

    if (
      !configuration.configured
    ) {
      return {
        success:
          false,

        errorCode:
          "SECURITY_CODE_NOT_CONFIGURED",

        retryAfterMs:
          0,

        state:
          getState(),
      };
    }

    const verified =
      await dependencies
        .verifySecurityCode(
          securityCode,
        );

    if (!verified) {
      failedAttempts +=
        1;

      const backoffMilliseconds =
        computeBackoffMilliseconds(
          failedAttempts,
        );

      blockedUntilMilliseconds =
      now() +
      backoffMilliseconds;

    await writeThrottleState({
      failedAttempts,

      blockedUntilMilliseconds,
    });

      return {
        success:
          false,

        errorCode:
          "SECURITY_CODE_INVALID",

        retryAfterMs:
          backoffMilliseconds,

        state:
          getState(),
      };
    }

    await clearThrottleState();

    unlocked =
      true;

    failedAttempts =
      0;

    blockedUntilMilliseconds =
      0;

    return {
      success:
        true,

      status:
        "UNLOCKED",

      state:
        getState(),
    };
  }

  function lock():
    void {

    unlocked =
      false;
  }

  function assertUnlocked():
    void {

    if (!unlocked) {
      throw new Error(
        "FINORA Developer Control Center privileged authority is locked.",
      );
    }
  }

  return {
    getState,
    unlock,
    lock,
    assertUnlocked,
  };
}
