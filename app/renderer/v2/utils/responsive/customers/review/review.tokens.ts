/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 6 — REVIEW RESPONSIVE TOKENS™

   Version     : 1.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Own Step 6 Review workspace responsive geometry.
   - Mobile / Tablet → one review panel per row.
   - Laptop / Desktop → final 2 × 2 review workspace.
   - Keep all responsive geometry inside the Responsive Engine.

   IMPORTANT:

   - No React.
   - No theme palette.
   - No viewport detection.
   - No window.innerWidth.
   - No media queries.
   - Step6Review.styles.ts consumes these resolved values.
=========================================================== */

import type {
  ResponsiveViewport,
} from "../customers.tokens";


/* ===========================================================
   TYPES
=========================================================== */

export interface ReviewResponsiveTokens {

  viewport:
    ResponsiveViewport;

  workspace: {

    gridTemplateColumns:
      string;

    gridTemplateRows:
      string;

    columnGap:
      number;

    rowGap:
      number;

    padding:
      string;

    overflowY:
      "auto" | "hidden";

    actionPanelHeight:
      string;

  };

    stackOrder: {

    nomineePreview:
      number;

    reviewChecklist:
      number;

    other:
      number;

  };

}


/* ===========================================================
   MOBILE
=========================================================== */

export const MOBILE_REVIEW_TOKENS:
  ReviewResponsiveTokens = {

  viewport:
    "mobile",

  workspace: {

    gridTemplateColumns:
      "minmax(0, 1fr)",

    gridTemplateRows:
      "none",

    columnGap:
      0,

    rowGap:
      8,

    padding:
  "10px 0",

    overflowY:
      "auto",

    actionPanelHeight:
      "auto",

  },

    stackOrder: {

    nomineePreview:
      1,

    reviewChecklist:
      2,

    other:
      3,

  },

};


/* ===========================================================
   TABLET
=========================================================== */

export const TABLET_REVIEW_TOKENS:
  ReviewResponsiveTokens = {

  viewport:
    "tablet",

  workspace: {

    gridTemplateColumns:
      "minmax(0, 1fr)",

    gridTemplateRows:
      "none",

    columnGap:
      0,

    rowGap:
      10,

    padding:
  "10px 0",

    overflowY:
      "auto",

    actionPanelHeight:
      "auto",

  },

    stackOrder: {

    nomineePreview:
      1,

    reviewChecklist:
      2,

    other:
      3,

  },

};


/* ===========================================================
   LAPTOP
=========================================================== */

export const LAPTOP_REVIEW_TOKENS:
  ReviewResponsiveTokens = {

  viewport:
    "laptop",

  workspace: {

    gridTemplateColumns:
  "minmax(0, 1fr)",

    gridTemplateRows:
  "auto auto",

    columnGap:
      10,

    rowGap:
      10,

    padding:
  "0",

    overflowY:
      "auto",

    actionPanelHeight:
      "100%",

  },

    stackOrder: {

    nomineePreview:
      1,

    reviewChecklist:
      2,

    other:
      3,

  },

};


/* ===========================================================
   DEFAULT
===========================================================

   Compatibility default used by Step6Review.styles.ts.

   The default desktop/laptop presentation preserves the
   existing Step 6 2 × 2 review workspace when a resolved
   viewport token is not explicitly supplied.
=========================================================== */

export const DEFAULT_REVIEW_TOKENS:
  ReviewResponsiveTokens =
    LAPTOP_REVIEW_TOKENS;


/* ===========================================================
   DESKTOP
=========================================================== */

export const DESKTOP_REVIEW_TOKENS:
  ReviewResponsiveTokens = {

  viewport:
    "desktop",

  workspace: {

    gridTemplateColumns:
  "minmax(0, 1fr)",

    gridTemplateRows:
  "auto auto",

    columnGap:
      10,

    rowGap:
      10,

    padding:
  "0",

    overflowY:
      "auto",

    actionPanelHeight:
      "100%",

  },

    stackOrder: {

    nomineePreview:
      1,

    reviewChecklist:
      2,

    other:
      3,

  },

};


/* ===========================================================
   RESOLVER
=========================================================== */

export function getReviewResponsiveTokens(
  viewport:
    ResponsiveViewport,
):
  ReviewResponsiveTokens {

  switch (
    viewport
  ) {

    case "mobile":
      return MOBILE_REVIEW_TOKENS;

    case "tablet":
      return TABLET_REVIEW_TOKENS;

    case "laptop":
      return LAPTOP_REVIEW_TOKENS;

    case "desktop":
    default:
      return DESKTOP_REVIEW_TOKENS;

  }

}


/* ===========================================================
   END
=========================================================== */