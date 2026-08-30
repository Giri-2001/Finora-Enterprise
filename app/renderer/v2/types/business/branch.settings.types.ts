// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BRANCH SETTINGS TYPES
//
// RESPONSIBILITY:
//
// - Define the persisted Branch Settings contract
// - Keep active branch identity separate from branch settings
// - Scope branch operational settings by businessId + branchId
// - Provide a stable typed model for Branch persistence
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No localStorage.
// - No filesystem.
// - No Electron IPC.
// - No UI logic.
// - No authentication logic.
// - No storage logic.
// - No business calculations.
//
// BRANCH IDENTITY REMAINS IN:
//
// BusinessIdentity
// - businessId
// - branchId
// - branchName
//
// BRANCH SETTINGS:
//
// - address
// - phone
// - email
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BranchId,
  BusinessId,
} from "./business.identity.types";

// ============================================================
// BRANCH SETTINGS
// ============================================================

/**
 * Operational settings belonging to one FINORA branch.
 *
 * The active branch identity remains in BusinessIdentity.
 *
 * This contract stores only branch-specific operational
 * settings and is logically identified by:
 *
 * businessId + branchId
 */
export interface BranchSettings {

  /**
   * FINORA business identifier owning this branch.
   */
  businessId: BusinessId;

  /**
   * FINORA branch identifier.
   */
  branchId: BranchId;

  /**
   * Branch operating address.
   */
  address: string;

  /**
   * Primary branch phone number.
   */
  phone: string;

  /**
   * Primary branch email address.
   */
  email: string;

  /**
   * Branch / shop identification photos.
   *
   * Intended UI limit:
   * - Maximum 3 photos.
   *
   * Examples:
   * - Shop / office exterior
   * - Shop / office interior
   * - Counter / working area
   *
   * Photo payload/storage handling belongs to the
   * service/storage layer.
   */
  officePhotos: string[];

  /**
   * Settings creation timestamp.
   */
  createdAt: string;

  /**
   * Last settings update timestamp.
   */
  updatedAt: string;
}

// ============================================================
// END
// ============================================================
