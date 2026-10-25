import { randomBytes } from "node:crypto";

export type FinoraServerReceptionStorageMode =
  | "LOCAL"
  | "USB";

export interface FinoraServerReceptionPrincipal {
  // FINORA_P1_705P_SERVER_IDENTITY
  username: string;
  fullName: string;
  role: "OWNER";
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  storageMode: FinoraServerReceptionStorageMode;
}

export interface FinoraServerReceptionSession {
  sessionId: string;
  principal: FinoraServerReceptionPrincipal;
  createdAt: number;
  lastActivity: number;
}

export function createFinoraServerReceptionSession(
  principal: FinoraServerReceptionPrincipal,
): FinoraServerReceptionSession | null {
  const fields = [
    principal?.userId,
    principal?.ownerId,
    principal?.businessId,
    principal?.branchId,
  ];

  if (
    fields.some(
      value =>
        typeof value !== "string" ||
        value.length === 0,
    ) ||
    !["LOCAL", "USB"].includes(principal?.storageMode)
  ) {
    return null;
  }

  const now = Date.now();

  return {
    sessionId: randomBytes(32).toString("hex"),
    principal: Object.freeze({ ...principal }),
    createdAt: now,
    lastActivity: now,
  };
}