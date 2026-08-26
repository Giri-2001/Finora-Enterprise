// ============================================================
// FINORA ENTERPRISE OS™
// LOANS OFFICE RESPONSIVE ENGINE
// TOKENS
// ============================================================

import type {
  LoansOfficeResponsiveTokens,
} from "./loansOffice.types";

import {
  getLoansOfficeViewport,
} from "./loansOffice.helpers";

const MOBILE: LoansOfficeResponsiveTokens = {
  viewport: "mobile",
  width: 0,
  typography: {
    pageTitle: 21,
    pageSubtitle: 12,
    button: 12,
    statisticLabel: 11,
    statisticValue: 19,
    portfolioTitle: 13,
    filterLabel: 11,
    filterControl: 12,
    filterButton: 11,
    tableHeader: 11,
    tableBody: 12,
    tableSecondary: 11,
    mobileLabel: 10,
    mobileValue: 13,
    mobileLoanNumber: 13,
    mobileLoanTitle: 11,
    mobileStatus: 10,
    footer: 11,
  },
  layout: {
    pagePaddingX: 14,
    pagePaddingTop: 18,
    pagePaddingBottom: 28,
    sectionGap: 14,
    headerGap: 12,
    cardColumns: 1,
    cardGap: 10,
    cardMinHeight: 78,
    filterColumns: 1,
    filterGap: 10,
    portfolioHeaderMinHeight: 52,
    portfolioHeaderStacked: true,
    portfolioActionWrap: true,
    mobileRecordGap: 10,
    mobileRecordPadding: 14,
    mobileFieldGap: 4,
    mobileFieldSeparator: true,
    tabletFieldColumns: 1,
    tableVisible: false,
    mobileRecordVisible: true,
    tabletRecordVisible: false,
  },
};

const TABLET: LoansOfficeResponsiveTokens = {
  viewport: "tablet",
  width: 0,
  typography: {
    pageTitle: 22,
    pageSubtitle: 12,
    button: 12,
    statisticLabel: 11,
    statisticValue: 19,
    portfolioTitle: 13,
    filterLabel: 11,
    filterControl: 12,
    filterButton: 11,
    tableHeader: 11,
    tableBody: 12,
    tableSecondary: 11,
    mobileLabel: 10,
    mobileValue: 13,
    mobileLoanNumber: 13,
    mobileLoanTitle: 11,
    mobileStatus: 10,
    footer: 11,
  },
  layout: {
    pagePaddingX: 18,
    pagePaddingTop: 20,
    pagePaddingBottom: 32,
    sectionGap: 16,
    headerGap: 14,
    cardColumns: 2,
    cardGap: 12,
    cardMinHeight: 80,
    filterColumns: 2,
    filterGap: 10,
    portfolioHeaderMinHeight: 56,
    portfolioHeaderStacked: true,
    portfolioActionWrap: true,
    mobileRecordGap: 12,
    mobileRecordPadding: 16,
    mobileFieldGap: 5,
    mobileFieldSeparator: true,
    tabletFieldColumns: 2,
    tableVisible: false,
    mobileRecordVisible: false,
    tabletRecordVisible: true,
  },
};

const LAPTOP: LoansOfficeResponsiveTokens = {
  viewport: "laptop",
  width: 0,
  typography: {
    pageTitle: 24,
    pageSubtitle: 13,
    button: 13,
    statisticLabel: 12,
    statisticValue: 20,
    portfolioTitle: 13,
    filterLabel: 10,
    filterControl: 11,
    filterButton: 10,
    tableHeader: 11,
    tableBody: 12,
    tableSecondary: 11,
    mobileLabel: 10,
    mobileValue: 13,
    mobileLoanNumber: 11,
    mobileLoanTitle: 10,
    mobileStatus: 10,
    footer: 11,
  },
  layout: {
    pagePaddingX: 24,
    pagePaddingTop: 28,
    pagePaddingBottom: 40,
    sectionGap: 20,
    headerGap: 20,
    cardColumns: 4,
    cardGap: 14,
    cardMinHeight: 80,
    filterColumns: 4,
    filterGap: 7,
    portfolioHeaderMinHeight: 56,
    portfolioHeaderStacked: false,
    portfolioActionWrap: false,
    mobileRecordGap: 0,
    mobileRecordPadding: 0,
    mobileFieldGap: 0,
    mobileFieldSeparator: false,
    tabletFieldColumns: 0,
    tableVisible: true,
    mobileRecordVisible: false,
    tabletRecordVisible: false,
  },
};

const DESKTOP: LoansOfficeResponsiveTokens = {
  ...LAPTOP,
  viewport: "desktop",
  width: 0,
  layout: {
    ...LAPTOP.layout,
    cardColumns: 5,
    cardGap: 14,
  },
};

export const DEFAULT_LOANS_OFFICE_TOKENS = LAPTOP;

export function getLoansOfficeTokens(width: number): LoansOfficeResponsiveTokens {
  const viewport = getLoansOfficeViewport(width);
  const source =
    viewport === "mobile"
      ? MOBILE
      : viewport === "tablet"
        ? TABLET
        : viewport === "laptop"
          ? LAPTOP
          : DESKTOP;

  return {
    ...source,
    width,
  };
}
