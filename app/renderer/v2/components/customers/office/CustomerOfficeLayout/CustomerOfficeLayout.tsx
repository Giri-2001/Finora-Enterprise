/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE LAYOUT™

   COMPONENT
=========================================================== */

import type {
  CustomerOfficeLayoutProps,
} from "./types";

import {

  containerStyle,

  headerStyle,

  titleStyle,

  subtitleStyle,

  bodyStyle,

} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerOfficeLayout({

  children,

}: CustomerOfficeLayoutProps) {

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
