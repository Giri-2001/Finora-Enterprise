/**
 * FINORA_P1_675H_LEGACY_MIGRATION_SCOPE
 *
 * Pure scope validation for a proposed legacy-to-server
 * authorization migration.
 *
 * IMPORTANT:
 * - Does not authenticate a user.
 * - Does not verify a signature.
 * - Does not authorize migration.
 * - Does not write USB or runtime state.
 * - Does not require old/new authorization IDs to match.
 *
 * A separate server-signed migration authorization must
 * cryptographically bind both authorization IDs before use.
 */

export interface FinoraLegacyMigrationIdentity {
  sourceAuthorizationId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  userId: string;
  username: string;
  storageMode: string;
  authGeneration: number;
}

export type FinoraLegacyMigrationScopeResult =
  | {
      success: true;
      oldAuthorizationId: string;
      newAuthorizationId: string;
    }
  | {
      success: false;
      reason:
        | "INVALID_IDENTITY"
        | "IDENTITY_MISMATCH"
        | "STORAGE_MISMATCH"
        | "GENERATION_MISMATCH";
    };

export function validateFinoraLegacyMigrationScope(
  legacy: FinoraLegacyMigrationIdentity,
  server: FinoraLegacyMigrationIdentity,
): FinoraLegacyMigrationScopeResult {
  const required = [
    legacy.sourceAuthorizationId,
    server.sourceAuthorizationId,
    legacy.ownerId,
    server.ownerId,
    legacy.businessId,
    server.businessId,
    legacy.branchId,
    server.branchId,
    legacy.userId,
    server.userId,
    legacy.username,
    server.username,
  ];

  if (
    required.some(
      (value) =>
        typeof value !== "string" ||
        value.trim().length === 0,
    ) ||
    !Number.isSafeInteger(legacy.authGeneration) ||
    !Number.isSafeInteger(server.authGeneration) ||
    legacy.authGeneration <= 0 ||
    server.authGeneration <= 0
  ) {
    return {
      success: false,
      reason: "INVALID_IDENTITY",
    };
  }

  if (
    legacy.ownerId !== server.ownerId ||
    legacy.businessId !== server.businessId ||
    legacy.branchId !== server.branchId ||
    legacy.userId !== server.userId ||
    legacy.username !== server.username
  ) {
    return {
      success: false,
      reason: "IDENTITY_MISMATCH",
    };
  }

  if (
    legacy.storageMode !== "USB" ||
    server.storageMode !== "USB"
  ) {
    return {
      success: false,
      reason: "STORAGE_MISMATCH",
    };
  }

  if (
    legacy.authGeneration !== server.authGeneration
  ) {
    return {
      success: false,
      reason: "GENERATION_MISMATCH",
    };
  }

  return {
    success: true,
    oldAuthorizationId: legacy.sourceAuthorizationId,
    newAuthorizationId: server.sourceAuthorizationId,
  };
}