/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER INTERNAL TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : H - Internal Information
   Version : 2.0
   Status  : Production
=========================================================== */

import {
  CustomerStatus,
  CustomerRisk,
  CustomerTag,
} from "./customer.enums";

/* ===========================================================
   CUSTOMER RATING
=========================================================== */

export type CustomerRating = 1 | 2 | 3 | 4 | 5;

/* ===========================================================
   CUSTOMER INTERNAL INFORMATION
=========================================================== */

export interface CustomerInternalInformation {
  /**
   * Customer Status
   */
  status: CustomerStatus;

  /**
   * Customer Risk Level
   */
  risk: CustomerRisk;

  /**
   * Customer Tags
   */
  tags: CustomerTag[];

  /**
   * Internal Rating
   * 1 = Lowest
   * 5 = Highest
   */
  rating: CustomerRating;

  /**
   * Assigned Branch ID
   */
  branchId: string;

  /**
   * Assigned Employee ID
   */
  assignedEmployeeId?: string;

  /**
   * Preferred Collection Executive
   */
  preferredCollectorId?: string;

  /**
   * Customer Since
   */
  customerSince: string;

  /**
   * Last Visit Date
   */
  lastVisitAt?: string;

  /**
   * Last Collection Date
   */
  lastCollectionAt?: string;

  /**
   * Last Loan Date
   */
  lastLoanAt?: string;

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
   * Total Collections
   */
  totalCollections: number;

  /**
   * Total Outstanding Amount
   */
  outstandingAmount: number;

  /**
   * Internal Notes
   */
  internalNotes?: string;

  /**
   * Soft Delete Flag
   */
  isDeleted: boolean;

  /**
   * Archive Flag
   */
  isArchived: boolean;
}
