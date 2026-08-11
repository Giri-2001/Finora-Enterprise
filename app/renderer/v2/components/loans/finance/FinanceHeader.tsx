/* ===========================================================
FINORA ENTERPRISE V2
FINANCE STUDIO
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
} from "./FinanceHeader.styles";

/* ===========================================================
COMPONENT
=========================================================== */

export default function FinanceHeader() {
  return (
    <header style={headerStyle}>
      <div style={contentStyle}>
        <div style={accentStyle} />

        <div style={textWrapperStyle}>
          <h1 style={titleStyle}>
            Finance Studio™
          </h1>

          <p style={subtitleStyle}>
            Configure loan interest, processing fees and financial rules.
          </p>
        </div>
      </div>
    </header>
  );
}

/* ===========================================================
END
=========================================================== */
