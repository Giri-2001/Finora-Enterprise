/* ===========================================================
FINORA ENTERPRISE OS™

CUSTOMER ID CARD BACK™

TYPES
=========================================================== */

export interface CustomerIdCardBackProps {
  customerId: string;

  fatherName?: string;

  village?: string;

  mandal?: string;

  district?: string;

  customerSince?: string;

  totalLoans?: number;

  activeLoans?: number;

  closedLoans?: number;

  outstandingAmount?: number;
}
