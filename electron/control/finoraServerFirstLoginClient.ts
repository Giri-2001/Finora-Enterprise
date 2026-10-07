// ============================================================
// FINORA ENTERPRISE OS
// SERVER-FIRST LOGIN CLIENT
// MAIN PROCESS ONLY
// ============================================================

import {
  verifyFinoraServerFirstLoginSignedBootstrap,
} from "./finoraServerFirstLoginBootstrapVerifier.js";

import type {
  FinoraServerFirstLoginSignedBootstrapV1,
  FinoraVerifiedServerFirstLoginBootstrapV1,
} from "./finoraServerFirstLoginBootstrapVerifier.js";

// ============================================================
// CONSTANTS
// ============================================================

const FINORA_SERVER_API_BASE_URL =
  "https://api.finoraenterprise.com";

const FINORA_SERVER_FIRST_LOGIN_VERIFY_PATH =
  "/owner/first-login/verify";

const FINORA_SERVER_FIRST_LOGIN_TIMEOUT_MS =
  15_000;

// ============================================================
// CONTRACTS
// ============================================================

export interface FinoraServerFirstLoginVerifyRequest {
  username:
    string;

  password:
    string;

  securityCode:
    string;
}

export interface FinoraServerFirstLoginVerifySuccess {
  success:
    true;

  signedBootstrap:
    FinoraServerFirstLoginSignedBootstrapV1;

  verifiedBootstrap:
    FinoraVerifiedServerFirstLoginBootstrapV1;
}

export interface FinoraServerFirstLoginVerifyFailure {
  success:
    false;

  errorCode:
    | "INVALID_REQUEST"
    | "SERVER_REJECTED"
    | "SERVER_UNAVAILABLE"
    | "INVALID_SERVER_RESPONSE"
    | "SIGNED_BOOTSTRAP_VERIFICATION_FAILED";

  error:
    string;
}

export type FinoraServerFirstLoginVerifyResult =
  | FinoraServerFirstLoginVerifySuccess
  | FinoraServerFirstLoginVerifyFailure;

// ============================================================
// INTERNAL HELPERS
// ============================================================

function asObject(
  value:
    unknown,
): Record<string, unknown> | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
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
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function failure(
  errorCode:
    FinoraServerFirstLoginVerifyFailure["errorCode"],
  error:
    string,
): FinoraServerFirstLoginVerifyFailure {
  return {
    success: false,
    errorCode,
    error,
  };
}

// ============================================================
// SERVER-FIRST VERIFY
// ============================================================

export async function verifyFinoraOwnerFirstLoginOnServer(
  input:
    FinoraServerFirstLoginVerifyRequest,
): Promise<FinoraServerFirstLoginVerifyResult> {
  const username =
    input.username
      ?.trim();

  const canonicalUsername =
    typeof username === "string"
      ? username
          .normalize("NFKC")
          .toLowerCase()
      : "";

  if (
    !isNonEmptyString(username) ||
    !isNonEmptyString(input.password) ||
    !isNonEmptyString(input.securityCode)
  ) {
    return failure(
      "INVALID_REQUEST",
      "User ID, password, and Security Code are required.",
    );
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      FINORA_SERVER_FIRST_LOGIN_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        `${FINORA_SERVER_API_BASE_URL}${FINORA_SERVER_FIRST_LOGIN_VERIFY_PATH}`,
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
              password:
                input.password,
              securityCode:
                input.securityCode,
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
        "FINORA server returned an invalid first-login response.",
      );
    }

    if (!response.ok) {
      return failure(
        "SERVER_REJECTED",
        "FINORA server rejected the first-login verification.",
      );
    }

    const responseObject =
      asObject(
        responseBody,
      );

    if (!responseObject) {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server first-login response is malformed.",
      );
    }

    const signedBootstrap =
      responseObject.signedBootstrap;

    const signedBootstrapObject =
      asObject(
        signedBootstrap,
      );

    if (!signedBootstrapObject) {
      return failure(
        "INVALID_SERVER_RESPONSE",
        "FINORA server response does not contain a signed bootstrap authority.",
      );
    }

    const verifiedBootstrap =
      verifyFinoraServerFirstLoginSignedBootstrap(
        signedBootstrap,
      );

    if (!verifiedBootstrap) {
      return failure(
        "SIGNED_BOOTSTRAP_VERIFICATION_FAILED",
        "FINORA server first-login authority signature verification failed.",
      );
    }

    if (
      verifiedBootstrap.payload.canonicalUsername !==
        canonicalUsername
    ) {
      return failure(
        "SIGNED_BOOTSTRAP_VERIFICATION_FAILED",
        "FINORA server first-login authority does not match the requested User ID.",
      );
    }

    return {
      success:
        true,

      signedBootstrap:
        signedBootstrap as FinoraServerFirstLoginSignedBootstrapV1,

      verifiedBootstrap,
    };
  }
  catch {
    return failure(
      "SERVER_UNAVAILABLE",
      "FINORA server is unavailable. Internet connection is required for first login.",
    );
  }
  finally {
    clearTimeout(
      timeout,
    );
  }
}