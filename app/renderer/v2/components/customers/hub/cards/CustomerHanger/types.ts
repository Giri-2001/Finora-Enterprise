/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   TYPES

   Module  : Customer Hub
   Layer   : Cards
   Version : 3.0
   Status  : Production

   RESPONSIBILITY:
   - Customer Hanger data contract
   - Customer Hanger component props
   - Single canonical customer model for this component
   - Controlled card-flip contract

   FLIP ARCHITECTURE:
   - Flip state is controlled by the Customer Hub parent.
   - CustomerHanger does NOT own independent flip state.
   - Parent decides which customer is currently flipped.
   - At most ONE customer card should be flipped at a time.

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

  pinCode?:
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

      /* =========================================================
     LAST PAYMENT
  ========================================================= */

  lastPaymentDate?:
    string;

  lastPaymentAmount?:
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
     BUSINESS IDENTITY
  ========================================================= */

  companyName?:
    string;


  branchName?:
    string;


  /* =========================================================
     SELECTION
  ========================================================= */

  onClick?: (
    customer:
      CustomerModel,
  ) => void;


  /* =========================================================
     CONTROLLED CARD FLIP
     ---------------------------------------------------------
     IMPORTANT:

     Flip state is intentionally NOT owned by
     CustomerHanger.

     The parent Customer Hub owns the active
     flipped customer identity.

     Therefore:

       flipped = true
           ↓
       this card shows BACK

       flipped = false
           ↓
       this card shows FRONT
  ========================================================= */

  flipped?:
    boolean;


  /* =========================================================
     FLIP ACTION
     ---------------------------------------------------------
     Parent receives this event and decides whether
     this customer becomes the single active flipped card.

     This allows the parent to automatically close
     any previously flipped customer card.
  ========================================================= */

  onFlip?: () => void;

}


/* ===========================================================
   END
=========================================================== */