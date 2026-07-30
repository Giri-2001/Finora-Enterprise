import type { Loan } from "../components/loans/types";

const STORAGE_KEY = "finora_loans";

function safeNumber(value?: number | null): number {
  return Number.isFinite(value) ? value ?? 0 : 0;
}

function loadLoans(): Loan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((loan) => ({
      ...loan,

      id: Number.isFinite(loan.id) ? loan.id : Date.now(),

      approvedLoanAmount: safeNumber(loan.approvedLoanAmount),

      receivedAmount: safeNumber(loan.receivedAmount),

      deductionAmount: safeNumber(loan.deductionAmount),

      discountAmount: safeNumber(loan.discountAmount),

      totalCollectedAmount: safeNumber(loan.totalCollectedAmount),

      outstandingAmount: safeNumber(loan.outstandingAmount),

      interestValue: safeNumber(loan.interestValue),

      duration: safeNumber(loan.duration),
    }));
  } catch {
    return [];
  }
}

function saveLoans(loans: Loan[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
}

let loans: Loan[] = loadLoans();

export function getLoans(): Loan[] {
  return [...loans];
}

export function getLoanById(id: number): Loan | undefined {
  return loans.find((loan) => loan.id === id);
}

export function getLoanByFinoraId(finoraLoanId: string): Loan | undefined {
  return loans.find((loan) => loan.finoraLoanId === finoraLoanId);
}

export function getCustomerLoans(customerId: string): Loan[] {
  return loans.filter((loan) => loan.customerId === customerId);
}

export function generateFinoraLoanId(): string {
  const maxNumber = loans.reduce(
    (max, loan) => {
      const number = Number(loan.finoraLoanId?.replace("FINORA-", ""));

      return Number.isFinite(number) && number > max ? number : max;
    },

    0,
  );

  return `FINORA-${String(maxNumber + 1).padStart(4, "0")}`;
}

export function calculateOutstandingAmount(
  loan?: Partial<Loan> | null,
): number {
  const currentLoan = loan ?? {};

  return Math.max(
    safeNumber(currentLoan.approvedLoanAmount) -
      safeNumber(currentLoan.totalCollectedAmount) -
      safeNumber(currentLoan.discountAmount),

    0,
  );
}

export function addLoan(loan: Loan): void {
  const cleanLoan: Loan = {
    ...loan,

    approvedLoanAmount: safeNumber(loan.approvedLoanAmount),

    receivedAmount: safeNumber(loan.receivedAmount),

    deductionAmount: safeNumber(loan.deductionAmount),

    discountAmount: safeNumber(loan.discountAmount),

    totalCollectedAmount: safeNumber(loan.totalCollectedAmount),

    outstandingAmount: calculateOutstandingAmount(loan),
  };

  loans = [...loans, cleanLoan];

  saveLoans(loans);
}

export function updateLoan(updatedLoan: Loan): void {
  loans = loans.map((loan) =>
    loan.id === updatedLoan.id
      ? {
          ...updatedLoan,

          updatedAt: new Date().toISOString(),
        }
      : loan,
  );

  saveLoans(loans);
}

export function closeLoan(loanId: number): void {
  loans = loans.map((loan) => {
    if (loan.id !== loanId) {
      return loan;
    }

    return {
      ...loan,

      status: "Closed",

      outstandingAmount: 0,

      closedDate: new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };
  });

  saveLoans(loans);
}

export function updateLoanAfterCollection(
  loanId: number,

  collectionAmount: number,

  collectionDate: string,
): void {
  loans = loans.map((loan) => {
    if (loan.id !== loanId) {
      return loan;
    }

    const totalCollectedAmount =
      safeNumber(loan.totalCollectedAmount) + safeNumber(collectionAmount);

    const outstandingAmount = Math.max(
      safeNumber(loan.approvedLoanAmount) -
        totalCollectedAmount -
        safeNumber(loan.discountAmount),

      0,
    );

    return {
      ...loan,

      totalCollectedAmount,

      outstandingAmount,

      lastCollectionDate: collectionDate,

      status: outstandingAmount === 0 ? "Closed" : "Active",

      updatedAt: new Date().toISOString(),
    };
  });

  saveLoans(loans);
}

export function deleteLoan(id: number): void {
  loans = loans.filter((loan) => loan.id !== id);

  saveLoans(loans);
}

export function replaceLoans(updatedLoans: Loan[]): void {
  loans = updatedLoans.map((loan) => ({
    ...loan,

    approvedLoanAmount: safeNumber(loan.approvedLoanAmount),

    outstandingAmount: safeNumber(loan.outstandingAmount),
  }));

  saveLoans(loans);
}

export function clearLoans(): void {
  loans = [];

  saveLoans(loans);
}

export function getActiveLoans(): Loan[] {
  return loans.filter((loan) => loan.status === "Active");
}

export function getClosedLoans(): Loan[] {
  return loans.filter((loan) => loan.status === "Closed");
}

export function getPendingLoans(): Loan[] {
  return loans.filter((loan) => loan.status === "Pending");
}

export function getDefaultLoans(): Loan[] {
  return loans.filter((loan) => loan.status === "Default");
}

export function getLoanSummary() {
  return {
    total: loans.length,

    active: getActiveLoans().length,

    closed: getClosedLoans().length,

    pending: getPendingLoans().length,

    default: getDefaultLoans().length,
  };
}
