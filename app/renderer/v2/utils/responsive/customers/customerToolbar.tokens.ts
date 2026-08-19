/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER TOOLBAR RESPONSIVE ENGINE™

   SINGLE SOURCE OF TRUTH
   -----------------------------------------------------------
   Controls:
   - Add Customer
   - Search
   - Edit Customer

   Components consume these values.

   No viewport calculations or breakpoint logic belong
   inside Customer Hub components.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveViewport,
} from "./customers.tokens";

/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerToolbarTokens {

  gridTemplateColumns:
    string;

  gridTemplateAreas:
    string;

  gap:
    number;

  button: {

    width:
      string;

    maxWidth:
      number;

    height:
      number;

    minHeight:
      number;

    paddingX:
      number;

    fontSize:
      number;

    iconSize:
      number;

    radius:
      number;

    gap:
      number;

  };

  search: {

    width:
      string;

    maxWidth:
      number;

    height:
      number;

    paddingX:
      number;

    fontSize:
      number;

    iconSize:
      number;

    gap:
      number;

  };

}

/* ===========================================================
   MOBILE
=========================================================== */

const MOBILE_CUSTOMER_TOOLBAR:
  CustomerToolbarTokens = {

  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, 1fr)",

  gridTemplateAreas:
    '"add edit" "search search"',

  gap:
    10,

  button: {

    width:
      "100%",

    maxWidth:
      180,

    height:
      38,

    minHeight:
      38,

    paddingX:
      8,

    fontSize:
      12,

    iconSize:
      16,

    radius:
      9,

    gap:
      6,

  },

  search: {

    width:
      "100%",

    maxWidth:
      360,

    height:
      36,

    paddingX:
      10,

    fontSize:
      13,

    iconSize:
      16,

    gap:
      6,

  },

};

/* ===========================================================
   TABLET
=========================================================== */

const TABLET_CUSTOMER_TOOLBAR:
  CustomerToolbarTokens = {

  gridTemplateColumns:
    "minmax(0, 1fr) minmax(240px, 1.4fr) minmax(0, 1fr)",

  gridTemplateAreas:
    '"add search edit"',

  gap:
    14,

  button: {

    width:
      "100%",

    maxWidth:
      180,

    height:
      40,

    minHeight:
      40,

    paddingX:
      10,

    fontSize:
      13,

    iconSize:
      17,

    radius:
      9,

    gap:
      7,

  },

  search: {

    width:
      "100%",

    maxWidth:
      420,

    height:
      38,

    paddingX:
      11,

    fontSize:
      13,

    iconSize:
      17,

    gap:
      7,

  },

};

/* ===========================================================
   LAPTOP
=========================================================== */

const LAPTOP_CUSTOMER_TOOLBAR:
  CustomerToolbarTokens = {

  gridTemplateColumns:
    "minmax(160px, 180px) minmax(0, 1fr) minmax(160px, 180px)",

  gridTemplateAreas:
    '"add search edit"',

  gap:
    16,

  button: {

    width:
      "100%",

    maxWidth:
      180,

    height:
      42,

    minHeight:
      42,

    paddingX:
      12,

    fontSize:
      14,

    iconSize:
      18,

    radius:
      9,

    gap:
      8,

  },

  search: {

    width:
      "100%",

    maxWidth:
      440,

    height:
      40,

    paddingX:
      12,

    fontSize:
      14,

    iconSize:
      17,

    gap:
      8,

  },

};

/* ===========================================================
   DESKTOP
=========================================================== */

const DESKTOP_CUSTOMER_TOOLBAR:
  CustomerToolbarTokens = {

  gridTemplateColumns:
    "minmax(180px, 200px) minmax(0, 1fr) minmax(180px, 200px)",

  gridTemplateAreas:
    '"add search edit"',

  gap:
    20,

  button: {

    width:
      "100%",

    maxWidth:
      200,

    height:
      44,

    minHeight:
      42,

    paddingX:
      14,

    fontSize:
      14,

    iconSize:
      18,

    radius:
      9,

    gap:
      10,

  },

  search: {

    width:
      "100%",

    maxWidth:
      500,

    height:
      42,

    paddingX:
      12,

    fontSize:
      14,

    iconSize:
      18,

    gap:
      8,

  },

};

/* ===========================================================
   RESPONSIVE RESOLVER
=========================================================== */

export function getCustomerToolbarTokens(

  viewport:
    ResponsiveViewport,

):
  CustomerToolbarTokens {

  if (
    viewport ===
    "mobile"
  ) {

    return MOBILE_CUSTOMER_TOOLBAR;

  }

  if (
    viewport ===
    "tablet"
  ) {

    return TABLET_CUSTOMER_TOOLBAR;

  }

  if (
    viewport ===
    "laptop"
  ) {

    return LAPTOP_CUSTOMER_TOOLBAR;

  }

  return DESKTOP_CUSTOMER_TOOLBAR;

}

/* ===========================================================
   END
=========================================================== */