/* ==========================================================
FINORA ENTERPRISE OS™

CUSTOMER PERSONAL INFORMATION™

Module  : Customer
Section : D - Personal Information
Version : 2.0
Status  : Production
========================================================== */

/* ==========================================================
IMPORTS
========================================================== */

import {
  CustomerGender,
  MaritalStatus,
  Occupation,
} from "./customer.enums";

/* ==========================================================
BLOOD GROUP
========================================================== */

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

/* ==========================================================
EDUCATION
========================================================== */

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

/* ==========================================================
CUSTOMER PERSONAL INFORMATION
========================================================== */

export interface CustomerPersonalInformation {

/* ========================================================
GENDER
======================================================== */

  gender:
    CustomerGender;

/* ========================================================
DATE OF BIRTH

ISO Format:
YYYY-MM-DD
======================================================== */

  dateOfBirth?:
    string;

/* ========================================================
CALCULATED AGE
======================================================== */

  age?:
    number;

/* ========================================================
MARITAL STATUS
======================================================== */

  maritalStatus:
    MaritalStatus;

/* ========================================================
OCCUPATION
======================================================== */

  occupation:
    Occupation;

/* ========================================================
CUSTOM OCCUPATION

Used when occupation is OTHER.

Example:
occupation     = OTHER
occupationOther = "Finora Occupation"

This preserves the exact value entered by the user.
======================================================== */

  occupationOther?:
    string;

/* ========================================================
EDUCATION QUALIFICATION
======================================================== */

  education?:
    Education;

/* ========================================================
MONTHLY INCOME
======================================================== */

  monthlyIncome?:
    number;

/* ========================================================
ANNUAL INCOME
======================================================== */

  annualIncome?:
    number;

/* ========================================================
WORK PLACE / BUSINESS

Examples:

- ABC Finance
- Ramesh Kirana Store
- Self Business
- XYZ Company
======================================================== */

  workPlace?:
    string;

/* ========================================================
WORK EXPERIENCE

Stored as entered by the user.

Examples:

- 2 Years
- 5 Years
- 10 Years
======================================================== */

  experience?:
    string;

/* ========================================================
NUMBER OF FAMILY MEMBERS
======================================================== */

  numberOfFamilyMembers?:
    number;

/* ========================================================
BLOOD GROUP
======================================================== */

  bloodGroup?:
    BloodGroup;

/* ========================================================
NATIONALITY
======================================================== */

  nationality?:
    string;

/* ========================================================
RELIGION

Optional.
======================================================== */

  religion?:
    string;

/* ========================================================
PHYSICALLY CHALLENGED
======================================================== */

  isDifferentlyAbled:
    boolean;

/* ========================================================
PERSONAL NOTES
======================================================== */

  notes?:
    string;

}
