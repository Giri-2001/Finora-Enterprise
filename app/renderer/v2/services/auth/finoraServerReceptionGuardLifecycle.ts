import { Capacitor } from "@capacitor/core";
import { finoraControlShared } from "../finoraControlShared";
import { mapFinoraServerReceptionGuardCandidate } from "./finoraServerReceptionGuardBridge";
import type { FinoraReceptionGuardCandidate, FinoraReceptionValidationResponse } from "./finoraServerReceptionGuardBridge";

// FINORA_P1_707G_FIX_SERVER_SESSIONGUARD_LIFECYCLE
// This bridge validates identity only; it does not grant Reception access.
type Result =
  | { success: true; sessionId: string }
  | { success: false; errorCode: string };

type ServerBridge = {
  validate(request: { sessionId: string }): Promise<unknown>;
  touch(request: { sessionId: string }): Promise<unknown>;
  invalidate(request: { sessionId: string }): Promise<unknown>;
};

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function bridge(): ServerBridge | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window as unknown as {
    finoraServerReceptionSession?: ServerBridge;
  };
  return host.finoraServerReceptionSession;
}

// FINORA_P1_721D_ANDROID_GUARD
// P1-721Z2: timestamps in process memory only.
let androidReceptionSessionId: string | null = null;
let androidReceptionLoginTime = "";
async function validateAndroidReception(
  sessionId: string,
): Promise<FinoraReceptionGuardCandidate> {
  try {
    const native = finoraControlShared as {
      validateAndroidReception: (
        request: { sessionId: string }
      ) => Promise<{
        success: boolean;
        sessionId?: string;
        businessDataAccess?: boolean;
        principal?: Record<string, unknown>;
      }>;
    };

    const response = await native.validateAndroidReception({
      sessionId,
    });

    // FINORA_P1_721O_STALE_SESSION
    // A native process restart invalidates its in-memory handle.
    // Report SESSION_NOT_FOUND so App clears only the stale
    // renderer login snapshot, not USB business records.
    if (
      response.success !== true &&
      (
        (response as { errorCode?: string }).errorCode ===
          "RECEPTION_SESSION_NOT_FOUND" ||
        (response as { errorCode?: string }).errorCode ===
          "SESSION_NOT_FOUND"
      )
    ) {
      return {
        success: false,
        errorCode: "SESSION_NOT_FOUND",
      };
    }

    // FINORA_P1_727C_ANDROID_NETWORK_BRIDGE
    if (
      response.success !== true &&
      (response as { errorCode?: string }).errorCode ===
        "SERVER_UNAVAILABLE"
    ) {
      return {
        success: false,
        errorCode: "SERVER_UNAVAILABLE",
      };
    }

    const p = response.principal;

    if (
      response.success !== true ||
      response.sessionId !== sessionId ||
      response.businessDataAccess !== true ||
      !p ||
      typeof p.userId !== "string" || !p.userId ||
      typeof p.username !== "string" || !p.username ||
      typeof p.fullName !== "string" || !p.fullName ||
      p.role !== "OWNER" ||
      typeof p.ownerId !== "string" || !p.ownerId ||
      typeof p.businessId !== "string" || !p.businessId ||
      typeof p.branchId !== "string" || !p.branchId ||
      p.storageMode !== "USB"
    ) {
      return {
        success: false,
        errorCode: "ANDROID_SERVER_SCOPE_DENIED",
      };
    }

    // Identity verification alone does not prove that any
    // required credential rotation has been completed.
    // Fail closed until native authority supplies that fact.
    if (p.credentialChangeRequired !== false) {
      return {
        success: false,
        errorCode: "CREDENTIAL_STATUS_NOT_VERIFIED",
      };
    }

    // FINORA_P1_721Z2: stable view timestamp, fresh server check.
    const now = new Date().toISOString();
    if (androidReceptionSessionId !== sessionId) {
      androidReceptionSessionId = sessionId;
      androidReceptionLoginTime = now;
    }
    const stableLoginTime = androidReceptionLoginTime;

    return {
      success: true,
      businessDataAccess: false,
      data: {
        sessionId,
        userId: p.userId,
        username: p.username,
        fullName: p.fullName,
        role: "OWNER",
        ownerId: p.ownerId,
        businessId: p.businessId,
        branchId: p.branchId,
        storageMode: "USB",
        dataContext: "REAL",
        credentialChangeRequired: false,
        accessMode: "ACTIVE",
        loginTime: stableLoginTime,
        lastActivity: now,
        validatedAt: now,
      },
    };
  } catch {
    return {
      success: false,
      errorCode: "ANDROID_SERVER_REVALIDATION_FAILED",
    };
  }
}
export async function validateFinoraServerGuardSession(
  sessionId: string,
): Promise<FinoraReceptionGuardCandidate> {
  if (!validId(sessionId)) {
    return { success: false, errorCode: "INVALID_SERVER_SESSION_ID" };
  }
  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  ) {
    return validateAndroidReception(sessionId);
  }

  const api = bridge();
  if (typeof api?.validate !== "function") {
    return { success: false, errorCode: "SERVER_GUARD_UNAVAILABLE" };
  }
  try {
    const raw: unknown = await api.validate({ sessionId });
    if (!record(raw)) {
      return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
    }
    return mapFinoraServerReceptionGuardCandidate(
      raw as FinoraReceptionValidationResponse,
      sessionId
    );
  } catch {
    return { success: false, errorCode: "SERVER_REVALIDATION_FAILED" };
  }
}

export async function touchFinoraServerGuardSession(
  sessionId: string,
): Promise<Result> {
  if (!validId(sessionId)) {
    return { success: false, errorCode: "INVALID_SERVER_SESSION_ID" };
  }
  // FINORA_P1_723Q_ANDROID_TOUCH
  // Revalidate the native server-authorized Reception session.
  // Never accept a renderer-only session handle as proof.
  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  ) {
    const verified = await validateAndroidReception(sessionId);

    if (
      verified.success &&
      verified.data.sessionId === sessionId
    ) {
      return { success: true, sessionId };
    }

    return {
      success: false,
      errorCode: verified.success
        ? "ANDROID_SESSION_SCOPE_MISMATCH"
        : verified.errorCode,
    };
  }

  const api = bridge();
  if (typeof api?.touch !== "function") {
    return { success: false, errorCode: "SERVER_GUARD_UNAVAILABLE" };
  }
  try {
    const raw: unknown = await api.touch({ sessionId });
    if (!record(raw) || raw.success !== true || raw.sessionId !== sessionId) {
      return { success: false, errorCode: "SERVER_TOUCH_DENIED" };
    }
    return { success: true, sessionId };
  } catch {
    return { success: false, errorCode: "SERVER_TOUCH_UNAVAILABLE" };
  }
}

export async function invalidateFinoraServerGuardSession(
  sessionId: string,
): Promise<Result> {
  if (!validId(sessionId)) {
    return { success: false, errorCode: "INVALID_SERVER_SESSION_ID" };
  }
  const api = bridge();
  if (typeof api?.invalidate !== "function") {
    return { success: false, errorCode: "SERVER_GUARD_UNAVAILABLE" };
  }
  try {
    const raw: unknown = await api.invalidate({ sessionId });
    if (!record(raw) || raw.success !== true || raw.invalidated !== true) {
      return { success: false, errorCode: "SERVER_INVALIDATION_DENIED" };
    }
    return { success: true, sessionId };
  } catch {
    return { success: false, errorCode: "SERVER_INVALIDATION_UNAVAILABLE" };
  }
}
