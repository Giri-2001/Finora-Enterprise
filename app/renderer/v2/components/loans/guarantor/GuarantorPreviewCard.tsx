/* ===========================================================
FINORA ENTERPRISE V2
GUARANTOR STUDIO
GUARANTOR PREVIEW CARD
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  cardStyle,
  fullWidthRowStyle,
  highlightRowStyle,
  labelStyle,
  previewGridStyle,
  primaryValueStyle,
  rowStyle,
  mobileGuarantorPreviewCss,
  valueStyle,
} from "./GuarantorPreviewCard.styles";

/* ===========================================================
TYPES
=========================================================== */

interface GuarantorPreviewCardProps {
  guarantorName?: string;
  mobileNumber?: string;
  occupation?: string;
  address?: string;
}

/* ===========================================================
DISPLAY HELPERS
=========================================================== */

function capitalizeFirstLetter(
  value: string,
): string {
  if (!value || value === "--") {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function GuarantorPreviewCard({
  guarantorName = "--",
  mobileNumber = "--",
  occupation = "--",
  address = "--",
}: GuarantorPreviewCardProps) {
  return (
    <div className="paisarule-guarantor-preview" style={cardStyle}>
        <style>{mobileGuarantorPreviewCss}</style>
      <SummaryCard title="Guarantor Preview">
        <div style={previewGridStyle}>

          {/* GUARANTOR */}
          <div style={highlightRowStyle}>
            <span className="paisarule-guarantor-preview-label" style={labelStyle}>
              Guarantor
            </span>

            <strong className="paisarule-guarantor-preview-primary-value" style={primaryValueStyle}>
              {capitalizeFirstLetter(guarantorName)}
            </strong>
          </div>

          {/* MOBILE */}
          <div style={rowStyle}>
            <span className="paisarule-guarantor-preview-label" style={labelStyle}>
              Mobile
            </span>

            <strong className="paisarule-guarantor-preview-value" style={valueStyle}>
              {mobileNumber}
            </strong>
          </div>

          {/* OCCUPATION */}
          <div style={rowStyle}>
            <span className="paisarule-guarantor-preview-label" style={labelStyle}>
              Occupation
            </span>

            <strong className="paisarule-guarantor-preview-value" style={valueStyle}>
              {capitalizeFirstLetter(occupation)}
            </strong>
          </div>

          {/* ADDRESS */}
          <div style={fullWidthRowStyle}>
            <span className="paisarule-guarantor-preview-label" style={labelStyle}>
              Address
            </span>

            <strong className="paisarule-guarantor-preview-value" style={valueStyle}>
              {capitalizeFirstLetter(address)}
            </strong>
          </div>

        </div>
      </SummaryCard>
    </div>
  );
}

/* ===========================================================
END
=========================================================== */
