// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// CUSTOMER NOTIFICATION RECIPIENT RESOLVER
//
// RESPONSIBILITY:
//
// - Load the authoritative Customer profile.
// - Resolve customer delivery contacts.
// - Preserve separate SMS / WhatsApp / Email identities.
// - Apply canonical WhatsApp-to-mobile fallback.
// - Expose preferred language for content generation.
//
// IMPORTANT:
//
// - CustomerRepository is the only Customer data source.
// - No Loan cached phone number is authoritative here.
// - No provider calls.
// - No Notification persistence.
// - No channel enable/disable preferences.
// - No provider secrets.
// - No retry logic.
// - No UI.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import {
  customerRepository,
} from "../../../repositories/customer/customerRepository";

import type {
  CustomerBasicInformation,
} from "../../../types/customers/customer.basic.types";

import type {
  NotificationDeliveryRecipient,
} from "../../../types/notifications/notification.types";

/* ============================================================
   RESULT
============================================================ */

export type CustomerNotificationRecipientResolution =
  | {
      success: true;

      recipient: NotificationDeliveryRecipient;

      preferredLanguage:
        CustomerBasicInformation["preferredLanguage"];
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   NORMALIZE STRING
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   RESOLVER
============================================================ */

export class CustomerNotificationRecipientResolver {
  async resolve(
    customerId: string,
  ): Promise<CustomerNotificationRecipientResolution> {
    const normalizedCustomerId =
      normalizeString(customerId);

    if (!normalizedCustomerId) {
      return {
        success: false,

        error:
          "Customer ID is required for Notification recipient resolution.",
      };
    }

    /* --------------------------------------------------------
       AUTHORITATIVE CUSTOMER LOAD
    -------------------------------------------------------- */

    const customerResult =
      await customerRepository.findById(
        normalizedCustomerId,
      );

    if (!customerResult.success) {
      return {
        success: false,

        error:
          customerResult.error ??
          "Unable to load Customer for Notification recipient resolution.",
      };
    }

    const customer =
      customerResult.data;

    if (!customer) {
      return {
        success: false,

        error:
          `Customer ${normalizedCustomerId} was not found for Notification recipient resolution.`,
      };
    }

    /* --------------------------------------------------------
       IDENTITY CONSISTENCY
    -------------------------------------------------------- */

    const authoritativeCustomerId =
      normalizeString(
        customer.identity.customerId,
      );

    if (
      authoritativeCustomerId !==
      normalizedCustomerId
    ) {
      return {
        success: false,

        error:
          `Customer identity mismatch while resolving Notification recipient ${normalizedCustomerId}.`,
      };
    }

    /* --------------------------------------------------------
       CANONICAL BASIC CONTACTS
    -------------------------------------------------------- */

    const mobileNumber =
      normalizeString(
        customer.basic.mobileNumber,
      );

    const explicitWhatsappNumber =
      normalizeString(
        customer.basic.whatsappNumber,
      );

    const whatsappNumber =
      explicitWhatsappNumber ||
      mobileNumber;

    const emailAddress =
      normalizeString(
        customer.basic.email,
      );

    const customerName =
      normalizeString(
        customer.basic.fullName,
      ) ||
      normalizeString(
        customer.basic.displayName,
      );

    /* --------------------------------------------------------
       RESOLVED RECIPIENT

       Missing individual channels are intentionally preserved
       as absent values.

       NotificationDeliveryService owns channel-specific
       recipient validation and SKIPPED lifecycle persistence.
    -------------------------------------------------------- */

    const recipient: NotificationDeliveryRecipient = {
      customerId:
        authoritativeCustomerId,

      ...(customerName
        ? {
            customerName,
          }
        : {}),

      ...(mobileNumber
        ? {
            phoneNumber:
              mobileNumber,
          }
        : {}),

      ...(whatsappNumber
        ? {
            whatsappNumber,
          }
        : {}),

      ...(emailAddress
        ? {
            emailAddress,
          }
        : {}),
    };

    return {
      success: true,

      recipient,

      preferredLanguage:
        customer.basic.preferredLanguage,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const customerNotificationRecipientResolver =
  new CustomerNotificationRecipientResolver();

/* ============================================================
   END
============================================================ */
