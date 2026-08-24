/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER VALIDATION STATUS

   RESPONSIBILITY:
   - Customer validation status presentation
   - Identity status
   - Address status
   - KYC status
   - Nominee status
   - Theme-aware visual presentation

   BUSINESS LOGIC:
   - NONE

   IMPORTANT:
   - Validation values are supplied by Step6Review.
   - Existing validation flow is preserved.
   - No inline theme colours are used.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  ShieldCheck,
  UserRound,
  MapPin,
  FileCheck2,
  UserPlus,
  CheckCircle2,
  Circle,
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
  createValidationStatusStyles,
} from "./ValidationStatus.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface ValidationStatusProps {

  identityComplete?:
    boolean;

  addressComplete?:
    boolean;

  kycVerified?:
    boolean;

  nomineeAdded?:
    boolean;

}


/* ===========================================================
   STATUS ROW
=========================================================== */

function StatusRow({

  icon: Icon,

  label,

  ok,

  styles,

}: {

  icon:
    typeof UserRound;

  label:
    string;

  ok?:
    boolean;

  styles:
    ReturnType<
      typeof createValidationStatusStyles
    >;

}) {

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
          size={13}
          strokeWidth={1.9}
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
         STATUS ICON
      ===================================================== */}

      <span
        style={
          ok
            ? styles.statusIconCompleteStyle
            : styles.statusIconPendingStyle
        }
        aria-hidden="true"
      >

        {
          ok
            ? (
                <CheckCircle2
                  size={13}
                  strokeWidth={1.9}
                />
              )
            : (
                <Circle
                  size={13}
                  strokeWidth={1.9}
                />
              )
        }

      </span>


      {/* =====================================================
         STATUS TEXT
      ===================================================== */}

      <strong
        style={
          ok
            ? styles.statusCompleteStyle
            : styles.statusPendingStyle
        }
      >

        {
          ok
            ? "Complete"
            : "Pending"
        }

      </strong>

    </div>

  );

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function ValidationStatus({

  identityComplete,

  addressComplete,

  kycVerified,

  nomineeAdded,

}: ValidationStatusProps) {


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
    createValidationStatusStyles(
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

        {/* ===================================================
           HEADER ICON
        =================================================== */}

        <span
          style={
            styles.headerIconStyle
          }
          aria-hidden="true"
        >

          <ShieldCheck
            size={15}
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

            Validation Status

          </h3>


          <p
            style={
              styles.subtitleStyle
            }
          >

            Customer profile readiness before final confirmation.

          </p>

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
         VALIDATION ROWS
      ===================================================== */}

      <StatusRow
        icon={
          UserRound
        }
        label="Identity"
        ok={
          identityComplete
        }
        styles={
          styles
        }
      />


      <StatusRow
        icon={
          MapPin
        }
        label="Address"
        ok={
          addressComplete
        }
        styles={
          styles
        }
      />


      <StatusRow
        icon={
          FileCheck2
        }
        label="KYC"
        ok={
          kycVerified
        }
        styles={
          styles
        }
      />


      <StatusRow
        icon={
          UserPlus
        }
        label="Nominee"
        ok={
          nomineeAdded
        }
        styles={
          styles
        }
      />

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */