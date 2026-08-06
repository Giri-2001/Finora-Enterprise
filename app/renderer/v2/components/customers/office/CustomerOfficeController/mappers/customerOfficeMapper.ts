/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE CONTROLLER™

   CUSTOMER OFFICE MAPPER
=========================================================== */

import type {
  CustomerProfile,
} from "../../../../../types/customers";

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import {
  getLoans,
} from "../../../../../repositories/loan/loanRepository";

import {
  collectionRepository,
} from "../../../../../repositories/collection/collectionRepository";

/* ===========================================================
   MAPPER
=========================================================== */

export default function customerOfficeMapper(

  customers: CustomerProfile[],

): OfficeCustomer[] {

    const loans =
    getLoans();

    const collections =
  collectionRepository.getAll();

  return customers

    .filter(
      (customer) =>
        !customer.internal.isDeleted &&
        !customer.internal.isArchived,
    )

    .map(

      (customer) => ({
                loans:

          loans.filter(
            (loan) =>
              loan.customerId ===
              customer.identity.customerId,
          ),

        id:
          customer.identity.customerId,

        name:
  customer.basic.displayName ||
  customer.basic.fullName ||
  "Unknown",

        phone:
          customer.basic.mobileNumber,

        branch:
          customer.identity.businessName,

        /* ==========================================
           BACK SIDE ID CARD DETAILS
        ========================================== */

        fatherName:
          customer.basic.fatherName ?? "",

        village:
          customer.address.currentAddress.village ?? "",

        mandal:
          customer.address.currentAddress.mandal ?? "",

        district:
          customer.address.currentAddress.district ?? "",

        customerSince:
          customer.timeline?.events?.find(
            (event) =>
              event.type === "CUSTOMER_CREATED",
          )?.occurredAt ?? "",

        kycVerified:
          true,

        active:
          customer.identity.isActive,

        outstandingAmount:
          customer.statistics.outstandingAmount,

        totalLoans:
          customer.statistics.totalLoans,

        activeLoans:
          customer.statistics.activeLoans,

        closedLoans:
          customer.statistics.closedLoans,

        nextCollectionDate:
          customer.internal.lastCollectionAt ?? "",

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
