// ============================================================
// FINORA ENTERPRISE OS(TM)
//
// V2 BUSINESS DOMAIN
// BUSINESS TIME ZONE CONSTANTS
//
// RESPONSIBILITY:
//
// - Expose runtime-supported IANA business time zones
// - Validate persisted IANA business time-zone identifiers
// - Resolve the device time zone only as an initial UI default
//
// IMPORTANT:
//
// - No hardcoded regional time zone.
// - Device time zone is NOT scheduler authority.
// - Scheduler authority must come from persisted Business Settings.
// - No persistence.
// - No repository access.
// - No React.
// - No UI labels.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// CURATED BUSINESS TIME ZONE OPTIONS
//
// These are the primary FINORA UI choices.
//
// IMPORTANT:
//
// - This list limits UI complexity only.
// - Runtime validation still accepts any valid IANA time zone.
// - Persisted values remain standard IANA identifiers.
// ============================================================

export const BUSINESS_TIME_ZONE_OPTIONS = [
  {
    label: "India",
    value: "Asia/Kolkata",
  },

  {
    label: "UAE",
    value: "Asia/Dubai",
  },

  {
    label: "United Kingdom",
    value: "Europe/London",
  },

  {
    label: "USA Eastern",
    value: "America/New_York",
  },

  {
    label: "Singapore",
    value: "Asia/Singapore",
  },
] as const;

// ============================================================
// SUPPORTED TIME ZONES
// ============================================================

export function getSupportedBusinessTimeZones():
  readonly string[] {

  try {
    return Intl.supportedValuesOf(
      "timeZone",
    );
  } catch {
    return [];
  }
}

// ============================================================
// VALIDATION
// ============================================================

export function isSupportedBusinessTimeZone(
  value:
    string,
): boolean {

  const normalized =
    value?.trim();

  if (!normalized) {
    return false;
  }

  try {
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          normalized,
      },
    ).format(
      new Date(),
    );

    return true;
  } catch {
    return false;
  }
}

// ============================================================
// DEVICE DEFAULT
// ============================================================

/**
 * Resolve the current device/browser IANA time zone.
 *
 * This may be used only to prefill a new Business Settings
 * form. It must not be used by the scheduler as an implicit
 * fallback when persisted business time-zone configuration
 * is missing or invalid.
 */
export function getDeviceBusinessTimeZone():
  string | null {

  try {
    const timeZone =
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone
        ?.trim();

    if (
      !timeZone ||
      !isSupportedBusinessTimeZone(
        timeZone,
      )
    ) {
      return null;
    }

    return timeZone;
  } catch {
    return null;
  }
}

// ============================================================
// END
// ============================================================
