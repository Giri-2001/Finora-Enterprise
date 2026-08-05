/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PROFILE PANEL™

   WORK DESK
=========================================================== */

import type {
  OfficeCustomer,
} from "../types";

import finoraLogo from "../../../../../app/assets/finoraenterprise.png";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerProfilePanelProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerProfilePanel({

  customer,

}: CustomerProfilePanelProps) {

  return (

    <section

      style={{

        width: "100%",

        height: "350px",

        background: "#FFFDF9",

        border: "1px solid #D8C7A4",

        borderRadius: "22px",

        overflow: "hidden",

        boxShadow:
          "0 12px 28px rgba(15,23,42,.08)",

        display: "flex",

        flexDirection: "column",

      }}

    >

      {/* ======================================
          HEADER
      ====================================== */}

      <div

        style={{

          background:
            "linear-gradient(180deg,#6F4A23,#8A6135)",

          padding: "12px",

          textAlign: "center",

        }}

      >

        <div

          style={{

            color: "#F8E7B2",

            fontWeight: 700,

            fontSize: "20px",

            letterSpacing: "1px",

          }}

        >

          FINORA

        </div>

        <div

          style={{

            marginTop: "4px",

            color: "#FFF7E3",

            fontSize: "10px",

            letterSpacing: ".8px",

          }}

        >

          ENTERPRISE CUSTOMER

        </div>

      </div>

      {/* ======================================
          BODY
      ====================================== */}

      <div

        style={{

          flex: 1,

          display: "flex",

          flexDirection: "column",

          justifyContent: "space-evenly",

          alignItems: "center",

          padding: "18px",

          gap: "14px",

        }}

      >

        {/* Temporary Logo Placeholder */}

        <img
  src={customer.photo ?? finoraLogo}
  alt={customer.name}
  style={{
    width: "105px",
    height: "105px",
    objectFit: customer.photo ? "cover" : "contain",
    borderRadius: "18px",
    border: "3px solid #D4AF37",
    background: "#FFFFFF",
    padding: customer.photo ? "0" : "8px",
  }}
/>
        <div

          style={{

            fontSize: "24px",

            fontWeight: 700,

            lineHeight: "30px",

            color: "#1E293B",

            textAlign: "center",

          }}

        >

          {customer.name}

        </div>

        <div

          style={{

            color: "#64748B",

            fontSize: "14px",

            fontWeight: 600,

          }}

        >

          {customer.id}

        </div>

        <div

          style={{

            padding: "6px 16px",

            borderRadius: "999px",

            background:
              customer.active
                ? "#DCFCE7"
                : "#FEE2E2",

            color:
              customer.active
                ? "#15803D"
                : "#B91C1C",

            fontSize: "13px",

            fontWeight: 700,

          }}

        >

          {customer.active
            ? "● Active Customer"
            : "● Inactive Customer"}

        </div>

      </div>

    </section>

  );

}
