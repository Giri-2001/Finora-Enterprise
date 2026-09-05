// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS OWNER PROFILE TYPES
//
// RESPONSIBILITY:
//
// - Define persisted Business Owner profile information
// - Link the profile to the existing authentication User
// - Keep authentication credentials outside this contract
// - Keep owner profile information separate from signed business identity authority
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No password.
// - No username duplication.
// - No localStorage.
// - No filesystem.
// - No Electron IPC.
// - No UI logic.
// - No authentication logic.
// - No storage logic.
//
// AUTHENTICATION:
//
// Existing FINORA User remains authoritative for:
//
// - userId
// - username
// - password
// - fullName
// - role
// - status
//
// OWNER PROFILE:
//
// - phone
// - email
// - owner photos
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BranchId,
  BusinessId,
  OwnerId,
} from "./business.scope.types";

// ============================================================
// BUSINESS OWNER PROFILE
// ============================================================

/**
 * Operational profile belonging to a FINORA Business Owner.
 *
 * Authentication identity is referenced by userId and is not
 * duplicated inside this profile.
 */
export interface BusinessOwnerProfile {

  /**
   * Existing FINORA authentication User ID.
   */
  userId: string;

  /**
   * FINORA owner / tenant identifier.
   */
  ownerId: OwnerId;

  /**
   * FINORA business identifier.
   */
  businessId: BusinessId;

  /**
   * FINORA branch identifier currently assigned to this owner.
   */
  branchId: BranchId;

  /**
   * Primary owner contact phone number.
   */
  phone: string;

  /**
   * Primary owner contact email address.
   */
  email: string;

  /**
   * Business Owner identification photos.
   *
   * Intended UI limit:
   * - Maximum 2 photos.
   *
   * Photo payload/storage handling belongs to the
   * service/storage layer.
   */
  ownerPhotos: string[];

  /**
   * Profile creation timestamp.
   */
  createdAt: string;

  /**
   * Last profile update timestamp.
   */
  updatedAt: string;
}

// ============================================================
// END
// ============================================================
