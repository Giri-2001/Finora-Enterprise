// ============================================================
// FINORA ENTERPRISE OS™
//
// AUTHENTICATION TYPES
//
// RESPONSIBILITY:
//
// - Define FINORA authentication contracts
// - Define user roles and status
// - Define business access context
// - Define login credentials
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

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE";

// ============================================================
// AUTHENTICATED DATA CONTEXT
//
// Defines whether the authenticated session is operating
// against REAL production data or an isolated DEMO context.
//
// IMPORTANT:
//
// - REAL uses ownerId for production owner isolation.
// - DEMO uses demoId for isolated demonstration data.
// - DEMO is a data context, not a storage mode.
//
// Storage modes remain:
//
// LOCAL
// USB
// CLOUD
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

export type User = {
  id: string;

  username: string;

  password: string;

  fullName: string;

  role: UserRole;

  status: UserStatus;

  createdAt: string;

  updatedAt: string;

  // ----------------------------------------------------------
  // BUSINESS ACCESS CONTEXT
  // ----------------------------------------------------------

  ownerId?: string;

  businessId?: string;

  branchId?: string;
};

// ============================================================
// LOGIN CREDENTIALS
// ============================================================

export type LoginCredentials = {
  username: string;

  password: string;
};

// ============================================================
// AUTHENTICATED SESSION
//
// The session carries the authenticated user's identity,
// business context and active data context.
//
// Existing authentication fields remain unchanged.
//
// dataContext:
// - REAL = production owner data.
// - DEMO = isolated demonstration data.
//
// demoId:
// - Required when dataContext is DEMO.
// - Must never be used for REAL sessions.
//
// This keeps authentication/session state separate from the
// persisted User identity model.
// ============================================================

export type AuthSession = {
  userId: string;

  username: string;

  fullName: string;

  role: UserRole;

  loginTime: string;

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
// END
// ============================================================
