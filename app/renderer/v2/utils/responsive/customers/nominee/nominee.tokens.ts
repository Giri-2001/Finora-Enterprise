/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 5 — NOMINEE RESPONSIVE TOKENS™

   Version     : 1.1
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Own Step 5 nominee workspace responsive geometry.
   - Preserve the existing FINORA Responsive Engine contract.
   - Provide Mobile / Tablet / Laptop / Desktop values.
   - Keep breakpoint resolution outside the component.
   - Keep all responsive sizing in the responsive layer.

   IMPORTANT:

   - No React.
   - No business logic.
   - No theme palette.
   - No viewport detection.
   - No window.innerWidth.
   - No media queries.
   - Step5Nominee.tsx consumes these resolved values.

   LAYOUT CONTRACT:

   - Mobile / Tablet:
       One column.

   - Laptop / Desktop:
       EXACT 50% / 50% workspace.

   - The parent CustomerWizard MUST NOT create another
     Step 5 grid around Step5Nominee.

   - If one child is temporarily absent, the grid still
     reserves the second 50% track. This is intentional:
     it exposes an empty right workspace instead of silently
     changing the geometry.

=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveViewport,
} from "../customers.tokens";


/* ===========================================================
   TYPES
=========================================================== */

export interface NomineeResponsiveTokens {

  viewport:
    ResponsiveViewport;

  workspace: {

    gridTemplateColumns:
      string;

    columnGap:
      number;

    rowGap:
      number;

    minWidth:
      number;

    minHeight:
      number;

    leftOrder:
    number;

  rightOrder:
    number;

  };

stackOrder: {

  nomineeForm:
    number;

  nomineePreview:
    number;

  customerSummary:
    number;

  validationStatus:
    number;

  reviewChecklist:
    number;

  other:
    number;

};

    form: {

    gridTemplateColumns:
      string;

    columnGap:
      number;

    rowGap:
      number;

  };

}


/* ===========================================================
   MOBILE
   0 - 767px
=========================================================== */

export const MOBILE_NOMINEE_TOKENS:
  NomineeResponsiveTokens = {

  viewport:
    "mobile",

  workspace: {

    gridTemplateColumns:
      "minmax(0, 1fr)",

    columnGap:
      0,

    rowGap:
      8,

    minWidth:
      0,

    minHeight:
      0,

      leftOrder:
    1,

  rightOrder:
    2,

  },

  stackOrder: {

  nomineeForm:
    1,

  nomineePreview:
    2,

  customerSummary:
    3,

  validationStatus:
    4,

  reviewChecklist:
    5,

  other:
    6,

},

    form: {

    gridTemplateColumns:
      "minmax(0, 1fr)",

    columnGap:
      0,

    rowGap:
      8,

  },

};


/* ===========================================================
   TABLET
   768 - 1023px
=========================================================== */

export const TABLET_NOMINEE_TOKENS:
  NomineeResponsiveTokens = {

  viewport:
    "tablet",

  workspace: {

    gridTemplateColumns:
      "minmax(0, 1fr)",

    columnGap:
      0,

    rowGap:
      10,

    minWidth:
      0,

    minHeight:
      0,

      leftOrder:
    1,

  rightOrder:
    2,

  },

  stackOrder: {

  nomineeForm:
    1,

  nomineePreview:
    2,

  customerSummary:
    3,

  validationStatus:
    4,

  reviewChecklist:
    5,

  other:
    6,

},

    form: {

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    columnGap:
      10,

    rowGap:
      10,

  },

};


/* ===========================================================
   LAPTOP
   1024 - 1599px
=========================================================== */

export const LAPTOP_NOMINEE_TOKENS:
  NomineeResponsiveTokens = {

  viewport:
    "laptop",

  workspace: {

    gridTemplateColumns:
      "minmax(0, 1fr)",

    columnGap:
      0,

    rowGap:
      10,

    minWidth:
      0,

    minHeight:
      0,

      leftOrder:
    1,

  rightOrder:
    2,

  },

  stackOrder: {

  nomineeForm:
    1,

  nomineePreview:
    2,

  customerSummary:
    3,

  validationStatus:
    4,

  reviewChecklist:
    5,

  other:
    6,

},

    form: {

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    columnGap:
      10,

    rowGap:
      10,

  },

};



/* ===========================================================
   DESKTOP
   1600px+
=========================================================== */

export const DESKTOP_NOMINEE_TOKENS:
  NomineeResponsiveTokens = {

  viewport:
    "desktop",

  workspace: {

    gridTemplateColumns:
      "minmax(0, 1fr)",

    columnGap:
      0,

    rowGap:
      12,

    minWidth:
      0,

    minHeight:
      0,

      leftOrder:
    1,

  rightOrder:
    2,

  },

  stackOrder: {

  nomineeForm:
    1,

  nomineePreview:
    2,

  customerSummary:
    3,

  validationStatus:
    4,

  reviewChecklist:
    5,

  other:
    6,

},

    form: {

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    columnGap:
      10,

    rowGap:
      10,

  },

};

/* ===========================================================
   RESOLVER
=========================================================== */

export function getNomineeResponsiveTokens(
  viewport:
    ResponsiveViewport,
):
  NomineeResponsiveTokens {

  switch (
    viewport
  ) {

    case "mobile":

      return MOBILE_NOMINEE_TOKENS;

    case "tablet":

      return TABLET_NOMINEE_TOKENS;

    case "desktop":

      return DESKTOP_NOMINEE_TOKENS;

    case "laptop":

    default:

      return LAPTOP_NOMINEE_TOKENS;

  }

}


/* ===========================================================
   DEFAULT
=========================================================== */

export const DEFAULT_NOMINEE_TOKENS:
  NomineeResponsiveTokens =
    LAPTOP_NOMINEE_TOKENS;


/* ===========================================================
   END
=========================================================== */