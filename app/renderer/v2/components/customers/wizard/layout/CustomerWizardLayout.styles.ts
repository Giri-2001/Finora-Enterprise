/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD LAYOUT STYLES™

   Responsibility:
   - Customer Wizard shell presentation only
   - No React logic
   - No component state
   - No breakpoint calculations
   - Responsive values come from FINORA Responsive Engine

   Architecture:
   CustomerWizardLayout.tsx
           ↓
   CustomerWizardLayout.styles.ts
           ↓
   FINORA Responsive Engine

   SCROLL CONTRACT:
   - Shell itself NEVER scrolls
   - Progress NEVER scrolls
   - Navigation NEVER scrolls
   - ONLY wizard content scrolls
   - Content has responsive bottom breathing space
   - Content can never disappear behind navigation
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/types";


/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerWizardLayoutStyles {

  shell: CSSProperties;

  progress: CSSProperties;

  content: CSSProperties;

  navigation: CSSProperties;

}


/* ===========================================================
   STYLES
=========================================================== */

export function useCustomerWizardLayoutStyles(

  tokens:
    ResponsiveTokens,

):
  CustomerWizardLayoutStyles {


  return {


    /* =======================================================
       WIZARD SHELL

       IMPORTANT:

       The shell owns the complete available wizard
       workspace.

       overflow:
         hidden

       prevents the browser/page itself from becoming the
       scroll owner.

       The middle content region owns scrolling.
    ======================================================= */

    shell: {

      width:
        "100%",

      height:
        "100%",

      minWidth:
        0,

      minHeight:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      overflow:
        "hidden",

      boxSizing:
        "border-box",

    },


    /* =======================================================
       PROGRESS REGION

       Fixed inside the wizard shell.

       It does NOT shrink when the content becomes long.
    ======================================================= */

    progress: {

      width:
        "100%",

      minWidth:
        0,

      flex:
        "0 0 auto",

      flexShrink:
        0,

      boxSizing:
        "border-box",

      position:
        "relative",

      zIndex:
        2,

    },


    /* =======================================================
       CURRENT WIZARD CONTENT

       THIS IS THE ONLY SCROLL OWNER.

       flex:
         1 1 auto

       minHeight:
         0

       are critical for nested flex scrolling.

       paddingBottom:
         Responsive Engine wizard padding

       gives the last form fields enough breathing space
       before the fixed navigation begins.
    ======================================================= */

    content: {

      width:
        "100%",

      minWidth:
        0,

      minHeight:
        0,

      flex:
        "1 1 auto",

      flexShrink:
        1,

      overflowY:
        "auto",

      overflowX:
        "hidden",

      boxSizing:
        "border-box",

      paddingBottom: 100,

      scrollbarGutter:
        "stable",

      WebkitOverflowScrolling:
        "touch",

    },


    /* =======================================================
       NAVIGATION REGION

       Fixed bottom region.

       It remains visible while the current step content
       scrolls above it.

       IMPORTANT:

       Navigation itself does NOT become part of the scroll
       content.
    ======================================================= */

    navigation: {

      width:
        "100%",

      minWidth:
        0,

      flex:
        "0 0 auto",

      flexShrink:
        0,

      boxSizing:
        "border-box",

      position:
        "relative",

      zIndex:
        3,

    },

  };

}


/* ===========================================================
   END
=========================================================== */