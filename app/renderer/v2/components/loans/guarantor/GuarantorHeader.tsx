/* ===========================================================
FINORA ENTERPRISE V2
GUARANTOR STUDIO
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
} from "./GuarantorHeader.styles";

/* ===========================================================
COMPONENT
=========================================================== */

export default function GuarantorHeader() {
  return (
    <header style={headerStyle}>
      <div style={contentStyle}>
        <div style={accentStyle} />

        <div style={textWrapperStyle}>
          <h1 style={titleStyle}>
            Guarantor Studio™
          </h1>

          <p style={subtitleStyle}>
            Capture guarantor information and verification details.
          </p>
        </div>
      </div>
    </header>
  );
}

/* ===========================================================
END
=========================================================== */
