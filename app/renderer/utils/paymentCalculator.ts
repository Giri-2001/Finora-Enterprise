export type PaymentCalculationInput = {
  previousBalance: number;

  paymentAmount: number;
};

export type PaymentCalculationResult = {
  paidAmount: number;

  remainingBalance: number;

  isClosed: boolean;

  isAdvance: boolean;
};

function round(value: number): number {
  return Number(value.toFixed(2));
}

export function calculatePayment(
  input: PaymentCalculationInput,
): PaymentCalculationResult {
  const paymentAmount = Math.max(input.paymentAmount, 0);

  const previousBalance = Math.max(input.previousBalance, 0);

  const remainingBalance = Math.max(previousBalance - paymentAmount, 0);

  const isClosed = remainingBalance === 0 && paymentAmount > 0;

  const isAdvance = paymentAmount > previousBalance;

  return {
    paidAmount: round(paymentAmount),

    remainingBalance: round(remainingBalance),

    isClosed,

    isAdvance,
  };
}
