/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER ID GENERATOR
   -----------------------------------------------------------
   Module  : Customer
   Layer   : Utilities
   Version : 2.0
   Status  : Production
=========================================================== */

/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerIdConfiguration {
  businessCode: string;

  branchCode: string;

  startingSequence: number;
}

export interface CustomerIdResult {
  customerId: string;

  sequence: number;
}

/* ===========================================================
   CONSTANTS
=========================================================== */

const BRAND_PREFIX = "FIN";

const CUSTOMER_PREFIX = "CUS";

const SEQUENCE_LENGTH = 6;

/* ===========================================================
   FORMAT
=========================================================== */

function normalize(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function formatSequence(sequence: number): string {
  return sequence
    .toString()
    .padStart(SEQUENCE_LENGTH, "0");
}

/* ===========================================================
   GENERATE
=========================================================== */

export function generateCustomerId(
  config: CustomerIdConfiguration,
  existingCustomerIds: string[],
): CustomerIdResult {

  const businessCode = normalize(config.businessCode);

  const branchCode = normalize(config.branchCode);

  let sequence = config.startingSequence;

  while (true) {

    const customerId =
      `${BRAND_PREFIX}-${CUSTOMER_PREFIX}-${businessCode}-${branchCode}-${formatSequence(sequence)}`;

    if (!existingCustomerIds.includes(customerId)) {

      return {

        customerId,

        sequence,

      };

    }

    sequence++;

  }

}

/* ===========================================================
   VALIDATION
=========================================================== */

export function isCustomerIdUnique(
  customerId: string,
  existingCustomerIds: string[],
): boolean {

  return !existingCustomerIds.includes(customerId);

}

/* ===========================================================
   PREVIEW
=========================================================== */

export function previewCustomerId(
  businessCode: string,
  branchCode: string,
  sequence: number,
): string {

  return `${BRAND_PREFIX}-${CUSTOMER_PREFIX}-${normalize(
    businessCode,
  )}-${normalize(branchCode)}-${formatSequence(sequence)}`;

}
