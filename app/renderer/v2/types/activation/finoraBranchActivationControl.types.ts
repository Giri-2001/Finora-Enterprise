// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// SIGNED BRANCH ACTIVATION CONTROL TYPES
//
// RESPONSIBILITY:
//
// - Define BRANCH_ACTIVATION Control Package payload
// - Carry REGISTERED or DEMO access grant
// - Bind activation to one FINORA installation
// - Preserve authoritative Owner / Business / Branch identity
// - Support initial issue and annual renewal
//
// IMPORTANT:
//
// - TYPES ONLY.
// - Payload is signed by FINORA Control Center.
// - No private keys.
// - No signing implementation.
// - No persistence.
// - No login execution.
// - No Business Date.
// - No wallet.
// - No pricing.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraActivation,
} from "./finoraActivation.types";

import type {
  FinoraBranchAccessGrant,
} from "./finoraBranchAccess.types";

import type {
  FinoraInstallationId,
} from "./finoraInstallation.types";

// ============================================================
// PAYLOAD VERSION
// ============================================================

export const FINORA_BRANCH_ACTIVATION_PAYLOAD_VERSION =
  1 as const;

// ============================================================
// CONTROL ACTION
// ============================================================

/**
 * ISSUE:
 * Initial REGISTERED or DEMO access.
 *
 * RENEW:
 * New REGISTERED annual cycle.
 *
 * REPLACE:
 * Authoritative replacement of current access metadata.
 *
 * Administrative suspend/revoke lifecycle is introduced by
 * its owning Control Center lifecycle phase.
 */
export type FinoraBranchActivationControlAction =
  | "ISSUE"
  | "RENEW"
  | "REPLACE";

// ============================================================
// INSTALLATION BINDING
// ============================================================

export interface FinoraBranchActivationInstallationBinding {

  /**
   * Exact FINORA installation receiving this activation.
   */
  installationId:
    FinoraInstallationId;

  /**
   * Native installation possession-key identity.
   */
  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  /**
   * Lowercase SHA-256 fingerprint of the native SPKI public key.
   */
  publicKeyFingerprint:
    string;
}

// ============================================================
// PAYLOAD
// ============================================================

/**
 * Canonical signed payload carried by a Control Package whose
 * purpose is BRANCH_ACTIVATION.
 *
 * Identity invariants:
 *
 * activation.ownerId
 * accessGrant.ownerId
 * package.target.ownerId
 *
 * must match.
 *
 * The same rule applies to businessId and branchId.
 *
 * installationBinding.installationId must match the receiving
 * installation and package target whenever installation-bound.
 */
export interface FinoraBranchActivationControlPayloadV1 {

  action:
    FinoraBranchActivationControlAction;

  activation:
    FinoraActivation;

  accessGrant:
    FinoraBranchAccessGrant;

  installationBinding:
    FinoraBranchActivationInstallationBinding;

  /**
   * Control Center issuance audit timestamp for this domain
   * payload.
   */
  issuedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// CANONICAL PAYLOAD
// ============================================================

export type FinoraBranchActivationControlPayload =
  FinoraBranchActivationControlPayloadV1;

// ============================================================
// END
// ============================================================