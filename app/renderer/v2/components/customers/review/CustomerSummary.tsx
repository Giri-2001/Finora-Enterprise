/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW SUMMARY

   RESPONSIBILITY:
   - Customer summary presentation
   - Customer identity preview
   - Customer contact preview
   - KYC status presentation
   - Theme-aware visual presentation

   BUSINESS LOGIC:
   - NONE

   IMPORTANT:
   - Existing customer/KYC data flow is preserved.
   - No business logic is changed.
   - No inline CSS is used.
   - Visual colours come from the central FINORA Theme Engine.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  ClipboardList,
  Hash,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../themes/provider";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  createCustomerSummaryStyles,
} from "./CustomerSummary.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface CustomerSummaryProps {

  customerId?:
    string;

  customerName?:
    string;

  phoneNumber?:
    string;

  kycVerified?:
    boolean;

}


/* ===========================================================
   SUMMARY ROW
=========================================================== */

function SummaryRow({

  icon: Icon,

  label,

  value,

  styles,

}: {

  icon:
    typeof Hash;

  label:
    string;

  value?:
    string;

  styles:
    ReturnType<
      typeof createCustomerSummaryStyles
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

      {/* =====================================================
         ROW ICON
      ===================================================== */}

      <span
        style={
          styles.rowIconStyle
        }
        aria-hidden="true"
      >

        <Icon
          size={18}
          strokeWidth={1.8}
        />

      </span>


      {/* =====================================================
         ROW LABEL
      ===================================================== */}

      <span
        style={
          styles.labelStyle
        }
      >

        {label}

      </span>


      {/* =====================================================
         ROW VALUE
      ===================================================== */}

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

export default function CustomerSummary({

  customerId,

  customerName,

  phoneNumber,

  kycVerified,

}: CustomerSummaryProps) {


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     THEME-AWARE STYLES
  ========================================================= */

  const styles =
    createCustomerSummaryStyles(
      theme,
      Boolean(
        kycVerified,
      ),
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

        {/* ===================================================
           HEADER ICON
        =================================================== */}

        <span
          style={
            styles.headerIconStyle
          }
          aria-hidden="true"
        >

          <ClipboardList
            size={25}
            strokeWidth={1.8}
          />

        </span>


        {/* ===================================================
           HEADER TEXT
        =================================================== */}

        <div
          style={
            styles.headerTextStyle
          }
        >

          <h3
            style={
              styles.titleStyle
            }
          >

            Customer Summary

          </h3>


          <p
            style={
              styles.subtitleStyle
            }
          >

            Review the primary customer information before confirmation.

          </p>

        </div>


        {/* ===================================================
           KYC STATUS
        =================================================== */}

        <div
          style={
            styles.statusStyle
          }
        >

          <ShieldCheck
            size={15}
            strokeWidth={1.9}
          />

          <span>

            {
              kycVerified
                ? "KYC Verified"
                : "KYC Pending"
            }

          </span>

        </div>

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
         CUSTOMER DATA
      ===================================================== */}

      <div>

        <SummaryRow
          icon={
            Hash
          }
          label="Customer ID"
          value={
            customerId
          }
          styles={
            styles
          }
        />


        <SummaryRow
          icon={
            UserRound
          }
          label="Customer Name"
          value={
            customerName
          }
          styles={
            styles
          }
        />


        <SummaryRow
          icon={
            Phone
          }
          label="Phone Number"
          value={
            phoneNumber
          }
          styles={
            styles
          }
        />


        <SummaryRow
          icon={
            ShieldCheck
          }
          label="KYC Status"
          value={
            kycVerified
              ? "Verified"
              : "Pending Verification"
          }
          styles={
            styles
          }
        />

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */