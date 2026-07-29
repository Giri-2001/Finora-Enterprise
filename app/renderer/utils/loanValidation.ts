import type { CollectionType, InterestType } from "../components/loans/types";

export type LoanValidationData = {
  customerId: string;

  approvedLoanAmount: number;
  receivedAmount: number;
  deductionAmount: number;

  interestType: InterestType;
  interestValue: number;

  collectionType: CollectionType;
  duration: number;

  collectionAmount: number;

  startDate: string;
};

export function validateLoanDate(
  startDate: string,
  today: string,
): string | null {
  if (!startDate) {
    return "Loan date is required.";
  }

  if (startDate > today) {
    return "Loan date cannot be in the future.";
  }

  return null;
}

export function validateLoanAmount(amount: number): string | null {
  if (amount <= 0) {
    return "Approved loan amount must be greater than zero.";
  }

  return null;
}

export function validateDeduction(
  approvedAmount: number,
  deduction: number,
): string | null {
  if (deduction < 0) {
    return "Deduction cannot be negative.";
  }

  if (deduction > approvedAmount) {
    return "Deduction cannot exceed the approved loan amount.";
  }

  return null;
}

export function validateDuration(duration: number): string | null {
  if (duration <= 0) {
    return "Enter a valid loan duration.";
  }

  return null;
}

export function validateInterest(value: number): string | null {
  if (value < 0) {
    return "Interest cannot be negative.";
  }

  return null;
}

export function validateCollectionAmount(amount: number): string | null {
  if (amount <= 0) {
    return "Collection amount must be greater than zero.";
  }

  return null;
}

export function validateLoanForm(
  data: LoanValidationData,
  today: string,
): string | null {
  if (!data.customerId) {
    return "Please select a customer.";
  }

  return (
    validateLoanAmount(data.approvedLoanAmount) ??
    validateDeduction(data.approvedLoanAmount, data.deductionAmount) ??
    validateDuration(data.duration) ??
    validateInterest(data.interestValue) ??
    validateCollectionAmount(data.collectionAmount) ??
    validateLoanDate(data.startDate, today)
  );
}
