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
              {guarantorName}
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
              {occupation}
            </strong>
          </div>

          {/* ADDRESS */}
          <div style={fullWidthRowStyle}>
            <span style={labelStyle}>
              Address
            </span>

            <strong style={valueStyle}>
              {address}
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
