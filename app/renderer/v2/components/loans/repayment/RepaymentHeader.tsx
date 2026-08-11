/* ===========================================================
FINORA ENTERPRISE V2
REPAYMENT STUDIO
HEADER
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import {
  accentStyle,
  contentStyle,
  headerStyle,
  subtitleStyle,
  textWrapperStyle,
  titleStyle,
} from "./RepaymentHeader.styles";

/* ===========================================================
COMPONENT
=========================================================== */

export default function RepaymentHeader() {
  return (
    <header style={headerStyle}>
      <div style={contentStyle}>
        <div style={accentStyle} />

        <div style={textWrapperStyle}>
          <h1 style={titleStyle}>
            Repayment Studio™
          </h1>

          <p style={subtitleStyle}>
            Configure repayment schedule, EMI options and collection frequency.
          </p>
        </div>
      </div>
    </header>
  );
}

/* ===========================================================
END
=========================================================== */
