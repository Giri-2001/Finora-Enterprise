/* ===========================================================
   FINORA ENTERPRISE V2

   CUSTOMER WIZARD LAYOUT
--------------------------------------------------------------
   Reusable transparent layout.

   Updated:
   - Removed internal page header
   - Removed extra white container
   - Removed registration title spacing
   - Allows Smart Wall to touch main header
=========================================================== */

import type {
  ReactNode,
} from "react";


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

    <>

      {children}

    </>

  );

}
