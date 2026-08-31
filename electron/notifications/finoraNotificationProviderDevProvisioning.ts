// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// DEVELOPMENT PROVIDER PROVISIONING
//
// RESPONSIBILITY:
//
// - Support trusted main-process Notification provider setup.
// - Provision MSG91 SMS configuration into the encrypted
//   Notification Provider Config Store.
// - Provision Resend Email configuration into the encrypted
//   Notification Provider Config Store.
// - Support explicit development removal of configured
//   development providers.
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - Explicit development flags are required.
// - API keys and auth keys are never logged.
// - Provider template / Flow identifiers are never logged.
// - No renderer IPC.
// - No plaintext credential persistence.
// - Provider settings are persisted only through safeStorage.
//
// IMPORTANT:
//
// - Development/runtime validation only.
// - Production provider setup will use the final trusted
//   FINORA administration/provisioning path.
// - Provider configuration is device-level privileged state.
//
// VERSION : 1.1
// STATUS  : Development Only
// ============================================================

import {
  findFinoraNotificationProviderConfiguration,
  removeFinoraNotificationProviderConfiguration,
  saveFinoraNotificationProviderConfiguration,
} from "./finoraNotificationProviderConfigStore.js";

import type {
  FinoraNotificationProviderStoredConfiguration,
} from "./finoraNotificationProviderConfigStore.js";

import {
  MSG91_SMS_PROVIDER_ID,
  MSG91_SMS_SETTING_AUTH_KEY,
  MSG91_SMS_SETTING_FLOW_ID_PREFIX,
  MSG91_SMS_SETTING_SENDER,
} from "./providers/msg91SmsNotificationProvider.js";

import {
  MSG91_WHATSAPP_PROVIDER_ID,
  MSG91_WHATSAPP_SETTING_AUTH_KEY,
  MSG91_WHATSAPP_SETTING_INTEGRATED_NUMBER,
  MSG91_WHATSAPP_SETTING_TEMPLATE_PREFIX,
} from "./providers/msg91WhatsappNotificationProvider.js";

import {
  RESEND_EMAIL_PROVIDER_ID,
  RESEND_EMAIL_SETTING_API_KEY,
  RESEND_EMAIL_SETTING_FROM,
} from "./providers/resendEmailNotificationProvider.js";

/* ============================================================
   ENVIRONMENT
============================================================ */

function requireEnvironmentValue(
  key:
    string,
): string {
  const value =
    process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required FINORA development environment variable: ${key}`,
    );
  }

  return value;
}

/* ============================================================
   STRING MAP ENVIRONMENT
============================================================ */

function requireEnvironmentStringMap(
  key:
    string,
): Record<string, string> {
  const raw =
    requireEnvironmentValue(
      key,
    );

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        raw,
      );
  } catch {
    throw new Error(
      `FINORA development environment variable ${key} must contain valid JSON.`,
    );
  }

  if (
    typeof parsed !==
      "object" ||
    parsed ===
      null ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      `FINORA development environment variable ${key} must contain a JSON object.`,
    );
  }

  const result:
    Record<string, string> = {};

  for (
    const [
      rawMapKey,
      rawMapValue,
    ] of Object.entries(
      parsed,
    )
  ) {
    const mapKey =
      rawMapKey.trim();

    if (
      !mapKey ||
      typeof rawMapValue !==
        "string"
    ) {
      throw new Error(
        `FINORA development environment variable ${key} contains an invalid mapping.`,
      );
    }

    const mapValue =
      rawMapValue.trim();

    if (!mapValue) {
      throw new Error(
        `FINORA development environment variable ${key} contains an empty mapping value.`,
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        result,
        mapKey,
      )
    ) {
      throw new Error(
        `FINORA development environment variable ${key} contains duplicate normalized mapping keys.`,
      );
    }

    result[
      mapKey
    ] =
      mapValue;
  }

  if (
    Object.keys(
      result,
    ).length ===
      0
  ) {
    throw new Error(
      `FINORA development environment variable ${key} must contain at least one mapping.`,
    );
  }

  return result;
}

/* ============================================================
   WHATSAPP TEMPLATE MAP ENVIRONMENT
============================================================ */

interface DevelopmentWhatsappTemplateMapping {
  name:
    string;

  languageCode:
    string;

  namespace:
    string;

  bodyVariables:
    string[];
}

function requireWhatsappTemplateMap(
  key:
    string,
): Record<
  string,
  DevelopmentWhatsappTemplateMapping
> {
  const raw =
    requireEnvironmentValue(
      key,
    );

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        raw,
      );
  } catch {
    throw new Error(
      `FINORA development environment variable ${key} must contain valid JSON.`,
    );
  }

  if (
    typeof parsed !==
      "object" ||
    parsed ===
      null ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      `FINORA development environment variable ${key} must contain a JSON object.`,
    );
  }

  const mappings:
    Record<
      string,
      DevelopmentWhatsappTemplateMapping
    > = {};

  for (
    const [
      rawTemplateKey,
      rawMapping,
    ] of Object.entries(
      parsed,
    )
  ) {
    const templateKey =
      rawTemplateKey.trim();

    if (
      !templateKey ||
      typeof rawMapping !==
        "object" ||
      rawMapping ===
        null ||
      Array.isArray(
        rawMapping,
      )
    ) {
      throw new Error(
        `FINORA development environment variable ${key} contains an invalid WhatsApp template mapping.`,
      );
    }

    const record =
      rawMapping as
        Record<string, unknown>;

    const name =
      typeof record.name ===
        "string"
        ? record.name.trim()
        : "";

    const languageCode =
      typeof record.languageCode ===
        "string"
        ? record.languageCode.trim()
        : "";

    const namespace =
      typeof record.namespace ===
        "string"
        ? record.namespace.trim()
        : "";

    if (
      !name ||
      !languageCode ||
      !namespace ||
      !Array.isArray(
        record.bodyVariables,
      )
    ) {
      throw new Error(
        `FINORA development environment variable ${key} contains incomplete WhatsApp template metadata.`,
      );
    }

    const bodyVariables:
      string[] = [];

    const seenVariables =
      new Set<string>();

    for (
      const rawVariable
      of record.bodyVariables
    ) {
      if (
        typeof rawVariable !==
          "string"
      ) {
        throw new Error(
          `FINORA development environment variable ${key} contains an invalid WhatsApp template variable.`,
        );
      }

      const variable =
        rawVariable.trim();

      if (
        !variable ||
        seenVariables.has(
          variable,
        )
      ) {
        throw new Error(
          `FINORA development environment variable ${key} contains an empty or duplicate WhatsApp template variable.`,
        );
      }

      seenVariables.add(
        variable,
      );

      bodyVariables.push(
        variable,
      );
    }

    mappings[
      templateKey
    ] = {
      name,
      languageCode,
      namespace,
      bodyVariables,
    };
  }

  if (
    Object.keys(
      mappings,
    ).length ===
      0
  ) {
    throw new Error(
      `FINORA development environment variable ${key} must contain at least one WhatsApp template mapping.`,
    );
  }

  return mappings;
}

/* ============================================================
   DEVELOPMENT PROVISIONING
============================================================ */

export async function runFinoraNotificationProviderDevelopmentProvisioning():
  Promise<void> {
  const shouldProvisionMsg91Sms =
    process.env.FINORA_DEV_PROVISION_MSG91_SMS ===
    "1";

  const shouldRemoveMsg91Sms =
    process.env.FINORA_DEV_REMOVE_MSG91_SMS ===
    "1";

  const shouldProvisionMsg91Whatsapp =
    process.env.FINORA_DEV_PROVISION_MSG91_WHATSAPP ===
    "1";

  const shouldRemoveMsg91Whatsapp =
    process.env.FINORA_DEV_REMOVE_MSG91_WHATSAPP ===
    "1";

  const shouldProvisionResendEmail =
    process.env.FINORA_DEV_PROVISION_RESEND_EMAIL ===
    "1";

  const shouldRemoveResendEmail =
    process.env.FINORA_DEV_REMOVE_RESEND_EMAIL ===
    "1";

  if (
    shouldProvisionMsg91Sms &&
    shouldRemoveMsg91Sms
  ) {
    throw new Error(
      "FINORA DEV MSG91 SMS provider cannot be provisioned and removed in the same startup.",
    );
  }

  if (
    shouldProvisionMsg91Whatsapp &&
    shouldRemoveMsg91Whatsapp
  ) {
    throw new Error(
      "FINORA DEV MSG91 WhatsApp provider cannot be provisioned and removed in the same startup.",
    );
  }

  if (
    shouldProvisionResendEmail &&
    shouldRemoveResendEmail
  ) {
    throw new Error(
      "FINORA DEV Resend Email provider cannot be provisioned and removed in the same startup.",
    );
  }

  if (
    !shouldProvisionMsg91Sms &&
    !shouldRemoveMsg91Sms &&
    !shouldProvisionMsg91Whatsapp &&
    !shouldRemoveMsg91Whatsapp &&
    !shouldProvisionResendEmail &&
    !shouldRemoveResendEmail
  ) {
    return;
  }

  /* ==========================================================
     MSG91 SMS PROVISIONING
  ========================================================== */

  if (shouldProvisionMsg91Sms) {
    const authKey =
      requireEnvironmentValue(
        "FINORA_DEV_MSG91_AUTH_KEY",
      );

    const sender =
      requireEnvironmentValue(
        "FINORA_DEV_MSG91_SMS_SENDER",
      );

    const flowIds =
      requireEnvironmentStringMap(
        "FINORA_DEV_MSG91_SMS_FLOW_MAP_JSON",
      );

    const existingResult =
      await findFinoraNotificationProviderConfiguration(
        "SMS",
      );

    if (!existingResult.success) {
      throw new Error(
        existingResult.error ??
          "Unable to load the existing FINORA SMS provider configuration.",
      );
    }

    const existing =
      existingResult.data;

    if (
      existing &&
      existing.providerId !==
        MSG91_SMS_PROVIDER_ID
    ) {
      throw new Error(
        "FINORA DEV SMS provider identity does not match MSG91. Remove the existing SMS provider explicitly before replacement.",
      );
    }

    const flowSettings:
      Record<string, string> = {};

    for (
      const [
        templateKey,
        flowId,
      ] of Object.entries(
        flowIds,
      )
    ) {
      flowSettings[
        `${MSG91_SMS_SETTING_FLOW_ID_PREFIX}${templateKey}`
      ] =
        flowId;
    }

    const now =
      new Date().toISOString();

    const configuration:
      FinoraNotificationProviderStoredConfiguration = {
      channel:
        "SMS",

      providerId:
        MSG91_SMS_PROVIDER_ID,

      settings: {
        [MSG91_SMS_SETTING_AUTH_KEY]:
          authKey,

        [MSG91_SMS_SETTING_SENDER]:
          sender,

        ...flowSettings,
      },

      createdAt:
        existing?.createdAt ??
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

    const saveResult =
      await saveFinoraNotificationProviderConfiguration(
        configuration,
      );

    if (!saveResult.success) {
      throw new Error(
        saveResult.error ??
          "FINORA development MSG91 SMS provider provisioning failed.",
      );
    }

    console.log(
      "[FINORA DEV] MSG91 SMS provider provisioning completed:",
      {
        channel:
          "SMS",

        providerId:
          MSG91_SMS_PROVIDER_ID,

        sender,

        flowCount:
          Object.keys(
            flowIds,
          ).length,
      },
    );
  }

  /* ==========================================================
     MSG91 SMS REMOVAL
  ========================================================== */

  if (shouldRemoveMsg91Sms) {
    const existingResult =
      await findFinoraNotificationProviderConfiguration(
        "SMS",
      );

    if (!existingResult.success) {
      throw new Error(
        existingResult.error ??
          "Unable to load the FINORA SMS provider configuration for removal.",
      );
    }

    if (
      existingResult.data &&
      existingResult.data.providerId !==
        MSG91_SMS_PROVIDER_ID
    ) {
      throw new Error(
        "FINORA DEV SMS provider identity does not match MSG91. Refusing to remove another provider.",
      );
    }

    const removeResult =
      await removeFinoraNotificationProviderConfiguration(
        "SMS",
      );

    if (!removeResult.success) {
      throw new Error(
        removeResult.error ??
          "FINORA development MSG91 SMS provider removal failed.",
      );
    }

    console.log(
      "[FINORA DEV] MSG91 SMS provider removal completed:",
      {
        channel:
          "SMS",

        providerId:
          MSG91_SMS_PROVIDER_ID,

        removed:
          removeResult.data ===
          true,
      },
    );
  }

  /* ==========================================================
     MSG91 WHATSAPP PROVISIONING
  ========================================================== */

  if (shouldProvisionMsg91Whatsapp) {
    const authKey =
      requireEnvironmentValue(
        "FINORA_DEV_MSG91_WHATSAPP_AUTH_KEY",
      );

    const integratedNumber =
      requireEnvironmentValue(
        "FINORA_DEV_MSG91_WHATSAPP_INTEGRATED_NUMBER",
      );

    const templates =
      requireWhatsappTemplateMap(
        "FINORA_DEV_MSG91_WHATSAPP_TEMPLATE_MAP_JSON",
      );

    const existingResult =
      await findFinoraNotificationProviderConfiguration(
        "WHATSAPP",
      );

    if (!existingResult.success) {
      throw new Error(
        existingResult.error ??
          "Unable to load the existing FINORA WhatsApp provider configuration.",
      );
    }

    const existing =
      existingResult.data;

    if (
      existing &&
      existing.providerId !==
        MSG91_WHATSAPP_PROVIDER_ID
    ) {
      throw new Error(
        "FINORA DEV WhatsApp provider identity does not match MSG91. Remove the existing WhatsApp provider explicitly before replacement.",
      );
    }

    const templateSettings:
      Record<string, string> = {};

    for (
      const [
        templateKey,
        mapping,
      ] of Object.entries(
        templates,
      )
    ) {
      templateSettings[
        `${MSG91_WHATSAPP_SETTING_TEMPLATE_PREFIX}${templateKey}`
      ] =
        JSON.stringify(
          mapping,
        );
    }

    const now =
      new Date().toISOString();

    const configuration:
      FinoraNotificationProviderStoredConfiguration = {
      channel:
        "WHATSAPP",

      providerId:
        MSG91_WHATSAPP_PROVIDER_ID,

      settings: {
        [MSG91_WHATSAPP_SETTING_AUTH_KEY]:
          authKey,

        [MSG91_WHATSAPP_SETTING_INTEGRATED_NUMBER]:
          integratedNumber,

        ...templateSettings,
      },

      createdAt:
        existing?.createdAt ??
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

    const saveResult =
      await saveFinoraNotificationProviderConfiguration(
        configuration,
      );

    if (!saveResult.success) {
      throw new Error(
        saveResult.error ??
          "FINORA development MSG91 WhatsApp provider provisioning failed.",
      );
    }

    console.log(
      "[FINORA DEV] MSG91 WhatsApp provider provisioning completed:",
      {
        channel:
          "WHATSAPP",

        providerId:
          MSG91_WHATSAPP_PROVIDER_ID,

        templateCount:
          Object.keys(
            templates,
          ).length,
      },
    );
  }

  /* ==========================================================
     MSG91 WHATSAPP REMOVAL
  ========================================================== */

  if (shouldRemoveMsg91Whatsapp) {
    const existingResult =
      await findFinoraNotificationProviderConfiguration(
        "WHATSAPP",
      );

    if (!existingResult.success) {
      throw new Error(
        existingResult.error ??
          "Unable to load the FINORA WhatsApp provider configuration for removal.",
      );
    }

    if (
      existingResult.data &&
      existingResult.data.providerId !==
        MSG91_WHATSAPP_PROVIDER_ID
    ) {
      throw new Error(
        "FINORA DEV WhatsApp provider identity does not match MSG91. Refusing to remove another provider.",
      );
    }

    const removeResult =
      await removeFinoraNotificationProviderConfiguration(
        "WHATSAPP",
      );

    if (!removeResult.success) {
      throw new Error(
        removeResult.error ??
          "FINORA development MSG91 WhatsApp provider removal failed.",
      );
    }

    console.log(
      "[FINORA DEV] MSG91 WhatsApp provider removal completed:",
      {
        channel:
          "WHATSAPP",

        providerId:
          MSG91_WHATSAPP_PROVIDER_ID,

        removed:
          removeResult.data ===
          true,
      },
    );
  }

  /* ==========================================================
     RESEND EMAIL PROVISIONING
  ========================================================== */

  if (shouldProvisionResendEmail) {
    const apiKey =
      requireEnvironmentValue(
        "FINORA_DEV_RESEND_API_KEY",
      );

    const from =
      requireEnvironmentValue(
        "FINORA_DEV_RESEND_FROM",
      );

    const existingResult =
      await findFinoraNotificationProviderConfiguration(
        "EMAIL",
      );

    if (!existingResult.success) {
      throw new Error(
        existingResult.error ??
          "Unable to load the existing FINORA Email provider configuration.",
      );
    }

    const existing =
      existingResult.data;

    if (
      existing &&
      existing.providerId !==
        RESEND_EMAIL_PROVIDER_ID
    ) {
      throw new Error(
        "FINORA DEV Email provider identity does not match Resend. Remove the existing Email provider explicitly before replacement.",
      );
    }

    const now =
      new Date().toISOString();

    const configuration:
      FinoraNotificationProviderStoredConfiguration = {
      channel:
        "EMAIL",

      providerId:
        RESEND_EMAIL_PROVIDER_ID,

      settings: {
        [RESEND_EMAIL_SETTING_API_KEY]:
          apiKey,

        [RESEND_EMAIL_SETTING_FROM]:
          from,
      },

      createdAt:
        existing?.createdAt ??
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

    const saveResult =
      await saveFinoraNotificationProviderConfiguration(
        configuration,
      );

    if (!saveResult.success) {
      throw new Error(
        saveResult.error ??
          "FINORA development Resend Email provider provisioning failed.",
      );
    }

    console.log(
      "[FINORA DEV] Resend Email provider provisioning completed:",
      {
        channel:
          "EMAIL",

        providerId:
          RESEND_EMAIL_PROVIDER_ID,

        from,
      },
    );
  }

  /* ==========================================================
     RESEND EMAIL REMOVAL
  ========================================================== */

  if (shouldRemoveResendEmail) {
    const existingResult =
      await findFinoraNotificationProviderConfiguration(
        "EMAIL",
      );

    if (!existingResult.success) {
      throw new Error(
        existingResult.error ??
          "Unable to load the FINORA Email provider configuration for removal.",
      );
    }

    if (
      existingResult.data &&
      existingResult.data.providerId !==
        RESEND_EMAIL_PROVIDER_ID
    ) {
      throw new Error(
        "FINORA DEV Email provider identity does not match Resend. Refusing to remove another provider.",
      );
    }

    const removeResult =
      await removeFinoraNotificationProviderConfiguration(
        "EMAIL",
      );

    if (!removeResult.success) {
      throw new Error(
        removeResult.error ??
          "FINORA development Resend Email provider removal failed.",
      );
    }

    console.log(
      "[FINORA DEV] Resend Email provider removal completed:",
      {
        channel:
          "EMAIL",

        providerId:
          RESEND_EMAIL_PROVIDER_ID,

        removed:
          removeResult.data ===
          true,
      },
    );
  }
}

/* ============================================================
   END
============================================================ */