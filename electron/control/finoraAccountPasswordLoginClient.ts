/*
 * FINORA_P1_678D_ACCOUNT_PASSWORD_CLIENT
 * Password-only account authentication.
 * USB/device trust is not part of this API request.
 * Bearer tokens are confidential and must remain in Electron Main.
 */

const ACCOUNT_LOGIN_URL =
  "https://api.finoraenterprise.com/owner/account/session";

export interface FinoraAccountPasswordLoginResult {
  success: boolean;
  errorCode?: string;
  accessToken?: string;
  expiresAt?: string;
}

export async function authenticateFinoraAccountPassword(
  username: string,
  password: string,
): Promise<FinoraAccountPasswordLoginResult> {
  if (
    typeof username !== "string" ||
    !username.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return {
      success: false,
      errorCode: "INVALID_REQUEST",
    };
  }

  try {
    const response = await fetch(
      ACCOUNT_LOGIN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          username,
          password,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    const body: unknown = await response.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return {
        success: false,
        errorCode: "INVALID_RESPONSE",
      };
    }

    const data =
      body as Record<string, unknown>;

    if (!response.ok || data.ok !== true) {
      return {
        success: false,
        errorCode:
          typeof data.error === "string"
            ? data.error
            : "AUTHENTICATION_FAILED",
      };
    }

    if (
      data.sessionType !== "ACCOUNT_WALLET_ONLY" ||
      data.businessDataAccess !== false ||
      typeof data.accessToken !== "string" ||
      data.accessToken.length < 20 ||
      typeof data.expiresAt !== "string"
    ) {
      return {
        success: false,
        errorCode: "INVALID_SESSION_CONTRACT",
      };
    }

    return {
      success: true,
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
    };
  }
  catch {
    return {
      success: false,
      errorCode: "SERVER_UNAVAILABLE",
    };
  }
}