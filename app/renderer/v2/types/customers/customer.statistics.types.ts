/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER STATISTICS TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : Statistics
   Version : 2.0
   Status  : Production
=========================================================== */

/* ===========================================================
   CUSTOMER SCORE
=========================================================== */

export type CustomerScore = number;

/* ===========================================================
   PROFILE COMPLETION
=========================================================== */

export type ProfileCompletion = number;

/* ===========================================================
   CUSTOMER STATISTICS
=========================================================== */

export interface CustomerStatistics {
  /**
   * Total Loans
   */
  totalLoans: number;

  /**
   * Active Loans
   */
  activeLoans: number;

  /**
   * Closed Loans
   */
  closedLoans: number;

  /**
   * Rejected Loans
   */
  rejectedLoans: number;

  /**
   * Total Borrowed Amount
   */
  totalBorrowedAmount: number;

  /**
   * Total Interest Paid
   */
  totalInterestPaid: number;

  /**
   * Total Collections
   */
  totalCollections: number;

  /**
   * Outstanding Amount
   */
  outstandingAmount: number;

  /**
   * Average Payment Delay (Days)
   */
  averagePaymentDelayDays: number;

  /**
   * Largest Loan Amount
   */
  largestLoanAmount: number;

  /**
   * Smallest Loan Amount
   */
  smallestLoanAmount: number;

  /**
   * Last Loan Amount
   */
  lastLoanAmount: number;

  /**
   * Total Gold Weight (Grams)
   */
  totalGoldWeight: number;

  /**
   * Estimated Gold Value
   */
  estimatedGoldValue: number;

  /**
   * Total Documents
   */
  totalDocuments: number;

  /**
   * Timeline Events
   */
  totalTimelineEvents: number;

  /**
   * Profile Completion (%)
   */
  profileCompletion: ProfileCompletion;

  /**
   * Customer Score (0 - 100)
   */
  customerScore: CustomerScore;

  /**
   * Last Activity Date
   */
  lastActivityAt?: string;
}
