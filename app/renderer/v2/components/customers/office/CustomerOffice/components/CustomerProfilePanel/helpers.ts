/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PROFILE PANEL™

   HELPERS
=========================================================== */

import finoraLogo
  from "../../../../../app/assets/finoraenterprise.png";

import type {

  OfficeCustomer,

} from "../../types";

import {

  ACTIVE_BACKGROUND,
  ACTIVE_COLOR,
  INACTIVE_BACKGROUND,
  INACTIVE_COLOR,
  ACTIVE_CUSTOMER,
  INACTIVE_CUSTOMER,

} from "./constants";

/* ===========================================================
   PROFILE IMAGE
=========================================================== */

export function getProfileImage(

  customer: OfficeCustomer,

): string {

  return customer.photo ?? finoraLogo;

}

/* ===========================================================
   IMAGE FIT
=========================================================== */

export function getImageFit(

  customer: OfficeCustomer,

): "cover" | "contain" {

  return customer.photo

    ? "cover"

    : "contain";

}

/* ===========================================================
   IMAGE PADDING
=========================================================== */

export function getImagePadding(

  customer: OfficeCustomer,

): string {

  return customer.photo

    ? "0"

    : "8px";

}

/* ===========================================================
   STATUS LABEL
=========================================================== */

export function getCustomerStatus(

  customer: OfficeCustomer,

): string {

  return customer.active

    ? ACTIVE_CUSTOMER

    : INACTIVE_CUSTOMER;

}

/* ===========================================================
   STATUS COLORS
=========================================================== */

export function getStatusColors(

  customer: OfficeCustomer,

) {

  return {

    background:

      customer.active

        ? ACTIVE_BACKGROUND

        : INACTIVE_BACKGROUND,

    color:

      customer.active

        ? ACTIVE_COLOR

        : INACTIVE_COLOR,

  };

}
