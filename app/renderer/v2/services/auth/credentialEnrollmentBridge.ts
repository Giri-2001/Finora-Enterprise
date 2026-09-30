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