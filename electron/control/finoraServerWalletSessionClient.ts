const FINORA_WALLET_API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3000"
    : "https://api.finoraenterprise.com";
// Main-process only. Never expose this result directly through renderer IPC.
// Caller must keep token in memory and associate it with verified branch scope.
import {
  signFinoraOwnerWalletProofV1,
} from "./finoraOwnerWalletProofCrypto.js";
import type {
  FinoraOwnerWalletProofChallengeV1,
  FinoraOwnerWalletProofKeyMaterialV1,
} from "./finoraOwnerWalletProofCrypto.js";

type Scope = Omit<FinoraOwnerWalletProofChallengeV1, "challenge" | "keyId">;
type Credentials = { username: string; password: string };
type ErrorCode =
  | "INVALID_REQUEST"
  | "SERVER_REJECTED"
  | "RATE_LIMITED"
  | "SERVER_UNAVAILABLE"
  | "INVALID_SERVER_RESPONSE";

export type FinoraServerWalletSessionResult =
  | {
      success: true;
      data: {
        accessToken: string;
        expiresAt: string;
        scope: Scope;
        keyId: string;
      };
    }
  | { success: false; errorCode: ErrorCode };

const BASE = `${FINORA_WALLET_API_BASE}`;
const FIELDS = [
  "userId", "ownerId", "businessId", "branchId", "credentialId",
] as const;

function hex(value: unknown): value is string {
  return typeof value === "string" && value.length === 64 &&
    !/[^a-f0-9]/.test(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 &&
    value.length <= 128 && value.trim() === value && !/[\r\n]/.test(value);
}
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function expiry(value: unknown, maximumMs: number): value is string {
  if (typeof value !== "string") return false;
  const remaining = Date.parse(value) - Date.now();
  return Number.isFinite(remaining) && remaining > 0 && remaining <= maximumMs;
}

export function createFinoraServerWalletSessionClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("WALLET_SESSION_TRANSPORT_INVALID");
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
      if (response.status === 429) {
        return { success: false, errorCode: "RATE_LIMITED" };
      }
      if ([400, 401, 403].includes(response.status)) {
        return { success: false, errorCode: "SERVER_REJECTED" };
      }
      if (response.status !== 200) {
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

  return async function login(
    credentials: Credentials,
    expectedScope: Scope,
    material: FinoraOwnerWalletProofKeyMaterialV1,
  ): Promise<FinoraServerWalletSessionResult> {
    let scope: Scope;
    try {
      if (
        !credentials || typeof credentials.username !== "string" ||
        credentials.username.length > 128 ||
        !text(credentials.username.trim()) ||
        /[\u0000-\u001f\u007f]/.test(credentials.username) ||
        typeof credentials.password !== "string" ||
        credentials.password.length === 0 ||
        Buffer.byteLength(credentials.password, "utf8") > 72 ||
        !expectedScope ||
        !FIELDS.every(field => text(expectedScope[field])) ||
        !Number.isSafeInteger(expectedScope.authGeneration) ||
        expectedScope.authGeneration < 1 ||
        typeof material?.keyId !== "string" ||
        material.keyId.length !== 36
      ) {
        return { success: false, errorCode: "INVALID_REQUEST" };
      }

      // Snapshot explicit trusted fields before asynchronous network work.
      scope = {
        userId: expectedScope.userId,
        ownerId: expectedScope.ownerId,
        businessId: expectedScope.businessId,
        branchId: expectedScope.branchId,
        credentialId: expectedScope.credentialId,
        authGeneration: expectedScope.authGeneration,
      };
      signFinoraOwnerWalletProofV1({
        ...scope, challenge: "0".repeat(64), keyId: material.keyId,
      }, material);
    } catch {
      return { success: false, errorCode: "INVALID_REQUEST" };
    }

    const challengeResult = await post("/owner/wallet/proof/challenge", {
      username: credentials.username.trim(),
      password: credentials.password,
    });
    if (!challengeResult.success) return challengeResult;

    const challenge = challengeResult.body;
    if (
      !hex(challenge.challenge) ||
      !hex(challenge.authTicket) ||
      challenge.credentialId !== scope.credentialId ||
      challenge.authGeneration !== scope.authGeneration ||
      !expiry(challenge.expiresAt, 125_000)
    ) {
      return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
    }

    let signature: string;
    try {
      signature = signFinoraOwnerWalletProofV1({
        ...scope,
        challenge: challenge.challenge,
        keyId: material.keyId,
      }, material);
    } catch {
      return { success: false, errorCode: "INVALID_REQUEST" };
    }

    const session = await post("/owner/wallet/proof/session", {
      challenge: challenge.challenge,
      authTicket: challenge.authTicket,
      keyId: material.keyId.toLowerCase(),
      signature,
    });
    if (!session.success) return session;

    const result = session.body;
    if (
      result.tokenType !== "Bearer" ||
      !hex(result.accessToken) ||
      !expiry(result.expiresAt, 1_805_000)
    ) {
      return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
    }

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
        scope,
        keyId: material.keyId.toLowerCase(),
      },
    };
  };
}