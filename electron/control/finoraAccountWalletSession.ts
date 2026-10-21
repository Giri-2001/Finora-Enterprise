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

export function clearFinoraAccountWalletSession(): void {
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

  const result =
    await authenticateFinoraAccountPassword(
      username,
      password,
    );

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