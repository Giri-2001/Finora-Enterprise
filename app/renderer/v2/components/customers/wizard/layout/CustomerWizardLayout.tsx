/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD LAYOUT™

   Responsive bounded workspace shell for all FINORA
   Customer Wizard flows.

   Rules:
   - No page scrolling
   - Full available workspace usage
   - Existing FINORA GlobalHeader remains outside
   - Progress remains fixed
   - Navigation remains fixed
   - ONLY current wizard content area scrolls
   - Content receives bottom breathing space
   - Add / Edit use the same shell

   Architecture:
   - No inline visual styles
   - Visual styles owned by CustomerWizardLayout.styles.ts
   - Responsive values owned by FINORA Responsive Engine
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ReactNode,
} from "react";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../../utils/responsive";


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

  progress: ReactNode;

  children: ReactNode;

  navigation: ReactNode;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWizardLayout({

  progress,

  children,

  navigation,

}: CustomerWizardLayoutProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     STYLES
  ========================================================= */

  const styles =
    useCustomerWizardLayoutStyles(
      tokens,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <main
      style={
        styles.shell
      }
    >

      {/* =====================================================
         FIXED WIZARD PROGRESS

         This area NEVER participates in content scrolling.
      ===================================================== */}

      <div
        style={
          styles.progress
        }
      >

        {progress}

      </div>


      {/* =====================================================
         SCROLLABLE WIZARD CONTENT

         ONLY this region scrolls vertically.

         The content can therefore extend beyond the visible
         viewport without going underneath the footer.
      ===================================================== */}

      <div
        style={
          styles.content
        }
      >

        {children}

      </div>


      {/* =====================================================
         FIXED WIZARD NAVIGATION

         This area remains visible at the bottom while the
         current step content scrolls independently.
      ===================================================== */}

      <div
        style={
          styles.navigation
        }
      >

        {navigation}

      </div>

    </main>

  );

}


/* ===========================================================
   END
=========================================================== */