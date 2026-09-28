// ============================================================
// FINORA ENTERPRISE
// CONTROL CENTER PORTABLE STATE CONTRACT
//
// Purpose:
// - Move authoritative Developer Control Center operational
//   state between supported Windows and Android devices.
// - Keep signing-authority recovery separate.
// - Preserve replay/high-water continuity.
// - Reject stale state generations.
//
// Security boundaries:
// - NO signing private key.
// - NO Admin Recovery Security Code.
// - NO Developer Security Code.
// - NO password/verifier material.
// - NO device-bound AndroidKeyStore / safeStorage ciphertext.
//
// Transport encryption/signature are implemented separately.
// ============================================================

import type {
  FinoraControlCenterBranchRegistry,
} from "./finoraControlCenterBranchRegistry.types.js";

import type {
  FinoraControlCenterBranchDirectoryMetadataRecord,
} from "./finoraControlCenterBranchDirectoryMetadataStore.js";

import type {
  FinoraControlCenterWalletHistoryRecord,
} from "./finoraControlCenterWalletHistoryStore.js";

import type {
  FinoraControlCenterIncomePricingView,
} from "./finoraControlCenterIncomePricingStore.js";

import type {
  FinoraControlCenterBranchPricingView,
} from "./finoraControlCenterBranchPricingStore.js";

import type {
  FinoraControlCenterIssuancePurpose,
} from "./finoraControlCenterIssuanceLedger.js";

import type {
  FinoraControlCenterClockHighWaterState,
} from "./finoraControlCenterClockHighWaterStore.js";

export const FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT =
  "FINORA_CONTROL_CENTER_PORTABLE_STATE_V1" as const;

export const FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION =
  1 as const;

export interface FinoraControlCenterPortableStateBranchDirectoryMetadata {
  readonly records:
    readonly FinoraControlCenterBranchDirectoryMetadataRecord[];
}

export interface FinoraControlCenterPortableStateWalletHistory {
  readonly records:
    readonly FinoraControlCenterWalletHistoryRecord[];
}

export interface FinoraControlCenterPortableStateIncomePricing {
  readonly state:
    FinoraControlCenterIncomePricingView;
}

export interface FinoraControlCenterPortableStateBranchPricing {
  readonly records:
    readonly FinoraControlCenterBranchPricingView[];
}

/**
 * Exact authoritative sequence record used by the general
 * Control Center issuance ledger.
 *
 * installationId is security-significant here and must not be
 * collapsed into a generic scope string.
 */
export interface FinoraControlCenterPortableStateGeneralIssuanceSequenceRecord {
  readonly issuerId:
    string;

  readonly purpose:
    FinoraControlCenterIssuancePurpose;

  readonly ownerId:
    string;

  readonly businessId:
    string;

  readonly branchId:
    string;

  readonly installationId:
    string;

  readonly lastReservedSequence:
    number;

  readonly updatedAt:
    string;
}

/**
 * Portable branch-scoped sequence record.
 *
 * The exact purpose literal is validated by the corresponding
 * domain ledger during snapshot/import processing.
 */
export interface FinoraControlCenterPortableStatePortableIssuanceSequenceRecord {
  readonly issuerId:
    string;

  readonly purpose:
    string;

  readonly ownerId:
    string;

  readonly businessId:
    string;

  readonly branchId:
    string;

  readonly lastReservedSequence:
    number;

  readonly updatedAt:
    string;
}

export interface FinoraControlCenterPortableStateIssuanceLedgerSnapshot<
  TSequence,
> {
  readonly schemaVersion:
    1;

  readonly sequences:
    readonly TSequence[];

  readonly createdAt:
    string;

  readonly updatedAt:
    string;
}

export interface FinoraControlCenterPortableStateIssuanceAuthority {
  /**
   * null means the corresponding authoritative ledger does not
   * exist on the exporting Control Center.
   *
   * Export must not fabricate an empty persisted ledger.
   */
  readonly general:
    FinoraControlCenterPortableStateIssuanceLedgerSnapshot<
      FinoraControlCenterPortableStateGeneralIssuanceSequenceRecord
    > | null;

  readonly portableBranchAccess:
    FinoraControlCenterPortableStateIssuanceLedgerSnapshot<
      FinoraControlCenterPortableStatePortableIssuanceSequenceRecord
    > | null;

  readonly portableBusinessProfile:
    FinoraControlCenterPortableStateIssuanceLedgerSnapshot<
      FinoraControlCenterPortableStatePortableIssuanceSequenceRecord
    > | null;

  readonly portablePricingPolicy:
    FinoraControlCenterPortableStateIssuanceLedgerSnapshot<
      FinoraControlCenterPortableStatePortableIssuanceSequenceRecord
    > | null;

  readonly portableStorageEntitlement:
    FinoraControlCenterPortableStateIssuanceLedgerSnapshot<
      FinoraControlCenterPortableStatePortableIssuanceSequenceRecord
    > | null;
}

export interface FinoraControlCenterPortableStateClockAuthority {
  /**
   * Preserve the exact issuer-bound persisted clock authority.
   * null means no high-water store exists yet.
   */
  readonly state:
    FinoraControlCenterClockHighWaterState | null;
}
export interface FinoraControlCenterPortableStatePayload {
  readonly format:
    typeof FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT;

  readonly schemaVersion:
    typeof FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION;

  /**
   * Monotonic operational-state generation.
   *
   * Importers must reject a stateGeneration older than or equal
   * to an already-consumed generation unless the complete state
   * is byte-for-byte / digest-identical under the later import
   * contract.
   */
  readonly stateGeneration:
    number;

  /**
   * SHA-256 digest of the immediately preceding committed
   * Portable State payload in this local lineage.
   *
   * null is permitted only when creating the first local
   * lineage head.
   *
   * The digest is part of the signed payload so a receiver can
   * detect divergent siblings instead of silently overwriting
   * one branch with another.
   */
  readonly parentPayloadSha256:
    string | null;

  /**
   * Exact Control Center signing authority identity.
   *
   * This binds operational state to the already-restored signing
   * authority without embedding private-key material.
   */
  readonly issuerId:
    string;

  readonly signingKeyId:
    string;

  /**
   * Source-device informational metadata only.
   * It is NOT signing or authorization authority.
   */
  readonly exportedAt:
    string;

  readonly sourcePlatform:
    "WINDOWS" | "ANDROID";

  /**
   * Canonical operational domains.
   */
  readonly branchRegistry:
    FinoraControlCenterBranchRegistry | null;

  readonly branchDirectoryMetadata:
    FinoraControlCenterPortableStateBranchDirectoryMetadata;

  readonly walletHistory:
    FinoraControlCenterPortableStateWalletHistory;

  readonly incomePricing:
    FinoraControlCenterPortableStateIncomePricing;

  readonly branchPricing:
    FinoraControlCenterPortableStateBranchPricing;

  /**
   * Replay / sequence continuity is part of portable state.
   * Branch/history data must never move without the sequence
   * authority required to continue signing safely.
   */
  readonly issuanceAuthority:
    FinoraControlCenterPortableStateIssuanceAuthority;

  readonly clockAuthority:
    FinoraControlCenterPortableStateClockAuthority;
}

export interface FinoraControlCenterPortableStateEnvelope {
  readonly format:
    typeof FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT;

  readonly schemaVersion:
    typeof FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION;

  readonly payload:
    FinoraControlCenterPortableStatePayload;

  /**
   * SHA-256 digest of canonical payload bytes.
   * Exact canonicalization/signature rules are defined by the
   * transport implementation step, not by renderer code.
   */
  readonly payloadSha256:
    string;

  /**
   * Detached Control Center authority signature over canonical
   * payload bytes.
   */
  readonly signatureBase64:
    string;
}