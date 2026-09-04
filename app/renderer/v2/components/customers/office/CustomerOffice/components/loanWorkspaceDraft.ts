// ============================================================
// FINORA ENTERPRISE OS™
//
// LOAN WORKSPACE DRAFT
//
// RESPONSIBILITY:
//
// - Persist unfinished Loan Studio workflow snapshots.
// - Restore the most recently active Loan workflow.
// - Keep STANDARD and GOLD drafts isolated.
// - Preserve drafts across reload / app close / logout.
// - Clear drafts only through explicit workflow completion
//   boundaries such as Loan Create or Reject.
//
// IMPORTANT:
//
// - This is temporary workflow persistence.
// - This is NOT a persisted Loan master record.
// - No Loan business calculations belong here.
// - No Loan number reservation belongs here.
// - No Customer / Loan repository access belongs here.
// - Draft payload must remain JSON serializable.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   TYPES
============================================================ */

import { getSession } from "../../../../../store/authStore";

import type {
  LoanApplicationMode,
  LoanApplicationSnapshot,
  LoanApplicationStep,
} from "../../../../../types/loan-applications/rejectedLoanApplication.types";

export type LoanWorkspaceDraftMode =
  LoanApplicationMode;

export type LoanWorkspaceDraftStep =
  LoanApplicationStep;

export type LoanWorkspaceDraft =
  LoanApplicationSnapshot;

/* ============================================================
   STORAGE KEYS
============================================================ */

const DRAFT_STORAGE_PREFIX =
  "finora_loan_workspace_draft";

const ACTIVE_DRAFT_SUFFIX =
  "active";

const STANDARD_DRAFT_SUFFIX =
  "standard";

const GOLD_DRAFT_SUFFIX =
  "gold";
/* ============================================================
   STORAGE AVAILABILITY
============================================================ */

function canUseLocalStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/* ============================================================
   AUTHENTICATED DRAFT SCOPE

   Isolation boundary:
   - dataContext
   - demoId when applicable
   - ownerId
   - businessId
   - branchId
============================================================ */

function getDraftScopeKey(): string | null {
  const session =
    getSession();

  if (!session) {
    return null;
  }

  const ownerId =
    String(session.ownerId ?? "").trim();

  const businessId =
    String(session.businessId ?? "").trim();

  const branchId =
    String(session.branchId ?? "").trim();

  const dataContext =
    String(session.dataContext ?? "REAL")
      .trim()
      .toUpperCase();

  const demoId =
    String(session.demoId ?? "").trim();

  if (
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    return null;
  }

  return [
    dataContext,
    demoId || "NO_DEMO",
    ownerId,
    businessId,
    branchId,
  ]
    .map((value) =>
      encodeURIComponent(value),
    )
    .join(":");
}

function buildScopedDraftKey(
  suffix: string,
): string | null {
  const scope =
    getDraftScopeKey();

  if (!scope) {
    return null;
  }

  return [
    DRAFT_STORAGE_PREFIX,
    scope,
    suffix,
  ].join(":");
}
/* ============================================================
   KEY RESOLUTION
============================================================ */

function getDraftKey(
  mode: LoanWorkspaceDraftMode,
): string | null {
  return buildScopedDraftKey(
    mode === "GOLD"
      ? GOLD_DRAFT_SUFFIX
      : STANDARD_DRAFT_SUFFIX,
  );
}

function getActiveDraftKey(): string | null {
  return buildScopedDraftKey(
    ACTIVE_DRAFT_SUFFIX,
  );
}

/* ============================================================
   VALIDATION
============================================================ */

function isDraftStep(
  value: unknown,
): value is LoanWorkspaceDraftStep {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 6
  );
}

function isDraftMode(
  value: unknown,
): value is LoanWorkspaceDraftMode {
  return (
    value === "STANDARD" ||
    value === "GOLD"
  );
}

function parseDraft(
  raw: string | null,
): LoanWorkspaceDraft | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(raw) as Partial<LoanWorkspaceDraft>;

    if (
      parsed.version !== 1 ||
      !isDraftMode(parsed.mode) ||
      !isDraftStep(parsed.step) ||
      typeof parsed.savedAt !== "string" ||
      typeof parsed.payload !== "object" ||
      parsed.payload === null ||
      Array.isArray(parsed.payload)
    ) {
      return null;
    }

    return {
      version: 1,

      mode: parsed.mode,

      step: parsed.step,

      savedAt: parsed.savedAt,

      payload:
        parsed.payload as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

/* ============================================================
   SAVE
============================================================ */

export function saveLoanWorkspaceDraft(
  draft: LoanWorkspaceDraft,
): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    const draftKey =
      getDraftKey(draft.mode);

    const activeDraftKey =
      getActiveDraftKey();

    if (!draftKey || !activeDraftKey) {
      return false;
    }

    window.localStorage.setItem(
      draftKey,
      JSON.stringify(draft),
    );

    window.localStorage.setItem(
      activeDraftKey,
      draft.mode,
    );

    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   LOAD BY MODE
============================================================ */

export function loadLoanWorkspaceDraft(
  mode: LoanWorkspaceDraftMode,
): LoanWorkspaceDraft | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const draftKey =
      getDraftKey(mode);

    if (!draftKey) {
      return null;
    }

    return parseDraft(
      window.localStorage.getItem(
        draftKey,
      ),
    );
  } catch {
    return null;
  }
}

/* ============================================================
   LOAD ACTIVE
============================================================ */

export function loadActiveLoanWorkspaceDraft():
  LoanWorkspaceDraft | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const activeDraftKey =
      getActiveDraftKey();

    if (!activeDraftKey) {
      return null;
    }

    const activeMode =
      window.localStorage.getItem(
        activeDraftKey,
      );

    if (isDraftMode(activeMode)) {
      const activeDraft =
        loadLoanWorkspaceDraft(activeMode);

      if (activeDraft) {
        return activeDraft;
      }
    }

    const standardDraft =
      loadLoanWorkspaceDraft("STANDARD");

    const goldDraft =
      loadLoanWorkspaceDraft("GOLD");

    if (standardDraft && goldDraft) {
      const standardSavedAt =
        Date.parse(standardDraft.savedAt);

      const goldSavedAt =
        Date.parse(goldDraft.savedAt);

      return goldSavedAt > standardSavedAt
        ? goldDraft
        : standardDraft;
    }

    return standardDraft ?? goldDraft;
  } catch {
    return null;
  }
}

/* ============================================================
   CLEAR ONE MODE
============================================================ */

export function clearLoanWorkspaceDraft(
  mode: LoanWorkspaceDraftMode,
): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const draftKey =
      getDraftKey(mode);

    const activeDraftKey =
      getActiveDraftKey();

    if (!draftKey || !activeDraftKey) {
      return;
    }

    /*
     * Terminal cleanup is deliberately unconditional.
     *
     * The draft belongs to the current authenticated scope,
     * therefore both the mode snapshot and active marker must
     * be removed together. We do not depend on the marker value
     * matching the requested mode before deleting it.
     */
    window.localStorage.removeItem(
      draftKey,
    );

    window.localStorage.removeItem(
      activeDraftKey,
    );

    /*
     * Defensive verification.
     *
     * If either key still exists after removal, surface the
     * inconsistency in development diagnostics. Do not throw
     * because draft cleanup must never break the Loan workflow.
     */
    const remainingDraft =
      window.localStorage.getItem(
        draftKey,
      );

    const remainingActiveMarker =
      window.localStorage.getItem(
        activeDraftKey,
      );

    if (
      remainingDraft !== null ||
      remainingActiveMarker !== null
    ) {
      console.error(
        "FINORA LOAN DRAFT CLEANUP VERIFICATION FAILED",
        {
          mode,

          draftKey,

          activeDraftKey,

          remainingDraft,

          remainingActiveMarker,
        },
      );
    }
  } catch (error) {
    console.error(
      "FINORA LOAN DRAFT CLEANUP ERROR",
      error,
    );

    // Draft cleanup must never break Loan workflow.
  }
}

/* ============================================================
   CHECK
============================================================ */

export function hasLoanWorkspaceDraft(
  mode: LoanWorkspaceDraftMode,
): boolean {
  return loadLoanWorkspaceDraft(mode) !== null;
}

/* ============================================================
   END
============================================================ */
