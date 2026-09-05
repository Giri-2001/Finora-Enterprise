// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL
// CONTROL PACKAGE REPLAY / SEQUENCE POLICY
//
// RESPONSIBILITY:
//
// - Detect previously-applied package IDs
// - Enforce monotonic Control Package sequence
// - Keep sequence scoped to one issuer / purpose / target
//
// IMPORTANT:
//
// - PURE DOMAIN LOGIC.
// - No Electron.
// - No filesystem.
// - No signing.
// - No private key.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

export interface FinoraControlAppliedPackageRecord {

  packageId:
    string;

  issuerId:
    string;

  purpose:
    string;

  sequence:
    number;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  appliedAt:
    string;
}

export interface FinoraControlSequenceStateRecord {

  issuerId:
    string;

  purpose:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  lastSequence:
    number;

  updatedAt:
    string;
}

export interface FinoraControlReplayEvaluationInput {

  packageId:
    string;

  issuerId:
    string;

  purpose:
    string;

  sequence:
    number;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;
}

export type FinoraControlReplayDecision =
  | {
      accepted: true;
      previousSequence?: number;
    }
  | {
      accepted: false;
      reason:
        | "REPLAYED_PACKAGE"
        | "STALE_SEQUENCE";
      error: string;
      previousSequence?: number;
    };

function sameSequenceScope(
  state:
    FinoraControlSequenceStateRecord,

  input:
    FinoraControlReplayEvaluationInput,
): boolean {

  return (
    state.issuerId ===
      input.issuerId &&
    state.purpose ===
      input.purpose &&
    state.ownerId ===
      input.ownerId &&
    state.businessId ===
      input.businessId &&
    state.branchId ===
      input.branchId &&
    state.installationId ===
      input.installationId
  );
}

export function evaluateFinoraControlReplay(
  input:
    FinoraControlReplayEvaluationInput,

  appliedPackages:
    readonly FinoraControlAppliedPackageRecord[],

  sequenceStates:
    readonly FinoraControlSequenceStateRecord[],
): FinoraControlReplayDecision {

  const replayed =
    appliedPackages.some(
      (record) =>
        record.packageId ===
          input.packageId,
    );

  if (replayed) {
    return {
      accepted:
        false,

      reason:
        "REPLAYED_PACKAGE",

      error:
        "FINORA Control Package has already been applied.",
    };
  }

  const currentSequence =
    sequenceStates.find(
      (state) =>
        sameSequenceScope(
          state,
          input,
        ),
    );

  if (
    currentSequence &&
    input.sequence <=
      currentSequence.lastSequence
  ) {
    return {
      accepted:
        false,

      reason:
        "STALE_SEQUENCE",

      error:
        "FINORA Control Package sequence is stale.",

      previousSequence:
        currentSequence.lastSequence,
    };
  }

  return {
    accepted:
      true,

    previousSequence:
      currentSequence?.lastSequence,
  };
}

// ============================================================
// END
// ============================================================