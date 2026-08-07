/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   LAYOUT HELPERS
=========================================================== */

import {
  isDesktop,
  isTablet,
} from "./helpers";

import {

  CUSTOMER_CARD_PER_ROW_DESKTOP,
  CUSTOMER_CARD_PER_ROW_LAPTOP,
  CUSTOMER_CARD_PER_ROW_TABLET,
  CUSTOMER_CARD_PER_ROW_MOBILE,
  CUSTOMER_CARD_PER_ROW_SMALL,

} from "../../types/customers/customer.constants";

/* ===========================================================
   CUSTOMER CARDS
=========================================================== */

export function getCustomerCardsPerPage(
  width: number,
): number {

  if (isDesktop(width)) {

    return CUSTOMER_CARD_PER_ROW_DESKTOP;

  }

  if (width >= 1024) {

    return CUSTOMER_CARD_PER_ROW_LAPTOP;

  }

  if (isTablet(width)) {

    return CUSTOMER_CARD_PER_ROW_TABLET;

  }

  if (width >= 576) {

    return CUSTOMER_CARD_PER_ROW_MOBILE;

  }

  return CUSTOMER_CARD_PER_ROW_SMALL;

}

/* ===========================================================
   PLACEHOLDERS
   (Future Enterprise Modules)
=========================================================== */

export function getLoanCardsPerPage(
  width: number,
): number {

  return getCustomerCardsPerPage(width);

}

export function getCollectionCardsPerPage(
  width: number,
): number {

  return getCustomerCardsPerPage(width);

}

export function getReportCardsPerPage(
  width: number,
): number {

  return getCustomerCardsPerPage(width);

}
