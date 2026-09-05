// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// FINORA BRANCH ACTIVATION TYPES
//
// RESPONSIBILITY:
//
// - Define the canonical FINORA branch activation contract
// - Represent first-time FINORA branch provisioning status
// - Link activation to Owner / Business / Branch identity
// - Keep branch activation independent from storage entitlements
// - Keep branch activation independent from wallet and pricing
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No localStorage.
// - No StorageManager access.
// - No filesystem.
// - No Electron IPC.
// - No React / UI logic.
// - No authentication logic.
// - No storage entitlement logic.
// - No wallet calculations.
// - No pricing calculations.
// - No customer data.
// - No loan data.
// - No collection data.
// - No Gold custody data.
//
// COMMERCIAL MODEL:
//
// LOCAL and USB are activated separately per eligible login/user.
//
// Their activation charges belong to the Storage Entitlement /
// Billing domain and MUST NOT be stored in this branch activation
// identity contract.
//
// VERSION : 1.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  OwnerId,
  BusinessId,
  BranchId,
} from "../business/business.scope.types";

// ============================================================
// ACTIVATION ID
// ============================================================

/**
 * Immutable FINORA branch activation identifier.
 */
export type FinoraActivationId = string;

// ============================================================
// ACTIVATION STATUS
// ============================================================

/**
 * Lifecycle state of a FINORA branch registration.
 *
 * PENDING:
 * Provisioning has started but the branch is not ready.
 *
 * ACTIVE:
 * Branch registration is valid and FINORA may be used subject
 * to authentication, licence and storage entitlements.
 *
 * SUSPENDED:
 * Branch registration is temporarily restricted.
 *
 * DEACTIVATED:
 * Branch registration is permanently inactive.
 */
export type FinoraActivationStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

// ============================================================
// FINORA BRANCH ACTIVATION
// ============================================================

/**
 * Canonical branch-level FINORA activation contract.
 *
 * IMPORTANT:
 *
 * - ownerId identifies the tenant boundary.
 * - businessId identifies the FINORA business.
 * - branchId identifies the registered branch.
 * - activationId identifies this branch activation.
 *
 * Storage access is intentionally NOT defined here.
 *
 * A user/login may independently own:
 *
 * - LOCAL entitlement
 * - USB entitlement
 * - both entitlements
 *
 * Those permissions belong to the separate Storage Entitlement
 * domain.
 */
export interface FinoraActivation {

  /**
   * Immutable FINORA activation identifier.
   */
  activationId: FinoraActivationId;

  /**
   * FINORA owner / tenant identifier.
   */
  ownerId: OwnerId;

  /**
   * FINORA business identifier.
   */
  businessId: BusinessId;

  /**
   * FINORA branch identifier.
   */
  branchId: BranchId;

  /**
   * Current branch activation lifecycle status.
   */
  status: FinoraActivationStatus;

  /**
   * Activation completion timestamp.
   *
   * Undefined while provisioning remains pending.
   */
  activatedAt?: string;

  /**
   * Activation record creation timestamp.
   */
  createdAt: string;

  /**
   * Last activation record update timestamp.
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
