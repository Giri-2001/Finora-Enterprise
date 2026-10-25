/**
 * FINORA P1-702L
 * Fail-closed server/local identity comparison.
 *
 * This function does not create sessions, authenticate
 * passwords, authorize business access or modify Wallets.
 */

export type FinoraServerBoundIdentity = {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
};

export function verifyFinoraServerBoundIdentity(
  server: FinoraServerBoundIdentity | null | undefined,
  local: FinoraServerBoundIdentity | null | undefined,
): boolean {
  if (!server || !local) return false;

  const fields = [
    "userId",
    "ownerId",
    "businessId",
    "branchId",
  ] as const;

  return fields.every((field) => {
    const serverValue = server[field];
    const localValue = local[field];

    return (
      typeof serverValue === "string" &&
      serverValue.length > 0 &&
      typeof localValue === "string" &&
      localValue.length > 0 &&
      serverValue === localValue
    );
  });
}