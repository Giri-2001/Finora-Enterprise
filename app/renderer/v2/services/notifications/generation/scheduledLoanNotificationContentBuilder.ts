// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// SCHEDULED LOAN NOTIFICATION CONTENT BUILDER
//
// RESPONSIBILITY:
//
// - Build Owner in-app scheduled Loan reminder content.
// - Build Customer scheduled Loan reminder content.
// - Respect authoritative Customer preferred language.
// - Support Telugu / English / Hindi / Tamil / Kannada / Marathi.
// - Explicitly fall back to English for Other / unsupported values.
// - Keep content generation independent from delivery providers.
//
// IMPORTANT:
//
// - PURE CONTENT LOGIC ONLY.
// - No storage access.
// - No provider calls.
// - No Notification persistence.
// - No Delivery persistence.
// - No scheduler execution.
// - No retry logic.
// - No UI.
// - No rule-basis dependency.
// - No cached Loan contact details.
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

import type {
  NotificationEventType,
} from "../../../types/notifications/notification.types";

/* ============================================================
   EVENT TYPE
============================================================ */

export type ScheduledLoanNotificationContentEventType =
  Extract<
    NotificationEventType,
    "LOAN_DUE" | "LOAN_OVERDUE" | "LOAN_MATURITY"
  >;

/* ============================================================
   LANGUAGE
============================================================ */

export type CustomerPreferredLanguage =
  CustomerBasicInformation["preferredLanguage"];

export type SupportedNotificationLanguage =
  Exclude<CustomerPreferredLanguage, "Other">;

/* ============================================================
   INPUT
============================================================ */

export interface ScheduledLoanNotificationContentInput {
  eventType:
    ScheduledLoanNotificationContentEventType;

  customerId: string;

  customerName?: string;

  loanNumber?: string;

  dueAt: string;

  loanOutstanding: number;

  installmentRemainingTotal: number;

  preferredLanguage:
    CustomerPreferredLanguage;
}

/* ============================================================
   CONTENT
============================================================ */

export interface NotificationMessageContent {
  title: string;

  message: string;
}

export interface CustomerNotificationMessageContent
  extends NotificationMessageContent {
  requestedLanguage:
    CustomerPreferredLanguage;

  resolvedLanguage:
    SupportedNotificationLanguage;

  usedLanguageFallback: boolean;
}

export interface ScheduledLoanNotificationContent {
  owner: NotificationMessageContent;

  customer:
    CustomerNotificationMessageContent;
}

/* ============================================================
   BUILD RESULT
============================================================ */

export type ScheduledLoanNotificationContentBuildResult =
  | {
      success: true;

      content:
        ScheduledLoanNotificationContent;
    }
  | {
      success: false;

      error: string;
    };

export type ScheduledLoanOwnerNotificationContentBuildResult =
  | {
      success: true;

      content:
        NotificationMessageContent;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   CANONICAL VALUES
============================================================ */

const VALID_EVENTS:
  readonly ScheduledLoanNotificationContentEventType[] = [
    "LOAN_DUE",
    "LOAN_OVERDUE",
    "LOAN_MATURITY",
  ];

const SUPPORTED_LANGUAGES:
  readonly SupportedNotificationLanguage[] = [
    "Telugu",
    "English",
    "Hindi",
    "Tamil",
    "Kannada",
    "Marathi",
  ];

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   MONEY
============================================================ */

function parseNonNegativeNumber(
  value: unknown,
): number | undefined {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return undefined;
  }

  return parsed;
}

function formatAmount(
  value: number,
): string {
  const formatted =
    new Intl.NumberFormat(
      "en-IN",
      {
        minimumFractionDigits: 0,

        maximumFractionDigits: 2,
      },
    ).format(value);

  return `₹${formatted}`;
}

/* ============================================================
   BUSINESS-LOCAL DATE DISPLAY
============================================================ */

function formatBusinessLocalDate(
  value: string,
): string | undefined {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return undefined;
  }

  const dateOnlyMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalized,
    );

  let year: number;
  let month: number;
  let day: number;

  if (dateOnlyMatch) {
    year =
      Number(dateOnlyMatch[1]);

    month =
      Number(dateOnlyMatch[2]);

    day =
      Number(dateOnlyMatch[3]);

    const validationDate =
      new Date(
        year,
        month - 1,
        day,
      );

    if (
      validationDate.getFullYear() !== year ||
      validationDate.getMonth() !== month - 1 ||
      validationDate.getDate() !== day
    ) {
      return undefined;
    }
  } else {
    const date =
      new Date(normalized);

    if (!Number.isFinite(date.getTime())) {
      return undefined;
    }

    year =
      date.getFullYear();

    month =
      date.getMonth() + 1;

    day =
      date.getDate();
  }

  const dayText =
    String(day).padStart(2, "0");

  const monthText =
    String(month).padStart(2, "0");

  return `${dayText}-${monthText}-${year}`;
}

/* ============================================================
   LANGUAGE RESOLUTION
============================================================ */

function resolveLanguage(
  preferredLanguage:
    CustomerPreferredLanguage,
): {
  resolvedLanguage:
    SupportedNotificationLanguage;

  usedLanguageFallback: boolean;
} {
  if (
    SUPPORTED_LANGUAGES.includes(
      preferredLanguage as
        SupportedNotificationLanguage,
    )
  ) {
    return {
      resolvedLanguage:
        preferredLanguage as
          SupportedNotificationLanguage,

      usedLanguageFallback: false,
    };
  }

  return {
    resolvedLanguage:
      "English",

    usedLanguageFallback: true,
  };
}

/* ============================================================
   OWNER CONTENT
============================================================ */

function buildOwnerContent(
  eventType:
    ScheduledLoanNotificationContentEventType,

  customerLabel: string,

  loanLabel: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (eventType) {
    case "LOAN_DUE":
      return {
        title:
          "Loan payment due today",

        message:
          `${customerLabel} - ${loanLabel}: ` +
          `${dueAmountLabel} is due today (${dateLabel}). ` +
          `Outstanding: ${outstandingLabel}.`,
      };

    case "LOAN_OVERDUE":
      return {
        title:
          "Loan payment overdue",

        message:
          `${customerLabel} - ${loanLabel}: ` +
          `${dueAmountLabel} is overdue since ${dateLabel}. ` +
          `Outstanding: ${outstandingLabel}.`,
      };

    case "LOAN_MATURITY":
      return {
        title:
          "Loan maturity today",

        message:
          `${customerLabel} - ${loanLabel} matures today ` +
          `(${dateLabel}). Outstanding: ${outstandingLabel}.`,
      };
  }
}

/* ============================================================
   CUSTOMER - ENGLISH
============================================================ */

function buildEnglishCustomerContent(
  eventType:
    ScheduledLoanNotificationContentEventType,

  loanReference: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (eventType) {
    case "LOAN_DUE":
      return {
        title:
          "Loan payment due today",

        message:
          `Your FINORA loan${loanReference} has ` +
          `${dueAmountLabel} due today (${dateLabel}). ` +
          `Outstanding balance: ${outstandingLabel}.`,
      };

    case "LOAN_OVERDUE":
      return {
        title:
          "Loan payment overdue",

        message:
          `Your FINORA loan${loanReference} has ` +
          `${dueAmountLabel} overdue since ${dateLabel}. ` +
          `Outstanding balance: ${outstandingLabel}.`,
      };

    case "LOAN_MATURITY":
      return {
        title:
          "Loan maturity today",

        message:
          `Your FINORA loan${loanReference} reaches maturity ` +
          `today (${dateLabel}). Outstanding balance: ` +
          `${outstandingLabel}.`,
      };
  }
}

/* ============================================================
   CUSTOMER - TELUGU
============================================================ */

function buildTeluguCustomerContent(
  eventType:
    ScheduledLoanNotificationContentEventType,

  loanReference: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (eventType) {
    case "LOAN_DUE":
      return {
        title:
          "రుణ చెల్లింపు గడువు ఈరోజు",

        message:
          `మీ FINORA రుణం${loanReference}కు ${dueAmountLabel} ` +
          `ఈరోజు (${dateLabel}) చెల్లించాలి. ` +
          `మిగిలిన బకాయి: ${outstandingLabel}.`,
      };

    case "LOAN_OVERDUE":
      return {
        title:
          "రుణ చెల్లింపు గడువు దాటింది",

        message:
          `మీ FINORA రుణం${loanReference}కు ${dueAmountLabel} ` +
          `${dateLabel} నుండి గడువు దాటింది. ` +
          `మిగిలిన బకాయి: ${outstandingLabel}.`,
      };

    case "LOAN_MATURITY":
      return {
        title:
          "రుణ ముగింపు గడువు ఈరోజు",

        message:
          `మీ FINORA రుణం${loanReference} ఈరోజు ` +
          `(${dateLabel}) ముగింపు గడువుకు చేరుకుంది. ` +
          `మిగిలిన బకాయి: ${outstandingLabel}.`,
      };
  }
}

/* ============================================================
   CUSTOMER - HINDI
============================================================ */

function buildHindiCustomerContent(
  eventType:
    ScheduledLoanNotificationContentEventType,

  loanReference: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (eventType) {
    case "LOAN_DUE":
      return {
        title:
          "ऋण भुगतान आज देय है",

        message:
          `आपके FINORA ऋण${loanReference} की ` +
          `${dueAmountLabel} राशि आज (${dateLabel}) देय है। ` +
          `शेष बकाया: ${outstandingLabel}।`,
      };

    case "LOAN_OVERDUE":
      return {
        title:
          "ऋण भुगतान अतिदेय है",

        message:
          `आपके FINORA ऋण${loanReference} की ` +
          `${dueAmountLabel} राशि ${dateLabel} से अतिदेय है। ` +
          `शेष बकाया: ${outstandingLabel}।`,
      };

    case "LOAN_MATURITY":
      return {
        title:
          "ऋण की परिपक्वता आज है",

        message:
          `आपका FINORA ऋण${loanReference} आज ` +
          `(${dateLabel}) परिपक्व हो रहा है। ` +
          `शेष बकाया: ${outstandingLabel}।`,
      };
  }
}

/* ============================================================
   CUSTOMER - TAMIL
============================================================ */

function buildTamilCustomerContent(
  eventType:
    ScheduledLoanNotificationContentEventType,

  loanReference: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (eventType) {
    case "LOAN_DUE":
      return {
        title:
          "கடன் கட்டணம் இன்று செலுத்த வேண்டும்",

        message:
          `உங்கள் FINORA கடன்${loanReference}க்கு ` +
          `${dueAmountLabel} இன்று (${dateLabel}) செலுத்த வேண்டும். ` +
          `மீதமுள்ள நிலுவை: ${outstandingLabel}.`,
      };

    case "LOAN_OVERDUE":
      return {
        title:
          "கடன் கட்டணம் காலாவதியானது",

        message:
          `உங்கள் FINORA கடன்${loanReference}க்கு ` +
          `${dueAmountLabel} ${dateLabel} முதல் காலதாமதமாக உள்ளது. ` +
          `மீதமுள்ள நிலுவை: ${outstandingLabel}.`,
      };

    case "LOAN_MATURITY":
      return {
        title:
          "கடன் முதிர்வு இன்று",

        message:
          `உங்கள் FINORA கடன்${loanReference} இன்று ` +
          `(${dateLabel}) முதிர்வு தேதியை அடைகிறது. ` +
          `மீதமுள்ள நிலுவை: ${outstandingLabel}.`,
      };
  }
}

/* ============================================================
   CUSTOMER - KANNADA
============================================================ */

function buildKannadaCustomerContent(
  eventType:
    ScheduledLoanNotificationContentEventType,

  loanReference: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (eventType) {
    case "LOAN_DUE":
      return {
        title:
          "ಸಾಲ ಪಾವತಿ ಇಂದು ಬಾಕಿಯಿದೆ",

        message:
          `ನಿಮ್ಮ FINORA ಸಾಲ${loanReference}ಕ್ಕೆ ` +
          `${dueAmountLabel} ಇಂದು (${dateLabel}) ಪಾವತಿಸಬೇಕಾಗಿದೆ. ` +
          `ಉಳಿದ ಬಾಕಿ: ${outstandingLabel}.`,
      };

    case "LOAN_OVERDUE":
      return {
        title:
          "ಸಾಲ ಪಾವತಿ ಅವಧಿ ಮೀರಿದೆ",

        message:
          `ನಿಮ್ಮ FINORA ಸಾಲ${loanReference}ಕ್ಕೆ ` +
          `${dueAmountLabel} ${dateLabel} ರಿಂದ ಅವಧಿ ಮೀರಿದೆ. ` +
          `ಉಳಿದ ಬಾಕಿ: ${outstandingLabel}.`,
      };

    case "LOAN_MATURITY":
      return {
        title:
          "ಸಾಲದ ಮುಕ್ತಾಯ ಗಡುವು ಇಂದು",

        message:
          `ನಿಮ್ಮ FINORA ಸಾಲ${loanReference} ಇಂದು ` +
          `(${dateLabel}) ಮುಕ್ತಾಯ ಗಡುವಿಗೆ ತಲುಪಿದೆ. ` +
          `ಉಳಿದ ಬಾಕಿ: ${outstandingLabel}.`,
      };
  }
}

/* ============================================================
   CUSTOMER - MARATHI
============================================================ */

function buildMarathiCustomerContent(
  eventType:
    ScheduledLoanNotificationContentEventType,

  loanReference: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (eventType) {
    case "LOAN_DUE":
      return {
        title:
          "कर्जाचा हप्ता आज देय आहे",

        message:
          `तुमच्या FINORA कर्ज${loanReference}ासाठी ` +
          `${dueAmountLabel} आज (${dateLabel}) देय आहे. ` +
          `उर्वरित थकबाकी: ${outstandingLabel}.`,
      };

    case "LOAN_OVERDUE":
      return {
        title:
          "कर्जाचा हप्ता थकीत आहे",

        message:
          `तुमच्या FINORA कर्ज${loanReference}ासाठी ` +
          `${dueAmountLabel} ${dateLabel} पासून थकीत आहे. ` +
          `उर्वरित थकबाकी: ${outstandingLabel}.`,
      };

    case "LOAN_MATURITY":
      return {
        title:
          "कर्जाची मुदत आज पूर्ण होते",

        message:
          `तुमच्या FINORA कर्ज${loanReference}ाची मुदत ` +
          `आज (${dateLabel}) पूर्ण होते. ` +
          `उर्वरित थकबाकी: ${outstandingLabel}.`,
      };
  }
}

/* ============================================================
   CUSTOMER CONTENT ROUTER
============================================================ */

function buildCustomerContent(
  language:
    SupportedNotificationLanguage,

  eventType:
    ScheduledLoanNotificationContentEventType,

  loanReference: string,

  dateLabel: string,

  dueAmountLabel: string,

  outstandingLabel: string,
): NotificationMessageContent {
  switch (language) {
    case "Telugu":
      return buildTeluguCustomerContent(
        eventType,
        loanReference,
        dateLabel,
        dueAmountLabel,
        outstandingLabel,
      );

    case "Hindi":
      return buildHindiCustomerContent(
        eventType,
        loanReference,
        dateLabel,
        dueAmountLabel,
        outstandingLabel,
      );

    case "Tamil":
      return buildTamilCustomerContent(
        eventType,
        loanReference,
        dateLabel,
        dueAmountLabel,
        outstandingLabel,
      );

    case "Kannada":
      return buildKannadaCustomerContent(
        eventType,
        loanReference,
        dateLabel,
        dueAmountLabel,
        outstandingLabel,
      );

    case "Marathi":
      return buildMarathiCustomerContent(
        eventType,
        loanReference,
        dateLabel,
        dueAmountLabel,
        outstandingLabel,
      );

    case "English":
      return buildEnglishCustomerContent(
        eventType,
        loanReference,
        dateLabel,
        dueAmountLabel,
        outstandingLabel,
      );
  }
}

/* ============================================================
   OWNER-ONLY BUILDER
============================================================ */

/**
 * Builds Owner Notification Center content independently from
 * Customer recipient / preferred-language resolution.
 *
 * This protects Owner operational reminders from Customer
 * delivery-data failures.
 */
export function buildScheduledLoanOwnerNotificationContent(
  input: Omit<
    ScheduledLoanNotificationContentInput,
    "preferredLanguage"
  >,
): ScheduledLoanOwnerNotificationContentBuildResult {
  if (
    !VALID_EVENTS.includes(
      input.eventType,
    )
  ) {
    return {
      success: false,

      error:
        "Scheduled Loan Notification event type is invalid.",
    };
  }

  const customerId =
    normalizeString(input.customerId);

  if (!customerId) {
    return {
      success: false,

      error:
        "Customer ID is required for scheduled Owner Loan Notification content.",
    };
  }

  const loanOutstanding =
    parseNonNegativeNumber(
      input.loanOutstanding,
    );

  if (loanOutstanding === undefined) {
    return {
      success: false,

      error:
        "Loan outstanding is invalid for scheduled Owner Loan Notification content.",
    };
  }

  const installmentRemainingTotal =
    parseNonNegativeNumber(
      input.installmentRemainingTotal,
    );

  if (
    installmentRemainingTotal ===
    undefined
  ) {
    return {
      success: false,

      error:
        "Installment remaining total is invalid for scheduled Owner Loan Notification content.",
    };
  }

  const dateLabel =
    formatBusinessLocalDate(
      input.dueAt,
    );

  if (!dateLabel) {
    return {
      success: false,

      error:
        "Due date is invalid for scheduled Owner Loan Notification content.",
    };
  }

  const customerName =
    normalizeString(
      input.customerName,
    );

  const loanNumber =
    normalizeString(
      input.loanNumber,
    );

  const customerLabel =
    customerName ||
    `Customer ${customerId}`;

  const loanLabel =
    loanNumber
      ? `Loan ${loanNumber}`
      : "Loan";

  const dueAmount =
    installmentRemainingTotal > 0
      ? installmentRemainingTotal
      : loanOutstanding;

  const owner =
    buildOwnerContent(
      input.eventType,
      customerLabel,
      loanLabel,
      dateLabel,
      formatAmount(dueAmount),
      formatAmount(loanOutstanding),
    );

  return {
    success: true,

    content: owner,
  };
}

/* ============================================================
   BUILDER
============================================================ */

export function buildScheduledLoanNotificationContent(
  input:
    ScheduledLoanNotificationContentInput,
): ScheduledLoanNotificationContentBuildResult {
  if (
    !VALID_EVENTS.includes(
      input.eventType,
    )
  ) {
    return {
      success: false,

      error:
        "Scheduled Loan Notification event type is invalid.",
    };
  }

  const customerId =
    normalizeString(input.customerId);

  if (!customerId) {
    return {
      success: false,

      error:
        "Customer ID is required for scheduled Loan Notification content.",
    };
  }

  const loanOutstanding =
    parseNonNegativeNumber(
      input.loanOutstanding,
    );

  if (loanOutstanding === undefined) {
    return {
      success: false,

      error:
        "Loan outstanding is invalid for scheduled Loan Notification content.",
    };
  }

  const installmentRemainingTotal =
    parseNonNegativeNumber(
      input.installmentRemainingTotal,
    );

  if (
    installmentRemainingTotal ===
    undefined
  ) {
    return {
      success: false,

      error:
        "Installment remaining total is invalid for scheduled Loan Notification content.",
    };
  }

  const dateLabel =
    formatBusinessLocalDate(
      input.dueAt,
    );

  if (!dateLabel) {
    return {
      success: false,

      error:
        "Due date is invalid for scheduled Loan Notification content.",
    };
  }

  const customerName =
    normalizeString(
      input.customerName,
    );

  const loanNumber =
    normalizeString(
      input.loanNumber,
    );

  const customerLabel =
    customerName ||
    `Customer ${customerId}`;

  const loanLabel =
    loanNumber
      ? `Loan ${loanNumber}`
      : "Loan";

  const loanReference =
    loanNumber
      ? ` ${loanNumber}`
      : "";

  const dueAmount =
    installmentRemainingTotal > 0
      ? installmentRemainingTotal
      : loanOutstanding;

  const dueAmountLabel =
    formatAmount(dueAmount);

  const outstandingLabel =
    formatAmount(
      loanOutstanding,
    );

  const language =
    resolveLanguage(
      input.preferredLanguage,
    );

  const owner =
    buildOwnerContent(
      input.eventType,
      customerLabel,
      loanLabel,
      dateLabel,
      dueAmountLabel,
      outstandingLabel,
    );

  const customerBase =
    buildCustomerContent(
      language.resolvedLanguage,
      input.eventType,
      loanReference,
      dateLabel,
      dueAmountLabel,
      outstandingLabel,
    );

  return {
    success: true,

    content: {
      owner,

      customer: {
        ...customerBase,

        requestedLanguage:
          input.preferredLanguage,

        resolvedLanguage:
          language.resolvedLanguage,

        usedLanguageFallback:
          language.usedLanguageFallback,
      },
    },
  };
}

/* ============================================================
   END
============================================================ */
