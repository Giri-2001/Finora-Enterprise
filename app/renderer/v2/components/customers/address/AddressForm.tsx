/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ADDRESS INFORMATION™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   Responsibility:

   - Current address
   - Permanent address
   - City / Village
   - District
   - State
   - PIN Code
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  addressGridStyle,
  fullAddressFieldStyle,
  fieldStyle,
  labelStyle,
  addressInputStyle,
  inputStyle,
  numberInputStyle,
} from "../wizard/steps/Step3Address.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface AddressFormData {
  currentAddress: string;

  permanentAddress: string;

  city: string;

  district: string;

  state: string;

  pinCode: string;
}

interface AddressFormProps {
  value: AddressFormData;

  onChange: (
    field: keyof AddressFormData,
    value: string,
  ) => void;
}

/* ===========================================================
   HELPER
=========================================================== */

function Field({
  label,
  value,
  onChange,
  inputStyleOverride,
  inputMode,
  maxLength,
  placeholder,
}: {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  inputStyleOverride?: CSSProperties;

  inputMode?:
    | "text"
    | "numeric"
    | "tel";

  maxLength?: number;

  placeholder: string;
}) {
  return (
    <div
      style={fieldStyle}
    >

      <label
        style={labelStyle}
      >
        {label}
      </label>

      <input
        style={
          inputStyleOverride ??
          inputStyle
        }

        value={value}

        placeholder={placeholder}

        inputMode={inputMode}

        maxLength={maxLength}

        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }

        aria-label={label}
      />

    </div>
  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressForm({
  value,
  onChange,
}: AddressFormProps) {

  return (
    <div
      style={addressGridStyle}
    >

      {/* =================================================
          CURRENT ADDRESS
      ================================================= */}

      <div
        style={fullAddressFieldStyle}
      >

        <label
          style={labelStyle}
        >
          Current Address
        </label>

        <input
          style={addressInputStyle}

          value={
            value.currentAddress
          }

          placeholder="Enter current residential address"

          onChange={(event) =>
            onChange(
              "currentAddress",
              event.target.value,
            )
          }

          aria-label="Current Address"
        />

      </div>

      {/* =================================================
          PERMANENT ADDRESS
      ================================================= */}

      <div
        style={fullAddressFieldStyle}
      >

        <label
          style={labelStyle}
        >
          Permanent Address
        </label>

        <input
          style={addressInputStyle}

          value={
            value.permanentAddress
          }

          placeholder="Enter permanent residential address"

          onChange={(event) =>
            onChange(
              "permanentAddress",
              event.target.value,
            )
          }

          aria-label="Permanent Address"
        />

      </div>

      {/* =================================================
          CITY / VILLAGE
      ================================================= */}

      <Field
        label="City / Village"

        value={
          value.city
        }

        placeholder="Enter city or village"

        onChange={(nextValue) =>
          onChange(
            "city",
            nextValue,
          )
        }
      />

      {/* =================================================
          DISTRICT
      ================================================= */}

      <Field
        label="District"

        value={
          value.district
        }

        placeholder="Enter district"

        onChange={(nextValue) =>
          onChange(
            "district",
            nextValue,
          )
        }
      />

      {/* =================================================
          STATE
      ================================================= */}

      <Field
        label="State"

        value={
          value.state
        }

        placeholder="Enter state"

        onChange={(nextValue) =>
          onChange(
            "state",
            nextValue,
          )
        }
      />

      {/* =================================================
          PIN CODE
      ================================================= */}

      <Field
        label="PIN Code"

        value={
          value.pinCode
        }

        placeholder="Enter 6-digit PIN code"

        inputMode="numeric"

        maxLength={6}

        inputStyleOverride={
          numberInputStyle
        }

        onChange={(nextValue) =>
          onChange(
            "pinCode",
            nextValue.replace(
              /\D/g,
              "",
            ),
          )
        }
      />

    </div>
  );
}
