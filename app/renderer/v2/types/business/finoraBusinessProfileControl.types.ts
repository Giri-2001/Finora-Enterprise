// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// SIGNED BUSINESS PROFILE CONTROL TYPES
//
// RESPONSIBILITY:
//
// - Define the canonical BUSINESS_PROFILE payload
// - Carry FINORA-controlled Business / Branch identity
// - Bind the profile to one native installation
// - Support initial ISSUE and authoritative REPLACE
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No signing.
// - No private keys.
// - No persistence.
// - No renderer mutation authority.
// - No Business Date.
// - No operational Business / Branch settings.
//
// CONTROL CENTER AUTHORITY:
//
// - ownerId
// - businessId
// - branchId
// - businessCode
// - branchCode
// - businessName
// - branchName
//
// Operational address/contact/currency/time-zone/photo settings
// remain outside this signed identity profile.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  OwnerId,
  BusinessId,
  BranchId,
} from "./business.scope.types";

import type {
  FinoraInstallationBindingTarget,
} from "../activation/finoraInstallationBinding.types";

// ============================================================
// CONTROL PURPOSE
// ============================================================

export const FINORA_BUSINESS_PROFILE_CONTROL_PURPOSE =
  "BUSINESS_PROFILE" as const;

// ============================================================
// PAYLOAD VERSION
// ============================================================

export const FINORA_BUSINESS_PROFILE_PAYLOAD_VERSION =
  1 as const;

// ============================================================
// PROFILE VERSION
// ============================================================

export const FINORA_PROVISIONED_BUSINESS_PROFILE_VERSION =
  1 as const;

// ============================================================
// ACTION
// ============================================================

/**
 * ISSUE:
 * Initial authoritative Business / Branch profile provisioning.
 *
 * REPLACE:
 * Signed replacement of mutable display metadata.
 *
 * Immutable identity transitions are rejected later by the
 * trusted package-apply boundary.
 */
export type FinoraBusinessProfileControlAction =
  | "ISSUE"
  | "REPLACE";

// ============================================================
// PROVISIONED BUSINESS PROFILE
// ============================================================

/**
 * Canonical FINORA-controlled Business / Branch identity.
 *
 * This record intentionally excludes operational settings:
 *
 * - address
 * - phone
 * - email
 * - GST / Tax ID
 * - currency
 * - timeZone
 * - office photos
 */
export interface FinoraProvisionedBusinessProfileV1 {

  /**
   * Immutable identity of this provisioned profile lineage.
   */
  profileId:
    string;

  ownerId:
    OwnerId;

  businessId:
    BusinessId;

  branchId:
    BranchId;

  /**
   * Immutable FINORA-assigned business numbering code.
   */
  businessCode:
    string;

  /**
   * Immutable FINORA-assigned branch numbering code.
   */
  branchCode:
    string;

  /**
   * Registered / display business name controlled by FINORA.
   */
  businessName:
    string;

  /**
   * Registered / display active branch name controlled by FINORA.
   */
  branchName:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}

export type FinoraProvisionedBusinessProfile =
  FinoraProvisionedBusinessProfileV1;

// ============================================================
// SIGNED PAYLOAD
// ============================================================

/**
 * Canonical domain payload carried by a signed Control Package
 * whose purpose is BUSINESS_PROFILE.
 *
 * The generic Control Package target must independently match:
 *
 * - ownerId
 * - businessId
 * - branchId
 * - installation binding
 *
 * before this payload can be accepted by a trusted client.
 */
export interface FinoraBusinessProfileControlPayloadV1 {

  action:
    FinoraBusinessProfileControlAction;

  profile:
    FinoraProvisionedBusinessProfileV1;

  installationBinding:
    FinoraInstallationBindingTarget;

  /**
   * Control Center issuance timestamp for this domain payload.
   */
  issuedAt:
    string;

  schemaVersion:
    1;
}

export type FinoraBusinessProfileControlPayload =
  FinoraBusinessProfileControlPayloadV1;

// ============================================================
// END
// ============================================================