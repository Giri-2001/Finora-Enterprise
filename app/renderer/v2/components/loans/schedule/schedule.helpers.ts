/* ===========================================================
   FINORA ENTERPRISE OS™
   PAYMENT SCHEDULE ENGINE™

   HELPERS

   RESPONSIBILITY:
   - Generate whole-rupee repayment schedules
   - Support Fixed EMI
   - Support Reducing EMI
   - Support Interest Only repayment mode
   - Apply Advance Deduction ONLY to the final installment
   - Keep schedule values mathematically consistent

   REDUCING EMI BUSINESS RULE:
   - Principal is divided across the planned installments.
   - Interest is calculated on the outstanding principal before
     each installment.
   - Therefore installment amounts naturally reduce as the
     outstanding principal reduces.
   - Monthly interest rate is the FINORA input basis.
   - Daily rate = monthly rate / 30.
   - Weekly rate = monthly rate / 4.33.
   - Monthly rate = entered monthly rate.

   IMPORTANT:
   - No repository access
   - No persistence
   - No UI responsibility
   - Existing callers using the original arguments remain valid.
   - Reducing EMI also accepts legacy/missing calculation inputs
     safely so the schedule never silently becomes ₹0.
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

export function buildEmptySchedule():
  LoanInstallment[] {

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

  repaymentMode:
    ScheduleRepaymentMode = "fixed",

  advanceDeduction: number = 0,

  principalAmount: number = 0,

  monthlyInterestRate: number = 0,

): LoanInstallment[] {

  /* =========================================================
     NORMALIZE CORE VALUES
  ========================================================= */

  const safeInstallments =
    Math.max(
      0,
      Math.round(
        installments,
      ),
    );

  if (
    safeInstallments === 0
  ) {
    return [];
  }

  const roundedTotalPayable =
    Math.max(
      0,
      Math.round(
        Number(
          totalPayable,
        ) || 0,
      ),
    );

  const roundedTotalInterest =
    Math.max(
      0,
      Math.round(
        Number(
          totalInterest,
        ) || 0,
      ),
    );

  const roundedAdvanceDeduction =
    Math.min(
      roundedTotalPayable,
      Math.max(
        0,
        Math.round(
          Number(
            advanceDeduction,
          ) || 0,
        ),
      ),
    );

  /* =========================================================
     DUE DATE HELPER
  ========================================================= */

  function getDueDate(
    index: number,
  ): Date {

    const dueDate =
      new Date(
        startDate,
      );

    switch (
      frequency
    ) {

      case "daily":

        dueDate.setDate(
          dueDate.getDate() +
          (index + 1),
        );

        break;

      case "weekly":

        dueDate.setDate(
          dueDate.getDate() +
          (
            (index + 1) *
            7
          ),
        );

        break;

      case "monthly":

        dueDate.setMonth(
          dueDate.getMonth() +
          (index + 1),
        );

        break;
    }

    return dueDate;
  }

  /* =========================================================
     INTEREST ONLY

     Rules:
     - Interest is collected during regular installments.
     - Principal remains outstanding until the final installment.
     - Advance Deduction reduces only the final principal amount.
  ========================================================= */

  if (
    repaymentMode === "interestOnly"
  ) {

    const regularInterest =
      Math.floor(
        roundedTotalInterest /
        safeInstallments,
      );

    const principalAmountBeforeAdvance =
      Math.max(
        0,
        roundedTotalPayable -
        roundedTotalInterest,
      );

    return Array.from(

      {
        length:
          safeInstallments,
      },

      (_, index):
        LoanInstallment => {

        const isFinalInstallment =
          index ===
          safeInstallments - 1;

        const interestAlreadyAllocated =
          regularInterest *
          index;

        const interestAmount =
          isFinalInstallment
            ? Math.max(
                0,
                roundedTotalInterest -
                interestAlreadyAllocated,
              )
            : regularInterest;

        const principalBeforeAdvance =
          isFinalInstallment
            ? principalAmountBeforeAdvance
            : 0;

        const principalAmount =
          isFinalInstallment
            ? Math.max(
                0,
                principalBeforeAdvance -
                roundedAdvanceDeduction,
              )
            : 0;

        const installmentAmount =
          Math.max(
            0,
            interestAmount +
            principalAmount,
          );

        const outstandingBalance =
          isFinalInstallment
            ? 0
            : principalAmountBeforeAdvance;

        return {
          installmentNumber:
            index + 1,

          dueDate:
            getDueDate(
              index,
            ).toISOString(),

          installmentAmount,

          principalAmount,

          interestAmount,

          outstandingBalance,

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

     BUSINESS RULE:
     - Principal is divided across the planned installments.
     - The final row receives the exact principal remainder.
     - Interest is calculated on the outstanding principal before
       each installment.
     - EMI naturally reduces as outstanding principal reduces.
     - Advance Deduction is applied ONLY to the final row.
     - Advance Deduction does NOT change the principal split.
     - The first installment amount is the first real reducing EMI.

     IMPORTANT FALLBACK:
     The current Loan Studio passes principalAmount and
     monthlyInterestRate. Older callers may not pass them.

     If principalAmount is missing, derive principal from:
       totalPayable - totalInterest

     If monthlyInterestRate is missing, derive the monthly rate
     from the flat-interest baseline supplied by the caller.

     This prevents a reducing schedule from silently becoming
     ₹0 when an older caller is still using the original arguments.
  ========================================================= */

  if (
    repaymentMode === "reducing"
  ) {

    /* =======================================================
       PRINCIPAL SOURCE OF TRUTH
    ======================================================= */

    const passedPrincipal =
      Math.max(
        0,
        Math.round(
          Number(
            principalAmount,
          ) || 0,
        ),
      );

    const derivedPrincipal =
      Math.max(
        0,
        Math.round(
          roundedTotalPayable -
          roundedTotalInterest,
        ),
      );

    const safePrincipal =
      passedPrincipal > 0
        ? passedPrincipal
        : derivedPrincipal;

    /* =======================================================
       MONTHLY RATE SOURCE OF TRUTH

       Normal path:
         monthlyInterestRate = Step 1 entered interest %

       Fallback path:
         derive the monthly rate from the existing flat-interest
         baseline so legacy callers still produce a real schedule.
    ======================================================= */

    const passedMonthlyRate =
      Math.max(
        0,
        Number(
          monthlyInterestRate,
        ) || 0,
      );

    let safeMonthlyRate =
      passedMonthlyRate;

    if (
      safeMonthlyRate === 0 &&
      safePrincipal > 0 &&
      roundedTotalInterest > 0
    ) {

      const estimatedMonthlyPeriods =
        frequency === "daily"
          ? safeInstallments / 30
          : frequency === "weekly"
            ? safeInstallments / 4.33
            : safeInstallments;

      if (
        estimatedMonthlyPeriods > 0
      ) {

        safeMonthlyRate =
          (
            roundedTotalInterest /
            (
              safePrincipal *
              estimatedMonthlyPeriods
            )
          ) *
          100;
      }
    }

    /* =======================================================
       PERIODIC RATE
    ======================================================= */

    const periodicRate =
      frequency === "daily"
        ? safeMonthlyRate / 30
        : frequency === "weekly"
          ? safeMonthlyRate / 4.33
          : safeMonthlyRate;

    const periodicRateDecimal =
      periodicRate / 100;

    /* =======================================================
       PRINCIPAL DISTRIBUTION

       Example:
         ₹10,000 / 24

       First 23 rows:
         ₹417 principal

       Final row:
         ₹409 principal

       This guarantees:
         sum(principal components) = ₹10,000
    ======================================================= */

    const basePrincipal =
      Math.floor(
        safePrincipal /
        safeInstallments,
      );

    const principalRemainder =
      safePrincipal -
      (
        basePrincipal *
        safeInstallments
      );

    const principalComponents =
      Array.from(
        {
          length:
            safeInstallments,
        },
        (_, index) =>
          basePrincipal +
          (
            index <
            principalRemainder
              ? 1
              : 0
          ),
      );

    let outstandingPrincipal =
      safePrincipal;

    return principalComponents.map(
      (
        principalComponent,
        index,
      ): LoanInstallment => {

        const isFinalInstallment =
          index ===
          safeInstallments - 1;

        const principalBeforeInstallment =
          outstandingPrincipal;

        const interestAmount =
          Math.max(
            0,
            Math.round(
              principalBeforeInstallment *
              periodicRateDecimal,
            ),
          );

        const normalInstallmentAmount =
          Math.max(
            0,
            principalComponent +
            interestAmount,
          );

        /* =====================================================
           ADVANCE DEDUCTION

           The advance is already collected at disbursement.

           Therefore:
             - never touch rows 1..N-1
             - deduct only from final EMI
             - never allow a negative customer payment

           If the advance is larger than the final EMI, the
           payable final EMI becomes ₹0. The excess advance is
           still retained as an already-collected amount outside
           the installment row.
        ===================================================== */

        const installmentAmount =
          isFinalInstallment
            ? Math.max(
                0,
                normalInstallmentAmount -
                roundedAdvanceDeduction,
              )
            : normalInstallmentAmount;

        outstandingPrincipal =
          Math.max(
            0,
            principalBeforeInstallment -
            principalComponent,
          );

        return {
          installmentNumber:
            index + 1,

          dueDate:
            getDueDate(
              index,
            ).toISOString(),

          installmentAmount,

          principalAmount:
            principalComponent,

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

     BUSINESS RULE:
     - EMI is calculated from FULL Total Payable.
     - Advance Deduction does NOT reduce the EMI base.
     - Every regular installment uses the rounded base EMI.
     - Final installment absorbs the rounding remainder.
     - Advance Deduction is applied ONLY to the final row.
  ========================================================= */

  const scheduledPayable =
    roundedTotalPayable;

  const installmentAmount =
    Math.round(
      scheduledPayable /
      safeInstallments,
    );

  const regularInterest =
    Math.floor(
      roundedTotalInterest /
      safeInstallments,
    );

  return Array.from(

    {
      length:
        safeInstallments,
    },

    (_, index):
      LoanInstallment => {

      const isFinalInstallment =
        index ===
        safeInstallments - 1;

      const amountBeforeAdvance =
        isFinalInstallment
          ? Math.max(
              0,
              scheduledPayable -
              (
                installmentAmount *
                index
              ),
            )
          : installmentAmount;

      const installmentAmountForRow =
        Math.max(
          0,
          amountBeforeAdvance -
          (
            isFinalInstallment
              ? roundedAdvanceDeduction
              : 0
          ),
        );

      const interestAlreadyAllocated =
        regularInterest *
        index;

      const interestAmount =
        isFinalInstallment
          ? Math.max(
              0,
              roundedTotalInterest -
              interestAlreadyAllocated,
            )
          : regularInterest;

      const principalAmount =
        Math.max(
          0,
          installmentAmountForRow -
          interestAmount,
        );

      const paidBeforeCurrent =
        installmentAmount *
        index;

      const outstandingBalance =
        isFinalInstallment
          ? 0
          : Math.max(
              0,
              Math.round(
                scheduledPayable -
                (
                  paidBeforeCurrent +
                  installmentAmountForRow
                ),
              ),
            );

      return {
        installmentNumber:
          index + 1,

        dueDate:
          getDueDate(
            index,
          ).toISOString(),

        installmentAmount:
          installmentAmountForRow,

        principalAmount,

        interestAmount,

        outstandingBalance,

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
