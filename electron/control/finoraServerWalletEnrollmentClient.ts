const FINORA_WALLET_API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3000"
    : "https://api.finoraenterprise.com";
// Main process only. No private key or session is returned to the renderer.
import {
  signFinoraOwnerWalletEnrollmentV1,
} from "./finoraOwnerWalletEnrollmentCrypto.js";
import type {
  FinoraOwnerWalletProofChallengeV1,
  FinoraOwnerWalletProofKeyMaterialV1,
} from "./finoraOwnerWalletProofCrypto.js";

type Scope = Omit<FinoraOwnerWalletProofChallengeV1, "challenge" | "keyId">;
type Credentials = {
  username: string;
  password: string;
  securityCode: string;
};
type ErrorCode =
  | "INVALID_REQUEST"
  | "SERVER_REJECTED"
  | "RATE_LIMITED"
  | "KEY_CONFLICT"
  | "SERVER_UNAVAILABLE"
  | "INVALID_SERVER_RESPONSE";

type Result =
  | { success: true; data: { keyId: string; enrolledAt: string } }
  | { success: false; errorCode: ErrorCode };

const BASE = `${FINORA_WALLET_API_BASE}`;
const SCOPE_FIELDS = [
  "userId", "ownerId", "businessId", "branchId", "credentialId",
] as const;

const fail = (errorCode: ErrorCode): Result => ({
  success: false, errorCode,
});

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function uuid(value: unknown): value is string {
  return typeof value === "string" && value.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
function hex(value: unknown): value is string {
  return typeof value === "string" && value.length === 64 &&
    !/[^a-f0-9]/.test(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 &&
    value.length <= 128 && value.trim() === value &&
    !/[\r\n]/.test(value);
}

// expectedScope must come from trusted main-process verified identity.
// Never accept it directly from a renderer enrollment request.
export function createFinoraServerWalletEnrollmentClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("ENROLLMENT_TRANSPORT_INVALID");
  }

  async function post(path: string, body: Record<string, unknown>): Promise<
    { success: true; body: Record<string, unknown> } |
    { success: false; errorCode: ErrorCode }
  > {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await transport(BASE + path, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
        redirect: "error",
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 429) return { success: false, errorCode: "RATE_LIMITED" };
      if (response.status === 409) return { success: false, errorCode: "KEY_CONFLICT" };
      if ([400, 401, 403].includes(response.status)) {
        return { success: false, errorCode: "SERVER_REJECTED" };
      }
      const expectedStatus = path.endsWith("/start") ? 201 : 200;
      if (response.status !== expectedStatus) {
        return { success: false, errorCode: "SERVER_UNAVAILABLE" };
      }
      if (
        response.headers.get("content-type")?.split(";")[0].trim().toLowerCase()
          !== "application/json"
      ) {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }
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
      const parsed = object(value);
      if (!parsed || parsed.ok !== true) {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }
      return { success: true, body: parsed };
    } catch {
      return { success: false, errorCode: "SERVER_UNAVAILABLE" };
    } finally {
      clearTimeout(timer);
    }
  }

  return async function enroll(
    credentials: Credentials,
    expectedScope: Scope,
    material: FinoraOwnerWalletProofKeyMaterialV1,
  ): Promise<Result> {
    try {
      if (
        !credentials || typeof credentials.username !== "string" ||
        !text(credentials.username.trim()) ||
        credentials.username.length > 128 ||
        /[\u0000-\u001f\u007f]/.test(credentials.username) ||
        ![credentials.password, credentials.securityCode].every(
          value => typeof value === "string" && value.length > 0 &&
            Buffer.byteLength(value, "utf8") <= 72,
        ) ||
        !expectedScope ||
        !SCOPE_FIELDS.every(field => text(expectedScope[field])) ||
        !Number.isSafeInteger(expectedScope.authGeneration) ||
        expectedScope.authGeneration < 1 ||
        !uuid(material?.keyId) ||
        !hex(material?.publicKeySha256)
      ) {
        return fail("INVALID_REQUEST");
      }

      // Validate key pairing and signing capability before transmitting credentials.
      signFinoraOwnerWalletEnrollmentV1({
        ...expectedScope, challenge: "0".repeat(64), keyId: material.keyId,
      }, material);
    } catch {
      return fail("INVALID_REQUEST");
    }

    const started = await post("/owner/wallet/enrollment/start", {
      username: credentials.username.trim(),
      password: credentials.password,
      securityCode: credentials.securityCode,
      keyId: material.keyId.toLowerCase(),
      publicKeySpkiDerBase64: material.publicKeySpkiDerBase64,
    });
    if (!started.success) return started;

    const grant = started.body;
    const expiry = typeof grant.expiresAt === "string"
      ? Date.parse(grant.expiresAt) : NaN;
    const remaining = expiry - Date.now();

    if (
      !uuid(grant.enrollmentAuthorizationId) ||
      !hex(grant.challenge) ||
      grant.keyId !== material.keyId.toLowerCase() ||
      grant.publicKeySha256 !== material.publicKeySha256 ||
      !SCOPE_FIELDS.every(field => grant[field] === expectedScope[field]) ||
      grant.authGeneration !== expectedScope.authGeneration ||
      !Number.isFinite(remaining) || remaining <= 0 || remaining > 125_000
    ) {
      return fail("INVALID_SERVER_RESPONSE");
    }

    let signatureBase64: string;
    try {
      signatureBase64 = signFinoraOwnerWalletEnrollmentV1({
        ...expectedScope,
        challenge: grant.challenge,
        keyId: material.keyId,
      }, material);
    } catch {
      return fail("INVALID_REQUEST");
    }

    const redeemed = await post("/owner/wallet/enrollment/redeem", {
      challenge: grant.challenge,
      enrollmentAuthorizationId: grant.enrollmentAuthorizationId,
      keyId: material.keyId.toLowerCase(),
      publicKeySpkiDerBase64: material.publicKeySpkiDerBase64,
      publicKeySha256: material.publicKeySha256,
      signatureBase64,
    });
    if (!redeemed.success) return redeemed;

    const result = redeemed.body;
    if (
      result.keyId !== material.keyId.toLowerCase() ||
      typeof result.enrolledAt !== "string" ||
      !Number.isFinite(Date.parse(result.enrolledAt))
    ) {
      return fail("INVALID_SERVER_RESPONSE");
    }

    return {
      success: true,
      data: { keyId: result.keyId, enrolledAt: result.enrolledAt },
    };
  };
}