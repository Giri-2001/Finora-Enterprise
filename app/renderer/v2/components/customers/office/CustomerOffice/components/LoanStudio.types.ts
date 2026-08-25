/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO™

   TYPES

   RESPONSIBILITY:
   - Public Loan Studio props
   - Shared Loan Studio view-model type

   IMPORTANT:
   - No runtime logic.
   - No JSX.
   - No styles.
   - No business calculations.
=========================================================== */


/* ===========================================================
   VIEW MODEL TYPE SOURCE
=========================================================== */

import type {
  useLoanStudio,
} from "./useLoanStudio";


/* ===========================================================
   PUBLIC PROPS
=========================================================== */

export interface LoanStudioProps {

  customerName?:
    string;

  customerId?:
    string;

  phoneNumber?:
    string;

}


/* ===========================================================
   VIEW MODEL
=========================================================== */

export type LoanStudioViewModel =
  ReturnType<
    typeof useLoanStudio
  >;


/* ===========================================================
   END
=========================================================== */