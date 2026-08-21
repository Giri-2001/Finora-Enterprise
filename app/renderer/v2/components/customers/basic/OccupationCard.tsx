/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OCCUPATION PROFILE™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Occupation
   - Workplace / Business
   - Monthly Income
   - Work Experience

   ARCHITECTURE:

   - Responsive geometry comes from FINORA Responsive Engine
   - Theme presentation comes from FINORA Theme Engine
   - Icons come from installed Lucide icon system
   - No emojis
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
  BriefcaseBusiness,
  Building2,
  WalletCards,
  Clock3,
} from "lucide-react";


/* ===========================================================

   RESPONSIVE ENGINE

=========================================================== */

import {
  useResponsive,
} from "../../../utils/responsive";


/* ===========================================================

   THEME ENGINE

=========================================================== */

import {
  useTheme,
} from "../../../themes/provider";


/* ===========================================================

   TYPES

=========================================================== */

export interface OccupationData {

  occupation:
    string;

  workPlace:
    string;

  monthlyIncome:
    string;

  experience:
    string;

}


interface OccupationCardProps {

  value:
    OccupationData;

  onChange: (
    field:
      keyof OccupationData,
    value:
      string,
  ) => void;

}


/* ===========================================================

   THEME STYLE TYPE

=========================================================== */

type ThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================

   COMPONENT

=========================================================== */

export default function OccupationCard({

  value,

  onChange,

}: OccupationCardProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     THEME VARIABLES

     ThemeProvider owns the actual values.

     This component only consumes the public theme
     CSS-variable contract.
  ========================================================= */

  const themeStyle:
    ThemeStyle = {

    color:
      "var(--finora-theme-text-primary, #F8FAFC)",

  };


  /* =========================================================
     ROOT STYLE

     Width / sizing remains responsive-engine driven.
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

     Four columns are the existing occupation form
     presentation contract.

     Geometry values come from Responsive Engine.
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
      "repeat(4, minmax(0, 1fr))",

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

     Positioning only.
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

     Responsive dimensions come exclusively from tokens.
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

     Icon size comes from Responsive Engine.
     Color comes from Theme Engine.
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
     THEME REFERENCE

     Keep the ThemeProvider subscription active even though
     the visual contract is consumed through theme CSS vars.
  ========================================================= */

  void theme;

  void themeStyle;


  /* =========================================================
     UI

     Field values and update behavior remain unchanged.
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
            OCCUPATION
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
            Occupation
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <BriefcaseBusiness
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
                value.occupation
              }

              placeholder=
                "Enter occupation"

              onChange={
                (event) =>
                  onChange(
                    "occupation",
                    event.target.value,
                  )
              }

              aria-label=
                "Occupation"

            />

          </div>

        </div>


        {/* =================================================
            WORKPLACE / BUSINESS
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
            Workplace / Business
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <Building2
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
                value.workPlace
              }

              placeholder=
                "Enter workplace or business"

              onChange={
                (event) =>
                  onChange(
                    "workPlace",
                    event.target.value,
                  )
              }

              aria-label=
                "Workplace or Business"

            />

          </div>

        </div>


        {/* =================================================
            MONTHLY INCOME
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
            Monthly Income
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <WalletCards
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
                value.monthlyIncome
              }

              placeholder=
                "Enter monthly income"

              inputMode="numeric"

              onChange={
                (event) =>
                  onChange(
                    "monthlyIncome",
                    event.target.value,
                  )
              }

              aria-label=
                "Monthly Income"

            />

          </div>

        </div>


        {/* =================================================
            WORK EXPERIENCE
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
            Work Experience
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <Clock3
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
                value.experience
              }

              placeholder=
                "Years of experience"

              inputMode="decimal"

              onChange={
                (event) =>
                  onChange(
                    "experience",
                    event.target.value,
                  )
              }

              aria-label=
                "Work Experience"

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