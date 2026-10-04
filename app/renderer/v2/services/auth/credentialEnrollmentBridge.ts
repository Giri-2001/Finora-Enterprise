import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";


export interface FinoraCredentialEnrollmentRequest {
  username: string;
  password: string;
  securityCode: string;
}


export interface FinoraCredentialEnrollmentView {
  credentialId: string;
  userId: string;
  username: string;
  storageMode?: "LOCAL" | "USB";
}


export type FinoraCredentialEnrollmentResult =
  | {
      success: true;
      data?: FinoraCredentialEnrollmentView;
    }
  | {
      success: false;
      error?: string;
    };


export interface FinoraCredentialEnrollmentBridge {
  enroll(
    request: FinoraCredentialEnrollmentRequest,
  ): Promise<FinoraCredentialEnrollmentResult>;
}


interface FinoraAndroidCredentialEnrollmentPlugin {
  enrollCredential(
    request: FinoraCredentialEnrollmentRequest,
  ): Promise<FinoraCredentialEnrollmentResult>;
}


const finoraAndroidCredentialEnrollmentPlugin =
  registerPlugin<
    FinoraAndroidCredentialEnrollmentPlugin
  >(
    "FinoraControl",
  );


function getElectronCredentialEnrollmentBridge():
  FinoraCredentialEnrollmentBridge | undefined {

  if (typeof window === "undefined") {
    return undefined;
  }

  const bridge =
    window.finora?.credentials;

  if (!bridge?.enroll) {
    return undefined;
  }

  return bridge as unknown as
    FinoraCredentialEnrollmentBridge;
}


function getAndroidCredentialEnrollmentBridge():
  FinoraCredentialEnrollmentBridge | undefined {

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


  return {
    enroll:
      (
        request:
          FinoraCredentialEnrollmentRequest,
      ) =>
        finoraAndroidCredentialEnrollmentPlugin
          .enrollCredential(
            request,
          ),
  };
}


/**
 * Credential enrollment authority resolver.
 *
 * Priority:
 * 1. Electron preload credential authority.
 * 2. Android FinoraControl native authority.
 *
 * Renderer supplies only username/password/securityCode.
 * Identity, branch scope and authorization remain native.
 */
export function getFinoraCredentialEnrollmentBridge():
  FinoraCredentialEnrollmentBridge | undefined {

  return (
    getElectronCredentialEnrollmentBridge() ??
    getAndroidCredentialEnrollmentBridge()
  );
}
// ============================================================
// PORTABLE BRANCH AUTH V2 CREDENTIAL ROTATION
//
// Electron-only renderer resolver.
//
// SECURITY:
// - Renderer supplies credential secrets only for this operation.
// - Identity / role / owner / business / branch authority remains
//   main-process authoritative.
// - No verifier material is exposed to this renderer contract.
// ============================================================

export interface FinoraCredentialRotationRequestV2 {
  rotationRequestId: string;
  username: string;
  currentPassword: string;
  currentSecurityCode: string;
  newPassword?: string;
  newSecurityCode?: string;
}

export interface FinoraCredentialRotationViewV2 {
  transactionId: string;

  credential: {
    credentialId: string;
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

    storageMode:
      | "LOCAL"
      | "USB";

    dataContext:
      | "REAL"
      | "DEMO";

    demoId?: string;
    enrolledAt: string;
  };

  authGeneration: number;

  portableReplaceResult:
    | "REPLACED"
    | "ALREADY_MATCHED";
}

export type FinoraCredentialRotationResultV2 =
  | {
      success: true;
      data: FinoraCredentialRotationViewV2;
    }
  | {
      success: false;
      errorCode?: string;
      error?: string;
    };

export interface FinoraCredentialRotationBridgeV2 {
  rotateV2(
    request: FinoraCredentialRotationRequestV2,
  ): Promise<FinoraCredentialRotationResultV2>;
}

export function getFinoraCredentialRotationBridgeV2():
  FinoraCredentialRotationBridgeV2 | undefined {

  if (typeof window === "undefined") {
    return undefined;
  }

  const bridge =
    window.finora?.credentials;

  if (
    !bridge ||
    typeof bridge.rotateV2 !== "function"
  ) {
    return undefined;
  }

  return bridge as unknown as
    FinoraCredentialRotationBridgeV2;
}
