// Main-process only.
// A signed bootstrap supplies expected identity, not a wallet session.
// Current credentials, lineage and branch status must still pass server login.
import {
  verifyFinoraServerFirstLoginSignedBootstrap,
} from "./finoraServerFirstLoginBootstrapVerifier.js";
import type {
  FinoraServerWalletSessionResult,
} from "./finoraServerWalletSessionClient.js";

type Session = Extract<FinoraServerWalletSessionResult, { success: true }>;
type Scope = Session["data"]["scope"];
type Verifier = typeof verifyFinoraServerFirstLoginSignedBootstrap;
type Result =
  | { success: true; data: { scope: Scope; canonicalUsername: string } }
  | { success: false; errorCode: "WALLET_IDENTITY_UNVERIFIED" };

const fields = [
  "userId", "ownerId", "businessId", "branchId", "credentialId",
] as const;

function identifier(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 && value.length <= 128 &&
    value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}

export function createFinoraServerWalletTrustedScopeResolver(
  // Internal dependency for tests only; never select it through IPC.
  verify: Verifier = verifyFinoraServerFirstLoginSignedBootstrap,
) {
  if (typeof verify !== "function") {
    throw new Error("WALLET_IDENTITY_VERIFIER_INVALID");
  }

  return function resolve(signedBootstrap: unknown): Result {
    const denied: Result = {
      success: false,
      errorCode: "WALLET_IDENTITY_UNVERIFIED",
    };

    try {
      const verified = verify(signedBootstrap);
      const payload = verified?.payload;
      if (
        !payload ||
        payload.role !== "OWNER" ||
        payload.dataContext !== "REAL" ||
        !fields.every(field => identifier(payload[field])) ||
        !Number.isSafeInteger(payload.authGeneration) ||
        payload.authGeneration < 1 ||
        !identifier(payload.canonicalUsername) ||
        typeof payload.username !== "string" ||
        payload.username.length > 128 ||
        /[\u0000-\u001f\u007f]/.test(payload.username) ||
        payload.username.trim().normalize("NFKC").toLowerCase() !==
          payload.canonicalUsername ||
        payload.mustChangePassword !== false ||
        payload.mustChangeSecurityCode !== false
      ) {
        return denied;
      }

      // No storage-mode or current subscription-expiry gate here.
      // This helper grants neither business entitlement nor wallet access.
      return {
        success: true,
        data: {
          scope: {
            userId: payload.userId,
            ownerId: payload.ownerId,
            businessId: payload.businessId,
            branchId: payload.branchId,
            credentialId: payload.credentialId,
            authGeneration: payload.authGeneration,
          },
          canonicalUsername: payload.canonicalUsername,
        },
      };
    } catch {
      return denied;
    }
  };
}