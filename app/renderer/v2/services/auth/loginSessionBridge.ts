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
  credentialChangeRequired:
    boolean;

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

export interface FinoraServerFirstV2RecoveryRequest {
  username: string;
  password: string;
  securityCode: string;
}

export type FinoraServerFirstV2RecoveryResult =
  | {
      success: true;
      status: "RECOVERED";
      loginAuthorized: false;
    }
  | {
      success: false;
      errorCode?: string;
      loginAuthorized: false;
    };

interface FinoraAndroidServerFirstV2Plugin {
  enrollServerFirstLoginV2(
    request: FinoraServerFirstV2RecoveryRequest,
  ): Promise<{
    success: boolean;
    loginAuthorized: false;
    enrollmentStatus?: string;
    errorCode?: string;
  }>;
  checkServerFirstV2RecoveryEligibility(
    request: { username: string },
  ): Promise<{
    eligible: boolean;
    errorCode?: string;
  }>;
  recoverServerFirstLoginV2(
    request: FinoraServerFirstV2RecoveryRequest,
  ): Promise<FinoraServerFirstV2RecoveryResult>;
}

const finoraAndroidServerFirstV2Plugin =
  registerPlugin<FinoraAndroidServerFirstV2Plugin>(
    "FinoraControl",
  );

/**
 * Android-only explicit V2 recovery operation.
 * This is NOT a login session and cannot authorize the UI.
 */
export function getFinoraAndroidServerFirstV2Recovery():
  | FinoraAndroidServerFirstV2Plugin
  | undefined {

  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "android" ||
    !Capacitor.isPluginAvailable("FinoraControl")
  ) {
    return undefined;
  }

  return finoraAndroidServerFirstV2Plugin;
}

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
