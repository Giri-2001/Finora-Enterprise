// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH USB REPLACEMENT LIFECYCLE
// PHASE : 5.6M-1D1
// ============================================================
//
// This contract states the security truth of ordinary readable
// OLD USB -> NEW USB replacement.
//
// IMPORTANT:
//
// - Replacement preserves the exact encrypted Portable Auth.
// - Branch Certification private authority is not regenerated.
// - authGeneration is not changed by media replacement.
// - Source USB is intentionally not mutated.
// - A crash after target commit is recovered by idempotent retry.
// - Successful replacement does NOT cryptographically revoke
//   the OLD USB or any pre-existing byte-for-byte clone.
// - Physical retirement / secure erase of OLD USB is required.
// - Lost/unreadable OLD USB belongs to Backup + Restore.
//
// ============================================================

export const
FINORA_USB_REPLACEMENT_LIFECYCLE_SCHEMA_VERSION =
  1 as const;

export type FinoraUsbReplacementTargetState =
  "EXACT_VERIFIED_COPY";

export type FinoraUsbReplacementCrashRecoveryModel =
  "IDEMPOTENT_RETRY";

export type FinoraUsbReplacementSourceState =
  "UNCHANGED_AND_STILL_VALID";

export type FinoraUsbReplacementSourceRetirementMode =
  "PHYSICAL_RETIREMENT_REQUIRED";

export type FinoraUsbReplacementOfflineCloneRevocation =
  "NOT_AVAILABLE";

export type FinoraUsbReplacementAuthGenerationPolicy =
  "UNCHANGED";

export type FinoraUsbReplacementLostSourceRecovery =
  "BACKUP_RESTORE_REQUIRED";

export interface FinoraPortableBranchAuthUsbReplacementLifecycleV1 {
  schemaVersion:
    typeof FINORA_USB_REPLACEMENT_LIFECYCLE_SCHEMA_VERSION;

  targetState:
    FinoraUsbReplacementTargetState;

  crashRecovery:
    FinoraUsbReplacementCrashRecoveryModel;

  crashJournalRequired:
    false;

  sourceState:
    FinoraUsbReplacementSourceState;

  sourceRetirement:
    FinoraUsbReplacementSourceRetirementMode;

  offlinePreexistingCloneRevocation:
    FinoraUsbReplacementOfflineCloneRevocation;

  authGeneration:
    FinoraUsbReplacementAuthGenerationPolicy;

  lostOrUnreadableSource:
    FinoraUsbReplacementLostSourceRecovery;
}

const LIFECYCLE:
  Readonly<
    FinoraPortableBranchAuthUsbReplacementLifecycleV1
  > =
    Object.freeze({
      schemaVersion:
        FINORA_USB_REPLACEMENT_LIFECYCLE_SCHEMA_VERSION,

      targetState:
        "EXACT_VERIFIED_COPY",

      crashRecovery:
        "IDEMPOTENT_RETRY",

      crashJournalRequired:
        false,

      sourceState:
        "UNCHANGED_AND_STILL_VALID",

      sourceRetirement:
        "PHYSICAL_RETIREMENT_REQUIRED",

      offlinePreexistingCloneRevocation:
        "NOT_AVAILABLE",

      authGeneration:
        "UNCHANGED",

      lostOrUnreadableSource:
        "BACKUP_RESTORE_REQUIRED",
    });

export function getFinoraPortableBranchAuthUsbReplacementLifecycleV1():
  Readonly<
    FinoraPortableBranchAuthUsbReplacementLifecycleV1
  > {
  return LIFECYCLE;
}