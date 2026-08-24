/* ===========================================================
   FINORA ENTERPRISE V2

   CUSTOMER NOMINEE PREVIEW

   RESPONSIBILITY:
   - Live nominee information preview
   - Existing FINORA customer link presentation
   - Read-only customer relationship summary
   - Semantic Lucide icons for preview rows

   BUSINESS LOGIC:
   - NONE

   THEME:
   - Consumes the central FINORA Theme Engine
   - No local colour palette
   - No hard-coded theme colours

   STYLES:
   NomineePreviewCard.styles.ts

   IMPORTANT:
   Customer-link status is supplied explicitly by the
   Customer Wizard. This component does not decide whether
   a FINORA Customer ID is valid.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  UserRound,
  IdCard,
  UsersRound,
  Phone,
} from "lucide-react";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../themes/provider/ThemeProvider";


/* ===========================================================
   STYLES
=========================================================== */

import {
  createNomineePreviewCardStyles,
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
  icon: Icon,
  label,
  value,
  styles,
}: {
  icon: typeof UserRound;
  label: string;
  value?: string;
  styles: ReturnType<
    typeof createNomineePreviewCardStyles
  >;
}) {

  const hasValue =
    Boolean(
      value?.trim(),
    );


  return (

    <div
      style={
        styles.rowStyle
      }
    >

      <div
        style={
          styles.rowIconWrapperStyle
        }
        aria-hidden="true"
      >

        <Icon
          style={
            styles.rowIconStyle
          }
        />

      </div>


      <span
        style={
          styles.labelStyle
        }
      >
        {label}
      </span>


      <span
        style={
          hasValue
            ? styles.valueStyle
            : styles.emptyValueStyle
        }
      >

        {
          hasValue
            ? value
            : "--"
        }

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


  /* =========================================================
     THEME ENGINE

     The active FINORA theme is resolved centrally through
     ThemeProvider.

     This component does not own a theme palette.
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     STYLES

     All visual colours are resolved from the active theme.
     Layout values remain presentation styles and are not
     part of the theme system.
  ========================================================= */

  const styles =
    createNomineePreviewCardStyles(
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section
      style={
        styles.cardStyle
      }
    >

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div
        style={
          styles.headerStyle
        }
      >

        <div
          style={
            styles.headerContentStyle
          }
        >

          <div
            style={
              styles.headerIconWrapperStyle
            }
            aria-hidden="true"
          >

            <UserRound
              style={
                styles.headerIconStyle
              }
            />

          </div>


          <div>

            <h3
              style={
                styles.titleStyle
              }
            >
              Nominee Preview
            </h3>


            <p
              style={
                styles.subtitleStyle
              }
            >
              Live relationship and nominee information.
            </p>

          </div>

        </div>


        {
          isCustomerLinked && (

            <div
              style={
                styles.linkedBadgeStyle
              }
            >

              ✓ Linked

            </div>

          )
        }

      </div>


      {/* =====================================================
         DIVIDER
      ===================================================== */}

      <div
        style={
          styles.dividerStyle
        }
      />


      {/* =====================================================
         PREVIEW DATA
      ===================================================== */}

      <div>

        <PreviewRow
          icon={
            UserRound
          }
          label="Customer"
          value={
            value.customerName
          }
          styles={
            styles
          }
        />


        <PreviewRow
          icon={
            IdCard
          }
          label="FINORA ID"
          value={
            value.nomineeCustomerId
          }
          styles={
            styles
          }
        />


        <PreviewRow
          icon={
            UserRound
          }
          label="Nominee"
          value={
            value.nomineeName
          }
          styles={
            styles
          }
        />


        <PreviewRow
          icon={
            UsersRound
          }
          label="Relationship"
          value={
            value.relationship
          }
          styles={
            styles
          }
        />


        <PreviewRow
          icon={
            Phone
          }
          label="Phone"
          value={
            value.phoneNumber
          }
          styles={
            styles
          }
        />

      </div>


      {/* =====================================================
         FOOTER
      ===================================================== */}

      <div
        style={
          styles.footerStyle
        }
      >

        {
          isCustomerLinked
            ? "Existing FINORA customer linked successfully."
            : "Enter a FINORA Customer ID to link an existing customer."
        }

      </div>

    </section>

  );

}


/* ===========================================================
   END OF FILE
=========================================================== */