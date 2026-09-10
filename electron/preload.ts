// ============================================================
// FINORA ENTERPRISE OSâ„¢
// ELECTRON PRELOAD
// V2 SECURE STORAGE BRIDGE
//
// RESPONSIBILITY:
//
// - Expose a minimal FINORA API to the renderer
// - Keep contextIsolation enabled
// - Keep Node.js APIs away from the renderer
// - Bridge V2 USB storage operations through IPC
// - Expose the dedicated FINORA data reset operation
//
// IMPORTANT:
//
// - No arbitrary filesystem API is exposed.
// - Renderer receives only FINORA-specific operations.
// - Actual filesystem access remains inside Electron main.
// - RESET FINORA DATA does NOT format the USB device.
// - RESET FINORA DATA does NOT delete unrelated USB files.
// - The actual reset implementation remains inside Electron main.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  contextBridge,
  ipcRenderer,
} from "electron";


// ============================================================
// TYPES
// ============================================================

interface StorageQuery {

  entity: string;

  id?: string;

  ownerId?: string;

  demoId?: string;

  limit?: number;

  offset?: number;
}


interface StorageWriteOptions {

  ownerId?: string;

  demoId?: string;
}


interface StorageResetScope {

  dataContext:
    | "REAL"
    | "DEMO";

  ownerId?: string;

  demoId?: string;
}


interface StorageResult<T = unknown> {

  success: boolean;

  data?: T;

  error?: string;
}


interface UsbStorageStatus {

  availability: string;

  storageId?: string;

  message?: string;
}


interface UsbStorageBridge {

  // ----------------------------------------------------------
  // AVAILABILITY
  // ----------------------------------------------------------

  isAvailable:
    () => Promise<boolean>;


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  getStatus:
    () => Promise<UsbStorageStatus>;


  // ----------------------------------------------------------
  // GET
  // ----------------------------------------------------------

  get:
    <T = unknown>(
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<
          T | undefined
        >
      >;


  // ----------------------------------------------------------
  // GET ALL
  // ----------------------------------------------------------

  getAll:
    <T = unknown>(
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<T[]>
      >;


  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  save:
    <T = unknown>(
      record: unknown,

      options?:
        StorageWriteOptions,
    ) =>
      Promise<
        StorageResult<T>
      >;


  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  update:
    <T = unknown>(
      record: unknown,

      options?:
        StorageWriteOptions,
    ) =>
      Promise<
        StorageResult<T>
      >;


  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  delete:
    (
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<void>
      >;


  // ----------------------------------------------------------
  // REPLACE ALL
  // ----------------------------------------------------------

  replaceAll:
    (
      records: unknown[],

      options?:
        StorageWriteOptions,
    ) =>
      Promise<
        StorageResult<void>
      >;


  // ----------------------------------------------------------
  // CLEAR
  // ----------------------------------------------------------

  clear:
    (
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<void>
      >;


  // ----------------------------------------------------------
  // RESET FINORA DATA
  //
  // IMPORTANT:
  //
  // This invokes ONLY the dedicated FINORA reset IPC channel.
  //
  // No filesystem path is accepted from the renderer.
  // No drive letter is accepted from the renderer.
  // No arbitrary delete operation is exposed.
  // ----------------------------------------------------------

  resetFinoraData:
    (
      scope:
        StorageResetScope,
    ) =>
      Promise<
        StorageResult<void>
      >;
}


// ============================================================
// FINORA CONTROL TYPES
// ============================================================

type FinoraControlStorageMode =
  | "LOCAL"
  | "USB";

interface FinoraControlInstallationIdentity {
  installationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  /**
   * Immutable FINORA-assigned numbering codes.
   *
   * Optional only for legacy installation identities.
   */
  businessCode?: string;

  branchCode?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

interface FinoraControlBranchActivation {
  activationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  status:
    | "PENDING"
    | "ACTIVE"
    | "SUSPENDED"
    | "DEACTIVATED";

  activatedAt?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

type FinoraControlBranchAccessType =
  | "REGISTERED"
  | "DEMO";

type FinoraControlBranchAccessStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

interface FinoraControlRegistrationPayment {
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

interface FinoraControlBranchAccessGrant {
  grantId: string;

  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;


  storageMode:
    FinoraControlStorageMode;
accessType:
    FinoraControlBranchAccessType;

  administrativeStatus:
    FinoraControlBranchAccessStatus;

  validity: {
    validFrom: string;

    validUntil: string;
  };

  registrationPayment?:
    FinoraControlRegistrationPayment;

  registrationCycle?: number;

  demoId?: string;

  demoRemarks?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}
interface FinoraControlBusinessProfileView {

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


interface FinoraControlPricingOverrideRuleView {

  overrideId:
    string;

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

  amount:
    number;

  currency:
    "INR";

  validity: {
    validFrom:
      string;

    validUntil:
      string;
  };

  schemaVersion:
    1;
}

interface FinoraControlPricingOverrideSetView {

  overrideSetId:
    string;

  scope: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;
  };

  overrides:
    FinoraControlPricingOverrideRuleView[];

  schemaVersion:
    1;
}

interface FinoraControlWalletRechargeAuthorizationView {

  packageId:
    string;

  issuerId:
    string;

  signingKeyId:
    string;

  purpose:
    "WALLET_RECHARGE";

  sequence:
    number;

  scope: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;
  };

  paymentReference:
    string;

  amountMinor:
    number;

  currency:
    "INR";

  paymentMethod:
    string;

  paymentSource:
    string;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;

  issuedAt:
    string;

  verifiedAt:
    string;

  schemaVersion:
    1;
}

interface FindBusinessProfileRequest {

  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FindPricingPolicyRequest {

  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FindWalletRechargeAuthorizationRequest {

  ownerId: string;

  businessId: string;

  branchId: string;

  paymentReference: string;
}

interface FindBranchActivationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FindBranchAccessGrantRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;
}

type FinoraControlBranchAccessAuthorityState =
  | "MISSING"
  | "INVALID"
  | "REVOKED"
  | "SUSPENDED"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "ACTIVE";

interface FinoraControlBranchAccessAuthorityDecision {
  allowed: boolean;

  state:
    FinoraControlBranchAccessAuthorityState;

  reason: string;

  observedAt: string;

  grant?:
    FinoraControlBranchAccessGrant;
}

interface FinoraControlBranchAccessAuthorityResult {
  success: boolean;

  data?:
    FinoraControlBranchAccessAuthorityDecision;

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

interface StorageEntitlementCheckRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraControlStorageMode;
}

type FinoraInstallationEnrollmentRequestExportResult =
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

type FinoraControlBundleImportResult =
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

      applySummary:
        unknown;
    }
  | {
      success:
        false;

      error:
        string;
    };

interface FinoraControlBridge {
  getInstallation:
    () =>
      Promise<
        StorageResult<
          FinoraControlInstallationIdentity | undefined
        >
      >;

  findBranchActivation:
    (
      request:
        FindBranchActivationRequest,
    ) =>
      Promise<
        StorageResult<
          FinoraControlBranchActivation | undefined
        >
      >;

  findBusinessProfile:
    (
      request:
        FindBusinessProfileRequest,
    ) =>
      Promise<
        StorageResult<
          FinoraControlBusinessProfileView | undefined
        >
      >;

  findPricingPolicy:
    (
      request:
        FindPricingPolicyRequest,
    ) =>
      Promise<
        StorageResult<
          FinoraControlPricingOverrideSetView | undefined
        >
      >;

  findWalletRechargeAuthorization:
    (
      request:
        FindWalletRechargeAuthorizationRequest,
    ) =>
      Promise<
        StorageResult<
          FinoraControlWalletRechargeAuthorizationView | undefined
        >
      >;

  evaluateBranchAccess:
    (
      request:
        FindBranchAccessGrantRequest,
    ) =>
      Promise<
        FinoraControlBranchAccessAuthorityResult
      >;

  hasActiveStorageEntitlement:
    (
      request:
        StorageEntitlementCheckRequest,
    ) =>
      Promise<
        StorageResult<boolean>
      >;

  exportInstallationEnrollmentRequest:
    () =>
      Promise<
        FinoraInstallationEnrollmentRequestExportResult
      >;

  importInstallationEnrollmentResponse:
    (
      expectedControlCenterPublicKeyFingerprint:
        string,
    ) =>
      Promise<
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

            responseId:
              string;

            requestId:
              string;

            installationId:
              string;

            ownerId:
              string;

            businessId:
              string;

            branchId:
              string;

            businessCode:
              string;

            branchCode:
              string;

            trustRecovered:
              boolean;

            installationRecovered:
              boolean;

            completedAt:
              string;
          }
        | {
            success:
              false;

            error:
              string;
          }
      >;

  importControlBundle:
    () =>
      Promise<
        FinoraControlBundleImportResult
      >;
}


// ============================================================
// ============================================================
// FINORA NOTIFICATION PROVIDER BRIDGE CONTRACT
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

type FinoraNotificationArtifactResult<T> =
  | {
      success: true;

      data: T;
    }
  | {
      success: false;

      error: string;
    };

interface FinoraNotificationArtifactBridge {
  save(
    request:
      FinoraNotificationArtifactSaveRequest,
  ):
    Promise<
      FinoraNotificationArtifactResult<
        FinoraNotificationArtifactReference
      >
    >;
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

interface FinoraNotificationProviderBridge {
  isConfigured(
    request:
      FinoraNotificationProviderConfigurationRequest,
  ):
    Promise<
      StorageResult<boolean>
    >;

  send(
    request:
      FinoraNotificationProviderSendRequest,
  ):
    Promise<
      StorageResult<
        FinoraNotificationProviderSendOutcome
      >
    >;
}

// IPC CHANNELS
// ============================================================

const USB_CHANNELS = {

  IS_AVAILABLE:
    "finora:usb:is-available",

  GET_STATUS:
    "finora:usb:get-status",

  GET:
    "finora:usb:get",

  GET_ALL:
    "finora:usb:get-all",

  SAVE:
    "finora:usb:save",

  UPDATE:
    "finora:usb:update",

  DELETE:
    "finora:usb:delete",

  REPLACE_ALL:
    "finora:usb:replace-all",

  CLEAR:
    "finora:usb:clear",

  RESET_FINORA_DATA:
    "finora:usb:reset-finora-data",

} as const;


// ============================================================
// CONTROL IPC CHANNELS
// ============================================================

const CONTROL_CHANNELS = {

  GET_INSTALLATION:
    "finora:control:get-installation",

  FIND_BRANCH_ACTIVATION:
    "finora:control:find-branch-activation",

  EVALUATE_BRANCH_ACCESS:
    "finora:control:evaluate-branch-access",

  FIND_BUSINESS_PROFILE:
    "finora:control:find-business-profile",

  FIND_PRICING_POLICY:
    "finora:control:find-pricing-policy",

  FIND_WALLET_RECHARGE_AUTHORIZATION:
    "finora:control:find-wallet-recharge-authorization",

  HAS_ACTIVE_STORAGE_ENTITLEMENT:
    "finora:control:has-active-storage-entitlement",

  EXPORT_INSTALLATION_ENROLLMENT_REQUEST:
    "finora:control:export-installation-enrollment-request",

  IMPORT_INSTALLATION_ENROLLMENT_RESPONSE:
    "finora:control:import-installation-enrollment-response",

  IMPORT_CONTROL_BUNDLE:
    "finora:control:import-control-bundle",

} as const;

// ============================================================
// BRANCH CREDENTIAL IPC CHANNELS
// ============================================================

const BRANCH_CREDENTIAL_CHANNELS = {

  ENROLL:
    "finora:credential:enroll",

} as const;


// ============================================================
// BRANCH CREDENTIAL PRELOAD CONTRACT
//
// Password is transient request material only.
// No verifier, salt or derived-key contract is exposed.
// ============================================================

interface FinoraCredentialEnrollmentRequest {

  username:
    string;

  password:
    string;
}

type FinoraCredentialBridgeResult<T> =
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

interface FinoraCredentialEnrollmentView {

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

interface FinoraCredentialBridge {

  enroll(
    request:
      FinoraCredentialEnrollmentRequest,
  ):
    Promise<
      FinoraCredentialBridgeResult<
        FinoraCredentialEnrollmentView
      >
    >;


}

// ============================================================
// BRANCH LOGIN SESSION IPC CHANNELS
// ============================================================

const BRANCH_LOGIN_SESSION_CHANNELS = {
  LOGIN:
    "finora:login-session:login",

  VALIDATE:
    "finora:login-session:validate",

  TOUCH:
    "finora:login-session:touch",

  INVALIDATE:
    "finora:login-session:invalidate",
} as const;


// ============================================================
// BRANCH LOGIN SESSION PRELOAD CONTRACT
// ============================================================
interface FinoraLoginSessionLoginRequest {
  username:
    string;

  password:
    string;

  storageMode:
    | "LOCAL"
    | "USB";
}

interface FinoraLoginSessionRequest {
  sessionId:
    string;
}

type FinoraLoginSessionAccessMode =
  | "ACTIVE"
  | "REGISTERED_EXPIRED_READ_ONLY";

interface FinoraLoginSessionView {
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
    FinoraLoginSessionAccessMode;

  loginTime:
    string;

  lastActivity:
    string;

  validatedAt:
    string;
}

type FinoraLoginSessionBridgeResult<T> =
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

interface FinoraLoginSessionBridge {
  login(
    request:
      FinoraLoginSessionLoginRequest,
  ):
    Promise<
      FinoraLoginSessionBridgeResult<
        FinoraLoginSessionView
      >
    >;

  validate(
    request:
      FinoraLoginSessionRequest,
  ):
    Promise<
      FinoraLoginSessionBridgeResult<
        FinoraLoginSessionView
      >
    >;

  touch(
    request:
      FinoraLoginSessionRequest,
  ):
    Promise<
      FinoraLoginSessionBridgeResult<{
        sessionId:
          string;

        lastActivity:
          string;
      }>
    >;

  invalidate(
    request:
      FinoraLoginSessionRequest,
  ):
    Promise<
      FinoraLoginSessionBridgeResult<{
        invalidated:
          boolean;
      }>
    >;
}

// ============================================================
// SECURE USB BRIDGE
// ============================================================

const usbBridge:
  UsbStorageBridge = {

  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  isAvailable:
    () =>
      ipcRenderer.invoke(
        USB_CHANNELS.IS_AVAILABLE,
      ),


  // ==========================================================
  // STATUS
  // ==========================================================

  getStatus:
    () =>
      ipcRenderer.invoke(
        USB_CHANNELS.GET_STATUS,
      ),


  // ==========================================================
  // GET
  // ==========================================================

  get:
    <T = unknown>(
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.GET,
        query,
      ) as Promise<
        StorageResult<
          T | undefined
        >
      >,


  // ==========================================================
  // GET ALL
  // ==========================================================

  getAll:
    <T = unknown>(
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.GET_ALL,
        query,
      ) as Promise<
        StorageResult<T[]>
      >,


  // ==========================================================
  // SAVE
  // ==========================================================

  save:
    <T = unknown>(
      record:
        unknown,

      options?:
        StorageWriteOptions,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.SAVE,
        record,
        options,
      ) as Promise<
        StorageResult<T>
      >,


  // ==========================================================
  // UPDATE
  // ==========================================================

  update:
    <T = unknown>(
      record:
        unknown,

      options?:
        StorageWriteOptions,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.UPDATE,
        record,
        options,
      ) as Promise<
        StorageResult<T>
      >,


  // ==========================================================
  // DELETE
  // ==========================================================

  delete:
    (
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.DELETE,
        query,
      ) as Promise<
        StorageResult<void>
      >,


  // ==========================================================
  // REPLACE ALL
  // ==========================================================

  replaceAll:
    (
      records:
        unknown[],

      options?:
        StorageWriteOptions,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.REPLACE_ALL,
        records,
        options,
      ) as Promise<
        StorageResult<void>
      >,


  // ==========================================================
  // CLEAR
  // ==========================================================

  clear:
    (
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.CLEAR,
        query,
      ) as Promise<
        StorageResult<void>
      >,


  // ==========================================================
  // RESET FINORA DATA
  //
  // The renderer only requests a FINORA reset.
  //
  // Electron main decides:
  //
  // - Which removable device is valid
  // - Which FINORA storage namespace is valid
  // - Which file is allowed to change
  //
  // The renderer cannot provide a filesystem path.
  // ==========================================================

  resetFinoraData:
    (
      scope:
        StorageResetScope,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.RESET_FINORA_DATA,
        scope,
      ) as Promise<
        StorageResult<void>
      >,
};


// ============================================================
// FINORA NOTIFICATION PROVIDER IPC CHANNELS
// ============================================================

const NOTIFICATION_ARTIFACT_CHANNELS = {
  SAVE:
    "finora:notification-artifacts:save",
} as const;


// ============================================================
// FINORA NOTIFICATION PROVIDER IPC CHANNELS
// ============================================================

const NOTIFICATION_PROVIDER_CHANNELS = {
  IS_CONFIGURED:
    "finora:notifications:is-configured",

  SEND:
    "finora:notifications:send",
} as const;


// ============================================================
// FINORA NOTIFICATION PROVIDER BRIDGE
//
// Provider credentials remain inside Electron main.
// Renderer receives only safe configuration state and
// normalized delivery outcomes.
// ============================================================

const notificationArtifactBridge:
  FinoraNotificationArtifactBridge = {

  save:
    (
      request:
        FinoraNotificationArtifactSaveRequest,
    ) =>
      ipcRenderer.invoke(
        NOTIFICATION_ARTIFACT_CHANNELS.SAVE,
        request,
      ) as Promise<
        FinoraNotificationArtifactResult<
          FinoraNotificationArtifactReference
        >
      >,
};


// ============================================================
// FINORA NOTIFICATION PROVIDER BRIDGE
//
// Provider credentials remain inside Electron main.
// Renderer receives only safe configuration state and
// normalized delivery outcomes.
// ============================================================

const notificationProviderBridge:
  FinoraNotificationProviderBridge = {

  isConfigured:
    (
      request:
        FinoraNotificationProviderConfigurationRequest,
    ) =>
      ipcRenderer.invoke(
        NOTIFICATION_PROVIDER_CHANNELS.IS_CONFIGURED,
        request,
      ) as Promise<
        StorageResult<boolean>
      >,

  send:
    (
      request:
        FinoraNotificationProviderSendRequest,
    ) =>
      ipcRenderer.invoke(
        NOTIFICATION_PROVIDER_CHANNELS.SEND,
        request,
      ) as Promise<
        StorageResult<
          FinoraNotificationProviderSendOutcome
        >
      >,
};

// FINORA CONTROL BRIDGE
//
// Normal control-state operations remain READ / CHECK ONLY.
//
// Signed Control Bundle import is the sole constrained action:
// renderer supplies no filesystem path, signed package bytes,
// trusted signing keys, installation target, or signing authority.
// Electron main owns native file selection and authoritative apply.
//
// Activation creation and storage entitlement granting remain
// intentionally NOT exposed to the renderer.
// ============================================================

const controlBridge:
  FinoraControlBridge = {

  // ----------------------------------------------------------
  // INSTALLATION IDENTITY
  // ----------------------------------------------------------

  getInstallation:
    () =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.GET_INSTALLATION,
      ) as Promise<
        StorageResult<
          FinoraControlInstallationIdentity | undefined
        >
      >,


  // ----------------------------------------------------------
  // BRANCH ACTIVATION
  // ----------------------------------------------------------

  findBranchActivation:
    (
      request:
        FindBranchActivationRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.FIND_BRANCH_ACTIVATION,
        request,
      ) as Promise<
        StorageResult<
          FinoraControlBranchActivation | undefined
        >
      >,


  // ----------------------------------------------------------
  // BRANCH ACCESS GRANT
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // PROVISIONED BUSINESS PROFILE
  //
  // READ ONLY.
  // ----------------------------------------------------------

  findBusinessProfile:
    (
      request:
        FindBusinessProfileRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.FIND_BUSINESS_PROFILE,
        request,
      ) as Promise<
        StorageResult<
          FinoraControlBusinessProfileView | undefined
        >
      >,

  // ----------------------------------------------------------
  // VERIFIED PRICING POLICY
  //
  // READ ONLY.
  // ----------------------------------------------------------

  findPricingPolicy:
    (
      request:
        FindPricingPolicyRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.FIND_PRICING_POLICY,
        request,
      ) as Promise<
        StorageResult<
          FinoraControlPricingOverrideSetView | undefined
        >
      >,

  // ----------------------------------------------------------
  // VERIFIED WALLET RECHARGE AUTHORIZATION
  //
  // READ ONLY.
  // ----------------------------------------------------------

  findWalletRechargeAuthorization:
    (
      request:
        FindWalletRechargeAuthorizationRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.FIND_WALLET_RECHARGE_AUTHORIZATION,
        request,
      ) as Promise<
        StorageResult<
          FinoraControlWalletRechargeAuthorizationView | undefined
        >
      >,

  evaluateBranchAccess:
    (
      request:
        FindBranchAccessGrantRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.EVALUATE_BRANCH_ACCESS,
        request,
      ) as Promise<
        FinoraControlBranchAccessAuthorityResult
      >,

  // ----------------------------------------------------------
  // STORAGE ENTITLEMENT CHECK
  // ----------------------------------------------------------

  hasActiveStorageEntitlement:
    (
      request:
        StorageEntitlementCheckRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.HAS_ACTIVE_STORAGE_ENTITLEMENT,
        request,
      ) as Promise<
        StorageResult<boolean>
      >,

  // ----------------------------------------------------------
  // SIGNED CONTROL BUNDLE IMPORT
  //
  // Renderer supplies no path, package bytes, trusted keys,
  // installation target, or signing authority.
  //
  // Electron main owns:
  //
  // native file selection
  // -> authoritative recipient trust resolution
  // -> cryptographic verification
  // -> CONTROL_BUNDLE application
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // INSTALLATION ENROLLMENT REQUEST EXPORT
  //
  // Zero arguments.
  // Renderer cannot supply path, payload or signature.
  // Electron main owns generation + native Save dialog.
  // ----------------------------------------------------------

  exportInstallationEnrollmentRequest:
    () =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.EXPORT_INSTALLATION_ENROLLMENT_REQUEST,
      ) as Promise<
        FinoraInstallationEnrollmentRequestExportResult
      >,

  importInstallationEnrollmentResponse:
    (
      expectedControlCenterPublicKeyFingerprint,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS
          .IMPORT_INSTALLATION_ENROLLMENT_RESPONSE,
        expectedControlCenterPublicKeyFingerprint,
      ),

  importControlBundle:
    () =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.IMPORT_CONTROL_BUNDLE,
      ) as Promise<
        FinoraControlBundleImportResult
      >,
};


// ============================================================
// BRANCH CREDENTIAL BRIDGE
// ============================================================

const credentialBridge:
  FinoraCredentialBridge = {

  enroll:
    (
      request:
        FinoraCredentialEnrollmentRequest,
    ) =>
      ipcRenderer.invoke(
        BRANCH_CREDENTIAL_CHANNELS.ENROLL,
        request,
      ) as Promise<
        FinoraCredentialBridgeResult<
          FinoraCredentialEnrollmentView
        >
      >,


};

// ============================================================
// BRANCH LOGIN SESSION BRIDGE
// ============================================================

const loginSessionBridge:
  FinoraLoginSessionBridge = {
  login:
    (
      request:
        FinoraLoginSessionLoginRequest,
    ) =>
      ipcRenderer.invoke(
        BRANCH_LOGIN_SESSION_CHANNELS.LOGIN,
        request,
      ) as Promise<
        FinoraLoginSessionBridgeResult<
          FinoraLoginSessionView
        >
      >,

  validate:
    (
      request:
        FinoraLoginSessionRequest,
    ) =>
      ipcRenderer.invoke(
        BRANCH_LOGIN_SESSION_CHANNELS.VALIDATE,
        request,
      ) as Promise<
        FinoraLoginSessionBridgeResult<
          FinoraLoginSessionView
        >
      >,

  touch:
    (
      request:
        FinoraLoginSessionRequest,
    ) =>
      ipcRenderer.invoke(
        BRANCH_LOGIN_SESSION_CHANNELS.TOUCH,
        request,
      ) as Promise<
        FinoraLoginSessionBridgeResult<{
          sessionId:
            string;

          lastActivity:
            string;
        }>
      >,

  invalidate:
    (
      request:
        FinoraLoginSessionRequest,
    ) =>
      ipcRenderer.invoke(
        BRANCH_LOGIN_SESSION_CHANNELS.INVALIDATE,
        request,
      ) as Promise<
        FinoraLoginSessionBridgeResult<{
          invalidated:
            boolean;
        }>
      >,
};


// ============================================================
// FINORA RENDERER BRIDGE
// ============================================================

contextBridge.exposeInMainWorld(
  "finora",
  {
    loginSession:
      loginSessionBridge,

    version:
      "2.0.0",

    usb:
      usbBridge,

    control:
      controlBridge,
    credentials:
      credentialBridge,

    notificationArtifacts:
      notificationArtifactBridge,

    notifications:
      notificationProviderBridge,

  },
);


// ============================================================
// MODULE EXPORT
// ============================================================

export {};
