/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER PROFILE TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : Master Customer Profile
   Version : 2.0
   Status  : Production
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
  /**
   * Identity Information
   */
  identity: CustomerIdentity;

  /**
   * Basic Information
   */
  basic: CustomerBasicInformation;

  /**
   * Government KYC
   */
  kyc: CustomerKYC;

  /**
   * Personal Information
   */
  personal: CustomerPersonalInformation;

  /**
   * Address Information
   */
  address: CustomerAddressInformation;

  /**
   * Nominee Information
   */
  nominee: CustomerNomineeInformation;

  /**
   * Digital Locker
   */
  documents: CustomerDigitalLocker;

  /**
   * Internal Information
   */
  internal: CustomerInternalInformation;

  /**
   * Customer Timeline
   */
  timeline: CustomerTimeline;

  /**
   * Statistics & Analytics
   */
  statistics: CustomerStatistics;
}
