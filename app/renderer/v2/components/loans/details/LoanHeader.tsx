// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN HEADER
//
// RESPONSIBILITY:
// - Render Loan Details Studio page header
// - Maintain Loan-specific header presentation
//
// IMPORTANT:
// - No business logic.
// - No persistence logic.
// - No common Design System modification.
// - Styling is maintained by LoanHeader.styles.ts.
//
// THEME:
// - FINORA Login-inspired dark navy
// - Primary Blue: #2563EB
// - No brown.
// - No gold.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  headerStyle,
  accentStyle,
  titleStyle,
  subtitleStyle,
} from "./LoanHeader.styles";

// ============================================================
// COMPONENT
// ============================================================

export default function LoanHeader() {

  return (

    <header style={headerStyle}>

      {/* ====================================================
          BLUE ACCENT
      ==================================================== */}

      <div
        style={accentStyle}
        aria-hidden="true"
      />

      {/* ====================================================
          TITLE
      ==================================================== */}

      <h1 style={titleStyle}>
        Loan Details Studio™
      </h1>

      {/* ====================================================
          SUBTITLE
      ==================================================== */}

      <p style={subtitleStyle}>
        Create and configure a new loan for an existing customer.
      </p>

    </header>

  );
}

// ============================================================
// END
// ============================================================
