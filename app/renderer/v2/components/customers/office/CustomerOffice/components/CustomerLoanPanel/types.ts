/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

   TYPES
=========================================================== */

import type { OfficeCustomer } from "../../types";

/* ===========================================================
   PROPS
=========================================================== */

export interface CustomerLoanPanelProps {
  customer: OfficeCustomer;
}

/* ===========================================================
   LOAN STATISTICS
=========================================================== */

export interface LoanStatistics {
  runningLoans: number;
  closedLoans: number;
  totalAmount: number;
  outstandingAmount: number;
}
