import { useEffect, useMemo } from "react";

import {
  calculateLoan,
  type LoanCalculationResult,
} from "../utils/loanCalculator";

import type { CollectionType, InterestType } from "../components/loans/types";

type UseLoanCalculatorProps = {
  approvedLoanAmount: string;
  deductionAmount: string;
  interestType: InterestType;
  interestValue: string;
  collectionType: CollectionType;
  duration: string;

  setReceivedAmount: (value: string) => void;
  setCollectionAmount: (value: string) => void;
};

function toNumber(value: string): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

export function useLoanCalculator({
  approvedLoanAmount,
  deductionAmount,
  interestType,
  interestValue,
  collectionType,
  duration,
  setReceivedAmount,
  setCollectionAmount,
}: UseLoanCalculatorProps): LoanCalculationResult {
  const calculation = useMemo(
    () =>
      calculateLoan({
        approvedLoanAmount: toNumber(approvedLoanAmount),
        deductionAmount: toNumber(deductionAmount),
        interestType,
        interestValue: toNumber(interestValue),
        collectionType,
        duration: toNumber(duration),
      }),
    [
      approvedLoanAmount,
      deductionAmount,
      interestType,
      interestValue,
      collectionType,
      duration,
    ],
  );

  useEffect(() => {
    setReceivedAmount(calculation.receivedAmount.toFixed(2));

    setCollectionAmount(calculation.collectionAmount.toFixed(2));
  }, [
    calculation.receivedAmount,
    calculation.collectionAmount,
    setReceivedAmount,
    setCollectionAmount,
  ]);

  return calculation;
}
