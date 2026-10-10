const FINORA_WALLET_API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3000"
    : "https://api.finoraenterprise.com";
// Main-process only. A failed request does not establish server revocation.
export type FinoraServerWalletLogoutResult =
  | { success: true; data: { revoked: boolean } }
  | {
      success: false;
      errorCode:
        | "INVALID_REQUEST"
        | "UNAUTHORIZED"
        | "SERVER_UNAVAILABLE"
        | "INVALID_SERVER_RESPONSE";
    };

export function createFinoraServerWalletLogoutClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("WALLET_LOGOUT_TRANSPORT_INVALID");
  }

  return async function logout(
    accessToken: string,
  ): Promise<FinoraServerWalletLogoutResult> {
    if (
      typeof accessToken !== "string" ||
      accessToken.length !== 64 || /[^a-f0-9]/.test(accessToken)
    ) return { success: false, errorCode: "INVALID_REQUEST" };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await transport(
        `${FINORA_WALLET_API_BASE}/owner/wallet/logout`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          redirect: "error",
          credentials: "omit",
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (response.status === 401) {
        return { success: false, errorCode: "UNAUTHORIZED" };
      }
      if (response.status !== 200) {
        return { success: false, errorCode: "SERVER_UNAVAILABLE" };
      }
      if (
        response.headers.get("content-type")?.split(";")[0].trim().toLowerCase()
          !== "application/json"
      ) return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };

      let value: unknown;
      try {
        value = await response.json();
      } catch {
        return {
          success: false,
          errorCode: controller.signal.aborted
            ? "SERVER_UNAVAILABLE" : "INVALID_SERVER_RESPONSE",
        };
      }

      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }
      const body = value as Record<string, unknown>;
      if (body.ok !== true || typeof body.revoked !== "boolean") {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }

      return { success: true, data: { revoked: body.revoked } };
    } catch {
      return { success: false, errorCode: "SERVER_UNAVAILABLE" };
    } finally {
      clearTimeout(timer);
    }
  };
}