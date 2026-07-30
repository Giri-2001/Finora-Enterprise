import { useMemo, useState } from "react";

import CollectionDashboard from "../../components/collections/CollectionDashboard";
import CollectionForm from "../../components/collections/CollectionForm";
import CollectionSummary from "../../components/collections/CollectionSummary";
import CollectionTable from "../../components/collections/CollectionTable";
import LoanSelector from "../../components/collections/LoanSelector";

import type { Collection } from "../../components/collections/types";
import type { Loan } from "../../components/loans/types";

import Card from "../../components/ui/Card";

import {
  addCollection,
  deleteCollection,
  getCollections,
} from "../../store/collectionStore";

import { getLoans, updateLoanAfterCollection } from "../../store/loanStore";

import { createAuditLog } from "../../store/auditStore";
import { getSession } from "../../store/authStore";

function safeNumber(value?: number | null): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

export default function Collections() {
  const [collections, setCollections] =
    useState<Collection[]>(getCollections());

  const [loans] = useState<Loan[]>(getLoans());

  const [selectedLoanId, setSelectedLoanId] = useState("");

  const selectedLoan = useMemo(
    () => loans.find((loan) => loan.id.toString() === selectedLoanId) ?? null,
    [loans, selectedLoanId],
  );

  const collectedAmount = useMemo(() => {
    return collections
      .filter((item) => item.loanId === selectedLoanId)
      .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
  }, [collections, selectedLoanId]);

  function refreshCollections() {
    setCollections(getCollections());
  }

  function saveCollection(data: {
    loanId: string;
    customerId: string;
    collectionDate: string;
    collectionType: "INTEREST" | "PRINCIPAL" | "BOTH" | "PENALTY";
    interestAmount: number;
    principalAmount: number;
    penaltyAmount: number;
    totalAmount: number;
    paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
    remarks: string;
  }) {
    if (!selectedLoan) {
      alert("Please select a loan first.");
      return;
    }

    const now = new Date().toISOString();

    const collection: Collection = {
      id: crypto.randomUUID(),

      loanId: selectedLoan.id.toString(),

      customerId: selectedLoan.customerId,

      receiptNumber: `RCPT-${String(collections.length + 1).padStart(5, "0")}`,

      collectionDate: data.collectionDate,

      collectionType: data.collectionType,

      interestAmount: safeNumber(data.interestAmount),

      principalAmount: safeNumber(data.principalAmount),

      penaltyAmount: safeNumber(data.penaltyAmount),

      totalAmount: safeNumber(data.totalAmount),

      paymentMode: data.paymentMode,

      remarks: data.remarks,

      collectedBy: "Admin",

      status: "COMPLETED",

      createdAt: now,

      updatedAt: now,
    };

    addCollection(collection);

    updateLoanAfterCollection(
      selectedLoan.id,
      collection.totalAmount,
      collection.collectionDate,
    );

    const session = getSession();

    createAuditLog({
      action: "CREATE",
      module: "COLLECTION",
      description: `Collected ₹${collection.totalAmount.toLocaleString(
        "en-IN",
      )} for Loan ${selectedLoan.finoraLoanId}`,
      performedBy: session?.username ?? "SYSTEM",
      userRole: session?.role ?? "UNKNOWN",
    });

    refreshCollections();
  }

  function removeCollection(id: string) {
    if (!confirm("Delete this collection?")) {
      return;
    }

    deleteCollection(id);

    refreshCollections();
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            color: "var(--text)",
            fontWeight: 900,
          }}
        >
          Collections
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "var(--text-muted)",
          }}
        >
          Record, manage and monitor loan collections.
        </p>
      </div>

      <CollectionDashboard collections={collections} />

      <Card title="Loan Selection" subtitle="Choose an active loan">
        <LoanSelector
          loans={loans}
          selectedLoanId={selectedLoanId}
          onSelect={setSelectedLoanId}
        />
      </Card>

      <CollectionSummary
        loan={selectedLoan}
        collectedAmount={collectedAmount}
      />

      <Card title="New Collection" subtitle="Enter collection details">
        <CollectionForm onSubmit={saveCollection} />
      </Card>

      <Card
        title="Collection History"
        subtitle={`${collections.length} collection${
          collections.length === 1 ? "" : "s"
        } recorded`}
      >
        <CollectionTable
          collections={collections}
          onDelete={removeCollection}
        />
      </Card>
    </div>
  );
}
