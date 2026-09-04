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
    <div style={cardStyle}>
      <SummaryCard title="Guarantor Preview">
        <div style={previewGridStyle}>

          {/* GUARANTOR */}
          <div style={highlightRowStyle}>
            <span style={labelStyle}>
              Guarantor
            </span>

            <strong style={primaryValueStyle}>
              {capitalizeFirstLetter(guarantorName)}
            </strong>
          </div>

          {/* MOBILE */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Mobile
            </span>

            <strong style={valueStyle}>
              {mobileNumber}
            </strong>
          </div>

          {/* OCCUPATION */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Occupation
            </span>

            <strong style={valueStyle}>
              {capitalizeFirstLetter(occupation)}
            </strong>
          </div>

          {/* ADDRESS */}
          <div style={fullWidthRowStyle}>
            <span style={labelStyle}>
              Address
            </span>

            <strong style={valueStyle}>
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
