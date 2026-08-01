/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER NOMINEE TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : F - Nominee Information
   Version : 2.0
   Status  : Production
=========================================================== */

import { NomineeRelation } from "./customer.enums";

import type { Address } from "./customer.address.types";

/* ===========================================================
   NOMINEE ID
=========================================================== */

export type NomineeId = string;

/* ===========================================================
   NOMINEE INFORMATION
=========================================================== */

export interface CustomerNominee {
  /**
   * Internal Nominee ID
   */
  nomineeId: NomineeId;

  /**
   * Full Name
   */
  fullName: string;

  /**
   * Relationship with Customer
   */
  relation: NomineeRelation;

  /**
   * Mobile Number
   */
  mobileNumber: string;

  /**
   * Alternate Mobile Number
   */
  alternateMobileNumber?: string;

  /**
   * Aadhaar Number
   */
  aadhaarNumber?: string;

  /**
   * PAN Number
   */
  panNumber?: string;

  /**
   * Date of Birth
   */
  dateOfBirth?: string;

  /**
   * Occupation
   */
  occupation?: string;

  /**
   * Residential Address
   */
  address?: Address;

  /**
   * Photo URL / Local Path
   */
  photoUrl?: string;

  /**
   * Signature URL / Local Path
   */
  signatureUrl?: string;

  /**
   * Nominee Share Percentage
   * Example: 100
   */
  sharePercentage: number;

  /**
   * Primary Nominee
   */
  isPrimary: boolean;

  /**
   * Verification Status
   */
  isVerified: boolean;

  /**
   * Remarks
   */
  remarks?: string;
}

/* ===========================================================
   CUSTOMER NOMINEES
=========================================================== */

export interface CustomerNomineeInformation {
  /**
   * List of Customer Nominees
   */
  nominees: CustomerNominee[];
}
