/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ADDRESS FORM
   RESPONSIVE LAYOUT

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Resolve Address workspace geometry
   - Resolve vertical section distribution
   - Resolve address field grid
   - Resolve input / icon geometry
   - Resolve address preview geometry

   IMPORTANT:

   - No viewport detection.
   - No media queries.
   - No hard-coded breakpoint decisions.
   - All geometry comes from AddressResponsiveTokens.
   - Address Information and Address Preview are vertically
     stacked as one continuous workspace.
   - Address fields remain token-driven.
   - No Address Proof / Map / GIS / Verification layout exists.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  AddressResponsiveTokens,
} from "./address.tokens";


/* ===========================================================
   PAGE
=========================================================== */

export function createAddressPageStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      tokens.minWidth,

    minHeight:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.pageGap}px`,

    padding:
  `${tokens.pagePaddingTop}px 0 ${tokens.pagePaddingBottom}px ${tokens.pagePaddingX}px`,

    overflow:
      "hidden",

  };

}


/* ===========================================================
   MAIN CONTENT

   IMPORTANT:

   Address Information and Address Preview must remain
   vertically stacked.

   The responsive engine owns the geometry. The outer
   workspace intentionally uses one column so the two
   sections behave as one continuous form.
=========================================================== */

export function createAddressContentStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    flex:
      "1 1 auto",

    width:
      "100%",

    minWidth:
      tokens.minWidth,

    minHeight:
      0,

    display:
      "grid",

    /*
     * OUTER WORKSPACE:
     *
     * Address Information
     *        ↓
     * Address Preview
     *
     * Do NOT use contentColumns here because the
     * Address Information and Preview sections are
     * intentionally stacked vertically.
     */
    gridTemplateColumns:
      "minmax(0, 1fr)",

    gridAutoRows:
      "auto",

    gap:
      `${tokens.sectionGap}px`,

    overflow:
      "hidden",

    boxSizing:
      "border-box",

    alignItems:
      "stretch",

  };

}


/* ===========================================================
   SECTION
=========================================================== */

export function createAddressSectionStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    position:
      "relative",

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    padding:
      `${tokens.sectionPaddingY}px ${tokens.sectionPaddingX}px`,

    borderRadius:
      `${tokens.sectionRadius}px`,

    border:
      "1px solid var(--finora-theme-border-default, #D9DEE7)",

    background:
      "var(--finora-theme-surface, #FFFFFF)",

    boxShadow:
      "0 7px 18px var(--finora-theme-overlay-shadow, rgba(15,23,42,.14))",

    overflow:
      "hidden",

    clipPath:
  `inset(0 round ${tokens.sectionRadius}px)`,  

  };

}


/* ===========================================================
   SECTION HEADER
=========================================================== */

export function createAddressSectionHeaderStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      `${tokens.sectionHeaderHeight}px`,

    flexShrink:
      0,

    display:
      "flex",

    alignItems:
      "center",

    gap:
      `${tokens.sectionHeaderGap}px`,

    paddingBottom:
      `${tokens.sectionHeaderPaddingBottom}px`,

    boxSizing:
      "border-box",

    borderBottom:
      "1px solid var(--finora-theme-border-subtle, #E8EBF0)",

  };

}


/* ===========================================================
   SECTION ICON
=========================================================== */

export function createAddressSectionIconStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      `${tokens.sectionIconSize}px`,

    height:
      `${tokens.sectionIconSize}px`,

    minWidth:
      `${tokens.sectionIconSize}px`,

    minHeight:
      `${tokens.sectionIconSize}px`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink:
      0,

    boxSizing:
      "border-box",

    borderRadius:
      "50%",

    color:
  "var(--finora-theme-brand-accent, #4D82E6)",

    background: "transparent",

    border:
      "1px solid var(--finora-theme-brand-accent, #D4AF37)",

    boxShadow:
      "0 4px 10px var(--finora-theme-overlay-shadow, rgba(15,23,42,.14))",

  };

}


/* ===========================================================
   FIELD AREA
=========================================================== */

export function createAddressFieldAreaStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    flex:
      "1 1 auto",

    width:
      "100%",

    minWidth:
      tokens.minWidth,

    minHeight:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    paddingTop:
  `${tokens.fieldGap * 2}px`,

    boxSizing:
      "border-box",

    overflow:
      "hidden",

  };

}


/* ===========================================================
   ADDRESS GRID

   Laptop / Desktop:
   2 fields per row.

   Example:

   Current Address | Permanent Address
   City / Village  | District
   State           | PIN Code

   Mobile:
   Address tokens can resolve this to 1 column.
=========================================================== */

export function createAddressGridStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      tokens.minWidth,

    display:
      "grid",

    gridTemplateColumns:
      `repeat(${tokens.addressColumns}, minmax(0, 1fr))`,

    columnGap:
      `${tokens.addressColumnGap}px`,

    rowGap:
      `${tokens.addressRowGap}px`,

    boxSizing:
      "border-box",

    alignItems:
      "stretch",

  };

}


/* ===========================================================
   FULL ADDRESS FIELD
=========================================================== */

export function createFullAddressFieldStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    gridColumn:
      `span ${Math.min(
        tokens.fullAddressColumns,
        tokens.addressColumns,
      )}`,

    minWidth:
      0,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   FIELD
=========================================================== */

export function createAddressFieldStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.fieldGap}px`,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   LABEL
=========================================================== */

export function createAddressLabelStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "center",

    minHeight:
      `${tokens.labelFontSize + 4}px`,

    color:
      "var(--finora-theme-text-primary, #171A21)",

    fontFamily:
      "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",

    fontSize:
      `${tokens.labelFontSize}px`,

    fontWeight:
      tokens.labelFontWeight,

    letterSpacing:
      `${tokens.labelLetterSpacing}px`,

    lineHeight:
      1.15,

    textTransform:
      "uppercase",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   INPUT WRAPPER
=========================================================== */

export function createAddressInputWrapperStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    position:
      "relative",

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   FIELD ICON
=========================================================== */

export function createAddressFieldIconStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    position:
      "absolute",

    left:
      `${tokens.fieldIconOffset}px`,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    width:
      `${tokens.fieldIconSize}px`,

    height:
      `${tokens.fieldIconSize}px`,

    flexShrink:
      0,

    color:
      "var(--finora-theme-brand-accent, #D4AF37)",

    pointerEvents:
      "none",

    zIndex:
      2,

  };

}


/* ===========================================================
   INPUT
=========================================================== */

export function createAddressInputStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    height:
      `${tokens.inputHeight}px`,

    boxSizing:
      "border-box",

    padding:
      `0 ${tokens.inputPaddingX}px 0 ${
        tokens.inputPaddingX +
        tokens.fieldIconSize +
        tokens.fieldIconOffset
      }px`,

    border:
      "1px solid var(--finora-theme-border-strong, #B8C0CC)",

    borderRadius:
      `${tokens.inputRadius}px`,

    outline:
      "none",

    background:
      "var(--finora-theme-surface-muted, #F1F3F6)",

    color:
      "var(--finora-theme-text-primary, #171A21)",

    fontFamily:
      "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",

    fontSize:
      `${tokens.inputFontSize}px`,

    fontWeight:
      tokens.inputFontWeight,

    lineHeight:
      1.25,

    transition:
      "border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",

    appearance:
      "none",

    WebkitAppearance:
      "none",

  };

}


/* ===========================================================
   LONG ADDRESS INPUT
=========================================================== */

export function createAddressLongInputStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    ...createAddressInputStyle(
      tokens,
    ),

    height:
      `${tokens.addressInputHeight}px`,

    fontSize:
      `${tokens.inputFontSize + 0.5}px`,

  };

}


/* ===========================================================
   SELECT CHEVRON
=========================================================== */

export function createAddressSelectChevronStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    position:
      "absolute",

    right:
      `${tokens.inputPaddingX}px`,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    width:
      `${tokens.selectChevronSize}px`,

    height:
      `${tokens.selectChevronSize}px`,

    color:
      "var(--finora-theme-text-muted, #7A8494)",

    pointerEvents:
      "none",

    zIndex:
      2,

  };

}


/* ===========================================================
   ADDRESS PREVIEW
=========================================================== */

export function createAddressPreviewStyle(
  tokens: AddressResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    minWidth: `${tokens.minWidth}px`,
    boxSizing: "border-box",

    padding: "0",

    border: "none",
    borderRadius: "0",

    background: "transparent",

    display: "flex",
    flexDirection: "column",

    gap: `${tokens.previewGap}px`,
  };
}

/* ===========================================================
   PREVIEW HEADER
=========================================================== */

export function createAddressPreviewHeaderStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "center",

    gap:
      `${tokens.previewGap}px`,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   PREVIEW ICON
=========================================================== */

export function createAddressPreviewIconStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      `${tokens.previewIconSize}px`,

    height:
      `${tokens.previewIconSize}px`,

    minWidth:
      `${tokens.previewIconSize}px`,

    minHeight:
      `${tokens.previewIconSize}px`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    borderRadius:
      `${tokens.previewIconRadius}px`,

   background: "transparent",

color:
  "var(--finora-theme-brand-accent, #4D82E6)",

    border:
  "1px solid var(--finora-theme-brand-accent, #4D82E6)",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   PREVIEW TITLE
=========================================================== */

export function createAddressPreviewTitleStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    margin:
      0,

    minWidth:
      0,

    color:
      "var(--finora-theme-text-primary, #171A21)",

    fontFamily: 'Georgia, "Times New Roman", serif',

    fontSize:
      `${tokens.previewTitleSize}px`,

    fontWeight:
      700,

    lineHeight:
      1.15,

  };

}


/* ===========================================================
   PREVIEW SUBTITLE
=========================================================== */

export function createAddressPreviewSubtitleStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    margin:
      "6px 0 0",

    color:
      "var(--finora-theme-text-secondary, #4B5563)",

    fontSize:
      `${tokens.previewSubtitleSize + 1}px`,

    fontWeight:
      600,

    lineHeight:
      1.25,

  };

}


/* ===========================================================
   PREVIEW ROWS
=========================================================== */

export function createAddressPreviewRowsStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.previewRowGap}px`,

    minHeight:
      0,

  };

}


/* ===========================================================
   PREVIEW ROW
=========================================================== */

export function createAddressPreviewRowStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    padding:
      `${tokens.previewRowPaddingY}px ${tokens.previewPaddingX}px`,

    boxSizing:
      "border-box",

    borderRadius:
      `${Math.max(8, tokens.previewRadius - 2)}px`,

    border:
  "1px solid var(--finora-theme-border-subtle, #E8EBF0)",

    background:
  "var(--finora-theme-background-surface-muted, #F3F5F8)",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${Math.max(2, tokens.labelGap - 1)}px`,

    overflow:
      "hidden",

  };

}


/* ===========================================================
   PREVIEW LABEL
=========================================================== */

export function createAddressPreviewLabelStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    margin:
      0,

    color:
      "var(--finora-theme-text-muted, #7A8494)",

    fontSize:
      `${tokens.previewLabelSize}px`,

    fontWeight:
      800,

    letterSpacing:
      `${tokens.labelLetterSpacing}px`,

    lineHeight:
      1.1,

    textTransform:
      "uppercase",

  };

}


/* ===========================================================
   PREVIEW VALUE
=========================================================== */

export function createAddressPreviewValueStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    margin:
      0,

    color:
      "var(--finora-theme-text-primary, #171A21)",

    fontSize:
      `${tokens.previewValueSize}px`,

    fontWeight:
      650,

    lineHeight:
      1.25,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   PREVIEW META GRID
=========================================================== */

export function createAddressPreviewMetaGridStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    display:
      "grid",

    gridTemplateColumns:
      tokens.previewMetaColumns === 1
        ? "minmax(0, 1fr)"
        : `repeat(${tokens.previewMetaColumns}, minmax(0, 1fr))`,

    gap:
      `${tokens.previewMetaGap}px`,

  };

}


/* ===========================================================
   PREVIEW META ITEM
=========================================================== */

export function createAddressPreviewMetaItemStyle(
  tokens:
    AddressResponsiveTokens,
):
  CSSProperties {

  return {

    minWidth:
      0,

    padding:
      `${tokens.previewRowPaddingY}px ${tokens.previewPaddingX}px`,

    borderRadius:
      `${Math.max(8, tokens.previewRadius - 2)}px`,

    border:
  "1px solid var(--finora-theme-border-subtle, #E8EBF0)",

    background:
  "var(--finora-theme-background-surface-muted, #F3F5F8)",

    boxSizing:
      "border-box",

    overflow:
      "hidden",

  };

}


/* ===========================================================
   END
=========================================================== */