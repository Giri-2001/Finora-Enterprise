import type {
  CollectionType,
  PaymentMode,
} from "../components/collections/types";

export type CollectionValidationData = {
  loanId: string;

  customerId: string;

  collectionDate: string;

  collectionType: CollectionType;

  amount: number;

  paymentMode: PaymentMode;
};

export function validateCollectionDate(
  date: string,
  today: string,
): string | null {
  if (!date) {
    return "Collection date is required.";
  }

  if (date > today) {
    return "Collection date cannot be future date.";
  }

  return null;
}

export function validateAmount(amount: number): string | null {
  if (amount <= 0) {
    return "Collection amount must be greater than zero.";
  }

  return null;
}

export function validateLoan(loanId: string): string | null {
  if (!loanId) {
    return "Loan selection is required.";
  }

  return null;
}

export function validateCustomer(customerId: string): string | null {
  if (!customerId) {
    return "Customer selection is required.";
  }

  return null;
}

export function validateCollectionForm(
  data: CollectionValidationData,
  today: string,
): string | null {
  return (
    validateLoan(data.loanId) ??
    validateCustomer(data.customerId) ??
    validateAmount(data.amount) ??
    validateCollectionDate(data.collectionDate, today)
  );
}
