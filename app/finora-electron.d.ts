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
interface FinoraFindWalletRechargeDeclineRequest {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  paymentReference:
    string;
}

interface FinoraElectronWalletRechargeDeclineView {
  packageId:
    string;

  issuerId:
    string;

  signingKeyId:
    string;

  purpose:
    "WALLET_RECHARGE_DECLINE";

  sequence:
    number;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  requestId:
    string;

  paymentReference:
    string;

  amountMinor:
    number;

  currency:
    "INR";

  paymentMethod:
    | "UPI"
    | "PHONEPE"
    | "GOOGLE_PAY"
    | "PAYTM"
    | "RAZORPAY"
    | "BANK_TRANSFER"
    | "OTHER";

  paymentSource:
    | "PHONEPE"
    | "RAZORPAY"
    | "UPI"
    | "GOOGLE_PAY"
    | "PAYTM"
    | "BANK_TRANSFER"
    | "MANUAL";

  requestedAt:
    string;

  outcome:
    "DECLINED";

  issuedAt:
    string;

  verifiedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// CONTROL BRIDGE
// ============================================================

type FinoraElectronInstallationEnrollmentRequestExportResult =
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

      bytesWritten:
        number;

      requestId:
        string;

      installationId:
        string;

      bindingKeyId:
        string;

      publicKeyFingerprint:
        string;
    }
  | {
      success:
        false;

      error:
        string;
    };

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

// ============================================================
// CONTROL BRIDGE — STRONGLY TYPED RENDERER CONTRACT
// ============================================================

interface FinoraFindBranchAccessGrantRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FinoraFindBusinessProfileRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FinoraFindPricingPolicyRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

type FinoraElectronBranchAccessType =
  | "REGISTERED"
  | "DEMO";

type FinoraElectronBranchAccessStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

interface FinoraElectronRegistrationPayment {
  amount: number;

  currency: string;

  paymentMode:
    | "CASH"
    | "UPI"
    | "BANK_TRANSFER"
    | "OTHER";

  paidAt: string;

  reference?: string;

  remarks?: string;

  refundable: false;
}

interface FinoraElectronBranchAccessGrant {
  grantId: string;

  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode:
    FinoraEntitlementStorageMode;

  accessType:
    FinoraElectronBranchAccessType;

  administrativeStatus:
    FinoraElectronBranchAccessStatus;

  validity: {
    validFrom: string;

    validUntil: string;
  };

  registrationPayment?:
    FinoraElectronRegistrationPayment;

  registrationCycle?: number;

  demoId?: string;

  demoRemarks?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

type FinoraElectronBranchAccessAuthorityState =
  | "MISSING"
  | "INVALID"
  | "REVOKED"
  | "SUSPENDED"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "ACTIVE";

interface FinoraElectronBranchAccessAuthorityDecision {
  allowed: boolean;

  state:
    FinoraElectronBranchAccessAuthorityState;

  reason: string;

  observedAt: string;

  grant?:
    FinoraElectronBranchAccessGrant;
}

interface FinoraElectronBranchAccessAuthorityResult {
  success: boolean;

  data?:
    FinoraElectronBranchAccessAuthorityDecision;

  error?: string;

  errorCode?:
    | "INVALID_REQUEST"
    | "CLOCK_AUTHORITY_FAILED"
    | "CONTROL_STORE_FAILED";

  clockErrorCode?:
    | "INVALID_OBSERVED_TIME"
    | "INSTALLATION_BINDING_UNAVAILABLE"
    | "INSTALLATION_ID_MISMATCH"
    | "CLOCK_ROLLBACK_DETECTED"
    | "CLOCK_HIGH_WATER_STORAGE_FAILED";
}

interface FinoraElectronBusinessProfileView {
  profileId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  businessCode: string;

  branchCode: string;

  businessName: string;

  branchName: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

interface FinoraElectronPricingOverrideRuleView {
  overrideId: string;

  chargeCode:
    | "LOAN_DISBURSEMENT"
    | "LOAN_NUMBER_GENERATION"
    | "CUSTOMER_NUMBER_GENERATION"
    | "COLLECTION_PROCESSING"
    | "RECEIPT_PROCESSING"
    | "CUSTOMER_ID_CARD_GENERATION"
    | "OTHER_PLATFORM_FEE";

  model:
    "FIXED_PRICE_OVERRIDE";

  amount: number;

  currency:
    "INR";

  validity: {
    validFrom: string;

    validUntil: string;
  };

  schemaVersion: 1;
}

interface FinoraElectronPricingOverrideSetView {
  overrideSetId: string;

  scope: {
    ownerId: string;

    businessId: string;

    branchId: string;
  };

  overrides:
    FinoraElectronPricingOverrideRuleView[];

  schemaVersion: 1;
}

type FinoraElectronInstallationEnrollmentResponseImportResult =
  | {
      success: true;

      cancelled: true;
    }
  | {
      success: true;

      cancelled: false;

      fileName: string;

      bytesRead: number;

      responseId: string;

      requestId: string;

      installationId: string;

      ownerId: string;

      businessId: string;

      branchId: string;

      businessCode: string;

      branchCode: string;

      trustRecovered: boolean;

      installationRecovered: boolean;

      completedAt: string;
    }
  | {
      success: false;

      error: string;
    };

interface FinoraElectronControlBridge {
  getInstallation():
    Promise<
      FinoraElectronResult<
        FinoraInstallationIdentity | undefined
      >
    >;

  findBranchActivation(
    request:
      FinoraFindBranchActivationRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraActivation | undefined
      >
    >;

  findBusinessProfile(
    request:
      FinoraFindBusinessProfileRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraElectronBusinessProfileView | undefined
      >
    >;

  findPricingPolicy(
    request:
      FinoraFindPricingPolicyRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraElectronPricingOverrideSetView | undefined
      >
    >;

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
   * Returns one previously verified signed Wallet Recharge
   * decline for the exact branch/payment reference.
   *
   * READ ONLY.
   *
   * Native installation binding, signature verification and
   * signed-package apply authority remain outside the renderer.
   */
  findWalletRechargeDecline(
    request:
      FinoraFindWalletRechargeDeclineRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraElectronWalletRechargeDeclineView | undefined
      >
    >;

  evaluateBranchAccess(
    request:
      FinoraFindBranchAccessGrantRequest,
  ):
    Promise<
      FinoraElectronBranchAccessAuthorityResult
    >;

  hasActiveStorageEntitlement(
    request:
      FinoraStorageEntitlementCheckRequest,
  ):
    Promise<
      FinoraElectronResult<boolean>
    >;

  exportInstallationEnrollmentRequest():
    Promise<
      FinoraElectronInstallationEnrollmentRequestExportResult
    >;

  importInstallationEnrollmentResponse(
    expectedControlCenterPublicKeyFingerprint:
      string,
  ):
    Promise<
      FinoraElectronInstallationEnrollmentResponseImportResult
    >;

  importControlBundle():
    Promise<
      FinoraElectronControlBundleImportResult
    >;
}
interface FinoraElectronCredentialEnrollmentRequest {
  username:
    string;

  password:
    string;

  securityCode:
    string;
}

interface FinoraElectronCredentialEnrollmentView {
  credentialId:
    string;

  userId:
    string;

  username:
    string;

  fullName:
    string;

  role:
    | "ADMIN"
    | "MANAGER"
    | "COLLECTOR"
    | "VIEWER";

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    | "LOCAL"
    | "USB";

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?:
    string;

  enrolledAt:
    string;
}

type FinoraElectronCredentialResult<T> =
  | {
      success:
        true;

      data:
        T;
    }
  | {
      success:
        false;

      errorCode?:
        string;

      error:
        string;
    };

interface FinoraElectronCredentialBridge {
  enroll(
    request:
      FinoraElectronCredentialEnrollmentRequest,
  ):
    Promise<
      FinoraElectronCredentialResult<
        FinoraElectronCredentialEnrollmentView
      >
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

type FinoraElectronLoginSessionAccessMode =
  | "ACTIVE"
  | "REGISTERED_EXPIRED_READ_ONLY";

interface FinoraElectronLoginSessionLoginRequest {
  username:
    string;

  password:
    string;

  storageMode:
    | "LOCAL"
    | "USB";

  securityCode?:
    string;
}

interface FinoraElectronLoginSessionRequest {
  sessionId:
    string;
}

interface FinoraElectronLoginSessionView {
  sessionId:
    string;

  userId:
    string;

  username:
    string;

  fullName:
    string;

  role:
    | "ADMIN"
    | "MANAGER"
    | "COLLECTOR"
    | "VIEWER";

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    | "LOCAL"
    | "USB";

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?:
    string;

  accessMode:
    FinoraElectronLoginSessionAccessMode;

  loginTime:
    string;

  lastActivity:
    string;

  validatedAt:
    string;
}

type FinoraElectronLoginSessionResult<T> =
  | {
      success:
        true;

      data:
        T;
    }
  | {
      success:
        false;

      errorCode?:
        string;

      error:
        string;
    };

interface FinoraElectronLoginSessionBridge {
  login(
    request:
      FinoraElectronLoginSessionLoginRequest,
  ):
    Promise<
      FinoraElectronLoginSessionResult<
        FinoraElectronLoginSessionView
      >
    >;

  validate(
    request:
      FinoraElectronLoginSessionRequest,
  ):
    Promise<
      FinoraElectronLoginSessionResult<
        FinoraElectronLoginSessionView
      >
    >;

  touch(
    request:
      FinoraElectronLoginSessionRequest,
  ):
    Promise<
      FinoraElectronLoginSessionResult<{
        sessionId:
          string;

        lastActivity:
          string;
      }>
    >;

  invalidate(
    request:
      FinoraElectronLoginSessionRequest,
  ):
    Promise<
      FinoraElectronLoginSessionResult<{
        invalidated:
          boolean;
      }>
    >;
}

// ============================================================
// ROOT RENDERER BRIDGE
// ============================================================
interface FinoraElectronRendererBridge {
  loginSession:
    FinoraElectronLoginSessionBridge;

  /**
   * Main-process one-time local credential enrollment.
   *
   * No verifier, salt or derived-key material is exposed.
   */
  credentials:
    FinoraElectronCredentialBridge;

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
