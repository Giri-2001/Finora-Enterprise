// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// MSG91 SMS PROVIDER
//
// RESPONSIBILITY:
//
// - Execute privileged SMS delivery through MSG91 Flow API.
// - Read credentials and Flow mappings from encrypted provider
//   configuration.
// - Convert canonical FINORA Indian mobile numbers into MSG91
//   international recipient format.
// - Map FINORA template keys to privileged MSG91 Flow IDs.
// - Normalize provider outcomes for the renderer Delivery Engine.
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - Auth keys never cross to the renderer.
// - MSG91 Flow IDs never cross to the renderer.
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
// - Rendered Notification text is never parsed for Flow values.
// ============================================================

import {
  findFinoraNotificationProviderConfiguration,
} from "../finoraNotificationProviderConfigStore.js";

import type {
  FinoraNotificationProviderAdapter,
  FinoraNotificationProviderSendOutcome,
  FinoraNotificationProviderSendRequest,
  FinoraNotificationProviderTemplateContext,
} from "../finoraNotificationProvider.types.js";

/* ============================================================
   PROVIDER IDENTITY
============================================================ */

export const MSG91_SMS_PROVIDER_ID =
  "MSG91_SMS" as const;

export const MSG91_SMS_SETTING_AUTH_KEY =
  "authKey" as const;

export const MSG91_SMS_SETTING_SENDER =
  "sender" as const;

/*
 * Flow mappings remain privileged.
 *
 * Example:
 *
 * flowId::SCHEDULED_LOAN::DUE::TELUGU
 *
 * Renderer code knows only the FINORA template key.
 */
export const MSG91_SMS_SETTING_FLOW_ID_PREFIX =
  "flowId::" as const;

/* ============================================================
   API
============================================================ */

const MSG91_SMS_API_URL =
  "https://control.msg91.com/api/v5/flow";

/* ============================================================
   MOBILE CONTRACT
============================================================ */

/*
 * Canonical FINORA Customer mobile data is intended to contain
 * a 10-digit Indian mobile number beginning with 6-9.
 *
 * The provider boundary validates again because persisted
 * Customer records cannot currently be assumed to have passed
 * Customer UI validation.
 */
const FINORA_INDIAN_MOBILE_PATTERN =
  /^[6-9]\d{9}$/;

const INDIA_COUNTRY_CODE =
  "91" as const;

/* ============================================================
   INTERNAL CONFIG
============================================================ */

interface Msg91SmsConfiguration {
  authKey:
    string;

  sender:
    string;

  flowIds:
    Record<string, string>;
}

async function loadMsg91SmsConfiguration():
  Promise<Msg91SmsConfiguration | undefined> {
  const result =
    await findFinoraNotificationProviderConfiguration(
      "SMS",
    );

  if (
    !result.success ||
    !result.data ||
    result.data.providerId !==
      MSG91_SMS_PROVIDER_ID
  ) {
    return undefined;
  }

  const authKey =
    result.data.settings[
      MSG91_SMS_SETTING_AUTH_KEY
    ]?.trim();

  const sender =
    result.data.settings[
      MSG91_SMS_SETTING_SENDER
    ]?.trim();

  if (
    !authKey ||
    !sender
  ) {
    return undefined;
  }

  const flowIds:
    Record<string, string> = {};

  for (
    const [
      settingKey,
      settingValue,
    ] of Object.entries(
      result.data.settings,
    )
  ) {
    if (
      !settingKey.startsWith(
        MSG91_SMS_SETTING_FLOW_ID_PREFIX,
      )
    ) {
      continue;
    }

    const templateKey =
      settingKey
        .slice(
          MSG91_SMS_SETTING_FLOW_ID_PREFIX.length,
        )
        .trim();

    const flowId =
      settingValue.trim();

    if (
      templateKey &&
      flowId
    ) {
      flowIds[
        templateKey
      ] =
        flowId;
    }
  }

  if (
    Object.keys(
      flowIds,
    ).length === 0
  ) {
    return undefined;
  }

  return {
    authKey,
    sender,
    flowIds,
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

function readProviderType(
  payload:
    unknown,
): string | undefined {
  if (
    !isRecord(payload) ||
    typeof payload.type !==
      "string"
  ) {
    return undefined;
  }

  const type =
    payload.type
      .trim()
      .toLowerCase();

  return type.length > 0
    ? type
    : undefined;
}

function readProviderMessageId(
  payload:
    unknown,
): string | undefined {
  if (
    !isRecord(payload) ||
    typeof payload.message !==
      "string"
  ) {
    return undefined;
  }

  const messageId =
    payload.message.trim();

  return messageId.length > 0
    ? messageId
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
): FinoraNotificationProviderSendOutcome {
  /*
   * MSG91 Flow does not expose a documented FINORA-compatible
   * idempotency contract.
   *
   * Therefore ambiguous timeout/server outcomes are not marked
   * retryable automatically because the SMS may already have
   * been accepted before the failure became observable.
   */

  if (
    status === 408
  ) {
    return failure(
      false,
      "PROVIDER_DELIVERY_STATE_UNKNOWN",
      "SMS provider timed out and delivery acceptance could not be confirmed.",
    );
  }

  if (
    status === 429
  ) {
    return failure(
      true,
      "PROVIDER_RATE_LIMITED",
      "SMS provider temporarily rate limited the request.",
    );
  }

  if (
    status >= 500
  ) {
    return failure(
      false,
      "PROVIDER_DELIVERY_STATE_UNKNOWN",
      "SMS provider failed before delivery acceptance could be confirmed.",
    );
  }

  if (
    status === 401 ||
    status === 403
  ) {
    return failure(
      false,
      "PROVIDER_AUTHORIZATION_FAILED",
      "SMS provider authorization or sender configuration was rejected.",
    );
  }

  if (
    status === 400 ||
    status === 404 ||
    status === 422
  ) {
    return failure(
      false,
      "PROVIDER_REQUEST_REJECTED",
      "SMS provider rejected the outbound request.",
    );
  }

  return failure(
    false,
    "PROVIDER_REQUEST_FAILED",
    "SMS provider rejected the outbound request.",
  );
}

/* ============================================================
   RECIPIENT NORMALIZATION
============================================================ */

function normalizeIndianMobileForMsg91(
  value:
    string | undefined,
): string | undefined {
  const normalized =
    value?.trim() ?? "";

  if (
    !FINORA_INDIAN_MOBILE_PATTERN.test(
      normalized,
    )
  ) {
    return undefined;
  }

  return (
    INDIA_COUNTRY_CODE +
    normalized
  );
}

/* ============================================================
   TEMPLATE CONTEXT
============================================================ */

interface ResolvedMsg91Template {
  templateKey:
    string;

  flowId:
    string;

  variables:
    Record<string, string>;
}

function normalizeTemplateVariables(
  context:
    FinoraNotificationProviderTemplateContext,
): Record<string, string> | undefined {
  const variables:
    Record<string, string> = {};

  for (
    const [
      rawKey,
      rawValue,
    ] of Object.entries(
      context.variables,
    )
  ) {
    const key =
      rawKey.trim();

    const value =
      rawValue.trim();

    if (
      !key ||
      !value
    ) {
      return undefined;
    }

    /*
     * MSG91 reserves "mobiles" inside each recipient object.
     * FINORA template variables may never override it.
     */
    if (
      key.toLowerCase() ===
        "mobiles"
    ) {
      return undefined;
    }

    variables[
      key
    ] =
      value;
  }

  return variables;
}

function resolveMsg91Template(
  request:
    FinoraNotificationProviderSendRequest,
  configuration:
    Msg91SmsConfiguration,
):
  | ResolvedMsg91Template
  | FinoraNotificationProviderSendOutcome {
  const context =
    request.templateContext;

  if (!context) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_CONTEXT_MISSING",
      "Structured SMS template context is required.",
    );
  }

  if (
    context.schemaVersion !==
      1
  ) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_CONTEXT_UNSUPPORTED",
      "SMS template context schema is not supported.",
    );
  }

  const templateKey =
    context.templateKey.trim();

  if (!templateKey) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_KEY_INVALID",
      "SMS template key is invalid.",
    );
  }

  const flowId =
    configuration.flowIds[
      templateKey
    ]?.trim();

  if (!flowId) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_NOT_CONFIGURED",
      "No SMS provider Flow is configured for this FINORA template.",
    );
  }

  const variables =
    normalizeTemplateVariables(
      context,
    );

  if (!variables) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_VARIABLES_INVALID",
      "SMS template variables are invalid.",
    );
  }

  return {
    templateKey,
    flowId,
    variables,
  };
}

function isResolvedMsg91Template(
  value:
    ResolvedMsg91Template |
    FinoraNotificationProviderSendOutcome,
): value is ResolvedMsg91Template {
  return (
    "flowId" in value &&
    "variables" in value
  );
}

/* ============================================================
   PROVIDER
============================================================ */

export const msg91SmsNotificationProvider:
  FinoraNotificationProviderAdapter = {
  channel:
    "SMS",

  async isConfigured():
    Promise<boolean> {
    try {
      return Boolean(
        await loadMsg91SmsConfiguration(),
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
      "SMS"
    ) {
      return failure(
        false,
        "PROVIDER_CHANNEL_MISMATCH",
        "SMS provider received a non-SMS request.",
      );
    }

    const recipient =
      normalizeIndianMobileForMsg91(
        request.phoneNumber,
      );

    if (!recipient) {
      return failure(
        false,
        "PROVIDER_RECIPIENT_INVALID",
        "A valid 10-digit Indian customer mobile number is required.",
      );
    }

    const configuration =
      await loadMsg91SmsConfiguration();

    if (!configuration) {
      return failure(
        false,
        "CHANNEL_NOT_CONFIGURED",
        "SMS provider is not configured.",
      );
    }

    const templateResult =
      resolveMsg91Template(
        request,
        configuration,
      );

    if (
      !isResolvedMsg91Template(
        templateResult,
      )
    ) {
      return templateResult;
    }

    /*
     * Rebuild the recipient variable object instead of trusting
     * renderer-owned object identity.
     *
     * "mobiles" is assigned last so template variables cannot
     * replace the provider recipient.
     */
    const providerRecipient:
      Record<string, string> = {
      ...templateResult.variables,

      mobiles:
        recipient,
    };

    let response:
      Response;

    try {
      response =
        await fetch(
          MSG91_SMS_API_URL,
          {
            method:
              "POST",

            headers: {
              accept:
                "application/json",

              authkey:
                configuration.authKey,

              "Content-Type":
                "application/json",

              "User-Agent":
                "FINORA-Enterprise/1.0",
            },

            body:
              JSON.stringify({
                flow_id:
                  templateResult.flowId,

                sender:
                  configuration.sender,

                recipients: [
                  providerRecipient,
                ],
              }),
          },
        );
    } catch {
      /*
       * Without documented provider idempotency an interrupted
       * request is ambiguous: it may have reached MSG91.
       *
       * Automatic retry could duplicate a customer SMS.
       */
      return failure(
        false,
        "PROVIDER_DELIVERY_STATE_UNKNOWN",
        "SMS provider connection failed and delivery acceptance could not be confirmed.",
      );
    }

    const payload =
      await readProviderResponsePayload(
        response,
      );

    if (!response.ok) {
      return normalizeRejectedResponse(
        response.status,
      );
    }

    const providerType =
      readProviderType(
        payload,
      );

    if (
      providerType !==
        "success"
    ) {
      return failure(
        false,
        "PROVIDER_REQUEST_REJECTED",
        "SMS provider rejected the outbound Flow request.",
      );
    }

    const providerMessageId =
      readProviderMessageId(
        payload,
      );

    /*
     * A success marker without the documented request identity
     * is treated as ambiguous rather than fabricating success.
     */
    if (!providerMessageId) {
      return failure(
        false,
        "PROVIDER_RESPONSE_AMBIGUOUS",
        "SMS provider response did not contain a confirmed request identity.",
      );
    }

    return {
      success:
        true,

      providerMessageId,

      acceptedAt:
        new Date().toISOString(),
    };
  },
};

/* ============================================================
   END
============================================================ */