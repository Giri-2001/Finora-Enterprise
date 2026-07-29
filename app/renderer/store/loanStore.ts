import type { Loan } from "../components/loans/types";

const STORAGE_KEY = "finora_loans";

function loadLoans(): Loan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as Loan[];
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

export function addLoan(loan: Loan): void {
  loans = [...loans, loan];

  saveLoans(loans);
}

export function updateLoan(updatedLoan: Loan): void {
  loans = loans.map((loan) =>
    loan.id === updatedLoan.id ? updatedLoan : loan,
  );

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

    const totalCollectedAmount = loan.totalCollectedAmount + collectionAmount;

    const outstandingAmount = Math.max(
      loan.approvedLoanAmount - totalCollectedAmount,
      0,
    );

    return {
      ...loan,

      totalCollectedAmount,

      outstandingAmount,

      lastCollectionDate: collectionDate,

      status: outstandingAmount === 0 ? "Closed" : "Active",
    };
  });

  saveLoans(loans);
}

export function deleteLoan(id: number): void {
  loans = loans.filter((loan) => loan.id !== id);

  saveLoans(loans);
}

export function replaceLoans(updatedLoans: Loan[]): void {
  loans = [...updatedLoans];

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
