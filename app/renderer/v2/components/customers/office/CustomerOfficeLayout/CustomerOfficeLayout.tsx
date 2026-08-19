/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE LAYOUT™

   COMPONENT

   RESPONSIBILITY:
   - Render Customer Office layout
   - Consume Responsive Engine
   - Keep responsive dimensions centralized
   - Provide responsive header and body structure
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CustomerOfficeLayoutProps,
} from "./types";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  createCustomerOfficeLayoutStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerOfficeLayout({

  children,

}: CustomerOfficeLayoutProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const {

    containerStyle,

    headerStyle,

    titleStyle,

    subtitleStyle,

    bodyStyle,

  } =
    createCustomerOfficeLayoutStyles(
      tokens,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section style={containerStyle}>


      {/* ==========================================
          HEADER
      ========================================== */}

      <header style={headerStyle}>

        <h1 style={titleStyle}>

          CUSTOMER OFFICE™

        </h1>


        <p style={subtitleStyle}>

          Enterprise Customer Management Center

        </p>

      </header>


      {/* ==========================================
          BODY
      ========================================== */}

      <section style={bodyStyle}>

        {children}

      </section>


    </section>

  );

}


/* ===========================================================
   END
=========================================================== */