import type {
  FinoraLoginSessionView,
} from "./loginSessionBridge";

type ServerPrincipal = {
  userId: string;
  username: string;
  fullName: string;
  role: "OWNER";
  ownerId: string;
  businessId: string;
  branchId: string;
  storageMode: "LOCAL" | "USB";
};

type ServerSessionView = {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  role: "OWNER";
  ownerId: string;
  businessId: string;
  branchId: string;
  storageMode: "LOCAL" | "USB";
  dataContext: "REAL";
  loginTime: string;
  lastActivity: string;
  validatedAt: string;
};

export type FinoraReceptionValidationResponse = {
  success: boolean;
  sessionId?: string;
  principal?: ServerPrincipal;
  sessionView?: ServerSessionView;
  businessDataAccess?: boolean;
  receptionCommitRequired?: boolean;
  errorCode?: string;
};

export type FinoraReceptionGuardCandidate =
  | {
      success: true;
      data: FinoraLoginSessionView;
      businessDataAccess: false;
    }
  | {
      success: false;
      errorCode: string;
    };

function validText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function validTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

export function mapFinoraServerReceptionGuardCandidate(
  response: FinoraReceptionValidationResponse,
  expectedSessionId: string,
): FinoraReceptionGuardCandidate {
  // FINORA_P1_705T_SERVER_GUARD_ADAPTER
  // This adapter carries identity; it NEVER grants Reception access.
  // P1-712W: Only an explicit missing Main session is a clean restart.
  // Other denials and identity mismatches remain security failures.
  if (
    response &&
    response.success === false &&
    response.errorCode === "SESSION_NOT_FOUND" &&
    /^[a-f0-9]{64}$/.test(expectedSessionId)
  ) {
    return { success: false, errorCode: "SESSION_NOT_FOUND" };
  }
  if (
    response?.success === false &&
    response.errorCode === "SERVER_SESSION_REQUIRED" &&
    /^[a-f0-9]{64}$/.test(expectedSessionId)
  ) {
    return { success: false, errorCode: "SERVER_SESSION_REQUIRED" };
  }
  if (
    !response ||
    response.success !== true ||
    response.sessionId !== expectedSessionId ||
    !/^[a-f0-9]{64}$/.test(expectedSessionId)
  ) {
    return {
      success: false,
      errorCode: "SERVER_SESSION_INVALID",
    };
  }

  const p = response.principal;
  const v = response.sessionView;

  if (
    !p ||
    !v ||
    v.sessionId !== expectedSessionId ||
    p.role !== "OWNER" ||
    v.role !== "OWNER" ||
    v.dataContext !== "REAL" ||
    !validText(p.userId) ||
    !validText(p.username) ||
    !validText(p.fullName) ||
    !validText(p.ownerId) ||
    !validText(p.businessId) ||
    !validText(p.branchId) ||
    !(
      p.storageMode === "LOCAL" ||
      p.storageMode === "USB"
    ) ||
    !(
      v.storageMode === "LOCAL" ||
      v.storageMode === "USB"
    ) ||
    !(
      [
        "userId",
        "username",
        "fullName",
        "role",
        "ownerId",
        "businessId",
        "branchId",
        "storageMode",
      ] as const
    ).every(key => p[key] === v[key]) ||
    !validTime(v.loginTime) ||
    !validTime(v.lastActivity) ||
    !validTime(v.validatedAt)
  ) {
    return {
      success: false,
      errorCode: "SERVER_IDENTITY_MISMATCH",
    };
  }

  if (
    response.businessDataAccess !== false ||
    response.receptionCommitRequired !== true
  ) {
    return {
      success: false,
      errorCode: "UNEXPECTED_RECEPTION_AUTHORITY",
    };
  }

  const data: FinoraLoginSessionView = {
    sessionId: v.sessionId,
    userId: v.userId,
    username: v.username,
    fullName: v.fullName,
    role: v.role,
    ownerId: v.ownerId,
    businessId: v.businessId,
    branchId: v.branchId,
    storageMode: v.storageMode,
    dataContext: "REAL",
    credentialChangeRequired: false,
    accessMode: "ACTIVE",
    loginTime: v.loginTime,
    lastActivity: v.lastActivity,
    validatedAt: v.validatedAt,
  };

  return {
    success: true,
    data,
    businessDataAccess: false,
  };
}