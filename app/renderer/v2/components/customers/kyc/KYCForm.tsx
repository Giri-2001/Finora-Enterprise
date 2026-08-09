/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER KYC INFORMATION

   RESPONSIBILITY:
   - KYC field rendering
   - KYC field change events

   STYLES:
   KYCForm.styles.ts
=========================================================== */

import {
  kycFormGridStyle,
  fieldStyle,
  labelStyle,
  inputStyle,
} from "./KYCForm.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface KYCFormData {
  aadhaarNumber: string;
  panNumber: string;
  voterId: string;
  drivingLicense: string;
}

interface KYCFormProps {
  value: KYCFormData;

  onChange: (
    field: keyof KYCFormData,
    value: string,
  ) => void;
}

/* ===========================================================
   FIELD
=========================================================== */

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={fieldStyle}>

      <label style={labelStyle}>
        {label}
      </label>

      <input
        type="text"
        style={inputStyle}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        autoComplete="off"
      />

    </div>
  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function KYCForm({
  value,
  onChange,
}: KYCFormProps) {

  return (
    <div style={kycFormGridStyle}>

      <Field
        label="Aadhaar Number"
        value={value.aadhaarNumber}
        onChange={(v) =>
          onChange(
            "aadhaarNumber",
            v,
          )
        }
      />

      <Field
        label="PAN Number"
        value={value.panNumber}
        onChange={(v) =>
          onChange(
            "panNumber",
            v,
          )
        }
      />

      <Field
        label="Voter ID"
        value={value.voterId}
        onChange={(v) =>
          onChange(
            "voterId",
            v,
          )
        }
      />

      <Field
        label="Driving Licence"
        value={value.drivingLicense}
        onChange={(v) =>
          onChange(
            "drivingLicense",
            v,
          )
        }
      />

    </div>
  );
}
