type Scope = Readonly<{
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}>;

export type WalletRotationRequest = Readonly<{
  oldWalletToken: string;
  businessSessionId: string;
  expectedScope: Scope;
}>;

export type WalletRotationResult =
  | {
      success: true;
      accessToken: string;
      expiresAt: string;
      scope: Scope;
    }
  | {
      success: false;
      errorCode:
        | "INVALID_ROTATION_INPUT"
        | "ROTATION_NOT_AUTHORIZED"
        | "ROTATION_UNAVAILABLE"
        | "INVALID_ROTATION_RESPONSE";
    };

const HEX64 = /^[a-f0-9]{64}$/i;
const MAX_TTL_MS = 3_605_000;
const TIMEOUT_MS = 15_000;

function validId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value.trim() === value &&
    !/[\r\n]/.test(value);
}

function validScope(value: unknown): value is Scope {
  if (!value || typeof value !== "object" ||
      Array.isArray(value)) return false;

  const v = value as Record<string, unknown>;

  return ["userId", "ownerId", "businessId", "branchId"]
    .every(key => validId(v[key]));
}

function sameScope(a: Scope, b: Scope): boolean {
  return a.userId === b.userId &&
    a.ownerId === b.ownerId &&
    a.businessId === b.businessId &&
    a.branchId === b.branchId;
}

function validBaseUrl(value: string): string | null {
  try {
    const url = new URL(value);

    const local =
      url.protocol === "http:" &&
      (url.hostname === "localhost" ||
       url.hostname === "127.0.0.1");

    if (
      url.protocol !== "https:" &&
      !local
    ) return null;

    if (url.username || url.password ||
        url.search || url.hash ||
        url.pathname !== "/") return null;

    return url.origin;
  } catch {
    return null;
  }
}

/*
 * Electron main-process transport only.
 * The caller must first prove a successful authenticated
 * in-app activity touch. This client does not schedule
 * requests and does not keep passwords or tokens.
 *
 * Returned tokens must be installed only by a separate
 * same-generation, same-scope wallet memory guard.
 */
export function createFinoraWalletRotationClient(
  baseUrl: string,
  transport: typeof fetch = globalThis.fetch,
) {
  const base = validBaseUrl(baseUrl);

  if (!base || typeof transport !== "function") {
    throw new Error("INVALID_WALLET_ROTATION_TRANSPORT");
  }

  return async function rotate(
    request: WalletRotationRequest,
  ): Promise<WalletRotationResult> {
    if (
      !request ||
      typeof request.oldWalletToken !== "string" ||
      !HEX64.test(request.oldWalletToken) ||
      typeof request.businessSessionId !== "string" ||
      !HEX64.test(request.businessSessionId) ||
      !validScope(request.expectedScope)
    ) {
      return {
        success: false,
        errorCode: "INVALID_ROTATION_INPUT",
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      TIMEOUT_MS,
    );

    try {
      const response = await transport(
        `${base}/owner/wallet/session/rotate`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            authorization:
              `Bearer ${request.oldWalletToken}`,
            "x-finora-business-session":
              request.businessSessionId,
          },
          body: "{}",
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        return {
          success: false,
          errorCode: response.status === 401 ||
            response.status === 403
            ? "ROTATION_NOT_AUTHORIZED"
            : "ROTATION_UNAVAILABLE",
        };
      }

      const raw = await response.text();

      if (raw.length > 8192) {
        return {
          success: false,
          errorCode: "INVALID_ROTATION_RESPONSE",
        };
      }

      let body: unknown;

      try {
        body = JSON.parse(raw);
      } catch {
        return {
          success: false,
          errorCode: "INVALID_ROTATION_RESPONSE",
        };
      }

      if (!body || typeof body !== "object" ||
          Array.isArray(body)) {
        return {
          success: false,
          errorCode: "INVALID_ROTATION_RESPONSE",
        };
      }

      const data = body as Record<string, unknown>;

      if (
        data.ok !== true ||
        typeof data.accessToken !== "string" ||
        !HEX64.test(data.accessToken) ||
        data.accessToken.toLowerCase() ===
          request.oldWalletToken.toLowerCase() ||
        !validScope(data.scope) ||
        !sameScope(data.scope, request.expectedScope) ||
        typeof data.expiresAt !== "string"
      ) {
        return {
          success: false,
          errorCode: "INVALID_ROTATION_RESPONSE",
        };
      }

      const remaining =
        Date.parse(data.expiresAt) - Date.now();

      if (!Number.isFinite(remaining) ||
          remaining <= 0 ||
          remaining > MAX_TTL_MS) {
        return {
          success: false,
          errorCode: "INVALID_ROTATION_RESPONSE",
        };
      }

      return {
        success: true,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
        scope: {
          userId: data.scope.userId,
          ownerId: data.scope.ownerId,
          businessId: data.scope.businessId,
          branchId: data.scope.branchId,
        },
      };
    } catch {
      return {
        success: false,
        errorCode: "ROTATION_UNAVAILABLE",
      };
    } finally {
      clearTimeout(timer);
    }
  };
}