// ============================================================
// FINORA ENTERPRISE OS
// FIRST-LOGIN SERVER CREDENTIAL COMPLETION CLIENT
// MAIN PROCESS ONLY
//
// SECURITY:
// - Temporary Password / Security Code remain process-memory-only.
// - Permanent Password / Security Code remain process-memory-only.
// - This client persists no credential material.
// - alreadyApplied=true closes the server-success/client-retry window.
// ============================================================

const FINORA_SERVER_API_BASE_URL =
  "https://api.finoraenterprise.com";

const FINORA_SERVER_FIRST_LOGIN_COMPLETION_PATH =
  "/owner/credentials/complete-first-login";

const FINORA_SERVER_FIRST_LOGIN_COMPLETION_TIMEOUT_MS =
  15_000;

// ============================================================
// CONTRACTS
// ============================================================

export interface FinoraServerFirstLoginCredentialCompletionRequest {
  username:
    string;

  currentPassword:
    string;

  currentSecurityCode:
    string;

  newPassword:
    string;

  newSecurityCode:
    string;
}

export interface FinoraServerFirstLoginCredentialCompletionSuccess {
  success:
    true;

  credentialChangeRequired:
    false;

  alreadyApplied:
    boolean;
}

export interface FinoraServerFirstLoginCredentialCompletionFailure {
  success:
    false;

  errorCode:
    | "INVALID_REQUEST"
    | "INVALID_CREDENTIALS"
    | "NEW_CREDENTIALS_MUST_DIFFER"
    | "SERVER_REJECTED"
    | "SERVER_UNAVAILABLE"
    | "INVALID_SERVER_RESPONSE";

  error:
    string;
}

export type FinoraServerFirstLoginCredentialCompletionResult =
  | FinoraServerFirstLoginCredentialCompletionSuccess
  | FinoraServerFirstLoginCredentialCompletionFailure;

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

function isValidPermanentCredential(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.length >=
      8 &&
    value.length <=
      128 &&
    value.trim().length >
      0
  );
}

function failure(
  errorCode:
    FinoraServerFirstLoginCredentialCompletionFailure["errorCode"],
  error:
    string,
): FinoraServerFirstLoginCredentialCompletionFailure {
  return {
    success:
      false,

    errorCode,
    error,
  };
}

// ============================================================
// COMPLETE FIRST LOGIN
// ============================================================

export async function completeFinoraOwnerFirstLoginCredentialsOnServer(
  input:
    FinoraServerFirstLoginCredentialCompletionRequest,
): Promise<FinoraServerFirstLoginCredentialCompletionResult> {
  const username =
    input.username
      ?.trim();

  if (
    !isNonEmptyString(
      username,
    ) ||
    !isNonEmptyString(
      input.currentPassword,
    ) ||
    !isNonEmptyString(
      input.currentSecurityCode,
    ) ||
    !isValidPermanentCredential(
      input.newPassword,
    ) ||
    !isValidPermanentCredential(
      input.newSecurityCode,
    )
  ) {
    return failure(
      "INVALID_REQUEST",
      "User ID, temporary credentials, and valid permanent credentials are required.",
    );
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      FINORA_SERVER_FIRST_LOGIN_COMPLETION_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        `${FINORA_SERVER_API_BASE_URL}${FINORA_SERVER_FIRST_LOGIN_COMPLETION_PATH}`,
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

              currentPassword:
                input.currentPassword,

              currentSecurityCode:
                input.currentSecurityCode,

              newPassword:
                input.newPassword,

              newSecurityCode:
                input.newSecurityCode,
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
        "FINORA server returned an invalid first-login credential response.",
      );
    }

    const responseObject =
      asObject(
        responseBody,
      );

    if (!responseObject) {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server first-login credential response is malformed.",
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
          "Temporary FINORA credentials are invalid or this credential change cannot be applied.",
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
          "FINORA server rejected the first-login credential request.",
        );
      }

      if (
        response.status ===
          400 &&
        responseObject.error ===
          "NEW_CREDENTIALS_MUST_DIFFER"
      ) {
        return failure(
          "NEW_CREDENTIALS_MUST_DIFFER",
          "Permanent Password and Security Code must differ from the temporary credentials.",
        );
      }

      return failure(
        "SERVER_REJECTED",
        "FINORA server rejected the first-login credential change.",
      );
    }

    if (
      responseObject.ok !==
        true ||
      responseObject.credentialChangeRequired !==
        false
    ) {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server did not confirm completion of the first-login credential change.",
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
        "FINORA server first-login idempotency result is malformed.",
      );
    }

    return {
      success:
        true,

      credentialChangeRequired:
        false,

      alreadyApplied:
        responseObject.alreadyApplied ===
          true,
    };
  }
  catch {
    return failure(
      "SERVER_UNAVAILABLE",
      "FINORA server is unavailable. Internet connection is required to complete first login.",
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