import crypto from "node:crypto";

export interface FinoraTemporaryCredentialProvisioningRequest {
  credentialAuthorizationId: string;
  branchId: string;
  userId: string;
  username: string;
  installationId: string;
  bindingKeyId: string;
  publicKeyFingerprint: string;
  credentialLifecycle: "TEMPORARY_FIRST_LOGIN";
}

export interface FinoraTemporaryCredentialProvisioningResult {
  credentialAuthorizationId: string;
  username: string;
  password: string;
  securityCode: string;
  credentialLifecycle: "TEMPORARY_FIRST_LOGIN";
  credentialChangeRequired: true;
}

/**
 * Branch3 temporary-first-login provisioning.
 *
 * SECURITY:
 * - secrets are generated only inside privileged Electron code
 * - secrets are returned only to the immediate caller
 * - secrets are never written to the signed authorization
 * - secrets are never persisted
 * - secrets are never logged
 * - one authorization can be provisioned once per process
 */
const consumedAuthorizationIds =
  new Set<string>();

function assertNonEmpty(
  value: unknown,
  field: string,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Temporary credential provisioning requires ${field}.`,
    );
  }
}

function generateTemporaryPassword(): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  const bytes =
    crypto.randomBytes(18);

  let result = "";

  for (const byte of bytes) {
    result +=
      alphabet[byte % alphabet.length];
  }

  return result;
}

function generateSecurityCode(): string {
  return String(
    crypto.randomInt(100000, 1000000),
  );
}

export function
  provisionFinoraTemporaryFirstLoginCredential(
    request:
      FinoraTemporaryCredentialProvisioningRequest,
  ):
    FinoraTemporaryCredentialProvisioningResult {

  assertNonEmpty(
    request.credentialAuthorizationId,
    "credentialAuthorizationId",
  );

  assertNonEmpty(
    request.branchId,
    "branchId",
  );

  assertNonEmpty(
    request.userId,
    "userId",
  );

  assertNonEmpty(
    request.username,
    "username",
  );

  assertNonEmpty(
    request.installationId,
    "installationId",
  );

  assertNonEmpty(
    request.bindingKeyId,
    "bindingKeyId",
  );

  assertNonEmpty(
    request.publicKeyFingerprint,
    "publicKeyFingerprint",
  );

  if (
    request.credentialLifecycle !==
    "TEMPORARY_FIRST_LOGIN"
  ) {
    throw new Error(
      "Temporary credential provisioning is restricted to TEMPORARY_FIRST_LOGIN.",
    );
  }

  const authorizationId =
    request.credentialAuthorizationId.trim();

  if (
    consumedAuthorizationIds.has(
      authorizationId,
    )
  ) {
    throw new Error(
      "This temporary credential authorization has already been provisioned.",
    );
  }

  consumedAuthorizationIds.add(
    authorizationId,
  );

  const password =
    generateTemporaryPassword();

  const securityCode =
    generateSecurityCode();

  return {
    credentialAuthorizationId:
      authorizationId,

    username:
      request.username.trim(),

    password,

    securityCode,

    credentialLifecycle:
      "TEMPORARY_FIRST_LOGIN",

    credentialChangeRequired:
      true,
  };
}
