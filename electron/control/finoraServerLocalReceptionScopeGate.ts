/*
 * FINORA_P1_693D_SERVER_LOCAL_RECEPTION_SCOPE_GATE
 *
 * Pure precondition gate. It DOES NOT create a session,
 * grant Reception, access business data, or authorize writes.
 *
 * Caller must independently validate the server session
 * and obtain a freshly authorized local operational session.
 */

export interface FinoraReceptionPrincipal {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface FinoraReceptionLocalAuthority
  extends FinoraReceptionPrincipal {
  role: string;
  dataContext: string;
  storageMode: string;
  accessMode: string;
}

export type FinoraReceptionScopeDecision =
  | {
      allowed: true;
      operationalMode: "ACTIVE" | "REGISTERED_EXPIRED_READ_ONLY";
    }
  | {
      allowed: false;
      errorCode: string;
    };

export function verifyFinoraServerLocalReceptionScope(
  serverVerified: boolean,
  serverPrincipal: FinoraReceptionPrincipal | null,
  local: FinoraReceptionLocalAuthority | null,
): FinoraReceptionScopeDecision {
  if (serverVerified !== true || !serverPrincipal || !local) {
    return { allowed: false, errorCode: "AUTHORITY_NOT_VERIFIED" };
  }

  for (const key of [
    "userId",
    "ownerId",
    "businessId",
    "branchId",
  ] as const) {
    if (
      typeof serverPrincipal[key] !== "string" ||
      serverPrincipal[key].trim().length === 0 ||
      typeof local[key] !== "string" ||
      local[key].trim().length === 0 ||
      serverPrincipal[key] !== local[key]
    ) {
      return {
        allowed: false,
        errorCode: "SERVER_LOCAL_SCOPE_MISMATCH",
      };
    }
  }

  if (local.role !== "OWNER" || local.dataContext !== "REAL") {
    return {
      allowed: false,
      errorCode: "OPERATIONAL_CONTEXT_DENIED",
    };
  }

  if (
    local.storageMode !== "LOCAL" &&
    local.storageMode !== "USB"
  ) {
    return {
      allowed: false,
      errorCode: "STORAGE_MODE_DENIED",
    };
  }

  if (
    local.accessMode !== "ACTIVE" &&
    local.accessMode !== "REGISTERED_EXPIRED_READ_ONLY"
  ) {
    return {
      allowed: false,
      errorCode: "BRANCH_AUTHORIZATION_DENIED",
    };
  }

  return {
    allowed: true,
    operationalMode: local.accessMode,
  };
}