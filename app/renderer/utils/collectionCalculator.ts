import type { CollectionType } from "../components/collections/types";

export type CollectionCalculationInput = {
  loanAmount: number;

  interestRate: number;

  pendingInterest: number;

  pendingPrincipal: number;

  collectionType: CollectionType;

  collectionAmount: number;
};

export type CollectionCalculationResult = {
  interestPaid: number;

  principalPaid: number;

  penaltyAmount: number;

  totalPaid: number;

  remainingInterest: number;

  remainingPrincipal: number;
};

function round(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateCollection(
  input: CollectionCalculationInput,
): CollectionCalculationResult {
  let interestPaid = 0;

  let principalPaid = 0;

  const penaltyAmount = 0;

  const payment = Math.max(input.collectionAmount, 0);

  switch (input.collectionType) {
    case "INTEREST":
      interestPaid = Math.min(payment, input.pendingInterest);
      break;

    case "PRINCIPAL":
      principalPaid = Math.min(payment, input.pendingPrincipal);
      break;

    case "BOTH":
      interestPaid = Math.min(payment, input.pendingInterest);

      principalPaid = Math.min(payment - interestPaid, input.pendingPrincipal);
      break;

    case "PENALTY":
      break;
  }

  const totalPaid = interestPaid + principalPaid + penaltyAmount;

  return {
    interestPaid: round(interestPaid),

    principalPaid: round(principalPaid),

    penaltyAmount: round(penaltyAmount),

    totalPaid: round(totalPaid),

    remainingInterest: round(Math.max(input.pendingInterest - interestPaid, 0)),

    remainingPrincipal: round(
      Math.max(input.pendingPrincipal - principalPaid, 0),
    ),
  };
}
