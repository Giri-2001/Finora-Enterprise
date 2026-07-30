import { useMemo, useState } from "react";

import LoanForm from "../../components/loans/LoanForm";
import LoanTable from "../../components/loans/LoanTable";

import LoanDashboard from "../../components/loans/LoanDashboard";
import LoanFilters from "../../components/loans/LoanFilters";
import LoanSearch from "../../components/loans/LoanSearch";

import LoanCloseModal from "../../components/loans/LoanCloseModal";
import LoanEditModal from "../../components/loans/LoanEditModal";
import LoanViewModal from "../../components/loans/LoanViewModal";

import type { Customer } from "../../components/customers/types";
import type { Loan } from "../../components/loans/types";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

import { getCustomers } from "../../store/customerStore";

import {
  addLoan,
  closeLoan,
  generateFinoraLoanId,
  getLoans,
  updateLoan,
} from "../../store/loanStore";

import { getSession } from "../../store/authStore";

import { createAuditLog } from "../../store/auditStore";

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>(getLoans());

  const [customers] = useState<Customer[]>(getCustomers());

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<Loan["status"] | "">("");

  const [collectionType, setCollectionType] = useState<
    Loan["collectionType"] | ""
  >("");

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [mode, setMode] = useState<"view" | "edit" | "close" | null>(null);

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

    discountAmount: number;

    interestType: "Percentage" | "Rupees" | "Paisa" | "Fixed";

    interestValue: number;

    collectionType: "Daily" | "Weekly" | "Monthly";

    duration: number;

    calculatedCollectionAmount: number;

    collectionAmount: number;

    startDate: string;

    remarks: string;
  }) {
    const now = new Date().toISOString();

    const newLoan: Loan = {
      id: Date.now(),

      finoraLoanId: generateFinoraLoanId(),

      ...loan,

      totalCollectedAmount: 0,

      outstandingAmount: loan.approvedLoanAmount,

      lastCollectionDate: null,

      closedDate: null,

      createdAt: now,

      updatedAt: now,

      status: "Active",
    };

    addLoan(newLoan);

    const session = getSession();

    createAuditLog({
      action: "CREATE",

      module: "LOAN",

      description: `Loan ${newLoan.finoraLoanId} created`,

      performedBy: session?.username ?? "SYSTEM",

      userRole: session?.role ?? "UNKNOWN",
    });

    refresh();
  }

  const filteredLoans = useMemo(
    () =>
      loans.filter((loan) => {
        const text = search.toLowerCase();

        const matchesSearch =
          !text ||
          loan.finoraLoanId.toLowerCase().includes(text) ||
          loan.oldLoanNumber.toLowerCase().includes(text) ||
          loan.customerId.toLowerCase().includes(text);

        const matchesStatus = !status || loan.status === status;

        const matchesCollection =
          !collectionType || loan.collectionType === collectionType;

        return matchesSearch && matchesStatus && matchesCollection;
      }),

    [loans, search, status, collectionType],
  );

  function handleEdit(loan: Loan) {
    updateLoan(loan);

    const session = getSession();

    createAuditLog({
      action: "UPDATE",

      module: "LOAN",

      description: `Loan ${loan.finoraLoanId} updated`,

      performedBy: session?.username ?? "SYSTEM",

      userRole: session?.role ?? "UNKNOWN",
    });

    refresh();

    setMode(null);
  }

  function handleClose(loan: Loan) {
    closeLoan(loan.id);

    const session = getSession();

    createAuditLog({
      action: "UPDATE",

      module: "LOAN",

      description: `Loan ${loan.finoraLoanId} closed`,

      performedBy: session?.username ?? "SYSTEM",

      userRole: session?.role ?? "UNKNOWN",
    });

    refresh();

    setMode(null);
  }

  return (
    <div>
      <h1>Loan Management</h1>

      <p>Manage FINORA loans, balances and collections.</p>

      <LoanDashboard loans={loans} />

      <Card title="Search & Filters">
        <LoanSearch loans={loans} onSearch={setSearch} />

        <LoanFilters
          status={status}
          collectionType={collectionType}
          onStatusChange={setStatus}
          onCollectionChange={setCollectionType}
        />
      </Card>

      <Card title="Create Loan">
        <LoanForm customers={customers} onSubmit={saveLoan} />
      </Card>

      <Card title="Loan Records">
        {filteredLoans.length > 0 ? (
          <LoanTable
            loans={filteredLoans}
            onView={(loan) => {
              setSelectedLoan(loan);

              setMode("view");
            }}
            onEdit={(loan) => {
              setSelectedLoan(loan);

              setMode("edit");
            }}
            onCloseLoan={(loan) => {
              setSelectedLoan(loan);

              setMode("close");
            }}
          />
        ) : (
          <EmptyState
            title="No Loans Available"
            description="Create your first FINORA loan."
          />
        )}
      </Card>

      {selectedLoan && mode === "view" && (
        <LoanViewModal loan={selectedLoan} onClose={() => setMode(null)} />
      )}

      {selectedLoan && mode === "edit" && (
        <LoanEditModal
          loan={selectedLoan}
          onClose={() => setMode(null)}
          onSave={handleEdit}
        />
      )}

      {selectedLoan && mode === "close" && (
        <LoanCloseModal
          loan={selectedLoan}
          onClose={() => setMode(null)}
          onConfirm={handleClose}
        />
      )}
    </div>
  );
}
