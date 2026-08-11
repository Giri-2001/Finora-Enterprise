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


    const roundedTotalPayable =

      Math.round(
        totalPayable,
      );


    const roundedTotalInterest =

      Math.round(
        totalInterest,
      );


    const rawInstallmentAmount =

      installments > 0

        ? roundedTotalPayable / installments

        : 0;


    const installmentAmount =

      Math.round(
        rawInstallmentAmount,
      );


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


        const finalInstallmentAmount =

          index === installments - 1

            ? Math.max(

                0,

                roundedTotalPayable -

                (

                  installmentAmount *

                  index

                ),

              )

            :

              installmentAmount;



        const interestAmount =

          installments > 0

            ?

              Math.round(

                roundedTotalInterest /

                installments

              )

            :

              0;



        const principalAmount =

          Math.round(

            finalInstallmentAmount -

            interestAmount

          );



        const outstandingBalance =

          Math.max(

            0,

            Math.round(

              roundedTotalPayable -

              (

                installmentAmount *

                (index + 1)

              )

            ),

          );



        /* ===========================================================
          DUE DATE ENGINE
        =========================================================== */


        switch (frequency) {


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

                (index + 1) * 7

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



        return {


          installmentNumber:

            index + 1,


          dueDate:

            dueDate.toISOString(),



          installmentAmount:

            finalInstallmentAmount,



          principalAmount:

            principalAmount,



          interestAmount:

            interestAmount,



          outstandingBalance:

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
