/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

   HELPERS
=========================================================== */

import type { OfficeCustomer } from "../../types";

import type { LoanStatistics } from "./types";

/* ===========================================================
   CUSTOMER LOANS
=========================================================== */

export function getCustomerLoans(customer: OfficeCustomer) {
  return customer.loans ?? [];
}

/* ===========================================================
   BUILD LOAN STATISTICS
=========================================================== */

export function buildLoanStatistics(
  customer: OfficeCustomer,
): LoanStatistics {
  const loans = getCustomerLoans(customer);

  const statistics: LoanStatistics = {
    runningLoans: 0,
    closedLoans: 0,
    totalAmount: 0,
    outstandingAmount: 0,
  };

  for (const loan of loans) {
    if (
      loan.status === "ACTIVE" ||
      loan.status === "RUNNING"
    ) {
      statistics.runningLoans++;
    }

    if (loan.status === "CLOSED") {
      statistics.closedLoans++;
    }

    statistics.totalAmount += loan.amount;
    statistics.outstandingAmount += loan.outstanding;
  }

  return statistics;
}
