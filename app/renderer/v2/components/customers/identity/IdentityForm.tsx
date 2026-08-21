/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY FORM™

   RESPONSIBILITY:
   - Identity Step 1 field composition
   - Form state remains controlled by parent
   - Customer identity fields
   - Customer contact fields
   - Customer personal identity fields
   - WhatsApp same-number preference
   - Live age calculation from Date of Birth
   - FINORA presentation comes from IdentityForm.styles.ts
   - Responsive geometry comes from Basic Form Responsive Engine
   - Lucide icons are theme-aware
   - Reusable by Add Customer and Edit Customer

   DATE PICKER CONTRACT:
   - Native browser date picker remains the date engine
   - Native small calendar indicator is hidden
   - FINORA CalendarDays icon is the ONLY visible calendar icon
   - Clicking the FINORA icon opens the native picker
   - Calendar icon size comes from Responsive Engine
   - Calendar icon colour comes from FINORA Theme Engine

   Version : 3.2
   Status  : Production
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";


/* ===========================================================
   ICON SYSTEM
=========================================================== */

import {
  LockKeyhole,
  UserRound,
  Smartphone,
  MessageCircle,
  CalendarDays,
} from "lucide-react";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../utils/responsive";


import {
  getBasicFormTokens,
} from "../../../utils/responsive/customers/basicform/basicform.tokens";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  wrapperStyle,
  fieldGridStyle,
  fieldStyle,
  labelStyle,
  requiredStyle,
  inputStyle,
  dateInputStyle,
  inputWrapperStyle,
  iconInputStyle,
  iconReadOnlyInputStyle,
  lockIconStyle,
  fieldIconStyle,
} from "./IdentityForm.styles";

import FinoraDatePicker from "./FinoraDatePicker";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../themes/provider";


/* ===========================================================
   TYPES
=========================================================== */

export type PreferredLanguage =
  | "Telugu"
  | "English"
  | "Hindi"
  | "Tamil"
  | "Kannada"
  | "Marathi"
  | "Other";


export interface IdentityFormData {

  customerName:
    string;

  mobileNumber:
    string;

  whatsappSame:
    boolean;

  whatsappNumber:
    string;

  email:
    string;

  dateOfBirth:
    string;

  preferredLanguage:
    PreferredLanguage;

  businessName:
    string;

  branchName:
    string;

  customerId:
    string;

}


interface IdentityFormProps {

  value:
    IdentityFormData;

  onChange: (
    field:
      keyof IdentityFormData,
    value:
      string | boolean,
  ) => void;

}


/* ===========================================================
   HELPER — CALCULATE AGE
=========================================================== */

function calculateAge(
  dateOfBirth:
    string,
):
  number | null {

  if (
    !dateOfBirth
  ) {

    return null;

  }


  const birthDate =
    new Date(
      `${dateOfBirth}T00:00:00`,
    );


  if (
    Number.isNaN(
      birthDate.getTime(),
    )
  ) {

    return null;

  }


  const today =
    new Date();


  let age =
    today.getFullYear()
    -
    birthDate.getFullYear();


  const monthDifference =
    today.getMonth()
    -
    birthDate.getMonth();


  const dayDifference =
    today.getDate()
    -
    birthDate.getDate();


  if (
    monthDifference < 0
    ||
    (
      monthDifference === 0
      &&
      dayDifference < 0
    )
  ) {

    age -= 1;

  }


  if (
    age < 0
    ||
    age > 150
  ) {

    return null;

  }


  return age;

}


/* ===========================================================
   LABEL COMPONENT
=========================================================== */

interface FieldLabelProps {

  children:
    string;

  required?:
    boolean;

  labelStyleOverride?:
    CSSProperties;

  requiredStyleOverride?:
    CSSProperties;

}


function FieldLabel({

  children,

  required = false,

  labelStyleOverride,

  requiredStyleOverride,

}: FieldLabelProps) {

  return (

    <span
      style={
        labelStyleOverride
          ??
        labelStyle
      }
    >

      {children}


      {required && (

        <span
          style={
            requiredStyleOverride
              ??
            requiredStyle
          }
        >

          *

        </span>

      )}

    </span>

  );

}


/* ===========================================================
   FIELD COMPONENT
=========================================================== */

interface FieldProps {

  label:
    string;

  required?:
    boolean;

  children:
    ReactNode;

  fieldStyleOverride?:
    CSSProperties;

  labelStyleOverride?:
    CSSProperties;

  requiredStyleOverride?:
    CSSProperties;

}


function Field({

  label,

  required = false,

  children,

  fieldStyleOverride,

  labelStyleOverride,

  requiredStyleOverride,

}: FieldProps) {

  return (

    <div
      style={
        fieldStyleOverride
          ??
        fieldStyle
      }
    >

      <FieldLabel

        required={
          required
        }

        labelStyleOverride={
          labelStyleOverride
        }

        requiredStyleOverride={
          requiredStyleOverride
        }

      >

        {label}

      </FieldLabel>


      {children}

    </div>

  );

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function IdentityForm({

  value,

  onChange,

}: IdentityFormProps) {


  /* =========================================================
     CENTRAL RESPONSIVE ENGINE

     No breakpoint logic exists in this component.

     Responsive geometry is resolved centrally.
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     FINORA THEME ENGINE

     Theme colours come only from the central ThemeProvider.
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     BASIC FORM RESPONSIVE TOKENS
  ========================================================= */

  const basicFormTokens =
    getBasicFormTokens(
      tokens.meta.viewport,
    );


  /* =========================================================
     DATE INPUT REF

     The ref is used by the FINORA calendar button.

     Modern Chromium/Electron exposes showPicker().
     The fallback focuses the date input if showPicker()
     is unavailable.
  ========================================================= */

  const dateInputRef =
    useRef<HTMLInputElement>(
      null,
    );


  /* =========================================================
     OPEN DATE PICKER
  ========================================================= */

  function openDatePicker(): void {

    const input =
      dateInputRef.current;


    if (!input) {

      return;

    }


    const pickerInput =
      input as
        HTMLInputElement
        & {
          showPicker?:
            () => void;
        };


    if (
      typeof pickerInput.showPicker ===
      "function"
    ) {

      try {

        pickerInput.showPicker();

        return;

      } catch {

        /*
         * Browser may reject showPicker() when the
         * environment does not expose the picker.
         *
         * Focus remains the safe fallback.
         */

      }

    }


    input.focus();

  }


  /* =========================================================
     AGE

     IMPORTANT:
     This is intentionally calculated BEFORE any resolved
     date-input style that depends on the age state.
  ========================================================= */

  const calculatedAge =
    calculateAge(
      value.dateOfBirth,
    );


  /* =========================================================
     RESOLVED FIELD STYLE
  ========================================================= */

  const resolvedFieldStyle:
    CSSProperties = {

    ...fieldStyle,

    gap:
      `${basicFormTokens.fieldGap}px`,

  };


  /* =========================================================
     RESOLVED FIELD GRID
  ========================================================= */

  const resolvedFieldGridStyle:
    CSSProperties = {

    ...fieldGridStyle,

    gridTemplateColumns:
      basicFormTokens.fieldColumns === 1
        ? "minmax(0, 1fr)"
        : "minmax(0, 1fr) minmax(0, 1fr)",

    columnGap:
      `${basicFormTokens.columnGap}px`,

    rowGap:
      `${basicFormTokens.fieldGap
      +
      basicFormTokens.labelGap
      +
      3}px`,

  };


  /* =========================================================
     RESOLVED LABEL STYLE
  ========================================================= */

  const resolvedLabelStyle:
    CSSProperties = {

    ...labelStyle,

    minHeight:
      `${basicFormTokens.labelMinHeight}px`,

    fontSize:
      `${basicFormTokens.labelFontSize}px`,

    fontWeight:
      basicFormTokens.labelFontWeight,

    letterSpacing:
      `${basicFormTokens.labelLetterSpacing}px`,

    lineHeight:
      1.25,

  };


  /* =========================================================
     RESOLVED REQUIRED STYLE
  ========================================================= */

  const resolvedRequiredStyle:
    CSSProperties = {

    ...requiredStyle,

    fontSize:
      `${basicFormTokens.labelFontSize}px`,

  };


  /* =========================================================
     RESOLVED INPUT STYLE
  ========================================================= */

  const resolvedInputStyle:
    CSSProperties = {

    ...inputStyle,

    height:
      `${basicFormTokens.inputHeight}px`,

    padding:
      `0 ${basicFormTokens.inputPaddingX}px`,

    borderRadius:
      `${basicFormTokens.inputRadius}px`,

    fontSize:
      `${basicFormTokens.inputFontSize}px`,

    fontWeight:
      basicFormTokens.inputFontWeight,

  };


  /* =========================================================
     RESOLVED ICON INPUT
  ========================================================= */

  const resolvedIconInputStyle:
    CSSProperties = {

    ...iconInputStyle,

    ...resolvedInputStyle,

    paddingLeft:
      `${basicFormTokens.inputPaddingX
      +
      basicFormTokens.iconOffset
      +
      basicFormTokens.iconSize}px`,

  };


  /* =========================================================
     RESOLVED READONLY ICON INPUT
  ========================================================= */

  const resolvedIconReadOnlyInputStyle:
    CSSProperties = {

    ...iconReadOnlyInputStyle,

    ...resolvedInputStyle,

    paddingLeft:
      `${basicFormTokens.inputPaddingX
      +
      basicFormTokens.iconOffset
      +
      basicFormTokens.iconSize}px`,

  };


  /* =========================================================
     RESOLVED INPUT WRAPPER
  ========================================================= */

  const resolvedInputWrapperStyle:
    CSSProperties = {

    ...inputWrapperStyle,

  };


  /* =========================================================
     RESOLVED ICON POSITION
  ========================================================= */

  const resolvedLockIconStyle:
    CSSProperties = {

    ...lockIconStyle,

    left:
      `${basicFormTokens.iconOffset}px`,

    width:
      `${basicFormTokens.iconSize}px`,

    height:
      `${basicFormTokens.iconSize}px`,

    fontSize:
      `${basicFormTokens.iconSize}px`,

  };


  /* =========================================================
     RESOLVED FIELD ICON
  ========================================================= */

  const resolvedFieldIconStyle:
    CSSProperties = {

    ...fieldIconStyle,

    width:
      `${basicFormTokens.iconSize}px`,

    height:
      `${basicFormTokens.iconSize}px`,

  };


  /* =========================================================
     RESOLVED DATE CALENDAR ICON

     Responsive size comes ONLY from Basic Form tokens.

     Colour comes ONLY from the FINORA Theme Engine.
  ========================================================= */

  const resolvedCalendarIconStyle:
    CSSProperties = {

    width:
      `${basicFormTokens.calendarIconSize}px`,

    height:
      `${basicFormTokens.calendarIconSize}px`,

    color:
      "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

    strokeWidth:
      2.2,

    flexShrink:
      0,

    display:
      "block",

  };


  /* =========================================================
     RESOLVED CALENDAR BUTTON

     This is the ONLY visible FINORA calendar control.
  ========================================================= */

  const resolvedCalendarButtonStyle:
    CSSProperties = {

    position:
      "absolute",

    right:
      `${basicFormTokens.calendarIconOffset}px`,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    width:
      `${basicFormTokens.calendarIconSize + 8}px`,

    height:
      `${basicFormTokens.calendarIconSize + 8}px`,

    minWidth:
      `${basicFormTokens.calendarIconSize + 8}px`,

    minHeight:
      `${basicFormTokens.calendarIconSize + 8}px`,

    padding:
      0,

    margin:
      0,

    border:
      "none",

    borderRadius:
      `${Math.max(
        5,
        basicFormTokens.inputRadius - 2,
      )}px`,

    background:
      "transparent",

    color:
      "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor:
      "pointer",

    zIndex:
      5,

    flexShrink:
      0,

    boxSizing:
      "border-box",

    outline:
      "none",

    appearance:
      "none",

    WebkitAppearance:
      "none",

  };


  /* =========================================================
     DATE INPUT GEOMETRY

     IMPORTANT:
     - Explicit CSSProperties typing fixes TS2322.
     - Native icon is hidden.
     - Right-side FINORA icon receives its own space.
     - Age receives its own space.
  ========================================================= */

  const calculatedDatePadding =
    calculatedDatePaddingValue(
      basicFormTokens.inputPaddingX,
      basicFormTokens.calendarIconSize,
      calculatedAge !== null,
      basicFormTokens.optionFontSize,
    );


  const resolvedDateInputStyle:
    CSSProperties = {

    ...dateInputStyle,

    ...resolvedInputStyle,

    paddingRight:
      calculatedDatePadding,

    appearance:
      "none",

    WebkitAppearance:
      "none",

    colorScheme:
      "dark",

    accentColor:
      theme.colors.brand.accent,

  };


  /* =========================================================
     CHECKBOX GEOMETRY
  ========================================================= */

  const checkboxSize =
    Math.max(
      12,
      basicFormTokens.iconSize,
    );


  /* =========================================================
     DROPDOWN OPTION STYLE
  ========================================================= */

  const optionStyle:
    CSSProperties = {

    fontSize:
      `${basicFormTokens.optionFontSize}px`,

    fontWeight:
      basicFormTokens.optionFontWeight,

  };


  /* =========================================================
     THEME CSS VARIABLES

     These variables allow the presentation layer and
     calendar control to consume the selected FINORA theme.
  ========================================================= */

  const themeStyle =
    {

      ...wrapperStyle,

      "--finora-theme-brand-primary":
        theme.colors.brand.primary,

      "--finora-theme-brand-secondary":
        theme.colors.brand.secondary,

      "--finora-theme-brand-accent":
        theme.colors.brand.accent,

      "--finora-theme-brand-accent-soft":
        theme.colors.brand.accentSoft,

      "--finora-theme-surface":
        theme.colors.background.surface,

      "--finora-theme-background-surface":
        theme.colors.background.surface,

      "--finora-theme-surface-muted":
        theme.colors.background.surfaceMuted,

      "--finora-theme-background-surface-muted":
        theme.colors.background.surfaceMuted,

      "--finora-theme-text-primary":
        theme.colors.text.primary,

      "--finora-theme-text-secondary":
        theme.colors.text.secondary,

      "--finora-theme-text-body":
        theme.colors.text.secondary,

      "--finora-theme-text-muted":
        theme.colors.text.muted,

      "--finora-theme-border-default":
        theme.colors.border.default,

      "--finora-theme-border-strong":
        theme.colors.border.strong,

      "--finora-theme-border-subtle":
        theme.colors.border.subtle,

      "--finora-theme-overlay-shadow":
        theme.colors.overlay.shadow,

    } as CSSProperties &
      Record<
        `--${string}`,
        string
      >;


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section
      style={
        themeStyle
      }
    >


      {/* =====================================================
          NATIVE DATE PICKER ICON SUPPRESSION

          The browser's native small calendar indicator is
          completely hidden.

          The native picker engine remains active.
          Only the FINORA right-side icon is visible.
      ===================================================== */}

      <style>

        {`

          .finora-identity-date-input::-webkit-calendar-picker-indicator {
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            cursor: pointer !important;
          }

          .finora-identity-date-input::-webkit-inner-spin-button {
            display: none !important;
          }

          .finora-identity-date-input::-webkit-clear-button {
            display: none !important;
          }

          .finora-identity-calendar-button:hover {
            background:
              color-mix(
                in srgb,
                var(--finora-theme-brand-accent, #D4AF37) 10%,
                transparent
              ) !important;
          }

          .finora-identity-calendar-button:active {
            transform:
              translateY(-50%)
              scale(.96);
          }

          .finora-identity-calendar-button:focus-visible {
            box-shadow:
              0 0 0 2px
              color-mix(
                in srgb,
                var(--finora-theme-brand-accent, #D4AF37) 30%,
                transparent
              );
          }

        `}

      </style>


      <div
        style={
          resolvedFieldGridStyle
        }
      >


        {/* =================================================
            CUSTOMER ID
        ================================================= */}

        <Field

          label="FINORA Customer ID"

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <div
            style={
              resolvedInputWrapperStyle
            }
          >

            <span
              style={
                resolvedLockIconStyle
              }

              aria-hidden="true"
            >

              <LockKeyhole

                style={
                  resolvedFieldIconStyle
                }

                strokeWidth={
                  2
                }

              />

            </span>


            <input

              style={
                resolvedIconReadOnlyInputStyle
              }

              value={
                value.customerId
              }

              readOnly

              aria-label="FINORA Customer ID"

            />

          </div>

        </Field>


        {/* =================================================
            CUSTOMER NAME
        ================================================= */}

        <Field

          label="Customer Name"

          required

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <div
            style={
              resolvedInputWrapperStyle
            }
          >

            <span
              style={
                resolvedLockIconStyle
              }

              aria-hidden="true"
            >

              <UserRound

                style={
                  resolvedFieldIconStyle
                }

                strokeWidth={
                  2
                }

              />

            </span>


            <input

              style={
                resolvedIconInputStyle
              }

              value={
                value.customerName
              }

              placeholder="Enter customer full name"

              onChange={(event) =>
                onChange(
                  "customerName",
                  event.target.value,
                )
              }

              aria-label="Customer Name"

            />

          </div>

        </Field>


        {/* =================================================
            MOBILE NUMBER
        ================================================= */}

        <Field

          label="Mobile Number"

          required

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <div
            style={
              resolvedInputWrapperStyle
            }
          >

            <span
              style={
                resolvedLockIconStyle
              }

              aria-hidden="true"
            >

              <Smartphone

                style={
                  resolvedFieldIconStyle
                }

                strokeWidth={
                  2
                }

              />

            </span>


            <input

              style={
                resolvedIconInputStyle
              }

              value={
                value.mobileNumber
              }

              placeholder="Enter mobile number"

              inputMode="tel"

              onChange={(event) =>
                onChange(
                  "mobileNumber",
                  event.target.value,
                )
              }

              aria-label="Mobile Number"

            />

          </div>

        </Field>


        {/* =================================================
            EMAIL ADDRESS
        ================================================= */}

        <Field

          label="Email Address"

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <div
            style={
              resolvedInputWrapperStyle
            }
          >

            <span
              style={
                resolvedLockIconStyle
              }

              aria-hidden="true"
            >

              <span
                style={{
                  ...resolvedFieldIconStyle,

                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  fontSize:
                    `${basicFormTokens.iconSize}px`,

                  color:
                    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

                }}
              >

                @

              </span>

            </span>


            <input

              style={
                resolvedIconInputStyle
              }

              type="email"

              value={
                value.email
              }

              placeholder="Enter email address"

              onChange={(event) =>
                onChange(
                  "email",
                  event.target.value,
                )
              }

              aria-label="Email Address"

            />

          </div>

        </Field>


        {/* =================================================
            WHATSAPP NUMBER
        ================================================= */}

        <Field

          label="WhatsApp Number"

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <div
            style={{
              ...resolvedInputWrapperStyle,

              position:
                "relative",
            }}
          >

            <span
              style={
                resolvedLockIconStyle
              }

              aria-hidden="true"
            >

              <MessageCircle

                style={
                  resolvedFieldIconStyle
                }

                strokeWidth={
                  2
                }

              />

            </span>


            <input

              style={{
                ...resolvedIconInputStyle,

                paddingRight:
                  `${basicFormTokens.inputPaddingX + 54}px`,
              }}

              value={
                value.whatsappSame
                  ? value.mobileNumber
                  : value.whatsappNumber
              }

              placeholder="Enter WhatsApp number"

              inputMode="tel"

              disabled={
                value.whatsappSame
              }

              onChange={(event) =>
                onChange(
                  "whatsappNumber",
                  event.target.value,
                )
              }

              aria-label="WhatsApp Number"

            />


            {/* =============================================
                SAME NUMBER CHECKBOX
            ============================================= */}

            <label
              style={{
                position:
                  "absolute",

                right:
                  `${basicFormTokens.inputPaddingX}px`,

                top:
                  "50%",

                transform:
                  "translateY(-50%)",

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  `${Math.max(
                    3,
                    basicFormTokens.iconOffset - 4,
                  )}px`,

                cursor:
                  "pointer",

                userSelect:
                  "none",

                zIndex:
                  3,

              }}

              title="WhatsApp uses same mobile number"

            >

              <input

                type="checkbox"

                checked={
                  value.whatsappSame
                }

                onChange={(event) =>
                  onChange(
                    "whatsappSame",
                    event.target.checked,
                  )
                }

                style={{
                  width:
                    `${checkboxSize}px`,

                  height:
                    `${checkboxSize}px`,

                  margin:
                    0,

                  accentColor:
                    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

                  cursor:
                    "pointer",

                  flexShrink:
                    0,

                }}

                aria-label="WhatsApp uses same number"

              />


              <span
                style={{
                  fontSize:
                    `${Math.max(
                      8,
                      basicFormTokens.optionFontSize - 2,
                    )}px`,

                  fontWeight:
                    700,

                  color:
                    "var(--finora-theme-text-secondary, #4B5563)",

                  whiteSpace:
                    "nowrap",

                }}
              >

                Same

              </span>

            </label>

          </div>

        </Field>


       {/* =================================================
    DATE OF BIRTH

    FINORA custom themed date picker.
    No browser native calendar popup.
================================================= */}

<Field

  label="Date of Birth"

  fieldStyleOverride={
    resolvedFieldStyle
  }

  labelStyleOverride={
    resolvedLabelStyle
  }

  requiredStyleOverride={
    resolvedRequiredStyle
  }

>

  <FinoraDatePicker

    value={
      value.dateOfBirth
    }

    onChange={(date) =>
      onChange(
        "dateOfBirth",
        date,
      )
    }

    ariaLabel="Date of Birth"

    placeholder="DD-MM-YYYY"

  />

</Field>

        {/* =================================================
            BUSINESS
        ================================================= */}

        <Field

          label="Business"

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <input

            style={
              resolvedInputStyle
            }

            value={
              value.businessName
            }

            readOnly

            aria-label="Business"

          />

        </Field>


        {/* =================================================
            BRANCH
        ================================================= */}

        <Field

          label="Branch"

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <input

            style={
              resolvedInputStyle
            }

            value={
              value.branchName
            }

            readOnly

            aria-label="Branch"

          />

        </Field>


        {/* =================================================
            PREFERRED LANGUAGE
        ================================================= */}

        <Field

          label="Preferred Language"

          fieldStyleOverride={
            resolvedFieldStyle
          }

          labelStyleOverride={
            resolvedLabelStyle
          }

          requiredStyleOverride={
            resolvedRequiredStyle
          }

        >

          <select

            style={{
              ...resolvedInputStyle,

              cursor:
                "pointer",

              paddingRight:
                `${basicFormTokens.inputPaddingX + 20}px`,

            }}

            value={
              value.preferredLanguage
            }

            onChange={(event) =>
              onChange(
                "preferredLanguage",
                event.target.value as PreferredLanguage,
              )
            }

            aria-label="Preferred Language"

          >

            <option
              value="Telugu"
              style={
                optionStyle
              }
            >
              Telugu
            </option>


            <option
              value="English"
              style={
                optionStyle
              }
            >
              English
            </option>


            <option
              value="Hindi"
              style={
                optionStyle
              }
            >
              Hindi
            </option>


            <option
              value="Tamil"
              style={
                optionStyle
              }
            >
              Tamil
            </option>


            <option
              value="Kannada"
              style={
                optionStyle
              }
            >
              Kannada
            </option>


            <option
              value="Marathi"
              style={
                optionStyle
              }
            >
              Marathi
            </option>


            <option
              value="Other"
              style={
                optionStyle
              }
            >
              Other
            </option>

          </select>

        </Field>

      </div>

    </section>

  );

}


/* ===========================================================
   DATE PADDING HELPER

   Responsive geometry remains controlled by the token values.

   The component only performs arithmetic using those tokens;
   it does not introduce viewport breakpoints.
=========================================================== */

function calculatedDatePaddingValue(

  inputPaddingX:
    number,

  calendarIconSize:
    number,

  hasAge:
    boolean,

  optionFontSize:
    number,

):
  string {

  const calendarSpace =
    calendarIconSize
    +
    18;


  const ageSpace =
    hasAge
      ? Math.max(
          32,
          optionFontSize * 3.8,
        )
        +
        18
      : 0;


  return `${
    inputPaddingX
    +
    calendarSpace
    +
    ageSpace
  }px`;

}


/* ===========================================================
   END
=========================================================== */