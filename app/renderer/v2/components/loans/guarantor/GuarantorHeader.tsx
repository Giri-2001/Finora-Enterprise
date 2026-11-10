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
  mobileGuarantorHeaderCss,
  subtitleStyle,
  textWrapperStyle,
  titleStyle,
} from "./GuarantorHeader.styles";

/* ===========================================================
COMPONENT
=========================================================== */

export default function GuarantorHeader() {
  return (
    <header className="paisarule-guarantor-header" style={headerStyle}>
      <style>{mobileGuarantorHeaderCss}</style>
      <div style={contentStyle}>
        <div style={accentStyle} />

        <div style={textWrapperStyle}>
          <h1 className="paisarule-guarantor-header-title" style={titleStyle}>
            Guarantor Studio
          </h1>

          <p className="paisarule-guarantor-header-subtitle" style={subtitleStyle}>
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
