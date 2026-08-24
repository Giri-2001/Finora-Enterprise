/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER KYC FORM
   RESPONSIVE TOKENS

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:
   - KYC workspace geometry
   - Identity field grid geometry
   - KYC preview geometry
   - Mobile / Tablet / Laptop / Desktop contracts

   IMPORTANT:
   - Responsive sizing lives ONLY here.
   - No business logic.
   - No form state.
   - No viewport detection.
   - No media queries.
   - No verification logic.
=========================================================== */

import type {
  ResponsiveViewport,
} from "../customers.tokens";

export interface KycResponsiveTokens {
  viewport: ResponsiveViewport;

  pagePaddingX: number;
  pagePaddingTop: number;
  pagePaddingBottom: number;
  pageGap: number;

  contentColumns: number;
  contentGap: number;

  panelPaddingX: number;
  panelPaddingY: number;
  panelRadius: number;
  panelHeaderGap: number;
  panelHeaderHeight: number;
  panelHeaderPaddingBottom: number;

  fieldColumns: number;
  fieldColumnGap: number;
  fieldRowGap: number;
  fieldGap: number;
  labelGap: number;
  labelFontSize: number;
  labelFontWeight: number;
  labelLetterSpacing: number;

  inputHeight: number;
  inputPaddingX: number;
  inputRadius: number;
  inputFontSize: number;
  inputFontWeight: number;
  inputIconSize: number;
  inputIconOffset: number;

  previewPaddingX: number;
  previewPaddingY: number;
  previewGap: number;
  previewIconSize: number;
  previewIconRadius: number;
  previewTitleSize: number;
  previewSubtitleSize: number;
  previewLabelSize: number;
  previewValueSize: number;
  previewRowGap: number;
  previewRowPaddingY: number;
  previewRadius: number;
  previewColumns: number;
  previewStatusSize: number;
}

export const MOBILE_KYC_TOKENS: KycResponsiveTokens = {
  viewport: "mobile",
  pagePaddingX: 8,
  pagePaddingTop: 6,
  pagePaddingBottom: 6,
  pageGap: 8,
  contentColumns: 1,
  contentGap: 6,
  panelPaddingX: 10,
  panelPaddingY: 10,
  panelRadius: 13,
  panelHeaderGap: 7,
  panelHeaderHeight: 34,
  panelHeaderPaddingBottom: 7,
  fieldColumns: 1,
  fieldColumnGap: 8,
  fieldRowGap: 7,
  fieldGap: 4,
  labelGap: 4,
  labelFontSize: 9,
  labelFontWeight: 650,
  labelLetterSpacing: 0.3,
  inputHeight: 39,
  inputPaddingX: 10,
  inputRadius: 8,
  inputFontSize: 11,
  inputFontWeight: 500,
  inputIconSize: 15,
  inputIconOffset: 9,
  previewPaddingX: 9,
  previewPaddingY: 9,
  previewGap: 7,
  previewIconSize: 30,
  previewIconRadius: 9,
  previewTitleSize: 12,
  previewSubtitleSize: 9,
  previewLabelSize: 8,
  previewValueSize: 10,
  previewRowGap: 6,
  previewRowPaddingY: 6,
  previewRadius: 10,
  previewColumns: 1,
  previewStatusSize: 9,
};

export const TABLET_KYC_TOKENS: KycResponsiveTokens = {
  viewport: "tablet",
  pagePaddingX: 10,
  pagePaddingTop: 7,
  pagePaddingBottom: 6,
  pageGap: 8,
  contentColumns: 1,
  contentGap: 6,
  panelPaddingX: 12,
  panelPaddingY: 10,
  panelRadius: 14,
  panelHeaderGap: 8,
  panelHeaderHeight: 36,
  panelHeaderPaddingBottom: 7,
  fieldColumns: 2,
  fieldColumnGap: 9,
  fieldRowGap: 7,
  fieldGap: 4,
  labelGap: 4,
  labelFontSize: 9,
  labelFontWeight: 650,
  labelLetterSpacing: 0.35,
  inputHeight: 40,
  inputPaddingX: 11,
  inputRadius: 9,
  inputFontSize: 11,
  inputFontWeight: 500,
  inputIconSize: 16,
  inputIconOffset: 10,
  previewPaddingX: 10,
  previewPaddingY: 10,
  previewGap: 8,
  previewIconSize: 32,
  previewIconRadius: 10,
  previewTitleSize: 13,
  previewSubtitleSize: 9.5,
  previewLabelSize: 8.5,
  previewValueSize: 10.5,
  previewRowGap: 7,
  previewRowPaddingY: 7,
  previewRadius: 11,
  previewColumns: 2,
  previewStatusSize: 9.5,
};

export const LAPTOP_KYC_TOKENS: KycResponsiveTokens = {
  viewport: "laptop",
  pagePaddingX: 14,
  pagePaddingTop: 8,
  pagePaddingBottom: 6,
  pageGap: 9,
  contentColumns: 1,
  contentGap: 6,
  panelPaddingX: 14,
  panelPaddingY: 11,
  panelRadius: 17,
  panelHeaderGap: 10,
  panelHeaderHeight: 28,
  panelHeaderPaddingBottom: 12,
  fieldColumns: 2,
  fieldColumnGap: 12,
  fieldRowGap: 18,
  fieldGap: 7,
  labelGap: 5,
  labelFontSize: 10,
  labelFontWeight: 650,
  labelLetterSpacing: 0.35,
  inputHeight: 42,
  inputPaddingX: 14,
  inputRadius: 11,
  inputFontSize: 12,
  inputFontWeight: 600,
  inputIconSize: 17,
  inputIconOffset: 12,
  previewPaddingX: 12,
  previewPaddingY: 12,
  previewGap: 9,
  previewIconSize: 28,
  previewIconRadius: 11,
  previewTitleSize: 14,
  previewSubtitleSize: 10,
  previewLabelSize: 10,
  previewValueSize: 12,
  previewRowGap: 14,
  previewRowPaddingY: 8,
  previewRadius: 12,
  previewColumns: 2,
  previewStatusSize: 12,
};

export const DESKTOP_KYC_TOKENS: KycResponsiveTokens = {
  viewport: "desktop",
  pagePaddingX: 18,
  pagePaddingTop: 8,
  pagePaddingBottom: 6,
  pageGap: 9,
  contentColumns: 1,
  contentGap: 7,
  panelPaddingX: 16,
  panelPaddingY: 12,
  panelRadius: 17,
  panelHeaderGap: 11,
  panelHeaderHeight: 29,
  panelHeaderPaddingBottom: 12,
  fieldColumns: 2,
  fieldColumnGap: 14,
  fieldRowGap: 9,
  fieldGap: 5,
  labelGap: 5,
  labelFontSize: 10,
  labelFontWeight: 650,
  labelLetterSpacing: 0.4,
  inputHeight: 45,
  inputPaddingX: 15,
  inputRadius: 11,
  inputFontSize: 13,
  inputFontWeight: 600,
  inputIconSize: 18,
  inputIconOffset: 12,
  previewPaddingX: 13,
  previewPaddingY: 13,
  previewGap: 10,
  previewIconSize: 35,
  previewIconRadius: 12,
  previewTitleSize: 14,
  previewSubtitleSize: 10.5,
  previewLabelSize: 10,
  previewValueSize: 12.5,
  previewRowGap: 14,
  previewRowPaddingY: 8,
  previewRadius: 13,
  previewColumns: 2,
  previewStatusSize: 12.5,
};

export function getKycTokens(
  viewport: ResponsiveViewport,
): KycResponsiveTokens {
  switch (viewport) {
    case "mobile":
      return MOBILE_KYC_TOKENS;
    case "tablet":
      return TABLET_KYC_TOKENS;
    case "laptop":
      return LAPTOP_KYC_TOKENS;
    case "desktop":
      return DESKTOP_KYC_TOKENS;
    default:
      return LAPTOP_KYC_TOKENS;
  }
}

export const DEFAULT_KYC_TOKENS: KycResponsiveTokens =
  LAPTOP_KYC_TOKENS;
