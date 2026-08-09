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
//
// IMPORTANT:
//
// - Types only.
// - No localStorage access.
// - No authentication logic.
// - No business logic.
// - No storage access.
//
// VERSION : 2.0
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
// ============================================================

export type BusinessAccessContext = {

  ownerId?: string;

  businessId?: string;

  branchId?: string;
};

// ============================================================
// USER
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
// The session carries the authenticated user's business
// context so application services can establish the correct
// FINORA storage boundary.
//
// Existing authentication fields remain unchanged.
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
};

// ============================================================
// END
// ============================================================
