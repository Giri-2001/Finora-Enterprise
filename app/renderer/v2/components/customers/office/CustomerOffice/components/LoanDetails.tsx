/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN DETAILS™

   REUSABLE COMPONENT
=========================================================== */

interface LoanDetailsProps {

  loan: {

    interest: number;

    processingFee: number;

    loanDate: string;

    guarantor: string;

  };

}

export default function LoanDetails({

  loan,

}: LoanDetailsProps) {

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

          Interest

        </div>

        <strong>

          ₹{loan.interest.toLocaleString()}

        </strong>

      </div>

      <div>

        <div

          style={{

            fontSize: "12px",

            color: "#64748B",

          }}

        >

          Processing Fee

        </div>

        <strong>

          ₹{loan.processingFee.toLocaleString()}

        </strong>

      </div>

      <div>

        <div

          style={{

            fontSize: "12px",

            color: "#64748B",

          }}

        >

          Loan Date

        </div>

        <strong>

          {loan.loanDate}

        </strong>

      </div>

      <div>

        <div

          style={{

            fontSize: "12px",

            color: "#64748B",

          }}

        >

          Guarantor

        </div>

        <strong>

          {loan.guarantor}

        </strong>

      </div>

    </div>

  );

}
