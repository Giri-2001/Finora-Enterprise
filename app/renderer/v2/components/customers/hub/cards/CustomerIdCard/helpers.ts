/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ID CARD

   HELPERS
=========================================================== */

import {
  DEFAULT_PHOTO,
  VERIFIED_LABEL,
  UNVERIFIED_LABEL,
} from "./constants";

/* ===========================================================
   BUILD BRANCH
=========================================================== */

export function buildBranch(
  branchName?: string,
): string {

  return branchName?.trim() ?? "";

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
