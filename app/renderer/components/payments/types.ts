export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

export type PaymentStatus = "COMPLETED" | "PENDING" | "CANCELLED";

export type PaymentType = "REGULAR" | "ADVANCE" | "EARLY_CLOSURE";

export interface Payment {
  id: string;

  paymentNumber: string;

  loanId: string;

  customerId: string;

  paymentDate: string;

  paymentType: PaymentType;

  amount: number;

  paymentMode: PaymentMode;

  previousBalance: number;

  remainingBalance: number;

  remarks?: string;

  collectedBy: string;

  status: PaymentStatus;

  createdAt: string;

  updatedAt: string;
}

export interface PaymentSummary {
  totalPayments: number;

  totalAmount: number;

  advancePayments: number;

  earlyClosures: number;
}
