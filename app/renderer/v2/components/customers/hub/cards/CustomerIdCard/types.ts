/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ID CARD

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

}
