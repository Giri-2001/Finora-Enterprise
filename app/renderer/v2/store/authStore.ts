// ============================================================
// FINORA ENTERPRISE OS™
//
// AUTHENTICATION STORE
//
// RESPONSIBILITY:
//
// - Manage FINORA users
// - Authenticate users
// - Manage authenticated session
// - Integrate login security
// - Create authentication audit logs
// - Carry Business Access Context into the session
// - Carry REAL / DEMO data context into the session
// - Migrate legacy authentication records safely
//
// IMPORTANT:
//
// - Existing authentication behavior is preserved.
// - Existing login-security behavior is preserved.
// - Existing audit behavior is preserved.
// - Existing User records remain backward compatible.
// - Existing administrator login remains a REAL session.
// - DEMO session support is represented in the session contract,
//   but no demo credential is invented here.
// - No Customer business logic.
// - No Loan business logic.
// - No Collection business logic.
// - No Payment business logic.
//
// VERSION : 2.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  AuthDataContext,
  AuthSession,
  AuthSessionCandidate,
  LoginCredentials,
  User,
} from "../components/auth/types";

import { createAuditLog } from "./auditStore";

import {
  isAccountLocked,
  registerFailedLogin,
  resetLoginAttempts,
} from "./loginSecurityStore";

import {
  generateSessionId,
  hashPassword,
  verifyPassword,
} from "../utils/security";

import {
  resolveBusinessDate,
} from "../services/business/businessDateService";

// ============================================================
// STORAGE KEYS
// ============================================================

const USERS_KEY =
  "finora_users";

const SESSION_KEY =
  "finora_session";

// ============================================================
// DEFAULT BUSINESS CONTEXT
//
// Canonical FINORA V2 identity boundary:
//
// OWNER
//   ↓
// BUSINESS
//   ↓
// BRANCH
//
// These values already exist in the FINORA architecture and
// are used for the initial administrator compatibility
// migration.
// ============================================================

const DEFAULT_OWNER_ID =
  "OWNER-000001";

const DEFAULT_BUSINESS_ID =
  "FINORA-HYD-01";

const DEFAULT_BRANCH_ID =
  "BR-001";

// ============================================================
// DEFAULT AUTHENTICATED DATA CONTEXT
//
// Existing administrator accounts are production/REAL
// accounts.
//
// DEMO support is introduced at the session contract level,
// but no DEMO account is created automatically.
// ============================================================

const DEFAULT_DATA_CONTEXT:
  AuthDataContext =
  "REAL";

// ============================================================
// LEGACY USER NORMALIZATION
//
// Older FINORA installations may contain users created before
// V2 Business Context support was introduced.
//
// The initial administrator is migrated only when one or more
// required business-context identifiers are missing.
//
// Existing valid business context is preserved.
// ============================================================

function normalizeUsers(
  storedUsers: User[],
): User[] {

  let changed =
    false;

  const normalizedUsers =
    storedUsers.map(
      (user) => {

        // ----------------------------------------------------
        // INITIAL ADMIN COMPATIBILITY MIGRATION
        // ----------------------------------------------------

        if (
          user.username === "admin"
        ) {

          const nextOwnerId =
            user.ownerId ??
            DEFAULT_OWNER_ID;

          const nextBusinessId =
            user.businessId ??
            DEFAULT_BUSINESS_ID;

          const nextBranchId =
            user.branchId ??
            DEFAULT_BRANCH_ID;

          if (
            user.ownerId !==
              nextOwnerId ||
            user.businessId !==
              nextBusinessId ||
            user.branchId !==
              nextBranchId
          ) {

            changed =
              true;

            return {
              ...user,

              ownerId:
                nextOwnerId,

              businessId:
                nextBusinessId,

              branchId:
                nextBranchId,

              updatedAt:
                new Date().toISOString(),
            };
          }
        }

        return user;
      },
    );

  return changed
    ? normalizedUsers
    : storedUsers;
}

// ============================================================
// USER LOADING
// ============================================================

function loadUsers(): User[] {

  try {

    const data =
      localStorage.getItem(
        USERS_KEY,
      );

    // ========================================================
    // INITIAL ADMIN
    // ========================================================

    if (!data) {

      const now =
        new Date().toISOString();

      const defaultAdmin: User = {

        id:
          "1",

        username:
          "admin",

        password:
          hashPassword(
            "admin123",
          ),

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        status:
          "ACTIVE",

        createdAt:
          now,

        updatedAt:
          now,

        // ----------------------------------------------------
        // BUSINESS ACCESS CONTEXT
        // ----------------------------------------------------

        ownerId:
          DEFAULT_OWNER_ID,

        businessId:
          DEFAULT_BUSINESS_ID,

        branchId:
          DEFAULT_BRANCH_ID,
      };

      localStorage.setItem(
        USERS_KEY,
        JSON.stringify([
          defaultAdmin,
        ]),
      );

      return [
        defaultAdmin,
      ];
    }

    // ========================================================
    // EXISTING USERS
    // ========================================================

    const parsedUsers =
      JSON.parse(
        data,
      ) as User[];

    const normalizedUsers =
      normalizeUsers(
        parsedUsers,
      );

    // --------------------------------------------------------
    // Persist only when migration changed a user.
    // --------------------------------------------------------

    if (
      normalizedUsers !==
      parsedUsers
    ) {

      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(
          normalizedUsers,
        ),
      );
    }

    return normalizedUsers;

  } catch {

    return [];
  }
}

// ============================================================
// USER PERSISTENCE
// ============================================================

function saveUsers(
  updatedUsers: User[],
): void {

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(
      updatedUsers,
    ),
  );
}

// ============================================================
// IN-MEMORY USER CACHE
// ============================================================

let users: User[] =
  loadUsers();

// ============================================================
// GET USERS
// ============================================================

export function getUsers(): User[] {

  return [
    ...users,
  ];
}

// ============================================================
// ADD USER
// ============================================================

export function addUser(
  user: User,
): void {

  users = [

    ...users,

    {
      ...user,

      password:
        hashPassword(
          user.password,
        ),
    },

  ];

  saveUsers(
    users,
  );
}

// ============================================================
// REPLACE USERS
// ============================================================

export function replaceUsers(
  updatedUsers: User[],
): void {

  users = [
    ...updatedUsers,
  ];

  saveUsers(
    users,
  );
}

// ============================================================
// AUTHENTICATE LOGIN
// ============================================================
//
// IMPORTANT:
//
// This function validates credentials and creates a candidate
// FINORA session only.
//
// It does NOT:
// - Persist the session
// - Create a successful LOGIN audit
//
// The caller must complete all additional access checks before
// committing the authenticated session.
// ============================================================

export function authenticateLogin(
  credentials: LoginCredentials,
): AuthSessionCandidate | null {

  // ==========================================================
  // ACCOUNT LOCK CHECK
  // ==========================================================

  if (
    isAccountLocked(
      credentials.username,
    )
  ) {

    createAuditLog({

      action:
        "LOGIN",

      module:
        "AUTH",

      description:
        `Blocked login attempt for locked account ${credentials.username}`,

      performedBy:
        credentials.username,

      userRole:
        "UNKNOWN",
    });

    return null;
  }

  // ==========================================================
  // FIND ACTIVE USER
  // ==========================================================

  const user =
    users.find(
      (item) =>
        item.username ===
          credentials.username &&
        item.status ===
          "ACTIVE",
    );

  // ==========================================================
  // PASSWORD VALIDATION
  // ==========================================================

  if (
    !user ||
    !verifyPassword(
      credentials.password,
      user.password,
    )
  ) {

    registerFailedLogin(
      credentials.username,
    );

    createAuditLog({

      action:
        "LOGIN",

      module:
        "AUTH",

      description:
        `Failed login attempt for ${credentials.username}`,

      performedBy:
        credentials.username,

      userRole:
        "UNKNOWN",
    });

    return null;
  }

  // ==========================================================
  // RESET LOGIN SECURITY
  // ==========================================================

  resetLoginAttempts(
    credentials.username,
  );

  // ==========================================================
  // CANDIDATE SESSION CREATION
  //
  // Existing users authenticate as REAL sessions.
  //
  // No session persistence occurs here.
  // ==========================================================

  const now =
    new Date().toISOString();

  const session: AuthSessionCandidate = {

    userId:
      user.id,

    username:
      user.username,

    fullName:
      user.fullName,

    role:
      user.role,

    loginTime:
      now,

    sessionId:
      generateSessionId(),

    lastActivity:
      now,

    // --------------------------------------------------------
    // BUSINESS ACCESS CONTEXT
    // --------------------------------------------------------

    ownerId:
      user.ownerId,

    businessId:
      user.businessId,

    branchId:
      user.branchId,

    // --------------------------------------------------------
    // ACTIVE DATA CONTEXT
    // --------------------------------------------------------

    dataContext:
      DEFAULT_DATA_CONTEXT,
  };

  return session;
}

// ============================================================
// COMMIT LOGIN SESSION
// ============================================================
//
// Call only AFTER every required FINORA access check succeeds.
// ============================================================

export function commitLoginSession(
  session: AuthSessionCandidate,

  businessDate:
    string,
): AuthSession {
  const resolvedBusinessDate =
    resolveBusinessDate(
      businessDate,
    );

  if (!resolvedBusinessDate) {
    throw new Error(
      "A valid FINORA Business Date is required before login session commit.",
    );
  }

  const committedSession:
    AuthSession = {
    ...session,

    businessDate:
      resolvedBusinessDate,
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(
      committedSession,
    ),
  );

  createAuditLog({

    action:
      "LOGIN",

    module:
      "AUTH",

    description:
      `User ${committedSession.fullName} logged into FINORA for Business Date ${resolvedBusinessDate}`,

    performedBy:
      committedSession.username,

    userRole:
      committedSession.role,
  });

  return committedSession;
}

// ============================================================
// GET SESSION
// ============================================================
//
// Existing sessions created before V2 data-context support
// may not contain dataContext.
//
// Legacy sessions are safely interpreted as REAL sessions.
//
// Existing business context values are preserved.
//
// No new authentication is performed here.
// ============================================================

export function getSession():
  AuthSession | null {

  const data =
    localStorage.getItem(
      SESSION_KEY,
    );

  if (!data) {

    return null;
  }

  try {

    const parsedSession =
      JSON.parse(
        data,
      ) as Partial<AuthSession>;

    // --------------------------------------------------------
    // ERP BUSINESS DATE SAFETY
    //
    // Sessions created before Business Date support must
    // authenticate again and explicitly choose a date.
    //
    // Never infer today because that could silently assign
    // operational transactions to an unintended date.
    // --------------------------------------------------------

    const resolvedBusinessDate =
      resolveBusinessDate(
        parsedSession.businessDate,
      );

    if (!resolvedBusinessDate) {
      localStorage.removeItem(
        SESSION_KEY,
      );

      return null;
    }

    // --------------------------------------------------------
    // FIND AUTHENTICATED USER
    // --------------------------------------------------------

    const authenticatedUser =
      users.find(
        (user) =>
          user.id ===
          parsedSession.userId,
      );

    // --------------------------------------------------------
    // LEGACY DATA CONTEXT MIGRATION
    //
    // Existing sessions without dataContext are REAL.
    //
    // We intentionally do not infer DEMO from any existing
    // field because doing so could expose production data to
    // an unintended demo context.
    // --------------------------------------------------------

    const nextDataContext:
      AuthDataContext =
      parsedSession.dataContext ===
        "DEMO"
        ? "DEMO"
        : "REAL";

    // --------------------------------------------------------
    // DEMO SAFETY
    //
    // A DEMO session without a demoId is invalid.
    //
    // We remove it rather than silently converting it to REAL.
    // This prevents accidental data-context escalation.
    // --------------------------------------------------------

    if (
      nextDataContext === "DEMO" &&
      !parsedSession.demoId
    ) {

      localStorage.removeItem(
        SESSION_KEY,
      );

      return null;
    }

    // --------------------------------------------------------
    // RECONCILE BUSINESS CONTEXT
    //
    // Existing session values are preserved.
    // Missing values are recovered from the authenticated
    // user when available.
    // --------------------------------------------------------

    const nextOwnerId =
      parsedSession.ownerId ??
      authenticatedUser?.ownerId;

    const nextBusinessId =
      parsedSession.businessId ??
      authenticatedUser?.businessId;

    const nextBranchId =
      parsedSession.branchId ??
      authenticatedUser?.branchId;

    // --------------------------------------------------------
    // BUILD NORMALIZED SESSION
    // --------------------------------------------------------

    const normalizedSession:
      AuthSession = {

      userId:
        parsedSession.userId ?? "",

      username:
        parsedSession.username ?? "",

      fullName:
        parsedSession.fullName ?? "",

      role:
        parsedSession.role ?? "VIEWER",

      loginTime:
        parsedSession.loginTime ??
        new Date().toISOString(),

      businessDate:
        resolvedBusinessDate,

      sessionId:
        parsedSession.sessionId ?? "",

      lastActivity:
        parsedSession.lastActivity ??
        parsedSession.loginTime ??
        new Date().toISOString(),

      ownerId:
        nextOwnerId,

      businessId:
        nextBusinessId,

      branchId:
        nextBranchId,

      dataContext:
        nextDataContext,

      ...(parsedSession.demoId
        ? {
            demoId:
              parsedSession.demoId,
          }
        : {}),
    };

    // --------------------------------------------------------
    // Persist normalized legacy/session state only when the
    // stored representation differs from the normalized one.
    // --------------------------------------------------------

    const normalizedSerialized =
      JSON.stringify(
        normalizedSession,
      );

    if (
      normalizedSerialized !==
      data
    ) {

      localStorage.setItem(
        SESSION_KEY,
        normalizedSerialized,
      );
    }

    return normalizedSession;

  } catch {

    localStorage.removeItem(
      SESSION_KEY,
    );

    return null;
  }
}

// ============================================================
// UPDATE SESSION ACTIVITY
// ============================================================

export function updateSessionActivity():
  void {

  const session =
    getSession();

  if (!session) {

    return;
  }

  localStorage.setItem(

    SESSION_KEY,

    JSON.stringify({

      ...session,

      lastActivity:
        new Date().toISOString(),

    }),

  );
}

// ============================================================
// INVALIDATE SESSION
// ============================================================
//
// Security/system invalidation only.
//
// Unlike logout(), this does NOT create a user LOGOUT audit.
// Use when FINORA rejects an existing session because an
// authorization, entitlement, or session-integrity check fails.
// ============================================================

export function invalidateSession():
  void {

  localStorage.removeItem(
    SESSION_KEY,
  );
}

// ============================================================
// LOGOUT
// ============================================================

export function logout():
  void {

  const session =
    getSession();

  if (session) {

    createAuditLog({

      action:
        "LOGOUT",

      module:
        "AUTH",

      description:
        `User ${session.fullName} logged out from FINORA`,

      performedBy:
        session.username,

      userRole:
        session.role,
    });
  }

  localStorage.removeItem(
    SESSION_KEY,
  );
}

// ============================================================
// END
// ============================================================
