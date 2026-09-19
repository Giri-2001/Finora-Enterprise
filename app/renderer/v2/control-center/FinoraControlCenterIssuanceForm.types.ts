/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   ISSUANCE FORM DRAFT CONTRACTS

   RESPONSIBILITY:

   - Model renderer-editable fields for current issuance flows
   - Keep target identity in one authoritative draft object
   - Avoid duplicate renderer entry of target-bound identities
   - Keep envelope authority outside renderer form state

   IMPORTANT:

   - packageId is main-process authority.
   - sequence is main-process authority.
   - root issuedAt is main-process authority.
   - schemaVersion values are fixed by payload builders.
   - Installation-binding payload values are derived from target.
=========================================================== */

export type FinoraControlCenterIssuanceWorkflow =
  | "BRANCH_ACTIVATION"
  | "BRANCH_ACCESS"
  | "DEVICE_REVOCATION"
  | "STORAGE_ENTITLEMENT"
  | "BUSINESS_PROFILE"
  | "PRICING_POLICY"
  | "WALLET_RECHARGE";

/* ============================================================
   SHARED TARGET
============================================================ */

export interface FinoraControlCenterTargetDraft {
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
}

/* ============================================================
   BRANCH ACTIVATION
============================================================ */

export type FinoraBranchActivationActionDraft =
  "ISSUE";

export type FinoraBranchAccessAdministrativeStatusDraft =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export type FinoraBranchAccessTypeDraft =
  | "REGISTERED"
  | "DEMO";

export type FinoraRegistrationPaymentModeDraft =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "OTHER";

export interface FinoraBranchActivationFormDraft {
  target:
    FinoraControlCenterTargetDraft;

  action:
    FinoraBranchActivationActionDraft;

  activationId:
    string;

  activationActivatedAt:
    string;

  activationCreatedAt:
    string;

  activationUpdatedAt:
    string;
}

/* ============================================================
   BRANCH ACCESS

   Credential enrollment carries authorization metadata only.
   The actual recipient password is never entered or signed here.
============================================================ */

export type FinoraBranchAccessActionDraft =
  | "ISSUE"
  | "RENEW"
  | "REPLACE"
  | "SUSPEND"
  | "RESUME"
  | "REVOKE"
  | "AUTHORIZE_CREDENTIAL";

export type FinoraBranchAccessUserRoleDraft =
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER";

export interface FinoraBranchAccessFormDraft {
  target:
    FinoraControlCenterTargetDraft;

  action:
    FinoraBranchAccessActionDraft;

  grantId:
    string;

  userId:
    string;

  storageMode:
    FinoraStorageModeDraft;

  administrativeStatus:
    FinoraBranchAccessAdministrativeStatusDraft;

  accessType:
    FinoraBranchAccessTypeDraft;

  validFrom:
    string;

  validUntil:
    string;

  grantCreatedAt:
    string;

  grantUpdatedAt:
    string;

  registrationCycle:
    string;

  registrationPaymentMode:
    FinoraRegistrationPaymentModeDraft;

  registrationPaidAt:
    string;

  registrationPaymentReference:
    string;

  registrationPaymentRemarks:
    string;

  demoId:
    string;

  demoRemarks:
    string;

  credentialEnrollmentEnabled:
    boolean;

  credentialAuthorizationId:
    string;

  credentialUsername:
    string;

  credentialFullName:
    string;

  credentialRole:
    FinoraBranchAccessUserRoleDraft;
}
/* ============================================================
   DEVICE REVOCATION
============================================================ */

export type FinoraBranchDeviceRevocationDataContextDraft =
  | "REAL"
  | "DEMO";

export interface FinoraBranchDeviceRevocationFormDraft {
  target:
    FinoraControlCenterTargetDraft;

  userId:
    string;

  canonicalUsername:
    string;

  storageMode:
    FinoraStorageModeDraft;

  dataContext:
    FinoraBranchDeviceRevocationDataContextDraft;

  demoId:
    string;

  reason:
    string;
}

/* ============================================================
   STORAGE ENTITLEMENT
============================================================ */

export type FinoraStorageModeDraft =
  | "LOCAL"
  | "USB";

export type FinoraStorageEntitlementStatusDraft =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export interface FinoraStorageEntitlementFormDraft {
  target:
    FinoraControlCenterTargetDraft;

  entitlementId:
    string;

  userId:
    string;

  storageMode:
    FinoraStorageModeDraft;

  status:
    FinoraStorageEntitlementStatusDraft;

  activatedAt:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

/* ============================================================
   BUSINESS PROFILE
============================================================ */

export type FinoraBusinessProfileActionDraft =
  | "ISSUE"
  | "REPLACE";

export interface FinoraBusinessProfileFormDraft {
  target:
    FinoraControlCenterTargetDraft;

  action:
    FinoraBusinessProfileActionDraft;

  profileId:
    string;

  businessCode:
    string;

  branchCode:
    string;

  businessName:
    string;

  branchName:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

/* ============================================================
   PRICING POLICY
============================================================ */

export interface FinoraPricingOverrideDraft {
  overrideId:
    string;

  amount:
    string;

  validFrom:
    string;

  validUntil:
    string;
}

export interface FinoraPricingPolicyFormDraft {
  target:
    FinoraControlCenterTargetDraft;

  overrideSetId:
    string;

  overrides:
    FinoraPricingOverrideDraft[];
}

/* ============================================================
   WALLET RECHARGE
============================================================ */

export type FinoraWalletRechargePaymentMethodDraft =
  | "UPI"
  | "PHONEPE"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "RAZORPAY"
  | "BANK_TRANSFER"
  | "OTHER";

export type FinoraWalletPaymentSourceDraft =
  | "PHONEPE"
  | "RAZORPAY"
  | "UPI"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "BANK_TRANSFER"
  | "MANUAL";

export interface FinoraWalletRechargeFormDraft {
  target:
    FinoraControlCenterTargetDraft;

  paymentReference:
    string;

  /**
   * User-facing INR major-unit amount.
   *
   * The pure issuance builder converts this exact decimal
   * representation into signed amountMinor.
   */
  amount:
    string;

  paymentMethod:
    FinoraWalletRechargePaymentMethodDraft;

  paymentSource:
    FinoraWalletPaymentSourceDraft;

  /**
   * Empty string means omitted from the signed payload.
   */
  providerOrderId:
    string;

  /**
   * Empty string means omitted from the signed payload.
   */
  providerTransactionId:
    string;
}

/* ============================================================
   END
============================================================ */