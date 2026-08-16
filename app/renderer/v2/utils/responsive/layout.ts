/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   LAYOUT
=========================================================== */

import {
  isDesktop,
  isTablet,
  isMobile,
} from "./helpers";

import {
  DESKTOP_CUSTOMER_CARDS,
  TABLET_CUSTOMER_CARDS,
  MOBILE_CUSTOMER_CARDS,
} from "./breakpoints";

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
   CUSTOMER CARD COUNT
=========================================================== */

export function getCustomerCardCount(
  width: number,
): number {

  if (isDesktop(width)) {

    return Math.max(
      CUSTOMER_CARD_PER_ROW_DESKTOP,
      DESKTOP_CUSTOMER_CARDS,
    );

  }

  if (isTablet(width)) {

    return Math.max(
      CUSTOMER_CARD_PER_ROW_TABLET,
      TABLET_CUSTOMER_CARDS,
    );

  }

  return Math.max(
    CUSTOMER_CARD_PER_ROW_SMALL,
    MOBILE_CUSTOMER_CARDS,
  );

}


/* ===========================================================
   LOAN CARDS
=========================================================== */

export function getLoanCardsPerPage(
  width: number,
): number {

  return getCustomerCardsPerPage(
    width,
  );

}


/* ===========================================================
   COLLECTION CARDS
=========================================================== */

export function getCollectionCardsPerPage(
  width: number,
): number {

  return getCustomerCardsPerPage(
    width,
  );

}


/* ===========================================================
   REPORT CARDS
=========================================================== */

export function getReportCardsPerPage(
  width: number,
): number {

  return getCustomerCardsPerPage(
    width,
  );

}


/* ===========================================================
   PAGE GUTTER
=========================================================== */

export function getPageGutter(
  width: number,
): number {

  if (isDesktop(width)) {

    return 32;

  }

  if (isTablet(width)) {

    return 24;

  }

  return 16;

}


/* ===========================================================
   CONTENT GAP
=========================================================== */

export function getContentGap(
  width: number,
): number {

  if (isDesktop(width)) {

    return 24;

  }

  if (isTablet(width)) {

    return 20;

  }

  return 16;

}


/* ===========================================================
   CARD GAP
=========================================================== */

export function getCardGap(
  width: number,
): number {

  if (isDesktop(width)) {

    return 20;

  }

  if (isTablet(width)) {

    return 16;

  }

  return 12;

}


/* ===========================================================
   CONTROL HEIGHT
=========================================================== */

export function getControlHeight(
  width: number,
): number {

  if (isDesktop(width)) {

    return 44;

  }

  if (isTablet(width)) {

    return 44;

  }

  return 46;

}


/* ===========================================================
   CARD RADIUS
=========================================================== */

export function getCardRadius(
  width: number,
): number {

  if (isDesktop(width)) {

    return 16;

  }

  if (isTablet(width)) {

    return 14;

  }

  return 14;

}


/* ===========================================================
   BORDER WIDTH
=========================================================== */

export function getBorderWidth(
  width: number,
): number {

  /*
    Border remains visually stable across devices.

    Responsive sizing must never create accidental
    0px / 1px jumps at breakpoint boundaries.
  */

  if (isMobile(width)) {

    return 1;

  }

  if (isTablet(width)) {

    return 1;

  }

  return 1;

}


/* ===========================================================
   CENTERED CONTAINER
=========================================================== */

export function getCenteredContainerStyle(
  width: number,
  maxWidth: number,
): {
  width: string;
  maxWidth: number;
  marginLeft: string;
  marginRight: string;
  boxSizing: "border-box";
} {

  const safeMaxWidth =
    Math.max(
      0,
      maxWidth,
    );

  return {

    width: "100%",

    maxWidth:
      safeMaxWidth,

    marginLeft: "auto",

    marginRight: "auto",

    boxSizing: "border-box",

  };

}


/* ===========================================================
   END
=========================================================== */