import { useState } from "react";

import Card from "../../components/ui/Card";

import PaymentForm from "../../components/payments/PaymentForm";
import PaymentTable from "../../components/payments/PaymentTable";

import type { Payment } from "../../components/payments/types";

import {
  addPayment,
  deletePayment,
  getPayments,
} from "../../store/paymentStore";

import { getSession } from "../../store/authStore";

import { createAuditLog } from "../../store/auditStore";

import { calculatePayment } from "../../utils/paymentCalculator";

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>(getPayments());

  function refresh() {
    setPayments(getPayments());
  }

  function savePayment(data: {
    loanId: string;

    customerId: string;

    paymentDate: string;

    paymentType: "REGULAR" | "ADVANCE" | "EARLY_CLOSURE";

    amount: number;

    paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

    remarks: string;
  }) {
    const calculation = calculatePayment({
      previousBalance: data.amount,

      paymentAmount: data.amount,
    });

    const now = new Date().toISOString();

    const newPayment: Payment = {
      id: Date.now().toString(),

      paymentNumber: `PAY-${String(payments.length + 1).padStart(5, "0")}`,

      loanId: data.loanId,

      customerId: data.customerId,

      paymentDate: data.paymentDate,

      paymentType: data.paymentType,

      amount: data.amount,

      paymentMode: data.paymentMode,

      previousBalance: data.amount,

      remainingBalance: calculation.remainingBalance,

      remarks: data.remarks,

      collectedBy: "Admin",

      status: "COMPLETED",

      createdAt: now,

      updatedAt: now,
    };

    addPayment(newPayment);

    const session = getSession();

    createAuditLog({
      action: "CREATE",

      module: "PAYMENT",

      description: `Payment ₹${data.amount.toLocaleString(
        "en-IN",
      )} received for Loan ${data.loanId}`,

      performedBy: session?.username ?? "SYSTEM",

      userRole: session?.role ?? "UNKNOWN",
    });

    refresh();
  }

  function removePayment(id: string) {
    deletePayment(id);

    refresh();
  }

  const totalAmount = payments.reduce(
    (sum, item) => sum + item.amount,

    0,
  );

  return (
    <div>
      <h1>Payment Management</h1>

      <p>Manage regular payments, advance payments and early closures.</p>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

          gap: 16,

          marginBottom: 20,
        }}
      >
        <Card title="Total Payments">
          <h2>{payments.length}</h2>
        </Card>

        <Card title="Total Amount">
          <h2>₹{totalAmount.toLocaleString("en-IN")}</h2>
        </Card>
      </div>

      <Card title="New Payment Entry">
        <PaymentForm onSubmit={savePayment} />
      </Card>

      <Card title="Payment History">
        <PaymentTable payments={payments} onDelete={removePayment} />
      </Card>
    </div>
  );
}
