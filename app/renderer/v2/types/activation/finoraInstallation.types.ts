// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// FINORA INSTALLATION IDENTITY TYPES
//
// RESPONSIBILITY:
//
// - Identify one FINORA application installation
// - Bind that installation to its registered Owner / Business / Branch
// - Provide the identity required by the pre-login activation gate
// - Keep login/user storage entitlements separate
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No authentication logic.
// - No storage entitlement logic.
// - No pricing.
// - No wallet.
// - No customer / loan / collection / Gold data.
// - installationId is an internal immutable identifier.
//
// STARTUP PURPOSE:
//
// App Start
//   -> Installation Identity
//   -> Branch Activation
//   -> Login
//
// VERSION : 1.1
// STATUS  : Production Foundation
// ============================================================

import type {
  OwnerId,
  BusinessId,
  BranchId,
} from "../business/business.identity.types";

// ============================================================
// INSTALLATION ID
// ============================================================

/**
 * Immutable identity of one FINORA application installation.
 */
export type FinoraInstallationId = string;

// ============================================================
// INSTALLATION IDENTITY
// ============================================================

/**
 * Canonical binding between this FINORA installation and the
 * branch for which it was provisioned.
 *
 * This is NOT a user/login identity.
 *
 * Multiple FINORA users may authenticate against the same
 * installation while owning different LOCAL / USB entitlements.
 */
export interface FinoraInstallationIdentity {

  /**
   * Immutable FINORA installation identifier.
   */
  installationId: FinoraInstallationId;

  /**
   * Owner / tenant to which this installation belongs.
   */
  ownerId: OwnerId;

  /**
   * Registered FINORA business.
   */
  businessId: BusinessId;

  /**
   * Branch bound to this installation.
   */
  branchId: BranchId;

  /**
   * Immutable FINORA-assigned business numbering code.
   *
   * Examples: RGG, RCL.
   *
   * Optional only for legacy schemaVersion 1 installations that
   * were provisioned before numbering codes were introduced.
   * New provisioning must supply businessCode and branchCode
   * together.
   */
  businessCode?: string;

  /**
   * Immutable FINORA-assigned branch numbering code.
   *
   * Examples: BR1, BR3.
   *
   * Optional only for legacy schemaVersion 1 installations that
   * were provisioned before numbering codes were introduced.
   * New provisioning must supply businessCode and branchCode
   * together.
   */
  branchCode?: string;

  /**
   * Installation provisioning timestamp.
   */
  createdAt: string;

  /**
   * Last metadata update timestamp.
   *
   * Identity fields themselves remain immutable.
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
