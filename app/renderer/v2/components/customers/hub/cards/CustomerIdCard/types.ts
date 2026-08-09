/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   TYPES
=========================================================== */

export interface CustomerIdCardProps {

  customerId: string;

  customerName: string;

  profilePhoto?: string;

  branchName?: string;

  phoneNumber?: string;

  kycVerified?: boolean;

  active?: boolean;

  /* =========================================================
     PRESENTATION MODE

     false / undefined
       → Standard 350px identity card

     true
       → Compact Customer Hub presentation
  ========================================================= */

  compact?: boolean;

}
