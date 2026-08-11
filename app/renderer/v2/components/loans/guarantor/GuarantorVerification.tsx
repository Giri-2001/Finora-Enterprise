/* ===========================================================
FINORA ENTERPRISE V2
GUARANTOR STUDIO
GUARANTOR VERIFICATION
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import {
  FormField,
  SelectInput,
} from "../../common";

import {
  accentStyle,
  contentStyle,
  fieldContentStyle,
  fieldStyle,
  headerStyle,
  wrapperStyle,
} from "./GuarantorVerification.styles";

/* ===========================================================
COMPONENT
=========================================================== */

export default function GuarantorVerification() {
  return (
    <div style={wrapperStyle}>

      {/* HEADER */}
      <div style={headerStyle}>
        <span style={accentStyle} />

        <span>
          Guarantor Verification
        </span>
      </div>

      <div style={contentStyle}>

        {/* VERIFICATION STATUS */}
        <div style={fieldStyle}>
          <div style={fieldContentStyle}>
            <FormField
              label="Verification Status"
              required
            >
              <SelectInput
                options={[
                  {
                    label: "Pending",
                    value: "pending",
                  },
                  {
                    label: "Verified",
                    value: "verified",
                  },
                  {
                    label: "Rejected",
                    value: "rejected",
                  },
                ]}
              />
            </FormField>
          </div>
        </div>

        {/* IDENTITY VERIFICATION */}
        <div style={fieldStyle}>
          <div style={fieldContentStyle}>
            <FormField
              label="Identity Verification"
            >
              <SelectInput
                options={[
                  {
                    label: "Aadhaar",
                    value: "aadhaar",
                  },
                  {
                    label: "PAN",
                    value: "pan",
                  },
                  {
                    label: "Driving Licence",
                    value: "dl",
                  },
                  {
                    label: "Voter ID",
                    value: "voter",
                  },
                ]}
              />
            </FormField>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ===========================================================
END
=========================================================== */
