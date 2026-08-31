// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// RESEND EMAIL PROVIDER
//
// RESPONSIBILITY:
//
// - Execute privileged Email delivery through Resend.
// - Read credentials only from the encrypted provider store.
// - Use FINORA Delivery identity as Resend idempotency key.
// - Normalize provider outcomes for the renderer Delivery Engine.
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - API keys never cross to the renderer.
// - Raw provider error payloads never cross to the renderer.
// - No plaintext credential persistence.
// - No fake success.
//
// IMPORTANT:
//
// - No React.
// - No renderer storage.
// - No Notification persistence.
// - No retry scheduling.
// - No Delivery lifecycle mutation.
// ============================================================

import {
  findFinoraNotificationProviderConfiguration,
} from "../finoraNotificationProviderConfigStore.js";

import type {
  FinoraNotificationProviderAdapter,
  FinoraNotificationProviderSendOutcome,
  FinoraNotificationProviderSendRequest,
} from "../finoraNotificationProvider.types.js";

/* ============================================================
   PROVIDER IDENTITY
============================================================ */

export const RESEND_EMAIL_PROVIDER_ID =
  "RESEND_EMAIL" as const;

export const RESEND_EMAIL_SETTING_API_KEY =
  "apiKey" as const;

export const RESEND_EMAIL_SETTING_FROM =
  "from" as const;

/* ============================================================
   API
============================================================ */

const RESEND_EMAIL_API_URL =
  "https://api.resend.com/emails";

const RESEND_IDEMPOTENCY_KEY_MAX_LENGTH =
  256;

/* ============================================================
   INTERNAL CONFIG
============================================================ */

interface ResendEmailConfiguration {
  apiKey:
    string;

  from:
    string;
}

async function loadResendEmailConfiguration():
  Promise<ResendEmailConfiguration | undefined> {
  const result =
    await findFinoraNotificationProviderConfiguration(
      "EMAIL",
    );

  if (
    !result.success ||
    !result.data ||
    result.data.providerId !==
      RESEND_EMAIL_PROVIDER_ID
  ) {
    return undefined;
  }

  const apiKey =
    result.data.settings[
      RESEND_EMAIL_SETTING_API_KEY
    ]?.trim();

  const from =
    result.data.settings[
      RESEND_EMAIL_SETTING_FROM
    ]?.trim();

  if (
    !apiKey ||
    !from
  ) {
    return undefined;
  }

  return {
    apiKey,
    from,
  };
}

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(value)
  );
}

async function readProviderResponsePayload(
  response:
    Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function readProviderMessageId(
  payload:
    unknown,
): string | undefined {
  if (
    !isRecord(payload) ||
    typeof payload.id !==
      "string"
  ) {
    return undefined;
  }

  const id =
    payload.id.trim();

  return id.length > 0
    ? id
    : undefined;
}

function readProviderErrorName(
  payload:
    unknown,
): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const possibleName =
    payload.name;

  if (
    typeof possibleName !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    possibleName.trim();

  return normalized.length > 0
    ? normalized
    : undefined;
}

/* ============================================================
   OUTCOME HELPERS
============================================================ */

function failure(
  retryable:
    boolean,
  failureCode:
    string,
  failureMessage:
    string,
): FinoraNotificationProviderSendOutcome {
  return {
    success:
      false,

    retryable,

    failureCode,

    failureMessage,
  };
}

function normalizeRejectedResponse(
  status:
    number,
  errorName:
    string | undefined,
): FinoraNotificationProviderSendOutcome {
  if (
    status === 408
  ) {
    return failure(
      true,
      "PROVIDER_REQUEST_TIMEOUT",
      "Email provider request timed out.",
    );
  }

  if (
    status === 409
  ) {
    if (
      errorName ===
        "concurrent_idempotent_requests" ||
      errorName ===
        "resource_locked"
    ) {
      return failure(
        true,
        "PROVIDER_CONCURRENT_REQUEST",
        "Email provider request is temporarily locked.",
      );
    }

    return failure(
      false,
      "PROVIDER_IDEMPOTENCY_CONFLICT",
      "Email provider rejected the delivery identity.",
    );
  }

  if (
    status === 429
  ) {
    if (
      errorName ===
        "daily_quota_exceeded" ||
      errorName ===
        "monthly_quota_exceeded"
    ) {
      return failure(
        false,
        "PROVIDER_QUOTA_EXCEEDED",
        "Email provider sending quota is exhausted.",
      );
    }

    return failure(
      true,
      "PROVIDER_RATE_LIMITED",
      "Email provider temporarily rate limited the request.",
    );
  }

  if (
    status >= 500
  ) {
    return failure(
      true,
      "PROVIDER_UNAVAILABLE",
      "Email provider is temporarily unavailable.",
    );
  }

  if (
    status === 401 ||
    status === 403
  ) {
    return failure(
      false,
      "PROVIDER_AUTHORIZATION_FAILED",
      "Email provider authorization or sender configuration was rejected.",
    );
  }

  if (
    status === 400 ||
    status === 422
  ) {
    return failure(
      false,
      "PROVIDER_REQUEST_REJECTED",
      "Email provider rejected the outbound request.",
    );
  }

  return failure(
    false,
    "PROVIDER_REQUEST_FAILED",
    "Email provider rejected the outbound request.",
  );
}

/* ============================================================
   PROVIDER
============================================================ */

export const resendEmailNotificationProvider:
  FinoraNotificationProviderAdapter = {
  channel:
    "EMAIL",

  async isConfigured():
    Promise<boolean> {
    try {
      return Boolean(
        await loadResendEmailConfiguration(),
      );
    } catch {
      return false;
    }
  },

  async send(
    request:
      FinoraNotificationProviderSendRequest,
  ): Promise<
    FinoraNotificationProviderSendOutcome
  > {
    if (
      request.channel !==
      "EMAIL"
    ) {
      return failure(
        false,
        "PROVIDER_CHANNEL_MISMATCH",
        "Email provider received a non-Email request.",
      );
    }

    const recipient =
      request.emailAddress?.trim();

    if (!recipient) {
      return failure(
        false,
        "PROVIDER_RECIPIENT_MISSING",
        "A customer email address is required.",
      );
    }

    const deliveryId =
      request.deliveryId.trim();

    if (
      !deliveryId ||
      deliveryId.length >
        RESEND_IDEMPOTENCY_KEY_MAX_LENGTH
    ) {
      return failure(
        false,
        "PROVIDER_IDEMPOTENCY_KEY_INVALID",
        "The delivery identity is invalid for the Email provider.",
      );
    }

    const configuration =
      await loadResendEmailConfiguration();

    if (!configuration) {
      return failure(
        false,
        "CHANNEL_NOT_CONFIGURED",
        "Email provider is not configured.",
      );
    }

    let response:
      Response;

    try {
      response =
        await fetch(
          RESEND_EMAIL_API_URL,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${configuration.apiKey}`,

              "Content-Type":
                "application/json",

              "Idempotency-Key":
                deliveryId,

              "User-Agent":
                "FINORA-Enterprise/1.0",
            },

            body:
              JSON.stringify({
                from:
                  configuration.from,

                to:
                  [recipient],

                subject:
                  request.title,

                text:
                  request.message,
              }),
          },
        );
    } catch {
      return failure(
        true,
        "PROVIDER_NETWORK_ERROR",
        "Email provider could not be reached.",
      );
    }

    const payload =
      await readProviderResponsePayload(
        response,
      );

    if (!response.ok) {
      return normalizeRejectedResponse(
        response.status,
        readProviderErrorName(
          payload,
        ),
      );
    }

    return {
      success:
        true,

      providerMessageId:
        readProviderMessageId(
          payload,
        ),

      acceptedAt:
        new Date().toISOString(),
    };
  },
};

/* ============================================================
   END
============================================================ */