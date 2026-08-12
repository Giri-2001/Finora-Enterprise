/* ===========================================================
   FINORA ENTERPRISE OS™

   SMART WALL MAPPER™

   MODULE  : Customer Office
   SECTION : Smart Wall
   VERSION : 2.0
   STATUS  : Production

   RESPONSIBILITY:

   - Convert OfficeCustomer records into SmartWallItem records
   - Preserve customer presentation data
   - Preserve customer profile photo
   - Keep Smart Wall mapping separate from persistence

   IMPORTANT:

   - No storage access.
   - No repository access.
   - No CustomerService access.
   - No image processing.
   - No image compression.
   - Original customer photo data is passed through unchanged.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import type {
  SmartWallItem,
} from "../../../smartwall/CustomerSmartWall/types";


/* ===========================================================
   SMART WALL MAPPER
=========================================================== */

export default function smartWallMapper(
  customers:
    OfficeCustomer[],
):
  SmartWallItem[] {

  return customers.map(
    (customer) => ({

      /* =====================================================
         CUSTOMER ID
      ===================================================== */

      id:
        customer.id,


      /* =====================================================
         CUSTOMER NAME
      ===================================================== */

      customerName:
        customer.name,


      /* =====================================================
         CUSTOMER PHOTO

         Preserve the original customer photo.

         No resize.
         No compression.
         No transformation.
      ===================================================== */

      photo:
        customer.photo,


      /* =====================================================
         CUSTOMER STATUS
      ===================================================== */

      active:
        customer.active,

    }),
  );
}


/* ===========================================================
   END
=========================================================== */
