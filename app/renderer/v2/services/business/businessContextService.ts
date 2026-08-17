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
// - Synchronize the active data context with StorageManager
// - Safely reset storage context during logout
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
// DATA CONTEXT:
//
// REAL
// - Requires ownerId.
// - Uses owner-scoped production storage.
//
// DEMO
// - Requires demoId.
// - Uses isolated demonstration storage.
//
// LOGOUT RESET:
//
// clearBusinessContext()
//      ↓
// StorageManager.resetDataContext()
//      ↓
// Neutral REAL storage context
//      ↓
// Clear in-memory business context
//
// VERSION : 2.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  BusinessAccessContext,
} from "../../components/auth/types";

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
// AuthSession remains the authentication/session source.
//
// This prevents a second competing source of truth for:
//
// - ownerId
// - businessId
// - branchId
// - dataContext
// - demoId
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
// An ACTIVE V2 business context requires:
//
// - ownerId
// - businessId
// - branchId
//
// REAL requires ownerId.
//
// DEMO requires demoId.
//
// This prevents an accidental switch into an unscoped
// data environment.
// ============================================================

function validateBusinessContext(
  context:
    BusinessAccessContext,
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

  // ----------------------------------------------------------
  // Backward-compatible default
  // ----------------------------------------------------------

  const dataContext =
    context.dataContext ??
    "REAL";

  if (
    dataContext !== "REAL" &&
    dataContext !== "DEMO"
  ) {

    return "Invalid FINORA data context.";
  }

  // ----------------------------------------------------------
  // DEMO REQUIRES DEMO ID
  // ----------------------------------------------------------

  if (
    dataContext === "DEMO" &&
    !context.demoId
  ) {

    return "Demo ID is required for DEMO data context.";
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
// This keeps authentication lifecycle and storage lifecycle
// independent from one another.
// ============================================================

export async function setBusinessContext(
  context:
    BusinessAccessContext,
): Promise<
  StorageResult<void>
> {

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
  // Backward-compatible default
  //
  // Existing sessions created before DEMO support remain REAL.
  // ----------------------------------------------------------

  const dataContext =
    context.dataContext ??
    "REAL";

  // ----------------------------------------------------------
  // Establish selected data context in StorageManager.
  //
  // REAL:
  // - ownerId identifies production owner.
  //
  // DEMO:
  // - demoId identifies isolated demonstration storage.
  // ----------------------------------------------------------

  const storageResult =
    await storageManager.setDataContext(
      dataContext === "DEMO"
        ? DataContext.DEMO
        : DataContext.REAL,
      {
        ownerId:
          context.ownerId,

        demoId:
          dataContext === "DEMO"
            ? context.demoId
            : undefined,
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
  // Only update runtime context after StorageManager accepts
  // the requested data context.
  // ----------------------------------------------------------

  activeBusinessContext = {

    ownerId:
      context.ownerId,

    businessId:
      context.businessId,

    branchId:
      context.branchId,

    dataContext:
      dataContext,

    ...(dataContext === "DEMO"
      ? {
          demoId:
            context.demoId,
        }
      : {}),
  };

  return {

    success: true,
  };
}

// ============================================================
// GET BUSINESS CONTEXT
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
// This operation is intentionally asynchronous.
//
// Logout must reset the active StorageManager context before
// declaring the application-level Business Context cleared.
//
// IMPORTANT:
//
// - Does NOT delete persisted customer/loan/etc. data.
// - Does NOT clear localStorage records.
// - Does NOT delete DEMO data.
// - Does NOT delete REAL data.
// - Only resets the active runtime storage boundary.
//
// If StorageManager reset fails:
//
// - activeBusinessContext remains intact.
// - Caller receives the storage error.
// - React must not falsely report a cleared context.
// ============================================================

export async function clearBusinessContext():
  Promise<StorageResult<void>> {

  const storageResult =
    await storageManager.resetDataContext();

  if (!storageResult.success) {

    return {

      success: false,

      error:
        storageResult.error ??
        "Unable to reset FINORA storage context.",
    };
  }

  // ----------------------------------------------------------
  // Storage boundary is now safely reset.
  // ----------------------------------------------------------

  activeBusinessContext =
    null;

  return {

    success: true,
  };
}

// ============================================================
// REPLACE BUSINESS CONTEXT
// ============================================================
//
// Explicit API for future business/branch/data-context
// switching.
//
// The new context is established only if StorageManager
// accepts it.
//
// If establishment fails, the previous context remains intact.
// ============================================================

export async function replaceBusinessContext(
  context:
    BusinessAccessContext,
): Promise<
  StorageResult<void>
> {

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
  // Backward-compatible default
  // ----------------------------------------------------------

  const dataContext =
    context.dataContext ??
    "REAL";

  // ----------------------------------------------------------
  // Establish requested storage/data context.
  // ----------------------------------------------------------

  const storageResult =
    await storageManager.setDataContext(
      dataContext === "DEMO"
        ? DataContext.DEMO
        : DataContext.REAL,
      {
        ownerId:
          context.ownerId,

        demoId:
          dataContext === "DEMO"
            ? context.demoId
            : undefined,
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

  // ----------------------------------------------------------
  // Update runtime context only after successful storage
  // initialization.
  // ----------------------------------------------------------

  activeBusinessContext = {

    ownerId:
      context.ownerId,

    businessId:
      context.businessId,

    branchId:
      context.branchId,

    dataContext:
      dataContext,

    ...(dataContext === "DEMO"
      ? {
          demoId:
            context.demoId,
        }
      : {}),
  };

  return {

    success: true,
  };
}

// ============================================================
// END
// ============================================================
