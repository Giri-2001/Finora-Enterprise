// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS CURRENCY CONSTANTS
//
// RESPONSIBILITY:
//
// - Define currently supported Business Settings currencies
// - Define the default Business Settings currency
// - Provide one shared currency-policy authority for
//   Business service and Enterprise Settings UI
//
// IMPORTANT:
//
// - No currency formatting.
// - No currency symbols.
// - No UI labels.
// - No React.
// - No persistence.
// - No repository access.
// - No responsive values.
// - No theme values.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// SUPPORTED CURRENCIES
// ============================================================

export const SUPPORTED_BUSINESS_CURRENCIES = [
  "INR",
  "USD",
] as const;

// ============================================================
// CURRENCY TYPE
// ============================================================

export type SupportedBusinessCurrency =
  typeof SUPPORTED_BUSINESS_CURRENCIES[number];

// ============================================================
// DEFAULT
// ============================================================

export const DEFAULT_BUSINESS_CURRENCY:
  SupportedBusinessCurrency =
    "INR";

// ============================================================
// SUPPORT CHECK
// ============================================================

export function isSupportedBusinessCurrency(
  value:
    string,
): value is SupportedBusinessCurrency {

  return (
    SUPPORTED_BUSINESS_CURRENCIES as readonly string[]
  ).includes(
    value,
  );
}

// ============================================================
// END
// ============================================================
