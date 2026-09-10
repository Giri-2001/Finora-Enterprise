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
} from "../components/auth/types";

import { createAuditLog } from "./auditStore";

import {
  resolveBusinessDate,
} from "../services/business/businessDateService";

// ============================================================
// STORAGE KEYS
// ============================================================

const SESSION_KEY =
  "finora_session";

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
    // BUSINESS CONTEXT SNAPSHOT
    //
    // Renderer storage is a cache only. Missing Owner /
    // Business / Branch authority is never recovered from a
    // renderer-local user database.
    //
    // Electron main-process login-session validation restores
    // authoritative identity and scope before business context
    // becomes usable.
    // --------------------------------------------------------
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
        parsedSession.ownerId,

      businessId:
        parsedSession.businessId,

      branchId:
        parsedSession.branchId,

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
// PERSIST REVALIDATED SESSION SNAPSHOT
// ============================================================
//
// SECURITY:
//
// This function is deliberately NOT authentication authority.
//
// It persists only a renderer snapshot that has already been
// reconciled against Electron main-process login-session
// authority.
//
// No LOGIN audit is generated here because renderer reload is
// not a new credential authentication event.
//
// FINORA Business Date remains an ERP accounting date and is
// preserved independently from main-process security time.
// ============================================================

export function persistRevalidatedSessionSnapshot(
  session:
    AuthSession,
): AuthSession | null {
  const resolvedBusinessDate =
    resolveBusinessDate(
      session.businessDate,
    );

  if (
    !resolvedBusinessDate ||
    !session.sessionId ||
    !session.userId ||
    !session.username ||
    !session.fullName ||
    !session.ownerId ||
    !session.businessId ||
    !session.branchId ||
    (
      session.role !== "ADMIN" &&
      session.role !== "MANAGER" &&
      session.role !== "COLLECTOR" &&
      session.role !== "VIEWER"
    ) ||
    (
      session.dataContext !== "REAL" &&
      session.dataContext !== "DEMO"
    ) ||
    (
      session.dataContext === "DEMO" &&
      !session.demoId
    ) ||
    (
      session.dataContext === "REAL" &&
      session.demoId !== undefined
    )
  ) {
    return null;
  }

  const normalizedSession:
    AuthSession = {
    ...session,

    businessDate:
      resolvedBusinessDate,
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(
      normalizedSession,
    ),
  );

  return normalizedSession;
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
