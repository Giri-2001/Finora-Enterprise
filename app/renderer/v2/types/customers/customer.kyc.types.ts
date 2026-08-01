/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER KYC TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : C - Government KYC
   Version : 2.0
   Status  : Production
=========================================================== */

import { KYCStatus } from "./customer.enums";

/* ===========================================================
   DOCUMENT NUMBER
=========================================================== */

export type DocumentNumber = string;

/* ===========================================================
   DOCUMENT URL
=========================================================== */

export type DocumentUrl = string;

/* ===========================================================
   KYC DOCUMENT
=========================================================== */

export interface KYCDocument {
  /**
   * Document Number
   */
  documentNumber: DocumentNumber;

  /**
   * Uploaded Image / PDF Path
   */
  documentUrl?: DocumentUrl;

  /**
   * Verification Status
   */
  status: KYCStatus;

  /**
   * Verification Date
   */
  verifiedAt?: string;
}

/* ===========================================================
   CUSTOMER KYC
=========================================================== */

export interface CustomerKYC {
  /**
   * Aadhaar Card
   */
  aadhaar?: KYCDocument;

  /**
   * PAN Card
   */
  pan?: KYCDocument;

  /**
   * Voter ID
   */
  voterId?: KYCDocument;

  /**
   * Driving License
   */
  drivingLicense?: KYCDocument;

  /**
   * Passport
   */
  passport?: KYCDocument;

  /**
   * Ration Card
   */
  rationCard?: KYCDocument;

  /**
   * Employee ID
   */
  employeeId?: KYCDocument;

  /**
   * Farmer ID
   */
  farmerId?: KYCDocument;

  /**
   * Pension Card
   */
  pensionCard?: KYCDocument;

  /**
   * Overall Customer KYC Status
   */
  overallStatus: KYCStatus;

  /**
   * Last Verification Date
   */
  lastVerifiedAt?: string;

  /**
   * Verified By
   */
  verifiedBy?: string;
}
