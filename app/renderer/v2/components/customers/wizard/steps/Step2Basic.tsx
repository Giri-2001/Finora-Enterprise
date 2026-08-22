/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 2 — BASIC DETAILS

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Personal information
   - Occupation profile
   - Family & emergency information
   - Live wizard synchronization
   - FINORA Theme Engine integration
   - Responsive Engine integration
   - Unified Step 2 presentation

   IMPORTANT:

   - Step 1 remains untouched
   - Existing child forms remain untouched
   - Existing business state preserved
   - Existing wizard synchronization preserved
   - Right side is presented as ONE unified form
   - Two-column fields remain controlled by child forms
   - No local responsive logic
   - No viewport detection
   - No local theme definitions
   - Theme colours come only from ThemeProvider
   - Responsive geometry comes only from Responsive Engine
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../../themes/provider";


/* ===========================================================
   BASIC INFORMATION COMPONENTS
=========================================================== */

import BasicForm, {
  type BasicFormData,
} from "../../basic/BasicForm";


import OccupationCard, {
  type OccupationData,
} from "../../basic/OccupationCard";


import FamilyDetails, {
  type FamilyDetailsData,
} from "../../basic/FamilyDetails";


/* ===========================================================
   WIZARD TYPES
=========================================================== */

import type {
  CustomerWizardData,
} from "../CustomerWizard";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../../utils/responsive";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  pageStyle,
  formStyle,
  formHeaderStyle,
  formTitleStyle,
  formSubtitleStyle,
  contentStyle,
  groupStyle,
  groupHeaderStyle,
  groupSubtitleStyle,
  groupContentStyle,
  createStep2BasicHeaderStyles,
} from "./Step2Basic.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface BasicState
  extends BasicFormData,
    OccupationData,
    FamilyDetailsData {}


/* ===========================================================
   THEME STYLE TYPE
=========================================================== */

/*
 * React CSSProperties does not natively know custom
 * FINORA CSS variables.
 *
 * This type keeps the theme contract strongly typed without
 * introducing any local theme palette.
 */

type ThemeStyle =
  React.CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   DEFAULT STATE
=========================================================== */

const DEFAULT_STATE:
  BasicState = {

  fatherOrSpouseName:
    "",

  education:
    "",

  maritalStatus:
    "",

  spouseName:
    "",

  occupation:
    "",

  workPlace:
    "",

  monthlyIncome:
    "",

  experience:
    "",

  numberOfFamilyMembers:
    "",

  emergencyContactName:
    "",

  emergencyContactMobile:
    "",

};


/* ===========================================================
   PROPS
=========================================================== */

interface Step2BasicProps {

  wizardData?:
    CustomerWizardData;

  updateWizardData: (
    data:
      Partial<CustomerWizardData>,
  ) => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

function Step2Basic({

  wizardData,

  updateWizardData,

}: Step2BasicProps) {


  /* =========================================================
     RESPONSIVE ENGINE

     Responsive geometry comes exclusively from the central
     Responsive Engine.

     No breakpoint or viewport logic exists here.
  ========================================================= */

  const {
  tokens,
} = useResponsive();


  /* =========================================================
     THEME ENGINE

     The active theme comes directly from ThemeProvider.

     No theme id mapping.
     No local colour palette.
     No hard-coded theme selection.
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     HEADER PRESENTATION

     Step 2 header uses the same ResponsiveTokens contract
     as Step 1.

     Geometry:
       Responsive Engine

     Colours:
       FINORA Theme CSS variables
  ========================================================= */

  const {

    formHeaderStyle:
      resolvedFormHeaderStyle,

    formTitleStyle:
      resolvedFormTitleStyle,

    formSubtitleStyle:
      resolvedFormSubtitleStyle,

  } =
    createStep2BasicHeaderStyles(
      tokens,
    );


  /* =========================================================
     THEME CSS VARIABLES

     ThemeProvider
          ↓
     active FinoraTheme
          ↓
     theme.colors
          ↓
     FINORA CSS variables
          ↓
     Step2Basic.styles.ts
          ↓
     BasicForm / OccupationCard / FamilyDetails

     This guarantees that all five application themes
     propagate through the complete Step 2 presentation.

     IMPORTANT:

     These are NOT theme definitions.

     They are only the bridge between the central Theme Engine
     and presentation styles that consume semantic CSS variables.
  ========================================================= */

  const themeStyle:
    ThemeStyle = {

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,


    /* -------------------------------------------------------
       SURFACES
    ------------------------------------------------------- */

    "--finora-theme-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-card":
  theme.colors.background.surface,

    "--finora-theme-background-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,


    /* -------------------------------------------------------
       TEXT
    ------------------------------------------------------- */

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-body":
      theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,


    /* -------------------------------------------------------
       BORDERS
    ------------------------------------------------------- */

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,


    /* -------------------------------------------------------
       EFFECTS
    ------------------------------------------------------- */

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

  };


  /* =========================================================
     LOCAL STATE
  ========================================================= */

  const [
    state,
    setState,
  ] =
    useState<BasicState>(
      DEFAULT_STATE,
    );


  /* =========================================================
     RESTORE WIZARD DATA

     Existing wizard synchronization is preserved exactly.
  ========================================================= */

  useEffect(() => {

    if (!wizardData) {

      return;

    }


    setState(
      (previous) => ({

        ...previous,

        fatherOrSpouseName:
          wizardData.fatherOrSpouseName ??
          previous.fatherOrSpouseName,

        education:
          wizardData.education ??
          previous.education,

        maritalStatus:
          wizardData.maritalStatus ??
          previous.maritalStatus,

        spouseName:
          wizardData.spouseName ??
          previous.spouseName,

        occupation:
          wizardData.occupation ??
          previous.occupation,

        workPlace:
          wizardData.workPlace ??
          previous.workPlace,

        monthlyIncome:
          wizardData.monthlyIncome ??
          previous.monthlyIncome,

        experience:
          wizardData.experience ??
          previous.experience,

        numberOfFamilyMembers:
          wizardData.numberOfFamilyMembers ??
          previous.numberOfFamilyMembers,

        emergencyContactName:
          wizardData.emergencyContactName ??
          previous.emergencyContactName,

        emergencyContactMobile:
          wizardData.emergencyContactMobile ??
          previous.emergencyContactMobile,

      }),
    );

  }, [
    wizardData,
  ]);


  /* =========================================================
     UPDATE FIELD

     Local state and wizard state remain synchronized
     immediately after every field change.
  ========================================================= */

  function updateField(

    field:
      keyof BasicState,

    value:
      string,

  ): void {

    setState(
      (previous) => ({

        ...previous,

        [field]:
          value,

      }),
    );


    /* =======================================================
       LIVE WIZARD SYNC
    ======================================================= */

    updateWizardData({

      [field]:
        value,

    } as Partial<CustomerWizardData>);

  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={{
        ...pageStyle,

        ...themeStyle,
      }}
    >

      {/* =================================================
          ONE UNIFIED BASIC INFORMATION FORM
      ================================================= */}

      <div
  style={{
    ...formStyle,

    ...(theme.id === "imperial-gold"
      ? {
          background:
            "#FFFFFF",

          boxShadow:
            "none",
        }
      : {}),
  }}
>

        {/* ===============================================
            FORM HEADER

            Same Step 1 typography / spacing contract.

            Typography:
              Responsive Engine

            Colour:
              FINORA Theme Engine
        =============================================== */}

        <header
          style={{
            ...formHeaderStyle,

            ...resolvedFormHeaderStyle,

          }}
        >

          <h1
            style={{
              ...formTitleStyle,

              ...resolvedFormTitleStyle,

            }}
          >
            Basic Information
          </h1>


          <p
            style={{
              ...formSubtitleStyle,

              ...resolvedFormSubtitleStyle,

            }}
          >
            Personal, occupation and family information.
          </p>

        </header>


        {/* ===============================================
            FORM CONTENT
        =============================================== */}

        <div
          style={{
            ...contentStyle,

            ...themeStyle,
          }}
        >

          {/* =============================================
              PERSONAL INFORMATION
          ============================================= */}

          <section
            style={
              groupStyle
            }
          >

            <header
              style={
                groupHeaderStyle
              }
            >

              <div>

                <p
                  style={
                    groupSubtitleStyle
                  }
                >
                  Basic personal and marital information.
                </p>

              </div>

            </header>


            <div
              style={
                groupContentStyle
              }
            >

              <BasicForm

                value={
                  state
                }

                onChange={
                  updateField
                }

              />

            </div>

          </section>


          {/* =============================================
              OCCUPATION PROFILE
          ============================================= */}

          <section
            style={
              groupStyle
            }
          >

            <header
              style={
                groupHeaderStyle
              }
            >

              <div>

                <p
                  style={
                    groupSubtitleStyle
                  }
                >
                  Professional and income information.
                </p>

              </div>

            </header>


            <div
              style={
                groupContentStyle
              }
            >

              <OccupationCard

                value={
                  state
                }

                onChange={
                  updateField
                }

              />

            </div>

          </section>


          {/* =============================================
              FAMILY & EMERGENCY
          ============================================= */}

          <section
            style={
              groupStyle
            }
          >

            <header
              style={
                groupHeaderStyle
              }
            >

              <div>

                <p
                  style={
                    groupSubtitleStyle
                  }
                >
                  Family size and emergency contact information.
                </p>

              </div>

            </header>


            <div
              style={
                groupContentStyle
              }
            >

              <FamilyDetails

                value={
                  state
                }

                onChange={
                  updateField
                }

              />

            </div>

          </section>

        </div>

      </div>

    </section>

  );

}


/* ===========================================================
   DEFAULT EXPORT

   Required by:

   Step1IdentityAndBasic.tsx

   import Step2Basic from "./Step2Basic";
=========================================================== */

export default Step2Basic;


/* ===========================================================
   END
=========================================================== */