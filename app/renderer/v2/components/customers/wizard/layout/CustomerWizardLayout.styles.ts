/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD LAYOUT STYLES™

   Responsibility:
   - Customer Wizard shell presentation only
   - No React logic
   - No component state
   - No breakpoint calculations
   - Responsive values must come from FINORA Responsive Engine

   Architecture:
   CustomerWizardLayout.tsx
           ↓
   CustomerWizardLayout.styles.ts
           ↓
   Customers Responsive Engine
=========================================================== */

import type {
  CSSProperties,
} from "react";


/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerWizardLayoutStyles {

  shell: CSSProperties;

}


/* ===========================================================
   STYLES
=========================================================== */

export function useCustomerWizardLayoutStyles():
  CustomerWizardLayoutStyles {

  return {

    shell: {

      width: "100%",

      height: "100%",

      minHeight: 0,

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      overflow: "hidden",

      boxSizing: "border-box",

    },

  };

}