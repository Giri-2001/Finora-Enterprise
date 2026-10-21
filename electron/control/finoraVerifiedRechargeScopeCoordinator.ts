/*
 * FINORA_P1_611T_VERIFIED_RECHARGE_SCOPE
 * Main-process-only, read-only authority resolution.
 * No renderer identities, tokens, recharge POST or balance writes.
 */

export type VerifiedRechargeScope = {
  ownerId: string;
  businessId: string;
  branchId: string;
  walletId: string;
  sessionRevision: number;
};

type VerifiedIdentity = Omit<VerifiedRechargeScope, "walletId"> & {
  sessionRevision: number;
};

type IdentityResult =
  | { success: true; data: VerifiedIdentity }
  | { success: false; errorCode: string };

type WalletResult =
  | {
      success: true;
      data: {
        source: "POSTGRESQL_WALLETS";
        walletId: string;
        currency: "INR";
      };
    }
  | { success: false; errorCode: string };

const validId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 128 &&
  value.trim() === value &&
  !/[\u0000-\u001f\u007f]/.test(value);

function matchingIdentity(
  first: VerifiedIdentity,
  second: VerifiedIdentity,
): boolean {
  return first.ownerId === second.ownerId &&
    first.businessId === second.businessId &&
    first.branchId === second.branchId &&
    first.sessionRevision === second.sessionRevision;
}

export function createFinoraVerifiedRechargeScopeCoordinator(
  dependencies: {
    verifiedScope: () => Promise<IdentityResult>;
    serverBalance: () => Promise<WalletResult>;
  },
) {
  if (
    typeof dependencies?.verifiedScope !== "function" ||
    typeof dependencies?.serverBalance !== "function"
  ) {
    throw new Error("RECHARGE_SCOPE_DEPENDENCIES_INVALID");
  }

  async function resolve(): Promise<
    | { success: true; data: VerifiedRechargeScope }
    | { success: false; errorCode: string }
  > {
    try {
      const before = await dependencies.verifiedScope();

      if (before.success !== true) {
        return { success: false, errorCode: "UNAUTHORIZED" };
      }

      const identity = before.data;

      if (
        !validId(identity?.ownerId) ||
        !validId(identity?.businessId) ||
        !validId(identity?.branchId) ||
        !Number.isSafeInteger(identity?.sessionRevision) ||
        identity.sessionRevision < 0
      ) {
        return { success: false, errorCode: "INVALID_VERIFIED_SCOPE" };
      }

      const balance = await dependencies.serverBalance();

      if (
        balance.success !== true ||
        balance.data?.source !== "POSTGRESQL_WALLETS" ||
        balance.data.currency !== "INR" ||
        !/^[0-9]{8,12}$/.test(balance.data.walletId)
      ) {
        return {
          success: false,
          errorCode: "VERIFIED_WALLET_UNAVAILABLE",
        };
      }

      // Revalidate after the asynchronous server balance request.
      const after = await dependencies.verifiedScope();

      if (
        after.success !== true ||
        !matchingIdentity(identity, after.data)
      ) {
        return { success: false, errorCode: "STALE_OPERATION" };
      }

      return {
        success: true,
        data: {
          ownerId: identity.ownerId,
          businessId: identity.businessId,
          branchId: identity.branchId,
          walletId: balance.data.walletId,
          sessionRevision: identity.sessionRevision,
        },
      };
    } catch {
      return {
        success: false,
        errorCode: "VERIFIED_WALLET_UNAVAILABLE",
      };
    }
  }

  return Object.freeze({ resolve });
}