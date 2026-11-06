import {
  createFinoraServerReceptionSession,
  type FinoraServerReceptionPrincipal,
} from "./finoraServerReceptionSession.js";

type Principal = FinoraServerReceptionPrincipal;

type Verification =
  | { success: true; principal: Principal; expiresAt?: string }
  | {
      success: false;
      errorCode?: string;
    };

type VerifyServer = (
  businessSessionId: string,
) => Promise<Verification>;

type Entry = {
  sessionId: string;
  businessSessionId: string;
  principal: Readonly<Principal>;
  createdAt: number;
  lastActivity: number;
  committed: boolean;
};

// FINORA_C80_B29_B1_ACTUAL_USER_IDLE
// Reception idle expiry is based on the last successful
// authenticated USER ACTIVITY touch, not periodic validation.
// Server verification and revocation remain mandatory.
const SERVER_VERIFICATION_GRACE_MS = 60 * 60 * 1000;

const sessions = new WeakMap<object, Entry>();

function samePrincipal(a: Principal, b: Principal): boolean {
  return (
    a.userId === b.userId &&
    a.ownerId === b.ownerId &&
    a.businessId === b.businessId &&
    a.branchId === b.branchId &&
    a.storageMode === b.storageMode &&
    // FINORA_P1_705Q_IDENTITY_MATCH
    typeof a.username === "string" &&
    a.username.trim().length > 0 &&
    a.username.length <= 128 &&
    a.username === b.username &&
    typeof a.fullName === "string" &&
    a.fullName.trim().length > 0 &&
    a.fullName === b.fullName &&
    typeof a.businessName === "string" &&
    a.businessName.trim().length > 0 &&
    a.businessName === b.businessName &&
    typeof a.branchName === "string" &&
    a.branchName.trim().length > 0 &&
    a.branchName === b.branchName &&
    a.role === "OWNER" &&
    b.role === "OWNER" &&
    (a.storageMode === "LOCAL" || a.storageMode === "USB")
  );
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function live(entry: Entry): boolean {
  const now = Date.now();

  // No fixed login-age limit. A session remains locally eligible
  // only while recent successful server verifications continue.
  // This does not replace mandatory server verification.
  return (
    now >= entry.createdAt &&
    now >= entry.lastActivity &&
    now - entry.lastActivity < SERVER_VERIFICATION_GRACE_MS
  );
}

export async function issueFinoraServerReceptionSession(
  sender: object,
  businessSessionId: string,
  expectedPrincipal: Principal,
  verifyServer: VerifyServer,
) {
  // FINORA_P1_753U_ATOMIC_ISSUANCE
  // Never erase an existing verified Reception session before
  // the replacement Business Session passes server verification.
  if (!validId(businessSessionId)) {
    return { success: false as const, errorCode: "INVALID_SERVER_SESSION" };
  }

  let verified: Verification;

  try {
    verified = await verifyServer(businessSessionId);
  } catch {
    return { success: false as const, errorCode: "SERVER_UNAVAILABLE" };
  }

  if (
    !verified.success ||
    !samePrincipal(verified.principal, expectedPrincipal)
  ) {
    return { success: false as const, errorCode: "SERVER_SCOPE_DENIED" };
  }

  // FINORA_P1_753U_ATOMIC_ISSUANCE
  // Repeated issuance for the SAME verified Business Session must
  // not invalidate an already live Reception session.
  const existing = sessions.get(sender);

  if (
    existing &&
    existing.businessSessionId === businessSessionId &&
    live(existing) &&
    samePrincipal(existing.principal, verified.principal)
  ) {
    // Extend local validity only after this successful server check.
    existing.lastActivity = Date.now();

    return {
      success: true as const,
      sessionId: existing.sessionId,
      principal: existing.principal,
    };
  }

  const created = createFinoraServerReceptionSession(
    verified.principal,
  );

  if (!created) {
    return { success: false as const, errorCode: "SESSION_CREATION_DENIED" };
  }

  const entry: Entry = {
    sessionId: created.sessionId,
    businessSessionId,
    principal: Object.freeze({ ...created.principal }),
    createdAt: created.createdAt,
    lastActivity: created.lastActivity,
    committed: false,
  };

  sessions.set(sender, entry);

  return {
    success: true as const,
    sessionId: entry.sessionId,
    principal: entry.principal,
  };
}

export async function validateFinoraServerReceptionSession(
  sender: object,
  sessionId: string,
  verifyServer: VerifyServer,
  expectedBusinessSessionId: string,
) {
  const entry = sessions.get(sender);

  if (
    !entry ||
    !validId(sessionId) ||
    !validId(expectedBusinessSessionId) ||
    entry.sessionId !== sessionId ||
    entry.businessSessionId !== expectedBusinessSessionId
  ) {
    const reason = !entry
      ? "NO_RECEPTION_RECORD"
      : !validId(sessionId)
        ? "INVALID_REQUESTED_ID"
        : !validId(expectedBusinessSessionId)
          ? "INVALID_BUSINESS_ID"
          : entry.sessionId !== sessionId
            ? "RECEPTION_ID_MISMATCH"
            : "BUSINESS_ID_MISMATCH";

    console.warn("[FINORA R204 SESSION DIAG]", {
      reason,
      hasReceptionRecord: Boolean(entry),
      requestedIdValid: validId(sessionId),
      businessIdValid: validId(expectedBusinessSessionId),
      receptionIdMatches: Boolean(entry && entry.sessionId === sessionId),
      businessIdMatches: Boolean(entry && entry.businessSessionId === expectedBusinessSessionId),
    });
    return { success: false as const, errorCode: "SESSION_NOT_FOUND" };
  }

  if (!live(entry)) {
    sessions.delete(sender);
    return { success: false as const, errorCode: "SESSION_EXPIRED" };
  }

  let verified: Verification;

  try {
    verified = await verifyServer(entry.businessSessionId);
  } catch {
    // FINORA_P1_726P_NETWORK_RECOVERY
    // Keep handle for later revalidation, but deny this request.
    return { success: false as const, errorCode: "SERVER_UNAVAILABLE" };
  }

  // FINORA_P1_754S2_TYPED_REVALIDATION
  // Temporary transport/malformed responses are not proof of revocation.
  // Retain the handle but deny operations until successful revalidation.
  // Never extend session validity on failure.
  if (
    !verified.success &&
    (
      verified.errorCode === "SERVER_UNAVAILABLE" ||
      verified.errorCode === "INVALID_SERVER_RESPONSE"
    ) &&
    sessions.get(sender) === entry
  ) {
    return {
      success: false as const,
      errorCode: "SERVER_UNAVAILABLE",
    };
  }

  // A parallel authenticated login may have replaced this session.
  // Never delete the replacement.
  if (sessions.get(sender) !== entry) {
    return {
      success: false as const,
      errorCode: "SESSION_CHANGED",
    };
  }

  if (!verified.success) {
    // Server refusal remains authoritative.
    sessions.delete(sender);
    return {
      success: false as const,
      errorCode: typeof verified.errorCode === "string"
        ? verified.errorCode
        : "SERVER_REVALIDATION_DENIED",
    };
  }

  if (!samePrincipal(verified.principal, entry.principal)) {
    // Verified identity mismatch must fail closed.
    sessions.delete(sender);
    return {
      success: false as const,
      errorCode: "SERVER_IDENTITY_MISMATCH",
    };
  }

  // FINORA_C80_B29_B1_VALIDATE_NO_IDLE_RENEW
  // A periodic security validation must NEVER count as user activity.
  // The authenticated activity-touch path alone renews idle time.
  return {
    success: true as const,
    sessionId: entry.sessionId,
    principal: entry.principal,
    expiresAt: verified.expiresAt,
    createdAt: entry.createdAt,
    lastActivity: entry.lastActivity,
  };
}

export async function touchFinoraServerReceptionSession(
  sender: object,
  sessionId: string,
  verifyServer: VerifyServer,
  touchServer: VerifyServer,
  expectedBusinessSessionId: string,
) {
  // Read-only validation must not renew server or local idle time.
  const result = await validateFinoraServerReceptionSession(
    sender,
    sessionId,
    verifyServer,
    expectedBusinessSessionId,
  );

  if (!result.success) return result;

  const entry = sessions.get(sender);

  if (
    !entry ||
    entry.sessionId !== sessionId ||
    entry.businessSessionId !== expectedBusinessSessionId
  ) {
    return { success: false as const, errorCode: "SESSION_CHANGED" };
  }

  // A real authenticated activity must renew server authority.
  // A failed renewal must never extend local idle time.
  let renewed: Verification;

  try {
    renewed = await touchServer(entry.businessSessionId);
  } catch {
    return { success: false as const, errorCode: "SERVER_UNAVAILABLE" };
  }

  if (sessions.get(sender) !== entry || !live(entry)) {
    return { success: false as const, errorCode: "SESSION_CHANGED" };
  }

  if (!renewed.success) {
    if (
      renewed.errorCode === "SERVER_UNAVAILABLE" ||
      renewed.errorCode === "INVALID_SERVER_RESPONSE"
    ) {
      return { success: false as const, errorCode: "SERVER_UNAVAILABLE" };
    }

    sessions.delete(sender);
    return {
      success: false as const,
      errorCode: typeof renewed.errorCode === "string"
        ? renewed.errorCode
        : "SERVER_REVALIDATION_DENIED",
    };
  }

  if (!samePrincipal(renewed.principal, entry.principal)) {
    sessions.delete(sender);
    return {
      success: false as const,
      errorCode: "SERVER_IDENTITY_MISMATCH",
    };
  }

  entry.lastActivity = Date.now();

  return {
    success: true as const,
    sessionId,
    principal: entry.principal,
    expiresAt: renewed.expiresAt,
    createdAt: entry.createdAt,
    lastActivity: entry.lastActivity,
  };
}
// FINORA_P1_708M_COMMIT_AUTHORITY
// Operational approval must be supplied by trusted Electron Main.
// Renderer cannot approve its own Reception access.
export async function commitFinoraServerReceptionSession(
  sender: object,
  sessionId: string,
  verifyServer: VerifyServer,
  expectedBusinessSessionId: string,
  verifyOperational: (principal: Readonly<Principal>) => Promise<boolean>,
) {
  const entry = sessions.get(sender);
  if (!entry || !validId(sessionId) || entry.sessionId !== sessionId) {
    return { success: false as const, errorCode: "SESSION_NOT_FOUND" };
  }

  entry.committed = false;

  const verified = await validateFinoraServerReceptionSession(
    sender, sessionId, verifyServer, expectedBusinessSessionId
  );
  if (!verified.success) return verified;

  let approved = false;
  try {
    approved = await verifyOperational(verified.principal) === true;
  } catch {
    approved = false;
  }

  if (!approved || sessions.get(sender) !== entry || !live(entry)) {
    return { success: false as const, errorCode: "OPERATIONAL_APPROVAL_DENIED" };
  }

  const finalCheck = await validateFinoraServerReceptionSession(
    sender, sessionId, verifyServer, expectedBusinessSessionId
  );
  if (!finalCheck.success || sessions.get(sender) !== entry) {
    return { success: false as const, errorCode: "COMMIT_REVALIDATION_DENIED" };
  }

  entry.committed = true;
  return {
    success: true as const,
    sessionId,
    principal: entry.principal,
    operationalCommitted: true as const,
  };
}

// FINORA_C80_B7_COMMITTED_PRINCIPAL
// Main-process-only identity accessor for future secure Login vault IPC.
// This is not a substitute for fresh server/session revalidation.
export function getFinoraCommittedReceptionPrincipal(
  sender: object,
  sessionId: string,
): Readonly<Principal> | null {
  if (!validId(sessionId)) {
    return null;
  }

  const entry = sessions.get(sender);

  if (
    !entry ||
    entry.sessionId !== sessionId ||
    entry.committed !== true ||
    !live(entry)
  ) {
    return null;
  }

  return entry.principal;
}
export function invalidateFinoraServerReceptionSession(
  sender: object,
  sessionId?: string,
): boolean {
  const entry = sessions.get(sender);

  if (!entry) return false;
  if (sessionId !== undefined && entry.sessionId !== sessionId) return false;

  sessions.delete(sender);
  return true;
}