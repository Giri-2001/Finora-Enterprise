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
// - Derive live Loan statistics from persisted Loan records
// - Attach related Collection information
// - Expose search-safe identity values
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
// - No filesystem access.
// - No Electron IPC.
// - Loan statistics are derived from live persisted Loan records.
// - CustomerProfile statistics are NOT used as the source of truth
//   for Loan Office statistics.
// - Full Aadhaar / ID-card numbers are NOT exposed to the
//   Customer Office search layer.
// - Only the final 6 digits are exposed for identity search.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CustomerProfile } from "../../../../../types/customers";

import type { OfficeCustomer } from "../../CustomerOffice/types";

import { fetchLoans } from "../../../../../services/loan/loanService";

import { collectionRepository } from "../../../../../repositories/collection/collectionRepository";

// ============================================================
// HELPERS
// ============================================================

function getFirst6Digits(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  const digits = String(value).replace(/\D/g, "");

  if (digits.length < 6) {
    return "";
  }

  return digits.slice(0, 6);
}

function getLast6Digits(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  const digits = String(value).replace(/\D/g, "");

  if (digits.length < 6) {
    return "";
  }

  return digits.slice(-6);
}

// ============================================================
// COLLECTION PAYMENT DATE
//
// Authoritative transaction date:
// 1. receiptDate
// 2. createdAt for historical compatibility
//
// updatedAt is deliberately excluded because editing a stored
// Collection must not make an older payment appear newer.
// ============================================================

function resolveCollectionPaymentDate(
  collection: {
    receiptDate?: string;
    createdAt?: string;
  },
): string {

  const candidates = [
    collection.receiptDate,
    collection.createdAt,
  ];

  for (const candidate of candidates) {

    const value =
      String(candidate ?? "").trim();

    if (!value) {
      continue;
    }

    const timestamp =
      new Date(value).getTime();

    if (Number.isFinite(timestamp)) {
      return value;
    }
  }

  return "";
}

function resolveCollectionPaymentTimestamp(
  collection: {
    receiptDate?: string;
    createdAt?: string;
  },
): number {

  const paymentDate =
    resolveCollectionPaymentDate(
      collection,
    );

  if (!paymentDate) {
    return Number.NEGATIVE_INFINITY;
  }

  return new Date(
    paymentDate,
  ).getTime();
}

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
  //
  // This provides the current persisted Loan state to the
  // Customer Office without exposing the repository directly.
  // ==========================================================

  const loans = await fetchLoans();

  // ==========================================================
  // COLLECTIONS
  //
  // CollectionRepository is treated as an asynchronous
  // persistence boundary.
  // ==========================================================

  const collections = await collectionRepository.getAll();

  // ==========================================================
  // CUSTOMER → OFFICE CUSTOMER
  // ==========================================================

  return (
    customers

      // ========================================================
      // ACTIVE CUSTOMERS ONLY
      // ========================================================

      .filter(
        (customer) =>
          !customer.internal.isDeleted && !customer.internal.isArchived,
      )

      // ========================================================
      // OFFICE CUSTOMER MAPPING
      // ========================================================

      .map((customer) => {
        // ======================================================
        // CUSTOMER ID
        // ======================================================

        const customerId = customer.identity.customerId;

        // ======================================================
        // SEARCH-SAFE AADHAAR
        //
        // IMPORTANT:
        //
        // The complete Aadhaar number remains inside the
        // CustomerProfile / KYC layer.
        //
        // Customer Office receives ONLY the final 6 digits.
        // ======================================================

        const aadhaarDocumentNumber = customer.kyc?.aadhaar?.documentNumber;

        const aadhaarFirst6 = getFirst6Digits(aadhaarDocumentNumber);

        const aadhaarLast6 = getLast6Digits(aadhaarDocumentNumber);

        // ======================================================
        // SEARCH-SAFE ID CARD
        //
        // IMPORTANT:
        //
        // Customer Office must never require the complete
        // identity-document number.
        //
        // The exact ID-card document field is intentionally
        // read defensively so this mapper does not invent or
        // alter the CustomerProfile persistence schema.
        // ======================================================

        const idCardDocument = (
          customer.kyc as
            | {
                idCard?: {
                  documentNumber?: string;
                };
              }
            | undefined
        )?.idCard?.documentNumber;

        const idCardLast6 = getLast6Digits(idCardDocument);

        // ======================================================
        // RELATED LOANS
        //
        // IMPORTANT:
        //
        // These are the live persisted Loan records returned
        // through LoanService.
        // ======================================================

        const customerLoans = loans.filter(
          (loan) => loan.customerId === customerId,
        );

        // ======================================================
        // RELATED COLLECTIONS
        //
        // Keep the complete customer Collection history for the
        // Customer Office, while deriving Last Payment only from
        // finalized Approved cash transactions.
        // ======================================================

        const customerCollections =
          collections.filter(
            (collection) =>
              collection.customerId === customerId,
          );

        // ======================================================
        // LAST PAYMENT
        //
        // Rules:
        //
        // - Approved Collections only.
        // - paymentAmount must represent positive actual cash.
        // - receiptDate is authoritative.
        // - createdAt is the historical compatibility fallback.
        // - updatedAt must not change transaction chronology.
        // ======================================================

        let lastPayment:
          (typeof collections)[number] |
          undefined;

        let lastPaymentTimestamp =
          Number.NEGATIVE_INFINITY;

        for (
          const collection of
          customerCollections
        ) {

          if (
            collection.status !==
            "Approved"
          ) {
            continue;
          }

          const paymentAmount =
            Number(
              collection.paymentAmount,
            );

          if (
            !Number.isFinite(
              paymentAmount,
            ) ||
            paymentAmount <= 0
          ) {
            continue;
          }

          const paymentTimestamp =
            resolveCollectionPaymentTimestamp(
              collection,
            );

          if (
            paymentTimestamp ===
            Number.NEGATIVE_INFINITY
          ) {
            continue;
          }

          if (
            !lastPayment ||
            paymentTimestamp >
              lastPaymentTimestamp
          ) {

            lastPayment =
              collection;

            lastPaymentTimestamp =
              paymentTimestamp;
          }
        }

        const lastPaymentDate =
          lastPayment
            ? resolveCollectionPaymentDate(
                lastPayment,
              )
            : "";

        const lastPaymentAmount =
          lastPayment
            ? Number(
                lastPayment.paymentAmount,
              )
            : 0;

        // ======================================================
        // LIVE LOAN STATISTICS
        //
        // Customer Office must reflect the actual Loan storage
        // state instead of a stale CustomerProfile snapshot.
        // ======================================================

        const totalLoans = customerLoans.length;

        const activeLoans = customerLoans.filter(
          (loan) => loan.status === "ACTIVE" || loan.status === "RUNNING",
        ).length;

        const closedLoans = customerLoans.filter(
          (loan) => loan.status === "CLOSED",
        ).length;

        const outstandingAmount = customerLoans.reduce(
          (total, loan) =>
            total + (Number.isFinite(loan.outstanding) ? loan.outstanding : 0),
          0,
        );

        // ======================================================
        // OFFICE CUSTOMER
        // ======================================================

        return {
          // ====================================================
          // RELATED LOANS
          // ====================================================

          loans: customerLoans,

          // ====================================================
          // BASIC IDENTITY
          // ====================================================

          id: customerId,

          name:
            customer.basic.displayName || customer.basic.fullName || "Unknown",

          phone: customer.basic.mobileNumber,

          // ====================================================
          // SEARCH IDENTITY
          //
          // ONLY SAFE SEARCH VALUES ARE EXPOSED.
          //
          // Full Aadhaar / ID-card numbers are deliberately
          // NOT copied into OfficeCustomer.
          // ====================================================

          aadhaarFirst6,

          aadhaarLast6,

          idCardLast6,

          // ====================================================
          // CUSTOMER PROFILE PHOTO
          //
          // Canonical photo comes from CustomerProfile.
          // No upload or storage logic belongs in this mapper.
          // ====================================================

          photo: customer.photo,

          branch: customer.identity.businessName,

          // ====================================================
          // BACK SIDE ID CARD DETAILS
          // ====================================================

          fatherName: customer.basic.fatherName ?? "",

          village: customer.address.currentAddress.village ?? "",

          pinCode: customer.address.currentAddress.pinCode ?? "",

          district: customer.address.currentAddress.district ?? "",

          customerSince:
            customer.timeline?.events?.find(
              (event) => event.type === "CUSTOMER_CREATED",
            )?.occurredAt ?? "",

          kycVerified:
            Boolean(
              customer.kyc?.aadhaar?.documentNumber &&
              customer.nominee?.nominees?.length,
            ),

          active: customer.identity.isActive,

          // ====================================================
          // CUSTOMER STATISTICS
          //
          // IMPORTANT:
          //
          // These values are derived from the current persisted
          // Loan records above.
          //
          // Do NOT use customer.statistics here because those
          // values may be an older CustomerProfile snapshot.
          // ====================================================

          outstandingAmount,

          totalLoans,

          activeLoans,

          closedLoans,

          nextCollectionDate: customer.internal.lastCollectionAt ?? "",

          lastPaymentDate,

          lastPaymentAmount,

          // ====================================================
          // COLLECTION HISTORY
          // ====================================================

          collections: customerCollections
            .map((collection) => ({
              id: collection.loanId,

              amount: collection.paymentAmount,

              paymentDate: collection.receiptDate,

              receiptNumber: collection.receiptNumber,
            })),
        };
      })
  );
}

// ============================================================
// END
// ============================================================
