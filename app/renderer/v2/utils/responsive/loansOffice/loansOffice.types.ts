// ============================================================
// FINORA ENTERPRISE OS™
// LOANS OFFICE RESPONSIVE ENGINE
// TYPES
// ============================================================

import type { LoansOfficeViewport } from "./loansOffice.breakpoints";

export interface LoansOfficeTypographyTokens {
  pageTitle: number;
  pageSubtitle: number;
  button: number;
  statisticLabel: number;
  statisticValue: number;
  portfolioTitle: number;
  filterLabel: number;
  filterControl: number;
  filterButton: number;
  tableHeader: number;
  tableBody: number;
  tableSecondary: number;
  mobileLabel: number;
  mobileValue: number;
  mobileLoanNumber: number;
  mobileLoanTitle: number;
  mobileStatus: number;
  footer: number;
}

export interface LoansOfficeLayoutTokens {
  pagePaddingX: number;
  pagePaddingTop: number;
  pagePaddingBottom: number;
  sectionGap: number;
  headerGap: number;
  cardColumns: number;
  cardGap: number;
  cardMinHeight: number;
  filterColumns: number;
  filterGap: number;
  portfolioHeaderMinHeight: number;
  portfolioHeaderStacked: boolean;
  portfolioActionWrap: boolean;
  mobileRecordGap: number;
  mobileRecordPadding: number;
  mobileFieldGap: number;
  mobileFieldSeparator: boolean;
  tabletFieldColumns: number;
  tableVisible: boolean;
  mobileRecordVisible: boolean;
  tabletRecordVisible: boolean;
}

export interface LoansOfficeResponsiveTokens {
  viewport: LoansOfficeViewport;
  width: number;
  typography: LoansOfficeTypographyTokens;
  layout: LoansOfficeLayoutTokens;
}
