/* ===========================================================
   FINORA ENTERPRISE OS™
   ACTION NEEDED PREVIEW™

   SMART WALL
=========================================================== */

import type {
  OfficeCustomer,
} from "../types";

/* ===========================================================
   TYPES
=========================================================== */

interface ActionNeededPreviewCardProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ActionNeededPreviewCard({

  customer,

}: ActionNeededPreviewCardProps) {

  const hasOutstanding =

    customer.outstandingAmount > 0;

  return (

    <section

      style={{

        height: "230px",

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

            fontSize: "18px",

          }}

        >

          Action Needed

        </div>

      </div>

      {/* ======================================
          BODY
      ====================================== */}

      <div

        style={{

          flex: 1,

          padding: "18px",

          display: "flex",

          flexDirection: "column",

          justifyContent: "flex-start",

          gap: "18px",

        }}

      >

        {/* OUTSTANDING */}

        <div>

          <div

            style={{

              color: "#DC2626",

              fontWeight: 700,

              fontSize: "14px",

            }}

          >

            🔴 Outstanding

          </div>

          <div

            style={{

              marginTop: "4px",

              color: "#475569",

              fontSize: "13px",

            }}

          >

            {

              hasOutstanding

                ? `₹${customer.outstandingAmount.toLocaleString()} Pending`

                : "No Outstanding Balance"

            }

          </div>

        </div>

        {/* STATUS */}

        <div>

          <div

            style={{

              color: "#CA8A04",

              fontWeight: 700,

              fontSize: "14px",

            }}

          >

            🟡 Customer Status

          </div>

          <div

            style={{

              marginTop: "4px",

              color: "#475569",

              fontSize: "13px",

            }}

          >

            {

              customer.active

                ? "Active Customer"

                : "Inactive Customer"

            }

          </div>

        </div>

        {/* NEXT COLLECTION */}

        <div>

          <div

            style={{

              color: "#2563EB",

              fontWeight: 700,

              fontSize: "14px",

            }}

          >

            🔵 Next Collection

          </div>

          <div

            style={{

              marginTop: "4px",

              color: "#475569",

              fontSize: "13px",

            }}

          >

            {customer.nextCollectionDate}

          </div>

        </div>

        {/* FOOTER */}

        <div

          style={{

            borderTop: "1px solid #E8D8B6",

            paddingTop: "10px",

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

          }}

        >

          <span

            style={{

              color: "#8A6135",

              fontSize: "13px",

              fontWeight: 600,

            }}

          >

            Resolve Actions

          </span>

          <span

            style={{

              color: "#8A6135",

              fontSize: "18px",

              fontWeight: 700,

              cursor: "pointer",

            }}

          >

            →

          </span>

        </div>

      </div>

    </section>

  );

}
