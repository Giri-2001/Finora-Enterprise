export type LoanStatus = "Active" | "Closed" | "Pending" | "Default";

export type InterestType = "Percentage" | "Rupees" | "Paisa" | "Fixed";

export type CollectionType = "Daily" | "Weekly" | "Monthly";

export type Loan = {
  id: number;

  // FINORA Generated Loan ID
  finoraLoanId: string;

  // Owner Existing Loan Number
  oldLoanNumber: string;

  // Linked Customer
  customerId: string;

  // Financial Details

  approvedLoanAmount: number;

  receivedAmount: number;

  deductionAmount: number;

  discountAmount: number;

  // Interest Details

  interestType: InterestType;

  interestValue: number;

  // Collection Details

  collectionType: CollectionType;

  duration: number;

  calculatedCollectionAmount: number;

  collectionAmount: number;

  // Payment Tracking

  totalCollectedAmount: number;

  outstandingAmount: number;

  lastCollectionDate: string | null;

  // Gold Loan Linking

  lockerNumber: string;

  bagNumber: string;

  // Dates

  startDate: string;

  closedDate: string | null;

  createdAt: string;

  updatedAt: string;

  // Status

  status: LoanStatus;

  // Notes

  remarks: string;
};
