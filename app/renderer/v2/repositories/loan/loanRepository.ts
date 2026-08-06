/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN REPOSITORY™

   REPOSITORY
=========================================================== */

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";


/* ===========================================================
   STORAGE KEY
=========================================================== */

const STORAGE_KEY =
  "FINORA_LOANS_V2";


  /* ===========================================================
   LOAN DATA MIGRATION
=========================================================== */

function migrateLoans(

  loans: Loan[],

): Loan[] {


  return loans.map(

    (loan) => {


      let loanType =
        loan.loanType;


      let repaymentType =
        loan.repaymentType;



      let title =
        loan.title;



      if (

        title?.toLowerCase()
          .includes("daily")

      ) {

        title =
          "Daily Loan";

        loanType =
          "DAILY";

        repaymentType =
          "DAILY";

      }


      else if (

        title?.toLowerCase()
          .includes("weekly")

      ) {

        title =
          "Weekly Loan";

        loanType =
          "WEEKLY";

        repaymentType =
          "WEEKLY";

      }


      else if (

        title?.toLowerCase()
          .includes("monthly")

      ) {

        title =
          "Monthly Loan";

        loanType =
          "MONTHLY";

        repaymentType =
          "MONTHLY";

      }



      return {

        ...loan,

        title,

        loanType,

        repaymentType,

      };


    },

  );

}

/* ===========================================================
   LOAD
=========================================================== */

export function getLoans():
Loan[] {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {

      return [];

    }

    const loans =
  JSON.parse(raw);


const migratedLoans =
  migrateLoans(
    loans,
  );


saveLoans(
  migratedLoans,
);


return migratedLoans;

  } catch {

    return [];

  }

}

/* ===========================================================
   SAVE
=========================================================== */

export function saveLoans(

  loans: Loan[],

): void {

  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(loans),

  );

}

/* ===========================================================
   ADD LOAN
=========================================================== */

export function addLoan(

  loan: Loan,

): void {

  const loans =

    getLoans();

  loans.push(

    loan,

  );

  saveLoans(

    loans,

  );

}

/* ===========================================================
   GET LOAN BY ID
=========================================================== */

export function getLoanById(

  loanId: string,

): Loan | undefined {

  return getLoans().find(

    (loan) =>

      loan.id === loanId,

  );

}

/* ===========================================================
   UPDATE LOAN OUTSTANDING
=========================================================== */

export function updateLoanOutstanding(

  loanId: string,

  paymentAmount: number,

): Loan | undefined {


  const loans = getLoans();


  const loanIndex = loans.findIndex(

    (loan) =>
      loan.id === loanId,

  );


  if (loanIndex === -1) {

    return undefined;

  }



  const loan =
    loans[loanIndex];


  const newOutstanding =
    Math.max(

      0,

      loan.outstanding - paymentAmount,

    );



  loans[loanIndex] = {

    ...loan,

    outstanding:
      newOutstanding,


    status:
      newOutstanding === 0
        ? "CLOSED"
        : "ACTIVE",

  };



  saveLoans(

    loans,

  );


  return loans[loanIndex];

}
