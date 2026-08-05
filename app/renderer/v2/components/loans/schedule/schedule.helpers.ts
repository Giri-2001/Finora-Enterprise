/* ===========================================================
   FINORA ENTERPRISE OS™
   PAYMENT SCHEDULE ENGINE™

   HELPERS
=========================================================== */

import type {
  LoanInstallment,
} from "./types";

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

): LoanInstallment[] {

  return Array.from(

    {
      length: installments,
    },

    (_, index): LoanInstallment => {

      const dueDate =
        new Date(startDate);

        /* ===========================================================
   EMI CALCULATIONS
=========================================================== */

const installmentAmount =

  installments > 0

    ? totalPayable / installments

    : 0;

    const interestAmount =

  installments > 0

    ? totalInterest / installments

    : 0;

    const principalAmount =

  installmentAmount -

  interestAmount;

  const outstandingBalance =

  Math.max(

    0,

    totalPayable -

    principalAmount *

    (index + 1),

  );

      switch (frequency) {

        case "daily":

          dueDate.setDate(
            dueDate.getDate() +
            index,
          );

          break;

        case "weekly":

          dueDate.setDate(
            dueDate.getDate() +
            index * 7,
          );

          break;

        case "monthly":

          dueDate.setMonth(
            dueDate.getMonth() +
            index,
          );

          break;

      }

      return {

        installmentNumber:
          index + 1,

        dueDate:
          dueDate.toISOString(),

        installmentAmount:
  installmentAmount,

        principalAmount:
  principalAmount,

        interestAmount:
  interestAmount,

        outstandingBalance:
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
