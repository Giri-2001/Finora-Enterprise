/* ===========================================================
FINORA ENTERPRISE V2
GUARANTOR STUDIO
GUARANTOR FORM
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import {
  FormField,
  TextInput,
} from "../../common";

import {
  accentStyle,
  fieldContentStyle,
  fieldStyle,
  fullWidthFieldStyle,
  headerStyle,
  wrapperStyle,
} from "./GuarantorForm.styles";

/* ===========================================================
TYPES
=========================================================== */

interface GuarantorFormProps {
  guarantorName: string;
  guarantorPhone: string;
  occupation: string;
  address: string;

  onGuarantorNameChange: (
    value: string,
  ) => void;

  onGuarantorPhoneChange: (
    value: string,
  ) => void;

  onOccupationChange: (
    value: string,
  ) => void;

  onAddressChange: (
    value: string,
  ) => void;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function GuarantorForm({
  guarantorName,
  guarantorPhone,
  occupation,
  address,
  onGuarantorNameChange,
  onGuarantorPhoneChange,
  onOccupationChange,
  onAddressChange,
}: GuarantorFormProps) {
  return (
    <div style={wrapperStyle}>

      {/* FORM HEADER */}
      <div style={headerStyle}>
        <span style={accentStyle} />

        <span>
          Guarantor Information
        </span>
      </div>

      {/* GUARANTOR NAME */}
      <div style={fieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Guarantor Name"
            required
          >
            <TextInput
              value={guarantorName}
              onChange={(event) =>
                onGuarantorNameChange(
                  event.target.value,
                )
              }
              placeholder="Enter guarantor name"
            />
          </FormField>
        </div>
      </div>

      {/* MOBILE NUMBER */}
      <div style={fieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Mobile Number"
            required
          >
            <TextInput
              value={guarantorPhone}
              onChange={(event) =>
                onGuarantorPhoneChange(
                  event.target.value,
                )
              }
              placeholder="Enter mobile number"
            />
          </FormField>
        </div>
      </div>

      {/* OCCUPATION */}
      <div style={fieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Occupation"
          >
            <TextInput
              value={occupation}
              onChange={(event) =>
                onOccupationChange(
                  event.target.value,
                )
              }
              placeholder="Enter occupation"
            />
          </FormField>
        </div>
      </div>

      {/* ADDRESS */}
      <div style={fullWidthFieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Address"
          >
            <TextInput
              value={address}
              onChange={(event) =>
                onAddressChange(
                  event.target.value,
                )
              }
              placeholder="Enter address"
            />
          </FormField>
        </div>
      </div>

    </div>
  );
}

/* ===========================================================
END
=========================================================== */
