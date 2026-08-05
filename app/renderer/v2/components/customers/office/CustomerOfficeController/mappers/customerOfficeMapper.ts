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

/* ===========================================================
   MAPPER
=========================================================== */

export default function customerOfficeMapper(

  customers: CustomerProfile[],

): OfficeCustomer[] {

  return customers

    .filter(
      (customer) =>
        !customer.internal.isDeleted &&
        !customer.internal.isArchived,
    )

    .map(

      (customer) => ({

        id:
          customer.identity.customerId,

        name:
          customer.basic.displayName ||
          customer.basic.fullName,

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

      }),

    );

}
