// FINORA P1-573W
// Server-password-authenticated scope discovery for the proof gateway.
// Challenge issuance is NOT session authorization.
// Never return an authentication ticket or bearer token to the renderer.

type Credentials = {
  username: string;
  password: string;
};

type FullScope = {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  credentialId: string;
  authGeneration: number;
};

const API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3001"
    : "https://api.finoraenterprise.com";

const FIELDS = [
  "userId",
  "ownerId",
  "businessId",
  "branchId",
  "credentialId",
] as const;

function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function verifiedScope(value: unknown): FullScope | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) return null;

  const scope = value as Record<string, unknown>;

  if (
    !FIELDS.every(field => validId(scope[field])) ||
    !Number.isSafeInteger(scope.authGeneration) ||
    typeof scope.authGeneration !== "number" ||
    scope.authGeneration < 1
  ) return null;

  return {
    userId: scope.userId as string,
    ownerId: scope.ownerId as string,
    businessId: scope.businessId as string,
    branchId: scope.branchId as string,
    credentialId: scope.credentialId as string,
    authGeneration: scope.authGeneration,
  };
}

export function createFinoraWalletChallengeScopeResolver(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("WALLET_SCOPE_TRANSPORT_INVALID");
  }

  return async function resolveServerVerifiedScope(
    credentials: Credentials,
  ): Promise<FullScope | null> {
    if (
      !credentials ||
      typeof credentials.username !== "string" ||
      !validId(credentials.username.trim()) ||
      typeof credentials.password !== "string" ||
      credentials.password.length === 0 ||
      credentials.password.length > 128
    ) return null;

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      15000,
    );

    try {
      const response = await transport(
        `${API_BASE}/owner/wallet/proof/challenge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            username: credentials.username.trim(),
            password: credentials.password,
          }),
          credentials: "omit",
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        },
      );

      // FINORA_P575A_RESOLVER_DIAGNOSTIC
      // No credentials, identifiers, tickets or response bodies logged.
      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.warn(
          "[FINORA WALLET SCOPE HTTP]",
          JSON.stringify({
            status: response.status,
            localTest:
              process.env.FINORA_LOCAL_WALLET_TEST === "1",
          }),
        );
      }

      if (response.status !== 200) return null;

      const mediaType = response.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase();

      if (mediaType !== "application/json") return null;

      const raw = await response.text();

      if (Buffer.byteLength(raw, "utf8") > 16384) {
        return null;
      }

      const body: unknown = JSON.parse(raw);

      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) return null;

      const data = body as Record<string, unknown>;

      if (data.ok !== true) return null;

      const scope = verifiedScope(data.scope);

      if (!scope) {
        if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
          console.warn(
            "[FINORA WALLET SCOPE CHECK]",
            JSON.stringify({ stage: "RESPONSE_SCOPE_INVALID" }),
          );
        }
        return null;
      }

      // Challenge lineage and scope must agree.
      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.warn(
          "[FINORA WALLET SCOPE CHECK]",
          JSON.stringify({ stage: "SCOPE_FIELDS_VALID" }),
        );
      }

      if (
        data.credentialId !== scope.credentialId ||
        data.authGeneration !== scope.authGeneration ||
        typeof data.challenge !== "string" ||
        !/^[a-f0-9]{64}$/.test(data.challenge) ||
        typeof data.authTicket !== "string" ||
        !/^[a-f0-9]{64}$/.test(data.authTicket) ||
        typeof data.expiresAt !== "string"
      ) return null;

      const expires = Date.parse(data.expiresAt);

      if (
        !Number.isFinite(expires) ||
        expires <= Date.now() ||
        expires - Date.now() > 300000
      ) return null;

      // This preliminary challenge remains unredeemed.
      // The existing proof client must perform its own fresh
      // password-authenticated challenge and signed redemption.
      return scope;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
}