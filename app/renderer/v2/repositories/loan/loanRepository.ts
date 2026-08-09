// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOAN REPOSITORY™
//
// REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist Loan records through StorageManager
// - Keep Loan domain model unchanged
// - Use Loan.id as persistent storage identity
// - Preserve existing Loan CRUD behavior
// - Preserve Loan outstanding update behavior
// - Keep physical storage implementation outside Loan domain
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No Collection logic.
// - No Payment logic.
// - Storage access goes through StorageManager.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";


import {
  storageManager,
} from "../../storage/storageManager";


import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";


// ============================================================
// CONSTANTS
// ============================================================

const LOAN_ENTITY =
  "LOAN";


// ============================================================
// LOAN DATA NORMALIZATION
// ============================================================
//
// Preserve the existing FINORA Loan normalization behavior.
//
// Legacy Loan records may have a title such as:
//
// Daily Loan
// Weekly Loan
// Monthly Loan
//
// MigrationService performs the legacy migration itself.
// This helper remains available as a defensive normalization
// boundary for records entering the repository.
//
// ============================================================

function normalizeLoan(
  loan: Loan,
):
  Loan {

  let loanType =
    loan.loanType;


  let repaymentType =
    loan.repaymentType;


  let title =
    loan.title;


  // ==========================================================
  // DAILY
  // ==========================================================

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


  // ==========================================================
  // WEEKLY
  // ==========================================================

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


  // ==========================================================
  // MONTHLY
  // ==========================================================

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

}


// ============================================================
// QUERY BUILDER
// ============================================================

function buildLoanQuery(
  query?: Partial<StorageQuery>,
):
  StorageQuery {

  return {

    entity:
      LOAN_ENTITY,

    id:
      query?.id,

    ownerId:
      query?.ownerId,

    demoId:
      query?.demoId,

    limit:
      query?.limit,

    offset:
      query?.offset,

  };

}


// ============================================================
// GET ALL LOANS
// ============================================================

export async function getLoans():
  Promise<Loan[]> {

  try {

    const result =
      await storageManager.getAll<Loan>(
        buildLoanQuery(),
      );


    if (
      !result.success ||
      !result.data
    ) {

      return [];

    }


    return result.data.map(
      normalizeLoan,
    );

  } catch {

    return [];

  }

}


// ============================================================
// SAVE ALL LOANS
// ============================================================
//
// Kept as a compatibility operation for existing Loan
// business workflows.
//
// Physical persistence is delegated to StorageManager.
//
// ============================================================

export async function saveLoans(
  loans: Loan[],
):
  Promise<StorageResult<void>> {

  const normalizedLoans =
    loans.map(
      normalizeLoan,
    );


  return storageManager.replaceAll<Loan>(
    normalizedLoans,
  );

}


// ============================================================
// ADD LOAN
// ============================================================

export async function addLoan(
  loan: Loan,
):
  Promise<StorageResult<Loan>> {

  // ==========================================================
  // VALIDATE ID
  // ==========================================================

  if (
    !loan.id
  ) {

    return {

      success:
        false,

      error:
        "Loan ID is required before saving a loan.",

    };

  }


  // ==========================================================
  // NORMALIZE
  // ==========================================================

  const normalizedLoan =
    normalizeLoan(
      loan,
    );


  // ==========================================================
  // DUPLICATE ID CHECK
  // ==========================================================

  const existing =
    await storageManager.get<Loan>({
      entity:
        LOAN_ENTITY,

      id:
        normalizedLoan.id,
    });


  if (
    existing.success &&
    existing.data
  ) {

    return {

      success:
        false,

      error:
        "Loan with this ID already exists.",

    };

  }


  // ==========================================================
  // SAVE
  // ==========================================================

  const result =
    await storageManager.save<Loan>(
      normalizedLoan,
    );


  if (
    !result.success
  ) {

    return {

      success:
        false,

      error:
        result.error ??
        "Unable to save loan.",

    };

  }


  return {

    success:
      true,

    data:
      normalizedLoan,

  };

}


// ============================================================
// GET LOAN BY ID
// ============================================================

export async function getLoanById(
  loanId: string,
):
  Promise<Loan | undefined> {

  if (
    !loanId
  ) {

    return undefined;

  }


  const result =
    await storageManager.get<Loan>({
      entity:
        LOAN_ENTITY,

      id:
        loanId,
    });


  if (
    !result.success ||
    !result.data
  ) {

    return undefined;

  }


  return normalizeLoan(
    result.data,
  );

}


// ============================================================
// UPDATE LOAN OUTSTANDING
// ============================================================
//
// Existing business behavior:
//
// outstanding cannot go below zero.
//
// When outstanding reaches zero:
//
// status = CLOSED
//
// Otherwise:
//
// status = ACTIVE
//
// ============================================================

export async function updateLoanOutstanding(
  loanId: string,
  paymentAmount: number,
):
  Promise<Loan | undefined> {

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (
    !loanId
  ) {

    return undefined;

  }


  if (
    !Number.isFinite(
      paymentAmount,
    ) ||
    paymentAmount <= 0
  ) {

    return undefined;

  }


  // ==========================================================
  // LOAD LOAN
  // ==========================================================

  const result =
    await storageManager.get<Loan>({
      entity:
        LOAN_ENTITY,

      id:
        loanId,
    });


  if (
    !result.success ||
    !result.data
  ) {

    return undefined;

  }


  const loan =
    normalizeLoan(
      result.data,
    );


  // ==========================================================
  // CALCULATE OUTSTANDING
  // ==========================================================

  const newOutstanding =
    Math.max(

      0,

      loan.outstanding -
        paymentAmount,

    );


  // ==========================================================
  // BUILD UPDATED LOAN
  // ==========================================================

  const updatedLoan:
    Loan = {

    ...loan,

    outstanding:
      newOutstanding,

    status:
      newOutstanding === 0
        ? "CLOSED"
        : "ACTIVE",

  };


  // ==========================================================
  // PERSIST UPDATE
  // ==========================================================

  const updateResult =
    await storageManager.update<Loan>(
      updatedLoan,
    );


  if (
    !updateResult.success
  ) {

    return undefined;

  }


  return updatedLoan;

}


// ============================================================
// END
// ============================================================
