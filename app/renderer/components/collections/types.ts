export type CollectionType = "INTEREST" | "PRINCIPAL" | "BOTH" | "PENALTY";

export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

export type CollectionStatus = "COMPLETED" | "PENDING" | "CANCELLED";

export interface Collection {
  id: string;

  loanId: string;
  customerId: string;

  receiptNumber: string;

  collectionDate: string;

  collectionType: CollectionType;

  interestAmount: number;
  principalAmount: number;
  penaltyAmount: number;

  totalAmount: number;

  paymentMode: PaymentMode;

  remarks?: string;

  collectedBy: string;

  status: CollectionStatus;

  createdAt: string;
  updatedAt: string;
}

export interface CollectionSummary {
  totalCollections: number;

  totalInterest: number;

  totalPrincipal: number;

  totalPenalty: number;

  totalAmount: number;
}

export interface DailyCollectionSummary extends CollectionSummary {
  collectionDate: string;
}

export interface LoanCollectionSummary {
  loanId: string;

  customerId: string;

  totalCollected: number;

  principalCollected: number;

  interestCollected: number;

  penaltyCollected: number;

  balanceAmount: number;

  lastCollectionDate?: string;
}
