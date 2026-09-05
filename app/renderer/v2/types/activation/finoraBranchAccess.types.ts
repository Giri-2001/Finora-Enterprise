// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// BRANCH ACCESS ENTITLEMENT TYPES
//
// RESPONSIBILITY:
//
// - Define FINORA REGISTERED and DEMO access contracts
// - Bind one access grant to Owner / Business / Branch / User
// - Define authoritative access validity window
// - Represent commercial registration metadata
// - Represent Demo identity and lifecycle
// - Support automatic expiry independent of manual deletion
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No authentication execution.
// - No date calculations.
// - No Business Date usage.
// - No localStorage.
// - No StorageManager.
// - No filesystem.
// - No Electron IPC.
// - No wallet mutation.
// - No pricing calculation.
// - No customer / loan / collection data.
//
// COMMERCIAL MODEL:
//
// REGISTERED:
// - Annual FINORA branch access.
// - Current commercial fee is controlled outside this type.
// - Production validity is exactly 365 days.
//
// DEMO:
// - Duration is NOT hardcoded.
// - Control Center supplies validFrom + validUntil.
// - May be 2, 7, 10 days or any approved interval.
// - Expiry must not depend on manual deletion.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  OwnerId,
  BusinessId,
  BranchId,
} from "../business/business.identity.types";

import type {
  FinoraEntitlementUserId,
} from "./finoraStorageEntitlement.types";

// ============================================================
// ACCESS GRANT ID
// ============================================================

/**
 * Immutable identity of one FINORA commercial/demo access grant.
 */
export type FinoraBranchAccessGrantId =
  string;

// ============================================================
// ACCESS TYPE
// ============================================================

export type FinoraBranchAccessType =
  | "REGISTERED"
  | "DEMO";
export type FinoraBranchAccessStorageMode =
  | "LOCAL"
  | "USB";

// ============================================================
// ACCESS STATUS
// ============================================================

/**
 * Persisted administrative lifecycle.
 *
 * Expiry is deliberately NOT represented as a mutable persisted
 * status. EXPIRED is derived from validUntil at evaluation time.
 *
 * ACTIVE:
 * Grant may be used while inside its validity window.
 *
 * SUSPENDED:
 * Temporarily blocked by FINORA administration.
 *
 * REVOKED:
 * Permanently blocked and must not become active again.
 */
export type FinoraBranchAccessAdministrativeStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

// ============================================================
// VALIDITY WINDOW
// ============================================================

/**
 * Authoritative access window.
 *
 * Must use real system/trusted timestamps.
 *
 * FINORA Business Date MUST NOT influence this window.
 */
export interface FinoraBranchAccessValidity {

  validFrom:
    string;

  validUntil:
    string;
}

// ============================================================
// DEMO ID
// ============================================================

/**
 * Human/control-plane identity of one Demo access grant.
 *
 * Example:
 * FINORA-DEMO-000001
 */
export type FinoraDemoId =
  string;

// ============================================================
// COMMERCIAL PAYMENT
// ============================================================

export type FinoraRegistrationPaymentMode =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "OTHER";

/**
 * Registration payment evidence.
 *
 * Monetary policy itself belongs to the Control Center /
 * commercial-policy domain.
 */
export interface FinoraRegistrationPayment {

  amount:
    number;

  currency:
    string;

  paymentMode:
    FinoraRegistrationPaymentMode;

  paidAt:
    string;

  reference?:
    string;

  remarks?:
    string;

  /**
   * FINORA annual registration payment is non-refundable.
   */
  refundable:
    false;
}

// ============================================================
// BASE ACCESS GRANT
// ============================================================

interface FinoraBranchAccessGrantBase {

  grantId:
    FinoraBranchAccessGrantId;

  userId:
    FinoraEntitlementUserId;

  ownerId:
    OwnerId;

  businessId:
    BusinessId;

  branchId:
    BranchId;


  storageMode:
    FinoraBranchAccessStorageMode;
administrativeStatus:
    FinoraBranchAccessAdministrativeStatus;

  validity:
    FinoraBranchAccessValidity;

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// REGISTERED ACCESS
// ============================================================

export interface FinoraRegisteredBranchAccessGrant
  extends FinoraBranchAccessGrantBase {

  accessType:
    "REGISTERED";

  /**
   * Commercial registration payment recorded by FINORA
   * administration.
   */
  registrationPayment:
    FinoraRegistrationPayment;

  /**
   * Sequential renewal cycle.
   *
   * Initial registration = 1
   * First renewal        = 2
   * Second renewal       = 3
   */
  registrationCycle:
    number;
}

// ============================================================
// DEMO ACCESS
// ============================================================

export interface FinoraDemoBranchAccessGrant
  extends FinoraBranchAccessGrantBase {

  accessType:
    "DEMO";

  demoId:
    FinoraDemoId;

  /**
   * Optional administrator note describing the trial.
   */
  demoRemarks?:
    string;
}

// ============================================================
// CANONICAL ACCESS GRANT
// ============================================================

export type FinoraBranchAccessGrant =
  | FinoraRegisteredBranchAccessGrant
  | FinoraDemoBranchAccessGrant;

// ============================================================
// DERIVED ACCESS STATE
// ============================================================

/**
 * Runtime result derived from:
 *
 * - administrativeStatus
 * - validFrom
 * - validUntil
 * - trusted/current system time
 *
 * EXPIRED is therefore automatic and requires no administrator
 * deletion action.
 */
export type FinoraBranchAccessRuntimeState =
  | "ACTIVE"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "SUSPENDED"
  | "REVOKED"
  | "MISSING"
  | "INVALID";

// ============================================================
// ACCESS DECISION
// ============================================================

export interface FinoraBranchAccessAllowedDecision {

  allowed:
    true;

  state:
    "ACTIVE";

  grant:
    FinoraBranchAccessGrant;
}

export interface FinoraBranchAccessDeniedDecision {

  allowed:
    false;

  state:
    Exclude<
      FinoraBranchAccessRuntimeState,
      "ACTIVE"
    >;

  reason:
    string;

  grant?:
    FinoraBranchAccessGrant;
}

export type FinoraBranchAccessDecision =
  | FinoraBranchAccessAllowedDecision
  | FinoraBranchAccessDeniedDecision;

// ============================================================
// WRITE CAPABILITIES
// ============================================================

/**
 * Revenue-producing operations gated by valid FINORA access.
 *
 * Read-only historical/reporting access may remain available
 * under separate application policy.
 */
export type FinoraCommercialWriteCapability =
  | "CREATE_CUSTOMER"
  | "DISBURSE_LOAN"
  | "POST_COLLECTION";

// ============================================================
// END
// ============================================================