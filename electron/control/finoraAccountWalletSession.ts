import {
  authenticateFinoraAccountPassword,
} from "./finoraAccountPasswordLoginClient.js";

/*
 * FINORA_P1_678G_ACCOUNT_WALLET_SESSION
 *
 * Main-process memory only.
 * Never expose bearer tokens to Renderer or persistent storage.
 * Account Wallet authentication grants no Reception permissions.
 */

type AccountWalletSession = {
  accessToken: string;
  expiresAtMs: number;
};

let current: AccountWalletSession | null = null;

// FINORA_P1_696Z_WALLET_GENERATION
// Invalidates stale network responses after a new login or logout.
let walletGeneration = 0;

export function clearFinoraAccountWalletSession(): void {
  walletGeneration += 1;
  current = null;
}

export async function establishFinoraAccountWalletSession(
  username: string,
  password: string,
): Promise<{
  success: boolean;
  errorCode?: string;
}> {
  clearFinoraAccountWalletSession();
  const requestGeneration = walletGeneration;

  const result =
    await authenticateFinoraAccountPassword(
      username,
      password,
    );

  // Never accept credentials returned for an older login attempt.
  if (requestGeneration !== walletGeneration) {
    return {
      success: false,
      errorCode: "LOGIN_SUPERSEDED",
    };
  }

  if (
    !result.success ||
    !result.accessToken ||
    !result.expiresAt
  ) {
    return {
      success: false,
      errorCode: result.errorCode ?? "AUTHENTICATION_FAILED",
    };
  }

  const expiry = Date.parse(result.expiresAt);

  if (
    !Number.isFinite(expiry) ||
    expiry <= Date.now()
  ) {
    return {
      success: false,
      errorCode: "INVALID_SESSION_EXPIRY",
    };
  }

  current = {
    accessToken: result.accessToken,
    expiresAtMs: expiry,
  };

  return { success: true };
}

export function getFinoraAccountWalletAuthorization():
  string | null {
  if (
    !current ||
    Date.now() >= current.expiresAtMs
  ) {
    clearFinoraAccountWalletSession();
    return null;
  }

  return `Bearer ${current.accessToken}`;
}