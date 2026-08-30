// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// FINORA STORAGE ENTITLEMENT TYPES
//
// RESPONSIBILITY:
//
// - Define per-login FINORA storage access entitlement
// - Support independent LOCAL and USB activation
// - Link entitlement to Owner / Business / Branch / User
// - Keep commercial pricing outside this contract
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No authentication execution.
// - No StorageManager access.
// - No localStorage.
// - No Electron IPC.
// - No filesystem.
// - No wallet calculations.
// - No pricing calculations.
// - No customer / loan / collection / Gold data.
//
// COMMERCIAL RULE:
//
// LOCAL and USB are independently activated.
//
// Example:
//
// User A:
//   LOCAL = ACTIVE
//   USB   = NOT ACTIVATED
//
// User B:
//   LOCAL = NOT ACTIVATED
//   USB   = ACTIVE
//
// A user may later own both entitlements.
//
// The current commercial price may be 2,000 per mode,
// but monetary values MUST NOT be hardcoded in this contract.
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

// ============================================================
// ENTITLEMENT ID
// ============================================================

/**
 * Immutable FINORA storage entitlement identifier.
 */
export type FinoraStorageEntitlementId = string;

// ============================================================
// USER ID
// ============================================================

/**
 * FINORA authenticated user/login identifier.
 *
 * Kept as a string contract so the entitlement domain remains
 * independent from the authentication implementation.
 */
export type FinoraEntitlementUserId = string;

// ============================================================
// STORAGE MODE
// ============================================================

/**
 * FINORA operational storage modes that may be activated.
 *
 * CLOUD is intentionally excluded.
 */
export type FinoraEntitlementStorageMode =
  | "LOCAL"
  | "USB";

// ============================================================
// ENTITLEMENT STATUS
// ============================================================

/**
 * Lifecycle state of one storage entitlement.
 *
 * ACTIVE:
 * User may select and use this storage mode.
 *
 * SUSPENDED:
 * Entitlement exists but access is temporarily blocked.
 *
 * REVOKED:
 * Entitlement is no longer valid.
 */
export type FinoraStorageEntitlementStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

// ============================================================
// STORAGE ENTITLEMENT
// ============================================================

/**
 * Canonical per-user storage entitlement.
 *
 * One logical entitlement exists for:
 *
 * userId + ownerId + businessId + branchId + storageMode
 *
 * LOCAL and USB therefore remain independent.
 */
export interface FinoraStorageEntitlement {

  /**
   * Immutable entitlement identifier.
   */
  entitlementId: FinoraStorageEntitlementId;

  /**
   * Authenticated FINORA user/login receiving access.
   */
  userId: FinoraEntitlementUserId;

  /**
   * FINORA owner / tenant boundary.
   */
  ownerId: OwnerId;

  /**
   * FINORA business identifier.
   */
  businessId: BusinessId;

  /**
   * Branch for which this entitlement is valid.
   */
  branchId: BranchId;

  /**
   * Independently activated storage mode.
   */
  storageMode: FinoraEntitlementStorageMode;

  /**
   * Current entitlement lifecycle state.
   */
  status: FinoraStorageEntitlementStatus;

  /**
   * Timestamp when this storage entitlement became active.
   */
  activatedAt: string;

  /**
   * Record creation timestamp.
   */
  createdAt: string;

  /**
   * Last record update timestamp.
   */
  updatedAt: string;

  /**
   * Schema version for future migrations.
   */
  schemaVersion: 1;
}

// ============================================================
// END
// ============================================================
