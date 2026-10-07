// ============================================================
// FINORA ENTERPRISE OS
// SERVER PASSWORD RESET CLIENT
// MAIN PROCESS ONLY
//
// SECURITY:
// - Security Code and new Password remain process-memory-only.
// - No credential material is persisted by this client.
// - Server rejection does not create local durable rotation state.
// ============================================================

const FINORA_SERVER_API_BASE_URL =
  "https://api.finoraenterprise.com";

const FINORA_SERVER_PASSWORD_RESET_PATH =
  "/owner/password/reset";

const FINORA_SERVER_PASSWORD_RESET_TIMEOUT_MS =
  15_000;

// ============================================================
// CONTRACTS
// ============================================================

export interface FinoraServerPasswordResetRequest {
  username:
    string;

  securityCode:
    string;

  newPassword:
    string;
}

export interface FinoraServerPasswordResetSuccess {
  success:
    true;

  alreadyApplied:
    boolean;
}

export interface FinoraServerPasswordResetFailure {
  success:
    false;

  errorCode:
    | "INVALID_REQUEST"
    | "INVALID_CREDENTIALS"
    | "SERVER_REJECTED"
    | "SERVER_UNAVAILABLE"
    | "INVALID_SERVER_RESPONSE";

  error:
    string;
}

export type FinoraServerPasswordResetResult =
  | FinoraServerPasswordResetSuccess
  | FinoraServerPasswordResetFailure;

// ============================================================
// HELPERS
// ============================================================

function asObject(
  value:
    unknown,
): Record<string, unknown> | undefined {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function failure(
  errorCode:
    FinoraServerPasswordResetFailure["errorCode"],
  error:
    string,
): FinoraServerPasswordResetFailure {
  return {
    success:
      false,

    errorCode,
    error,
  };
}

// ============================================================
// SERVER PASSWORD RESET
// ============================================================

export async function resetFinoraOwnerPasswordOnServer(
  input:
    FinoraServerPasswordResetRequest,
): Promise<FinoraServerPasswordResetResult> {
  const username =
    input.username
      ?.trim();

  if (
    !isNonEmptyString(
      username,
    ) ||
    !isNonEmptyString(
      input.securityCode,
    ) ||
    typeof input.newPassword !==
      "string" ||
    input.newPassword.length <
      8 ||
    input.newPassword.length >
      128 ||
    input.newPassword.trim().length ===
      0
  ) {
    return failure(
      "INVALID_REQUEST",
      "User ID, Security Code, and a valid new Password are required.",
    );
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      FINORA_SERVER_PASSWORD_RESET_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        `${FINORA_SERVER_API_BASE_URL}${FINORA_SERVER_PASSWORD_RESET_PATH}`,
        {
          method:
            "POST",

          headers: {
            "content-type":
              "application/json",

            "accept":
              "application/json",
          },

          body:
            JSON.stringify({
              username,

              securityCode:
                input.securityCode,

              newPassword:
                input.newPassword,
            }),

          signal:
            controller.signal,
        },
      );

    let responseBody:
      unknown;

    try {
      responseBody =
        await response.json();
    }
    catch {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server returned an invalid Password reset response.",
      );
    }

    const responseObject =
      asObject(
        responseBody,
      );

    if (!responseObject) {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server Password reset response is malformed.",
      );
    }

    if (!response.ok) {
      if (
        response.status ===
          401 &&
        responseObject.error ===
          "INVALID_CREDENTIALS"
      ) {
        return failure(
          "INVALID_CREDENTIALS",
          "User ID or Security Code is invalid.",
        );
      }

      if (
        response.status ===
          400 &&
        responseObject.error ===
          "INVALID_REQUEST"
      ) {
        return failure(
          "INVALID_REQUEST",
          "FINORA server rejected the Password reset request.",
        );
      }

      return failure(
        "SERVER_REJECTED",
        "FINORA server rejected the Password reset.",
      );
    }

    if (
      responseObject.ok !==
        true
    ) {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server Password reset response did not confirm success.",
      );
    }

    if (
      responseObject.alreadyApplied !==
        undefined &&
      typeof responseObject.alreadyApplied !==
        "boolean"
    ) {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server Password reset idempotency result is malformed.",
      );
    }

    return {
      success:
        true,

      alreadyApplied:
        responseObject.alreadyApplied ===
          true,
    };
  }
  catch {
    return failure(
      "SERVER_UNAVAILABLE",
      "FINORA server is unavailable. Internet connection is required to reset the Password.",
    );
  }
  finally {
    clearTimeout(
      timeout,
    );
  }
}

// ============================================================
// END
// ============================================================