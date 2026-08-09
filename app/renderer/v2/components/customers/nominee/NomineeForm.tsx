/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER NOMINEE INFORMATION

   RESPONSIBILITY:
   - Existing FINORA customer ID input
   - Nominee name presentation
   - Nominee phone presentation
   - Nominee form change events
   - Linked customer readonly presentation

   BUSINESS LOGIC:
   - NONE

   STYLES:
   NomineeForm.styles.ts

   IMPORTANT:
   The component does not decide whether a customer exists.
   Step5Nominee owns customer lookup and passes the
   isCustomerLinked state explicitly.
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  wrapperStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  gridStyle,
  fieldStyle,
  labelStyle,
  inputStyle,
  readonlyInputStyle,
  helperStyle,
  sectionDividerStyle,
} from "./NomineeForm.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface NomineeFormData {

  nomineeCustomerId: string;

  nomineeName: string;

  relationship: string;

  phoneNumber: string;
}

interface NomineeFormProps {

  value: NomineeFormData;

  onChange: (
    field: keyof NomineeFormData,
    value: string,
  ) => void;

  /**
   * True only when the entered FINORA Customer ID
   * successfully resolves to an existing customer.
   *
   * Business lookup is handled by Step5Nominee.
   */
  isCustomerLinked?: boolean;
}

/* ===========================================================
   FIELD
=========================================================== */

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
  helper,
  type = "text",
}: {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  readOnly?: boolean;

  placeholder?: string;

  helper?: string;

  type?: string;
}) {

  return (

    <div style={fieldStyle}>

      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        autoComplete="off"
        style={
          readOnly
            ? readonlyInputStyle
            : inputStyle
        }
        onChange={(event) => {

          if (readOnly) {
            return;
          }

          onChange(
            event.target.value,
          );

        }}
      />

      {helper && (

        <div style={helperStyle}>
          {helper}
        </div>

      )}

    </div>

  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NomineeForm({

  value,

  onChange,

  isCustomerLinked = false,

}: NomineeFormProps) {

  return (

    <section style={wrapperStyle}>

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div style={headerStyle}>

        <div>

          <h2 style={titleStyle}>
            Nominee Information
          </h2>

          <p style={subtitleStyle}>
            Link an existing FINORA customer or enter nominee details.
          </p>

        </div>

      </div>

      <div style={sectionDividerStyle} />

      {/* =====================================================
         FORM
      ===================================================== */}

      <div style={gridStyle}>

        {/* ===================================================
           FINORA CUSTOMER ID
        =================================================== */}

        <Field
          label="FINORA Customer ID"
          value={
            value.nomineeCustomerId
          }
          onChange={(nextValue) =>
            onChange(
              "nomineeCustomerId",
              nextValue,
            )
          }
          placeholder="FIN-CUS-000001"
          helper={
            isCustomerLinked
              ? "Registered FINORA customer linked successfully."
              : "Enter a registered FINORA Customer ID to link the nominee."
          }
        />

        {/* ===================================================
           NOMINEE NAME
        =================================================== */}

        <Field
          label="Nominee Name"
          value={
            value.nomineeName
          }
          onChange={(nextValue) =>
            onChange(
              "nomineeName",
              nextValue,
            )
          }
          readOnly={
            isCustomerLinked
          }
          placeholder="Nominee full name"
          helper={
            isCustomerLinked
              ? "Automatically linked from the registered customer profile."
              : "Enter nominee full name."
          }
        />

        {/* ===================================================
           PHONE NUMBER
        =================================================== */}

        <Field
          label="Phone Number"
          value={
            value.phoneNumber
          }
          onChange={(nextValue) =>
            onChange(
              "phoneNumber",
              nextValue,
            )
          }
          readOnly={
            isCustomerLinked
          }
          placeholder="Nominee mobile number"
          helper={
            isCustomerLinked
              ? "Automatically linked from the registered customer profile."
              : "Enter nominee mobile number."
          }
          type="tel"
        />

      </div>

    </section>

  );
}
