/* ===========================================================
   FINORA ENTERPRISE OS™
   PAYMENT SCHEDULE ENGINE™

   FILE:
   app/renderer/v2/components/loans/schedule/schedule.helpers.ts

   RESPONSIBILITY:
   - Generate whole-rupee repayment schedules.
   - Support Fixed EMI.
   - Support Reducing EMI.
   - Support Interest Only.
   - Apply Advance Deduction only to the final customer payment
     for Fixed EMI and Interest Only.
   - Reducing EMI does NOT use Advance Deduction.
   - Keep principal + interest + deduction mathematically consistent.

   FINORA BUSINESS RULES
   -------------------------------------------------------------
   1. INTEREST ONLY
      Monthly interest = Principal × monthly interest rate.
      Regular installments collect interest only.
      Final installment = Principal + final-period interest
                           - Advance Deduction.

      Example:
        Principal          ₹10,000
        Rate               2% monthly
        Duration           6 months
        Interest/month     ₹200
        Advance Deduction  ₹100

        EMI 1-5            ₹200 each
        EMI 6              ₹10,100
        Customer payments  ₹11,100
        Advance retained   ₹100
        Total loan return  ₹11,200

   2. FIXED EMI
      Total payable = Principal + flat total interest.
      The total scheduled amount before advance deduction must
      equal Principal + Interest.
      Advance Deduction is taken only from the final customer
      installment.

   3. REDUCING EMI
      Advance Deduction is ignored and must be disabled in UI.
      Principal is repaid in equal whole-rupee principal portions.
      Interest is calculated on the outstanding principal before
      each installment.
      Therefore both interest and installment amount reduce.

      Example:
        ₹10,000 / 6 months / 2%
        Principal portions: ₹1,667, ₹1,667, ₹1,667,
                            ₹1,667, ₹1,666, ₹1,666
        Interest:           ₹200, ₹167, ₹133,
                            ₹100, ₹67, ₹33
        Installments:       ₹1,867, ₹1,834, ₹1,800,
                            ₹1,767, ₹1,733, ₹1,699
        Total collection:   ₹10,700

   IMPORTANT:
   - No repository access.
   - No persistence.
   - No UI responsibility.
   - Existing callers using the original arguments remain valid.
=========================================================== */

import type {
  LoanInstallment,
} from "./types";

/* ===========================================================
   REPAYMENT OPTIONS
=========================================================== */

export type ScheduleRepaymentMode =
  | "fixed"
  | "reducing"
  | "interestOnly";

/* ===========================================================
   BUILD EMPTY SCHEDULE
=========================================================== */

export function buildEmptySchedule(): LoanInstallment[] {
  return [];
}

/* ===========================================================
   GENERATE SCHEDULE
=========================================================== */

export function generateSchedule(
  installments: number,
  startDate: Date,
  frequency:
    | "daily"
    | "weekly"
    | "monthly",
  totalPayable: number,
  totalInterest: number,
  repaymentMode: ScheduleRepaymentMode = "fixed",
  advanceDeduction: number = 0,
  principalAmount: number = 0,
  monthlyInterestRate: number = 0,
): LoanInstallment[] {

  /* =========================================================
     NORMALIZE CORE VALUES
  ========================================================= */

  const safeInstallments = Math.max(
    0,
    Math.round(Number(installments) || 0),
  );

  if (safeInstallments === 0) {
    return [];
  }

  const roundedTotalPayable = Math.max(
    0,
    Math.round(Number(totalPayable) || 0),
  );

  const roundedTotalInterest = Math.max(
    0,
    Math.round(Number(totalInterest) || 0),
  );

  const passedPrincipal = Math.max(
    0,
    Math.round(Number(principalAmount) || 0),
  );

  const derivedPrincipal = Math.max(
    0,
    roundedTotalPayable - roundedTotalInterest,
  );

  const safePrincipal =
    passedPrincipal > 0
      ? passedPrincipal
      : derivedPrincipal;

  /*
   * Advance is a disbursement-time deduction.
   *
   * REDUCING EMI deliberately ignores it at the engine level.
   * This protects the calculation even if an older caller still
   * sends a non-zero advance value.
   */
  const requestedAdvanceDeduction = Math.max(
    0,
    Math.round(Number(advanceDeduction) || 0),
  );

  const effectiveAdvanceDeduction =
    repaymentMode === "reducing"
      ? 0
      : Math.min(
          safePrincipal,
          requestedAdvanceDeduction,
        );

  /* =========================================================
     DUE DATE HELPER
  ========================================================= */

  function getDueDate(index: number): Date {
    const dueDate = new Date(startDate);

    switch (frequency) {
      case "daily":
        dueDate.setDate(
          dueDate.getDate() + index + 1,
        );
        break;

      case "weekly":
        dueDate.setDate(
          dueDate.getDate() + (index + 1) * 7,
        );
        break;

      case "monthly":
        dueDate.setMonth(
          dueDate.getMonth() + index + 1,
        );
        break;
    }

    return dueDate;
  }

  /* =========================================================
     INTEREST ONLY
  =========================================================
     Final installment includes the final month's interest.

     This matches the FINORA rule:
       principal + final-period interest - advance.
  ========================================================= */

  if (repaymentMode === "interestOnly") {
    const regularInterest = Math.floor(
      roundedTotalInterest / safeInstallments,
    );

    return Array.from(
      {
        length: safeInstallments,
      },
      (_, index): LoanInstallment => {
        const isFinalInstallment =
          index === safeInstallments - 1;

        const interestAlreadyAllocated =
          regularInterest * index;

        const interestAmount =
          isFinalInstallment
            ? Math.max(
                0,
                roundedTotalInterest -
                  interestAlreadyAllocated,
              )
            : regularInterest;

        const finalPrincipalPayable =
          isFinalInstallment
            ? Math.max(
                0,
                safePrincipal -
                  effectiveAdvanceDeduction,
              )
            : 0;

        const installmentAmount =
          isFinalInstallment
            ? finalPrincipalPayable + interestAmount
            : interestAmount;

        return {
          installmentNumber: index + 1,
          dueDate: getDueDate(index).toISOString(),
          installmentAmount,
          principalAmount:
            isFinalInstallment
              ? finalPrincipalPayable
              : 0,
          interestAmount,
          outstandingBalance:
            isFinalInstallment
              ? 0
              : safePrincipal,
          paidAmount: 0,
          penaltyAmount: 0,
          receiptNumber: "",
          paidDate: "",
          status: "Pending",
        };
      },
    );
  }

  /* =========================================================
     REDUCING EMI
  =========================================================
     FINORA declining-installment model:

     - Advance Deduction = 0.
     - Principal is split across installments.
     - Interest is charged on opening outstanding principal.
     - Interest therefore falls as principal falls.
     - Installment = principal portion + current interest.
     - Final principal portion absorbs any rounding remainder.

     IMPORTANT:
     This is a declining-installment / equal-principal model.
     It is intentionally different from a standard fixed-payment
     bank amortization EMI, where the EMI stays constant and only
     the interest component declines.
  ========================================================= */

  if (repaymentMode === "reducing") {
    const passedMonthlyRate = Math.max(
      0,
      Number(monthlyInterestRate) || 0,
    );

    /*
     * Legacy fallback:
     * if the caller does not send the entered rate, recover it
     * from the existing flat-interest baseline.
     */
    let safeMonthlyRate = passedMonthlyRate;

    if (
      safeMonthlyRate === 0 &&
      safePrincipal > 0 &&
      roundedTotalInterest > 0
    ) {
      const estimatedMonthlyPeriods =
        frequency === "daily"
          ? safeInstallments / 30
          : frequency === "weekly"
            ? safeInstallments * 7 / 30
            : safeInstallments;

      if (estimatedMonthlyPeriods > 0) {
        safeMonthlyRate =
          (
            roundedTotalInterest /
            (safePrincipal * estimatedMonthlyPeriods)
          ) * 100;
      }
    }

    const periodicRate =
      frequency === "daily"
        ? safeMonthlyRate / 30
        : frequency === "weekly"
          ? safeMonthlyRate * 7 / 30
          : safeMonthlyRate;

    const periodicRateDecimal =
      periodicRate / 100;

    /*
     * Equal principal distribution with exact total principal.
     *
     * Example:
     * 10,000 / 6
     * base = 1,666
     * remainder = 4
     *
     * Rows 1-4 = 1,667
     * Rows 5-6 = 1,666
     */
    const basePrincipal = Math.floor(
      safePrincipal / safeInstallments,
    );

    const principalRemainder =
      safePrincipal -
      basePrincipal * safeInstallments;

    const principalComponents = Array.from(
      {
        length: safeInstallments,
      },
      (_, index) =>
        basePrincipal +
        (index < principalRemainder ? 1 : 0),
    );

    let outstandingPrincipal = safePrincipal;

    return principalComponents.map(
      (
        principalComponent,
        index,
      ): LoanInstallment => {
        const isFinalInstallment =
          index === safeInstallments - 1;

        const principalBeforeInstallment =
          outstandingPrincipal;

        /*
         * Interest is always calculated on the opening balance
         * for this period, before principal is repaid.
         */
        const interestAmount = Math.max(
          0,
          Math.round(
            principalBeforeInstallment *
              periodicRateDecimal,
          ),
        );

        const installmentAmount = Math.max(
          0,
          principalComponent + interestAmount,
        );

        outstandingPrincipal = Math.max(
          0,
          principalBeforeInstallment -
            principalComponent,
        );

        return {
          installmentNumber: index + 1,
          dueDate: getDueDate(index).toISOString(),
          installmentAmount,
          principalAmount: principalComponent,
          interestAmount,
          outstandingBalance:
            isFinalInstallment
              ? 0
              : outstandingPrincipal,
          paidAmount: 0,
          penaltyAmount: 0,
          receiptNumber: "",
          paidDate: "",
          status: "Pending",
        };
      },
    );
  }

  /* =========================================================
     FIXED EMI
  =========================================================
     Total payable remains the EMI base.
     Advance deduction is applied only to the final customer
     payment.

     Therefore:
       SUM(customer EMI rows) + Advance Deduction
       = Total Payable
  ========================================================= */

  const scheduledPayable = roundedTotalPayable;

  const regularInstallmentAmount = Math.round(
    scheduledPayable / safeInstallments,
  );

  const regularInterest = Math.floor(
    roundedTotalInterest / safeInstallments,
  );

  return Array.from(
    {
      length: safeInstallments,
    },
    (_, index): LoanInstallment => {
      const isFinalInstallment =
        index === safeInstallments - 1;

      const amountBeforeAdvance =
        isFinalInstallment
          ? Math.max(
              0,
              scheduledPayable -
                regularInstallmentAmount * index,
            )
          : regularInstallmentAmount;

      const installmentAmountForRow = Math.max(
        0,
        amountBeforeAdvance -
          (isFinalInstallment
            ? effectiveAdvanceDeduction
            : 0),
      );

      const interestAlreadyAllocated =
        regularInterest * index;

      const interestAmount =
        isFinalInstallment
          ? Math.max(
              0,
              roundedTotalInterest -
                interestAlreadyAllocated,
            )
          : regularInterest;

      const principalAmount = Math.max(
        0,
        installmentAmountForRow - interestAmount,
      );

      return {
        installmentNumber: index + 1,
        dueDate: getDueDate(index).toISOString(),
        installmentAmount:
          installmentAmountForRow,
        principalAmount,
        interestAmount,
        outstandingBalance:
          isFinalInstallment
            ? 0
            : Math.max(
                0,
                scheduledPayable -
                  regularInstallmentAmount *
                    (index + 1),
              ),
        paidAmount: 0,
        penaltyAmount: 0,
        receiptNumber: "",
        paidDate: "",
        status: "Pending",
      };
    },
  );
}

/* ===========================================================
   END
=========================================================== */
