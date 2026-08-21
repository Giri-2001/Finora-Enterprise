/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER FAMILY & EMERGENCY™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Family member count
   - Emergency contact name
   - Emergency contact mobile

   ARCHITECTURE:

   - Responsive geometry from FINORA Responsive Engine
   - Theme presentation through FINORA theme CSS variables
   - Lucide icons
   - No local breakpoints
   - No viewport detection
   - No hardcoded responsive dimensions
   - No business logic
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  UsersRound,
  UserRound,
  Phone,
} from "lucide-react";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../utils/responsive";


/* ===========================================================
   TYPES
=========================================================== */

export interface FamilyDetailsData {

  numberOfFamilyMembers:
    string;

  emergencyContactName:
    string;

  emergencyContactMobile:
    string;

}


interface FamilyDetailsProps {

  value:
    FamilyDetailsData;

  onChange: (
    field:
      keyof FamilyDetailsData,
    value:
      string,
  ) => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function FamilyDetails({

  value,

  onChange,

}: FamilyDetailsProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     ROOT STYLE
  ========================================================= */

  const rootStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "block",

  };


  /* =========================================================
     FIELD GRID
  ========================================================= */

  const gridStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",

    columnGap:
      `${tokens.form.inputGap}px`,

    rowGap:
      `${tokens.form.rowGap}px`,

    alignItems:
      "end",

    justifyContent:
      "stretch",

    alignSelf:
      "stretch",

  };


  /* =========================================================
     FIELD STYLE
  ========================================================= */

  const fieldStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.form.labelGap}px`,

  };


  /* =========================================================
     LABEL STYLE
  ========================================================= */

  const labelStyle:
    CSSProperties = {

    display:
      "block",

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    color:
      "var(--finora-theme-text-secondary, rgba(255,255,255,.66))",

    fontSize:
      `${tokens.form.labelSize}px`,

    fontWeight:
      600,

    lineHeight:
      tokens.lineHeight.compact,

    letterSpacing:
      ".45px",

    textTransform:
      "uppercase",

  };


  /* =========================================================
     INPUT WRAPPER
  ========================================================= */

  const inputWrapperStyle:
    CSSProperties = {

    position:
      "relative",

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "block",

  };


  /* =========================================================
     INPUT STYLE
  ========================================================= */

  const inputStyle:
    CSSProperties = {

    display:
      "block",

    width:
      "100%",

    minWidth:
      0,

    height:
      `${tokens.input.height}px`,

    padding:
      `
      0
      ${tokens.input.paddingX}px
      0
      ${
        tokens.input.paddingX +
        tokens.input.iconSize +
        tokens.spacing.small
      }px
      `,

    boxSizing:
      "border-box",

    borderRadius:
      `${tokens.input.radius}px`,

    border:
      `${tokens.border.width}px solid var(--finora-theme-border-default, rgba(214,176,106,.28))`,

    outline:
      "none",

    background:
      "var(--finora-theme-surface-muted, rgba(255,255,255,.055))",

    color:
      "var(--finora-theme-text-primary, #F8FAFC)",

    fontSize:
      `${tokens.input.fontSize}px`,

    fontWeight:
      500,

    fontVariantNumeric:
      "tabular-nums",

  };


  /* =========================================================
     ICON STYLE
  ========================================================= */

  const iconStyle:
    CSSProperties = {

    position:
      "absolute",

    left:
      `${tokens.input.paddingX}px`,

    top:
      "50%",

    width:
      `${tokens.input.iconSize}px`,

    height:
      `${tokens.input.iconSize}px`,

    transform:
      "translateY(-50%)",

    color:
      "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

    pointerEvents:
      "none",

  };


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={
        rootStyle
      }
    >

      <div
        style={
          gridStyle
        }
      >

        {/* =================================================
            NUMBER OF FAMILY MEMBERS
        ================================================= */}

        <div
          style={
            fieldStyle
          }
        >

          <label
            style={
              labelStyle
            }
          >
            Number of Family Members
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <UsersRound
              style={
                iconStyle
              }
              aria-hidden="true"
            />


            <input
              type="text"

              style={
                inputStyle
              }

              value={
                value.numberOfFamilyMembers
              }

              placeholder=
                "Enter family members"

              inputMode="numeric"

              onChange={
                (event) =>
                  onChange(
                    "numberOfFamilyMembers",
                    event.target.value,
                  )
              }

              aria-label=
                "Number of Family Members"

            />

          </div>

        </div>


        {/* =================================================
            EMERGENCY CONTACT NAME
        ================================================= */}

        <div
          style={
            fieldStyle
          }
        >

          <label
            style={
              labelStyle
            }
          >
            Emergency Contact Name
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <UserRound
              style={
                iconStyle
              }
              aria-hidden="true"
            />


            <input
              type="text"

              style={
                inputStyle
              }

              value={
                value.emergencyContactName
              }

              placeholder=
                "Enter emergency contact"

              onChange={
                (event) =>
                  onChange(
                    "emergencyContactName",
                    event.target.value,
                  )
              }

              aria-label=
                "Emergency Contact Name"

            />

          </div>

        </div>


        {/* =================================================
            EMERGENCY CONTACT MOBILE
        ================================================= */}

        <div
          style={
            fieldStyle
          }
        >

          <label
            style={
              labelStyle
            }
          >
            Emergency Contact Mobile
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <Phone
              style={
                iconStyle
              }
              aria-hidden="true"
            />


            <input
              type="text"

              style={
                inputStyle
              }

              value={
                value.emergencyContactMobile
              }

              placeholder=
                "Enter mobile number"

              inputMode="tel"

              onChange={
                (event) =>
                  onChange(
                    "emergencyContactMobile",
                    event.target.value,
                  )
              }

              aria-label=
                "Emergency Contact Mobile"

            />

          </div>

        </div>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */