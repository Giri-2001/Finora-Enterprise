/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO™

   TYPES

   RESPONSIBILITY:
   - Public Loan Studio props
   - Standard / Gold Loan Studio entry mode
   - Initial wizard launch context
   - Gold Step-1 handoff contract
   - Shared Loan Studio view-model type

   IMPORTANT:
   - No runtime logic.
   - No JSX.
   - No styles.
   - No business calculations.
   - STANDARD Loan workflow must remain backward compatible.
   - GOLD Loan enters shared Loan Studio from Step 2.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { GoldLoanPreparedStepOne } from "../../../../../services/gold-loan/goldLoanService";

import type { useLoanStudio } from "./useLoanStudio";

/* ===========================================================
   LOAN STUDIO STEP
=========================================================== */

export type LoanStudioStep = 1 | 2 | 3 | 4 | 5 | 6;

/* ===========================================================
   LOAN ENTRY MODE

   STANDARD
   --------
   Existing production Loan Studio workflow.

   GOLD
   ----
   Dedicated Gold Step 1 is completed before entering the
   shared Loan Studio at Step 2.
=========================================================== */

export type LoanStudioEntryMode = "STANDARD" | "GOLD";

/* ===========================================================
   INITIAL LOAN STUDIO CONTEXT

   STANDARD FLOW:

   entryMode   = STANDARD
   initialStep = 1
   loanAmount  = empty / existing default

   GOLD FLOW:

   entryMode   = GOLD
   initialStep = 2
   loanAmount  = sanctioned Gold principal
   goldStepOne = authoritative prepared Gold Step-1 snapshot
=========================================================== */

export interface LoanStudioInitialContext {
  entryMode: LoanStudioEntryMode;

  initialStep: LoanStudioStep;

  customerName: string;

  customerId: string;

  phoneNumber: string;

  initialLoanAmount?: number;

  goldStepOne?: GoldLoanPreparedStepOne;
}

/* ===========================================================
   PUBLIC PROPS

   IMPORTANT:

   Every new launch property is optional so every existing:

   <LoanStudio />

   usage remains valid and preserves current production
   Standard Loan behaviour.
=========================================================== */

export interface LoanStudioProps {
  customerName?: string;

  customerId?: string;

  phoneNumber?: string;

  /* =========================================================
     ENTRY MODE

     Undefined means STANDARD for backward compatibility.
  ========================================================= */

  entryMode?: LoanStudioEntryMode;

  /* =========================================================
     INITIAL STEP

     Undefined means Step 1.

     Gold route will explicitly provide Step 2.
  ========================================================= */

  initialStep?: LoanStudioStep;

  /* =========================================================
     INITIAL PRINCIPAL

     Gold route supplies sanctionedAmount here.

     Loan Studio hook will convert this number into its existing
     controlled loanAmount representation.
  ========================================================= */

  initialLoanAmount?: number;

  /* =========================================================
     GOLD STEP-1 SNAPSHOT

     Present only for Gold Loan entry.

     Existing Loan Studio Steps 2–6 can carry this metadata
     without owning Gold valuation calculations.
  ========================================================= */

  goldStepOne?: GoldLoanPreparedStepOne;

  onGoldStepOneDetails?: () => void;
}

/* ===========================================================
   GOLD ENTRY GUARD INPUT
=========================================================== */

export interface GoldLoanStudioLaunchContext {
  entryMode: "GOLD";

  initialStep: 2;

  customerName: string;

  customerId: string;

  phoneNumber: string;

  initialLoanAmount: number;

  goldStepOne: GoldLoanPreparedStepOne;
}

/* ===========================================================
   STANDARD ENTRY DEFAULT
=========================================================== */

export interface StandardLoanStudioLaunchContext {
  entryMode: "STANDARD";

  initialStep: 1;

  customerName?: string;

  customerId?: string;

  phoneNumber?: string;
}

/* ===========================================================
   VIEW MODEL
=========================================================== */

export type LoanStudioViewModel = ReturnType<typeof useLoanStudio>;

/* ===========================================================
   END
=========================================================== */
