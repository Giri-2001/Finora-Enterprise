/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER VALIDATION ENGINE
   -----------------------------------------------------------
   Module  : Customer
   Layer   : Utilities
   Version : 2.0
   Status  : Production
=========================================================== */

import type { CustomerProfile } from "../../types/customers";

/* ===========================================================
   VALIDATION RESULT
=========================================================== */

export interface ValidationResult {
  valid: boolean;

  message?: string;
}

/* ===========================================================
   NAME
=========================================================== */

export function validateCustomerName(
  name: string,
): ValidationResult {

  const value = name.trim();

  if (!value) {
    return {
      valid: false,
      message: "Customer name is required.",
    };
  }

  if (value.length < 3) {
    return {
      valid: false,
      message: "Customer name is too short.",
    };
  }

  if (value.length > 100) {
    return {
      valid: false,
      message: "Customer name is too long.",
    };
  }

  return {
    valid: true,
  };

}

/* ===========================================================
   MOBILE
=========================================================== */

export function validateMobileNumber(
  mobile: string,
): ValidationResult {

  const value = mobile.trim();

  if (!/^[6-9]\d{9}$/.test(value)) {
    return {
      valid: false,
      message: "Invalid mobile number.",
    };
  }

  return {
    valid: true,
  };

}

/* ===========================================================
   EMAIL
=========================================================== */

export function validateEmail(
  email?: string,
): ValidationResult {

  if (!email || email.trim() === "") {
    return {
      valid: true,
    };
  }

  const value = email.trim();

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(value)
    ? {
        valid: true,
      }
    : {
        valid: false,
        message: "Invalid email address.",
      };

}

/* ===========================================================
   AADHAAR
=========================================================== */

export function validateAadhaar(
  aadhaar?: string,
): ValidationResult {

  if (!aadhaar || aadhaar.trim() === "") {
    return {
      valid: true,
    };
  }

  const value = aadhaar.replace(/\s/g, "");

  if (!/^\d{12}$/.test(value)) {
    return {
      valid: false,
      message: "Invalid Aadhaar number.",
    };
  }

  return {
    valid: true,
  };

}

/* ===========================================================
   PAN
=========================================================== */

export function validatePAN(
  pan?: string,
): ValidationResult {

  if (!pan || pan.trim() === "") {
    return {
      valid: true,
    };
  }

  const value = pan.trim().toUpperCase();

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)) {
    return {
      valid: false,
      message: "Invalid PAN number.",
    };
  }

  return {
    valid: true,
  };

}

/* ===========================================================
   PIN CODE
=========================================================== */

export function validatePinCode(
  pin?: string,
): ValidationResult {

  if (!pin || pin.trim() === "") {
    return {
      valid: true,
    };
  }

  if (!/^\d{6}$/.test(pin)) {
    return {
      valid: false,
      message: "Invalid PIN Code.",
    };
  }

  return {
    valid: true,
  };

}

/* ===========================================================
   BUSINESS CODE
=========================================================== */

export function validateBusinessCode(
  code: string,
): ValidationResult {

  const value = code.trim().toUpperCase();

  if (!/^[A-Z0-9]{2,10}$/.test(value)) {
    return {
      valid: false,
      message: "Invalid business code.",
    };
  }

  return {
    valid: true,
  };

}

/* ===========================================================
   BRANCH CODE
=========================================================== */

export function validateBranchCode(
  code: string,
): ValidationResult {

  const value = code.trim().toUpperCase();

  if (!/^[A-Z0-9]{2,10}$/.test(value)) {
    return {
      valid: false,
      message: "Invalid branch code.",
    };
  }

  return {
    valid: true,
  };

}

/* ===========================================================
   DUPLICATE MOBILE
=========================================================== */

export function findDuplicateMobile(
  mobile: string,
  customers: CustomerProfile[],
): CustomerProfile | undefined {

  return customers.find(
    (customer) =>
      customer.basic.mobileNumber === mobile,
  );

}

/* ===========================================================
   DUPLICATE EMAIL
=========================================================== */

export function findDuplicateEmail(
  email: string,
  customers: CustomerProfile[],
): CustomerProfile | undefined {

  return customers.find(
    (customer) =>
      customer.basic.email === email,
  );

}

/* ===========================================================
   DUPLICATE AADHAAR
=========================================================== */

export function findDuplicateAadhaar(
  aadhaar: string,
  customers: CustomerProfile[],
): CustomerProfile | undefined {

  return customers.find(
    (customer) =>
      customer.kyc.aadhaar?.documentNumber === aadhaar,
  );

}

/* ===========================================================
   DUPLICATE PAN
=========================================================== */

export function findDuplicatePAN(
  pan: string,
  customers: CustomerProfile[],
): CustomerProfile | undefined {

  return customers.find(
    (customer) =>
      customer.kyc.pan?.documentNumber === pan,
  );

}
