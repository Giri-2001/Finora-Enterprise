import type { Loan } from "./types";

import Card from "../ui/Card";

type LoanDetailsProps = {
  loan: Loan;
};

export default function LoanDetails({ loan }: LoanDetailsProps) {
  return (
    <Card title="Loan Details">
      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

          gap: 16,
        }}
      >
        <div>
          <strong>FINORA Loan ID</strong>

          <p>{loan.finoraLoanId}</p>
        </div>

        <div>
          <strong>Old Loan Number</strong>

          <p>{loan.oldLoanNumber || "-"}</p>
        </div>

        <div>
          <strong>Customer ID</strong>

          <p>{loan.customerId}</p>
        </div>

        <div>
          <strong>Approved Amount</strong>

          <p>₹{loan.approvedLoanAmount.toLocaleString("en-IN")}</p>
        </div>

        <div>
          <strong>Received Amount</strong>

          <p>₹{loan.receivedAmount.toLocaleString("en-IN")}</p>
        </div>

        <div>
          <strong>Deduction</strong>

          <p>₹{loan.deductionAmount.toLocaleString("en-IN")}</p>
        </div>

        <div>
          <strong>Discount</strong>

          <p>₹{loan.discountAmount.toLocaleString("en-IN")}</p>
        </div>

        <div>
          <strong>Total Collected</strong>

          <p>₹{loan.totalCollectedAmount.toLocaleString("en-IN")}</p>
        </div>

        <div>
          <strong>Outstanding Balance</strong>

          <p>₹{loan.outstandingAmount.toLocaleString("en-IN")}</p>
        </div>

        <div>
          <strong>Interest</strong>

          <p>
            {loan.interestValue} {loan.interestType}
          </p>
        </div>

        <div>
          <strong>Collection Type</strong>

          <p>{loan.collectionType}</p>
        </div>

        <div>
          <strong>Duration</strong>

          <p>{loan.duration}</p>
        </div>

        <div>
          <strong>Status</strong>

          <p>{loan.status}</p>
        </div>

        <div>
          <strong>Locker Number</strong>

          <p>{loan.lockerNumber || "-"}</p>
        </div>

        <div>
          <strong>Bag Number</strong>

          <p>{loan.bagNumber || "-"}</p>
        </div>

        <div>
          <strong>Start Date</strong>

          <p>{loan.startDate}</p>
        </div>

        <div>
          <strong>Remarks</strong>

          <p>{loan.remarks || "-"}</p>
        </div>
      </div>
    </Card>
  );
}
