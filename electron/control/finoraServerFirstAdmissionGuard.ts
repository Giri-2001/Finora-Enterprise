import {
  verifyFinoraServerBoundIdentity,
  type FinoraServerBoundIdentity,
} from "./finoraServerBoundSessionGuard.js";

export interface FinoraServerFirstAdmission {
  serverVerified: boolean;
  serverPrincipal: FinoraServerBoundIdentity | null;
  accountPrincipal: FinoraServerBoundIdentity | null;
  localPrincipal: FinoraServerBoundIdentity | null;
  branchAuthorized: boolean;
  storageAuthorized: boolean;
  operationalMode: "ACTIVE" | "REGISTERED_EXPIRED_READ_ONLY" | null;
}

export type FinoraServerFirstAdmissionResult =
  | {
      allowed: true;
      operationalMode: "ACTIVE" | "REGISTERED_EXPIRED_READ_ONLY";
    }
  | {
      allowed: false;
      errorCode: string;
    };

/**
 * FINORA_P1_703O_SERVER_FIRST_ADMISSION
 *
 * Pure admission check only.
 * Does not create sessions, change credentials, trust devices,
 * mutate Wallet balances, or grant Reception access.
 */
export function evaluateFinoraServerFirstAdmission(
  input: FinoraServerFirstAdmission,
): FinoraServerFirstAdmissionResult {
  if (
    input.serverVerified !== true ||
    !input.serverPrincipal ||
    !input.accountPrincipal ||
    !input.localPrincipal
  ) {
    return {
      allowed: false,
      errorCode: "AUTHORITY_NOT_VERIFIED",
    };
  }

  if (
    !verifyFinoraServerBoundIdentity(
      input.serverPrincipal,
      input.accountPrincipal,
    ) ||
    !verifyFinoraServerBoundIdentity(
      input.serverPrincipal,
      input.localPrincipal,
    )
  ) {
    return {
      allowed: false,
      errorCode: "SCOPE_MISMATCH",
    };
  }

  if (!input.branchAuthorized) {
    return {
      allowed: false,
      errorCode: "BRANCH_ACCESS_DENIED",
    };
  }

  if (!input.storageAuthorized) {
    return {
      allowed: false,
      errorCode: "STORAGE_ACCESS_DENIED",
    };
  }

  if (
    input.operationalMode !== "ACTIVE" &&
    input.operationalMode !== "REGISTERED_EXPIRED_READ_ONLY"
  ) {
    return {
      allowed: false,
      errorCode: "OPERATIONAL_MODE_DENIED",
    };
  }

  return {
    allowed: true,
    operationalMode: input.operationalMode,
  };
}