/*
 * FINORA P1-566BC
 * Main Login -> Server Wallet session client.
 *
 * ELECTRON MAIN PROCESS ONLY.
 *
 * No renderer identity authority.
 * No permanent USB or device binding.
 * No token persistence or logging.
 * No local Wallet balance fallback.
 */

type Scope = {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
};

type Credentials = {
  username: string;
  password: string;
  securityCode: string;
};

type WalletSession = {
  accessToken: string;
  expiresAt: string;
  scope: Scope;
};

type Result =
  | {
      success: true;
      data: WalletSession;
    }
  | {
      success: false;
      errorCode:
        | "INVALID_REQUEST"
        | "SERVER_REJECTED"
        | "RATE_LIMITED"
        | "SERVER_UNAVAILABLE"
        | "SCOPE_MISMATCH"
        | "INVALID_SERVER_RESPONSE";
    };

function record(
  value: unknown,
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function identifier(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function validScope(
  value: unknown,
): value is Scope {
  const data = record(value);

  return !!data &&
    identifier(data.userId) &&
    identifier(data.ownerId) &&
    identifier(data.businessId) &&
    identifier(data.branchId);
}

function equalScope(
  a: Scope,
  b: Scope,
): boolean {
  return (
    a.userId === b.userId &&
    a.ownerId === b.ownerId &&
    a.businessId === b.businessId &&
    a.branchId === b.branchId
  );
}

function validCredentials(
  value: Credentials,
): boolean {
  return (
    !!value &&
    identifier(value.username) &&
    typeof value.password === "string" &&
    value.password.length > 0 &&
    value.password.length <= 128 &&
    typeof value.securityCode === "string" &&
    value.securityCode.length > 0 &&
    value.securityCode.length <= 128
  );
}

export function createFinoraMainLoginWalletSessionClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("WALLET_TRANSPORT_INVALID");
  }

  const base =
    process.env.FINORA_LOCAL_WALLET_TEST === "1"
      ? "http://127.0.0.1:3000"
      : "https://api.finoraenterprise.com";

  return async function authorize(
    credentials: Credentials,
    expectedScope: Scope,
  ): Promise<Result> {
    if (
      !validCredentials(credentials) ||
      !validScope(expectedScope)
    ) {
      return {
        success: false,
        errorCode: "INVALID_REQUEST",
      };
    }

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      15000,
    );

    try {
      const response = await transport(
        `${base}/owner/wallet/main-login/session`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            securityCode: credentials.securityCode,
          }),
          redirect: "error",
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        },
      );

      if (response.status === 429) {
        return {
          success: false,
          errorCode: "RATE_LIMITED",
        };
      }

      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 403
      ) {
        return {
          success: false,
          errorCode: "SERVER_REJECTED",
        };
      }

      if (response.status !== 200) {
        return {
          success: false,
          errorCode: "SERVER_UNAVAILABLE",
        };
      }

      const contentType =
        response.headers.get("content-type");

      if (
        contentType?.split(";")[0].trim().toLowerCase() !==
        "application/json"
      ) {
        return {
          success: false,
          errorCode: "INVALID_SERVER_RESPONSE",
        };
      }

      const body = record(
        await response.json(),
      );

      if (
        !body ||
        body.ok !== true ||
        body.tokenType !== "Bearer" ||
        typeof body.accessToken !== "string" ||
        !/^[a-f0-9]{64}$/i.test(body.accessToken) ||
        !validScope(body.scope) ||
        typeof body.expiresAt !== "string"
      ) {
        return {
          success: false,
          errorCode: "INVALID_SERVER_RESPONSE",
        };
      }

      const remaining =
        Date.parse(body.expiresAt) - Date.now();

      if (
        !Number.isFinite(remaining) ||
        remaining <= 0 ||
        remaining > 1805000
      ) {
        return {
          success: false,
          errorCode: "INVALID_SERVER_RESPONSE",
        };
      }

      if (
        !equalScope(
          body.scope,
          expectedScope,
        )
      ) {
        return {
          success: false,
          errorCode: "SCOPE_MISMATCH",
        };
      }

      return {
        success: true,
        data: {
          accessToken: body.accessToken,
          expiresAt: body.expiresAt,
          scope: {
            userId: body.scope.userId,
            ownerId: body.scope.ownerId,
            businessId: body.scope.businessId,
            branchId: body.scope.branchId,
          },
        },
      };
    } catch {
      return {
        success: false,
        errorCode: "SERVER_UNAVAILABLE",
      };
    } finally {
      clearTimeout(timeout);
    }
  };
}