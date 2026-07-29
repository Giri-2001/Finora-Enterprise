import { useState } from "react";

import LoanForm from "../../components/loans/LoanForm";
import LoanTable from "../../components/loans/LoanTable";

import type { Customer } from "../../components/customers/types";
import type { Loan } from "../../components/loans/types";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

import { getCustomers } from "../../store/customerStore";
import { addLoan, getLoans } from "../../store/loanStore";

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>(getLoans());

  const [customers] = useState<Customer[]>(getCustomers());

  function refresh() {
    setLoans(getLoans());
  }

  function saveLoan(loan: {
    customerId: string;
    oldLoanNumber: string;
    lockerNumber: string;
    bagNumber: string;

    approvedLoanAmount: number;
    receivedAmount: number;
    deductionAmount: number;

    interestType: "Percentage" | "Rupees" | "Paisa" | "Fixed";

    interestValue: number;

    collectionType: "Daily" | "Weekly" | "Monthly";

    duration: number;

    calculatedCollectionAmount: number;
    collectionAmount: number;

    startDate: string;
  }) {
    const newLoan: Loan = {
      id: Date.now(),

      finoraLoanId: String(loans.length + 1).padStart(3, "0"),

      oldLoanNumber: loan.oldLoanNumber,

      customerId: loan.customerId,

      approvedLoanAmount: loan.approvedLoanAmount,

      receivedAmount: loan.receivedAmount,

      deductionAmount: loan.deductionAmount,

      interestType: loan.interestType,

      interestValue: loan.interestValue,

      collectionType: loan.collectionType,

      duration: loan.duration,

      calculatedCollectionAmount: loan.calculatedCollectionAmount,

      collectionAmount: loan.collectionAmount,

      lockerNumber: loan.lockerNumber,

      bagNumber: loan.bagNumber,

      startDate: loan.startDate,

      status: "Active",
    };

    addLoan(newLoan);

    refresh();
  }

  const totalApproved = loans.reduce(
    (sum, loan) => sum + loan.approvedLoanAmount,
    0,
  );

  const activeLoans = loans.filter((loan) => loan.status === "Active").length;

  return (
    <div>
      <h1>Loan Management</h1>

      <p>Create and manage customer loans, repayments and collections.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card title="Total Loans">
          <h2>{loans.length}</h2>
        </Card>

        <Card title="Active Loans">
          <h2>{activeLoans}</h2>
        </Card>

        <Card title="Approved Amount">
          <h2>₹{totalApproved.toLocaleString("en-IN")}</h2>
        </Card>
      </div>

      <Card title="Create Loan">
        <LoanForm customers={customers} onSubmit={saveLoan} />
      </Card>

      <Card title="Loan Records">
        {loans.length > 0 ? (
          <LoanTable loans={loans} />
        ) : (
          <EmptyState
            title="No Loans Available"
            description="Create your first loan to start managing repayments."
          />
        )}
      </Card>
    </div>
  );
}
