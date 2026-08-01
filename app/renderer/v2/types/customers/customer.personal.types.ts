/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER PERSONAL TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : D - Personal Information
   Version : 2.0
   Status  : Production
=========================================================== */

import {
  CustomerGender,
  MaritalStatus,
  Occupation,
} from "./customer.enums";

/* ===========================================================
   BLOOD GROUP
=========================================================== */

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

/* ===========================================================
   EDUCATION
=========================================================== */

export type Education =
  | "No Formal Education"
  | "Primary"
  | "Secondary"
  | "Intermediate"
  | "Diploma"
  | "Graduate"
  | "Post Graduate"
  | "Doctorate"
  | "Other";

/* ===========================================================
   CUSTOMER PERSONAL INFORMATION
=========================================================== */

export interface CustomerPersonalInformation {
  /**
   * Gender
   */
  gender: CustomerGender;

  /**
   * Date of Birth
   * ISO Format (YYYY-MM-DD)
   */
  dateOfBirth?: string;

  /**
   * Calculated Age
   */
  age?: number;

  /**
   * Marital Status
   */
  maritalStatus: MaritalStatus;

  /**
   * Occupation
   */
  occupation: Occupation;

  /**
   * Education Qualification
   */
  education?: Education;

  /**
   * Monthly Income
   */
  monthlyIncome?: number;

  /**
   * Annual Income
   */
  annualIncome?: number;

  /**
   * Blood Group
   */
  bloodGroup?: BloodGroup;

  /**
   * Nationality
   */
  nationality?: string;

  /**
   * Religion (Optional)
   */
  religion?: string;

  /**
   * Physically Challenged
   */
  isDifferentlyAbled: boolean;

  /**
   * Personal Notes
   */
  notes?: string;
}
