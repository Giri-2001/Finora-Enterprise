/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER ADDRESS TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : E - Address Information
   Version : 2.0
   Status  : Production
=========================================================== */

/* ===========================================================
   PIN CODE
=========================================================== */

export type PinCode = string;

/* ===========================================================
   GOOGLE MAP LOCATION
=========================================================== */

export interface GeoLocation {
  /**
   * Latitude
   */
  latitude?: number;

  /**
   * Longitude
   */
  longitude?: number;

  /**
   * Google Maps Share Link
   */
  googleMapsUrl?: string;
}

/* ===========================================================
   ADDRESS
=========================================================== */

export interface Address {
  /**
   * House / Door Number
   */
  houseNumber?: string;

  /**
   * Street Name
   */
  street?: string;

  /**
   * Landmark
   */
  landmark?: string;

  /**
   * Area / Colony
   */
  area?: string;

  /**
   * Village
   */
  village: string;

  /**
   * Mandal / Taluk
   */
  mandal?: string;

  /**
   * City / Town
   */
  city?: string;

  /**
   * District
   */
  district: string;

  /**
   * State
   */
  state: string;

  /**
   * Country
   */
  country: string;

  /**
   * Postal PIN Code
   */
  pinCode?: PinCode;

  /**
   * Geo Location
   */
  location?: GeoLocation;
}

/* ===========================================================
   CUSTOMER ADDRESS
=========================================================== */

export interface CustomerAddressInformation {
  /**
   * Current Address
   */
  currentAddress: Address;

  /**
   * Permanent Address
   */
  permanentAddress: Address;

  /**
   * Permanent Address same as Current Address
   */
  isPermanentAddressSame: boolean;
}
