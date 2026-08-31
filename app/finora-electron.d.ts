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
// CONTROL BRIDGE
// ============================================================

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
   * Read-only FINORA device control API.
   */
  control: FinoraElectronControlBridge;

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
