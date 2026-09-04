/* ===========================================================
FINORA ENTERPRISE V2
REVIEW STUDIO
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
} from "./ReviewHeader.styles";

/* ===========================================================
COMPONENT
=========================================================== */

export default function ReviewHeader() {
  return (
    <header style={headerStyle}>
      <div style={contentStyle}>
        <div style={accentStyle} />

        <div style={textWrapperStyle}>
          <h1 style={titleStyle}>
            Review Studio
          </h1>

          <p style={subtitleStyle}>
            Review all loan information before approval and disbursement.
          </p>
        </div>
      </div>
    </header>
  );
}

/* ===========================================================
END
=========================================================== */
