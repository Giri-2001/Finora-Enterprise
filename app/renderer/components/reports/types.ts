export type ReportType = "LOAN" | "COLLECTION" | "CUSTOMER";

export type ReportPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

export type LoanReportRow = {
  loanId: string;

  customerId: string;

  customerName: string;

  approvedAmount: number;

  collectedAmount: number;

  outstandingAmount: number;

  status: "Active" | "Closed" | "Pending" | "Default";

  startDate: string;
};

export type CollectionReportRow = {
  receiptNumber: string;

  loanId: string;

  customerId: string;

  customerName: string;

  collectionDate: string;

  amount: number;

  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
};

export type CustomerReportRow = {
  customerId: string;

  customerName: string;

  phone: string;

  totalLoans: number;

  totalBorrowed: number;

  totalPaid: number;

  outstandingAmount: number;

  status: "Active" | "Inactive";
};

export type ReportSummary = {
  totalRecords: number;

  totalAmount: number;

  generatedAt: string;
};
