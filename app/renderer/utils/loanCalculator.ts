import type {
  CollectionType,
  InterestType,
} from "../components/loans/types";

export type LoanCalculationInput = {
  approvedLoanAmount: number;
  deductionAmount: number;
  interestType: InterestType;
  interestValue: number;
  collectionType: CollectionType;
  duration: number;
};

export type LoanCalculationResult = {
  receivedAmount: number;
  totalInterest: number;
  totalPayable: number;
  collectionAmount: number;
  installmentCount: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateInterest(
  principal: number,
  type: InterestType,
  value: number,
): number {
  switch (type) {
    case "Percentage":
      return (principal * value) / 100;

    case "Rupees":
      return principal * value;

    case "Paisa":
      return principal * (value / 100);

    case "Fixed":
      return value;

    default:
      return 0;
  }
}

function getInstallmentCount(
  collectionType: CollectionType,
  duration: number,
): number {
  const safeDuration = Math.max(duration, 1);

  switch (collectionType) {
    case "Daily":
    case "Weekly":
    case "Monthly":
      return safeDuration;

    default:
      return safeDuration;
  }
}

export function calculateLoan(
  input: LoanCalculationInput,
): LoanCalculationResult {
  const principal = Math.max(
    input.approvedLoanAmount,
    0,
  );

  const deduction = Math.max(
    input.deductionAmount,
    0,
  );

  const receivedAmount = Math.max(
    principal - deduction,
    0,
  );

  const totalInterest = calculateInterest(
    principal,
    input.interestType,
    input.interestValue,
  );

  const totalPayable =
    principal + totalInterest;

  const installmentCount =
    getInstallmentCount(
      input.collectionType,
      input.duration,
    );

  const collectionAmount =
    totalPayable / installmentCount;

  return {
    receivedAmount: round(receivedAmount),
    totalInterest: round(totalInterest),
    totalPayable: round(totalPayable),
    collectionAmount: round(collectionAmount),
    installmentCount,
  };
}
