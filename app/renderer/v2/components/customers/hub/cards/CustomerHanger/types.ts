/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER

   TYPES
=========================================================== */

/* ===========================================================
   CUSTOMER MODEL
=========================================================== */

export interface CustomerModel {

  id: string;

  name: string;

  phone?: string;

  branch: string;

  profilePhoto?: string;


  /* ==========================================
     ID CARD BACK DETAILS
  ========================================== */

  fatherName?: string;

  village?: string;

  mandal?: string;

  district?: string;

  customerSince?: string;


  /* ==========================================
     STATUS
  ========================================== */

  kycVerified: boolean;

  active: boolean;


  /* ==========================================
     FINANCE
  ========================================== */

  outstandingAmount: number;

  nextCollectionDate: string;


    /* ==========================================
     LOAN SUMMARY
  ========================================== */

  totalLoans?: number;

  activeLoans?: number;

  closedLoans?: number;

}


/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface CustomerHangerProps {

  customer: CustomerModel;

  onClick?: (
    customer: CustomerModel,
  ) => void;

    flipped?: boolean;

  onFlip?: () => void;

}
