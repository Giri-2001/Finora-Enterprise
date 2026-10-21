/*
 * FINORA_P1_687W_BUSINESS_PASSWORD_LOGIN
 *
 * Main-process HTTPS client.
 * Never treat Wallet-only access as Reception authorization.
 * Does not persist session IDs to USB or disk.
 */

const API_BASE = "https://api.finoraenterprise.com";

export interface FinoraServerBusinessSession {
  sessionId: string;
  sessionType: "BUSINESS_RECEPTION";
  expiresAt: string;
}

export interface FinoraBusinessPasswordLoginResult {
  success: boolean;
  errorCode?: string;
  session?: FinoraServerBusinessSession;
}

export async function loginFinoraBusinessWithPassword(
  username: string,
  password: string,
): Promise<FinoraBusinessPasswordLoginResult> {
  if (
    typeof username !== "string" ||
    username.trim().length === 0 ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    return { success: false, errorCode: "INVALID_REQUEST" };
  }

  try {
    const response = await fetch(
      `${API_BASE}/owner/account/session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      },
    );

    const body: unknown = await response.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return { success: false, errorCode: "INVALID_RESPONSE" };
    }

    const value = body as Record<string, unknown>;

    if (!response.ok || value.ok !== true) {
      return {
        success: false,
        errorCode:
          typeof value.error === "string"
            ? value.error
            : "AUTHENTICATION_FAILED",
      };
    }

    const business = value.businessSession;

    if (
      !business ||
      typeof business !== "object" ||
      Array.isArray(business)
    ) {
      return {
        success: false,
        errorCode: "BUSINESS_SESSION_NOT_ISSUED",
      };
    }

    const session = business as Record<string, unknown>;

    if (
      session.sessionType !== "BUSINESS_RECEPTION" ||
      typeof session.sessionId !== "string" ||
      !/^[a-f0-9]{64}$/.test(session.sessionId) ||
      typeof session.expiresAt !== "string"
    ) {
      return {
        success: false,
        errorCode: "INVALID_BUSINESS_SESSION",
      };
    }

    const verification = await fetch(
      `${API_BASE}/owner/business/session/verify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.sessionId}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!verification.ok) {
      return {
        success: false,
        errorCode: "BUSINESS_SESSION_VERIFICATION_FAILED",
      };
    }

    const verified: unknown = await verification.json();

    if (
      !verified ||
      typeof verified !== "object" ||
      Array.isArray(verified)
    ) {
      return {
        success: false,
        errorCode: "INVALID_VERIFICATION_RESPONSE",
      };
    }

    const result = verified as Record<string, unknown>;

    if (
      result.ok !== true ||
      result.sessionType !== "BUSINESS_RECEPTION" ||
      result.businessDataAccess !== true
    ) {
      return {
        success: false,
        errorCode: "BUSINESS_ACCESS_DENIED",
      };
    }

    return {
      success: true,
      session: {
        sessionId: session.sessionId,
        sessionType: "BUSINESS_RECEPTION",
        expiresAt: session.expiresAt,
      },
    };
  } catch {
    return {
      success: false,
      errorCode: "SERVER_UNAVAILABLE",
    };
  }
}