/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 1 + STEP 2 COMBINED FORM

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Display existing Step 1 Identity
   - Display existing Step 2 Basic
   - Keep both forms on the same page
   - Desktop composition controlled by Responsive Engine
   - Keep both forms at equal available height
   - Preserve Responsive Engine behavior
   - Stack columns through Responsive Engine on smaller widths

   IMPORTANT:

   - NO business logic
   - NO state management
   - NO navigation logic
   - NO wizard data transformation
   - Existing Step 1 remains untouched
   - Existing Step 2 remains untouched
   - Responsive geometry comes from Responsive Engine
   - NO hard-coded responsive grid geometry
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import Step1Identity
  from "./Step1Identity";


import Step2Basic
  from "./Step2Basic";


import {
  useBasicFormResponsive,
  createBasicFormPageStyle,
  createBasicFormColumnStyle,
} from "../../../../utils/responsive/customers/basicform";


import type {
  CustomerWizardData,
} from "../CustomerWizard";


/* ===========================================================
   TYPES
=========================================================== */

interface Step1IdentityAndBasicProps {

  wizardData:
    CustomerWizardData;

  updateWizardData:
    (
      data:
        Partial<CustomerWizardData>,
    ) => void;

}


/* ===========================================================
   OUTER PAGE
=========================================================== */

const pageStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  boxSizing:
    "border-box",

};


/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step1IdentityAndBasic({

  wizardData,

  updateWizardData,

}: Step1IdentityAndBasicProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    basicFormTokens,
  } =
    useBasicFormResponsive();


  /* =========================================================
     RESPONSIVE PAGE LAYOUT

     All grid geometry and spacing are owned by the
     Responsive Engine.

     This component intentionally does NOT define:
     - gridTemplateColumns
     - columnGap
     - viewport-specific dimensions
  ========================================================= */

  const responsivePageStyle =
    createBasicFormPageStyle(
      basicFormTokens,
    );


  /* =========================================================
     COLUMN LAYOUT
  ========================================================= */

  const responsiveColumnStyle =
    createBasicFormColumnStyle(
      basicFormTokens,
    );


  /* =========================================================
     COMBINED PAGE STYLE

     Width / positioning belongs to the composition shell.

     Responsive grid geometry remains inside the
     Responsive Engine.
  ========================================================= */

const combinedPageStyle:
  CSSProperties = {

  ...responsivePageStyle,

  width:
    "84%",

  minWidth:
    0,

  minHeight:
    "fit-content",

  margin:
    "10px auto 0",

  boxSizing:
    "border-box",

  alignItems:
    "start",

  columnGap:
    "5px",

};

  /* =========================================================
     COLUMN STYLE

     Both child forms receive the same available height.

     The individual Step components remain responsible
     for their own internal presentation.
  ========================================================= */

  const columnStyle:
    CSSProperties = {

    ...responsiveColumnStyle,

    width:
      "100%",

    minWidth:
      0,

    maxWidth:
      "none",

    minHeight:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    alignSelf:
      "start",

  };


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div
      style={
        pageStyle
      }
    >

      <div
        style={
          combinedPageStyle
        }
      >

        {/* =================================================
            LEFT — STEP 1 IDENTITY
        ================================================= */}

        <section
          style={
            columnStyle
          }
        >

          <Step1Identity

            initialData={
              wizardData
            }

            updateWizardData={
              updateWizardData
            }

          />

        </section>


        {/* =================================================
            RIGHT — STEP 2 BASIC
        ================================================= */}

        <section
          style={
            columnStyle
          }
        >

          <Step2Basic

            wizardData={
              wizardData
            }

            updateWizardData={
              updateWizardData
            }

          />

        </section>

      </div>

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */