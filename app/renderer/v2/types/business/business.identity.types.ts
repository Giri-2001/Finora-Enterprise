// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS IDENTITY TYPES
//
// RESPONSIBILITY:
//
// - Define the canonical FINORA business identity contract
// - Separate Owner / Business / Branch identities
// - Provide the identity context required by V2 services
// - Keep business identity independent from UI and storage
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No localStorage.
// - No filesystem.
// - No Electron IPC.
// - No business settings logic.
// - No authentication logic.
// - No storage logic.
//
// IDENTITY RULE:
//
// ownerId    != businessId
// businessId != branchId
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// BUSINESS IDENTIFIER
// ============================================================

/**
 * Unique FINORA owner / tenant identifier.
 *
 * The owner represents the account or ownership boundary
 * under which business data is isolated.
 *
 * Example:
 * OWNER-000001
 */
export type OwnerId = string;

// ============================================================
// BUSINESS ID
// ============================================================

/**
 * Unique FINORA business identifier.
 *
 * A business belongs to an owner.
 *
 * Example:
 * FINORA-HYD-01
 */
export type BusinessId = string;

// ============================================================
// BRANCH ID
// ============================================================

/**
 * Unique branch identifier inside a FINORA business.
 *
 * Example:
 * BR-001
 */
export type BranchId = string;

// ============================================================
// BUSINESS IDENTITY
// ============================================================

/**
 * Canonical identity of the active FINORA business.
 *
 * This contract contains identity information only.
 *
 * Operational settings such as:
 *
 * - address
 * - phone
 * - email
 * - GST / Tax ID
 * - currency
 *
 * belong to the Business Settings layer and should not be
 * mixed into this identity contract.
 */
export interface BusinessIdentity {

  /**
   * Owner / tenant identifier.
   */
  ownerId: OwnerId;

  /**
   * FINORA business identifier.
   */
  businessId: BusinessId;

  /**
   * Registered business name.
   */
  businessName: string;

  /**
   * Active branch identifier.
   */
  branchId: BranchId;

  /**
   * Active branch name.
   */
  branchName: string;

  /**
   * Business identity creation timestamp.
   */
  createdAt: string;

  /**
   * Last identity update timestamp.
   */
  updatedAt: string;
}
