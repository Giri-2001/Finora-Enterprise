const FINORA_WALLET_API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3000"
    : "https://api.finoraenterprise.com";
// Main-process only. No renderer-selected URL or transport.
// Server identity is a snapshot for key selection, not a signed bootstrap,
// enrollment authorization, business entitlement or wallet session.

export type FinoraServerWalletIdentity = {
  scope: {
    userId: string;
    ownerId: string;
    businessId: string;
    branchId: string;
    credentialId: string;
    authGeneration: number;
  };
  canonicalUsername: string;
};

type Credentials = {
  username: string;
  password: string;
  securityCode: string;
};

type ErrorCode =
  | "INVALID_REQUEST"
  | "SERVER_REJECTED"
  | "RATE_LIMITED"
  | "SERVER_UNAVAILABLE"
  | "INVALID_SERVER_RESPONSE";

export type FinoraServerWalletIdentityResult =
  | { success: true; data: FinoraServerWalletIdentity }
  | { success: false; errorCode: ErrorCode };

const ENDPOINT = `${FINORA_WALLET_API_BASE}/owner/wallet/identity`;

function validId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 && value.length <= 128 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function fail(errorCode: ErrorCode): FinoraServerWalletIdentityResult {
  return { success: false, errorCode };
}

export function createFinoraServerWalletIdentityClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("WALLET_IDENTITY_TRANSPORT_INVALID");
  }

  return async function identify(
    input: Credentials,
  ): Promise<FinoraServerWalletIdentityResult> {
    if (
      !input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).length !== 3 ||
      !["username", "password", "securityCode"].every(
        field => Object.hasOwn(input, field),
      ) ||
      typeof input.username !== "string" ||
      input.username.length > 128 ||
      !validId(input.username.trim()) ||
      /[\u0000-\u001f\u007f]/.test(input.username) ||
      ![input.password, input.securityCode].every(value =>
        typeof value === "string" && value.length > 0 &&
        Buffer.byteLength(value, "utf8") <= 72
      )
    ) return fail("INVALID_REQUEST");

    const supplied = {
      username: input.username.trim(),
      password: input.password,
      securityCode: input.securityCode,
    };
    const expectedUsername = supplied.username.normalize("NFKC").toLowerCase();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await transport(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(supplied),
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });

      if (response.status === 429) return fail("RATE_LIMITED");
      if ([400, 401, 403].includes(response.status)) return fail("SERVER_REJECTED");
      if (response.status !== 200) return fail("SERVER_UNAVAILABLE");

      const mediaType = response.headers.get("content-type")
        ?.split(";")[0].trim().toLowerCase();
      if (mediaType !== "application/json") {
        return fail("INVALID_SERVER_RESPONSE");
      }

      const text = await response.text();
      if (Buffer.byteLength(text, "utf8") > 16384) {
        return fail("INVALID_SERVER_RESPONSE");
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        return fail("INVALID_SERVER_RESPONSE");
      }

      const identity = result?.identity;
      if (
        result?.ok !== true ||
        !identity || typeof identity !== "object" || Array.isArray(identity) ||
        !["userId", "ownerId", "businessId", "branchId", "credentialId"]
          .every(field => validId(identity[field])) ||
        !Number.isSafeInteger(identity.authGeneration) ||
        identity.authGeneration < 1 ||
        !validId(identity.canonicalUsername) ||
        identity.canonicalUsername !== expectedUsername
      ) return fail("INVALID_SERVER_RESPONSE");

      return {
        success: true,
        data: {
          scope: {
            userId: identity.userId,
            ownerId: identity.ownerId,
            businessId: identity.businessId,
            branchId: identity.branchId,
            credentialId: identity.credentialId,
            authGeneration: identity.authGeneration,
          },
          canonicalUsername: identity.canonicalUsername,
        },
      };
    } catch {
      return fail("SERVER_UNAVAILABLE");
    } finally {
      clearTimeout(timer);
    }
  };
}