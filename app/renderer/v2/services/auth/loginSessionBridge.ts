import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

export type FinoraLoginSessionAccessMode =
  | "ACTIVE"
  | "REGISTERED_EXPIRED_READ_ONLY";

export interface FinoraLoginSessionLoginRequest {
  username: string;
  password: string;
  storageMode: "LOCAL" | "USB";
  securityCode?: string;
}

export interface FinoraLoginSessionRequest {
  sessionId: string;
}

export interface FinoraLoginSessionView {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  role:
    | "ADMIN"
    | "MANAGER"
    | "COLLECTOR"
    | "VIEWER";
  ownerId: string;
  businessId: string;
  branchId: string;
  storageMode: "LOCAL" | "USB";
  dataContext: "REAL" | "DEMO";
  demoId?: string;
  accessMode: FinoraLoginSessionAccessMode;
  loginTime: string;
  lastActivity: string;
  validatedAt: string;
}

export type FinoraLoginSessionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errorCode?: string;
      error: string;
    };

export interface FinoraLoginSessionBridge {
  login(
    request: FinoraLoginSessionLoginRequest,
  ): Promise<
    FinoraLoginSessionResult<
      FinoraLoginSessionView
    >
  >;

  validate(
    request: FinoraLoginSessionRequest,
  ): Promise<
    FinoraLoginSessionResult<
      FinoraLoginSessionView
    >
  >;

  touch(
    request: FinoraLoginSessionRequest,
  ): Promise<
    FinoraLoginSessionResult<{
      sessionId: string;
      lastActivity: string;
    }>
  >;

  invalidate(
    request: FinoraLoginSessionRequest,
  ): Promise<
    FinoraLoginSessionResult<{
      invalidated: boolean;
    }>
  >;
}

const finoraAndroidLoginSessionPlugin =
  registerPlugin<
    FinoraLoginSessionBridge
  >(
    "FinoraControl",
  );

function getElectronLoginSessionBridge():
  FinoraLoginSessionBridge | undefined {

  if (typeof window === "undefined") {
    return undefined;
  }

  const bridge =
    window.finora?.loginSession;

  if (!bridge) {
    return undefined;
  }

  return bridge as unknown as
    FinoraLoginSessionBridge;
}

function getAndroidLoginSessionBridge():
  FinoraLoginSessionBridge | undefined {

  if (!Capacitor.isNativePlatform()) {
    return undefined;
  }

  if (
    Capacitor.getPlatform() !==
    "android"
  ) {
    return undefined;
  }

  if (
    !Capacitor.isPluginAvailable(
      "FinoraControl",
    )
  ) {
    return undefined;
  }

  return finoraAndroidLoginSessionPlugin;
}

/**
 * Resolve FINORA's authoritative login-session bridge.
 *
 * Resolution order:
 * 1. Electron preload bridge.
 * 2. Android Capacitor FinoraControl plugin.
 *
 * Undefined means the runtime does not expose an authoritative
 * FINORA login-session implementation.
 */
export function getFinoraLoginSessionBridge():
  FinoraLoginSessionBridge | undefined {

  return (
    getElectronLoginSessionBridge() ??
    getAndroidLoginSessionBridge()
  );
}
