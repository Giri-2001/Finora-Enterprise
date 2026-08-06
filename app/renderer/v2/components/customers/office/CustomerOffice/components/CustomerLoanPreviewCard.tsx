/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PREVIEW CARD™

   SMART WALL
=========================================================== */

import type {

  OfficeCustomer,

} from "../types";

interface CustomerLoanPreviewCardProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanPreviewCard({

  customer,

}: CustomerLoanPreviewCardProps) {


  const loans =
    customer.loans ?? [];


  const runningLoans =
    loans.filter(

      (loan) =>

        loan.status === "ACTIVE" ||

        loan.status === "RUNNING",

    );


  const closedLoans =
    loans.filter(

      (loan) =>

        loan.status === "CLOSED",

    );


  const outstandingAmount =
    loans.reduce(

      (total, loan) =>

        total + loan.outstanding,

      0,

    );

  return (

    <section

      style={{

        width: "100%",

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

          Loan Snapshot

        </div>

      </div>

      {/* ======================================
          BODY
      ====================================== */}

      {/* ======================================
    BODY
====================================== */}

<div

  style={{

    flex: 1,

    display: "grid",

    gridTemplateColumns: "1fr 1fr",

    gap: "12px",

    padding: "14px",

    alignContent: "start",

  }}

>

  {/* Running */}

  <div

    style={{

      background: "#FFF8EA",

      border: "1px solid #D9B66C",

      borderRadius: "14px",

      padding: "12px",

      textAlign: "center",

    }}

  >

    <div

      style={{

        fontSize: "12px",

        color: "#8B5E34",

        fontWeight: 600,

      }}

    >

      Running

    </div>

    <div

      style={{

        marginTop: "6px",

        fontSize: "24px",

        fontWeight: 700,

        color: "#15803D",

      }}

    >

      {runningLoans.length}

    </div>

  </div>

  {/* Closed */}

  <div

    style={{

      background: "#FFF8EA",

      border: "1px solid #D9B66C",

      borderRadius: "14px",

      padding: "12px",

      textAlign: "center",

    }}

  >

    <div

      style={{

        fontSize: "12px",

        color: "#8B5E34",

        fontWeight: 600,

      }}

    >

      Closed

    </div>

    {/* Outstanding */}

<div

  style={{

    background: "#FFF8EA",

    border: "1px solid #D9B66C",

    borderRadius: "14px",

    padding: "12px",

    textAlign: "center",

  }}

>

  <div

    style={{

      fontSize: "12px",

      color: "#8B5E34",

      fontWeight: 600,

    }}

  >

    Outstanding

  </div>

  <div

    style={{

      marginTop: "6px",

      fontSize: "18px",

      fontWeight: 700,

      color: "#8B5E34",

    }}

  >

    ₹ {outstandingAmount}

  </div>

</div>


{/* EMI Today */}

<div

  style={{

    background: "#FFF8EA",

    border: "1px solid #D9B66C",

    borderRadius: "14px",

    padding: "12px",

    textAlign: "center",

  }}

>

  <div

    style={{

      fontSize: "12px",

      color: "#8B5E34",

      fontWeight: 600,

    }}

  >

    EMI Today

  </div>

  <div

    style={{

      marginTop: "6px",

      fontSize: "20px",

      fontWeight: 700,

      color: "#8B5E34",

    }}

  >

      00

  </div>

</div>

    <div

      style={{

        marginTop: "6px",

        fontSize: "24px",

        fontWeight: 700,

        color: "#B91C1C",

      }}

    >

      {closedLoans.length}

    </div>

  </div>

  {/* ======================================
    FOOTER
====================================== */}

<div

  style={{

    borderTop: "1px solid #E7D6B3",

    padding: "12px 16px",

    display: "flex",

    justifyContent: "flex-start",

    gap: "18px",

    alignItems: "center",

    background: "#FFFCF6",

  }}

>

  <div

    style={{

      color: "#7C5A2C",

      fontWeight: 600,

      fontSize: "13px",

    }}

  >

    Open Loan Workspace

  </div>

  <div

    style={{

      color: "#8A6135",

      fontWeight: 700,

      fontSize: "16px",

      cursor: "pointer",

    }}

  >

    →

  </div>

</div>

</div>

    </section>

  );

}
