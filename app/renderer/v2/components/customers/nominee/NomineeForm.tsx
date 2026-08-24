/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER NOMINEE INFORMATION
=========================================================== */

import type {
  ReactNode,
} from "react";

import {
  UserRound,
  User,
  Phone,
  UsersRound,
} from "lucide-react";

import {
  useTheme,
} from "../../../themes/hooks/useTheme";

import {
  createNomineeFormStyles,
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

  isCustomerLinked?: boolean;
}


/* ===========================================================
   FIELD
=========================================================== */

function Field({
  label,
  value,
  onChange,
  icon,
  readOnly = false,
  placeholder,
  helper,
  type = "text",
  styles,
}: {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  icon: ReactNode;

  readOnly?: boolean;

  placeholder?: string;

  helper?: string;

  type?: string;

  styles: ReturnType<
    typeof createNomineeFormStyles
  >;
}) {

  return (

    <div style={styles.fieldStyle}>

      <label style={styles.labelStyle}>
        {label}
      </label>

      <div style={styles.inputWrapperStyle}>

        <span style={styles.inputIconStyle}>
          {icon}
        </span>

        <input
          type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          autoComplete="off"
          style={
            readOnly
              ? styles.readonlyInputStyle
              : styles.inputStyle
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

      </div>

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


  /* =========================================================
     FINORA THEME ENGINE
  ========================================================= */

  const {
    theme,
  } = useTheme();


  const styles =
    createNomineeFormStyles(
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section style={styles.wrapperStyle}>

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div style={styles.headerStyle}>

        <div style={styles.headerIconStyle}>
          <UserRound size={18} />
        </div>

        <div>

          <h2 style={styles.titleStyle}>
            Nominee Information
          </h2>

          <p style={styles.subtitleStyle}>
            Link an existing FINORA customer or enter nominee details.
          </p>

        </div>

      </div>


      <div style={styles.sectionDividerStyle} />


      {/* =====================================================
         FOUR INPUTS
      ===================================================== */}

      <div style={styles.gridStyle}>

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
          icon={
            <User size={15} />
          }
          placeholder="FIN-CUS-000001"
          helper={
            isCustomerLinked
              ? "Registered FINORA customer linked successfully."
              : "Enter a registered FINORA Customer ID."
          }
          styles={styles}
        />


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
          icon={
            <UserRound size={15} />
          }
          readOnly={
            isCustomerLinked
          }
          placeholder="Nominee full name"
          helper={
            isCustomerLinked
              ? "Automatically linked from customer profile."
              : "Enter nominee full name."
          }
          styles={styles}
        />


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
          icon={
            <Phone size={15} />
          }
          readOnly={
            isCustomerLinked
          }
          placeholder="Nominee mobile number"
          helper={
            isCustomerLinked
              ? "Automatically linked from customer profile."
              : "Enter nominee mobile number."
          }
          type="tel"
          styles={styles}
        />


        {/* =================================================
           RELATIONSHIP
        ================================================= */}

        <div style={styles.fieldStyle}>

          <label style={styles.labelStyle}>
            Relationship
          </label>

          <div style={styles.inputWrapperStyle}>

            <span style={styles.inputIconStyle}>
              <UsersRound size={15} />
            </span>

            <select
              value={
                value.relationship
              }
              style={styles.selectStyle}
              onChange={(event) =>
                onChange(
                  "relationship",
                  event.target.value,
                )
              }
            >

              <option value="">
                Select Relationship
              </option>

              <option value="Father">
                Father
              </option>

              <option value="Mother">
                Mother
              </option>

              <option value="Husband">
                Husband
              </option>

              <option value="Wife">
                Wife
              </option>

              <option value="Son">
                Son
              </option>

              <option value="Daughter">
                Daughter
              </option>

              <option value="Brother">
                Brother
              </option>

              <option value="Sister">
                Sister
              </option>

              <option value="Uncle">
                Uncle
              </option>

              <option value="Aunt">
                Aunt
              </option>

              <option value="Friend">
                Friend
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>

        </div>

      </div>

    </section>

  );
}


/* ===========================================================
   END
=========================================================== */