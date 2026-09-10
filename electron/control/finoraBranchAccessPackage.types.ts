/* ===========================================================
   FINORA ENTERPRISE OS™

   SIGNED BRANCH ACCESS PACKAGE CONTRACT

   MODULE  : Native Control
   LAYER   : Shared Electron Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define the signed BRANCH_ACCESS payload contract
   - Carry one authoritative Branch Access Grant
   - Carry optional one-time credential-enrollment authorization
   - Preserve exact Owner / Business / Branch / Storage scope
   - Preserve REAL / DEMO user-context intent

   SECURITY:

   - No credential secret belongs in this contract.
   - No credential verifier belongs in this contract.
   - No local credential persistence is performed here.
   - No renderer authority is defined here.
=========================================================== */

export const FINORA_BRANCH_ACCESS_PAYLOAD_VERSION =
  1 as const;

export const FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD =
  "SET_PASSWORD_ON_RECIPIENT" as const;

// ============================================================
// TARGET
// ============================================================

export interface FinoraBranchAccessPackageTarget {

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

// ============================================================
// DOMAIN ENUMS
// ============================================================

export type FinoraBranchAccessStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraBranchAccessType =
  | "REGISTERED"
  | "DEMO";

export type FinoraBranchAccessAdministrativeStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export type FinoraBranchAccessUserRole =
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER";

export type FinoraBranchAccessDataContext =
  | "REAL"
  | "DEMO";

export type FinoraBranchAccessAction =
  | "ISSUE"
  | "RENEW"
  | "REPLACE"
  | "SUSPEND"
  | "RESUME"
  | "REVOKE";

// ============================================================
// REGISTRATION PAYMENT
// ============================================================

export interface FinoraBranchAccessRegistrationPayment {

  amount:
    number;

  currency:
    "INR";

  paymentMode:
    | "CASH"
    | "UPI"
    | "BANK_TRANSFER"
    | "OTHER";

  paidAt:
    string;

  reference?:
    string;

  remarks?:
    string;

  refundable:
    false;
}

// ============================================================
// ACCESS GRANT
//
// This intentionally mirrors the authoritative Control Store
// Branch Access Grant domain so recipient apply can perform a
// deterministic verified conversion.
// ============================================================

export interface FinoraBranchAccessGrantPayload {

  grantId:
    string;

  userId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    FinoraBranchAccessStorageMode;

  accessType:
    FinoraBranchAccessType;

  administrativeStatus:
    FinoraBranchAccessAdministrativeStatus;

  validity: {
    validFrom:
      string;

    validUntil:
      string;
  };

  registrationPayment?:
    FinoraBranchAccessRegistrationPayment;

  registrationCycle?:
    number;

  demoId?:
    string;

  demoRemarks?:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// CREDENTIAL ENROLLMENT AUTHORIZATION
//
// This authorizes only local one-time credential setup for the
// exact signed user/scope.
//
// The actual credential secret is supplied later on the recipient
// installation and is never carried by the signed package.
// ============================================================

export interface FinoraBranchCredentialEnrollmentAuthorization {

  authorizationId:
    string;

  userId:
    string;

  username:
    string;

  fullName:
    string;

  role:
    FinoraBranchAccessUserRole;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    FinoraBranchAccessStorageMode;

  dataContext:
    FinoraBranchAccessDataContext;

  demoId?:
    string;

  method:
    typeof FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD;

  oneTime:
    true;

  schemaVersion:
    1;
}

// ============================================================
// PAYLOAD
// ============================================================

export interface FinoraBranchAccessPayloadV1 {

  action:
    FinoraBranchAccessAction;

  accessGrant:
    FinoraBranchAccessGrantPayload;

  credentialEnrollment?:
    FinoraBranchCredentialEnrollmentAuthorization;

  issuedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// END
// ============================================================