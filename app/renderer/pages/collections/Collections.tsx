import { useState } from "react";

import CollectionForm from "../../components/collections/CollectionForm";
import CollectionTable from "../../components/collections/CollectionTable";

import type { Collection } from "../../components/collections/types";

import Card from "../../components/ui/Card";

import {
  addCollection,
  deleteCollection,
  getCollections,
} from "../../store/collectionStore";

export default function Collections() {
  const [collections, setCollections] =
    useState<Collection[]>(getCollections());

  function refresh() {
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
    const now = new Date().toISOString();

    const newCollection: Collection = {
      id: Date.now().toString(),

      loanId: data.loanId,

      customerId: data.customerId,

      receiptNumber: `RCPT-${String(collections.length + 1).padStart(5, "0")}`,

      collectionDate: data.collectionDate,

      collectionType: data.collectionType,

      interestAmount: data.interestAmount,

      principalAmount: data.principalAmount,

      penaltyAmount: data.penaltyAmount,

      totalAmount: data.totalAmount,

      paymentMode: data.paymentMode,

      remarks: data.remarks,

      collectedBy: "Admin",

      status: "COMPLETED",

      createdAt: now,

      updatedAt: now,
    };

    addCollection(newCollection);

    refresh();
  }

  function removeCollection(id: string) {
    deleteCollection(id);

    refresh();
  }

  const totalCollection = collections.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );

  return (
    <div>
      <h1>Collections</h1>

      <p>Manage daily, weekly and monthly loan collections.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginTop: 20,
        }}
      >
        <Card title="Total Collections">
          <h2>{collections.length}</h2>
        </Card>

        <Card title="Collected Amount">
          <h2>₹{totalCollection.toLocaleString("en-IN")}</h2>
        </Card>
      </div>

      <Card title="New Collection Entry">
        <CollectionForm onSubmit={saveCollection} />
      </Card>

      <Card title="Collection History">
        <CollectionTable
          collections={collections}
          onDelete={removeCollection}
        />
      </Card>
    </div>
  );
}
