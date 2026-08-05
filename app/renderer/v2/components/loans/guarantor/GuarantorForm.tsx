/* ===========================================================
   FINORA ENTERPRISE V2
   GUARANTOR STUDIO
   GUARANTOR FORM
=========================================================== */

import type { CSSProperties } from "react";

import {
  FormField,
  TextInput,
} from "../../common";

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
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "20px",

};

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

  );

}
