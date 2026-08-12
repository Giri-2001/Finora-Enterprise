/* ===========================================================
   FINORA ENTERPRISE OS™
   PAYMENT SCHEDULE ENGINE™

   HELPERS

   RESPONSIBILITY:
   - Generate whole-rupee repayment schedules
   - Preserve Fixed / Variable repayment behavior
   - Support Interest Only repayment mode
   - Treat Advance Deduction as a separately collected amount
   - Apply Advance Deduction ONLY to the final installment
   - Keep schedule totals mathematically reconciled

   IMPORTANT BUSINESS RULE:
   - Advance Deduction does NOT reduce the EMI base.
   - EMI is calculated from the full Total Payable.
   - Advance Deduction is already collected at disbursement.
   - Therefore it is deducted only from the final scheduled EMI.
   - Example:
       Total Payable = ₹14,800
       Installments = 24
       Advance Deduction = ₹500

       Regular EMI = round(14,800 / 24) = ₹617
       First 23 EMIs = ₹617
       Final EMI before deduction = ₹609
       Final EMI after deduction = ₹109

       Scheduled EMI collection = ₹14,300
       Advance Deduction = ₹500
       Total = ₹14,800

   IMPORTANT ARCHITECTURE:
   - No repository access
   - No persistence
   - No UI responsibility
   - Existing callers using the original five arguments remain valid
=========================================================== */

import type {
  LoanInstallment,
} from "./types";

/* ===========================================================
   REPAYMENT OPTIONS
=========================================================== */

export type ScheduleRepaymentMode =
  | "fixed"
  | "variable"
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
        totalPayable,
      ),
    );

  const roundedTotalInterest =
    Math.max(
      0,
      Math.round(
        totalInterest,
      ),
    );

  const roundedAdvanceDeduction =
    Math.min(
      roundedTotalPayable,
      Math.max(
        0,
        Math.round(
          advanceDeduction,
        ),
      ),
    );

  /* =========================================================
     IMPORTANT — ADVANCE DEDUCTION RULE

     DO NOT subtract Advance Deduction here.

     The complete Total Payable remains the EMI calculation
     base. Advance Deduction is collected separately at
     disbursement and is applied only to the final installment.

     Therefore:

       scheduledPayable = totalPayable

     and the final installment receives the deduction later.
  ========================================================= */

  const scheduledPayable =
    roundedTotalPayable;

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

          paidAmount:
            0,

          penaltyAmount:
            0,

          receiptNumber:
            "",

          paidDate:
            "",

          status:
            "Pending",

        };
      },
    );
  }

  /* =========================================================
     FIXED / VARIABLE

     BUSINESS RULE:

     1. EMI is calculated from FULL Total Payable.
     2. Advance Deduction is NOT removed from the EMI base.
     3. Every regular installment uses the rounded base EMI.
     4. Final installment first absorbs the normal rounding
        remainder.
     5. Advance Deduction is then subtracted from that final
        installment only.
     6. Schedule collection + Advance Deduction = Total Payable.

     Example:

       ₹14,800 / 24
       = ₹616.67
       = ₹617 regular EMI

       23 × ₹617
       = ₹14,191

       Remaining final amount:
       ₹14,800 - ₹14,191
       = ₹609

       Advance Deduction:
       ₹500

       Final EMI:
       ₹609 - ₹500
       = ₹109
  ========================================================= */

  const baseInstallmentAmount =
    Math.round(
      scheduledPayable /
      safeInstallments,
    );

  /*
    The amount remaining before Advance Deduction on the final
    installment. This is calculated from the FULL payable value,
    not from payable minus advance.
  */
  const finalAmountBeforeAdvance =
    Math.max(
      0,
      scheduledPayable -
      (
        baseInstallmentAmount *
        (
          safeInstallments -
          1
        )
      ),
    );

  /*
    Advance Deduction is applied ONLY to the final installment.

    If the deduction is larger than the final installment,
    the final installment is safely clamped to zero instead
    of becoming negative.
  */
  const finalInstallmentAmount =
    Math.max(
      0,
      finalAmountBeforeAdvance -
      roundedAdvanceDeduction,
    );

  /*
    The actual amount collected through the EMI schedule after
    the separate Advance Deduction has already been collected.
  */
  const scheduledCollection =
    Math.max(
      0,
      (
        baseInstallmentAmount *
        (
          safeInstallments -
          1
        )
      ) +
      finalInstallmentAmount,
    );

  /* =========================================================
     INTEREST ALLOCATION

     The schedule UI currently displays installment amount only,
     but LoanInstallment also carries principal / interest
     fields. Keep those fields mathematically consistent.

     Because Advance Deduction changes only the final amount,
     interest is allocated proportionally across the actual
     scheduled collection. This preserves:

       Sum(interestAmount) = totalInterest
       Sum(principalAmount) + advanceDeduction = loan principal

     without producing negative principal/interest values in
     the final row.
  ========================================================= */

  const interestAllocatedToSchedule =
    Math.min(
      roundedTotalInterest,
      scheduledCollection,
    );

  let interestAllocatedBefore =
    0;

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

      const installmentAmountForRow =
        isFinalInstallment
          ? finalInstallmentAmount
          : baseInstallmentAmount;

      /* ======================================================
         INTEREST FOR CURRENT ROW

         Allocate whole rupees progressively so the final row
         absorbs the exact remaining interest.
      ====================================================== */

      const interestAmount =
        isFinalInstallment

          ? Math.max(
              0,
              interestAllocatedToSchedule -
              interestAllocatedBefore,
            )

          : Math.min(
              installmentAmountForRow,
              Math.floor(
                (
                  interestAllocatedToSchedule *
                  installmentAmountForRow
                ) /
                Math.max(
                  1,
                  scheduledCollection,
                ),
              ),
            );

      interestAllocatedBefore +=
        interestAmount;

      const principalAmount =
        Math.max(
          0,
          installmentAmountForRow -
          interestAmount,
        );

      /*
        Remaining scheduled payable after this installment.

        This represents the repayment schedule balance and does
        not include the Advance Deduction because that amount was
        already collected separately at disbursement.
      */
      const paidBeforeCurrent =
        (
          baseInstallmentAmount *
          index
        );

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

        paidAmount:
          0,

        penaltyAmount:
          0,

        receiptNumber:
          "",

        paidDate:
          "",

        status:
          "Pending",

      };
    },
  );
}

/* ===========================================================
   END
=========================================================== */
