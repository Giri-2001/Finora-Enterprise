// ============================================================
// FINORA ENTERPRISE OS™
//
// CUSTOMER OFFICE CONTROLLER™
//
// CUSTOMER OFFICE MAPPER
//
// RESPONSIBILITY:
//
// - Convert CustomerProfile records into OfficeCustomer records
// - Attach related Loan information
// - Attach related Collection information
// - Keep presentation mapping separate from persistence
// - Provide an asynchronous mapping boundary for
//   StorageManager-backed Loan / Collection access
//
// IMPORTANT:
//
// - Customer data is supplied by CustomerService / Store.
// - Loan data is accessed through LoanService.
// - Collection data is accessed through CollectionRepository.
// - No direct LoanRepository access.
// - No localStorage access.
// - Existing mapping behavior is preserved.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CustomerProfile,
} from "../../../../../types/customers";

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import {
  fetchLoans,
} from "../../../../../services/loan/loanService";

import {
  collectionRepository,
} from "../../../../../repositories/collection/collectionRepository";

// ============================================================
// MAPPER
// ============================================================

export default async function customerOfficeMapper(
  customers: CustomerProfile[],
): Promise<OfficeCustomer[]> {

  // ==========================================================
  // LOANS
  //
  // Loan access goes through LoanService.
  // ==========================================================

  const loans =
    await fetchLoans();

  // ==========================================================
  // COLLECTIONS
  //
  // CollectionRepository is treated as an asynchronous
  // persistence boundary.
  // ==========================================================

  const collections =
    await collectionRepository.getAll();

  // ==========================================================
  // CUSTOMER → OFFICE CUSTOMER
  // ==========================================================

  return customers

    // ========================================================
    // ACTIVE CUSTOMERS ONLY
    // ========================================================

    .filter(
      (customer) =>
        !customer.internal.isDeleted &&
        !customer.internal.isArchived,
    )

    // ========================================================
    // OFFICE CUSTOMER MAPPING
    // ========================================================

    .map(
      (customer) => ({

        // ====================================================
        // RELATED LOANS
        // ====================================================

        loans:
          loans.filter(
            (loan) =>
              loan.customerId ===
              customer.identity.customerId,
          ),

        // ====================================================
        // BASIC IDENTITY
        // ====================================================

        id:
          customer.identity.customerId,

        name:
          customer.basic.displayName ||
          customer.basic.fullName ||
          "Unknown",

        phone:
          customer.basic.mobileNumber,

        // ====================================================
        // CUSTOMER PROFILE PHOTO
        //
        // Canonical photo comes from CustomerProfile.
        // No upload or storage logic belongs in this mapper.
        // ====================================================

        photo:
          customer.photo,

        branch:
          customer.identity.businessName,

        // ====================================================
        // BACK SIDE ID CARD DETAILS
        // ====================================================

        fatherName:
          customer.basic.fatherName ??
          "",

        village:
          customer.address.currentAddress.village ??
          "",

        mandal:
          customer.address.currentAddress.mandal ??
          "",

        district:
          customer.address.currentAddress.district ??
          "",

        customerSince:
          customer.timeline?.events?.find(
            (event) =>
              event.type ===
              "CUSTOMER_CREATED",
          )?.occurredAt ??
          "",

        kycVerified:
          true,

        active:
          customer.identity.isActive,

        // ====================================================
        // CUSTOMER STATISTICS
        // ====================================================

        outstandingAmount:
          customer.statistics.outstandingAmount,

        totalLoans:
          customer.statistics.totalLoans,

        activeLoans:
          customer.statistics.activeLoans,

        closedLoans:
          customer.statistics.closedLoans,

        nextCollectionDate:
          customer.internal.lastCollectionAt ??
          "",

        // ====================================================
        // COLLECTION HISTORY
        // ====================================================

        collections:
          collections
            .filter(
              (collection) =>
                collection.customerId ===
                customer.identity.customerId,
            )
            .map(
              (collection) => ({

                id:
                  collection.loanId,

                amount:
                  collection.paymentAmount,

                paymentDate:
                  collection.receiptDate,

                receiptNumber:
                  collection.receiptNumber,

              }),
            ),

      }),
    );
}

// ============================================================
// END
// ============================================================
