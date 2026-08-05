/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION DETAILS™

   REUSABLE COMPONENT
=========================================================== */

import type {
  Loan,
} from "../types";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionDetailsProps {

  loan: Loan;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionDetails({

  loan,

}: CollectionDetailsProps) {

  return (

    <div

      style={{

        marginTop: "18px",

        paddingTop: "18px",

        borderTop: "1px solid #E5E7EB",

        display: "grid",

        gridTemplateColumns: "repeat(2,1fr)",

        gap: "16px",

      }}

    >

      <div>

        <div

          style={{

            fontSize: "12px",

            color: "#64748B",

          }}

        >

          Today's Collection

        </div>

        <strong>

          ₹0

        </strong>

      </div>

      <div>

        <div

          style={{

            fontSize: "12px",

            color: "#64748B",

          }}

        >

          Pending Amount

        </div>

        <strong>

          ₹{loan.outstanding.toLocaleString()}

        </strong>

      </div>

      <div>

        <div

          style={{

            fontSize: "12px",

            color: "#64748B",

          }}

        >

          Last Collection

        </div>

        <strong>

          --

        </strong>

      </div>

      <div>

        <div

          style={{

            fontSize: "12px",

            color: "#64748B",

          }}

        >

          Next Collection

        </div>

        <strong>

          {loan.dueDate}

        </strong>

      </div>

    </div>

  );

}
