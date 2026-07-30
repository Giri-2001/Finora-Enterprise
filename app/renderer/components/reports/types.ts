export type ReportType =
  | "LOAN"
  | "COLLECTION"
  | "PAYMENT"
  | "CUSTOMER"
  | "GOLD"
  | "LOCKER";

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

export type PaymentReportRow = {
  paymentId: string;

  loanId: string;

  customerId: string;

  amount: number;

  paymentType: string;

  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

  paymentDate: string;
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

export type GoldReportRow = {
  loanId: string;

  customerId: string;

  lockerNumber: string;

  bagNumber: string;

  ornamentCount: number;

  status: "ACTIVE" | "RELEASED";
};

export type LockerReportRow = {
  lockerNumber: string;

  status: "AVAILABLE" | "OCCUPIED";

  loanId?: string;

  bagNumber?: string;
};

export type ReportSummary = {
  totalRecords: number;

  totalAmount: number;

  generatedAt: string;
};
