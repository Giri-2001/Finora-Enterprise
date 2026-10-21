/**
 * FINORA_P1_675I_MIGRATION_AUTHORIZATION_CONTRACT
 *
 * A structural contract only.
 *
 * IMPORTANT:
 * Validating this structure DOES NOT authenticate or authorize
 * a migration. A trusted server signature, current server
 * authority, replay/expiry checks, and matching authenticated
 * legacy USB evidence must all be verified separately.
 */

export interface FinoraServerFirstLegacyMigrationAuthorizationV1 {
  schemaVersion: 1;
  purpose: "FINORA_LEGACY_TO_SERVER_FIRST_MIGRATION";
  migrationId: string;
  oldSourceAuthorizationId: string;
  newSourceAuthorizationId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  userId: string;
  canonicalUsername: string;
  storageMode: "USB";
  authGeneration: number;
  issuedAt: string;
  expiresAt: string;
}

export function validateFinoraLegacyMigrationAuthorizationShape(
  value: unknown,
): value is FinoraServerFirstLegacyMigrationAuthorizationV1 {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  const expected = [
    "schemaVersion",
    "purpose",
    "migrationId",
    "oldSourceAuthorizationId",
    "newSourceAuthorizationId",
    "ownerId",
    "businessId",
    "branchId",
    "userId",
    "canonicalUsername",
    "storageMode",
    "authGeneration",
    "issuedAt",
    "expiresAt",
  ];

  if (
    Object.keys(item).length !== expected.length ||
    expected.some(
      (key) =>
        !Object.prototype.hasOwnProperty.call(item, key),
    )
  ) {
    return false;
  }

  if (
    item.schemaVersion !== 1 ||
    item.purpose !==
      "FINORA_LEGACY_TO_SERVER_FIRST_MIGRATION" ||
    item.storageMode !== "USB" ||
    !Number.isSafeInteger(item.authGeneration) ||
    (item.authGeneration as number) <= 0
  ) {
    return false;
  }

  const strings = [
    "migrationId",
    "oldSourceAuthorizationId",
    "newSourceAuthorizationId",
    "ownerId",
    "businessId",
    "branchId",
    "userId",
    "canonicalUsername",
  ];

  if (
    strings.some(
      (key) =>
        typeof item[key] !== "string" ||
        (item[key] as string).trim().length === 0,
    )
  ) {
    return false;
  }

  const issuedAt = item.issuedAt;
  const expiresAt = item.expiresAt;

  if (
    typeof issuedAt !== "string" ||
    typeof expiresAt !== "string"
  ) {
    return false;
  }

  const issued = Date.parse(issuedAt);
  const expires = Date.parse(expiresAt);

  if (
    !Number.isFinite(issued) ||
    !Number.isFinite(expires) ||
    new Date(issued).toISOString() !== issuedAt ||
    new Date(expires).toISOString() !== expiresAt ||
    expires <= issued
  ) {
    return false;
  }

  return true;
}