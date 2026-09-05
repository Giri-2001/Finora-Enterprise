/* ===========================================================
   FINORA ENTERPRISE OS™

   BUSINESS SCOPE TYPES

   RESPONSIBILITY:

   - Define FINORA Owner scope identifier
   - Define FINORA Business scope identifier
   - Define FINORA Branch scope identifier
   - Provide neutral shared scope identifiers for
     Control Plane, Activation, Business Profile,
     Numbering and domain contracts

   IMPORTANT:

   - TYPES ONLY.
   - No legacy mutable business identity persistence model.
   - No storage.
   - No repository.
   - No service.
   - No UI.
   - No business calculations.

   VERSION : 1.0
   STATUS  : Production Foundation
=========================================================== */

// ============================================================
// OWNER ID
// ============================================================

/**
 * Stable FINORA Owner / tenant identifier.
 *
 * Example:
 * OWNER-000001
 */
export type OwnerId =
  string;

// ============================================================
// BUSINESS ID
// ============================================================

/**
 * Stable FINORA Business identifier.
 *
 * Example:
 * FINORA-HYD-01
 */
export type BusinessId =
  string;

// ============================================================
// BRANCH ID
// ============================================================

/**
 * Stable FINORA Branch identifier.
 *
 * Example:
 * BR-001
 */
export type BranchId =
  string;

// ============================================================
// END
// ============================================================