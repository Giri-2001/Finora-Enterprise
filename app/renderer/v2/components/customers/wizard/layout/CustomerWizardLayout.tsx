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
=========================================================== */

import type {
  ReactNode,
} from "react";

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

  return (

    <main
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,

        display: "flex",
        flexDirection: "column",

        overflow: "hidden",

        boxSizing: "border-box",
      }}
    >

      {children}

    </main>

  );

}
