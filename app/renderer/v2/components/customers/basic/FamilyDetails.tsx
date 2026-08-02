/* ===========================================================
   FINORA ENTERPRISE V2
   FAMILY DETAILS
--------------------------------------------------------------
Customer Family Information
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface FamilyDetailsData {

  spouseName: string;

  numberOfFamilyMembers: string;

  emergencyContactName: string;

  emergencyContactMobile: string;

}

interface FamilyDetailsProps {

  value: FamilyDetailsData;

  onChange: (
    field: keyof FamilyDetailsData,
    value: string,
  ) => void;

}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  padding: "24px",

  borderRadius: "18px",

  border: "1px solid #e5e7eb",

  background: "#ffffff",

};

const headingStyle: CSSProperties = {

  margin: 0,

  marginBottom: "24px",

  fontSize: "22px",

  fontWeight: 700,

};

const labelStyle: CSSProperties = {

  display: "block",

  marginBottom: "8px",

  fontWeight: 600,

};

const inputStyle: CSSProperties = {

  width: "100%",

  padding: "14px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  marginBottom: "20px",

  boxSizing: "border-box",

  fontSize: "15px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FamilyDetails({

  value,

  onChange,

}: FamilyDetailsProps) {

  return (

    <section style={cardStyle}>

      <h3 style={headingStyle}>
        Family Details
      </h3>

      <label style={labelStyle}>
        Spouse Name
      </label>

      <input
        style={inputStyle}
        value={value.spouseName}
        placeholder="Enter spouse name"
        onChange={(event) =>
          onChange(
            "spouseName",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Number of Family Members
      </label>

      <input
        style={inputStyle}
        value={value.numberOfFamilyMembers}
        placeholder="Enter family members"
        onChange={(event) =>
          onChange(
            "numberOfFamilyMembers",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Emergency Contact Name
      </label>

      <input
        style={inputStyle}
        value={value.emergencyContactName}
        placeholder="Enter emergency contact"
        onChange={(event) =>
          onChange(
            "emergencyContactName",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Emergency Contact Mobile
      </label>

      <input
        style={inputStyle}
        value={value.emergencyContactMobile}
        placeholder="Enter mobile number"
        onChange={(event) =>
          onChange(
            "emergencyContactMobile",
            event.target.value,
          )
        }
      />

    </section>

  );

}
