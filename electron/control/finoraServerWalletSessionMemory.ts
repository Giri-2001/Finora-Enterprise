// Main-process internal module. Never expose this store through renderer IPC.
// No persistence. Local clearing does not revoke a session on the server.
import type {
  FinoraServerWalletSessionResult,
} from "./finoraServerWalletSessionClient.js";

type Success = Extract<FinoraServerWalletSessionResult, { success: true }>;
type Scope = Success["data"]["scope"];
type Session = Success["data"];
type Pending = { ticket: symbol; scope: Scope; keyId: string };
type Stored = { ticket: symbol; session: Session; expires: number };

const fields = [
  "userId", "ownerId", "businessId", "branchId", "credentialId",
] as const;

function copyScope(value: Scope): Scope {
  return {
    userId: value.userId,
    ownerId: value.ownerId,
    businessId: value.businessId,
    branchId: value.branchId,
    credentialId: value.credentialId,
    authGeneration: value.authGeneration,
  };
}

function validScope(value: Scope): boolean {
  return !!value && fields.every(field =>
    typeof value[field] === "string" &&
    value[field].length > 0 && value[field].length <= 128 &&
    value[field].trim() === value[field] &&
    !/[\u0000-\u001f\u007f]/.test(value[field])
  ) && Number.isSafeInteger(value.authGeneration) &&
    value.authGeneration > 0;
}

function sameScope(a: Scope, b: Scope): boolean {
  return fields.every(field => a[field] === b[field]) &&
    a.authGeneration === b.authGeneration;
}

function validKey(value: string): boolean {
  return typeof value === "string" && value.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function createFinoraServerWalletSessionMemory(
  clock: () => number = Date.now,
) {
  if (typeof clock !== "function") {
    throw new Error("INVALID_SESSION_CLOCK");
  }

  let pending: Pending | null = null;
  let stored: Stored | null = null;
  let lastTime = -Infinity;

  function clear(): void {
    pending = null;
    stored = null;
  }

  // Clock rollback invalidates existing state instead of extending its lifetime.
  function time(): number | null {
    try {
      const now = clock();
      if (!Number.isFinite(now) || now < lastTime) {
        clear();
        return null;
      }
      lastTime = now;
      return now;
    } catch {
      clear();
      return null;
    }
  }

  function beginLogin(scope: Scope, keyId: string): symbol | null {
    clear();
    if (time() === null || !validScope(scope) || !validKey(keyId)) {
      return null;
    }
    const ticket = Symbol("wallet-login");
    pending = { ticket, scope: copyScope(scope), keyId: keyId.toLowerCase() };
    return ticket;
  }

  function completeLogin(
    ticket: symbol,
    result: FinoraServerWalletSessionResult,
  ): boolean {
    const now = time();
    if (now === null || !pending || pending.ticket !== ticket) return false;

    const expected = pending;
    pending = null;
    stored = null;

    if (!result || result.success !== true) return false;
    const data = result.data;
    if (
      !data || !validScope(data.scope) ||
      !sameScope(expected.scope, data.scope) ||
      data.keyId !== expected.keyId ||
      typeof data.accessToken !== "string" ||
      data.accessToken.length !== 64 ||
      /[^a-f0-9]/.test(data.accessToken) ||
      typeof data.expiresAt !== "string"
    ) return false;

    const expires = Date.parse(data.expiresAt);
    if (
      !Number.isFinite(expires) || expires <= now ||
      expires - now > 1_805_000
    ) return false;

    stored = {
      ticket,
      expires,
      session: {
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
        scope: copyScope(data.scope),
        keyId: data.keyId,
      },
    };
    return true;
  }

  // Internal main-process caller only. Never return this object over IPC.
  // Reacquire for each operation; do not cache leases outside the operation.
  function acquire(scope: Scope) {
    const now = time();
    if (now === null || !stored) return null;
    if (stored.expires <= now) {
      clear();
      return null;
    }
    if (!validScope(scope) || !sameScope(stored.session.scope, scope)) return null;
    return {
      leaseId: stored.ticket,
      accessToken: stored.session.accessToken,
      expiresAt: stored.session.expiresAt,
      keyId: stored.session.keyId,
      scope: copyScope(stored.session.scope),
    };
  }

  // A late unauthorized response for an old session cannot clear a newer one.
  function invalidate(leaseId: symbol): boolean {
    if (!stored || stored.ticket !== leaseId) return false;
    clear();
    return true;
  }

  return Object.freeze({ beginLogin, completeLogin, acquire, invalidate, clear });
}