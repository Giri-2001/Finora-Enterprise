import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "../control/finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchCredentialEnrollmentAuthorization,
} from "../control/finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchPortabilityAuthorityPackageTarget,
  FinoraBranchPortabilityAuthorityPayloadV1,
} from "../control/finoraBranchPortabilityAuthorityPackage.types.js";

export interface FinoraBranchPortabilityAuthorityIssuanceAccepted {
  valid:
    true;

  payload:
    FinoraBranchPortabilityAuthorityPayloadV1;
}

export interface FinoraBranchPortabilityAuthorityIssuanceRejected {
  valid:
    false;

  error:
    string;
}

export type FinoraBranchPortabilityAuthorityIssuancePolicyResult =
  | FinoraBranchPortabilityAuthorityIssuanceAccepted
  | FinoraBranchPortabilityAuthorityIssuanceRejected;

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function hasOnlyKeys(
  value:
    Record<string, unknown>,

  allowed:
    readonly string[],
): boolean {

  const allowedSet =
    new Set(
      allowed,
    );

  return Object.keys(
    value,
  ).every(
    (
      key,
    ) =>
      allowedSet.has(
        key,
      ),
  );
}

function hasExactKeys(
  value:
    Record<string, unknown>,

  expected:
    readonly string[],
): boolean {

  const actual =
    Object.keys(
      value,
    ).sort();

  const canonicalExpected =
    [
      ...expected,
    ].sort();

  return (
    actual.length ===
      canonicalExpected.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
        canonicalExpected[index],
    )
  );
}

function hasText(
  value:
    unknown,

  maxLength:
    number,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0 &&
    value.length <=
      maxLength
  );
}

function isRole(
  value:
    unknown,
): value is
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER" {

  return (
    value ===
      "ADMIN" ||
    value ===
      "MANAGER" ||
    value ===
      "COLLECTOR" ||
    value ===
      "VIEWER"
  );
}

function isStorageMode(
  value:
    unknown,
): value is
  | "LOCAL"
  | "USB" {

  return (
    value ===
      "LOCAL" ||
    value ===
      "USB"
  );
}

function isDataContext(
  value:
    unknown,
): value is
  | "REAL"
  | "DEMO" {

  return (
    value ===
      "REAL" ||
    value ===
      "DEMO"
  );
}

function reject(
  error:
    string,
):
  FinoraBranchPortabilityAuthorityIssuanceRejected {

  return {
    valid:
      false,

    error,
  };
}

export function validateFinoraBranchPortabilityAuthorityIssuance(
  sourceAuthorization:
    unknown,

  target:
    unknown,
):
  FinoraBranchPortabilityAuthorityIssuancePolicyResult {

  if (
    !isRecord(
      target,
    ) ||
    !hasExactKeys(
      target,
      [
        "ownerId",
        "businessId",
        "branchId",
      ],
    ) ||
    !hasText(
      target.ownerId,
      256,
    ) ||
    !hasText(
      target.businessId,
      256,
    ) ||
    !hasText(
      target.branchId,
      256,
    )
  ) {
    return reject(
      "FINORA Branch Portability Authority target must contain exactly ownerId, businessId, and branchId.",
    );
  }

  if (
    !isRecord(
      sourceAuthorization,
    ) ||
    !hasOnlyKeys(
      sourceAuthorization,
      [
        "authorizationId",
        "userId",
        "username",
        "fullName",
        "role",
        "ownerId",
        "businessId",
        "branchId",
        "storageMode",
        "dataContext",
        "demoId",
        "method",
        "oneTime",
        "schemaVersion",
      ],
    )
  ) {
    return reject(
      "FINORA Branch Portability Authority source credential authorization structure is invalid.",
    );
  }

  if (
    !hasText(
      sourceAuthorization.authorizationId,
      256,
    ) ||
    !sourceAuthorization.authorizationId.startsWith(
      "FINORA-CREDENTIAL-ENROLLMENT-",
    ) ||
    !hasText(
      sourceAuthorization.userId,
      256,
    ) ||
    !hasText(
      sourceAuthorization.username,
      128,
    ) ||
    !hasText(
      sourceAuthorization.fullName,
      256,
    ) ||
    !isRole(
      sourceAuthorization.role,
    ) ||
    !hasText(
      sourceAuthorization.ownerId,
      256,
    ) ||
    !hasText(
      sourceAuthorization.businessId,
      256,
    ) ||
    !hasText(
      sourceAuthorization.branchId,
      256,
    ) ||
    !isStorageMode(
      sourceAuthorization.storageMode,
    ) ||
    !isDataContext(
      sourceAuthorization.dataContext,
    ) ||
    sourceAuthorization.method !==
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD ||
    sourceAuthorization.oneTime !==
      true ||
    sourceAuthorization.schemaVersion !==
      1
  ) {
    return reject(
      "FINORA Branch Portability Authority source credential authorization is invalid.",
    );
  }

  if (
    sourceAuthorization.ownerId !==
      target.ownerId ||
    sourceAuthorization.businessId !==
      target.businessId ||
    sourceAuthorization.branchId !==
      target.branchId
  ) {
    return reject(
      "FINORA Branch Portability Authority source authorization does not belong to the requested branch.",
    );
  }

  if (
    sourceAuthorization.dataContext ===
      "REAL"
  ) {
    if (
      sourceAuthorization.demoId !==
        undefined
    ) {
      return reject(
        "FINORA REAL Branch Portability Authority source authorization must not contain demoId.",
      );
    }
  } else if (
    !hasText(
      sourceAuthorization.demoId,
      256,
    )
  ) {
    return reject(
      "FINORA DEMO Branch Portability Authority source authorization requires demoId.",
    );
  }

  const authorization =
    sourceAuthorization as unknown as
      FinoraBranchCredentialEnrollmentAuthorization;

  const branchTarget =
    target as unknown as
      FinoraBranchPortabilityAuthorityPackageTarget;

  const payload:
    FinoraBranchPortabilityAuthorityPayloadV1 = {
      sourceAuthorizationId:
        authorization.authorizationId,

      userId:
        authorization.userId,

      username:
        authorization.username,

      role:
        authorization.role,

      ownerId:
        branchTarget.ownerId,

      businessId:
        branchTarget.businessId,

      branchId:
        branchTarget.branchId,

      storageMode:
        authorization.storageMode,

      dataContext:
        authorization.dataContext,

      ...(
        authorization.dataContext ===
          "DEMO"
          ? {
              demoId:
                authorization.demoId,
            }
          : {}
      ),

      sourceAuthorizationMethod:
        FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

      schemaVersion:
        1,
    };

  return {
    valid:
      true,

    payload,
  };
}