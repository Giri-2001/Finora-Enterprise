// ============================================================
// FINORA ENTERPRISE OS™
//
// USB STORAGE
// REAL / DEMO RESET SCOPE POLICY
//
// RESPONSIBILITY:
//
// - Define the logical FINORA USB reset scope.
// - Validate reset scope independently from Electron IPC.
// - Match persisted record identity against a validated scope.
// - Keep REAL and DEMO reset boundaries deterministic.
//
// IMPORTANT:
//
// - Pure policy only.
// - No Electron dependency.
// - No filesystem access.
// - No USB discovery.
// - No renderer dependency.
// - No mutation.
// - No filesystem path / drive authority.
//
// RESET RULES:
//
// REAL:
// - ownerId is mandatory.
// - demoId must be absent.
// - Only records for that owner with no demoId match.
//
// DEMO:
// - demoId is mandatory.
// - ownerId is optional.
// - When ownerId is supplied it further narrows the match.
//
// ============================================================

export type FinoraUsbResetDataContext =
  | "REAL"
  | "DEMO";

export interface FinoraUsbResetScope {
  dataContext:
    FinoraUsbResetDataContext;

  ownerId?: string;

  demoId?: string;
}

export interface FinoraUsbResetRecordScope {
  ownerId?: string;

  demoId?: string;
}

// ============================================================
// RESET SCOPE VALIDATION
// ============================================================

export function validateFinoraUsbResetScope(
  scope: unknown,
): string | null {
  if (
    typeof scope !== "object" ||
    scope === null ||
    Array.isArray(scope)
  ) {
    return "FINORA reset scope is required.";
  }

  const candidate =
    scope as {
      dataContext?: unknown;

      ownerId?: unknown;

      demoId?: unknown;
    };

  if (candidate.dataContext === "REAL") {
    if (
      typeof candidate.ownerId !== "string" ||
      candidate.ownerId.trim().length === 0
    ) {
      return "A valid owner ID is required to reset REAL FINORA USB data.";
    }

    if (candidate.demoId !== undefined) {
      return "REAL FINORA USB reset scope must not include a Demo ID.";
    }

    return null;
  }

  if (candidate.dataContext === "DEMO") {
    if (
      typeof candidate.demoId !== "string" ||
      candidate.demoId.trim().length === 0
    ) {
      return "A valid Demo ID is required to reset DEMO FINORA USB data.";
    }

    if (
      candidate.ownerId !== undefined &&
      (
        typeof candidate.ownerId !== "string" ||
        candidate.ownerId.trim().length === 0
      )
    ) {
      return "FINORA DEMO USB reset owner ID must be a non-empty string when supplied.";
    }

    return null;
  }

  return "Unsupported FINORA data context for USB reset.";
}

// ============================================================
// RESET SCOPE RECORD MATCHING
// ============================================================

export function recordMatchesFinoraUsbResetScope(
  record:
    FinoraUsbResetRecordScope,

  scope:
    FinoraUsbResetScope,
): boolean {
  if (scope.dataContext === "REAL") {
    return (
      record.ownerId === scope.ownerId &&
      record.demoId === undefined
    );
  }

  if (scope.dataContext === "DEMO") {
    if (record.demoId !== scope.demoId) {
      return false;
    }

    if (
      scope.ownerId !== undefined &&
      record.ownerId !== scope.ownerId
    ) {
      return false;
    }

    return true;
  }

  return false;
}

// ============================================================
// END
// ============================================================