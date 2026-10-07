const FINORA_API_BASE_URL =
  "https://api.finoraenterprise.com";

const FINORA_SERVER_TIME_TIMEOUT_MS =
  8_000;

export const FINORA_LOGIN_CLOCK_TOLERANCE_MS =
  5 *
  60 *
  1000;

export type FinoraServerTimeAuthorityErrorCode =
  | "SERVER_TIME_UNAVAILABLE"
  | "SERVER_TIME_INVALID"
  | "SYSTEM_CLOCK_INVALID";

export interface FinoraServerTimeAuthoritySuccess {
  serverTime:
    string;

  serverTimeMs:
    number;

  localTimeMs:
    number;

  clockSkewMs:
    number;
}

export type FinoraServerTimeAuthorityResult =
  | {
      success:
        true;

      data:
        FinoraServerTimeAuthoritySuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraServerTimeAuthorityErrorCode;

      error:
        string;
    };

function failure(
  errorCode:
    FinoraServerTimeAuthorityErrorCode,
  error:
    string,
): FinoraServerTimeAuthorityResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

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

export async function observeFinoraServerTimeAuthority():
  Promise<
    FinoraServerTimeAuthorityResult
  > {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      FINORA_SERVER_TIME_TIMEOUT_MS,
    );

  try {
    const localRequestStartedMs =
      Date.now();

    const response =
      await fetch(
        `${FINORA_API_BASE_URL}/time`,
        {
          method:
            "GET",

          headers: {
            accept:
              "application/json",
          },

          cache:
            "no-store",

          signal:
            controller.signal,
        },
      );

    const localResponseReceivedMs =
      Date.now();

    if (!response.ok) {
      return failure(
        "SERVER_TIME_UNAVAILABLE",
        "FINORA Server time authority is unavailable.",
      );
    }

    let payload:
      unknown;

    try {
      payload =
        await response.json();
    } catch {
      return failure(
        "SERVER_TIME_INVALID",
        "FINORA Server returned an invalid time response.",
      );
    }

    if (
      !isRecord(
        payload,
      ) ||
      payload.ok !==
        true ||
      typeof payload.serverTime !==
        "string"
    ) {
      return failure(
        "SERVER_TIME_INVALID",
        "FINORA Server returned an incomplete time response.",
      );
    }

    const serverTimeMs =
      Date.parse(
        payload.serverTime,
      );

    if (
      !Number.isFinite(
        serverTimeMs,
      )
    ) {
      return failure(
        "SERVER_TIME_INVALID",
        "FINORA Server returned an invalid UTC timestamp.",
      );
    }

    /*
     * Use the midpoint of the local request interval rather than
     * only the response-receipt timestamp. This reduces ordinary
     * network latency from the clock-skew comparison.
     */
    const localTimeMs =
      Math.round(
        (
          localRequestStartedMs +
          localResponseReceivedMs
        ) /
          2,
      );

    const clockSkewMs =
      localTimeMs -
      serverTimeMs;

    if (
      Math.abs(
        clockSkewMs,
      ) >
      FINORA_LOGIN_CLOCK_TOLERANCE_MS
    ) {
      return failure(
        "SYSTEM_CLOCK_INVALID",
        "System date/time is incorrect. Correct it and try again.",
      );
    }

    return {
      success:
        true,

      data: {
        serverTime:
          new Date(
            serverTimeMs,
          ).toISOString(),

        serverTimeMs,

        localTimeMs,

        clockSkewMs,
      },
    };
  } catch (
    error
  ) {
    if (
      error instanceof Error &&
      error.name ===
        "AbortError"
    ) {
      return failure(
        "SERVER_TIME_UNAVAILABLE",
        "FINORA Server time verification timed out. Check the internet connection and try again.",
      );
    }

    return failure(
      "SERVER_TIME_UNAVAILABLE",
      "Unable to verify FINORA Server time. Check the internet connection and try again.",
    );
  } finally {
    clearTimeout(
      timeout,
    );
  }
}