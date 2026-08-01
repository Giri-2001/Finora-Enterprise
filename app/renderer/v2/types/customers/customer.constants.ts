/* ==========================================================
   FINORA ENTERPRISE V2
   CUSTOMER CONSTANTS
   ----------------------------------------------------------
   Purpose :
   Centralized constants for the Customer Module.

   Version : V2
   Status  : Production
========================================================== */

import {
  CustomerStatus,
  CustomerGender,
  MaritalStatus,
  KYCStatus,
} from "./customer.enums";

/* ==========================================================
   CUSTOMER ID
========================================================== */

export const CUSTOMER_ID_PREFIX = "FIN-CUS-";

export const CUSTOMER_ID_START = 1;

export const CUSTOMER_ID_PADDING = 6;

/* ==========================================================
   DEFAULT CUSTOMER VALUES
========================================================== */

export const DEFAULT_CUSTOMER_STATUS = CustomerStatus.ACTIVE;

export const DEFAULT_CUSTOMER_GENDER = CustomerGender.MALE;

export const DEFAULT_MARITAL_STATUS = MaritalStatus.SINGLE;

export const DEFAULT_KYC_STATUS = KYCStatus.PENDING;

/* ==========================================================
   VALIDATION
========================================================== */

export const CUSTOMER_NAME_MIN_LENGTH = 3;

export const CUSTOMER_NAME_MAX_LENGTH = 100;

export const PHONE_LENGTH = 10;

export const AADHAAR_LENGTH = 12;

export const PAN_LENGTH = 10;

export const PINCODE_LENGTH = 6;

/* ==========================================================
   DOCUMENTS
========================================================== */

export const MAX_DOCUMENT_SIZE_MB = 10;

export const MAX_DOCUMENT_SIZE_BYTES =
  MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/* ==========================================================
   CUSTOMER CARD
========================================================== */

export const CUSTOMER_CARD_PER_ROW_DESKTOP = 5;

export const CUSTOMER_CARD_PER_ROW_LAPTOP = 4;

export const CUSTOMER_CARD_PER_ROW_TABLET = 3;

export const CUSTOMER_CARD_PER_ROW_MOBILE = 2;

export const CUSTOMER_CARD_PER_ROW_SMALL = 1;

/* ==========================================================
   SEARCH
========================================================== */

export const CUSTOMER_SEARCH_MIN_CHARACTERS = 2;

/* ==========================================================
   UI
========================================================== */

export const PROFILE_PHOTO_SIZE = 180;

export const CUSTOMER_CARD_BORDER_RADIUS = 24;

export const CUSTOMER_CARD_ANIMATION_MS = 300;

/* ==========================================================
   PAGINATION
========================================================== */

export const DEFAULT_PAGE_SIZE = 20;

/* ==========================================================
   EXPORT
========================================================== */

export const CUSTOMER_EXPORT_FILE_NAME = "FINORA-Customers";
