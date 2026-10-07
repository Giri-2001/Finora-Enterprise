import {
  FINORA_LOGIN_CLOCK_TOLERANCE_MS,
  observeFinoraServerTimeAuthority,
} from "./finoraServerTimeAuthority.js";

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

async function main():
  Promise<void> {
  const originalFetch =
    globalThis.fetch;

  const originalDateNow =
    Date.now;

  const serverTimeMs =
    Date.parse(
      "2026-10-06T21:33:01.280Z",
    );

  if (
    !Number.isFinite(
      serverTimeMs,
    )
  ) {
    throw new Error(
      "Server-time fixture is invalid.",
    );
  }

  try {
    globalThis.fetch =
      (async () =>
        new Response(
          JSON.stringify({
            ok:
              true,

            serverTime:
              new Date(
                serverTimeMs,
              ).toISOString(),
          }),
          {
            status:
              200,

            headers: {
              "content-type":
                "application/json",
            },
          },
        )) as typeof fetch;

    // --------------------------------------------------------
    // EXACT CLOCK
    // --------------------------------------------------------

    Date.now =
      () =>
        serverTimeMs;

    const exactResult =
      await observeFinoraServerTimeAuthority();

    assert(
      exactResult.success,
      exactResult.success
        ? "Unexpected exact-clock state."
        : exactResult.error,
    );

    assert(
      exactResult.data.clockSkewMs ===
        0,
      "Exact server/local clock did not produce zero skew.",
    );

    console.log(
      "PASS: exact local clock accepted",
    );

    // --------------------------------------------------------
    // WITHIN TOLERANCE
    // --------------------------------------------------------

    Date.now =
      () =>
        serverTimeMs +
        FINORA_LOGIN_CLOCK_TOLERANCE_MS -
        1;

    const withinToleranceResult =
      await observeFinoraServerTimeAuthority();

    assert(
      withinToleranceResult.success,
      withinToleranceResult.success
        ? "Unexpected within-tolerance state."
        : withinToleranceResult.error,
    );

    console.log(
      "PASS: clock inside five-minute tolerance accepted",
    );

    // --------------------------------------------------------
    // FUTURE CLOCK
    // --------------------------------------------------------

    Date.now =
      () =>
        serverTimeMs +
        FINORA_LOGIN_CLOCK_TOLERANCE_MS +
        1;

    const futureResult =
      await observeFinoraServerTimeAuthority();

    assert(
      !futureResult.success &&
      futureResult.errorCode ===
        "SYSTEM_CLOCK_INVALID",
      "Future local system clock was not rejected.",
    );

    assert(
      futureResult.error ===
        "System date/time is incorrect. Correct it and try again.",
      "Future-clock rejection message is incorrect.",
    );

    console.log(
      "PASS: future local clock rejected",
    );

    // --------------------------------------------------------
    // PAST CLOCK
    // --------------------------------------------------------

    Date.now =
      () =>
        serverTimeMs -
        FINORA_LOGIN_CLOCK_TOLERANCE_MS -
        1;

    const pastResult =
      await observeFinoraServerTimeAuthority();

    assert(
      !pastResult.success &&
      pastResult.errorCode ===
        "SYSTEM_CLOCK_INVALID",
      "Past local system clock was not rejected.",
    );

    console.log(
      "PASS: past local clock rejected",
    );

    // --------------------------------------------------------
    // INVALID SERVER PAYLOAD
    // --------------------------------------------------------

    globalThis.fetch =
      (async () =>
        new Response(
          JSON.stringify({
            ok:
              true,

            serverTime:
              "INVALID",
          }),
          {
            status:
              200,

            headers: {
              "content-type":
                "application/json",
            },
          },
        )) as typeof fetch;

    Date.now =
      () =>
        serverTimeMs;

    const invalidServerResult =
      await observeFinoraServerTimeAuthority();

    assert(
      !invalidServerResult.success &&
      invalidServerResult.errorCode ===
        "SERVER_TIME_INVALID",
      "Invalid server timestamp was not rejected.",
    );

    console.log(
      "PASS: invalid server timestamp rejected",
    );

    // --------------------------------------------------------
    // SERVER UNAVAILABLE
    // --------------------------------------------------------

    globalThis.fetch =
      (async () =>
        new Response(
          JSON.stringify({
            ok:
              false,
          }),
          {
            status:
              503,
          },
        )) as typeof fetch;

    const unavailableResult =
      await observeFinoraServerTimeAuthority();

    assert(
      !unavailableResult.success &&
      unavailableResult.errorCode ===
        "SERVER_TIME_UNAVAILABLE",
      "Unavailable server-time authority did not fail closed.",
    );

    console.log(
      "PASS: unavailable server-time authority failed closed",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA SERVER TIME AUTHORITY SELF-TEST",
    );

    console.log(
      "============================================================",
    );
  } finally {
    globalThis.fetch =
      originalFetch;

    Date.now =
      originalDateNow;
  }
}

void main()
  .then(
    () => {
      process.exitCode =
        0;
    },
  )
  .catch(
    (
      error:
        unknown,
    ) => {
      console.error(
        error instanceof Error
          ? error.stack ??
              error.message
          : String(
              error,
            ),
      );

      process.exitCode =
        1;
    },
  );