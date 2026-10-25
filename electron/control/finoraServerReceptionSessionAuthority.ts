import {
  createFinoraServerReceptionSession,
  type FinoraServerReceptionPrincipal,
} from "./finoraServerReceptionSession.js";

type Principal = FinoraServerReceptionPrincipal;

type Verification =
  | { success: true; principal: Principal }
  | { success: false };

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

const MAX_AGE_MS = 30 * 60 * 1000;
const IDLE_MS = 15 * 60 * 1000;

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

  return (
    now >= entry.createdAt &&
    now - entry.createdAt < MAX_AGE_MS &&
    now >= entry.lastActivity &&
    now - entry.lastActivity < IDLE_MS
  );
}

export async function issueFinoraServerReceptionSession(
  sender: object,
  businessSessionId: string,
  expectedPrincipal: Principal,
  verifyServer: VerifyServer,
) {
  sessions.delete(sender);

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
    sessions.delete(sender);
    return { success: false as const, errorCode: "SERVER_UNAVAILABLE" };
  }

  if (
    sessions.get(sender) !== entry ||
    !verified.success ||
    !samePrincipal(verified.principal, entry.principal)
  ) {
    if (sessions.get(sender) === entry) sessions.delete(sender);

    return { success: false as const, errorCode: "SERVER_REVALIDATION_DENIED" };
  }

  return {
    success: true as const,
    sessionId: entry.sessionId,
    principal: entry.principal,
    createdAt: entry.createdAt,
    lastActivity: entry.lastActivity,
  };
}

export async function touchFinoraServerReceptionSession(
  sender: object,
  sessionId: string,
  verifyServer: VerifyServer,
  expectedBusinessSessionId: string,
) {
  const result = await validateFinoraServerReceptionSession(
    sender,
    sessionId,
    verifyServer,
    expectedBusinessSessionId,
  );

  if (!result.success) return result;

  const entry = sessions.get(sender);

  if (!entry || entry.sessionId !== sessionId) {
    return { success: false as const, errorCode: "SESSION_CHANGED" };
  }

  entry.lastActivity = Date.now();

  // FINORA_P1_704Y_TOUCH_RESULT
  // Return only the already server-validated session authority.
  return {
    success: true as const,
    sessionId,
    principal: result.principal,
    createdAt: result.createdAt,
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