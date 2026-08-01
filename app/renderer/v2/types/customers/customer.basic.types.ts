/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER BASIC TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : B - Basic Information
   Version : 2.0
   Status  : Production
=========================================================== */

/* ===========================================================
   CUSTOMER NAME
=========================================================== */

export type CustomerName = string;

/* ===========================================================
   PHONE NUMBER
=========================================================== */

export type PhoneNumber = string;

/* ===========================================================
   EMAIL ADDRESS
=========================================================== */

export type EmailAddress = string;

/* ===========================================================
   BASIC CUSTOMER INFORMATION
=========================================================== */

export interface CustomerBasicInformation {
  /**
   * Customer Full Name
   */
  fullName: CustomerName;

  /**
   * Mobile Number
   */
  mobileNumber: PhoneNumber;

  /**
   * WhatsApp Number
   * Optional because some customers
   * may use the same mobile number.
   */
  whatsappNumber?: PhoneNumber;

  /**
   * Email Address
   */
  email?: EmailAddress;

  /**
   * Father's Name
   */
  fatherName: string;

  /**
   * Mother's Name
   */
  motherName?: string;

  /**
   * Husband / Wife Name
   */
  spouseName?: string;

  /**
   * Display Name
   * Used in cards and quick search.
   */
  displayName: string;

  /**
   * Preferred Language
   */
  preferredLanguage:
    | "Telugu"
    | "English"
    | "Hindi"
    | "Tamil"
    | "Kannada"
    | "Marathi"
    | "Other";

  /**
   * Emergency Contact Name
   */
  emergencyContactName?: string;

  /**
   * Emergency Contact Number
   */
  emergencyContactNumber?: PhoneNumber;
}
