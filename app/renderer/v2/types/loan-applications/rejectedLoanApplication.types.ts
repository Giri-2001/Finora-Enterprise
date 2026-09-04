// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN APPLICATION TYPES
//
// RESPONSIBILITY:
//
// - Define the permanent rejected Loan Application contract.
// - Preserve the complete Loan Studio snapshot for reopening.
// - Preserve rejection and reopen audit history.
// - Keep rejected applications separate from approved Loans.
// - Keep the contract storage-implementation agnostic.
//
// IMPORTANT:
//
// - A rejected application is NOT a persisted Loan master record.
// - Reopening never reuses a finalized Loan number.
// - Snapshot payload must remain JSON serializable.
// - Document binary content is persisted separately.
// ============================================================

export type LoanApplicationMode =
  | "STANDARD"
  | "GOLD";

export type LoanApplicationStep =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

export type RejectedLoanApplicationStatus =
  | "REJECTED"
  | "REOPENED";

export interface LoanApplicationSnapshot {
  version: 1;

  mode: LoanApplicationMode;

  step: LoanApplicationStep;

  savedAt: string;

  payload: Record<string, unknown>;
}

export interface RejectedLoanApplication {
  version: 1;

  id: string;

  applicationReference: string;

  status: RejectedLoanApplicationStatus;

  mode: LoanApplicationMode;

  ownerId: string;

  businessId: string;

  branchId: string;

  dataContext: string;

  demoId?: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  requestedAmount: number;

  rejectionReason: string;

  rejectedAt: string;

  rejectedBy: string;

  snapshot: LoanApplicationSnapshot;

  documentIds: string[];

  reopenCount: number;

  reopenedAt?: string;

  reopenedBy?: string;

  createdAt: string;

  updatedAt: string;
}

// ============================================================
// END
// ============================================================
