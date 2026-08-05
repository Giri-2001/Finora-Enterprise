/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ID CARD

   HELPERS
=========================================================== */

import {
  COMPANY_NAME,
  DEFAULT_BRANCH,
  DEFAULT_PHOTO,
  VERIFIED_LABEL,
  UNVERIFIED_LABEL,
} from "./constants";

/* ===========================================================
   BUILD COMPANY
=========================================================== */

export function buildCompany(): string {

  return COMPANY_NAME;

}

/* ===========================================================
   BUILD BRANCH
=========================================================== */

export function buildBranch(
  branchName?: string,
): string {

  const value = branchName?.trim();

  return value && value.length > 0
    ? value
    : DEFAULT_BRANCH;

}

/* ===========================================================
   BUILD PHOTO
=========================================================== */

export function buildPhoto(
  photoUrl?: string,
): string {

  return photoUrl ?? DEFAULT_PHOTO;

}

/* ===========================================================
   BUILD KYC LABEL
=========================================================== */

export function buildKycLabel(
  verified?: boolean,
): string {

  return verified
    ? VERIFIED_LABEL
    : UNVERIFIED_LABEL;

}
