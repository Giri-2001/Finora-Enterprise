/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY FORM™

   Responsibility:

   - Identity Step 1 field composition
   - Form state remains controlled by parent
   - Customer identity fields
   - Customer contact fields
   - Customer personal identity fields
   - WhatsApp same-number preference
   - Live age calculation from Date of Birth
   - FINORA presentation comes from IdentityForm.styles.ts
   - Reusable by Add Customer and Edit Customer

   Version : 2.0
   Status  : Production
=========================================================== */

import type {
  ReactNode,
} from "react";

import {
  wrapperStyle,
  fieldGridStyle,
  fieldStyle,
  labelStyle,
  requiredStyle,
  inputStyle,
  inputWrapperStyle,
  iconInputStyle,
  iconReadOnlyInputStyle,
  lockIconStyle,
} from "./IdentityForm.styles";

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

  customerName: string;

  mobileNumber: string;

  whatsappSame: boolean;

  whatsappNumber: string;

  email: string;

  dateOfBirth: string;

  preferredLanguage:
    PreferredLanguage;

  businessName: string;

  branchName: string;

  customerId: string;

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
  dateOfBirth: string,
): number | null {

  if (!dateOfBirth) {

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

  children: string;

  required?: boolean;

}

function FieldLabel({

  children,

  required = false,

}: FieldLabelProps) {

  return (

    <span
      style={labelStyle}
    >

      {children}

      {required && (

        <span
          style={requiredStyle}
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

  label: string;

  required?: boolean;

  children: ReactNode;

}

function Field({

  label,

  required = false,

  children,

}: FieldProps) {

  return (

    <div
      style={fieldStyle}
    >

      <FieldLabel
        required={required}
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

  const calculatedAge =
    calculateAge(
      value.dateOfBirth,
    );

  return (

    <section
      style={wrapperStyle}
    >

      <div
        style={fieldGridStyle}
      >

        {/* =================================================
            CUSTOMER ID
        ================================================= */}

        <Field
          label="FINORA Customer ID"
        >

          <div
            style={inputWrapperStyle}
          >

            <span
              style={lockIconStyle}
              aria-hidden="true"
            >

              🔒

            </span>

            <input

              style={
                iconReadOnlyInputStyle
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
        >

          <div
            style={inputWrapperStyle}
          >

            <span
              style={lockIconStyle}
              aria-hidden="true"
            >

              👤

            </span>

            <input

              style={
                iconInputStyle
              }

              value={
                value.customerName
              }

              placeholder=
                "Enter customer full name"

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
        >

          <div
            style={inputWrapperStyle}
          >

            <span
              style={lockIconStyle}
              aria-hidden="true"
            >

              📱

            </span>

            <input

              style={
                iconInputStyle
              }

              value={
                value.mobileNumber
              }

              placeholder=
                "Enter mobile number"

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
        >

          <input

            style={{
              ...inputStyle,
              paddingRight: "14px",
            }}

            type="email"

            value={
              value.email
            }

            placeholder=
              "Enter email address"

            onChange={(event) =>

              onChange(

                "email",

                event.target.value,

              )

            }

            aria-label="Email Address"

          />

        </Field>

        {/* =================================================
            WHATSAPP NUMBER

            CHECKBOX IS INSIDE THE SAME INPUT
            ON THE RIGHT SIDE.
        ================================================= */}

        <Field
          label="WhatsApp Number"
        >

          <div
            style={{
              ...inputWrapperStyle,
              position: "relative",
            }}
          >

            <span
              style={lockIconStyle}
              aria-hidden="true"
            >

              💬

            </span>

            <input

              style={{
                ...iconInputStyle,

                paddingRight: "76px",

                opacity:
                  value.whatsappSame
                    ? 0.72
                    : 1,

              }}

              value={
                value.whatsappSame
                  ? value.mobileNumber
                  : value.whatsappNumber
              }

              placeholder=
                "Enter WhatsApp number"

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

            {/* =========================================
                SAME NUMBER CHECKBOX
            ========================================= */}

            <label
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform:
                  "translateY(-50%)",

                display: "flex",
                alignItems: "center",
                gap: "4px",

                cursor: "pointer",

                userSelect: "none",

                zIndex: 3,
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
                  width: "14px",
                  height: "14px",
                  margin: 0,
                  accentColor: "#D4AF37",
                  cursor: "pointer",
                }}

                aria-label=
                  "WhatsApp uses same number"

              />

              <span
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  color:
                    "rgba(255,255,255,.82)",
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

            AGE IS CALCULATED LIVE FROM DOB
            AND DISPLAYED INSIDE THE SAME INPUT.
        ================================================= */}

        <Field
          label="Date of Birth"
        >

          <div
            style={{
              ...inputWrapperStyle,
              position: "relative",
            }}
          >

            <input

              style={{
                ...inputStyle,

                paddingRight:
                  calculatedAge !== null
                    ? "82px"
                    : "40px",
              }}

              type="date"

              value={
                value.dateOfBirth
              }

              onChange={(event) =>

                onChange(

                  "dateOfBirth",

                  event.target.value,

                )

              }

              aria-label="Date of Birth"

            />

            {/* =========================================
                LIVE AGE
            ========================================= */}

            {calculatedAge !== null && (

              <span
                style={{
                  position: "absolute",

                  right: "30px",

                  top: "50%",

                  transform:
                    "translateY(-50%)",

                  fontSize: "10px",

                  fontWeight: 800,

                  color: "#F3E4C2",

                  whiteSpace:
                    "nowrap",

                  pointerEvents:
                    "none",

                  zIndex: 2,
                }}
              >

                Age {calculatedAge}

              </span>

            )}

          </div>

        </Field>

        {/* =================================================
            BUSINESS
        ================================================= */}

        <Field
          label="Business"
        >

          <input

            style={inputStyle}

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
        >

          <input

            style={inputStyle}

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
        >

          <select

            style={inputStyle}

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

            <option value="Telugu">
              Telugu
            </option>

            <option value="English">
              English
            </option>

            <option value="Hindi">
              Hindi
            </option>

            <option value="Tamil">
              Tamil
            </option>

            <option value="Kannada">
              Kannada
            </option>

            <option value="Marathi">
              Marathi
            </option>

            <option value="Other">
              Other
            </option>

          </select>

        </Field>

      </div>

    </section>

  );

}
