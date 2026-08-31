// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS SETTINGS TYPES
//
// RESPONSIBILITY:
//
// - Define the persisted Business Settings contract
// - Keep operational business settings separate from identity
// - Provide a stable typed model for BusinessRepository
// - Prepare Business Settings for LOCAL / USB / CLOUD storage
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
// BUSINESS IDENTITY IS KEPT SEPARATE:
//
// BusinessIdentity
// - ownerId
// - businessId
// - businessName
// - branchId
// - branchName
//
// BUSINESS SETTINGS:
//
// - address
// - phone
// - email
// - gst
// - currency
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  BusinessId,
} from "./business.identity.types";

// ============================================================
// BUSINESS SETTINGS
// ============================================================

/**
 * Operational settings belonging to a FINORA business.
 *
 * Business identity and operational settings are deliberately
 * separated so future business-domain modules can evolve
 * independently without changing the identity contract.
 */
export interface BusinessSettings {

  /**
   * FINORA business identifier.
   *
   * This links the settings record to the business identity.
   */
  businessId: BusinessId;

  /**
   * Business address.
   */
  address: string;

  /**
   * Primary business phone number.
   */
  phone: string;

  /**
   * Primary business email address.
   */
  email: string;

  /**
   * GST / Tax identifier.
   *
   * Optional because not every business may have a
   * configured tax identifier.
   */
  gst?: string;

  /**
   * Currency used by the business.
   *
   * Current UI supports INR and USD.
   * Kept as string so future supported currencies
   * can be introduced without changing the storage
   * contract immediately.
   */
  currency: string;

  /**
   * IANA time-zone identifier used for business-local
   * scheduling and calendar calculations.
   *
   * Optional for backward compatibility with Business Settings
   * records created before time-zone support was introduced.
   *
   * Scheduler code must treat a missing or invalid value as
   * unavailable configuration rather than silently falling back
   * to the device time zone.
   *
   * Example:
   * Asia/Kolkata
   */
  timeZone?: string;

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
