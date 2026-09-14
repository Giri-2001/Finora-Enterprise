import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchAccessDataContext,
  FinoraBranchAccessStorageMode,
  FinoraBranchAccessUserRole,
} from "./finoraBranchAccessPackage.types.js";

export const FINORA_BRANCH_PORTABILITY_AUTHORITY_PAYLOAD_VERSION =
  1 as const;

export interface FinoraBranchPortabilityAuthorityPackageTarget {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraBranchPortabilityAuthorityPayloadV1 {
  /**
   * Immutable correlation to the signed BRANCH_ACCESS
   * AUTHORIZE_CREDENTIAL authorizationId.
   */
  sourceAuthorizationId:
    string;

  userId:
    string;

  username:
    string;

  role:
    FinoraBranchAccessUserRole;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    FinoraBranchAccessStorageMode;

  dataContext:
    FinoraBranchAccessDataContext;

  demoId?:
    string;

  sourceAuthorizationMethod:
    typeof FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD;

  schemaVersion:
    1;
}