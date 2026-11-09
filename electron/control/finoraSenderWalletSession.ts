import {
  authenticateFinoraAccountPassword,
  type FinoraVerifiedAccountPrincipal,
} from "./finoraAccountPasswordLoginClient.js";

// FINORA_P1_697C_SENDER_WALLET
// Each Electron webContents owns an independent in-memory Wallet.
// Tokens never enter renderer storage.
type WalletSession = {
  accessToken: string;
  expiresAtMs: number;
  // FINORA_P1_697N_PRINCIPAL
  principal: FinoraVerifiedAccountPrincipal;
};

const sessions = new WeakMap<object, WalletSession>();
const generations = new WeakMap<object, number>();

export function clearFinoraSenderWallet(
  sender: object,
): void {
  generations.set(
    sender,
    (generations.get(sender) ?? 0) + 1,
  );
  sessions.delete(sender);
}

export async function establishFinoraSenderWallet(
  sender: object,
  username: string,
  password: string,
): Promise<{ success: boolean; errorCode?: string }> {
  clearFinoraSenderWallet(sender);
  const generation = generations.get(sender);

  let result: Awaited<
    ReturnType<typeof authenticateFinoraAccountPassword>
  >;

  try {
    result = await authenticateFinoraAccountPassword(
      username,
      password,
    );
  } catch {
    return {
      success: false,
      errorCode: "SERVER_UNAVAILABLE",
    };
  }

  if (generations.get(sender) !== generation) {
    return {
      success: false,
      errorCode: "LOGIN_SUPERSEDED",
    };
  }

  if (
    result.success !== true ||
    !result.accessToken ||
    !result.expiresAt ||
    !result.principal
  ) {
    return {
      success: false,
      errorCode: result.errorCode ?? "AUTHENTICATION_FAILED",
    };
  }

  const expiry = Date.parse(result.expiresAt);

  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    return {
      success: false,
      errorCode: "INVALID_SESSION_EXPIRY",
    };
  }

  // PAISARULE C85-P0-S9: duration only, never token or identity.
  console.info("[PAISARULE P0 WALLET TTL]", {
    ttlMinutes: Math.round((expiry - Date.now()) / 60_000),
  });

  sessions.set(sender, {
    accessToken: result.accessToken,
    expiresAtMs: expiry,
    principal: { ...result.principal },
  });

  return { success: true };
}

export function getFinoraSenderWalletAuthorization(
  sender: object,
): string | null {
  const session = sessions.get(sender);

  if (!session) return null;

  if (Date.now() >= session.expiresAtMs) {
    // PAISARULE C85-P0-S9: no credentials or identity values.
    console.warn("[PAISARULE P0 WALLET TOKEN EXPIRED]");
    clearFinoraSenderWallet(sender);
    return null;
  }

  return `Bearer ${session.accessToken}`;
}
// Main-process only. Never expose to renderer or use as
// standalone Reception authorization.
export function getFinoraSenderWalletPrincipal(
  sender: object,
): FinoraVerifiedAccountPrincipal | null {
  if (!getFinoraSenderWalletAuthorization(sender)) {
    return null;
  }

  const principal = sessions.get(sender)?.principal;
  return principal ? { ...principal } : null;
}

// PAISARULE SESSION-S20-R30
// Main-process-only rotation memory authority.
// The caller must first receive a successful authenticated
// Business Session activity touch.

type FinoraWalletRotationScope = Readonly<{
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}>;

type FinoraWalletRotationResponse =
  | {
      success: true;
      accessToken: string;
      expiresAt: string;
      scope: FinoraWalletRotationScope;
    }
  | {
      success: false;
      errorCode: string;
    };

type FinoraWalletRotationTransport = (
  request: {
    oldWalletToken: string;
    businessSessionId: string;
    expectedScope: FinoraWalletRotationScope;
  },
) => Promise<FinoraWalletRotationResponse>;

type FinoraWalletRotationOutcome = {
  success: boolean;
  rotated: boolean;
  errorCode?: string;
};

// PAISARULE_C137_WALLET_R4_EARLY_ROTATION
// Rotate only after authenticated Business Session activity.
// Preserve server-issued expiry and scope verification.
const FINORA_WALLET_ROTATE_BEFORE_MS = 45 * 60_000;
const FINORA_WALLET_MAX_ROTATION_TTL_MS = 3_605_000;
const FINORA_WALLET_HEX64 = /^[a-f0-9]{64}$/i;

const finoraWalletRotationFlights = new WeakMap<
  object,
  {
    generation: number;
    task: Promise<FinoraWalletRotationOutcome>;
  }
>();

function sameFinoraWalletRotationScope(
  a: FinoraWalletRotationScope,
  b: FinoraWalletRotationScope,
): boolean {
  return (
    a.userId === b.userId &&
    a.ownerId === b.ownerId &&
    a.businessId === b.businessId &&
    a.branchId === b.branchId
  );
}

export async function rotateFinoraSenderWalletIfDue(
  sender: object,
  businessSessionId: string,
  expectedScope: FinoraWalletRotationScope,
  rotate: FinoraWalletRotationTransport,
): Promise<FinoraWalletRotationOutcome> {
  const wallet = sessions.get(sender);
  const generation = generations.get(sender) ?? 0;
  const now = Date.now();

  if (
    !wallet ||
    !FINORA_WALLET_HEX64.test(businessSessionId) ||
    typeof rotate !== "function" ||
    !expectedScope ||
    !sameFinoraWalletRotationScope(wallet.principal, expectedScope)
  ) {
    return {
      success: false,
      rotated: false,
      errorCode: "WALLET_ROTATION_NOT_AUTHORIZED",
    };
  }

  const remaining = wallet.expiresAtMs - now;

  if (remaining <= 0) {
    clearFinoraSenderWallet(sender);
    return {
      success: false,
      rotated: false,
      errorCode: "WALLET_SESSION_EXPIRED",
    };
  }

  if (remaining > FINORA_WALLET_ROTATE_BEFORE_MS) {
    return { success: true, rotated: false };
  }

  const existing = finoraWalletRotationFlights.get(sender);

  if (existing && existing.generation === generation) {
    return existing.task;
  }

  const task = (async (): Promise<FinoraWalletRotationOutcome> => {
    let result: FinoraWalletRotationResponse;

    try {
      result = await rotate({
        oldWalletToken: wallet.accessToken,
        businessSessionId,
        expectedScope,
      });
    } catch {
      return {
        success: false,
        rotated: false,
        errorCode: "WALLET_ROTATION_UNAVAILABLE",
      };
    }

    // Logout, account switching, expiry-driven cleanup and
    // a newer login must defeat an older network response.
    if (
      (generations.get(sender) ?? 0) !== generation ||
      sessions.get(sender) !== wallet ||
      Date.now() >= wallet.expiresAtMs
    ) {
      return {
        success: false,
        rotated: false,
        errorCode: "WALLET_ROTATION_SUPERSEDED",
      };
    }

    if (!result.success) {
      return {
        success: false,
        rotated: false,
        errorCode: result.errorCode,
      };
    }

    const expiry = Date.parse(result.expiresAt);
    const remainingAfterRotation = expiry - Date.now();

    if (
      !FINORA_WALLET_HEX64.test(result.accessToken) ||
      result.accessToken.toLowerCase() ===
        wallet.accessToken.toLowerCase() ||
      !sameFinoraWalletRotationScope(result.scope, expectedScope) ||
      !Number.isFinite(remainingAfterRotation) ||
      remainingAfterRotation <= 0 ||
      remainingAfterRotation > FINORA_WALLET_MAX_ROTATION_TTL_MS
    ) {
      return {
        success: false,
        rotated: false,
        errorCode: "INVALID_WALLET_ROTATION_RESPONSE",
      };
    }

    sessions.set(sender, {
      accessToken: result.accessToken,
      expiresAtMs: expiry,
      principal: { ...wallet.principal },
    });

    // No token, principal or Business Session ID is logged.
    return { success: true, rotated: true };
  })();

  finoraWalletRotationFlights.set(sender, {
    generation,
    task,
  });

  try {
    return await task;
  } finally {
    const flight = finoraWalletRotationFlights.get(sender);
    if (flight?.task === task) {
      finoraWalletRotationFlights.delete(sender);
    }
  }
}
