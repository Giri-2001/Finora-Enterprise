import {
  validateFinoraBranchLoginSession,
} from "./finoraBranchLoginSessionAuthority";

export interface FinoraVerifiedLocalWalletScope {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export async function resolveFinoraVerifiedLocalWalletScope(
  sessionId: string,
): Promise<FinoraVerifiedLocalWalletScope | null> {
  try {
    if (
      typeof sessionId !== "string" ||
      !sessionId.startsWith("FINORA-SESSION-")
    ) {
      return null;
    }

    const result = await validateFinoraBranchLoginSession({
      sessionId,
    });

    if (!result.success) return null;

    const session = result.data;

    if (
      session.sessionId !== sessionId ||
      session.role !== "OWNER" ||
      session.dataContext !== "REAL" ||
      !(
        session.accessMode === "ACTIVE" ||
        session.accessMode === "REGISTERED_EXPIRED_READ_ONLY"
      )
    ) {
      return null;
    }

    const fields = [
      session.userId,
      session.ownerId,
      session.businessId,
      session.branchId,
    ];

    if (
      !fields.every(
        value =>
          typeof value === "string" &&
          value.length > 0 &&
          value.length <= 128
      )
    ) {
      return null;
    }

    return Object.freeze({
      userId: session.userId,
      ownerId: session.ownerId,
      businessId: session.businessId,
      branchId: session.branchId,
    });
  } catch {
    return null;
  }
}