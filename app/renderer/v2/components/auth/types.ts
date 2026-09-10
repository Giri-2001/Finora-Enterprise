// ============================================================
// FINORA ENTERPRISE OS™
//
// AUTHENTICATION TYPES
//
// RESPONSIBILITY:
//
// - Define FINORA authentication contracts
// - Define authenticated user roles
// - Define business access context
// - Define authenticated session
// - Define authenticated data context
//
// IMPORTANT:
//
// - Types only.
// - No localStorage access.
// - No authentication logic.
// - No business logic.
// - No storage access.
//
// VERSION : 2.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// USER ROLE
// ============================================================

export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER";

// ============================================================
// USER STATUS
// ============================================================

export type AuthDataContext =
  | "REAL"
  | "DEMO";

// ============================================================
// BUSINESS ACCESS CONTEXT
//
// Defines the FINORA business environment to which an
// authenticated user belongs.
//
// ownerId:
// - FINORA owner / tenant identifier.
//
// businessId:
// - FINORA business identifier.
// - Example: FINORA-HYD-01
//
// branchId:
// - FINORA branch identifier.
// - Example: BR-001
//
// These identifiers form the business context used later
// by the storage layer for data isolation.
//
// The fields remain optional at the type level for backward
// compatibility with legacy FINORA authentication records.
//
// An active V2 business context requires all three values.
// ============================================================

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../types/business/finoraBusinessProfileControl.types";

export type BusinessAccessContext = {
  ownerId?: string;

  businessId?: string;

  branchId?: string;

  // ----------------------------------------------------------
  // ACTIVE DATA CONTEXT
  //
  // REAL:
  // - Production owner data.
  //
  // DEMO:
  // - Isolated demonstration data.
  //
  // These fields are optional for backward compatibility.
  // An active DEMO context requires demoId.
  // ----------------------------------------------------------

  dataContext?: AuthDataContext;

  demoId?: string;

  // ----------------------------------------------------------
  // SIGNED BUSINESS / BRANCH PROFILE
  //
  // Provisioned by the FINORA Control Plane.
  // This is the authoritative runtime identity view.
  // Legacy mutable business identity storage is not authoritative here.
  // ----------------------------------------------------------

  businessProfile?:
    FinoraProvisionedBusinessProfileV1;
};

// ============================================================
// USER
//
// IMPORTANT:
//
// User records intentionally do NOT contain demoId or
// authenticated dataContext.
//
// User identity and active data context are separate concerns.
//
// Existing Users / Backup / Restore functionality therefore
// remains compatible with the current User contract.
//
// The active REAL / DEMO context belongs to AuthSession.
// ============================================================

export type AuthSession = {
  userId: string;

  username: string;

  fullName: string;

  role: UserRole;

  loginTime: string;

  // ----------------------------------------------------------
  // ERP BUSINESS DATE
  // ----------------------------------------------------------
  //
  // Owner-selected operational date for this login session.
  //
  // Stored as YYYY-MM-DD.
  //
  // This is not an audit timestamp. loginTime, createdAt and
  // updatedAt remain authoritative system-generated times.
  // ----------------------------------------------------------

  businessDate: string;

  sessionId: string;

  lastActivity: string;

  // ----------------------------------------------------------
  // BUSINESS ACCESS CONTEXT
  // ----------------------------------------------------------

  ownerId?: string;

  businessId?: string;

  branchId?: string;

  // ----------------------------------------------------------
  // ACTIVE DATA CONTEXT
  // ----------------------------------------------------------

  dataContext: AuthDataContext;

  demoId?: string;
};

// ============================================================
// LOGIN SESSION CANDIDATE
// ============================================================
//
// Credential verification creates this transient candidate.
// The selected ERP Business Date is attached only at the
// authoritative commitLoginSession boundary.
// ============================================================

export type AuthSessionCandidate =
  Omit<
    AuthSession,
    "businessDate"
  >;

// ============================================================
// END
// ============================================================
