/* ==========================================================
   FINORA ENTERPRISE V2
   CUSTOMER ENUMS
   ----------------------------------------------------------
   Purpose:
   Centralized enums for the Customer Module.

   Version : V2
   Status  : Production
========================================================== */

/* ==========================================================
   CUSTOMER STATUS
========================================================== */

export enum CustomerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLACKLISTED = "BLACKLISTED",
  CLOSED = "CLOSED",
}

/* ==========================================================
   GENDER
========================================================== */

export enum CustomerGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

/* ==========================================================
   MARITAL STATUS
========================================================== */

export enum MaritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  WIDOW = "WIDOW",
  DIVORCED = "DIVORCED",
}

/* ==========================================================
   KYC STATUS
========================================================== */

export enum KYCStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

/* ==========================================================
   OCCUPATION
========================================================== */

export enum Occupation {
  FARMER = "FARMER",

  BUSINESS = "BUSINESS",

  EMPLOYEE = "EMPLOYEE",

  DRIVER = "DRIVER",

  LABOUR = "LABOUR",

  HOUSEWIFE = "HOUSEWIFE",

  STUDENT = "STUDENT",

  RETIRED = "RETIRED",

  OTHER = "OTHER",
}

/* ==========================================================
   NOMINEE RELATION
========================================================== */

export enum NomineeRelation {
  FATHER = "FATHER",

  MOTHER = "MOTHER",

  HUSBAND = "HUSBAND",

  WIFE = "WIFE",

  SON = "SON",

  DAUGHTER = "DAUGHTER",

  BROTHER = "BROTHER",

  SISTER = "SISTER",

  UNCLE = "UNCLE",

  AUNT = "AUNT",

  FRIEND = "FRIEND",

  OTHER = "OTHER",
}

/* ==========================================================
   DOCUMENT TYPE
========================================================== */

export enum CustomerDocumentType {
  PHOTO = "PHOTO",

  AADHAAR_FRONT = "AADHAAR_FRONT",

  AADHAAR_BACK = "AADHAAR_BACK",

  PAN = "PAN",

  SIGNATURE = "SIGNATURE",

  OTHER = "OTHER",
}

/* ==========================================================
   CUSTOMER TAG
========================================================== */

export enum CustomerTag {
  VIP = "VIP",

  REGULAR = "REGULAR",

  GOLD = "GOLD",

  TRUSTED = "TRUSTED",

  HIGH_VALUE = "HIGH_VALUE",

  LATE_PAYMENT = "LATE_PAYMENT",

  NEW_CUSTOMER = "NEW_CUSTOMER",
}

/* ==========================================================
   CUSTOMER RISK
========================================================== */

export enum CustomerRisk {
  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",
}
