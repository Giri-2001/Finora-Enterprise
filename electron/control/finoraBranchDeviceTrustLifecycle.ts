export type FinoraBranchDeviceTrustStatus = "ACTIVE" | "REVOKED";

export interface FinoraBranchDeviceTrustLifecycle {
  status: FinoraBranchDeviceTrustStatus;
  revokedAt?: string;
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const n = Date.parse(value);
  return Number.isFinite(n) && new Date(n).toISOString() === value;
}

export function normalizeFinoraBranchDeviceTrustLifecycle(input: { status?: unknown; revokedAt?: unknown }, legacyV1: boolean): FinoraBranchDeviceTrustLifecycle {
  if (legacyV1) { if (input.status !== undefined || input.revokedAt !== undefined) throw new Error("FINORA legacy Device Trust record cannot carry lifecycle fields."); return { status: "ACTIVE" }; }
  if (input.status === "ACTIVE") { if (input.revokedAt !== undefined) throw new Error("FINORA ACTIVE Device Trust record cannot carry revokedAt."); return { status: "ACTIVE" }; }
  if (input.status === "REVOKED") { if (!isCanonicalTimestamp(input.revokedAt)) throw new Error("FINORA REVOKED Device Trust record requires canonical revokedAt."); return { status: "REVOKED", revokedAt: input.revokedAt }; }
  throw new Error("FINORA Device Trust lifecycle status is invalid.");
}

export function assertFinoraBranchDeviceTrustLifecycleTransition(current: FinoraBranchDeviceTrustLifecycle, next: FinoraBranchDeviceTrustLifecycle): void {
  if (current.status === "REVOKED" && (next.status !== "REVOKED" || next.revokedAt !== current.revokedAt)) {
    throw new Error("FINORA revoked Device Trust is terminal and immutable.");
  }
}
