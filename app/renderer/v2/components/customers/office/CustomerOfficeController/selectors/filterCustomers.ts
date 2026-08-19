/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER FILTER SELECTOR™

   SEARCH RULES

   CUSTOMER OFFICE SEARCH SUPPORTS:

   1. Customer Name
   2. Customer ID
   3. Mobile Number
   4. Aadhaar Last 6 Digits
   5. ID Card Last 6 Digits

   IMPORTANT:

   - Customer Name IS searchable.
   - Customer Name uses WORD-START / PREFIX matching.
   - Customer ID supports partial matching.
   - Mobile Number supports partial matching.
   - Aadhaar requires exact 6-digit matching.
   - ID Card requires exact 6-digit matching.
   - Branch MUST NOT be searchable.
   - Father Name MUST NOT be searchable.
   - Address fields MUST NOT be searchable.
   - Loan fields MUST NOT be searchable.

   NAME SEARCH EXAMPLES:

   "Durgam Girish Kumar"

   g      → MATCH
   gir    → MATCH
   k      → MATCH
   kumar  → MATCH
   dur    → MATCH

   ah     → NO MATCH
   ri     → NO MATCH
   sha    → NO MATCH
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";


/* ===========================================================
   NORMALIZE GENERAL SEARCH VALUE
=========================================================== */

function normalizeSearchValue(
  value: string | undefined,
): string {

  return (
    value ?? ""
  )
    .trim()
    .toLowerCase();

}


/* ===========================================================
   NORMALIZE IDENTITY SEARCH VALUE
=========================================================== */

function normalizeIdentitySearchValue(
  value: string | undefined,
): string {

  return (
    value ?? ""
  )
    .replace(/\D/g, "");

}


/* ===========================================================
   CUSTOMER NAME PREFIX MATCH
=========================================================== */

function matchesCustomerName(
  customerName: string,
  keyword: string,
): boolean {

  const words =
    customerName
      .split(/\s+/)
      .filter(Boolean);

  return words.some(
    (word) =>
      word.startsWith(keyword),
  );

}


/* ===========================================================
   FILTER CUSTOMERS
=========================================================== */

export default function filterCustomers(
  customers: OfficeCustomer[],
  searchText: string,
): OfficeCustomer[] {

  /* =========================================================
     GENERAL SEARCH VALUE
  ========================================================= */

  const keyword =
    normalizeSearchValue(
      searchText,
    );


  /* =========================================================
     EMPTY SEARCH
  ========================================================= */

  if (!keyword) {

    return customers;

  }


  /* =========================================================
     IDENTITY SEARCH VALUE
  ========================================================= */

  const identityKeyword =
    normalizeIdentitySearchValue(
      searchText,
    );


  /* =========================================================
     APPROVED CUSTOMER SEARCH
  ========================================================= */

  return customers.filter(
    (customer) => {

      /* =======================================================
         CUSTOMER NAME

         WORD-START / PREFIX MATCH ONLY.

         Example:

         Durgam Girish Kumar

         g     → MATCH
         gir   → MATCH
         k     → MATCH
         kum   → MATCH

         ah    → NO MATCH
         ri    → NO MATCH
      ======================================================= */

      const customerName =
        normalizeSearchValue(
          customer.name,
        );

      const customerNameMatch =
        matchesCustomerName(
          customerName,
          keyword,
        );


      /* =======================================================
         CUSTOMER ID

         Partial search supported.
      ======================================================= */

      const customerId =
        normalizeSearchValue(
          customer.id,
        );

      const customerIdMatch =
        customerId.includes(
          keyword,
        );


      /* =======================================================
         MOBILE NUMBER

         Partial search supported.
      ======================================================= */

      const mobileNumber =
        normalizeSearchValue(
          customer.phone,
        );

      const mobileNumberMatch =
        mobileNumber.includes(
          keyword,
        );


      /* =======================================================
   AADHAAR

   EXACT 6-DIGIT MATCH ONLY.

   Supports BOTH:

   Full Aadhaar:
   123456789012

   Search:
   123456 → MATCH
   789012 → MATCH

   Partial:
   12345 → NO MATCH
   89012 → NO MATCH
======================================================= */

const aadhaarFirst6 =
  normalizeIdentitySearchValue(
    customer.aadhaarFirst6,
  );

const aadhaarLast6 =
  normalizeIdentitySearchValue(
    customer.aadhaarLast6,
  );

const aadhaarExactMatch =
  identityKeyword.length === 6 &&
  (
    aadhaarFirst6 === identityKeyword ||
    aadhaarLast6 === identityKeyword
  );

      /* =======================================================
         ID CARD LAST 6 DIGITS

         EXACT 6-DIGIT MATCH ONLY.
      ======================================================= */

      const idCardLast6 =
        normalizeIdentitySearchValue(
          customer.idCardLast6,
        );

      const idCardExactMatch =
        identityKeyword.length === 6 &&
        idCardLast6.length === 6 &&
        idCardLast6 === identityKeyword;


      /* =======================================================
         FINAL APPROVED MATCH
      ======================================================= */

      return (

        customerNameMatch ||

        customerIdMatch ||

        mobileNumberMatch ||

        aadhaarExactMatch ||

        idCardExactMatch

      );

    },
  );

}


/* ===========================================================
   END
=========================================================== */