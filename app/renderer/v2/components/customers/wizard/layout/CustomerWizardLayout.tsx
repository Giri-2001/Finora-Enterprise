/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD LAYOUT™

   Responsive bounded workspace shell for all FINORA
   Customer Wizard flows.

   Rules:
   - No page scrolling
   - Full viewport usage
   - Existing FINORA GlobalHeader remains outside
   - Children control their own presentation
   - Add / Edit use the same shell

   Architecture:
   - No inline styles
   - Visual styles owned by CustomerWizardLayout.styles.ts
   - Responsive values owned by FINORA Responsive Engine
=========================================================== */

import type {
  ReactNode,
} from "react";


/* ===========================================================
   STYLES
=========================================================== */

import {
  useCustomerWizardLayoutStyles,
} from "./CustomerWizardLayout.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface CustomerWizardLayoutProps {

  children: ReactNode;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWizardLayout({

  children,

}: CustomerWizardLayoutProps) {

  const styles =
    useCustomerWizardLayoutStyles();


  return (

    <main
      style={
        styles.shell
      }
    >

      {children}

    </main>

  );

}


/* ===========================================================
   END
=========================================================== */