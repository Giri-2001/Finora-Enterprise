// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// CUSTOMER CREATED NOTIFICATION CONTENT BUILDER
//
// RESPONSIBILITY:
//
// - Build canonical Customer-created welcome content.
// - Use a business-local calendar date supplied by orchestration.
// - Preserve the Customer requested language.
// - Explicitly resolve current approved welcome copy to English.
// - Keep content generation independent from providers.
//
// IMPORTANT:
//
// - PURE CONTENT LOGIC ONLY.
// - No storage access.
// - No provider calls.
// - No Notification persistence.
// - No Delivery persistence.
// - No scheduler execution.
// - No device-local date conversion.
// - No UI.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  CustomerBasicInformation,
} from "../../../types/customers/customer.basic.types";

/* ============================================================
   LANGUAGE
============================================================ */

export type CustomerCreatedPreferredLanguage =
  CustomerBasicInformation["preferredLanguage"];

export type CustomerCreatedResolvedLanguage =
  "English";

/* ============================================================
   INPUT
============================================================ */

export interface CustomerCreatedNotificationContentInput {
  customerId: string;

  customerName: string;

  businessName: string;

  branchName: string;

  /**
   * Business-local calendar date in YYYY-MM-DD form.
   *
   * Orchestration must derive this from the persisted Customer
   * createdAt timestamp using the persisted Business time zone.
   */
  createdCalendarDate: string;

  preferredLanguage:
    CustomerCreatedPreferredLanguage;
}

/* ============================================================
   CONTENT
============================================================ */

export interface CustomerCreatedNotificationContent {
  title: string;

  /**
   * Canonical approved SMS-safe welcome copy.
   *
   * WhatsApp and Email provider templates may use the same
   * structured semantic variables later without parsing this text.
   */
  message: string;

  requestedLanguage:
    CustomerCreatedPreferredLanguage;

  resolvedLanguage:
    CustomerCreatedResolvedLanguage;

  usedLanguageFallback: boolean;

  createdDateDisplay: string;
}

/* ============================================================
   RESULT
============================================================ */

export type CustomerCreatedNotificationContentBuildResult =
  | {
      success: true;

      content:
        CustomerCreatedNotificationContent;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   BUSINESS-LOCAL DATE DISPLAY
============================================================ */

function formatBusinessLocalCalendarDate(
  value: string,
): string | undefined {
  const normalized =
    normalizeString(value);

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalized,
    );

  if (!match) {
    return undefined;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const validationDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    return undefined;
  }

  return [
    String(day).padStart(2, "0"),
    String(month).padStart(2, "0"),
    String(year),
  ].join("-");
}

/* ============================================================
   BUILDER
============================================================ */

export function buildCustomerCreatedNotificationContent(
  input:
    CustomerCreatedNotificationContentInput,
): CustomerCreatedNotificationContentBuildResult {
  const customerId =
    normalizeString(
      input.customerId,
    );

  const customerName =
    normalizeString(
      input.customerName,
    );

  const businessName =
    normalizeString(
      input.businessName,
    );

  const branchName =
    normalizeString(
      input.branchName,
    );

  if (!customerId) {
    return {
      success: false,

      error:
        "Customer ID is required for Customer-created Notification content.",
    };
  }

  if (!customerName) {
    return {
      success: false,

      error:
        "Customer name is required for Customer-created Notification content.",
    };
  }

  if (!businessName) {
    return {
      success: false,

      error:
        "Business name is required for Customer-created Notification content.",
    };
  }

  if (!branchName) {
    return {
      success: false,

      error:
        "Branch name is required for Customer-created Notification content.",
    };
  }

  const createdDateDisplay =
    formatBusinessLocalCalendarDate(
      input.createdCalendarDate,
    );

  if (!createdDateDisplay) {
    return {
      success: false,

      error:
        "Business-local Customer creation date is invalid.",
    };
  }

  const requestedLanguage =
    input.preferredLanguage;

  const resolvedLanguage:
    CustomerCreatedResolvedLanguage =
      "English";

  const usedLanguageFallback =
    requestedLanguage !==
    resolvedLanguage;

  return {
    success: true,

    content: {
      title:
        `Welcome to ${businessName}`,

      message:
        `Dear ${customerName}, welcome to ${businessName}. ` +
        `Your FINORA customer profile was created on ${createdDateDisplay}. ` +
        `Customer ID: ${customerId}. ` +
        `Branch: ${branchName}. ` +
        "Thank you.",

      requestedLanguage,

      resolvedLanguage,

      usedLanguageFallback,

      createdDateDisplay,
    },
  };
}

/* ============================================================
   END
============================================================ */