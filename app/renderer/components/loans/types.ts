export type LoanStatus = "Active" | "Closed" | "Pending" | "Default";

export type InterestType = "Percentage" | "Rupees" | "Paisa" | "Fixed";

export type CollectionType = "Daily" | "Weekly" | "Monthly";

export type Loan = {
  id: number;

  // FINORA Generated Loan ID
  // Example: 001, 002, 003
  finoraLoanId: string;

  // Existing Owner Loan Number
  oldLoanNumber: string;

  // Linked Customer
  customerId: string;

  // Loan Financial Details
  approvedLoanAmount: number;
  receivedAmount: number;
  deductionAmount: number;

  // Interest
  interestType: InterestType;
  interestValue: number;

  // Collection
  collectionType: CollectionType;
  duration: number;

  // Auto Calculated Amount
  calculatedCollectionAmount: number;

  // Owner Editable Amount
  collectionAmount: number;

  // Gold Loan (Future Ready)
  lockerNumber: string;
  bagNumber: string;

  // Dates
  startDate: string;

  // Status
  status: LoanStatus;
};
