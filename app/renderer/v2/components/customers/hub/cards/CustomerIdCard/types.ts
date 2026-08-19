/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   TYPES

   RESPONSIBILITY:
   - Customer identity data contract
   - Customer Responsive Engine handoff
   - Presentation mode contract

   IMPORTANT:
   - Responsive geometry is resolved by the parent responsive
     layer.
   - CustomerIdCard must consume the resolved token set.
   - This type does NOT resolve viewport information.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


/* ===========================================================
   CUSTOMER ID CARD PROPS
=========================================================== */

export interface CustomerIdCardProps {

  /* =========================================================
     CUSTOMER IDENTITY
  ========================================================= */

  customerId: string;

  customerName: string;

  profilePhoto?: string;

  branchName?: string;

  phoneNumber?: string;

  kycVerified?: boolean;

  active?: boolean;


  /* =========================================================
     RESPONSIVE ENGINE

     The parent component resolves the correct viewport
     token set and passes it here.

     CustomerIdCard does NOT:
     - inspect window.innerWidth
     - resolve breakpoints
     - select mobile/tablet/laptop/desktop tokens
  ========================================================= */

  responsiveTokens: ResponsiveTokens;


  /* =========================================================
     PRESENTATION MODE

     false / undefined
       → Standard identity-card presentation

     true
       → Compact Customer Hub presentation

     IMPORTANT:
     compact controls presentation behavior only.
     Responsive geometry remains controlled by
     responsiveTokens.
  ========================================================= */

  compact?: boolean;

}