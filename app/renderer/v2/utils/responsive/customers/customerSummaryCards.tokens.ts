/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   RESPONSIVE TOKENS

   PURPOSE
   -----------------------------------------------------------
   Central responsive presentation contract for:

      CustomerHubSummaryCards

   IMPORTANT
   -----------------------------------------------------------
   This file owns responsive dimensions only.

   The real component logic remains untouched.

   CURRENT PRESENTATION DECISION
   -----------------------------------------------------------
   Mobile   → 1 card per row
   Tablet   → 3 cards per row
   Laptop   → 5 cards per row
   Desktop  → 5 cards per row

   If a 6th card exists:
      → it moves automatically to the next row.

   This is a current design decision.
   It is NOT a permanent business rule.
=========================================================== */


/* ===========================================================
   DEVICE
=========================================================== */

export type CustomerSummaryCardsDevice =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";


/* ===========================================================
   TOKEN CONTRACT
=========================================================== */

export interface CustomerSummaryCardsTokens {

  /* =========================================================
     GRID
  ========================================================= */

  columns: number;

  gap: number;


  /* =========================================================
     CARD
  ========================================================= */

  cardWidth: number;

  cardHeight: number;

  cardRadius: number;

  cardPadding: number;


  /* =========================================================
     CONTAINER
  ========================================================= */

  containerPaddingX: number;

  containerTransformY: number;

    containerJustifyContent: "space-between" | "center";

      /* =========================================================
     CARD ORDER
  ========================================================= */

  totalCustomersOrder: number;

  activeCustomersOrder: number;

  paginationOrder: number;

  workDeskOrder: number;

customerDataOrder: number;


  /* =========================================================
     TYPOGRAPHY
  ========================================================= */

  titleSize: number;

  valueSize: number;

  valueMarginTop: number;


  /* =========================================================
     PAGINATION
  ========================================================= */

  paginationGap: number;

  paginationButtonSize: number;

  paginationFontSize: number;

  paginationDotSize: number;

  paginationDotGap: number;

}


/* ===========================================================
   MOBILE
=========================================================== */

export const CUSTOMER_SUMMARY_CARDS_MOBILE_TOKENS:
  CustomerSummaryCardsTokens = {

  columns: 1,

  gap: 14,


  cardWidth: 150,

  cardHeight: 100,

  cardRadius: 18,

  cardPadding: 12,


  containerPaddingX: 16,

  containerTransformY: -10,

    containerJustifyContent: "center",

  paginationOrder: 1,

  totalCustomersOrder: 2,

  activeCustomersOrder: 3,

  workDeskOrder: 4,

customerDataOrder: 5,


  titleSize: 11,

  valueSize: 17,

  valueMarginTop: 6,


  paginationGap: 14,

  paginationButtonSize: 34,

  paginationFontSize: 20,

  paginationDotSize: 5,

  paginationDotGap: 6,

};


/* ===========================================================
   TABLET
=========================================================== */

export const CUSTOMER_SUMMARY_CARDS_TABLET_TOKENS:
  CustomerSummaryCardsTokens = {

  columns: 3,

  gap: 14,


  cardWidth: 150,

  cardHeight: 100,

  cardRadius: 18,

  cardPadding: 12,


  containerPaddingX: 24,

  containerTransformY: -10,

    containerJustifyContent: "space-between",

      totalCustomersOrder: 1,

  paginationOrder: 2,

  activeCustomersOrder: 3,

  workDeskOrder: 4,

customerDataOrder: 5,


  titleSize: 11,

  valueSize: 17,

  valueMarginTop: 6,


  paginationGap: 14,

  paginationButtonSize: 34,

  paginationFontSize: 20,

  paginationDotSize: 5,

  paginationDotGap: 6,

};


/* ===========================================================
   LAPTOP
=========================================================== */

export const CUSTOMER_SUMMARY_CARDS_LAPTOP_TOKENS:
  CustomerSummaryCardsTokens = {

  columns: 5,

  gap: 14,


  cardWidth: 150,

  cardHeight: 100,

  cardRadius: 18,

  cardPadding: 12,


  containerPaddingX: 34,

  containerTransformY: -10,

    containerJustifyContent: "space-between",

      totalCustomersOrder: 1,

  activeCustomersOrder: 2,

  paginationOrder: 3,

  workDeskOrder: 4,

customerDataOrder: 5,


  titleSize: 11,

  valueSize: 17,

  valueMarginTop: 6,


  paginationGap: 14,

  paginationButtonSize: 34,

  paginationFontSize: 20,

  paginationDotSize: 5,

  paginationDotGap: 6,

};


/* ===========================================================
   DESKTOP
=========================================================== */

export const CUSTOMER_SUMMARY_CARDS_DESKTOP_TOKENS:
  CustomerSummaryCardsTokens = {

  columns: 5,

  gap: 14,


  cardWidth: 150,

  cardHeight: 100,

  cardRadius: 18,

  cardPadding: 12,


  containerPaddingX: 34,

  containerTransformY: -10,

    containerJustifyContent: "space-between",

      totalCustomersOrder: 1,

  activeCustomersOrder: 2,

  paginationOrder: 3,

  workDeskOrder: 4,

customerDataOrder: 5,


  titleSize: 11,

  valueSize: 17,

  valueMarginTop: 6,


  paginationGap: 14,

  paginationButtonSize: 34,

  paginationFontSize: 20,

  paginationDotSize: 5,

  paginationDotGap: 6,

};


/* ===========================================================
   TOKEN RESOLVER
=========================================================== */

export function getCustomerSummaryCardsTokens(
  device: CustomerSummaryCardsDevice,
): CustomerSummaryCardsTokens {

  switch (device) {

    case "mobile":
      return CUSTOMER_SUMMARY_CARDS_MOBILE_TOKENS;

    case "tablet":
      return CUSTOMER_SUMMARY_CARDS_TABLET_TOKENS;

    case "laptop":
      return CUSTOMER_SUMMARY_CARDS_LAPTOP_TOKENS;

    case "desktop":
      return CUSTOMER_SUMMARY_CARDS_DESKTOP_TOKENS;

    default:
      return CUSTOMER_SUMMARY_CARDS_LAPTOP_TOKENS;

  }

}


/* ===========================================================
   END
=========================================================== */