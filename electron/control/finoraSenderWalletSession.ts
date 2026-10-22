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