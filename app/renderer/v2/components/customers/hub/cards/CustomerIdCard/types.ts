/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ID CARD

   TYPES
=========================================================== */

export interface CustomerIdCardProps {

  customerId: string;

  customerName: string;

  photoUrl?: string;

  branchName?: string;

  kycVerified?: boolean;

  active?: boolean;

}
