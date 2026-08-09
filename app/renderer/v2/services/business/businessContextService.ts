// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS CONTEXT SERVICE
//
// RESPONSIBILITY:
//
// - Maintain the active FINORA business access context
// - Reuse the canonical BusinessAccessContext contract
// - Provide explicit business-context lifecycle operations
// - Synchronize the active owner with StorageManager
// - Keep authentication implementation outside the service
// - Keep React/UI implementation outside the service
//
// IMPORTANT:
//
// - Does NOT call getSession().
// - Does NOT call authStore.
// - Does NOT depend on React.
// - Does NOT initialize storage.
// - Does NOT read localStorage directly.
// - Does NOT access filesystem.
// - Does NOT use Electron IPC.
// - Does NOT load BusinessIdentity automatically.
// - Does NOT contain Customer logic.
// - Does NOT contain Loan logic.
// - Does NOT contain Collection logic.
// - Does NOT contain Payment logic.
// - Does NOT contain Report logic.
//
// ARCHITECTURE:
//
// Authentication
//      ↓
// BusinessAccessContext
//      ↓
// BusinessContextService
//      ↓
// StorageManager
//
// BusinessIdentity remains a separate persisted domain model.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  BusinessAccessContext,
} from "../../../components/auth/types";

import {
  DataContext,
} from "../../storage/storage.types";

import {
  storageManager,
} from "../../storage/storageManager";

import type {
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// INTERNAL STATE
// ============================================================
//
// The runtime context is intentionally kept in memory.
//
// It is NOT persisted independently.
//
// AuthSession remains the persisted authentication/session
// source.
//
// This prevents a second competing source of truth for
// ownerId / businessId / branchId.
// ============================================================

let activeBusinessContext:
  BusinessAccessContext | null = null;

// ============================================================
// VALIDATION
// ============================================================
//
// BusinessAccessContext is optional at the authentication
// type level for backward compatibility.
//
// An ACTIVE V2 business context, however, requires all three
// identifiers:
//
// - ownerId
// - businessId
// - branchId
//
// This distinction allows old sessions to remain compatible
// while preventing V2 domain operations from accidentally
// running without a complete business boundary.
// ============================================================

function validateBusinessContext(
  context: BusinessAccessContext,
): string | null {

  if (!context.ownerId) {

    return "Owner ID is required.";
  }

  if (!context.businessId) {

    return "Business ID is required.";
  }

  if (!context.branchId) {

    return "Branch ID is required.";
  }

  return null;
}

// ============================================================
// SET BUSINESS CONTEXT
// ============================================================
//
// Authentication/business-switching code explicitly calls
// this function.
//
// The service does NOT discover the session by itself.
//
// This keeps authentication lifecycle and storage startup
// independent from one another.
// ============================================================

export async function setBusinessContext(
  context: BusinessAccessContext,
): Promise<StorageResult> {

  const validationError =
    validateBusinessContext(
      context,
    );

  if (validationError) {

    return {

      success: false,

      error:
        validationError,
    };
  }

  // ----------------------------------------------------------
  // Establish the REAL owner scope in StorageManager.
  //
  // BusinessId and BranchId remain application/business
  // context identifiers. StorageManager currently owns the
  // physical storage context and owner isolation.
  // ----------------------------------------------------------

  const storageResult =
    await storageManager.setDataContext(
      DataContext.REAL,
      {
        ownerId:
          context.ownerId,
      },
    );

  if (!storageResult.success) {

    return {

      success: false,

      error:
        storageResult.error ??
        "Unable to establish FINORA business storage context.",
    };
  }

  // ----------------------------------------------------------
  // Only update the in-memory context after storage context
  // has been successfully established.
  // ----------------------------------------------------------

  activeBusinessContext = {

    ownerId:
      context.ownerId,

    businessId:
      context.businessId,

    branchId:
      context.branchId,
  };

  return {

    success: true,
  };
}

// ============================================================
// GET BUSINESS CONTEXT
// ============================================================
//
// Returns a defensive copy so callers cannot mutate the
// internal runtime state accidentally.
// ============================================================

export function getBusinessContext():
  BusinessAccessContext | null {

  if (!activeBusinessContext) {

    return null;
  }

  return {

    ...activeBusinessContext,
  };
}

// ============================================================
// HAS BUSINESS CONTEXT
// ============================================================

export function hasBusinessContext():
  boolean {

  return activeBusinessContext !== null;
}

// ============================================================
// REQUIRE BUSINESS CONTEXT
// ============================================================
//
// Used by future V2 domain boundaries that require an active
// business scope.
//
// Throwing here is intentional: an unscoped business
// operation must not silently continue.
// ============================================================

export function requireBusinessContext():
  BusinessAccessContext {

  if (!activeBusinessContext) {

    throw new Error(
      "No active FINORA Business Context.",
    );
  }

  return {

    ...activeBusinessContext,
  };
}

// ============================================================
// CLEAR BUSINESS CONTEXT
// ============================================================
//
// Clears the application-level business context.
//
// IMPORTANT:
//
// StorageManager currently uses the existing configuration
// when an optional ownerId is omitted. Therefore this service
// does not pretend that passing `undefined` clears the
// StorageManager owner scope.
//
// The in-memory business context is cleared here.
//
// A dedicated StorageManager context-reset operation can be
// introduced later when logout/session lifecycle is integrated.
// ============================================================

export function clearBusinessContext():
  void {

  activeBusinessContext =
    null;
}

// ============================================================
// REPLACE BUSINESS CONTEXT
// ============================================================
//
// Explicit API for future business/branch switching.
//
// The new context is established only if storage accepts it.
// If establishment fails, the previous context remains intact.
//
// Therefore we do NOT clear the existing context first.
// ============================================================

export async function replaceBusinessContext(
  context: BusinessAccessContext,
): Promise<StorageResult> {

  const validationError =
    validateBusinessContext(
      context,
    );

  if (validationError) {

    return {

      success: false,

      error:
        validationError,
    };
  }

  const storageResult =
    await storageManager.setDataContext(
      DataContext.REAL,
      {
        ownerId:
          context.ownerId,
      },
    );

  if (!storageResult.success) {

    return {

      success: false,

      error:
        storageResult.error ??
        "Unable to switch FINORA business storage context.",
    };
  }

  activeBusinessContext = {

    ownerId:
      context.ownerId,

    businessId:
      context.businessId,

    branchId:
      context.branchId,
  };

  return {

    success: true,
  };
}

// ============================================================
// END
// ============================================================
