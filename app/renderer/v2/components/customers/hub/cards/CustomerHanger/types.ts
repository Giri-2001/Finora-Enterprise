/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   TYPES

   Module  : Customer Hub
   Section : Customer Hanger
   Version : 2.0
   Status  : Production
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

     Canonical customer photo field.

     Original image data is passed through unchanged.

     No resize.
     No compression.
     No transformation.
  ========================================================= */

  photo?:
    string;


  /* =========================================================
     ID CARD BACK DETAILS
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
   COMPONENT PROPS
=========================================================== */

export interface CustomerHangerProps {

  customer:
    CustomerModel;

  onClick?: (
    customer:
      CustomerModel,
  ) => void;

  flipped?:
    boolean;

  onFlip?: () => void;
}


/* ===========================================================
   END
=========================================================== */
