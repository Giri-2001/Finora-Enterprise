/*
 * FINORA_P1_688D_SERVER_BUSINESS_VERIFIER
 *
 * Main-process-only server verification.
 * Wallet sessions do not authorize Reception.
 * Never persist a business bearer to USB/localStorage.
 */

const VERIFY_URL =
  "https://api.finoraenterprise.com/owner/business/session/verify";

export interface FinoraVerifiedBusinessPrincipal {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  storageMode: "LOCAL" | "USB";
  username: string;
  fullName: string;
  role: "OWNER";
}

export type FinoraServerBusinessVerification =
  | {
      success: true;
      principal: FinoraVerifiedBusinessPrincipal;
    }
  | {
      success: false;
      errorCode: string;
    };

export async function verifyFinoraServerBusinessSession(
  sessionId: string,
): Promise<FinoraServerBusinessVerification> {
  if (
    typeof sessionId !== "string" ||
    !/^[a-f0-9]{64}$/.test(sessionId)
  ) {
    return {
      success: false,
      errorCode: "INVALID_BUSINESS_SESSION",
    };
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        errorCode: "BUSINESS_SESSION_REJECTED",
      };
    }

    const body: unknown = await response.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return {
        success: false,
        errorCode: "INVALID_SERVER_RESPONSE",
      };
    }

    const data = body as Record<string, unknown>;

    if (
      data.ok !== true ||
      data.sessionType !== "BUSINESS_RECEPTION" ||
      data.businessDataAccess !== true ||
      !data.principal ||
      typeof data.principal !== "object" ||
      Array.isArray(data.principal)
    ) {
      return {
        success: false,
        errorCode: "BUSINESS_ACCESS_DENIED",
      };
    }

    const principal =
      data.principal as Record<string, unknown>;

    for (const key of [
      "userId",
      "ownerId",
      "businessId",
      "branchId",
    ]) {
      if (
        typeof principal[key] !== "string" ||
        principal[key].length === 0
      ) {
        return {
          success: false,
          errorCode: "INVALID_PRINCIPAL",
        };
      }
    }

    // FINORA_P1_704D_STORAGE_ENFORCEMENT
    // Storage authority must come from server-verified PostgreSQL.
    // Missing or unsupported storage modes fail closed.
    if (
      principal.storageMode !== "LOCAL" &&
      principal.storageMode !== "USB"
    ) {
      return {
        success: false,
        errorCode: "SERVER_STORAGE_NOT_AUTHORIZED",
      };
    }

    // FINORA_P1_705G_RECEPTION_IDENTITY
    // These fields must originate from the verified PostgreSQL response.
    if (
      typeof principal.username !== "string" ||
      principal.username.trim().length === 0 ||
      principal.username.length > 128 ||
      typeof principal.fullName !== "string" ||
      principal.fullName.trim().length === 0 ||
      principal.role !== "OWNER"
    ) {
      return {
        success: false,
        errorCode: "SERVER_RECEPTION_IDENTITY_INVALID",
      };
    }

    return {
      success: true,
      principal: {
        userId: principal.userId as string,
        ownerId: principal.ownerId as string,
        businessId: principal.businessId as string,
        branchId: principal.branchId as string,
        storageMode: principal.storageMode,
        username: principal.username as string,
        fullName: principal.fullName as string,
        role: "OWNER",
      },
    };
  } catch {
    return {
      success: false,
      errorCode: "SERVER_UNAVAILABLE",
    };
  }
}