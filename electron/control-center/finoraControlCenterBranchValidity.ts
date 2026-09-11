/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER — BRANCH VALIDITY ENGINE

   MODULE  : Control Center
   LAYER   : Pure Domain Helper
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Derive expiry state from exact signed validUntil timestamp
   - Derive remaining duration at read/render time
   - Never persist or decrement a "days remaining" counter
   - Keep validity independent from Business Date

   EXAMPLE:

   A 365-day grant observed exactly 10 full days later naturally
   reports 355 remaining days without any background mutation.
============================================================ */

// ============================================================
// CONSTANTS
// ============================================================

const FINORA_MILLISECONDS_PER_DAY =
  86_400_000;

// ============================================================
// RESULT
// ============================================================

export interface FinoraControlCenterBranchValidityView {

  expired:
    boolean;

  remainingDays:
    number;

  remainingMilliseconds:
    number;

  observedAt:
    string;

  validUntil:
    string;
}

// ============================================================
// CANONICAL TIMESTAMP
// ============================================================

function parseCanonicalTimestamp(
  value:
    string,
  fieldName:
    string,
): number {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    throw new Error(
      `FINORA ${fieldName} timestamp is required.`,
    );
  }

  const milliseconds =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      milliseconds,
    ) ||
    new Date(
      milliseconds,
    ).toISOString() !==
      value
  ) {
    throw new Error(
      `FINORA ${fieldName} timestamp must be canonical ISO-8601 UTC.`,
    );
  }

  return milliseconds;
}

// ============================================================
// DERIVE VALIDITY
// ============================================================

export function calculateFinoraControlCenterBranchValidity(
  validUntil:
    string,
  now:
    Date = new Date(),
): FinoraControlCenterBranchValidityView {

  const validUntilMilliseconds =
    parseCanonicalTimestamp(
      validUntil,
      "branch validUntil",
    );

  const nowMilliseconds =
    now.getTime();

  if (
    !Number.isFinite(
      nowMilliseconds,
    )
  ) {
    throw new Error(
      "FINORA branch validity observation time is invalid.",
    );
  }

  const remainingMilliseconds =
    Math.max(
      0,
      validUntilMilliseconds -
        nowMilliseconds,
    );

  const expired =
    nowMilliseconds >=
      validUntilMilliseconds;

  /*
   * UI rule:
   *
   * Any positive partial day counts as one remaining day.
   * At exact expiry the value becomes zero.
   *
   * We derive this every time from validUntil. No countdown
   * state is persisted and no daily background write exists.
   */
  const remainingDays =
    remainingMilliseconds ===
      0
      ? 0
      : Math.ceil(
          remainingMilliseconds /
            FINORA_MILLISECONDS_PER_DAY,
        );

  return {
    expired,

    remainingDays,

    remainingMilliseconds,

    observedAt:
      now.toISOString(),

    validUntil,
  };
}

// ============================================================
// END
// ============================================================