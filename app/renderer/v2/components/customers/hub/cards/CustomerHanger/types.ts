/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   TYPES

   Module  : Customer Hub
   Layer   : Cards
   Version : 2.1
   Status  : Production

   RESPONSIBILITY:
   - Customer Hanger data contract
   - Customer Hanger component props
   - Single canonical customer model for this component

   IMPORTANT:
   - No imports from this same types.ts file
   - No circular type aliases
   - CustomerHangerProps is exported directly
   - CustomerModel is owned by this module
=========================================================== */


/* ===========================================================
   CUSTOMER MODEL
=========================================================== */

export interface CustomerModel {

  /* =========================================================
     CUSTOMER ID
  ========================================================= */

  id:
    string;


  /* =========================================================
     CUSTOMER NAME
  ========================================================= */

  name:
    string;


  /* =========================================================
     PHONE
  ========================================================= */

  phone?:
    string;


  /* =========================================================
     BRANCH
  ========================================================= */

  branch:
    string;


  /* =========================================================
     CUSTOMER PROFILE PHOTO
  ========================================================= */

  photo?:
    string;


  /* =========================================================
     IDENTITY / BACK CARD DETAILS
  ========================================================= */

  fatherName?:
    string;

  village?:
    string;

  mandal?:
    string;

  district?:
    string;

  customerSince?:
    string;


  /* =========================================================
     STATUS
  ========================================================= */

  kycVerified:
    boolean;

  active:
    boolean;


  /* =========================================================
     FINANCE
  ========================================================= */

  outstandingAmount:
    number;

  nextCollectionDate:
    string;


  /* =========================================================
     LOAN SUMMARY
  ========================================================= */

  totalLoans?:
    number;

  activeLoans?:
    number;

  closedLoans?:
    number;

}


/* ===========================================================
   CUSTOMER HANGER PROPS
=========================================================== */

export interface CustomerHangerProps {

  /* =========================================================
     CUSTOMER
  ========================================================= */

  customer:
    CustomerModel;


  /* =========================================================
     SELECTION
  ========================================================= */

  onClick?: (
    customer:
      CustomerModel,
  ) => void;


  /* =========================================================
     CARD FLIP COMPATIBILITY
  ========================================================= */

  flipped?:
    boolean;

  onFlip?: () => void;

}


/* ===========================================================
   END
=========================================================== */