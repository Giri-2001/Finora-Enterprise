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

export async function validateFinoraServerGuardSession(
  sessionId: string,
): Promise<FinoraReceptionGuardCandidate> {
  if (!validId(sessionId)) {
    return { success: false, errorCode: "INVALID_SERVER_SESSION_ID" };
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
