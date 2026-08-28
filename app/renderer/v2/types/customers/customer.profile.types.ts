/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER PROFILE

   Module  : Customer
   Section : Master Customer Profile
   Version : 2.0
   Status  : Production
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CustomerIdentity } from "./customer.identity.types";

import type { CustomerBasicInformation } from "./customer.basic.types";

import type { CustomerKYC } from "./customer.kyc.types";

import type { CustomerPersonalInformation } from "./customer.personal.types";

import type { CustomerAddressInformation } from "./customer.address.types";

import type { CustomerNomineeInformation } from "./customer.nominee.types";

import type { CustomerDigitalLocker } from "./customer.documents.types";

import type { CustomerInternalInformation } from "./customer.internal.types";

import type { CustomerTimeline } from "./customer.timeline.types";

import type { CustomerStatistics } from "./customer.statistics.types";

/* ===========================================================
   COMPLETE CUSTOMER PROFILE
=========================================================== */

export interface CustomerProfile {
  /* =========================================================
     IDENTITY INFORMATION
  ========================================================= */

  identity: CustomerIdentity;

  /* =========================================================
     BASIC INFORMATION
  ========================================================= */

  basic: CustomerBasicInformation;

  /* =========================================================
     CUSTOMER PROFILE PHOTO

     Canonical customer profile photo.

     The original image data is preserved as supplied by
     the Customer Photo Uploader.

     No resize or compression is performed at this model
     boundary.
  ========================================================= */

  photo?: string;

  /* =========================================================
     GOVERNMENT KYC
  ========================================================= */

  kyc: CustomerKYC;

  /* =========================================================
     PERSONAL INFORMATION
  ========================================================= */

  personal: CustomerPersonalInformation;

  /* =========================================================
     ADDRESS INFORMATION
  ========================================================= */

  address: CustomerAddressInformation;

  /* =========================================================
     NOMINEE INFORMATION
  ========================================================= */

  nominee: CustomerNomineeInformation;

  /* =========================================================
     DIGITAL LOCKER
  ========================================================= */

  documents: CustomerDigitalLocker;

  /* =========================================================
     INTERNAL INFORMATION
  ========================================================= */

  internal: CustomerInternalInformation;

  /* =========================================================
     CUSTOMER TIMELINE
  ========================================================= */

  timeline: CustomerTimeline;

  /* =========================================================
     STATISTICS & ANALYTICS
  ========================================================= */

  statistics: CustomerStatistics;
}

/* ===========================================================
   END
=========================================================== */
