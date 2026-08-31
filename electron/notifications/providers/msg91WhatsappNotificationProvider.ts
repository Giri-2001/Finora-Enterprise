// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// MSG91 WHATSAPP PROVIDER
//
// RESPONSIBILITY:
//
// - Execute privileged WhatsApp template delivery through MSG91.
// - Read credentials and approved template mappings only from
//   encrypted provider configuration.
// - Convert canonical FINORA Indian mobile numbers into MSG91
//   international recipient format.
// - Map FINORA template variables into approved WhatsApp body
//   component positions.
// - Normalize provider outcomes for the renderer Delivery Engine.
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - Auth keys never cross to the renderer.
// - Integrated WhatsApp number never crosses to the renderer.
// - Provider template names / namespaces never cross renderer.
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
// - Rendered title/message is never parsed.
// - CRQID is correlation metadata, not idempotency.
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

export const MSG91_WHATSAPP_PROVIDER_ID =
  "MSG91_WHATSAPP" as const;

export const MSG91_WHATSAPP_SETTING_AUTH_KEY =
  "authKey" as const;

export const MSG91_WHATSAPP_SETTING_INTEGRATED_NUMBER =
  "integratedNumber" as const;

/*
 * Each template mapping is stored as one encrypted JSON string:
 *
 * template::<FINORA_TEMPLATE_KEY>
 *
 * Example value:
 *
 * {
 *   "name": "finora_loan_due_te",
 *   "languageCode": "te",
 *   "namespace": "...",
 *   "bodyVariables": [
 *     "loanNumber",
 *     "dueAt",
 *     "dueAmount",
 *     "outstandingAmount"
 *   ]
 * }
 */
export const MSG91_WHATSAPP_SETTING_TEMPLATE_PREFIX =
  "template::" as const;

/* ============================================================
   API
============================================================ */

const MSG91_WHATSAPP_API_URL =
  "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

/* ============================================================
   MOBILE CONTRACT
============================================================ */

const FINORA_INDIAN_MOBILE_PATTERN =
  /^[6-9]\d{9}$/;

const INDIA_COUNTRY_CODE =
  "91" as const;

/* ============================================================
   INTERNAL CONFIG
============================================================ */

interface Msg91WhatsappTemplateConfiguration {
  name:
    string;

  languageCode:
    string;

  namespace:
    string;

  bodyVariables:
    string[];
}

interface Msg91WhatsappConfiguration {
  authKey:
    string;

  integratedNumber:
    string;

  templates:
    Record<
      string,
      Msg91WhatsappTemplateConfiguration
    >;
}

/* ============================================================
   BASIC HELPERS
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

function normalizeNonEmptyString(
  value:
    unknown,
): string | undefined {
  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : undefined;
}

/* ============================================================
   TEMPLATE CONFIG PARSER
============================================================ */

function parseTemplateConfiguration(
  value:
    string,
):
  | Msg91WhatsappTemplateConfiguration
  | undefined {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        value,
      );
  } catch {
    return undefined;
  }

  if (!isRecord(parsed)) {
    return undefined;
  }

  const name =
    normalizeNonEmptyString(
      parsed.name,
    );

  const languageCode =
    normalizeNonEmptyString(
      parsed.languageCode,
    );

  const namespace =
    normalizeNonEmptyString(
      parsed.namespace,
    );

  if (
    !name ||
    !languageCode ||
    !namespace ||
    !Array.isArray(
      parsed.bodyVariables,
    )
  ) {
    return undefined;
  }

  const bodyVariables:
    string[] = [];

  const seenVariables =
    new Set<string>();

  for (
    const rawVariable
    of parsed.bodyVariables
  ) {
    const variable =
      normalizeNonEmptyString(
        rawVariable,
      );

    if (
      !variable ||
      seenVariables.has(
        variable,
      )
    ) {
      return undefined;
    }

    seenVariables.add(
      variable,
    );

    bodyVariables.push(
      variable,
    );
  }

  return {
    name,
    languageCode,
    namespace,
    bodyVariables,
  };
}

/* ============================================================
   LOAD CONFIGURATION
============================================================ */

async function loadMsg91WhatsappConfiguration():
  Promise<Msg91WhatsappConfiguration | undefined> {
  const result =
    await findFinoraNotificationProviderConfiguration(
      "WHATSAPP",
    );

  if (
    !result.success ||
    !result.data ||
    result.data.providerId !==
      MSG91_WHATSAPP_PROVIDER_ID
  ) {
    return undefined;
  }

  const authKey =
    result.data.settings[
      MSG91_WHATSAPP_SETTING_AUTH_KEY
    ]?.trim();

  const integratedNumber =
    result.data.settings[
      MSG91_WHATSAPP_SETTING_INTEGRATED_NUMBER
    ]?.trim();

  if (
    !authKey ||
    !integratedNumber
  ) {
    return undefined;
  }

  const templates:
    Record<
      string,
      Msg91WhatsappTemplateConfiguration
    > = {};

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
        MSG91_WHATSAPP_SETTING_TEMPLATE_PREFIX,
      )
    ) {
      continue;
    }

    const templateKey =
      settingKey
        .slice(
          MSG91_WHATSAPP_SETTING_TEMPLATE_PREFIX.length,
        )
        .trim();

    if (!templateKey) {
      return undefined;
    }

    const template =
      parseTemplateConfiguration(
        settingValue,
      );

    if (!template) {
      return undefined;
    }

    templates[
      templateKey
    ] =
      template;
  }

  if (
    Object.keys(
      templates,
    ).length ===
      0
  ) {
    return undefined;
  }

  return {
    authKey,
    integratedNumber,
    templates,
  };
}

/* ============================================================
   RESPONSE HELPERS
============================================================ */

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
  if (!isRecord(payload)) {
    return undefined;
  }

  const candidateKeys = [
    "requestId",
    "request_id",
    "messageId",
    "message_id",
    "id",
  ] as const;

  for (
    const key
    of candidateKeys
  ) {
    const value =
      normalizeNonEmptyString(
        payload[key],
      );

    if (value) {
      return value;
    }
  }

  const data =
    payload.data;

  if (!isRecord(data)) {
    return undefined;
  }

  for (
    const key
    of candidateKeys
  ) {
    const value =
      normalizeNonEmptyString(
        data[key],
      );

    if (value) {
      return value;
    }
  }

  return undefined;
}

function payloadExplicitlyRejects(
  payload:
    unknown,
): boolean {
  if (!isRecord(payload)) {
    return false;
  }

  if (
    payload.success ===
      false ||
    payload.hasError ===
      true
  ) {
    return true;
  }

  for (
    const key
    of [
      "type",
      "status",
    ] as const
  ) {
    const value =
      normalizeNonEmptyString(
        payload[key],
      )?.toLowerCase();

    if (
      value === "error" ||
      value === "failed" ||
      value === "failure"
    ) {
      return true;
    }
  }

  return false;
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
   * MSG91 WhatsApp template send has no documented FINORA-
   * compatible idempotent request guarantee.
   *
   * Ambiguous timeout/server failures therefore must not
   * trigger automatic resend and risk duplicate messages.
   */

  if (
    status === 408
  ) {
    return failure(
      false,
      "PROVIDER_DELIVERY_STATE_UNKNOWN",
      "WhatsApp provider timed out and delivery acceptance could not be confirmed.",
    );
  }

  if (
    status === 429
  ) {
    return failure(
      true,
      "PROVIDER_RATE_LIMITED",
      "WhatsApp provider temporarily rate limited the request.",
    );
  }

  if (
    status >= 500
  ) {
    return failure(
      false,
      "PROVIDER_DELIVERY_STATE_UNKNOWN",
      "WhatsApp provider failed before delivery acceptance could be confirmed.",
    );
  }

  if (
    status === 401 ||
    status === 403
  ) {
    return failure(
      false,
      "PROVIDER_AUTHORIZATION_FAILED",
      "WhatsApp provider authorization or integrated-number configuration was rejected.",
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
      "WhatsApp provider rejected the outbound template request.",
    );
  }

  return failure(
    false,
    "PROVIDER_REQUEST_FAILED",
    "WhatsApp provider rejected the outbound template request.",
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
   TEMPLATE RESOLUTION
============================================================ */

interface ResolvedMsg91WhatsappTemplate {
  name:
    string;

  languageCode:
    string;

  namespace:
    string;

  components:
    Record<
      string,
      {
        type:
          "text";

        value:
          string;
      }
    >;
}

function resolveMsg91WhatsappTemplate(
  request:
    FinoraNotificationProviderSendRequest,
  configuration:
    Msg91WhatsappConfiguration,
):
  | ResolvedMsg91WhatsappTemplate
  | FinoraNotificationProviderSendOutcome {
  const context =
    request.templateContext;

  if (!context) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_CONTEXT_MISSING",
      "Structured WhatsApp template context is required.",
    );
  }

  if (
    context.schemaVersion !==
      1
  ) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_CONTEXT_UNSUPPORTED",
      "WhatsApp template context schema is not supported.",
    );
  }

  const templateKey =
    context.templateKey.trim();

  if (!templateKey) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_KEY_INVALID",
      "WhatsApp template key is invalid.",
    );
  }

  const template =
    configuration.templates[
      templateKey
    ];

  if (!template) {
    return failure(
      false,
      "PROVIDER_TEMPLATE_NOT_CONFIGURED",
      "No approved WhatsApp provider template is configured for this FINORA template.",
    );
  }

  const components:
    ResolvedMsg91WhatsappTemplate["components"] = {};

  for (
    let index = 0;
    index <
      template.bodyVariables.length;
    index += 1
  ) {
    const variableName =
      template.bodyVariables[
        index
      ];

    const variableValue =
      context.variables[
        variableName
      ]?.trim();

    if (!variableValue) {
      return failure(
        false,
        "PROVIDER_TEMPLATE_VARIABLE_MISSING",
        "A required WhatsApp template variable is missing.",
      );
    }

    components[
      `body_${index + 1}`
    ] = {
      type:
        "text",

      value:
        variableValue,
    };
  }

  return {
    name:
      template.name,

    languageCode:
      template.languageCode,

    namespace:
      template.namespace,

    components,
  };
}

function isResolvedTemplate(
  value:
    ResolvedMsg91WhatsappTemplate |
    FinoraNotificationProviderSendOutcome,
): value is ResolvedMsg91WhatsappTemplate {
  return (
    "name" in value &&
    "languageCode" in value &&
    "namespace" in value &&
    "components" in value
  );
}

/* ============================================================
   PROVIDER
============================================================ */

export const msg91WhatsappNotificationProvider:
  FinoraNotificationProviderAdapter = {
  channel:
    "WHATSAPP",

  async isConfigured():
    Promise<boolean> {
    try {
      return Boolean(
        await loadMsg91WhatsappConfiguration(),
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
      "WHATSAPP"
    ) {
      return failure(
        false,
        "PROVIDER_CHANNEL_MISMATCH",
        "WhatsApp provider received a non-WhatsApp request.",
      );
    }

    const recipient =
      normalizeIndianMobileForMsg91(
        request.whatsappNumber,
      );

    if (!recipient) {
      return failure(
        false,
        "PROVIDER_RECIPIENT_INVALID",
        "A valid 10-digit Indian customer WhatsApp number is required.",
      );
    }

    const deliveryId =
      request.deliveryId.trim();

    if (!deliveryId) {
      return failure(
        false,
        "PROVIDER_CORRELATION_ID_INVALID",
        "The delivery identity is invalid for WhatsApp correlation.",
      );
    }

    const configuration =
      await loadMsg91WhatsappConfiguration();

    if (!configuration) {
      return failure(
        false,
        "CHANNEL_NOT_CONFIGURED",
        "WhatsApp provider is not configured.",
      );
    }

    const templateResult =
      resolveMsg91WhatsappTemplate(
        request,
        configuration,
      );

    if (
      !isResolvedTemplate(
        templateResult,
      )
    ) {
      return templateResult;
    }

    let response:
      Response;

    try {
      response =
        await fetch(
          MSG91_WHATSAPP_API_URL,
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
                integrated_number:
                  configuration.integratedNumber,

                content_type:
                  "template",

                /*
                 * Correlation only.
                 *
                 * MSG91 can echo CRQID in later webhook data.
                 * It is not treated as an idempotency guarantee.
                 */
                CRQID:
                  deliveryId,

                payload: {
                  messaging_product:
                    "whatsapp",

                  type:
                    "template",

                  template: {
                    name:
                      templateResult.name,

                    language: {
                      code:
                        templateResult.languageCode,

                      policy:
                        "deterministic",
                    },

                    namespace:
                      templateResult.namespace,

                    to_and_components: [
                      {
                        to: [
                          recipient,
                        ],

                        components:
                          templateResult.components,
                      },
                    ],
                  },
                },
              }),
          },
        );
    } catch {
      return failure(
        false,
        "PROVIDER_DELIVERY_STATE_UNKNOWN",
        "WhatsApp provider connection failed and delivery acceptance could not be confirmed.",
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

    if (
      payloadExplicitlyRejects(
        payload,
      )
    ) {
      return failure(
        false,
        "PROVIDER_REQUEST_REJECTED",
        "WhatsApp provider rejected the outbound template request.",
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