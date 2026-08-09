/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER NOMINEE PREVIEW

   RESPONSIBILITY:
   - Live nominee information preview
   - Existing FINORA customer link presentation
   - Read-only customer relationship summary

   BUSINESS LOGIC:
   - NONE

   STYLES:
   NomineePreviewCard.styles.ts

   IMPORTANT:
   Customer-link status is supplied explicitly by the
   Customer Wizard. This component does not decide whether
   a FINORA Customer ID is valid.
=========================================================== */

import {
  cardStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  dividerStyle,
  rowStyle,
  labelStyle,
  valueStyle,
  emptyValueStyle,
  linkedBadgeStyle,
  footerStyle,
} from "./NomineePreviewCard.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface NomineePreviewData {

  customerName?: string;

  nomineeCustomerId?: string;

  nomineeName?: string;

  relationship?: string;

  phoneNumber?: string;
}

interface NomineePreviewCardProps {

  value: NomineePreviewData;

  /**
   * True only when the entered FINORA Customer ID
   * resolves to an existing registered customer.
   */
  isCustomerLinked?: boolean;
}

/* ===========================================================
   ROW
=========================================================== */

function PreviewRow({
  label,
  value,
}: {
  label: string;

  value?: string;
}) {

  const hasValue =
    Boolean(value?.trim());

  return (

    <div style={rowStyle}>

      <span style={labelStyle}>
        {label}
      </span>

      <span
        style={
          hasValue
            ? valueStyle
            : emptyValueStyle
        }
      >
        {hasValue
          ? value
          : "--"}
      </span>

    </div>

  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NomineePreviewCard({

  value,

  isCustomerLinked = false,

}: NomineePreviewCardProps) {

  return (

    <section style={cardStyle}>

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div style={headerStyle}>

        <div>

          <h3 style={titleStyle}>
            Nominee Preview
          </h3>

          <p style={subtitleStyle}>
            Live relationship and nominee information.
          </p>

        </div>

        {isCustomerLinked && (

          <div style={linkedBadgeStyle}>
            ✓ Linked
          </div>

        )}

      </div>

      {/* =====================================================
         DIVIDER
      ===================================================== */}

      <div style={dividerStyle} />

      {/* =====================================================
         PREVIEW DATA
      ===================================================== */}

      <div>

        <PreviewRow
          label="Customer"
          value={
            value.customerName
          }
        />

        <PreviewRow
          label="FINORA ID"
          value={
            value.nomineeCustomerId
          }
        />

        <PreviewRow
          label="Nominee"
          value={
            value.nomineeName
          }
        />

        <PreviewRow
          label="Relationship"
          value={
            value.relationship
          }
        />

        <PreviewRow
          label="Phone"
          value={
            value.phoneNumber
          }
        />

      </div>

      {/* =====================================================
         FOOTER
      ===================================================== */}

      <div style={footerStyle}>

        {isCustomerLinked
          ? "Existing FINORA customer linked successfully."
          : "Enter a FINORA Customer ID to link an existing customer."}

      </div>

    </section>

  );
}
