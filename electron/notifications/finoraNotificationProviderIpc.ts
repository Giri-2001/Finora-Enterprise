// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// PRIVILEGED NOTIFICATION PROVIDER IPC
//
// RESPONSIBILITY:
//
// - Expose a narrow trusted-renderer Notification provider IPC.
// - Validate all renderer-owned request payloads.
// - Resolve privileged SMS / WhatsApp / Email adapters.
// - Keep provider credentials inside the Electron main process.
// - Normalize unexpected provider boundary failures.
//
// SECURITY:
//
// - Every request must originate from a trusted renderer.
// - Renderer cannot provide provider credentials.
// - Renderer cannot select arbitrary executable/provider code.
// - Provider configuration details are never returned.
// - Invalid payloads fail closed.
//
// IMPORTANT:
//
// - No React.
// - No renderer storage.
// - No Notification persistence.
// - No retry scheduling.
// - No Loan rules.
// - No scheduler clock rules.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  ipcMain,
} from "electron";

import type {
  FinoraNotificationProviderChannel,
  FinoraNotificationProviderRegistry,
  FinoraNotificationProviderSendOutcome,
  FinoraNotificationProviderSendRequest,
} from "./finoraNotificationProvider.types.js";

/* ============================================================
   IPC CHANNELS
============================================================ */

const NOTIFICATION_PROVIDER_IPC_CHANNELS = {
  IS_CONFIGURED:
    "finora:notifications:is-configured",

  SEND:
    "finora:notifications:send",
} as const;

/* ============================================================
   TRUST VALIDATOR
============================================================ */

export type FinoraNotificationRendererValidator = (
  senderFrame:
    Electron.WebFrameMain | null,
) => boolean;

/* ============================================================
   REQUEST TYPES
============================================================ */

interface NotificationProviderConfigurationRequest {
  channel:
    FinoraNotificationProviderChannel;
}

/* ============================================================
   RESULT HELPERS
============================================================ */

function success<T>(
  data: T,
) {
  return {
    success: true as const,
    data,
  };
}

function failure(
  error: string,
) {
  return {
    success: false as const,
    error,
  };
}

/* ============================================================
   BASIC VALIDATION
============================================================ */

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isOptionalNonEmptyString(
  value: unknown,
): value is string | undefined {
  return (
    value === undefined ||
    isNonEmptyString(value)
  );
}

function isChannel(
  value: unknown,
): value is FinoraNotificationProviderChannel {
  return (
    value === "SMS" ||
    value === "WHATSAPP" ||
    value === "EMAIL"
  );
}

/* ============================================================
   CONFIGURATION REQUEST VALIDATION
============================================================ */

function isConfigurationRequest(
  value: unknown,
): value is NotificationProviderConfigurationRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return isChannel(
    request.channel,
  );
}

/* ============================================================
   SEND REQUEST VALIDATION
============================================================ */

function isSendRequest(
  value: unknown,
): value is FinoraNotificationProviderSendRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  if (
    !isNonEmptyString(request.notificationId) ||
    !isNonEmptyString(request.deliveryId) ||
    !isChannel(request.channel) ||
    !isNonEmptyString(request.title) ||
    !isNonEmptyString(request.message) ||
    !isNonEmptyString(request.customerId) ||
    !isOptionalNonEmptyString(request.customerName) ||
    !isOptionalNonEmptyString(request.phoneNumber) ||
    !isOptionalNonEmptyString(request.whatsappNumber) ||
    !isOptionalNonEmptyString(request.emailAddress)
  ) {
    return false;
  }

  if (
    request.channel === "SMS" &&
    !isNonEmptyString(request.phoneNumber)
  ) {
    return false;
  }

  if (
    request.channel === "WHATSAPP" &&
    !isNonEmptyString(request.whatsappNumber)
  ) {
    return false;
  }

  if (
    request.channel === "EMAIL" &&
    !isNonEmptyString(request.emailAddress)
  ) {
    return false;
  }

  return true;
}

/* ============================================================
   PROVIDER OUTCOME VALIDATION
============================================================ */

function isValidTimestamp(
  value: string,
): boolean {
  return Number.isFinite(
    Date.parse(value),
  );
}

function isProviderOutcome(
  value: unknown,
): value is FinoraNotificationProviderSendOutcome {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const outcome =
    value as Record<string, unknown>;

  if (outcome.success === true) {
    return (
      isNonEmptyString(outcome.acceptedAt) &&
      isValidTimestamp(outcome.acceptedAt) &&
      isOptionalNonEmptyString(
        outcome.providerMessageId,
      )
    );
  }

  if (outcome.success === false) {
    return (
      typeof outcome.retryable === "boolean" &&
      isNonEmptyString(outcome.failureCode) &&
      isNonEmptyString(outcome.failureMessage)
    );
  }

  return false;
}

/* ============================================================
   REGISTRATION GUARD
============================================================ */

let notificationProviderHandlersRegistered =
  false;

/* ============================================================
   REGISTER NOTIFICATION PROVIDER IPC HANDLERS
============================================================ */

export function registerFinoraNotificationProviderHandlers(
  isTrustedRenderer:
    FinoraNotificationRendererValidator,

  providers:
    FinoraNotificationProviderRegistry,
): void {
  if (notificationProviderHandlersRegistered) {
    return;
  }

  notificationProviderHandlersRegistered =
    true;

  // ----------------------------------------------------------
  // CONFIGURATION CHECK
  // ----------------------------------------------------------

  ipcMain.handle(
    NOTIFICATION_PROVIDER_IPC_CHANNELS.IS_CONFIGURED,

    async (
      event,
      request: unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      if (
        !isConfigurationRequest(
          request,
        )
      ) {
        return failure(
          "Invalid Notification provider configuration request.",
        );
      }

      const provider =
        providers[request.channel];

      /*
       * Missing provider means the channel is simply not
       * configured on this FINORA installation.
       *
       * No provider configuration details are exposed.
       */

      if (!provider) {
        return success(false);
      }

      if (
        provider.channel !==
        request.channel
      ) {
        return failure(
          "Notification provider channel mismatch.",
        );
      }

      try {
        const configured =
          await provider.isConfigured();

        return success(
          configured === true,
        );
      } catch (error) {
        return failure(
          error instanceof Error
            ? error.message
            : "Unable to verify Notification provider configuration.",
        );
      }
    },
  );

  // ----------------------------------------------------------
  // SEND
  // ----------------------------------------------------------

  ipcMain.handle(
    NOTIFICATION_PROVIDER_IPC_CHANNELS.SEND,

    async (
      event,
      request: unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      if (
        !isSendRequest(
          request,
        )
      ) {
        return failure(
          "Invalid Notification provider send request.",
        );
      }

      const provider =
        providers[request.channel];

      if (!provider) {
        return success<
          FinoraNotificationProviderSendOutcome
        >({
          success: false,

          retryable: false,

          failureCode:
            "CHANNEL_ADAPTER_MISSING",

          failureMessage:
            `No ${request.channel} Notification provider is registered.`,
        });
      }

      if (
        provider.channel !==
        request.channel
      ) {
        return success<
          FinoraNotificationProviderSendOutcome
        >({
          success: false,

          retryable: false,

          failureCode:
            "CHANNEL_ADAPTER_MISMATCH",

          failureMessage:
            "Notification provider does not match the requested channel.",
        });
      }

      /*
       * Re-check privileged configuration immediately before
       * provider execution.
       */

      try {
        const configured =
          await provider.isConfigured();

        if (!configured) {
          return success<
            FinoraNotificationProviderSendOutcome
          >({
            success: false,

            retryable: false,

            failureCode:
              "CHANNEL_NOT_CONFIGURED",

            failureMessage:
              `${request.channel} Notification provider is not configured.`,
          });
        }
      } catch (error) {
        /*
         * Configuration re-check exceptions at the SEND boundary
         * are transient provider-boundary failures, not a normal
         * "not configured" outcome.
         *
         * Reject the IPC invocation so the renderer adapter
         * rethrows and NotificationDeliveryService persists
         * PROVIDER_EXCEPTION with configured retry scheduling.
         *
         * Do not expose provider-owned exception details.
         */

        console.error(
          "FINORA privileged Notification provider configuration check failed before send:",
          error,
        );

        throw new Error(
          "Notification provider configuration check failed unexpectedly.",
        );
      }

      try {
        const outcome =
          await provider.send(
            request,
          );

        /*
         * Never forward malformed or fabricated-looking
         * provider output as a valid delivery outcome.
         */

        if (
          !isProviderOutcome(
            outcome,
          )
        ) {
          return failure(
            "Notification provider returned an invalid delivery outcome.",
          );
        }

        return success(
          outcome,
        );
      } catch (error) {
        /*
         * Provider execution exceptions must reject the IPC
         * invocation rather than become a normal bridge result.
         *
         * The renderer Electron Notification adapter rethrows
         * the rejected invocation. NotificationDeliveryService
         * then persists PROVIDER_EXCEPTION and applies the
         * configured provider-exception retry policy.
         *
         * Do not forward provider-owned exception details across
         * the privileged boundary.
         */

        console.error(
          "FINORA privileged Notification provider execution failed:",
          error,
        );

        throw new Error(
          "Notification provider failed unexpectedly.",
        );
      }
    },
  );
}

/* ============================================================
   END
============================================================ */