// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// PRIVILEGED NOTIFICATION PROVIDER REGISTRY
//
// RESPONSIBILITY:
//
// - Own the Electron main-process Notification provider registry.
// - Provide one explicit privileged registration boundary.
// - Keep provider implementations and credentials out of the
//   renderer process.
//
// SECURITY:
//
// - No renderer code may mutate this registry.
// - No provider credentials are exposed through this module.
// - Providers are registered only from privileged Electron code.
//
// IMPORTANT:
//
// - The production registry starts empty intentionally.
// - Missing providers mean channels are not configured.
// - No fake provider implementation belongs here.
// - No Notification persistence.
// - No retry scheduling.
// - No React.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraNotificationProviderAdapter,
  FinoraNotificationProviderChannel,
  FinoraNotificationProviderRegistry,
} from "./finoraNotificationProvider.types.js";

/* ============================================================
   REGISTRY
============================================================ */

const providers:
  FinoraNotificationProviderRegistry = {};

/* ============================================================
   REGISTER PROVIDER
============================================================ */

export function registerFinoraNotificationProvider(
  provider:
    FinoraNotificationProviderAdapter,
): void {
  const channel:
    FinoraNotificationProviderChannel =
    provider.channel;

  /*
   * One privileged provider owns one channel.
   *
   * Silent replacement could redirect outbound customer
   * messages at runtime, so duplicate registration fails closed.
   */

  if (providers[channel]) {
    throw new Error(
      `FINORA Notification provider for ${channel} is already registered.`,
    );
  }

  providers[channel] =
    provider;
}

/* ============================================================
   READ REGISTRY
============================================================ */

export function getFinoraNotificationProviderRegistry():
  FinoraNotificationProviderRegistry {
  /*
   * Return a shallow snapshot so callers cannot mutate the
   * privileged registry object itself.
   */

  return {
    ...providers,
  };
}

/* ============================================================
   END
============================================================ */