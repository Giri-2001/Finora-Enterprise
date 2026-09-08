// ============================================================
// FINORA ENTERPRISE OS™
//
// RENDERER ELECTRON BRIDGE DECLARATIONS
//
// RESPONSIBILITY:
//
// - Type the secure Electron preload API exposed as window.finora
// - Type read-only FINORA Control Store operations
// - Preserve the existing USB runtime namespace
//
// SECURITY:
//
// Renderer MAY:
// - Read installation identity
// - Read branch activation state
// - Check LOCAL / USB entitlement status
//
// Renderer MUST NOT:
// - Create or modify branch activation
// - Grant LOCAL / USB entitlement
// - Modify entitlement status
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraActivation,
} from "./renderer/v2/types/activation/finoraActivation.types";

import type {
  FinoraInstallationIdentity,
} from "./renderer/v2/types/activation/finoraInstallation.types";

import type {
  FinoraEntitlementStorageMode,
} from "./renderer/v2/types/activation/finoraStorageEntitlement.types";

import type {
  FinoraVerifiedWalletRechargeAuthorization,
} from "./renderer/v2/types/wallet/finoraWalletRechargeControl.types";

// ============================================================
// GENERIC BRIDGE RESULT
// ============================================================

interface FinoraElectronResult<T> {
  success: boolean;

  data?: T;

  error?: string;
}

// ============================================================
// REQUEST CONTRACTS
// ============================================================

interface FinoraFindBranchActivationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FinoraStorageEntitlementCheckRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraEntitlementStorageMode;
}

// ============================================================
// WALLET RECHARGE READ CONTRACT
// ============================================================

type FinoraElectronWalletRechargeAuthorizationView =
  Omit<
    FinoraVerifiedWalletRechargeAuthorization,
    "installationBinding"
  >;

interface FinoraFindWalletRechargeAuthorizationRequest {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  paymentReference:
    string;
}

// ============================================================
// CONTROL BRIDGE
// ============================================================

type FinoraElectronControlBundleImportResult =
  | {
      success:
        true;

      cancelled:
        true;
    }
  | {
      success:
        true;

      cancelled:
        false;

      fileName:
        string;

      bytesRead:
        number;

      /**
       * Purpose-specific application summary returned by the
       * authoritative Electron main-process import pipeline.
       *
       * Renderer receives this as informational output only.
       * It supplies no trusted keys, installation target,
       * filesystem path, or signed package bytes.
       */
      applySummary:
        unknown;
    }
  | {
      success:
        false;

      error:
        string;
    };

interface FinoraElectronControlBridge {

  /**
   * Returns the device-level FINORA installation identity.
   *
   * Undefined means this installation has not yet been
   * provisioned.
   */
  getInstallation():
    Promise<
      FinoraElectronResult<
        FinoraInstallationIdentity | undefined
      >
    >;

  /**
   * Returns activation state for one Owner / Business / Branch.
   */
  findBranchActivation(
    request:
      FinoraFindBranchActivationRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraActivation | undefined
      >
    >;

  /**
   * Returns one previously verified signed Wallet Recharge
   * authorization for the exact branch/payment reference.
   *
   * READ ONLY.
   *
   * Native installation binding, signed package, signature and
   * apply authority remain outside the renderer.
   */
  findWalletRechargeAuthorization(
    request:
      FinoraFindWalletRechargeAuthorizationRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraElectronWalletRechargeAuthorizationView | undefined
      >
    >;

  /**
   * Checks whether one user/login currently owns an ACTIVE
   * entitlement for the selected LOCAL or USB storage mode.
   */
  hasActiveStorageEntitlement(
    request:
      FinoraStorageEntitlementCheckRequest,
  ):
    Promise<
      FinoraElectronResult<boolean>
    >;

  /**
   * Opens Electron-owned native file selection for one signed
   * FINORA CONTROL_BUNDLE and applies it through authoritative
   * recipient trust verification.
   *
   * This method accepts ZERO renderer arguments.
   *
   * Renderer cannot supply:
   * - filesystem path
   * - package bytes
   * - trusted signing keys
   * - installation target
   * - signing authority
   */
  importControlBundle():
    Promise<
      FinoraElectronControlBundleImportResult
    >;
}

// ============================================================
// NOTIFICATION ARTIFACT BRIDGE
// ============================================================

type FinoraNotificationArtifactStorageMode =
  | "LOCAL"
  | "USB";

type FinoraNotificationArtifactKind =
  | "CUSTOMER_ID_CARD";

type FinoraNotificationArtifactMimeType =
  | "image/png";

interface FinoraNotificationArtifactScope {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FinoraNotificationArtifactReference {
  artifactId: string;

  kind:
    FinoraNotificationArtifactKind;

  storageMode:
    FinoraNotificationArtifactStorageMode;

  mimeType:
    FinoraNotificationArtifactMimeType;

  fileName: string;

  byteLength: number;

  sha256: string;

  createdAt: string;

  scope:
    FinoraNotificationArtifactScope;

  schemaVersion: 1;
}

interface FinoraNotificationArtifactSaveRequest {
  artifactId: string;

  kind:
    FinoraNotificationArtifactKind;

  storageMode:
    FinoraNotificationArtifactStorageMode;

  mimeType:
    FinoraNotificationArtifactMimeType;

  fileName: string;

  contentBase64: string;

  scope:
    FinoraNotificationArtifactScope;
}

interface FinoraElectronNotificationArtifactBridge {

  /**
   * Persists one FINORA-owned Notification artifact.
   *
   * Renderer supplies no filesystem path.
   * Physical LOCAL / USB destination remains privileged.
   */
  save(
    request:
      FinoraNotificationArtifactSaveRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraNotificationArtifactReference
      >
    >;
}


// ============================================================
// NOTIFICATION PROVIDER BRIDGE
// ============================================================

type FinoraNotificationProviderChannel =
  | "SMS"
  | "WHATSAPP"
  | "EMAIL";
interface FinoraNotificationTemplateContext {
  templateKey: string;

  requestedLanguage?: string;

  resolvedLanguage?: string;

  variables:
    Record<string, string>;

  schemaVersion: 1;
}

interface FinoraNotificationProviderConfigurationRequest {
  channel:
    FinoraNotificationProviderChannel;
}

interface FinoraNotificationProviderSendRequest {
  notificationId: string;

  deliveryId: string;

  channel:
    FinoraNotificationProviderChannel;

  title: string;

  message: string;

  /**
   * FINORA-owned structured external-template context.
   *
   * No provider credentials or vendor template IDs belong here.
   */
  templateContext?:
    FinoraNotificationTemplateContext;

  customerId: string;

  customerName?: string;

  phoneNumber?: string;

  whatsappNumber?: string;

  emailAddress?: string;
}

type FinoraNotificationProviderSendOutcome =
  | {
      success: true;

      providerMessageId?: string;

      acceptedAt: string;
    }
  | {
      success: false;

      retryable: boolean;

      failureCode: string;

      failureMessage: string;
    };

interface FinoraElectronNotificationProviderBridge {

  /**
   * Returns only whether the privileged provider for one
   * Notification channel is configured and usable.
   *
   * Credential material is never exposed to the renderer.
   */
  isConfigured(
    request:
      FinoraNotificationProviderConfigurationRequest,
  ):
    Promise<
      FinoraElectronResult<boolean>
    >;

  /**
   * Requests one privileged provider delivery.
   *
   * The renderer supplies delivery content and durable identity.
   * Provider credentials remain inside the privileged process.
   */
  send(
    request:
      FinoraNotificationProviderSendRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraNotificationProviderSendOutcome
      >
    >;
}


// ============================================================
// ROOT FINORA BRIDGE
// ============================================================

interface FinoraElectronRendererBridge {

  /**
   * Preload bridge version.
   */
  version: string;

  /**
   * Existing V2 USB bridge.
   *
   * USBStorageAdapter currently maintains its own narrow bridge
   * contract, so it remains intentionally opaque here.
   */
  usb: unknown;

  /**
   * FINORA device control API.
   *
   * Normal control-state operations remain read/check only.
   * Signed Control Bundle import is exposed only as a
   * zero-argument trigger; Electron main owns native file
   * selection, recipient trust resolution and application.
   */
  control: FinoraElectronControlBridge;
  /**
   * Secure FINORA Notification artifact save API.
   *
   * Renderer receives save-only access.
   * No filesystem path, read API or delete API is exposed.
   */
  notificationArtifacts:
    FinoraElectronNotificationArtifactBridge;

  /**
   * Secure privileged Notification provider API.
   *
   * Provider credentials are never exposed through this bridge.
   */
  notifications:
    FinoraElectronNotificationProviderBridge;
}

// ============================================================
// GLOBAL WINDOW AUGMENTATION
// ============================================================

declare global {
  interface Window {
    finora?: FinoraElectronRendererBridge;
  }
}

export {};
